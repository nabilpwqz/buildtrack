import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { apiUnauthorized, apiForbidden } from "@/lib/api-response";
import { logActivity } from "@/lib/audit";
import { SessionUser } from "@/types";
import { getAdminDatabaseOverview, sanitizeDatabaseError } from "@/lib/admin-database";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  if (!user) {
    return apiUnauthorized("Administrator authentication required for live realtime stream.");
  }

  if (user.role !== "ADMIN") {
    await logActivity({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "UNAUTHORIZED_ATTEMPT",
      entity: "DatabaseStream",
      entityId: "ADMIN_SSE_STREAM",
      meta: { reason: "Non-admin attempted to connect to ADMIN realtime SSE stream" },
    });
    return apiForbidden("Access denied: Realtime database stream is strictly restricted to ADMIN.");
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let lastSignature = "";

      const sendEvent = (event: string, payload: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`)
          );
        } catch {
          closed = true;
        }
      };

      const pushSnapshot = async (force = false) => {
        if (closed) return;
        try {
          const overview = await getAdminDatabaseOverview();
          const latestActivityId = overview.liveStreams.recentActivity[0]?.id || "";
          const signature = `${overview.totalRecords}:${latestActivityId}:${overview.tables
            .map((t) => `${t.key}=${t.rowCount}`)
            .join(",")}`;

          if (force || signature !== lastSignature) {
            lastSignature = signature;
            sendEvent(force ? "snapshot" : "update", overview);
          } else {
            sendEvent("heartbeat", {
              serverTimestamp: overview.serverTimestamp,
              latencyMs: overview.latencyMs,
              totalRecords: overview.totalRecords,
            });
          }
        } catch (err: any) {
          sendEvent("error", { message: sanitizeDatabaseError(err) });
        }
      };

      await pushSnapshot(true);

      const interval = setInterval(() => {
        pushSnapshot(false);
      }, 2500);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}


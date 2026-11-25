import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { apiSuccess, apiUnauthorized, apiForbidden, apiError } from "@/lib/api-response";
import { logActivity } from "@/lib/audit";
import { SessionUser } from "@/types";
import { executeAdminReadOnlyQuery, sanitizeDatabaseError } from "@/lib/admin-database";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  sql: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  if (!user) {
    return apiUnauthorized("Administrator authentication required to execute SQL diagnostics.");
  }

  if (user.role !== "ADMIN") {
    await logActivity({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "UNAUTHORIZED_ATTEMPT",
      entity: "DatabaseQuery",
      entityId: "ADMIN_SQL_CONSOLE",
      meta: { reason: "Non-admin attempted to execute read-only SQL query" },
    });
    return apiForbidden("Access denied: Live SQL console is strictly restricted to ADMIN.");
  }

  try {
    const body = await req.json();
    const parsed = querySchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid SQL query payload", parsed.error.format(), 400);
    }

    const result = await executeAdminReadOnlyQuery(parsed.data.sql);
    return apiSuccess(result);
  } catch (err: any) {
    return apiError("SQL_QUERY_ERROR", sanitizeDatabaseError(err), null, 400);
  }
}


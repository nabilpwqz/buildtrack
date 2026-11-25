import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { apiSuccess, apiUnauthorized, apiForbidden, apiError } from "@/lib/api-response";
import { logActivity } from "@/lib/audit";
import { SessionUser } from "@/types";
import { getAdminDatabaseOverview, getAdminTableRecords, sanitizeDatabaseError } from "@/lib/admin-database";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  if (!user) {
    return apiUnauthorized("Administrator authentication required to access live database telemetry.");
  }

  if (user.role !== "ADMIN") {
    await logActivity({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "UNAUTHORIZED_ATTEMPT",
      entity: "Database",
      entityId: "ADMIN_DB_CONSOLE",
      meta: { reason: "Non-admin attempted to query live database telemetry" },
    });
    return apiForbidden("Access denied: Live database telemetry is strictly restricted to ADMIN.");
  }

  try {
    const { searchParams } = new URL(req.url);
    const table = searchParams.get("table");
    const page = parseInt(searchParams.get("page") || "0", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "25", 10);
    const q = searchParams.get("q") || "";

    const overview = await getAdminDatabaseOverview();

    if (table && table !== "overview") {
      const tableData = await getAdminTableRecords(table, page, pageSize, q);
      return apiSuccess({
        ...overview,
        activeTable: tableData,
      });
    }

    return apiSuccess(overview);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", sanitizeDatabaseError(err), null, 500);
  }
}


import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { apiSuccess, apiUnauthorized, apiForbidden, apiError } from "@/lib/api-response";
import { logActivity } from "@/lib/audit";
import { SessionUser } from "@/types";
import { ensureRealisticDemoData } from "@/lib/demo-seed";
import { getAdminDatabaseOverview, sanitizeDatabaseError } from "@/lib/admin-database";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  if (!user) {
    return apiUnauthorized("Administrator authentication required to seed demo data.");
  }

  if (user.role !== "ADMIN") {
    await logActivity({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "UNAUTHORIZED_ATTEMPT",
      entity: "DatabaseSeed",
      entityId: "ADMIN_SEED",
      meta: { reason: "Non-admin attempted to trigger demo data seed" },
    });
    return apiForbidden("Access denied: Only ADMIN can seed realistic demo data.");
  }

  try {
    const result = await ensureRealisticDemoData({
      forceAddSampleProject: true,
      actorId: user.id,
      actorName: user.name,
    });
    const overview = await getAdminDatabaseOverview();

    return apiSuccess(
      {
        message: "Realistic civil construction project and telemetry seeded into PostgreSQL.",
        ...result,
        overview,
      },
      201
    );
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", sanitizeDatabaseError(err), null, 500);
  }
}


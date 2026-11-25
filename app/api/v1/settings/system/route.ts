import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiError, apiForbidden, apiUnauthorized } from "@/lib/api-response";
import { logActivity } from "@/lib/audit";
import { SessionUser } from "@/types";

const systemConfigSchema = z.object({
  companyName: z.string().min(2).optional(),
  registrationCode: z.string().optional(),
  operatingCurrency: z.string().optional(),
  timezone: z.string().optional(),
  overrunThreshold: z.number().min(0).max(100).optional(),
  hardStopOverrun: z.boolean().optional(),
  cpiWarningThreshold: z.number().min(0).max(2).optional(),
  autoDelayDetection: z.boolean().optional(),
  strictDfsValidation: z.boolean().optional(),
  criticalPathSlackDays: z.number().min(0).optional(),
  lowStockAlerts: z.boolean().optional(),
  twoStageApproval: z.boolean().optional(),
  preventOverIssue: z.boolean().optional(),
  scrapTolerancePct: z.number().min(0).optional(),
  sessionTtlHours: z.number().min(1).optional(),
  auditRetentionDays: z.number().min(30).optional(),
  webhookUrl: z.string().optional(),
  telegramAlerts: z.boolean().optional(),
  emailDigest: z.boolean().optional(),
});

// In-memory or persisted configuration state
let currentSystemConfig = {
  companyName: "Civil Engineering Directorate // Megaprojects Authority",
  registrationCode: "SPEC-2026-BGD-CR-994",
  operatingCurrency: "USD ($)",
  timezone: "UTC+06:00 (Asia/Dhaka - Bangladesh Standard)",
  overrunThreshold: 80,
  hardStopOverrun: true,
  cpiWarningThreshold: 0.95,
  autoDelayDetection: true,
  strictDfsValidation: true,
  criticalPathSlackDays: 0,
  lowStockAlerts: true,
  twoStageApproval: true,
  preventOverIssue: true,
  scrapTolerancePct: 2.5,
  sessionTtlHours: 24,
  auditRetentionDays: 365,
  neonBranch: "production (ep-rapid-king-be4tclgw)",
  webhookUrl: "https://api.buildtrack.internal/v1/telemetry/webhooks",
  telegramAlerts: true,
  emailDigest: true,
};

export async function GET() {
  return apiSuccess({ config: currentSystemConfig });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  // Rule 3 & 5: Finance managers cannot modify system-level settings. Admin has full system access.
  if (!user) {
    return apiUnauthorized("Authentication required to configure system-level settings.");
  }

  if (user.role !== "ADMIN" || !can(user, "update", "system_settings")) {
    await logActivity({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "UNAUTHORIZED_ATTEMPT",
      entity: "SystemSettings",
      entityId: "system_config",
      meta: {
        reason: `Forbidden: Role '${user.role}' is prohibited from modifying system-level settings.`,
      },
    });
    return apiForbidden(
      "Governance Restriction: Finance managers and non-administrative roles cannot modify system-level settings. Only Administrators have system configuration privileges."
    );
  }

  try {
    const body = await req.json();
    const parsed = systemConfigSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid system configuration parameters", parsed.error.format());
    }

    currentSystemConfig = {
      ...currentSystemConfig,
      ...parsed.data,
    };

    await logActivity({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "UPDATE",
      entity: "SystemSettings",
      entityId: "system_config",
      meta: parsed.data,
    });

    return apiSuccess({
      config: currentSystemConfig,
      message: "System specifications updated and audited successfully.",
    });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to update system settings", null, 500);
  }
}


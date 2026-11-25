import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiError, apiForbidden, apiNotFound } from "@/lib/api-response";
import { logActivity } from "@/lib/audit";
import { SessionUser } from "@/types";

const performanceSchema = z.object({
  projectId: z.string(),
  onTimeRate: z.number().min(0).max(100),
  qualityScore: z.number().min(1).max(5),
  delayIncidents: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  const { id } = await params;

  if (user && !can(user, "read", "contractor")) {
    return apiForbidden();
  }

  const contractor = await prisma.contractor.findUnique({
    where: { id },
    include: {
      performances: {
        orderBy: { evaluatedAt: "desc" },
      },
    },
  });

  if (!contractor) return apiNotFound("Contractor");

  return apiSuccess({ performances: contractor.performances });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  const { id } = await params;

  if (!user) {
    return apiForbidden("Unauthorized: Authentication required to log performance reviews.");
  }

  // Only ADMIN and PROJECT_MANAGER can log performance reviews
  if (user.role !== "ADMIN" && user.role !== "PROJECT_MANAGER") {
    return apiForbidden("Access Denied: Only Administrators and Project Managers can track contractor performance.");
  }

  const contractor = await prisma.contractor.findUnique({ where: { id } });
  if (!contractor) return apiNotFound("Contractor");

  try {
    const body = await req.json();
    const parsed = performanceSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid performance evaluation data", parsed.error.format());
    }

    const { projectId, onTimeRate, qualityScore, delayIncidents, notes } = parsed.data;

    // Validate project
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return apiNotFound("Referenced project does not exist.");

    const performance = await prisma.contractorPerformance.create({
      data: {
        contractorId: id,
        projectId,
        onTimeRate,
        qualityScore,
        delayIncidents,
        notes,
      },
    });

    // Update contractor aggregate rating
    const allPerfs = await prisma.contractorPerformance.findMany({
      where: { contractorId: id },
      select: { qualityScore: true },
    });
    const avgScore = allPerfs.reduce((sum, p) => sum + p.qualityScore, 0) / allPerfs.length;
    const roundedRating = Math.round(avgScore * 10) / 10;

    await prisma.contractor.update({
      where: { id },
      data: { rating: roundedRating },
    });

    await logActivity({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "UPDATE",
      entity: "ContractorPerformance",
      entityId: performance.id,
      meta: { contractorId: id, onTimeRate, qualityScore, delayIncidents },
    });

    return apiSuccess({ performance, rating: roundedRating, message: "Performance evaluation logged successfully" }, 201);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to record evaluation", null, 500);
  }
}


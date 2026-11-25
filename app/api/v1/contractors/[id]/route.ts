import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiError, apiForbidden, apiNotFound } from "@/lib/api-response";
import { logActivity } from "@/lib/audit";
import { SessionUser } from "@/types";

const contractorUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  company: z.string().min(2).optional(),
  contact: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(5).optional(),
  specialty: z.string().min(2).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "INACTIVE"]).optional(),
  rating: z.number().min(1).max(5).optional(),
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

  // Rule 1: Contractor can only access their assigned entity
  if (user?.role === "CONTRACTOR" && user.contractorId && user.contractorId !== id) {
    return apiForbidden("Contractors can only access their own firm profile.");
  }

  const contractor = await prisma.contractor.findUnique({
    where: { id },
    include: {
      projectAssignments: {
        include: {
          project: {
            select: {
              id: true,
              name: true,
              status: true,
              location: true,
              totalBudget: true,
              progress: true,
              startDate: true,
              expectedEndDate: true,
            },
          },
        },
      },
      performances: {
        orderBy: { evaluatedAt: "desc" },
      },
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      },
    },
  });

  if (!contractor) return apiNotFound("Contractor");

  // Query assigned tasks for contractor's users and assigned projects
  const contractorUserIds = contractor.users.map((u) => u.id);
  const assignedProjectIds = contractor.projectAssignments.map((pa) => pa.projectId);

  const assignedTasks = await prisma.task.findMany({
    where: {
      isDeleted: false,
      OR: [
        { assigneeId: { in: contractorUserIds } },
        {
          projectId: { in: assignedProjectIds },
          assignee: { role: "CONTRACTOR" },
        },
      ],
    },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, role: true } },
      dependencies: { include: { dependsOn: { select: { id: true, title: true, status: true } } } },
    },
    orderBy: { deadline: "asc" },
  });

  // Calculate reliability telemetry & work history
  let avgOnTime = 95;
  let totalDelays = 0;
  let avgQuality = contractor.rating;

  if (contractor.performances.length > 0) {
    avgOnTime = Math.round(
      contractor.performances.reduce((acc, p) => acc + p.onTimeRate, 0) /
        contractor.performances.length
    );
    totalDelays = contractor.performances.reduce((acc, p) => acc + p.delayIncidents, 0);
    avgQuality =
      Math.round(
        (contractor.performances.reduce((acc, p) => acc + p.qualityScore, 0) /
          contractor.performances.length) *
          10
      ) / 10;
  }

  const reliabilityScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (contractor.rating / 5) * 40 +
          avgOnTime * 0.4 +
          Math.max(0, 20 - totalDelays * 5)
      )
    )
  );

  const workHistory = {
    totalProjectsAssigned: contractor.projectAssignments.length,
    activeProjectsCount: contractor.projectAssignments.filter((pa) => pa.project.status === "IN_PROGRESS").length,
    completedProjectsCount: contractor.projectAssignments.filter((pa) => pa.project.status === "COMPLETED").length,
    totalTasksAssigned: assignedTasks.length,
    completedTasksCount: assignedTasks.filter((t) => t.status === "COMPLETED").length,
    evaluationsCount: contractor.performances.length,
  };

  return apiSuccess({
    contractor: {
      ...contractor,
      avgOnTime,
      totalDelays,
      avgQuality,
      reliabilityScore,
      assignedTasks,
      workHistory,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  const { id } = await params;

  if (!user) {
    return apiForbidden("Unauthorized: Authentication required to manage contractors.");
  }

  // Only ADMIN and PROJECT_MANAGER can manage contractors
  if (user.role !== "ADMIN" && user.role !== "PROJECT_MANAGER") {
    return apiForbidden("Access Denied: Only Administrators and Project Managers can update contractor profiles and status.");
  }

  const existing = await prisma.contractor.findUnique({ where: { id } });
  if (!existing) return apiNotFound("Contractor");

  try {
    const body = await req.json();
    const parsed = contractorUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid contractor update payload", parsed.error.format());
    }

    const updated = await prisma.contractor.update({
      where: { id },
      data: parsed.data,
      include: {
        projectAssignments: { include: { project: true } },
      },
    });

    await logActivity({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "UPDATE",
      entity: "Contractor",
      entityId: id,
      meta: parsed.data,
    });

    return apiSuccess({ contractor: updated, message: "Contractor profile and status updated successfully" });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to update contractor", null, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  const { id } = await params;

  if (!user) {
    return apiForbidden("Unauthorized: Authentication required to manage contractors.");
  }

  if (user.role !== "ADMIN" && user.role !== "PROJECT_MANAGER") {
    return apiForbidden("Access Denied: Only Administrators and Project Managers can delete contractors.");
  }

  const existing = await prisma.contractor.findUnique({ where: { id } });
  if (!existing) return apiNotFound("Contractor");

  try {
    await prisma.contractor.delete({ where: { id } });

    await logActivity({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "DELETE",
      entity: "Contractor",
      entityId: id,
      meta: { company: existing.company, name: existing.name },
    });

    return apiSuccess({ message: "Contractor profile removed successfully" });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to delete contractor", null, 500);
  }
}


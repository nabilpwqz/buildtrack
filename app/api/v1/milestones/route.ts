import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiError, apiForbidden, apiNotFound } from "@/lib/api-response";
import { logActivity, createNotification } from "@/lib/audit";
import { SessionUser } from "@/types";

const milestoneCreateSchema = z.object({
  projectId: z.string(),
  title: z.string().min(3),
  description: z.string().optional(),
  targetDate: z.string(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional().default("PENDING"),
  order: z.number().int().min(0).optional().default(0),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  // Reading milestones is permitted for authenticated users
  if (user && !can(user, "read", "project")) {
    return apiForbidden();
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || undefined;
  const status = searchParams.get("status") || undefined;

  const where: any = {};
  if (projectId && projectId !== "ALL") where.projectId = projectId;
  if (status && status !== "ALL") where.status = status;

  // Contractor restriction: only their assigned projects
  if (user?.role === "CONTRACTOR") {
    const contractorId =
      user.contractorId ||
      (
        await prisma.user.findUnique({
          where: { id: user.id },
          select: { contractorId: true },
        })
      )?.contractorId;

    where.project = {
      contractors: {
        some: { contractorId: contractorId || "none" },
      },
    };
  }

  const milestones = await prisma.milestone.findMany({
    where,
    include: {
      project: {
        select: {
          id: true,
          name: true,
          status: true,
          progress: true,
          expectedEndDate: true,
        },
      },
    },
    orderBy: [{ projectId: "asc" }, { order: "asc" }, { targetDate: "asc" }],
  });

  const total = milestones.length;
  const completed = milestones.filter((m) => m.status === "COMPLETED").length;
  const inProgress = milestones.filter((m) => m.status === "IN_PROGRESS").length;
  const pending = milestones.filter((m) => m.status === "PENDING").length;

  return apiSuccess({
    milestones,
    metrics: {
      total,
      completed,
      inProgress,
      pending,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  if (!user) {
    return apiForbidden("Unauthorized: Authentication required.");
  }

  // Only Admin and Project Manager can manage milestones
  if (user.role !== "ADMIN" && user.role !== "PROJECT_MANAGER") {
    return apiForbidden("Access Denied: Only Administrators and Project Managers can manage milestones.");
  }

  try {
    const body = await req.json();
    const parsed = milestoneCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid milestone data", parsed.error.format());
    }

    const { projectId, title, description, targetDate, status, order } = parsed.data;

    // Check project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return apiNotFound("Project");

    // Project Manager authorization check (Rule 8)
    if (user.role === "PROJECT_MANAGER" && project.managerId && project.managerId !== user.id) {
      return apiForbidden("Project managers can only manage milestones for authorized projects.");
    }

    const milestone = await prisma.milestone.create({
      data: {
        projectId,
        title,
        description,
        targetDate: new Date(targetDate),
        status,
        order,
        completedDate: status === "COMPLETED" ? new Date() : null,
      },
      include: { project: true },
    });

    await logActivity({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "CREATE",
      entity: "Milestone",
      entityId: milestone.id,
      meta: { projectId, title, targetDate, status },
    });

    if (project.managerId && project.managerId !== user.id) {
      await createNotification({
        userId: project.managerId,
        title: "Milestone Created",
        message: `New milestone '${title}' established for '${project.name}'.`,
        type: "SYSTEM",
        link: `/reports`,
      });
    }

    return apiSuccess({ milestone, message: "Milestone created successfully" }, 201);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to create milestone", null, 500);
  }
}

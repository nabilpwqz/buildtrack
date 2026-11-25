import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiError, apiForbidden, apiNotFound } from "@/lib/api-response";
import { logActivity } from "@/lib/audit";
import { SessionUser } from "@/types";
import { isTaskOverdue, calculateWeightedProgress } from "@/lib/business-rules";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  const { id } = await params;

  if (user && !can(user, "read", "task")) return apiForbidden();

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, status: true } },
      assignee: { select: { id: true, name: true, email: true, role: true } },
      dependencies: {
        include: {
          dependsOn: { select: { id: true, title: true, status: true, deadline: true } },
        },
      },
      dependedOnBy: {
        include: {
          task: { select: { id: true, title: true, status: true } },
        },
      },
      comments: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "desc" },
      },
      history: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!task || task.isDeleted) return apiNotFound("Task");

  // Rule 1: Contractors can only access their assigned projects and tasks
  if (user?.role === "CONTRACTOR") {
    const contractorId =
      user.contractorId ||
      (
        await prisma.user.findUnique({
          where: { id: user.id },
          select: { contractorId: true },
        })
      )?.contractorId;

    const isAssignedProject = await prisma.projectContractor.findFirst({
      where: {
        projectId: task.projectId,
        contractorId: contractorId || "none",
      },
    });

    if (!isAssignedProject && task.assigneeId !== user.id) {
      return apiForbidden("Contractors can only access their assigned projects and tasks.");
    }
  }

  const overdue = isTaskOverdue(task);
  const incompletePrereqs = task.dependencies.filter(
    (d) => d.dependsOn.status !== "COMPLETED"
  );

  return apiSuccess({
    task: {
      ...task,
      isOverdue: overdue,
      isBlocked: task.status !== "COMPLETED" && incompletePrereqs.length > 0,
      blockedBy: incompletePrereqs.map((d) => d.dependsOn),
    },
  });
}

const taskPatchSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  assigneeId: z.string().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  deadline: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  estimatedHours: z.number().optional(),
  actualHours: z.number().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  const { id } = await params;

  if (user && !can(user, "update", "task")) return apiForbidden();

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing || existing.isDeleted) return apiNotFound("Task");

  // Rule 1: Contractors can only update their assigned projects and tasks
  if (user?.role === "CONTRACTOR") {
    const contractorId =
      user.contractorId ||
      (
        await prisma.user.findUnique({
          where: { id: user.id },
          select: { contractorId: true },
        })
      )?.contractorId;

    const isAssignedProject = await prisma.projectContractor.findFirst({
      where: {
        projectId: existing.projectId,
        contractorId: contractorId || "none",
      },
    });

    if (!isAssignedProject && existing.assigneeId !== user.id) {
      return apiForbidden("Contractors can only update their assigned projects and tasks.");
    }
  }

  // Rule 4: Project managers can only manage tasks on authorized projects
  if (user?.role === "PROJECT_MANAGER") {
    const project = await prisma.project.findUnique({ where: { id: existing.projectId } });
    if (project) {
      const isManager = project.managerId === user.id;
      const isMember = await prisma.projectMember.findFirst({
        where: { projectId: existing.projectId, userId: user.id },
      });
      if (!isManager && !isMember) {
        return apiForbidden("Project managers can only manage tasks on their authorized projects.");
      }
    }
  }

  try {
    const body = await req.json();
    const parsed = taskPatchSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid update payload", parsed.error.format());
    }

    // Contractors cannot alter deadlines or priorities
    if (user?.role === "CONTRACTOR") {
      if (parsed.data.deadline !== undefined || parsed.data.priority !== undefined || parsed.data.assigneeId !== undefined) {
        return apiForbidden("Contractors can only update task progress, not administrative task parameters.");
      }
    }

    const data: any = { ...parsed.data };
    if (data.deadline) data.deadline = new Date(data.deadline);

    const updated = await prisma.task.update({
      where: { id },
      data,
    });

    // Check if progress updated -> re-rollup project progress
    if (typeof data.progress === "number") {
      const allProjectTasks = await prisma.task.findMany({
        where: { projectId: updated.projectId, isDeleted: false },
        select: { progress: true, estimatedHours: true },
      });
      const rollup = calculateWeightedProgress(allProjectTasks);
      await prisma.project.update({
        where: { id: updated.projectId },
        data: { progress: rollup },
      });
    }

    const actor =
      user ||
      (await prisma.user.findFirst({
        select: { id: true, name: true, role: true },
      }));

    if (actor) {
      await prisma.taskHistory.create({
        data: {
          taskId: id,
          userId: actor.id,
          action: "DETAILS_UPDATED",
          details: JSON.stringify(parsed.data),
        },
      });

      await logActivity({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: "UPDATE",
        entity: "Task",
        entityId: id,
        meta: parsed.data,
      });
    }

    return apiSuccess({ task: updated, message: "Task updated successfully" });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to update task", null, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  const { id } = await params;

  if (user && !can(user, "delete", "task")) return apiForbidden();

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return apiNotFound("Task");

  // Soft delete invariant: history is NEVER destroyed
  await prisma.task.update({
    where: { id },
    data: { isDeleted: true },
  });

  const actor =
    user ||
    (await prisma.user.findFirst({
      select: { id: true, name: true, role: true },
    }));

  if (actor) {
    await prisma.taskHistory.create({
      data: {
        taskId: id,
        userId: actor.id,
        action: "TASK_SOFT_DELETED",
        details: "Task soft-deleted. Audit history preserved.",
      },
    });

    await logActivity({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "DELETE",
      entity: "Task",
      entityId: id,
      meta: { title: existing.title },
    });
  }

  return apiSuccess({ message: "Task soft-deleted successfully" });
}

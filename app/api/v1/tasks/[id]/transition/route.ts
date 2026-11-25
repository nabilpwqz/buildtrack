import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiError, apiForbidden, apiConflict, apiNotFound } from "@/lib/api-response";
import { logActivity } from "@/lib/audit";
import { SessionUser } from "@/types";
import { checkTaskTransitionRule, calculateWeightedProgress } from "@/lib/business-rules";

const transitionSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"]),
  progress: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  const { id } = await params;

  if (user && !can(user, "transition", "task")) {
    return apiForbidden("You are not authorized to transition task status.");
  }

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, managerId: true } },
      dependencies: {
        include: {
          dependsOn: { select: { id: true, title: true, status: true } },
        },
      },
    },
  });

  if (!task || task.isDeleted) return apiNotFound("Task");

  // Rule 1: Contractors can only transition their assigned projects and tasks
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
      return apiForbidden("Contractors can only transition tasks on their assigned projects.");
    }
  }

  // Rule 4: Project managers can only manage tasks on authorized projects
  if (user?.role === "PROJECT_MANAGER") {
    const isManager = task.project?.managerId === user.id;
    const isMember = await prisma.projectMember.findFirst({
      where: { projectId: task.projectId, userId: user.id },
    });
    if (!isManager && !isMember) {
      return apiForbidden("Project managers can only manage tasks on their authorized projects.");
    }
  }

  try {
    const body = await req.json();
    const parsed = transitionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid transition data", parsed.error.format());
    }

    const { status: targetStatus, progress: customProgress, notes } = parsed.data;

    // Check dependency blockage rule:
    // Task cannot move to IN_PROGRESS or COMPLETED while any dependency is incomplete (blocked)
    const prerequisites = task.dependencies.map((d) => d.dependsOn);
    const ruleCheck = checkTaskTransitionRule(targetStatus, prerequisites);

    if (!ruleCheck.allowed) {
      const blockers = (ruleCheck.blockedBy || []).map((b: any) => b.title).join(", ");
      return apiConflict(
        ruleCheck.reason || `Task is blocked by incomplete prerequisite: ${blockers}`,
        {
          blockedBy: ruleCheck.blockedBy,
        }
      );
    }

    // Determine new progress
    let newProgress = task.progress;
    if (typeof customProgress === "number") {
      newProgress = customProgress;
    } else if (targetStatus === "COMPLETED") {
      newProgress = 100;
    } else if (targetStatus === "TODO") {
      newProgress = 0;
    } else if (targetStatus === "IN_PROGRESS" && task.progress === 0) {
      newProgress = 25;
    } else if (targetStatus === "REVIEW" && task.progress < 75) {
      newProgress = 85;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: targetStatus,
        progress: newProgress,
        completedAt: targetStatus === "COMPLETED" ? new Date() : null,
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, role: true } },
        dependencies: {
          include: {
            dependsOn: { select: { id: true, title: true, status: true } },
          },
        },
      },
    });

    // Record Immutable Task History
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
          action: "STATUS_TRANSITION",
          from: task.status,
          to: targetStatus,
          details:
            notes ||
            `Status changed from ${task.status} to ${targetStatus} (Progress: ${newProgress}%)`,
        },
      });

      await logActivity({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: "TRANSITION",
        entity: "Task",
        entityId: id,
        meta: { from: task.status, to: targetStatus, progress: newProgress },
      });
    }

    // Recompute Project Progress Rollup
    const allTasks = await prisma.task.findMany({
      where: { projectId: task.projectId, isDeleted: false },
      select: { progress: true, estimatedHours: true },
    });
    const projectRollup = calculateWeightedProgress(allTasks);

    await prisma.project.update({
      where: { id: task.projectId },
      data: {
        progress: projectRollup,
        status: projectRollup === 100 ? "COMPLETED" : undefined,
      },
    });

    return apiSuccess({
      task: updatedTask,
      projectProgress: projectRollup,
      message: `Task transitioned to ${targetStatus} successfully`,
    });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to transition task status", null, 500);
  }
}

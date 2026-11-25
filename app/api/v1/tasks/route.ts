import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiError, apiForbidden, apiConflict } from "@/lib/api-response";
import { logActivity, createNotification } from "@/lib/audit";
import { SessionUser } from "@/types";
import { hasCircularDependency, isTaskOverdue } from "@/lib/business-rules";

const taskCreateSchema = z.object({
  projectId: z.string(),
  title: z.string().min(3),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"]).optional(),
  deadline: z.string(),
  estimatedHours: z.number().min(1).default(8),
  dependsOnIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  // Unauthenticated visitors allowed preview read; authenticated users check RBAC
  if (user && !can(user, "read", "task")) {
    return apiForbidden();
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(0, parseInt(searchParams.get("page") || "0"));
  const pageSize = Math.min(500, Math.max(1, parseInt(searchParams.get("pageSize") || "20")));
  const q = searchParams.get("q") || "";
  const projectId = searchParams.get("projectId") || undefined;
  const status = searchParams.get("status") || undefined;
  const priority = searchParams.get("priority") || undefined;
  const assigneeId = searchParams.get("assigneeId") || undefined;
  const blockedOnly = searchParams.get("blockedOnly") === "true";
  const overdueOnly = searchParams.get("overdueOnly") === "true";
  const sort = searchParams.get("sort") || "deadline";
  const desc = searchParams.get("desc") === "true";

  const where: any = { isDeleted: false };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (projectId) where.projectId = projectId;
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigneeId) where.assigneeId = assigneeId;
  if (overdueOnly) {
    where.deadline = { lt: new Date() };
    where.status = { not: "COMPLETED" };
  }

  // Contractor restriction: only their assigned projects or tasks
  if (user?.role === "CONTRACTOR") {
    const contractorId =
      user.contractorId ||
      (
        await prisma.user.findUnique({
          where: { id: user.id },
          select: { contractorId: true },
        })
      )?.contractorId;

    where.OR = [
      { assigneeId: user.id },
      {
        project: {
          contractors: {
            some: { contractorId: contractorId || "none" },
          },
        },
      },
    ];
  }

  const [total, tasks, allTasksForMetrics] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      skip: page * pageSize,
      take: pageSize,
      orderBy: { [sort]: desc ? "desc" : "asc" },
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
        history: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { id: true, name: true, role: true } } },
        },
      },
    }),
    prisma.task.findMany({
      where: projectId ? { isDeleted: false, projectId } : { isDeleted: false },
      select: {
        id: true,
        status: true,
        priority: true,
        deadline: true,
        progress: true,
        dependencies: {
          select: {
            dependsOn: { select: { status: true } },
          },
        },
      },
    }),
  ]);

  // Compute metrics across scope
  let todoCount = 0;
  let inProgressCount = 0;
  let reviewCount = 0;
  let completedCount = 0;
  let criticalCount = 0;
  let overdueCount = 0;
  let blockedCount = 0;
  let totalProgress = 0;

  for (const t of allTasksForMetrics) {
    if (t.status === "TODO") todoCount++;
    else if (t.status === "IN_PROGRESS") inProgressCount++;
    else if (t.status === "REVIEW") reviewCount++;
    else if (t.status === "COMPLETED") completedCount++;

    if (t.priority === "CRITICAL") criticalCount++;
    if (isTaskOverdue(t as any)) overdueCount++;
    const isBlk =
      t.status !== "COMPLETED" &&
      t.dependencies.some((d) => d.dependsOn.status !== "COMPLETED");
    if (isBlk) blockedCount++;
    totalProgress += t.progress || 0;
  }

  const averageProgress =
    allTasksForMetrics.length > 0
      ? Math.round((totalProgress / allTasksForMetrics.length) * 10) / 10
      : 0;

  // Compute dynamic flags: isOverdue, isBlocked for returned tasks
  let enrichedTasks = tasks.map((task) => {
    const overdue = isTaskOverdue(task);
    const incompletePrereqs = task.dependencies.filter(
      (d) => d.dependsOn.status !== "COMPLETED"
    );
    const isBlocked = task.status !== "COMPLETED" && incompletePrereqs.length > 0;

    return {
      ...task,
      isOverdue: overdue,
      isBlocked,
      blockedByCount: incompletePrereqs.length,
      blockedBy: incompletePrereqs.map((d) => d.dependsOn),
      blockingCount: task.dependedOnBy.length,
    };
  });

  if (blockedOnly) {
    enrichedTasks = enrichedTasks.filter((t) => t.isBlocked);
  }
  if (overdueOnly) {
    enrichedTasks = enrichedTasks.filter((t) => t.isOverdue);
  }

  return apiSuccess({
    tasks: enrichedTasks,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
    metrics: {
      totalTasks: allTasksForMetrics.length,
      todoCount,
      inProgressCount,
      reviewCount,
      completedCount,
      criticalCount,
      overdueCount,
      blockedCount,
      averageProgress,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  if (user && !can(user, "create", "task")) {
    return apiForbidden("You are not authorized to create tasks.");
  }

  try {
    const body = await req.json();
    const parsed = taskCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid task data", parsed.error.format());
    }

    const {
      projectId,
      title,
      description,
      assigneeId,
      priority,
      status,
      deadline,
      estimatedHours,
      dependsOnIds,
    } = parsed.data;

    const initialStatus = status || "TODO";
    const initialProgress =
      initialStatus === "COMPLETED"
        ? 100
        : initialStatus === "REVIEW"
        ? 80
        : initialStatus === "IN_PROGRESS"
        ? 25
        : 0;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return apiError("NOT_FOUND", "Project does not exist", null, 404);

    // Rule 4: Project managers can only manage tasks on their authorized projects
    if (user?.role === "PROJECT_MANAGER") {
      const isManager = project.managerId === user.id;
      const isMember = await prisma.projectMember.findFirst({
        where: { projectId, userId: user.id },
      });
      if (!isManager && !isMember) {
        return apiForbidden("Project managers can only manage tasks on their authorized projects.");
      }
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description,
        assigneeId: assigneeId || null,
        priority,
        deadline: new Date(deadline),
        estimatedHours,
        status: initialStatus,
        progress: initialProgress,
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    // Handle dependencies if specified
    if (dependsOnIds && dependsOnIds.length > 0) {
      const allDeps = await prisma.taskDependency.findMany({
        where: { task: { projectId } },
        select: { taskId: true, dependsOnId: true },
      });

      for (const depId of dependsOnIds) {
        if (hasCircularDependency(task.id, depId, allDeps)) {
          // Rollback
          await prisma.task.delete({ where: { id: task.id } });
          return apiConflict(`Circular dependency detected between task and prerequisite #${depId}`);
        }

        await prisma.taskDependency.create({
          data: {
            taskId: task.id,
            dependsOnId: depId,
          },
        });
      }
    }

    // Log initial history with fallback actor if no session
    const actor =
      user ||
      (await prisma.user.findFirst({
        select: { id: true, name: true, role: true },
      }));

    if (actor) {
      await prisma.taskHistory.create({
        data: {
          taskId: task.id,
          userId: actor.id,
          action: "TASK_CREATED",
          to: initialStatus,
          details: `Task created with priority ${priority} and ${estimatedHours}h estimated effort.`,
        },
      });

      await logActivity({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: "CREATE",
        entity: "Task",
        entityId: task.id,
        meta: { title: task.title, projectId: task.projectId },
      });

      if (assigneeId && assigneeId !== actor.id) {
        await createNotification({
          userId: assigneeId,
          title: "New Task Assignment",
          message: `You were assigned to '${task.title}' on project '${project.name}'.`,
          type: "TASK_ASSIGNED",
          link: "/tasks",
        });
      }
    }

    return apiSuccess({ task, message: "Task created successfully" }, 201);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to create task", null, 500);
  }
}

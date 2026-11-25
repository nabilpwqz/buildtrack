import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiError, apiForbidden, apiNotFound } from "@/lib/api-response";
import { logActivity, createNotification } from "@/lib/audit";
import { SessionUser } from "@/types";
import { calculateWeightedProgress } from "@/lib/business-rules";

const progressReportSchema = z.object({
  projectId: z.string(),
  taskId: z.string().optional().nullable(),
  percentage: z.number().min(0).max(100),
  description: z.string().min(5),
  photos: z.array(z.string()).optional().default([]),
  date: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  if (user && !can(user, "read", "progress_report")) {
    return apiForbidden();
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || undefined;
  const taskId = searchParams.get("taskId") || undefined;
  const q = searchParams.get("q") || "";

  const where: any = {};
  if (projectId && projectId !== "ALL") where.projectId = projectId;
  if (taskId) where.taskId = taskId;

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

  const progressReports = await prisma.progressReport.findMany({
    where: {
      ...where,
      ...(q ? { description: { contains: q, mode: "insensitive" } } : {}),
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          status: true,
          progress: true,
          location: true,
          expectedEndDate: true,
        },
      },
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          deadline: true,
          progress: true,
        },
      },
      reportedBy: {
        select: {
          id: true,
          name: true,
          role: true,
          email: true,
        },
      },
    },
    orderBy: { date: "desc" },
    take: 200,
  });

  return apiSuccess({ progressReports });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  if (user && !can(user, "create", "progress_report")) {
    return apiForbidden("Access Denied: Only Site Engineers, Project Managers, and Administrators can submit daily progress reports.");
  }

  try {
    const body = await req.json();
    const parsed = progressReportSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid progress report payload", parsed.error.format());
    }

    const { projectId, taskId, percentage, description, photos, date } = parsed.data;

    let reporterId = user?.id;
    if (!reporterId) {
      const defaultUser = await prisma.user.findFirst({
        where: { role: { in: ["SITE_ENGINEER", "PROJECT_MANAGER", "ADMIN"] } },
      });
      reporterId = defaultUser?.id || "demo-engineer";
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return apiNotFound("Project");

    let task = null;
    if (taskId) {
      task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task || task.projectId !== projectId) {
        return apiError("BAD_REQUEST", "Referenced task does not belong to this project", null, 400);
      }
    }

    const reportDate = date ? new Date(date) : new Date();

    const report = await prisma.progressReport.create({
      data: {
        projectId,
        taskId: taskId || null,
        percentage,
        description,
        photos: JSON.stringify(photos || []),
        reportedById: reporterId,
        date: reportDate,
      },
      include: {
        project: { select: { id: true, name: true, status: true, progress: true, location: true } },
        task: { select: { id: true, title: true, status: true, priority: true } },
        reportedBy: { select: { id: true, name: true, role: true, email: true } },
      },
    });

    if (task) {
      const updateTaskData: any = { progress: percentage };
      if (percentage === 100 && task.status !== "COMPLETED") {
        updateTaskData.status = "COMPLETED";
        updateTaskData.completedAt = new Date();
      } else if (percentage > 0 && task.status === "TODO") {
        updateTaskData.status = "IN_PROGRESS";
      }

      await prisma.task.update({
        where: { id: task.id },
        data: updateTaskData,
      });

      await prisma.taskHistory.create({
        data: {
          taskId: task.id,
          userId: reporterId,
          action: "PROGRESS_UPDATE",
          from: `${task.progress}%`,
          to: `${percentage}%`,
          details: `Progress updated via daily report: ${description.substring(0, 100)}`,
        },
      });
    }

    const allProjectTasks = await prisma.task.findMany({
      where: { projectId, isDeleted: false },
      select: { progress: true, estimatedHours: true },
    });
    const newRollupProgress = allProjectTasks.length > 0
      ? calculateWeightedProgress(allProjectTasks)
      : percentage;

    await prisma.project.update({
      where: { id: projectId },
      data: { progress: newRollupProgress },
    });

    await logActivity({
      actorId: user?.id || reporterId,
      actorName: user?.name || "Engr. Farhana Ahmed, PE",
      actorRole: user?.role || "SITE_ENGINEER",
      action: "CREATE",
      entity: "ProgressReport",
      entityId: report.id,
      meta: { projectId, taskId, percentage },
    });

    if (project.managerId) {
      await createNotification({
        userId: project.managerId,
        title: "Daily Progress Report Submitted",
        message: `${user?.name || "Site Engineer"} submitted work update for '${project.name}' (${percentage}% completed).`,
        type: "REPORT_SUBMITTED",
        link: `/reports`,
      });
    }

    return apiSuccess({
      report,
      projectProgress: newRollupProgress,
      message: "Daily work update submitted successfully",
    }, 201);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to submit progress report", null, 500);
  }
}

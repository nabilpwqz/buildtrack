import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiError, apiForbidden, apiNotFound } from "@/lib/api-response";
import { logActivity, createNotification } from "@/lib/audit";
import { SessionUser } from "@/types";
import { calculateWeightedProgress } from "@/lib/business-rules";

const siteReportSchema = z.object({
  type: z.literal("site"),
  projectId: z.string(),
  weather: z.string().min(2),
  workersCount: z.number().min(0),
  equipmentOnSite: z.string().optional(),
  workCompleted: z.string().min(5),
  issuesFaced: z.string().optional(),
  safetyIncidents: z.number().min(0).default(0),
  photos: z.array(z.string()).optional(),
  date: z.string().optional(),
});

const progressReportSchema = z.object({
  type: z.literal("progress"),
  projectId: z.string(),
  taskId: z.string().optional().nullable(),
  percentage: z.number().min(0).max(100),
  description: z.string().min(5),
  photos: z.array(z.string()).optional().default([]),
  date: z.string().optional(),
});

const delayReportSchema = z.object({
  type: z.literal("delay"),
  projectId: z.string(),
  taskId: z.string().optional(),
  reason: z.string().min(5),
  impactDays: z.number().min(1),
  mitigationPlan: z.string().min(5),
});

const delayUpdateSchema = z.object({
  id: z.string(),
  status: z.enum(["OPEN", "MITIGATED", "RESOLVED"]).optional(),
  mitigationPlan: z.string().min(5).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  // Allow guest/demo visitor read, or verify permission if user is signed in with restricted role
  if (user && !can(user, "read", "site_report") && !can(user, "read", "progress_report")) {
    return apiForbidden();
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || undefined;
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status") || undefined;

  const where: any = {};
  if (projectId && projectId !== "ALL") where.projectId = projectId;

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

  let [siteReports, progressReports, delayReports, delayedTasks, milestones] = await Promise.all([
    prisma.siteReport.findMany({
      where: {
        ...where,
        ...(q
          ? {
              OR: [
                { workCompleted: { contains: q, mode: "insensitive" } },
                { weather: { contains: q, mode: "insensitive" } },
                { equipmentOnSite: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        project: { select: { id: true, name: true, status: true, location: true } },
        reportedBy: { select: { id: true, name: true, role: true, email: true } },
      },
      orderBy: { date: "desc" },
      take: 200,
    }),
    prisma.progressReport.findMany({
      where: {
        ...where,
        ...(q
          ? {
              OR: [
                { description: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        project: { select: { id: true, name: true, status: true, progress: true, location: true, expectedEndDate: true } },
        task: { select: { id: true, title: true, status: true, priority: true, deadline: true, progress: true } },
        reportedBy: { select: { id: true, name: true, role: true, email: true } },
      },
      orderBy: { date: "desc" },
      take: 200,
    }),
    prisma.delayReport.findMany({
      where: {
        ...where,
        ...(status && status !== "ALL" ? { status } : {}),
        ...(q
          ? {
              OR: [
                { reason: { contains: q, mode: "insensitive" } },
                { mitigationPlan: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        project: { select: { id: true, name: true, status: true } },
        task: { select: { id: true, title: true } },
        reportedBy: { select: { id: true, name: true, role: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.task.findMany({
      where: {
        ...(projectId && projectId !== "ALL" ? { projectId } : {}),
        isDeleted: false,
        deadline: { lt: new Date() },
        status: { not: "COMPLETED" },
      },
      include: {
        project: { select: { id: true, name: true, status: true } },
        assignee: { select: { id: true, name: true, role: true, email: true } },
        dependencies: { include: { dependsOn: { select: { id: true, title: true, status: true } } } },
      },
      orderBy: { deadline: "asc" },
      take: 50,
    }),
    prisma.milestone.findMany({
      where: projectId && projectId !== "ALL" ? { projectId } : {},
      include: {
        project: { select: { id: true, name: true, status: true, progress: true } },
      },
      orderBy: [{ projectId: "asc" }, { order: "asc" }, { targetDate: "asc" }],
      take: 50,
    }),
  ]);

  // Calculate summary metrics
  const totalSitePersonnel = siteReports.reduce((acc, r) => acc + (r.workersCount || 0), 0);
  const avgProgressPct = progressReports.length > 0
    ? Math.round(progressReports.reduce((acc, r) => acc + (r.percentage || 0), 0) / progressReports.length)
    : 78;
  const netDelayDays = delayReports.reduce((acc, r) => acc + (r.impactDays || 0), 0);
  const openDelaysCount = delayReports.filter((r) => r.status === "OPEN").length;
  const mitigatedDelaysCount = delayReports.filter((r) => r.status === "MITIGATED").length;
  const resolvedDelaysCount = delayReports.filter((r) => r.status === "RESOLVED").length;

  const delayedTasksCount = delayedTasks.length;
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m) => m.status === "COMPLETED").length;
  const milestoneCompletionRate = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  return apiSuccess({
    siteReports,
    progressReports,
    delayReports,
    delayedTasks,
    milestones,
    metrics: {
      totalSiteReports: siteReports.length,
      totalProgressReports: progressReports.length,
      totalDelayReports: delayReports.length,
      delayedTasksCount,
      totalMilestones,
      completedMilestones,
      milestoneCompletionRate,
      totalSitePersonnel,
      avgProgressPct,
      netDelayDays,
      openDelaysCount,
      mitigatedDelaysCount,
      resolvedDelaysCount,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  if (user && !can(user, "create", "site_report") && !can(user, "create", "progress_report")) {
    return apiForbidden();
  }

  try {
    const body = await req.json();

    // Default to active session user or find demo site engineer from database
    let reporterId = user?.id;
    if (!reporterId) {
      const defaultUser = await prisma.user.findFirst({
        where: { role: { in: ["SITE_ENGINEER", "PROJECT_MANAGER", "ADMIN"] } },
      });
      reporterId = defaultUser?.id || "demo-engineer";
    }

    if (body.type === "site") {
      const parsed = siteReportSchema.safeParse(body);
      if (!parsed.success) {
        return apiError("VALIDATION_ERROR", "Invalid site report", parsed.error.format());
      }
      const data = parsed.data;

      const reportDate = data.date ? new Date(data.date) : new Date();

      const report = await prisma.siteReport.create({
        data: {
          projectId: data.projectId,
          reportedById: reporterId,
          weather: data.weather,
          workersCount: data.workersCount,
          equipmentOnSite: data.equipmentOnSite,
          workCompleted: data.workCompleted,
          issuesFaced: data.issuesFaced,
          safetyIncidents: data.safetyIncidents,
          photos: JSON.stringify(data.photos || []),
          date: reportDate,
        },
        include: {
          project: { select: { id: true, name: true, status: true, managerId: true } },
          reportedBy: { select: { id: true, name: true, role: true, email: true } },
        },
      });

      await logActivity({
        actorId: user?.id || reporterId,
        actorName: user?.name || "Engr. Farhana Ahmed, PE",
        actorRole: user?.role || "SITE_ENGINEER",
        action: "CREATE",
        entity: "SiteReport",
        entityId: report.id,
        meta: { projectId: data.projectId, workers: data.workersCount },
      });

      if (report.project.managerId) {
        await createNotification({
          userId: report.project.managerId,
          title: "Daily Site Log Submitted",
          message: `${user?.name || "Field Engineer"} submitted daily site log for '${report.project.name}'.`,
          type: "REPORT_SUBMITTED",
          link: "/reports",
        });
      }

      return apiSuccess({ report, message: "Site log submitted successfully" }, 201);
    }

    if (body.type === "progress") {
      const parsed = progressReportSchema.safeParse(body);
      if (!parsed.success) {
        return apiError("VALIDATION_ERROR", "Invalid progress report", parsed.error.format());
      }
      const data = parsed.data;

      const project = await prisma.project.findUnique({ where: { id: data.projectId } });
      if (!project) return apiNotFound("Project");

      let task = null;
      if (data.taskId) {
        task = await prisma.task.findUnique({ where: { id: data.taskId } });
        if (!task || task.projectId !== data.projectId) {
          return apiError("BAD_REQUEST", "Referenced task does not belong to this project", null, 400);
        }
      }

      const reportDate = data.date ? new Date(data.date) : new Date();

      const report = await prisma.progressReport.create({
        data: {
          projectId: data.projectId,
          taskId: data.taskId || null,
          percentage: data.percentage,
          description: data.description,
          photos: JSON.stringify(data.photos || []),
          reportedById: reporterId,
          date: reportDate,
        },
        include: {
          project: { select: { id: true, name: true, status: true, progress: true } },
          task: { select: { id: true, title: true, status: true, priority: true } },
          reportedBy: { select: { id: true, name: true, role: true, email: true } },
        },
      });

      // Update task progress if task reference provided
      if (task) {
        const updateTaskData: any = { progress: data.percentage };
        if (data.percentage === 100 && task.status !== "COMPLETED") {
          updateTaskData.status = "COMPLETED";
          updateTaskData.completedAt = new Date();
        } else if (data.percentage > 0 && task.status === "TODO") {
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
            to: `${data.percentage}%`,
            details: `Progress updated via daily report: ${data.description.substring(0, 100)}`,
          },
        });
      }

      // Update project weighted progress
      const allProjectTasks = await prisma.task.findMany({
        where: { projectId: data.projectId, isDeleted: false },
        select: { progress: true, estimatedHours: true },
      });
      const newRollupProgress = allProjectTasks.length > 0
        ? calculateWeightedProgress(allProjectTasks)
        : data.percentage;

      await prisma.project.update({
        where: { id: data.projectId },
        data: { progress: newRollupProgress },
      });

      await logActivity({
        actorId: user?.id || reporterId,
        actorName: user?.name || "Engr. Farhana Ahmed, PE",
        actorRole: user?.role || "SITE_ENGINEER",
        action: "CREATE",
        entity: "ProgressReport",
        entityId: report.id,
        meta: { projectId: data.projectId, taskId: data.taskId, percentage: data.percentage },
      });

      if (project.managerId) {
        await createNotification({
          userId: project.managerId,
          title: "Daily Progress Report Submitted",
          message: `${user?.name || "Site Engineer"} reported ${data.percentage}% progress on '${project.name}'${task ? ` (${task.title})` : ""}.`,
          type: "REPORT_SUBMITTED",
          link: `/reports`,
        });
      }

      return apiSuccess({
        report,
        projectProgress: newRollupProgress,
        message: "Daily progress report submitted successfully",
      }, 201);
    }

    if (body.type === "delay") {
      const parsed = delayReportSchema.safeParse(body);
      if (!parsed.success) {
        return apiError("VALIDATION_ERROR", "Invalid delay report", parsed.error.format());
      }
      const data = parsed.data;

      const report = await prisma.delayReport.create({
        data: {
          projectId: data.projectId,
          taskId: data.taskId || null,
          reason: data.reason,
          impactDays: data.impactDays,
          mitigationPlan: data.mitigationPlan,
          status: "OPEN",
          reportedById: reporterId,
        },
        include: { project: true },
      });

      // Mark project as DELAYED
      await prisma.project.update({
        where: { id: data.projectId },
        data: { status: "DELAYED" },
      });

      await logActivity({
        actorId: user?.id || reporterId,
        actorName: user?.name || "Engr. Farhana Ahmed, PE",
        actorRole: user?.role || "SITE_ENGINEER",
        action: "CREATE",
        entity: "DelayReport",
        entityId: report.id,
        meta: { projectId: data.projectId, impactDays: data.impactDays },
      });

      if (report.project.managerId) {
        await createNotification({
          userId: report.project.managerId,
          title: `Delay Incident Reported (+${data.impactDays} Days)`,
          message: `Delay report filed on '${report.project.name}': ${data.reason}`,
          type: "OVERDUE",
          link: `/reports`,
        });
      }

      return apiSuccess({ report, message: "Delay reported and project flagged" }, 201);
    }

    return apiError("BAD_REQUEST", "Unknown report type", null, 400);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to process report", null, 500);
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  try {
    const body = await req.json();
    const parsed = delayUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid update payload", parsed.error.format());
    }

    const { id, status, mitigationPlan } = parsed.data;

    const existing = await prisma.delayReport.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existing) {
      return apiNotFound("Delay report not found");
    }

    const updated = await prisma.delayReport.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(mitigationPlan ? { mitigationPlan } : {}),
      },
      include: { project: true, reportedBy: true },
    });

    // If status changed to RESOLVED, check if there are remaining open delays
    if (status === "RESOLVED") {
      const openCount = await prisma.delayReport.count({
        where: {
          projectId: existing.projectId,
          status: "OPEN",
          id: { not: id },
        },
      });

      if (openCount === 0) {
        await prisma.project.update({
          where: { id: existing.projectId },
          data: { status: "IN_PROGRESS" },
        });
      }
    }

    await logActivity({
      actorId: user?.id || "demo-operator",
      actorName: user?.name || "Field Coordinator",
      actorRole: user?.role || "SITE_ENGINEER",
      action: "UPDATE",
      entity: "DelayReport",
      entityId: id,
      meta: { status, mitigationPlan },
    });

    return apiSuccess({
      report: updated,
      message: `Delay incident status updated to ${status || "saved"}`,
    });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to update report", null, 500);
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type") || "delay";

    if (!id) {
      return apiError("BAD_REQUEST", "Report ID is required");
    }

    if (type === "delay") {
      await prisma.delayReport.delete({ where: { id } });
    } else if (type === "site") {
      await prisma.siteReport.delete({ where: { id } });
    } else if (type === "progress") {
      await prisma.progressReport.delete({ where: { id } });
    }

    await logActivity({
      actorId: user?.id || "demo-operator",
      actorName: user?.name || "Field Coordinator",
      actorRole: user?.role || "ADMIN",
      action: "DELETE",
      entity: "Report",
      entityId: id,
      meta: { type },
    });

    return apiSuccess({ message: "Report record purged successfully" });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to purge report", null, 500);
  }
}

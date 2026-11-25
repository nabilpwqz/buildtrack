import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiError, apiForbidden, apiNotFound } from "@/lib/api-response";
import { logActivity, createNotification } from "@/lib/audit";
import { SessionUser } from "@/types";

const milestoneUpdateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  targetDate: z.string().optional(),
  completedDate: z.string().nullable().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
  order: z.number().int().min(0).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  const { id } = await params;

  if (user && !can(user, "read", "project")) {
    return apiForbidden();
  }

  const milestone = await prisma.milestone.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          status: true,
          progress: true,
          managerId: true,
        },
      },
    },
  });

  if (!milestone) return apiNotFound("Milestone");

  return apiSuccess({ milestone });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  const { id } = await params;

  if (!user) {
    return apiForbidden("Unauthorized: Authentication required.");
  }

  if (user.role !== "ADMIN" && user.role !== "PROJECT_MANAGER") {
    return apiForbidden("Access Denied: Only Administrators and Project Managers can update milestones.");
  }

  const existing = await prisma.milestone.findUnique({
    where: { id },
    include: { project: true },
  });

  if (!existing) return apiNotFound("Milestone");

  // Rule 8: PM can only manage authorized projects
  if (user.role === "PROJECT_MANAGER" && existing.project.managerId && existing.project.managerId !== user.id) {
    return apiForbidden("Project managers can only manage milestones for authorized projects.");
  }

  try {
    const body = await req.json();
    const parsed = milestoneUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid milestone update", parsed.error.format());
    }

    const data: any = { ...parsed.data };
    if (data.targetDate) {
      data.targetDate = new Date(data.targetDate);
    }
    if (data.status === "COMPLETED" && !data.completedDate) {
      data.completedDate = new Date();
    } else if (data.status && data.status !== "COMPLETED" && data.completedDate === undefined) {
      data.completedDate = null;
    } else if (data.completedDate) {
      data.completedDate = new Date(data.completedDate);
    }

    const updated = await prisma.milestone.update({
      where: { id },
      data,
      include: { project: true },
    });

    await logActivity({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "UPDATE",
      entity: "Milestone",
      entityId: id,
      meta: { title: updated.title, status: updated.status, projectId: existing.projectId },
    });

    if (data.status === "COMPLETED" && existing.project.managerId) {
      await createNotification({
        userId: existing.project.managerId,
        title: "Milestone Reached",
        message: `Milestone '${updated.title}' has been marked COMPLETED on '${existing.project.name}'.`,
        type: "SYSTEM",
        link: `/reports`,
      });
    }

    return apiSuccess({ milestone: updated, message: "Milestone updated successfully" });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to update milestone", null, 500);
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
    return apiForbidden("Unauthorized: Authentication required.");
  }

  if (user.role !== "ADMIN" && user.role !== "PROJECT_MANAGER") {
    return apiForbidden("Access Denied: Only Administrators and Project Managers can delete milestones.");
  }

  const existing = await prisma.milestone.findUnique({
    where: { id },
    include: { project: true },
  });

  if (!existing) return apiNotFound("Milestone");

  if (user.role === "PROJECT_MANAGER" && existing.project.managerId && existing.project.managerId !== user.id) {
    return apiForbidden("Project managers can only delete milestones for authorized projects.");
  }

  try {
    await prisma.milestone.delete({ where: { id } });

    await logActivity({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "DELETE",
      entity: "Milestone",
      entityId: id,
      meta: { title: existing.title, projectId: existing.projectId },
    });

    return apiSuccess({ message: "Milestone deleted successfully" });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to delete milestone", null, 500);
  }
}

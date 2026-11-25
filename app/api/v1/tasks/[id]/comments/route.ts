import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiError, apiForbidden, apiNotFound } from "@/lib/api-response";
import { logActivity } from "@/lib/audit";
import { SessionUser } from "@/types";

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

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
    select: { id: true, projectId: true, isDeleted: true },
  });

  if (!task || task.isDeleted) return apiNotFound("Task");

  const comments = await prisma.taskComment.findMany({
    where: { taskId: id },
    include: {
      user: { select: { id: true, name: true, role: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return apiSuccess({ comments });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  const { id } = await params;

  if (user && !can(user, "read", "task")) return apiForbidden();

  const task = await prisma.task.findUnique({
    where: { id },
    select: { id: true, title: true, projectId: true, assigneeId: true, isDeleted: true },
  });

  if (!task || task.isDeleted) return apiNotFound("Task");

  // Rule 1: Contractor isolation
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
      return apiForbidden("Contractors can only comment on tasks on their assigned projects.");
    }
  }

  try {
    const body = await req.json();
    const parsed = commentSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Comment text is required", parsed.error.format());
    }

    const actor =
      user ||
      (await prisma.user.findFirst({
        select: { id: true, name: true, role: true },
      }));

    if (!actor) {
      return apiForbidden("Authentication required to post comments");
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId: id,
        userId: actor.id,
        content: parsed.data.content.trim(),
      },
      include: {
        user: { select: { id: true, name: true, role: true, email: true } },
      },
    });

    await prisma.taskHistory.create({
      data: {
        taskId: id,
        userId: actor.id,
        action: "COMMENT_ADDED",
        details: `Comment: "${parsed.data.content.trim().slice(0, 100)}"`,
      },
    });

    await logActivity({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "CREATE",
      entity: "TaskComment",
      entityId: comment.id,
      meta: { taskId: id, preview: parsed.data.content.slice(0, 60) },
    });

    return apiSuccess({ comment, message: "Comment added successfully" }, 201);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to post comment", null, 500);
  }
}


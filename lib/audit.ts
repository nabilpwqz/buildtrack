import prisma from "@/lib/db";
import { Role } from "@/types";

export interface LogActivityParams {
  actorId: string;
  actorName: string;
  actorRole: Role | string;
  action: "CREATE" | "UPDATE" | "DELETE" | "TRANSITION" | "APPROVE" | "ISSUE" | "CONSUME" | "RECEIVE" | "ADJUST" | "REJECT" | "UNAUTHORIZED_ATTEMPT";
  entity: string;
  entityId: string;
  meta?: Record<string, any>;
}

export async function logActivity(params: LogActivityParams) {
  try {
    return await prisma.activityLog.create({
      data: {
        actorId: params.actorId,
        actorName: params.actorName,
        actorRole: params.actorRole,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        meta: params.meta ? JSON.stringify(params.meta) : null,
      },
    });
  } catch (error) {
    console.error("Failed to write activity log:", error);
  }
}

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: "TASK_ASSIGNED" | "OVERDUE" | "BUDGET_OVERRUN" | "LOW_STOCK" | "REQUEST_APPROVED" | "REPORT_SUBMITTED" | "SYSTEM";
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        link: params.link,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}


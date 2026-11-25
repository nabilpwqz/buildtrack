import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiError, apiForbidden, apiNotFound } from "@/lib/api-response";
import { logActivity } from "@/lib/audit";
import { SessionUser } from "@/types";
import { computeBudgetSummary, calculateWeightedProgress } from "@/lib/business-rules";

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

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, role: true, email: true } } } },
      contractors: { include: { contractor: true } },
      milestones: { orderBy: { order: "asc" } },
      tasks: {
        where: { isDeleted: false },
        include: {
          assignee: { select: { id: true, name: true, role: true } },
          dependencies: { include: { dependsOn: { select: { id: true, title: true, status: true, deadline: true } } } },
          dependedOnBy: { include: { task: { select: { id: true, title: true, status: true } } } },
        },
      },
      budgets: { include: { category: true } },
      expenses: {
        include: { category: true, recordedBy: { select: { id: true, name: true } } },
        orderBy: { date: "desc" },
      },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!project) return apiNotFound("Project");

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

    const isAssigned = project.contractors.some(
      (c) => c.contractorId === contractorId
    );
    if (!isAssigned) {
      return apiForbidden("Contractors can only access their assigned projects.");
    }
  }

  // Compute rollups and budget analysis server-side
  const budgetSummary = computeBudgetSummary(
    project,
    project.budgets,
    project.expenses
  );

  const calculatedProgress = calculateWeightedProgress(project.tasks);

  return apiSuccess({
    project,
    budgetSummary,
    calculatedProgress,
  });
}

const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  expectedEndDate: z.string().optional(),
  totalBudget: z.number().optional(),
  status: z.enum(["PLANNING", "IN_PROGRESS", "DELAYED", "ON_HOLD", "COMPLETED"]).optional(),
  managerId: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  contractorIds: z.array(z.string()).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  const { id } = await params;

  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return apiNotFound("Project");

  const isFinance = user?.role === "FINANCE_MANAGER";
  if (user && !isFinance && !can(user, "update", "project", { projectManagerId: existing.managerId })) {
    return apiForbidden("You are not authorized to update this project.");
  }

  // Rule 4: Project managers can only manage authorized projects
  if (user?.role === "PROJECT_MANAGER") {
    const isManager = existing.managerId === user.id;
    const isMember = await prisma.projectMember.findFirst({
      where: { projectId: id, userId: user.id },
    });
    if (!isManager && !isMember) {
      return apiForbidden("Project managers can only manage authorized projects.");
    }
  }

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid update payload", parsed.error.format());
    }

    // Rule 10: Unauthorized users must not modify project financial data
    if (parsed.data.totalBudget !== undefined && user && user.role !== "ADMIN" && user.role !== "FINANCE_MANAGER") {
      return apiForbidden("Unauthorized: Only Administrators and Finance Managers can modify project financial data.");
    }

    if (isFinance) {
      const updatedKeys = Object.keys(parsed.data).filter((k) => (parsed.data as any)[k] !== undefined);
      const nonFinancialKeys = updatedKeys.filter((k) => k !== "totalBudget");
      if (nonFinancialKeys.length > 0) {
        return apiForbidden("Finance managers can only adjust financial figures such as total budget.");
      }
      if (parsed.data.totalBudget === undefined) {
        return apiForbidden("Finance managers can only adjust total budget.");
      }
    }

    // Handle contractor assignment synchronization
    if (parsed.data.contractorIds !== undefined) {
      const incomingContractorIds = parsed.data.contractorIds;
      await prisma.projectContractor.deleteMany({
        where: {
          projectId: id,
          contractorId: { notIn: incomingContractorIds },
        },
      });
      for (const cId of incomingContractorIds) {
        await prisma.projectContractor.upsert({
          where: {
            projectId_contractorId: {
              projectId: id,
              contractorId: cId,
            },
          },
          update: {},
          create: {
            projectId: id,
            contractorId: cId,
            role: "Contractor Partner",
          },
        });
      }
    }

    const { contractorIds, ...projectFields } = parsed.data;
    const data: any = { ...projectFields };
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.expectedEndDate) data.expectedEndDate = new Date(data.expectedEndDate);

    const updated = await prisma.project.update({
      where: { id },
      data,
      include: {
        manager: { select: { id: true, name: true, email: true } },
        contractors: { include: { contractor: true } },
      },
    });

    const actor =
      user ||
      (await prisma.user.findFirst({
        select: { id: true, name: true, role: true },
      }));

    if (actor) {
      await logActivity({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: "UPDATE",
        entity: "Project",
        entityId: id,
        meta: parsed.data,
      });
    }

    return apiSuccess({ project: updated, message: "Project updated successfully" });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to update project", null, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  const { id } = await params;

  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return apiNotFound("Project");

  if (user && !can(user, "delete", "project", { projectManagerId: existing.managerId })) {
    return apiForbidden("You are not authorized to delete this project.");
  }

  // Rule 4: Project managers can only delete authorized projects
  if (user?.role === "PROJECT_MANAGER" && existing.managerId !== user.id) {
    return apiForbidden("Project managers can only delete their authorized projects.");
  }

  try {
    const deleted = await prisma.project.delete({ where: { id } });
    const actor =
      user ||
      (await prisma.user.findFirst({
        select: { id: true, name: true, role: true },
      }));

    if (actor) {
      await logActivity({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: "DELETE",
        entity: "Project",
        entityId: id,
        meta: { name: deleted.name },
      });
    }
    return apiSuccess({ message: "Project deleted successfully" });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to delete project", null, 500);
  }
}

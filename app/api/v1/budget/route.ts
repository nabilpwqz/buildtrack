import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiError, apiForbidden, apiNotFound } from "@/lib/api-response";
import { logActivity } from "@/lib/audit";
import { SessionUser } from "@/types";
import { computeBudgetSummary } from "@/lib/business-rules";

const budgetUpsertSchema = z.object({
  projectId: z.string(),
  categoryId: z.string().optional(),
  allocated: z.number().min(0).optional(),
  totalBudget: z.number().min(0).optional(),
}).refine(
  (data) => (data.categoryId && data.allocated !== undefined) || data.totalBudget !== undefined,
  { message: "Either totalBudget or (categoryId and allocated) must be provided." }
);

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  // Allow preview / guest visitor read, or check permissions if user is signed in
  if (user && !can(user, "read", "budget")) {
    return apiForbidden();
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || undefined;

  const whereProject: any = {};
  if (projectId && projectId !== "ALL") whereProject.id = projectId;

  const projects = await prisma.project.findMany({
    where: whereProject,
    include: {
      budgets: { include: { category: true } },
      expenses: { select: { categoryId: true, amount: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const summaries = projects.map((proj) =>
    computeBudgetSummary(proj, proj.budgets, proj.expenses)
  );

  const categories = await prisma.expenseCategory.findMany({
    orderBy: { name: "asc" },
  });

  const portfolioBudget = summaries.reduce((acc, s) => acc + (s.totalBudget || 0), 0);
  const portfolioSpent = summaries.reduce((acc, s) => acc + (s.totalSpent || 0), 0);
  const portfolioRemaining = Math.max(0, portfolioBudget - portfolioSpent);
  const portfolioUtilization =
    portfolioBudget > 0 ? Math.round((portfolioSpent / portfolioBudget) * 1000) / 10 : 0;
  const overrunProjectsCount = summaries.filter((s) => s.isOverrun).length;
  const warningProjectsCount = summaries.filter((s) => s.isWarning).length;

  return apiSuccess({
    summaries,
    categories,
    metrics: {
      portfolioBudget,
      portfolioSpent,
      portfolioRemaining,
      portfolioUtilization,
      overrunProjectsCount,
      warningProjectsCount,
      totalProjects: summaries.length,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  // Rule 10: Unauthorized users must not modify project financial data
  if (!user) {
    return apiForbidden("Unauthorized: Authentication required to configure project budget allocations.");
  }

  if (!can(user, "create", "budget")) {
    await logActivity({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "UNAUTHORIZED_ATTEMPT",
      entity: "Budget",
      entityId: "none",
      meta: { reason: "Attempted to modify budget without authorization" },
    });
    return apiForbidden("Access Denied: Only Finance Managers and Administrators can configure project budget allocations.");
  }

  try {
    const body = await req.json();
    const parsed = budgetUpsertSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid budget data", parsed.error.format());
    }

    const { projectId, categoryId, allocated, totalBudget } = parsed.data;

    // Validate project existence
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return apiNotFound("Referenced project does not exist.");
    }

    let updatedProject = null;
    if (totalBudget !== undefined) {
      updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: { totalBudget },
      });
      await logActivity({
        actorId: user?.id || "demo-finance",
        actorName: user?.name || "Nasir Uddin, FCA",
        actorRole: user?.role || "FINANCE_MANAGER",
        action: "UPDATE",
        entity: "Project",
        entityId: projectId,
        meta: { totalBudget },
      });
    }

    let budget = null;
    if (categoryId && allocated !== undefined) {
      // Validate category existence
      const category = await prisma.expenseCategory.findUnique({ where: { id: categoryId } });
      if (!category) {
        return apiNotFound("Referenced expense category does not exist.");
      }

      budget = await prisma.budget.upsert({
        where: {
          projectId_categoryId: { projectId, categoryId },
        },
        update: { allocated },
        create: { projectId, categoryId, allocated },
        include: { category: true },
      });

      await logActivity({
        actorId: user?.id || "demo-finance",
        actorName: user?.name || "Nasir Uddin, FCA",
        actorRole: user?.role || "FINANCE_MANAGER",
        action: "UPDATE",
        entity: "Budget",
        entityId: budget.id,
        meta: { projectId, categoryId, allocated },
      });
    }

    return apiSuccess({
      budget,
      project: updatedProject,
      message: "Budget parameters updated successfully",
    });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to update budget", null, 500);
  }
}

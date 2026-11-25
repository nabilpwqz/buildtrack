import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiError, apiForbidden, apiNotFound } from "@/lib/api-response";
import { logActivity, createNotification } from "@/lib/audit";
import { SessionUser } from "@/types";

const expenseCreateSchema = z.object({
  title: z.string().min(3),
  projectId: z.string(),
  categoryId: z.string(),
  amount: z.number().positive("Amount must be positive"),
  date: z.string(),
  description: z.string().optional(),
  documentUrl: z.string().optional(),
});

const expenseUpdateSchema = z.object({
  id: z.string(),
  title: z.string().min(3).optional(),
  amount: z.number().positive().optional(),
  description: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  // Allow guest/demo preview read, or check permission if user is signed in
  if (user && !can(user, "read", "expense")) {
    return apiForbidden();
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(0, parseInt(searchParams.get("page") || "0"));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "25")));
  const q = searchParams.get("q") || "";
  const projectId = searchParams.get("projectId") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const sort = searchParams.get("sort") || "date";
  const desc = searchParams.get("desc") !== "false";

  const where: any = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (projectId && projectId !== "ALL") where.projectId = projectId;
  if (categoryId && categoryId !== "ALL") where.categoryId = categoryId;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  const [total, expenses, aggregateSummary, allCategories] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      skip: page * pageSize,
      take: pageSize,
      orderBy: { [sort]: desc ? "desc" : "asc" },
      include: {
        project: { select: { id: true, name: true, totalBudget: true } },
        category: { select: { id: true, name: true, code: true } },
        recordedBy: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
    prisma.expense.aggregate({
      where,
      _sum: { amount: true },
      _avg: { amount: true },
      _count: true,
    }),
    prisma.expenseCategory.findMany({
      select: { id: true, name: true, code: true },
    }),
  ]);

  const totalAmount = aggregateSummary._sum.amount || 0;
  const avgAmount = Math.round(aggregateSummary._avg.amount || 0);

  return apiSuccess({
    expenses,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
    metrics: {
      totalDisbursed: Math.round(totalAmount),
      avgCertificateAmount: avgAmount,
      totalCertificates: total,
      categoriesCount: allCategories.length,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  // Rule 10: Unauthorized users must not modify project financial data
  if (!user) {
    return apiForbidden("Unauthorized: Authentication required to record financial expenses.");
  }

  // Enforce create permission: Only Finance Managers and Admins can record financial expenses
  if (!can(user, "create", "expense")) {
    await logActivity({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "UNAUTHORIZED_ATTEMPT",
      entity: "Expense",
      entityId: "none",
      meta: { error: "403 Forbidden - Attempt to create expense without financial authorization" },
    });
    return apiForbidden("Access Denied: Only Finance Managers and Administrators can record financial expenses.");
  }

  try {
    const body = await req.json();
    const parsed = expenseCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid expense data", parsed.error.format());
    }

    const { title, projectId, categoryId, amount, date, description, documentUrl } = parsed.data;

    // Rule 6: Expenses must be associated with valid projects
    if (!projectId || typeof projectId !== "string" || !projectId.trim()) {
      return apiError("VALIDATION_ERROR", "Expenses must be associated with valid projects.", null, 400);
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        budgets: { where: { categoryId } },
        manager: { select: { id: true } },
      },
    });

    if (!project) {
      return apiError("NOT_FOUND", "Expenses must be associated with valid projects.", null, 404);
    }

    const category = await prisma.expenseCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return apiError("NOT_FOUND", "Referenced expense category does not exist.", null, 404);
    }

    let recorderId = user?.id;
    if (!recorderId) {
      const defaultFinance = await prisma.user.findFirst({
        where: { role: { in: ["FINANCE_MANAGER", "ADMIN"] } },
      });
      recorderId = defaultFinance?.id || "demo-finance";
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        projectId,
        categoryId,
        amount,
        date: new Date(date),
        description,
        documentUrl,
        recordedById: recorderId,
      },
      include: {
        category: true,
        project: true,
        recordedBy: true,
      },
    });

    await logActivity({
      actorId: user?.id || recorderId,
      actorName: user?.name || "Nasir Uddin, FCA",
      actorRole: user?.role || "FINANCE_MANAGER",
      action: "CREATE",
      entity: "Expense",
      entityId: expense.id,
      meta: { title, amount, projectId, category: category.name },
    });

    // Check for budget overrun and notify PM
    const budget = project.budgets[0];
    if (budget) {
      const currentExpenses = await prisma.expense.aggregate({
        where: { projectId, categoryId },
        _sum: { amount: true },
      });
      const totalSpent = currentExpenses._sum.amount || 0;
      if (totalSpent > budget.allocated && project.manager?.id) {
        await createNotification({
          userId: project.manager.id,
          title: "Budget Allocation Exceeded",
          message: `Category '${category.name}' on '${project.name}' has exceeded its budget of ${budget.allocated} (Current: ${totalSpent}).`,
          type: "BUDGET_OVERRUN",
          link: `/budget?projectId=${projectId}`,
        });
      }
    }

    return apiSuccess({ expense, message: "Expenditure certificate recorded and audited" }, 201);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to record expense", null, 500);
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  // Rule 10: Unauthorized users must not modify project financial data
  if (!user) {
    return apiForbidden("Unauthorized: Authentication required to amend financial expenses.");
  }

  if (!can(user, "update", "expense")) {
    return apiForbidden("Access Denied: Only Finance Managers and Administrators can amend financial expenses.");
  }

  try {
    const body = await req.json();
    const parsed = expenseUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid update payload", parsed.error.format());
    }

    const { id, title, amount, description } = parsed.data;

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      return apiNotFound("Expense certificate not found");
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        ...(title ? { title } : {}),
        ...(amount ? { amount } : {}),
        ...(description !== undefined ? { description } : {}),
      },
      include: { category: true, project: true },
    });

    await logActivity({
      actorId: user?.id || "demo-finance",
      actorName: user?.name || "Nasir Uddin, FCA",
      actorRole: user?.role || "FINANCE_MANAGER",
      action: "UPDATE",
      entity: "Expense",
      entityId: id,
      meta: { title, amount },
    });

    return apiSuccess({ expense: updated, message: "Expense certificate amended successfully" });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to update expense", null, 500);
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  // Rule 10: Unauthorized users must not modify project financial data
  if (!user) {
    return apiForbidden("Unauthorized: Authentication required to delete financial expenses.");
  }

  if (!can(user, "delete", "expense")) {
    return apiForbidden("Access Denied: Only Finance Managers and Administrators can delete financial expenses.");
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return apiError("BAD_REQUEST", "Expense ID is required");

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) return apiNotFound("Expense certificate not found");

    await prisma.expense.delete({ where: { id } });

    await logActivity({
      actorId: user?.id || "demo-finance",
      actorName: user?.name || "Nasir Uddin, FCA",
      actorRole: user?.role || "FINANCE_MANAGER",
      action: "DELETE",
      entity: "Expense",
      entityId: id,
      meta: { amount: existing.amount, title: existing.title },
    });

    return apiSuccess({ message: "Expense certificate purged from ledger" });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to delete expense", null, 500);
  }
}

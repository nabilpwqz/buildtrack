import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiError, apiForbidden } from "@/lib/api-response";
import { logActivity } from "@/lib/audit";
import { SessionUser } from "@/types";

const categoryCreateSchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  code: z.string().min(2, "Category code must be at least 2 characters").transform((v) => v.toUpperCase().trim()),
  description: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  // Allow preview / guest visitor read, or check permissions if user is signed in
  if (user && !can(user, "read", "budget") && !can(user, "read", "expense")) {
    return apiForbidden();
  }

  try {
    const categories = await prisma.expenseCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            expenses: true,
            budgets: true,
          },
        },
      },
    });

    // Compute aggregated spent per category
    const aggregates = await prisma.expense.groupBy({
      by: ["categoryId"],
      _sum: {
        amount: true,
      },
    });

    const spendMap = new Map<string, number>();
    for (const agg of aggregates) {
      spendMap.set(agg.categoryId, agg._sum.amount || 0);
    }

    const categoriesWithMetrics = categories.map((cat) => ({
      ...cat,
      totalSpent: spendMap.get(cat.id) || 0,
      expenseCount: cat._count.expenses,
      budgetCount: cat._count.budgets,
    }));

    return apiSuccess({ categories: categoriesWithMetrics });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to load categories", null, 500);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  // Rule 10: Unauthorized users must not modify project financial data
  if (!user) {
    return apiForbidden("Unauthorized: Authentication required to configure expense categories.");
  }

  if (user.role !== "ADMIN" && user.role !== "FINANCE_MANAGER") {
    await logActivity({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "UNAUTHORIZED_ATTEMPT",
      entity: "ExpenseCategory",
      entityId: "none",
      meta: { error: "403 Forbidden - Attempt to create expense category without finance authorization" },
    });
    return apiForbidden("Access Denied: Only Finance Managers and Administrators can create expense categories.");
  }

  try {
    const body = await req.json();
    const parsed = categoryCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid category data", parsed.error.format());
    }

    const { name, code, description } = parsed.data;

    // Check for existing name or code
    const existing = await prisma.expenseCategory.findFirst({
      where: {
        OR: [{ name: { equals: name, mode: "insensitive" } }, { code: { equals: code, mode: "insensitive" } }],
      },
    });

    if (existing) {
      return apiError(
        "CONFLICT",
        `An expense category with ${existing.code.toUpperCase() === code.toUpperCase() ? "code" : "name"} '${existing.code.toUpperCase() === code.toUpperCase() ? code : name}' already exists.`,
        null,
        409
      );
    }

    const category = await prisma.expenseCategory.create({
      data: {
        name,
        code,
        description,
      },
    });

    await logActivity({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "CREATE",
      entity: "ExpenseCategory",
      entityId: category.id,
      meta: { name, code, description },
    });

    return apiSuccess({ category, message: "Expense category registered successfully" }, 201);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to create category", null, 500);
  }
}


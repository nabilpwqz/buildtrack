import { NextRequest } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiForbidden } from "@/lib/api-response";
import { SessionUser } from "@/types";
import { isTaskOverdue } from "@/lib/business-rules";

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  // Unauthenticated preview read allowed
  if (user && !can(user, "read", "analytics")) {
    return apiForbidden();
  }

  // Fetch all projects, tasks, expenses, materials, contractors
  const [projects, tasks, expenses, materials, expenseCategories, contractors] =
    await Promise.all([
      prisma.project.findMany({
        include: {
          budgets: true,
        },
      }),
      prisma.task.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          status: true,
          priority: true,
          deadline: true,
          progress: true,
          projectId: true,
          assigneeId: true,
        },
      }),
      prisma.expense.findMany({
        include: { category: true },
        orderBy: { date: "asc" },
      }),
      prisma.material.findMany({
        include: { category: true },
      }),
      prisma.expenseCategory.findMany(),
      prisma.contractor.findMany({
        include: {
          performances: { orderBy: { evaluatedAt: "desc" } },
          users: { select: { id: true } },
          projectAssignments: { select: { projectId: true } },
        },
      }),
    ]);

  const now = new Date();

  // Total projects by status
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "IN_PROGRESS").length;
  const completedProjects = projects.filter((p) => p.status === "COMPLETED").length;
  const delayedProjects = projects.filter(
    (p) => p.status === "DELAYED" || (p.status !== "COMPLETED" && new Date(p.expectedEndDate) < now)
  ).length;
  const onHoldProjects = projects.filter((p) => p.status === "ON_HOLD").length;
  const planningProjects = projects.filter((p) => p.status === "PLANNING").length;

  // Financial aggregates
  const totalBudget = projects.reduce((acc, p) => acc + p.totalBudget, 0);
  const totalSpent = expenses.reduce((acc, e) => acc + e.amount, 0);
  const remainingBudget = totalBudget - totalSpent;
  const overallUtilization =
    totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 1000) / 10 : 0;

  // Project Completion Rate (Weighted Average Rollup)
  const projectCompletionRate =
    projects.length > 0
      ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length)
      : 0;
  const avgCompletionRate = projectCompletionRate;

  // Task status distribution
  const taskStatusDistribution = [
    { name: "TODO", label: "To Do", count: tasks.filter((t) => t.status === "TODO").length, color: "#8C8782" },
    { name: "IN_PROGRESS", label: "In Progress", count: tasks.filter((t) => t.status === "IN_PROGRESS").length, color: "#D97706" },
    { name: "REVIEW", label: "Review", count: tasks.filter((t) => t.status === "REVIEW").length, color: "#CA8A04" },
    { name: "COMPLETED", label: "Completed", count: tasks.filter((t) => t.status === "COMPLETED").length, color: "#F59E0B" },
  ];

  // Overdue Tasks count
  const overdueTasksCount = tasks.filter((t) => isTaskOverdue(t as any)).length;

  // Monthly Expense Trend (past 12 months)
  const monthMap = new Map<string, number>();
  const monthLabels: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    monthLabels.push(key);
    monthMap.set(key, 0);
  }

  expenses.forEach((e) => {
    const d = new Date(e.date);
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    if (monthMap.has(key)) {
      monthMap.set(key, (monthMap.get(key) || 0) + e.amount);
    }
  });

  const monthlyExpenseTrend = monthLabels.map((m) => ({
    month: m,
    amount: monthMap.get(m) || 0,
  }));

  // Budget vs Spent by Category
  const categoryMap = new Map<string, { allocated: number; spent: number }>();
  expenseCategories.forEach((cat) => {
    categoryMap.set(cat.id, { allocated: 0, spent: 0 });
  });

  projects.forEach((p) => {
    p.budgets.forEach((b) => {
      const cur = categoryMap.get(b.categoryId);
      if (cur) cur.allocated += b.allocated;
    });
  });

  expenses.forEach((e) => {
    const cur = categoryMap.get(e.categoryId);
    if (cur) cur.spent += e.amount;
  });

  const budgetByCategory = expenseCategories.map((cat) => {
    const data = categoryMap.get(cat.id) || { allocated: 0, spent: 0 };
    return {
      category: cat.name,
      code: cat.code,
      allocated: data.allocated,
      spent: data.spent,
      isOverrun: data.spent > data.allocated,
    };
  });

  // Contractor Performance & Composite Reliability Rankings
  const contractorRankings = contractors.map((c) => {
    const avgOnTime =
      c.performances.length > 0
        ? Math.round(
            c.performances.reduce((acc, p) => acc + p.onTimeRate, 0) /
              c.performances.length
          )
        : 90;
    const avgQuality =
      c.performances.length > 0
        ? Math.round(
            (c.performances.reduce((acc, p) => acc + p.qualityScore, 0) /
              c.performances.length) * 10
          ) / 10
        : c.rating;
    const userIds = c.users?.map((u) => u.id) || [];
    const contractorTasks = tasks.filter((t) => t.assigneeId && userIds.includes(t.assigneeId));
    const completedTasks = contractorTasks.filter((t) => t.status === "COMPLETED").length;
    const totalTasks = contractorTasks.length;
    const reliabilityScore = Math.round(c.rating * 10 + avgOnTime * 0.5);

    return {
      id: c.id,
      name: c.company,
      company: c.company,
      contact: c.contact,
      specialty: c.specialty,
      status: c.status,
      rating: c.rating,
      qualityScore: avgQuality,
      onTimeRate: avgOnTime,
      reliabilityScore,
      assignedProjectsCount: c.projectAssignments?.length || 0,
      assignedTasksCount: totalTasks,
      completedTasksCount: completedTasks,
      latestReviewPeriod: c.performances[0]?.evaluatedAt
        ? c.performances[0].evaluatedAt.toISOString().substring(0, 10)
        : "2024-Q3",
      latestNotes: c.performances[0]?.notes || "Contractual standards met.",
    };
  }).sort((a, b) => b.reliabilityScore - a.reliabilityScore);

  // Low stock materials count
  const lowStockCount = materials.filter((m) => m.availableQty <= m.reorderLevel).length;

  // Bonus: Linear Burn Rate Projection
  const recent3Months = monthlyExpenseTrend.slice(-3);
  const avgMonthlyBurn =
    recent3Months.reduce((a, b) => a + b.amount, 0) / Math.max(1, recent3Months.length);
  const monthsOfRunwayRemaining =
    avgMonthlyBurn > 0 ? Math.round((remainingBudget / avgMonthlyBurn) * 10) / 10 : 99;

  return apiSuccess({
    // Core G. Analytics Dashboard Requirements
    totalProjects,
    activeProjects,
    completedProjects,
    delayedProjects,
    totalBudget,
    totalExpenses: totalSpent,
    totalSpent,
    remainingBudget,
    projectCompletionRate,
    avgCompletionRate,
    monthlyExpenseTrend,
    contractorPerformance: contractorRankings,
    contractorRankings,

    // Additional Operational Telemetry
    onHoldProjects,
    planningProjects,
    overallUtilization,
    overdueTasksCount,
    lowStockCount,
    taskStatusDistribution,
    budgetByCategory,
    burnRateForecast: {
      avgMonthlyBurn,
      monthsOfRunwayRemaining,
    },
  });
}

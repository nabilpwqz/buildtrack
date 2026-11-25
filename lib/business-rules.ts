import prisma from "@/lib/db";

export interface DependencyPair {
  taskId: string;
  dependsOnId: string;
}

/**
 * Cycle detection for task dependencies.
 * If adding an edge from taskId -> dependsOnId forms a directed cycle, return true.
 */
export function hasCircularDependency(
  taskId: string,
  newDependsOnId: string,
  existingDependencies: DependencyPair[]
): boolean {
  if (taskId === newDependsOnId) return true;

  // Build adjacency list: node -> array of nodes it depends on
  const adj = new Map<string, string[]>();

  for (const dep of existingDependencies) {
    const list = adj.get(dep.taskId) || [];
    list.push(dep.dependsOnId);
    adj.set(dep.taskId, list);
  }

  // Add the candidate edge
  const candidateList = adj.get(taskId) || [];
  candidateList.push(newDependsOnId);
  adj.set(taskId, candidateList);

  // DFS to detect cycle starting from taskId
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(curr: string): boolean {
    visited.add(curr);
    recursionStack.add(curr);

    const neighbors = adj.get(curr) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(curr);
    return false;
  }

  return dfs(taskId);
}

/**
 * Business Rule: Task cannot move to IN_PROGRESS or COMPLETED while any dependency is incomplete (blocked)
 */
export interface TransitionCheckResult {
  allowed: boolean;
  reason?: string;
  blockedBy?: { id: string; title: string; status: string }[];
}

export function checkTaskTransitionRule(
  targetStatus: string,
  prerequisites: { id: string; title: string; status: string }[]
): TransitionCheckResult {
  if (targetStatus === "IN_PROGRESS" || targetStatus === "COMPLETED") {
    const incomplete = prerequisites.filter((p) => p.status !== "COMPLETED");
    if (incomplete.length > 0) {
      return {
        allowed: false,
        reason: `Cannot move task to ${targetStatus} because ${incomplete.length} prerequisite task(s) are incomplete.`,
        blockedBy: incomplete,
      };
    }
  }
  return { allowed: true };
}

/**
 * Business Rule: Overdue = deadline < today and status != Completed
 */
export function isTaskOverdue(task: { deadline: string | Date; status: string }): boolean {
  if (task.status === "COMPLETED") return false;
  const deadlineDate = new Date(task.deadline);
  const now = new Date();
  return deadlineDate.getTime() < now.getTime();
}

/**
 * Business Rule: Project is Delayed if it has overdue critical tasks or projected end date > expected end date
 */
export function isProjectDelayed(
  project: { expectedEndDate: string | Date; status: string },
  tasks: { deadline: string | Date; status: string; priority: string }[],
  projectedEndDate?: string | Date | null
): boolean {
  if (project.status === "COMPLETED") return false;

  // Check overdue critical tasks
  const hasOverdueCritical = tasks.some(
    (t) => t.priority === "CRITICAL" && isTaskOverdue(t)
  );
  if (hasOverdueCritical) return true;

  // Check projected end date > expected end date
  if (projectedEndDate) {
    const projected = new Date(projectedEndDate).getTime();
    const expected = new Date(project.expectedEndDate).getTime();
    if (projected > expected) return true;
  }

  return false;
}

/**
 * Business Rule: Progress rollup computed from tasks (weighted by estimated hours)
 */
export function calculateWeightedProgress(
  tasks: { progress: number; estimatedHours: number }[]
): number {
  if (!tasks || tasks.length === 0) return 0;

  let totalHours = 0;
  let earnedHours = 0;

  for (const t of tasks) {
    const hours = t.estimatedHours > 0 ? t.estimatedHours : 1;
    totalHours += hours;
    earnedHours += hours * (Math.min(100, Math.max(0, t.progress)) / 100);
  }

  if (totalHours === 0) return 0;
  return Math.round((earnedHours / totalHours) * 100);
}

/**
 * Server-side Budget Calculations
 * Computes allocated, spent, remaining, utilization %, and overrun alerts (warn at 80%, critical over 100%)
 */
export interface BudgetCategoryBreakdown {
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  allocated: number;
  spent: number;
  remaining: number;
  utilizationRate: number; // percentage
  isWarning: boolean; // >= 80%
  isOverrun: boolean; // > 100%
}

export interface ProjectBudgetSummary {
  projectId: string;
  projectName: string;
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  utilizationRate: number;
  isWarning: boolean;
  isOverrun: boolean;
  categories: BudgetCategoryBreakdown[];
}

export function computeBudgetSummary(
  project: { id: string; name: string; totalBudget: number },
  budgets: { categoryId: string; allocated: number; category: { name: string; code: string } }[],
  expenses: { categoryId: string; amount: number }[]
): ProjectBudgetSummary {
  const expenseMap = new Map<string, number>();
  for (const exp of expenses) {
    const prev = expenseMap.get(exp.categoryId) || 0;
    expenseMap.set(exp.categoryId, prev + exp.amount);
  }

  let totalAllocated = 0;
  let totalSpent = 0;

  const categories: BudgetCategoryBreakdown[] = budgets.map((b) => {
    const spent = expenseMap.get(b.categoryId) || 0;
    totalAllocated += b.allocated;
    totalSpent += spent;

    const remaining = b.allocated - spent;
    const rate = b.allocated > 0 ? (spent / b.allocated) * 100 : 0;

    return {
      categoryId: b.categoryId,
      categoryName: b.category.name,
      categoryCode: b.category.code,
      allocated: b.allocated,
      spent,
      remaining,
      utilizationRate: Math.round(rate * 10) / 10,
      isWarning: rate >= 80 && rate <= 100,
      isOverrun: rate > 100,
    };
  });

  const baseBudget = project.totalBudget > 0 ? project.totalBudget : totalAllocated;
  const overallRemaining = baseBudget - totalSpent;
  const overallRate = baseBudget > 0 ? (totalSpent / baseBudget) * 100 : 0;

  return {
    projectId: project.id,
    projectName: project.name,
    totalBudget: baseBudget,
    totalSpent,
    remainingBudget: overallRemaining,
    utilizationRate: Math.round(overallRate * 10) / 10,
    isWarning: overallRate >= 80 && overallRate <= 100,
    isOverrun: overallRate > 100,
    categories,
  };
}


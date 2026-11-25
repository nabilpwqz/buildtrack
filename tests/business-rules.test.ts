import { describe, it, expect } from "vitest";
import {
  checkTaskTransitionRule,
  isTaskOverdue,
  isProjectDelayed,
  calculateWeightedProgress,
  computeBudgetSummary,
} from "@/lib/business-rules";

describe("Construction Business Rules Engine", () => {
  describe("checkTaskTransitionRule", () => {
    it("rejects transition to IN_PROGRESS when prerequisites are incomplete", () => {
      const prerequisites = [
        { id: "p1", title: "Excavation", status: "COMPLETED" },
        { id: "p2", title: "Bored Piling", status: "IN_PROGRESS" },
      ];

      const result = checkTaskTransitionRule("IN_PROGRESS", prerequisites);
      expect(result.allowed).toBe(false);
      expect(result.blockedBy?.length).toBe(1);
      expect(result.blockedBy?.[0].id).toBe("p2");
    });

    it("allows transition to IN_PROGRESS when all prerequisites are COMPLETED", () => {
      const prerequisites = [
        { id: "p1", title: "Excavation", status: "COMPLETED" },
        { id: "p2", title: "Bored Piling", status: "COMPLETED" },
      ];

      const result = checkTaskTransitionRule("IN_PROGRESS", prerequisites);
      expect(result.allowed).toBe(true);
    });

    it("allows moving to TODO even if prerequisites are incomplete", () => {
      const prerequisites = [
        { id: "p1", title: "Excavation", status: "TODO" },
      ];
      const result = checkTaskTransitionRule("TODO", prerequisites);
      expect(result.allowed).toBe(true);
    });
  });

  describe("isTaskOverdue", () => {
    it("flags task as overdue when deadline < now and status != COMPLETED", () => {
      const pastDeadline = new Date(Date.now() - 5 * 86400000);
      expect(isTaskOverdue({ deadline: pastDeadline, status: "IN_PROGRESS" })).toBe(true);
      expect(isTaskOverdue({ deadline: pastDeadline, status: "TODO" })).toBe(true);
    });

    it("does NOT flag completed task as overdue even if deadline has passed", () => {
      const pastDeadline = new Date(Date.now() - 5 * 86400000);
      expect(isTaskOverdue({ deadline: pastDeadline, status: "COMPLETED" })).toBe(false);
    });

    it("does NOT flag task with future deadline as overdue", () => {
      const futureDeadline = new Date(Date.now() + 10 * 86400000);
      expect(isTaskOverdue({ deadline: futureDeadline, status: "IN_PROGRESS" })).toBe(false);
    });
  });

  describe("calculateWeightedProgress", () => {
    it("computes weighted rollup percentage correctly based on estimatedHours", () => {
      const tasks = [
        { progress: 100, estimatedHours: 80 }, // earned: 80
        { progress: 50, estimatedHours: 20 },  // earned: 10
      ];
      // Total hours: 100, earned: 90 => 90%
      expect(calculateWeightedProgress(tasks)).toBe(90);
    });

    it("returns 0 when task list is empty", () => {
      expect(calculateWeightedProgress([])).toBe(0);
    });
  });

  describe("computeBudgetSummary", () => {
    it("correctly identifies budget overruns (>100%) and warnings (80%-100%)", () => {
      const project = { id: "p1", name: "Metro Bridge", totalBudget: 100000 };
      const budgets = [
        { categoryId: "c1", allocated: 50000, category: { name: "Steel", code: "EXP-STL" } },
        { categoryId: "c2", allocated: 50000, category: { name: "Concrete", code: "EXP-CON" } },
      ];
      const expenses = [
        { categoryId: "c1", amount: 55000 }, // 110% Overrun!
        { categoryId: "c2", amount: 42000 }, // 84% Warning!
      ];

      const summary = computeBudgetSummary(project, budgets, expenses);
      expect(summary.totalSpent).toBe(97000);
      expect(summary.remainingBudget).toBe(3000);
      expect(summary.utilizationRate).toBe(97);

      const cat1 = summary.categories.find((c) => c.categoryId === "c1");
      expect(cat1?.isOverrun).toBe(true);

      const cat2 = summary.categories.find((c) => c.categoryId === "c2");
      expect(cat2?.isWarning).toBe(true);
      expect(cat2?.isOverrun).toBe(false);
    });
  });
});


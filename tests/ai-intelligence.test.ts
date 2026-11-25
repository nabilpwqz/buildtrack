import { describe, it, expect } from "vitest";
import { calculateEarnedValue, analyzeProjectRisks } from "../lib/ai-intelligence";

describe("AI Construction Intelligence Engine", () => {
  it("calculates Earned Value Analysis metrics correctly for on-budget project", () => {
    const startDate = new Date(Date.now() - 30 * 86400000).toISOString();
    const expectedEndDate = new Date(Date.now() + 30 * 86400000).toISOString();

    const eva = calculateEarnedValue({
      totalBudget: 1000000,
      calculatedProgress: 50,
      totalSpent: 500000,
      startDate,
      expectedEndDate,
    });

    expect(eva.budgetAtCompletion).toBe(1000000);
    expect(eva.earnedValue).toBe(500000);
    expect(eva.actualCost).toBe(500000);
    expect(eva.cpi).toBe(1.0);
    expect(eva.spi).toBeGreaterThanOrEqual(0.9);
    expect(eva.status).toBe("OPTIMAL");
  });

  it("detects critical cost and schedule overrun when CPI and SPI fall below threshold", () => {
    const startDate = new Date(Date.now() - 50 * 86400000).toISOString();
    const expectedEndDate = new Date(Date.now() + 10 * 86400000).toISOString();

    const eva = calculateEarnedValue({
      totalBudget: 2000000,
      calculatedProgress: 25,
      totalSpent: 1800000,
      startDate,
      expectedEndDate,
    });

    expect(eva.cpi).toBeLessThan(0.85);
    expect(eva.status).toBe("CRITICAL_OVERRUN");
    expect(eva.varianceAtCompletion).toBeLessThan(0);
  });

  it("analyzes project risks and produces actionable mitigation interventions", () => {
    const startDate = new Date(Date.now() - 40 * 86400000).toISOString();
    const expectedEndDate = new Date(Date.now() + 20 * 86400000).toISOString();

    const eva = calculateEarnedValue({
      totalBudget: 1500000,
      calculatedProgress: 30,
      totalSpent: 1200000,
      startDate,
      expectedEndDate,
    });

    const risk = analyzeProjectRisks({
      eva,
      overdueTasksCount: 4,
      lowStockItemsCount: 2,
      contractorCount: 3,
    });

    expect(risk.overallRiskLevel).toBe("CRITICAL");
    expect(risk.projectedDelayDays).toBeGreaterThan(0);
    expect(risk.criticalFactors.length).toBeGreaterThanOrEqual(2);
    expect(risk.recommendedInterventions.length).toBeGreaterThan(0);
  });
});


/**
 * BuildTrack AI Construction Intelligence & Earned Value Analytics Engine
 * Provides predictive delay modeling, earned value variance auditing, and risk scoring.
 */

export interface EarnedValueMetrics {
  plannedValue: number; // PV
  earnedValue: number; // EV
  actualCost: number; // AC
  budgetAtCompletion: number; // BAC
  costVariance: number; // CV = EV - AC
  scheduleVariance: number; // SV = EV - PV
  cpi: number; // Cost Performance Index = EV / AC
  spi: number; // Schedule Performance Index = EV / PV
  estimateAtCompletion: number; // EAC = BAC / CPI
  varianceAtCompletion: number; // VAC = BAC - EAC
  healthScore: number; // 0 - 100
  status: "OPTIMAL" | "CAUTION" | "CRITICAL_OVERRUN";
}

export interface PredictiveRiskAssessment {
  overallRiskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  projectedDelayDays: number;
  criticalFactors: {
    factor: string;
    impact: "HIGH" | "MEDIUM" | "LOW";
    description: string;
    mitigationAction: string;
  }[];
  recommendedInterventions: string[];
}

/**
 * Computes Earned Value Analysis (EVA) metrics strictly per ISO 21508 / PMI standards.
 */
export function calculateEarnedValue(params: {
  totalBudget: number;
  calculatedProgress: number; // 0 to 100
  totalSpent: number;
  startDate: string | Date;
  expectedEndDate: string | Date;
}): EarnedValueMetrics {
  const { totalBudget, calculatedProgress, totalSpent, startDate, expectedEndDate } = params;

  const start = new Date(startDate).getTime();
  const end = new Date(expectedEndDate).getTime();
  const now = Date.now();

  const totalDuration = Math.max(1, end - start);
  const elapsed = Math.max(0, Math.min(totalDuration, now - start));

  // Planned Progress % based on linear schedule baseline
  const plannedProgressPct = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

  const BAC = totalBudget;
  const PV = (plannedProgressPct / 100) * BAC;
  const EV = (calculatedProgress / 100) * BAC;
  const AC = totalSpent;

  const CV = EV - AC;
  const SV = EV - PV;

  const cpi = AC > 0 ? Number((EV / AC).toFixed(2)) : 1.0;
  const spi = PV > 0 ? Number((EV / PV).toFixed(2)) : 1.0;

  const EAC = cpi > 0 ? Math.round(BAC / cpi) : BAC;
  const VAC = BAC - EAC;

  // Composite Project Health Score (0 - 100)
  let healthScore = Math.round(cpi * 50 + spi * 50);
  if (healthScore > 100) healthScore = 100;
  if (healthScore < 0) healthScore = 0;

  let status: "OPTIMAL" | "CAUTION" | "CRITICAL_OVERRUN" = "OPTIMAL";
  if (cpi < 0.85 || spi < 0.85) {
    status = "CRITICAL_OVERRUN";
  } else if (cpi < 0.95 || spi < 0.95) {
    status = "CAUTION";
  }

  return {
    plannedValue: Math.round(PV),
    earnedValue: Math.round(EV),
    actualCost: Math.round(AC),
    budgetAtCompletion: Math.round(BAC),
    costVariance: Math.round(CV),
    scheduleVariance: Math.round(SV),
    cpi,
    spi,
    estimateAtCompletion: EAC,
    varianceAtCompletion: VAC,
    healthScore,
    status,
  };
}

/**
 * Predictive Schedule Delay & Site Risk Intelligence.
 */
export function analyzeProjectRisks(params: {
  eva: EarnedValueMetrics;
  overdueTasksCount: number;
  lowStockItemsCount: number;
  contractorCount: number;
}): PredictiveRiskAssessment {
  const { eva, overdueTasksCount, lowStockItemsCount, contractorCount } = params;

  let projectedDelayDays = 0;
  const criticalFactors: PredictiveRiskAssessment["criticalFactors"] = [];
  const recommendedInterventions: string[] = [];

  // Factor 1: Schedule Performance Index (SPI)
  if (eva.spi < 0.9) {
    const delayFromSpi = Math.round((1 - eva.spi) * 60);
    projectedDelayDays += delayFromSpi;
    criticalFactors.push({
      factor: "Schedule Velocity Slippage",
      impact: "HIGH",
      description: `SPI of ${eva.spi} indicates work package completion is trailing behind planned baseline pace.`,
      mitigationAction: "Authorize selective double-shift work on non-critical structural framing activities.",
    });
  }

  // Factor 2: Overdue Tasks Bottleneck
  if (overdueTasksCount > 0) {
    const delayFromTasks = overdueTasksCount * 4;
    projectedDelayDays += delayFromTasks;
    criticalFactors.push({
      factor: "Blocked Critical Path Dependencies",
      impact: overdueTasksCount > 3 ? "HIGH" : "MEDIUM",
      description: `${overdueTasksCount} task(s) currently past authorized completion milestones.`,
      mitigationAction: "Re-sequence prerequisite task dependencies using Directed Acyclic Graph CPM.",
    });
    recommendedInterventions.push("Issue formal Contractor Progress Acceleration Notice under FIDIC Clause 8.6.");
  }

  // Factor 3: Material Supply Stockouts
  if (lowStockItemsCount > 0) {
    projectedDelayDays += lowStockItemsCount * 3;
    criticalFactors.push({
      factor: "Supply Chain Material Depletion",
      impact: "MEDIUM",
      description: `${lowStockItemsCount} critical inventory categories breached safety buffer thresholds.`,
      mitigationAction: "Trigger emergency procurement PO dispatch to secondary tier-1 regional suppliers.",
    });
    recommendedInterventions.push("Expedite ready-mix concrete batching plant and rebar fabrication deliveries.");
  }

  // Factor 4: Cost Overrun Impact on Working Capital
  if (eva.cpi < 0.92) {
    criticalFactors.push({
      factor: "Unbudgeted Contingency Expenditure",
      impact: "HIGH",
      description: `CPI at ${eva.cpi} forecasts a projected completion cost variance of $${Math.abs(eva.varianceAtCompletion).toLocaleString()}.`,
      mitigationAction: "Initiate formal Value Engineering audit to trim non-structural architectural finishes.",
    });
    recommendedInterventions.push("Freeze uncommitted discretionary procurement allocations pending controller review.");
  }

  // Determine overall risk level
  let overallRiskLevel: PredictiveRiskAssessment["overallRiskLevel"] = "LOW";
  if (projectedDelayDays > 25 || eva.status === "CRITICAL_OVERRUN") {
    overallRiskLevel = "CRITICAL";
  } else if (projectedDelayDays > 10 || criticalFactors.length >= 2) {
    overallRiskLevel = "HIGH";
  } else if (projectedDelayDays > 0 || criticalFactors.length === 1) {
    overallRiskLevel = "MODERATE";
  }

  if (recommendedInterventions.length === 0) {
    recommendedInterventions.push("Maintain current production schedule and baseline progress verification protocols.");
  }

  return {
    overallRiskLevel,
    projectedDelayDays,
    criticalFactors,
    recommendedInterventions,
  };
}


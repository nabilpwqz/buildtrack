"use client";

import React, { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AdminRealtimeTelemetry } from "@/components/admin-realtime-telemetry";
import {
  Building2,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle,
  HardHat,
  ArrowUpRight,
  Boxes,
  ShieldAlert,
  ShieldCheck,
  Flame,
  CheckSquare,
  Trello,
  Plus,
  Layers,
  Award,
  Users2,
  Star,
  Receipt,
} from "@/components/ui/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/utils";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Cell,
} from "recharts";

// Lazy-loaded 3D Skyline Canvas
const Scene = dynamic(() => import("@/components/3d/scene").then((m) => m.Scene), {
  ssr: false,
  loading: () => (
    <div className="w-full h-88 bg-bg-1 animate-pulse flex items-center justify-center font-mono text-xs text-steel">
      CALIBRATING 3D SKYLINE ENGINE...
    </div>
  ),
});

const SkylineScene = dynamic(() => import("@/components/3d/skyline"), {
  ssr: false,
});

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Next-Level Interactive Controls for Analytics & Portfolio Sections
  const [burnHorizon, setBurnHorizon] = useState<3 | 6 | 12>(12);
  const [varianceFilter, setVarianceFilter] = useState<"ALL" | "OVERRUN">("ALL");
  const [contractorFilter, setContractorFilter] = useState<"ALL" | "TOP" | "ACTIVE">("ALL");
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>("ALL");

  const loadDashboardData = useCallback(async () => {
    try {
      const [summaryRes, projRes, sessionRes] = await Promise.all([
        fetch("/api/v1/analytics/summary", { cache: "no-store" }),
        fetch("/api/v1/projects?pageSize=50", { cache: "no-store" }),
        fetch("/api/auth/session", { cache: "no-store" }),
      ]);
      if (summaryRes.ok) {
        const s = await summaryRes.json();
        setData(s);
      }
      if (projRes.ok) {
        const p = await projRes.json();
        setProjects(p.projects || []);
      }
      if (sessionRes.ok) {
        const sess = await sessionRes.json();
        setSessionUser(sess?.user || null);
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold uppercase tracking-wider text-foreground">
            COMMAND & <span className="text-amber">INTELLIGENCE</span>
          </h1>
          <p className="text-xs font-mono text-steel uppercase tracking-widest mt-1">
            REAL-TIME DIGITAL TWIN & CAPITAL PROGRAM TELEMETRY
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/tasks/kanban"
            className="px-3.5 py-2 bg-bg-2 border border-border hover:border-amber text-foreground hover:text-amber text-xs font-mono uppercase tracking-wider rounded-sm transition flex items-center gap-1.5"
          >
            <Trello className="w-3.5 h-3.5 text-amber" />
            <span>KANBAN BOARD</span>
          </Link>

          <Link
            href="/projects/new"
            className="px-4 py-2 bg-amber hover:bg-amber-glow text-bg-0 text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition shadow-sm flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5 text-bg-0" />
            <span>NEW PROJECT</span>
          </Link>
        </div>
      </div>

      {/* Active Role Workstation Banner */}
      {sessionUser && (
        <div className="p-3.5 bg-bg-1 border border-border rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono shadow-plate">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xs bg-amber/15 border border-amber/40 text-amber shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-steel uppercase tracking-widest font-bold">
                  ACTIVE WORKSTATION:
                </span>
                <span className="px-2 py-0.5 rounded-xs bg-amber/20 text-amber border border-amber/40 text-xs font-bold uppercase tracking-wider">
                  {String(sessionUser.role || "ADMIN").replace(/_/g, " ")}
                </span>
              </div>
              <div className="text-xs text-foreground font-semibold mt-0.5">
                Operator: <span className="text-gold">{sessionUser.name || "Authorized Operator"}</span> &middot; {sessionUser.email}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-steel shrink-0">
            {sessionUser.role === "PROJECT_MANAGER" && (
              <span className="text-amber">Authorized: Full CPM Gantt, Task Assignment, Budget Monitoring</span>
            )}
            {sessionUser.role === "CONTRACTOR" && (
              <span className="text-amber">Authorized: Work Package Execution, Material Indents, Progress Logs</span>
            )}
            {sessionUser.role === "SITE_ENGINEER" && (
              <span className="text-amber">Authorized: Daily Operations Verification, Material Consumption</span>
            )}
            {sessionUser.role === "FINANCE_MANAGER" && (
              <span className="text-amber">Authorized: Capital Disbursement, EVM Cost Variance (CPI/SPI)</span>
            )}
            {sessionUser.role === "ADMIN" && (
              <span className="text-amber">Authorized: Root Governance, Permissions, Enterprise Audit</span>
            )}
          </div>
        </div>
      )}

      {/* Admin-Only Real-Time Database Telemetry */}
      <AdminRealtimeTelemetry
        isAdmin={sessionUser?.role === "ADMIN"}
        onDatabaseUpdate={loadDashboardData}
      />

      {/* G. Analytics Dashboard: 8 Core Telemetry Scorecards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Projects */}
        <div className="steel-card p-4 rounded-sm border border-border bg-bg-1 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-steel">
            <span>TOTAL PROJECTS</span>
            <Building2 className="w-4 h-4 text-amber" />
          </div>
          <div className="text-2xl font-heading font-bold text-foreground">
            {data?.totalProjects ?? 0}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-steel">
            <span className="text-amber font-semibold">{data?.activeProjects ?? 0} active</span>
            <span>•</span>
            <span>{data?.planningProjects ?? 0} planning</span>
          </div>
          <div className="h-1 w-full bg-bg-0 rounded-full overflow-hidden border border-border">
            <div className="h-full bg-amber transition-all w-full" />
          </div>
        </div>

        {/* 2. Active Projects */}
        <div className="steel-card p-4 rounded-sm border border-border bg-bg-1 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-steel">
            <span>ACTIVE PROJECTS</span>
            <HardHat className="w-4 h-4 text-amber" />
          </div>
          <div className="text-2xl font-heading font-bold text-amber">
            {data?.activeProjects ?? 0}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-steel">
            <span>In execution phase on site</span>
          </div>
          <div className="h-1 w-full bg-bg-0 rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-amber transition-all"
              style={{
                width: `${data?.totalProjects > 0 ? (data.activeProjects / data.totalProjects) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* 3. Completed Projects */}
        <div className="steel-card p-4 rounded-sm border border-border bg-bg-1 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-steel">
            <span>COMPLETED PROJECTS</span>
            <CheckCircle className="w-4 h-4 text-gold" />
          </div>
          <div className="text-2xl font-heading font-bold text-gold">
            {data?.completedProjects ?? 0}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-steel">
            <span className="text-gold font-semibold">100% Commissioned & Handed Over</span>
          </div>
          <div className="h-1 w-full bg-bg-0 rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-gold transition-all"
              style={{
                width: `${data?.totalProjects > 0 ? (data.completedProjects / data.totalProjects) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* 4. Delayed Projects */}
        <div className="steel-card p-4 rounded-sm border border-border bg-bg-1 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-steel">
            <span>DELAYED PROJECTS</span>
            <AlertTriangle className={`w-4 h-4 ${data?.delayedProjects > 0 ? "text-crimson" : "text-steel"}`} />
          </div>
          <div className={`text-2xl font-heading font-bold ${data?.delayedProjects > 0 ? "text-crimson" : "text-foreground"}`}>
            {data?.delayedProjects ?? 0}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            {data?.delayedProjects > 0 ? (
              <span className="text-crimson font-semibold">Schedule slippage flagged</span>
            ) : (
              <span className="text-steel">Zero critical path slippage</span>
            )}
          </div>
          <div className="h-1 w-full bg-bg-0 rounded-full overflow-hidden border border-border">
            <div
              className={`h-full transition-all ${data?.delayedProjects > 0 ? "bg-crimson" : "bg-steel"}`}
              style={{
                width: `${data?.totalProjects > 0 ? (data.delayedProjects / data.totalProjects) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* 5. Total Budget */}
        <div className="steel-card p-4 rounded-sm border border-border bg-bg-1 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-steel">
            <span>TOTAL BUDGET</span>
            <DollarSign className="w-4 h-4 text-amber" />
          </div>
          <div className="text-2xl font-heading font-bold text-foreground">
            {formatCurrency(data?.totalBudget ?? 0)}
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-steel">
            <span>Authorized capital program</span>
          </div>
          <div className="h-1 w-full bg-bg-0 rounded-full overflow-hidden border border-border">
            <div className="h-full bg-amber transition-all w-full" />
          </div>
        </div>

        {/* 6. Total Expenses */}
        <div className="steel-card p-4 rounded-sm border border-border bg-bg-1 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-steel">
            <span>TOTAL EXPENSES</span>
            <Receipt className="w-4 h-4 text-amber" />
          </div>
          <div className="text-2xl font-heading font-bold text-amber">
            {formatCurrency(data?.totalExpenses ?? data?.totalSpent ?? 0)}
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-steel">
            <span>Utilization:</span>
            <span className={data?.overallUtilization > 100 ? "text-crimson font-bold" : "text-amber font-semibold"}>
              {data?.overallUtilization ?? 0}%
            </span>
          </div>
          <div className="h-1 w-full bg-bg-0 rounded-full overflow-hidden border border-border">
            <div
              className={`h-full transition-all ${
                data?.overallUtilization > 100 ? "bg-crimson" : data?.overallUtilization > 80 ? "bg-amber" : "bg-gold"
              }`}
              style={{ width: `${Math.min(100, data?.overallUtilization || 0)}%` }}
            />
          </div>
        </div>

        {/* 7. Remaining Budget */}
        <div className="steel-card p-4 rounded-sm border border-border bg-bg-1 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-steel">
            <span>REMAINING BUDGET</span>
            <DollarSign className="w-4 h-4 text-gold" />
          </div>
          <div className="text-2xl font-heading font-bold text-gold">
            {formatCurrency(data?.remainingBudget ?? 0)}
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-steel">
            <span>Runway: {data?.burnRateForecast?.monthsOfRunwayRemaining ?? 0} mo</span>
            <span className="text-gold font-semibold">Reserve Liquid</span>
          </div>
          <div className="h-1 w-full bg-bg-0 rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-gold transition-all"
              style={{
                width: `${
                  data?.totalBudget > 0
                    ? Math.max(0, Math.min(100, (data.remainingBudget / data.totalBudget) * 100))
                    : 100
                }%`,
              }}
            />
          </div>
        </div>

        {/* 8. Project Completion Rate */}
        <div className="steel-card p-4 rounded-sm border border-border bg-bg-1 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-steel">
            <span>PROJECT COMPLETION RATE</span>
            <TrendingUp className="w-4 h-4 text-gold" />
          </div>
          <div className="text-2xl font-heading font-bold text-gold">
            {data?.projectCompletionRate ?? data?.avgCompletionRate ?? 0}%
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-steel">
            <span>Weighted Rollup</span>
            <span className="text-foreground">{projects.length} Megaprojects</span>
          </div>
          <div className="h-1 w-full bg-bg-0 rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-gold transition-all"
              style={{ width: `${data?.projectCompletionRate ?? data?.avgCompletionRate ?? 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3D Skyline Visual Twin Plate */}
      <div className="steel-card p-0 overflow-hidden rounded-sm border border-border bg-bg-1 shadow-sm">
        <div className="px-5 py-3 bg-bg-0 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber animate-ping" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
              3D DIGITAL TWIN SKYLINE • INFRASTRUCTURE PORTFOLIO
            </span>
          </div>
          <div className="text-[10px] font-mono text-steel hidden sm:block">
            HEIGHT = PROGRESS % • COLOR = STATUS • CLICK TOWER TO INSPECT
          </div>
        </div>

        <div className="h-88 sm:h-96 w-full bg-bg-0 relative">
          <Scene camera={{ position: [22, 26, 28], fov: 46 }}>
            <SkylineScene projects={projects} />
          </Scene>
        </div>
      </div>

      {/* AI Construction Intelligence Portfolio EVA & Schedule Risk Hub */}
      <div className="steel-card p-5 rounded-sm border border-amber/40 bg-bg-1/90 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber" />
            <h2 className="text-xs font-heading text-amber uppercase font-bold tracking-wider">
              AI PORTFOLIO INTELLIGENCE & EARNED VALUE VARIANCE
            </h2>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-steel">
              ACTIVE RUNWAY: <strong className="text-foreground">{data?.burnRateForecast?.monthsOfRunwayRemaining ?? 12} MONTHS</strong>
            </span>
            <span className="px-2 py-0.5 rounded-xs bg-amber/20 text-amber border border-amber/40 font-bold">
              PORTFOLIO CPI: 0.98
            </span>
          </div>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2.5 bg-bg-2 rounded-xs border border-border">
              <div className="text-[10px] text-steel uppercase">Capital Commitment</div>
              <div className="text-sm font-bold text-foreground mt-0.5">
                {formatCurrency(data?.totalBudget ?? 0)}
              </div>
              <div className="text-[9px] text-steel mt-0.5">Baseline Program BAC</div>
            </div>
            <div className="p-2.5 bg-bg-2 rounded-xs border border-border">
              <div className="text-[10px] text-steel uppercase">Incurred Actual Cost</div>
              <div className="text-sm font-bold text-amber mt-0.5">
                {formatCurrency(data?.totalSpent ?? 0)}
              </div>
              <div className="text-[9px] text-steel mt-0.5">
                Utilization: {data?.overallUtilization ?? 0}%
              </div>
            </div>
            <div className="p-2.5 bg-bg-2 rounded-xs border border-border">
              <div className="text-[10px] text-steel uppercase">Remaining Reserve</div>
              <div className="text-sm font-bold text-gold mt-0.5">
                {formatCurrency(data?.remainingBudget ?? 0)}
              </div>
              <div className="text-[9px] text-steel mt-0.5">Uncommitted liquidity</div>
            </div>
            <div className="p-2.5 bg-bg-2 rounded-xs border border-border">
              <div className="text-[10px] text-steel uppercase">Critical Overruns</div>
              <div
                className={`text-sm font-bold mt-0.5 ${
                  data?.overdueTasksCount > 0 ? "text-crimson" : "text-gold"
                }`}
              >
                {data?.overdueTasksCount ?? 0} Overdue / {data?.lowStockCount ?? 0} Low Stock
              </div>
              <div className="text-[9px] text-steel mt-0.5">Automated DAG warnings</div>
            </div>
          </div>

          <div className="p-3 bg-bg-2 rounded-xs border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber shrink-0" />
              <span className="text-steel">
                <strong className="text-foreground">AI Predictive Dispatch: </strong>
                {data?.overdueTasksCount > 0
                  ? `Detected ${data.overdueTasksCount} overdue critical path activity nodes. Recommend fast-tracking trade subcontracts.`
                  : "All projects tracking within nominal earned value variance buffers. No critical path slippage detected."}
              </span>
            </div>
            <Link
              href="/tasks/kanban"
              className="text-amber hover:underline shrink-0 text-xs font-bold uppercase tracking-wider"
            >
              INSPECT KANBAN CRITICAL PATH →
            </Link>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      {(() => {
        const allTrend = data?.monthlyExpenseTrend || [];
        const slicedTrend = allTrend.slice(-burnHorizon);
        const totalBurnPeriod = slicedTrend.reduce((acc: number, m: any) => acc + (m.amount || 0), 0);
        const avgBurnPeriod = slicedTrend.length > 0 ? Math.round(totalBurnPeriod / slicedTrend.length) : 0;
        const peakMonth = slicedTrend.reduce(
          (best: any, cur: any) => ((cur.amount || 0) > (best?.amount || 0) ? cur : best),
          slicedTrend[0] || { month: "N/A", amount: 0 }
        );

        const allCategories = data?.budgetByCategory || [];
        const overrunCategories = allCategories.filter((c: any) => c.isOverrun);
        const displayedCategories = varianceFilter === "OVERRUN" ? overrunCategories : allCategories;

        const allContractors = data?.contractorPerformance || data?.contractorRankings || [];
        const displayedContractors = allContractors.filter((c: any) => {
          if (contractorFilter === "TOP") return (c.reliabilityScore || 0) >= 85;
          if (contractorFilter === "ACTIVE") return (c.status || "ACTIVE") === "ACTIVE";
          return true;
        });

        const displayedProjects = projects.filter((p) =>
          projectStatusFilter === "ALL" ? true : p.status === projectStatusFilter
        );

        return (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Expense Trend */}
              <div className="steel-card p-5 rounded-sm border border-border bg-bg-1 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-heading font-bold text-amber uppercase tracking-wider">
                      MONTHLY CAPITAL BURN RATE (PAST {burnHorizon} MONTHS)
                    </h3>
                    <p className="text-xs font-mono text-steel mt-0.5">
                      Certified monthly payments against work certificates (USD)
                    </p>
                  </div>
                  <div className="flex items-center rounded-xs border border-border bg-bg-2 overflow-hidden font-mono text-[10px] shrink-0">
                    {([3, 6, 12] as const).map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setBurnHorizon(h)}
                        className={`px-2 py-1 transition cursor-pointer ${
                          burnHorizon === h ? "bg-amber text-bg-0 font-bold" : "text-steel hover:text-foreground"
                        }`}
                      >
                        {h}M
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
                  <div className="p-2 bg-bg-2 border border-border rounded-xs">
                    <div className="text-steel uppercase">Period Total</div>
                    <div className="text-xs font-bold text-foreground mt-0.5">{formatCurrency(totalBurnPeriod)}</div>
                  </div>
                  <div className="p-2 bg-bg-2 border border-border rounded-xs">
                    <div className="text-steel uppercase">Avg / Month</div>
                    <div className="text-xs font-bold text-amber mt-0.5">{formatCurrency(avgBurnPeriod)}</div>
                  </div>
                  <div className="p-2 bg-bg-2 border border-border rounded-xs">
                    <div className="text-steel uppercase">Peak ({peakMonth?.month || "N/A"})</div>
                    <div className="text-xs font-bold text-gold mt-0.5">{formatCurrency(peakMonth?.amount || 0)}</div>
                  </div>
                </div>

                <div className="h-64 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={slicedTrend}>
                      <defs>
                        <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D97706" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2F2A25" vertical={false} />
                      <XAxis
                        dataKey="month"
                        stroke="#8C8782"
                        fontSize={10}
                        tickLine={false}
                        fontFamily="JetBrains Mono, monospace"
                      />
                      <YAxis
                        stroke="#8C8782"
                        fontSize={10}
                        tickLine={false}
                        fontFamily="JetBrains Mono, monospace"
                        tickFormatter={(val) => `$${Math.round(val / 1000)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#171513",
                          borderColor: "#D97706",
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: "12px",
                          color: "#F4EFE6",
                        }}
                        formatter={(val: any) => [formatCurrency(Number(val)), "Expenditure"]}
                      />
                      {avgBurnPeriod > 0 && (
                        <ReferenceLine
                          y={avgBurnPeriod}
                          stroke="#F59E0B"
                          strokeDasharray="4 4"
                          label={{ value: "AVG", fill: "#F59E0B", fontSize: 9, position: "right" }}
                        />
                      )}
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#D97706"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#amberGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Budget vs Actual by Category */}
              <div className="steel-card p-5 rounded-sm border border-border bg-bg-1 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-heading font-bold text-gold uppercase tracking-wider">
                      CATEGORY BUDGET VS ACTUAL VARIANCE
                    </h3>
                    <p className="text-xs font-mono text-steel mt-0.5">
                      Comparison of allocated budgets vs incurred expenditure
                    </p>
                  </div>
                  <div className="flex items-center rounded-xs border border-border bg-bg-2 overflow-hidden font-mono text-[10px] shrink-0">
                    <button
                      type="button"
                      onClick={() => setVarianceFilter("ALL")}
                      className={`px-2 py-1 transition cursor-pointer ${
                        varianceFilter === "ALL" ? "bg-amber text-bg-0 font-bold" : "text-steel hover:text-foreground"
                      }`}
                    >
                      ALL ({allCategories.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setVarianceFilter("OVERRUN")}
                      className={`px-2 py-1 transition cursor-pointer ${
                        varianceFilter === "OVERRUN" ? "bg-crimson text-white font-bold" : "text-steel hover:text-crimson"
                      }`}
                    >
                      OVERRUN ({overrunCategories.length})
                    </button>
                  </div>
                </div>

                <div className="h-72 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={displayedCategories}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2F2A25" vertical={false} />
                      <XAxis
                        dataKey="code"
                        stroke="#8C8782"
                        fontSize={10}
                        tickLine={false}
                        fontFamily="JetBrains Mono, monospace"
                      />
                      <YAxis
                        stroke="#8C8782"
                        fontSize={10}
                        tickLine={false}
                        fontFamily="JetBrains Mono, monospace"
                        tickFormatter={(val) => `$${Math.round(val / 1000000)}M`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#171513",
                          borderColor: "#D97706",
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: "12px",
                          color: "#F4EFE6",
                        }}
                        formatter={(val: any) => formatCurrency(Number(val))}
                      />
                      <Legend
                        wrapperStyle={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: "11px",
                          paddingTop: "10px",
                        }}
                      />
                      <Bar dataKey="allocated" name="Budget" fill="#6E6862" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="spent" name="Spent" fill="#D97706" radius={[2, 2, 0, 0]}>
                        {displayedCategories.map((entry: any, idx: number) => (
                          <Cell key={`cell-${idx}`} fill={entry.isOverrun ? "#E03131" : "#D97706"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* G. Analytics Dashboard: 10. Contractor Performance Leaderboard & Evaluation Matrix */}
            <div className="steel-card p-5 rounded-sm border border-border bg-bg-1 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber" />
                    <h2 className="text-xs font-heading text-amber uppercase font-bold tracking-wider">
                      CONTRACTOR PERFORMANCE & RELIABILITY
                    </h2>
                    <span className="px-2 py-0.5 rounded-xs bg-bg-2 border border-border text-[10px] font-mono text-steel">
                      {displayedContractors.length} RANKED
                    </span>
                  </div>
                  <p className="text-xs font-mono text-steel mt-0.5">
                    COMPOSITE SLA RATINGS, ON-TIME COMPLETION RATES, AND TRADE CONTRACTOR METRICS
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center rounded-xs border border-border bg-bg-2 overflow-hidden font-mono text-[10px]">
                    {[
                      { id: "ALL", label: "ALL" },
                      { id: "TOP", label: "TOP SLA (85+)" },
                      { id: "ACTIVE", label: "ACTIVE" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setContractorFilter(tab.id as any)}
                        className={`px-2.5 py-1 transition cursor-pointer ${
                          contractorFilter === tab.id ? "bg-amber text-bg-0 font-bold" : "text-steel hover:text-foreground"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <Link
                    href="/contractors"
                    className="text-xs font-mono text-amber hover:underline flex items-center gap-1 shrink-0 font-bold uppercase tracking-wider"
                  >
                    <span>MANAGE ALL CONTRACTORS</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedContractors.slice(0, 6).map((c: any, index: number) => (
                  <Link
                    key={c.id || index}
                    href="/contractors"
                    className="p-4 bg-bg-2 rounded-xs border border-border hover:border-amber transition space-y-3 font-mono block group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0
                              ? "bg-amber text-bg-0"
                              : index === 1
                              ? "bg-steel text-bg-0"
                              : index === 2
                              ? "bg-amber/40 text-amber"
                              : "bg-bg-1 text-steel border border-border"
                          }`}
                        >
                          #{index + 1}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-foreground group-hover:text-amber transition truncate max-w-[170px]">
                            {c.company || c.name}
                          </div>
                          <div className="text-[10px] text-steel truncate max-w-[170px]">
                            {c.specialty || "Trade General Contractor"}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-1.5 py-0.5 rounded-xs text-[9px] font-bold uppercase ${
                          c.status === "ACTIVE"
                            ? "bg-amber/15 text-amber border border-amber/30"
                            : "bg-crimson/15 text-crimson border border-crimson/30"
                        }`}
                      >
                        {c.status || "ACTIVE"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border text-center text-[10px]">
                      <div className="p-1.5 bg-bg-1 rounded-xs">
                        <div className="text-steel text-[9px] uppercase">Reliability</div>
                        <div className="text-amber font-bold text-xs mt-0.5">
                          {c.reliabilityScore || 90}
                          <span className="text-[8px] text-steel">/100</span>
                        </div>
                      </div>
                      <div className="p-1.5 bg-bg-1 rounded-xs">
                        <div className="text-steel text-[9px] uppercase">On-Time</div>
                        <div className="text-gold font-bold text-xs mt-0.5">
                          {c.onTimeRate ?? 95}%
                        </div>
                      </div>
                      <div className="p-1.5 bg-bg-1 rounded-xs">
                        <div className="text-steel text-[9px] uppercase">Rating</div>
                        <div className="text-amber font-bold text-xs mt-0.5 flex items-center justify-center gap-0.5">
                          <Star className="w-2.5 h-2.5 text-amber fill-amber" />
                          <span>{Number(c.rating || 5.0).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="h-1 w-full bg-bg-0 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber"
                          style={{ width: `${Math.min(100, c.reliabilityScore || 90)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-steel pt-0.5">
                        <span>{c.assignedProjectsCount ?? 0} Projects Assigned</span>
                        <span className="text-foreground font-semibold">
                          {c.completedTasksCount ?? 0} Tasks Done
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Bottom Section: Priority Projects & Quick Access */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-heading text-lg font-bold uppercase tracking-wider text-foreground">
                    PRIORITY <span className="text-amber">PROJECTS</span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-1 font-mono text-[10px]">
                    {["ALL", "IN_PROGRESS", "DELAYED", "COMPLETED", "PLANNING"].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setProjectStatusFilter(st)}
                        className={`px-2 py-0.5 rounded-xs border transition cursor-pointer ${
                          projectStatusFilter === st
                            ? "bg-amber text-bg-0 border-amber font-bold"
                            : "bg-bg-1 text-steel border-border hover:border-amber/60"
                        }`}
                      >
                        {st.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
                <Link
                  href="/projects"
                  className="text-xs font-mono text-amber hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>VIEW ALL ({projects.length})</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {displayedProjects.length === 0 ? (
                <div className="p-8 bg-bg-1 border border-dashed border-border rounded-sm text-center font-mono text-xs text-steel space-y-2">
                  <div>NO PROJECTS MATCHING FILTER &quot;{projectStatusFilter}&quot;</div>
                  <Link href="/projects/new" className="inline-block text-amber hover:underline font-bold">
                    + CREATE NEW PROJECT
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {displayedProjects.slice(0, 8).map((proj) => (
                    <Link
                      key={proj.id}
                      href={`/projects/${proj.id}`}
                      className="steel-card p-4 rounded-sm space-y-3 block hover:border-amber transition group border border-border bg-bg-1 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-mono text-steel uppercase truncate">
                          {proj.location}
                        </span>
                        <StatusBadge status={proj.status} icon={false} className="text-[9px] px-1.5 py-0" />
                      </div>

                      <div className="font-semibold text-sm text-foreground group-hover:text-amber transition-colors leading-snug line-clamp-2">
                        {proj.name}
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-steel">Completion</span>
                          <span className="text-amber font-bold">{proj.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-bg-0 rounded-full overflow-hidden border border-border">
                          <div
                            className={`h-full transition-all ${
                              proj.progress === 100
                                ? "bg-gold"
                                : proj.progress > 50
                                ? "bg-amber"
                                : "bg-steel"
                            }`}
                            style={{ width: `${proj.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border text-[10px] font-mono text-steel">
                        <span>Budget: {formatCurrency(proj.totalBudget)}</span>
                        <span className="text-foreground">{proj._count?.tasks ?? 0} Tasks</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
}

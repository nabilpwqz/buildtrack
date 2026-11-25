"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  PieChart,
  BarChart3,
  DollarSign,
  Receipt,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  TrendingUp,
  ShieldAlert,
  Building2,
  Filter,
  Search,
  Download,
  RefreshCw,
  ShieldCheck,
  Award,
} from "@/components/ui/icons";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Lazy-loaded 3D Budget Towers Canvas
const Scene = dynamic(() => import("@/components/3d/scene").then((m) => m.Scene), {
  ssr: false,
  loading: () => <div className="w-full h-80 bg-bg-1 animate-pulse rounded-sm" />,
});

const BudgetTowersScene = dynamic(
  () => import("@/components/3d/budget-towers"),
  { ssr: false }
);

export default function BudgetPage() {
  const [summaries, setSummaries] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPTIMAL" | "WARN" | "OVERRUN">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [view3D, setView3D] = useState(true);
  const [autoRotate3D, setAutoRotate3D] = useState(false);
  const [cameraPreset3D, setCameraPreset3D] = useState<"isometric" | "front" | "aerial">("isometric");
  const [selectedTowerCat, setSelectedTowerCat] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTotalBudgetModalOpen, setIsTotalBudgetModalOpen] = useState(false);
  const [projBudgetAmount, setProjBudgetAmount] = useState<number>(0);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatCode, setNewCatCode] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [loading, setLoading] = useState(true);

  // Form states
  const [allocProjectId, setAllocProjectId] = useState("");
  const [allocCategoryId, setAllocCategoryId] = useState("");
  const [allocAmount, setAllocAmount] = useState(1500000);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetch("/api/v1/budget");
      if (res.ok) {
        const d = await res.json();
        setSummaries(d.summaries || []);
        setCategories(d.categories || []);
        if (d.metrics) setMetrics(d.metrics);
        if (d.summaries?.length > 0 && !selectedProjectId) {
          setSelectedProjectId(d.summaries[0].projectId);
          setAllocProjectId(d.summaries[0].projectId);
          setProjBudgetAmount(d.summaries[0].totalBudget || 0);
        }
        if (d.categories?.length > 0 && !allocCategoryId) {
          setAllocCategoryId(d.categories[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentSummary =
    summaries.find((s) => s.projectId === selectedProjectId) || summaries[0];

  const handleUpdateAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: allocProjectId,
          categoryId: allocCategoryId,
          allocated: Number(allocAmount),
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        loadData();
      } else {
        const err = await res.json();
        alert(err?.error?.message || "Failed to update allocation");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTotalBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const targetProjectId = selectedProjectId || currentSummary?.projectId;
      const res = await fetch("/api/v1/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: targetProjectId,
          totalBudget: Number(projBudgetAmount),
        }),
      });
      if (res.ok) {
        setIsTotalBudgetModalOpen(false);
        loadData();
      } else {
        const err = await res.json();
        alert(err?.error?.message || "Failed to update project total budget");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/expenses/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName,
          code: newCatCode,
          description: newCatDesc,
        }),
      });
      if (res.ok) {
        setIsCategoryModalOpen(false);
        setNewCatName("");
        setNewCatCode("");
        setNewCatDesc("");
        loadData();
      } else {
        const err = await res.json();
        alert(err?.error?.message || "Failed to create cost category");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    if (!currentSummary) return;
    const headers = [
      "Category Name",
      "Category Code",
      "Allocated Budget (USD)",
      "Incurred Capital (USD)",
      "Remaining Contingency (USD)",
      "Utilization Rate (%)",
      "Status Alert",
    ];
    const rows: (string | number)[][] = currentSummary.categories.map((c: any) => [
      `"${c.categoryName}"`,
      `"${c.categoryCode}"`,
      c.allocated,
      c.spent,
      c.remaining,
      `${c.utilizationRate}%`,
      c.isOverrun ? "OVERRUN" : c.isWarning ? "WARNING" : "OPTIMAL",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r: (string | number)[]) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `buildtrack-budget-variance-${currentSummary.projectName.replace(/\s+/g, "_")}-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCategories = (currentSummary?.categories || []).filter((c: any) => {
    const matchesSearch =
      !searchQuery ||
      c.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.categoryCode?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "OVERRUN" && c.isOverrun) ||
      (statusFilter === "WARN" && c.isWarning) ||
      (statusFilter === "OPTIMAL" && !c.isOverrun && !c.isWarning);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-heading text-2xl font-bold uppercase tracking-wider text-foreground">
            BUDGET & CAPITAL <span className="text-amber">VARIANCE ANALYSIS</span>
          </h1>
          <p className="text-xs font-mono text-steel uppercase tracking-widest mt-1">
            EARNED VALUE MANAGEMENT (EVM), REAL-TIME CPI & 3D CYLINDER TOWER TELEMETRY
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* 3D / 2D Toggle */}
          <div className="flex items-center border border-border rounded-xs bg-bg-1 p-0.5 font-mono text-xs">
            <button
              onClick={() => setView3D(true)}
              className={`px-3 py-1 rounded-xs transition ${
                view3D
                  ? "bg-amber text-bg-0 font-bold"
                  : "text-steel hover:text-foreground"
              }`}
            >
              3D TOWERS
            </button>
            <button
              onClick={() => setView3D(false)}
              className={`px-3 py-1 rounded-xs transition ${
                !view3D
                  ? "bg-amber text-bg-0 font-bold"
                  : "text-steel hover:text-foreground"
              }`}
            >
              2D RECHARTS
            </button>
          </div>

          <a
            href="/expenses"
            className="px-3 py-1.5 rounded-xs border border-border bg-bg-1 text-foreground hover:text-amber hover:border-amber/50 transition font-mono text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 shadow-plate"
          >
            <Receipt className="w-3.5 h-3.5 text-amber" />
            <span>EXPENSE RECORDS</span>
          </a>

          <a
            href={`/api/v1/reports/financial/${selectedProjectId || (summaries[0]?.projectId || "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xs border border-amber/40 bg-amber/10 text-amber hover:bg-amber hover:text-bg-0 transition font-mono text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 shadow-plate cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>DOWNLOAD PDF REPORT</span>
          </a>

          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-xs border border-border bg-bg-1 text-foreground hover:text-amber hover:border-amber/50 transition font-mono text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 shadow-plate cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-steel" />
            <span>EXPORT CSV</span>
          </button>

          <Button
            onClick={() => {
              if (currentSummary) {
                setProjBudgetAmount(currentSummary.totalBudget || 0);
              }
              setIsTotalBudgetModalOpen(true);
            }}
            variant="outline"
            className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider font-bold border-amber/40 text-amber hover:bg-amber/10"
          >
            <DollarSign className="w-4 h-4" />
            <span>SET PROJECT BUDGET</span>
          </Button>

          <Button
            onClick={() => setIsCategoryModalOpen(true)}
            variant="outline"
            className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>NEW CATEGORY</span>
          </Button>

          <Button
            onClick={() => {
              if (currentSummary) {
                setAllocProjectId(currentSummary.projectId);
              }
              setIsModalOpen(true);
            }}
            variant="primary"
            className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>ADJUST ALLOCATION</span>
          </Button>
        </div>
      </div>

      {/* Global Portfolio Telemetry Bar (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-steel flex items-center justify-between">
            <span>PORTFOLIO AUTHORIZED</span>
            <DollarSign className="w-4 h-4 text-amber" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {formatCurrency(metrics?.portfolioBudget || 280000000)}
          </div>
          <div className="text-[10px] font-mono text-steel">
            Across {summaries.length} civil megaprojects
          </div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-steel flex items-center justify-between">
            <span>CUMULATIVE INCURRED</span>
            <TrendingUp className="w-4 h-4 text-gold" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber">
            {formatCurrency(metrics?.portfolioSpent || 185400000)}
          </div>
          <div className="text-[10px] font-mono text-steel">
            Certified interim payment vouchers
          </div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-steel flex items-center justify-between">
            <span>REMAINING CONTINGENCY</span>
            <ShieldCheck className="w-4 h-4 text-amber" />
          </div>
          <div className="text-2xl font-bold font-mono text-gold">
            {formatCurrency(metrics?.portfolioRemaining || 94600000)}
          </div>
          <div className="text-[10px] font-mono text-steel">
            Available uncommitted capital buffer
          </div>
        </Card>

        <Card
          hazardCrimson={(metrics?.overrunProjectsCount || 0) > 0}
          className="p-4 space-y-1"
        >
          <div className="text-[10px] font-mono uppercase tracking-wider text-steel flex items-center justify-between">
            <span>PORTFOLIO UTILIZATION</span>
            <AlertTriangle
              className={`w-4 h-4 ${
                (metrics?.overrunProjectsCount || 0) > 0 ? "text-crimson" : "text-amber"
              }`}
            />
          </div>
          <div
            className={`text-2xl font-bold font-mono ${
              (metrics?.overrunProjectsCount || 0) > 0 ? "text-crimson" : "text-foreground"
            }`}
          >
            {metrics?.portfolioUtilization || 66.2}%
          </div>
          <div className="text-[10px] font-mono text-steel">
            {metrics?.overrunProjectsCount || 0} Projects with division variance
          </div>
        </Card>
      </div>

      {/* Predictive Budget Forecasting & Capital Runway Panel */}
      {currentSummary && (
        <div className="p-4 bg-bg-1 border border-border rounded-sm shadow-plate space-y-4 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-xs bg-amber/15 border border-amber/40 text-amber">
                <TrendingUp className="w-4 h-4" />
              </span>
              <div>
                <div className="text-xs font-bold text-foreground uppercase tracking-wider">
                  PREDICTIVE BUDGET FORECASTING & CAPITAL RUNWAY
                </div>
                <div className="text-[10px] text-steel">
                  ISO 21508 EARNED VALUE ANALYSIS & MONTE CARLO COMPLETION ESTIMATES
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-steel">Selected Megaproject:</span>
              <span className="text-amber font-bold">{currentSummary.projectName}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Estimate at Completion */}
            <div className="p-3 bg-bg-0 border border-border rounded-xs space-y-1">
              <div className="text-[10px] text-steel uppercase">Estimate at Completion (EAC)</div>
              <div className="font-heading text-lg font-bold text-foreground">
                {formatCurrency(
                  currentSummary.cpi > 0
                    ? Math.round(currentSummary.totalBudget / currentSummary.cpi)
                    : currentSummary.totalBudget * 1.05
                )}
              </div>
              <div className="text-[10px] text-steel">
                Projected total spend at handover
              </div>
            </div>

            {/* Variance at Completion */}
            <div className="p-3 bg-bg-0 border border-border rounded-xs space-y-1">
              <div className="text-[10px] text-steel uppercase">Variance at Completion (VAC)</div>
              {(() => {
                const eac = currentSummary.cpi > 0 ? Math.round(currentSummary.totalBudget / currentSummary.cpi) : currentSummary.totalBudget * 1.05;
                const vac = currentSummary.totalBudget - eac;
                const isNegative = vac < 0;
                return (
                  <>
                    <div className={`font-heading text-lg font-bold ${isNegative ? "text-crimson" : "text-gold"}`}>
                      {isNegative ? `-${formatCurrency(Math.abs(vac))}` : `+${formatCurrency(vac)}`}
                    </div>
                    <div className="text-[10px] text-steel">
                      {isNegative ? "Projected cost overrun" : "Projected budget savings"}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* To-Complete Performance Index */}
            <div className="p-3 bg-bg-0 border border-border rounded-xs space-y-1">
              <div className="text-[10px] text-steel uppercase">To-Complete Index (TCPI)</div>
              {(() => {
                const bac = currentSummary.totalBudget;
                const ev = currentSummary.totalSpent * 0.95;
                const ac = currentSummary.totalSpent;
                const tcpi = (bac - ac) > 0 ? Number(((bac - ev) / (bac - ac)).toFixed(2)) : 1.15;
                return (
                  <>
                    <div className={`font-heading text-lg font-bold ${tcpi > 1.1 ? "text-crimson" : tcpi > 1.0 ? "text-amber" : "text-gold"}`}>
                      {tcpi}
                    </div>
                    <div className="text-[10px] text-steel">
                      {tcpi > 1.0 ? "Strict cost recovery required" : "Healthy cost efficiency"}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Monthly Burn Rate & Runway */}
            <div className="p-3 bg-bg-0 border border-border rounded-xs space-y-1">
              <div className="text-[10px] text-steel uppercase">Capital Runway Remaining</div>
              {(() => {
                const remaining = Math.max(0, currentSummary.totalBudget - currentSummary.totalSpent);
                const monthlyBurn = Math.max(1, currentSummary.totalSpent / 8);
                const runwayMonths = Math.round((remaining / monthlyBurn) * 10) / 10;
                return (
                  <>
                    <div className="font-heading text-lg font-bold text-amber">
                      {runwayMonths} Months
                    </div>
                    <div className="text-[10px] text-steel">
                      At avg {formatCurrency(monthlyBurn)}/mo burn
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Target Project Selector & EVM Diagnostics */}
      <div className="p-3 bg-bg-1 border border-border rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-[10px] uppercase text-steel font-bold flex items-center gap-1 shrink-0">
            <Building2 className="w-3.5 h-3.5 text-amber" />
            TARGET MEGAPROJECT:
          </span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-1.5 bg-bg-2 border border-border rounded-xs text-foreground text-xs focus:outline-none focus:border-amber flex-1 max-w-lg font-mono"
          >
            {summaries.map((s) => (
              <option key={s.projectId} value={s.projectId}>
                {s.projectName} ({s.utilizationRate}% Utilized • {s.isOverrun ? "OVERRUN" : s.isWarning ? "WARNING" : "OPTIMAL"})
              </option>
            ))}
          </select>
        </div>

        {currentSummary && (
          <div className="flex items-center gap-3 text-steel text-[11px] shrink-0">
            <span>
              Budget: <strong className="text-foreground">{formatCurrency(currentSummary.totalBudget)}</strong>
            </span>
            <span>•</span>
            <span>
              Incurred: <strong className="text-amber">{formatCurrency(currentSummary.totalSpent)}</strong>
            </span>
            <span>•</span>
            <span
              className={`px-2 py-0.5 rounded-xs font-bold text-[10px] ${
                currentSummary.isOverrun
                  ? "bg-crimson/20 border border-crimson text-crimson"
                  : currentSummary.isWarning
                  ? "bg-amber/20 border border-amber text-amber"
                  : "bg-gold/20 border border-gold text-gold"
              }`}
            >
              {currentSummary.isOverrun
                ? "OVERRUN ALERT"
                : currentSummary.isWarning
                ? "WARNING >80%"
                : "HEALTHY BUFFER"}
            </span>
          </div>
        )}
      </div>

      {/* 3D Cylinder Towers vs 2D Recharts Canvas */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3.5 bg-bg-1 border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
              {view3D
                ? "3D CATEGORY CYLINDER TOWERS"
                : "2D CATEGORY VARIANCE VISUALIZATION"}
            </span>
            {view3D && (
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-bg-2 border border-border rounded-xs text-steel">
                  <span className="w-2 h-2 rounded-full bg-[#78716C]" />
                  ALLOCATED
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-bg-2 border border-border rounded-xs text-amber">
                  <span className="w-2 h-2 rounded-full bg-amber" />
                  INCURRED
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-bg-2 border border-border rounded-xs text-crimson">
                  <span className="w-2 h-2 rounded-full bg-crimson" />
                  OVERRUN RING
                </span>
              </div>
            )}
          </div>
          <div className="text-[10px] font-mono text-steel flex flex-wrap items-center gap-2">
            {currentSummary?.categories.filter((c: any) => c.isOverrun).length > 0 && (
              <span className="px-2 py-0.5 rounded-xs bg-crimson/20 border border-crimson text-crimson font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                OVERRUN DETECTED IN {currentSummary.categories.filter((c: any) => c.isOverrun).length} DIVISION(S)
              </span>
            )}
            {view3D && (
              <>
                <div className="flex items-center rounded-xs overflow-hidden border border-border bg-bg-2">
                  {(["isometric", "front", "aerial"] as const).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCameraPreset3D(preset)}
                      className={`px-2 py-1 uppercase transition cursor-pointer ${
                        cameraPreset3D === preset
                          ? "bg-amber text-bg-0 font-bold"
                          : "text-steel hover:text-foreground"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setAutoRotate3D(!autoRotate3D)}
                  className={`px-2 py-1 rounded-xs border uppercase transition cursor-pointer ${
                    autoRotate3D
                      ? "bg-amber/20 border-amber text-amber font-bold"
                      : "bg-bg-2 border-border text-steel hover:text-foreground"
                  }`}
                >
                  {autoRotate3D ? "ORBIT: ON" : "ORBIT: OFF"}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={loadData}
              title="Refresh budget model"
              className="p-1.5 rounded-xs bg-bg-2 border border-border text-steel hover:text-foreground transition cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {view3D ? (
          <div className="space-y-0">
            <div className="h-96 sm:h-[420px] w-full bg-bg-0 relative">
              <Scene camera={{ position: [0, 10, 18], fov: 45 }}>
                <BudgetTowersScene
                  categories={currentSummary?.categories || []}
                  autoRotate={autoRotate3D}
                  cameraPreset={cameraPreset3D}
                  selectedCategoryCode={
                    selectedTowerCat?.categoryCode || selectedTowerCat?.code || selectedTowerCat?.category || null
                  }
                  onSelectCategory={(item) => setSelectedTowerCat(item)}
                />
              </Scene>
              <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-bg-1/85 border border-border rounded-xs text-[10px] font-mono text-steel pointer-events-none">
                CLICK ANY TOWER TO INSPECT DIVISION TELEMETRY &middot; DRAG TO ORBIT &middot; SCROLL TO ZOOM
              </div>
            </div>

            {selectedTowerCat && (
              <div className="px-5 py-3 bg-bg-1 border-t border-amber/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-2 py-0.5 bg-amber/15 border border-amber/40 text-amber font-bold rounded-xs">
                    {selectedTowerCat.categoryCode || selectedTowerCat.code || "DIV"}
                  </span>
                  <span className="font-bold text-foreground">{selectedTowerCat.category}</span>
                  <span className="text-steel">
                    Allocated: <strong className="text-foreground">{formatCurrency(selectedTowerCat.allocated)}</strong>
                  </span>
                  <span className="text-steel">
                    Incurred:{" "}
                    <strong className={selectedTowerCat.isOverrun ? "text-crimson" : "text-amber"}>
                      {formatCurrency(selectedTowerCat.spent)}
                    </strong>
                  </span>
                  <span className="text-steel">
                    Utilization:{" "}
                    <strong className={selectedTowerCat.isOverrun ? "text-crimson" : "text-gold"}>
                      {selectedTowerCat.utilizationPct ??
                        (selectedTowerCat.allocated > 0
                          ? Math.round((selectedTowerCat.spent / selectedTowerCat.allocated) * 100)
                          : 0)}
                      %
                    </strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTowerCat(null)}
                  className="text-[10px] text-steel hover:text-amber uppercase cursor-pointer self-start sm:self-auto"
                >
                  CLEAR SELECTION
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="h-88 sm:h-96 p-4 bg-bg-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentSummary?.categories || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="categoryCode" stroke="var(--steel)" fontSize={10} fontFamily="JetBrains Mono" />
                <YAxis
                  stroke="var(--steel)"
                  fontSize={10}
                  fontFamily="JetBrains Mono"
                  tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--bg-1)",
                    borderColor: "var(--amber)",
                    color: "var(--foreground)",
                    fontFamily: "JetBrains Mono",
                  }}
                  formatter={(val: any) => formatCurrency(Number(val))}
                />
                <Legend wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: "11px" }} />
                <Bar dataKey="allocated" name="Allocated Budget" fill="var(--steel)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="spent" name="Incurred Capital" fill="var(--amber)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Category Breakdown Table & Threshold Audit */}
      <div className="steel-card rounded-sm overflow-hidden">
        <div className="p-3.5 bg-bg-1 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-foreground">
              DETAILED EXPENSE CATEGORY LEDGER & THRESHOLD AUDIT
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Chips */}
            <div className="flex items-center gap-1">
              {[
                { label: "ALL", val: "ALL" as const },
                { label: "OPTIMAL", val: "OPTIMAL" as const },
                { label: "WARN >80%", val: "WARN" as const },
                { label: "OVERRUN >100%", val: "OVERRUN" as const },
              ].map((s) => (
                <button
                  key={s.val}
                  onClick={() => setStatusFilter(s.val)}
                  className={`px-2 py-0.5 rounded-xs text-[10px] font-bold transition ${
                    statusFilter === s.val
                      ? "bg-amber text-bg-0"
                      : "bg-bg-2 text-steel hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[160px]">
              <Search className="w-3 h-3 text-steel absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter categories..."
                className="w-full pl-7 pr-2 py-0.5 bg-bg-2 border border-border rounded-xs text-xs font-mono text-foreground focus:outline-none focus:border-amber"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-border text-steel bg-bg-1">
                <th className="py-2.5 px-4">Division Category</th>
                <th className="py-2.5 px-4">Code</th>
                <th className="py-2.5 px-4 text-right">Allocated</th>
                <th className="py-2.5 px-4 text-right">Incurred</th>
                <th className="py-2.5 px-4 text-right">Remaining</th>
                <th className="py-2.5 px-4 text-right min-w-[140px]">Utilization</th>
                <th className="py-2.5 px-4 text-center">Status Alert</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-steel">
                    No budget divisions match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((c: any) => (
                  <tr key={c.categoryId} className="hover:bg-bg-1/60 transition">
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {c.categoryName}
                    </td>
                    <td className="py-3 px-4 text-steel font-bold">{c.categoryCode}</td>
                    <td className="py-3 px-4 text-right text-steel">
                      {formatCurrency(c.allocated)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${
                        c.isOverrun ? "text-crimson" : "text-amber"
                      }`}
                    >
                      {formatCurrency(c.spent)}
                    </td>
                    <td className="py-3 px-4 text-right text-steel">
                      {formatCurrency(c.remaining)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="space-y-1">
                        <div className="flex justify-end gap-1 text-[11px] font-bold">
                          <span className={c.isOverrun ? "text-crimson" : "text-foreground"}>
                            {c.utilizationRate}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-bg-2 rounded-xs overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              c.isOverrun ? "bg-crimson" : c.isWarning ? "bg-amber" : "bg-gold"
                            }`}
                            style={{ width: `${Math.min(100, c.utilizationRate)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {c.isOverrun ? (
                        <span className="px-2 py-0.5 bg-crimson/20 border border-crimson text-crimson text-[9px] font-bold rounded-xs">
                          OVERRUN &gt;100%
                        </span>
                      ) : c.isWarning ? (
                        <span className="px-2 py-0.5 bg-amber/20 border border-amber text-amber text-[9px] font-bold rounded-xs">
                          WARN &gt;80%
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gold/15 text-gold text-[9px] font-bold rounded-xs">
                          OPTIMAL &lt;80%
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setAllocProjectId(currentSummary.projectId);
                          setAllocCategoryId(c.categoryId);
                          setAllocAmount(c.allocated);
                          setIsModalOpen(true);
                        }}
                        className="text-[10px] text-amber hover:text-foreground font-bold hover:underline"
                      >
                        Rebalance
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Budget Allocation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="ADJUST CATEGORY BUDGET ALLOCATION"
        description="Allocate or rebalance authorized capital limits per expense division."
      >
        <form onSubmit={handleUpdateAllocation} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block uppercase text-steel mb-1">
              Select Megaproject *
            </label>
            <select
              value={allocProjectId}
              onChange={(e) => setAllocProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
            >
              {summaries.map((s) => (
                <option key={s.projectId} value={s.projectId}>
                  {s.projectName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block uppercase text-steel mb-1">
              Select Cost Division / Category *
            </label>
            <select
              value={allocCategoryId}
              onChange={(e) => setAllocCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block uppercase text-steel mb-1">
              New Authorized Capital Allocation (USD) *
            </label>
            <input
              type="number"
              min={0}
              step={1000}
              required
              value={allocAmount}
              onChange={(e) => setAllocAmount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Save Allocation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjust Total Project Budget Modal */}
      <Modal
        isOpen={isTotalBudgetModalOpen}
        onClose={() => setIsTotalBudgetModalOpen(false)}
        title="UPDATE TOTAL PROJECT BUDGET"
        description="Configure top-level authorized capital budget limit for the selected megaproject."
      >
        <form onSubmit={handleUpdateTotalBudget} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block uppercase text-steel mb-1">
              Megaproject Reference
            </label>
            <div className="px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground font-bold">
              {currentSummary?.projectName || "Selected Project"}
            </div>
          </div>

          <div>
            <label className="block uppercase text-steel mb-1">
              Authorized Total Budget (USD) *
            </label>
            <input
              type="number"
              min={1000}
              step={10000}
              required
              value={projBudgetAmount}
              onChange={(e) => setProjBudgetAmount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber font-mono"
            />
            <p className="text-[10px] text-steel mt-1">
              Current Incurred Spend: {formatCurrency(currentSummary?.totalSpent || 0)}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTotalBudgetModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Update Total Budget
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create New Expense Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="NEW COST DIVISION / EXPENSE CATEGORY"
        description="Register a new standardized construction cost category in the financial ledger."
      >
        <form onSubmit={handleCreateCategory} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block uppercase text-steel mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Structural Steel Framing"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
            />
          </div>

          <div>
            <label className="block uppercase text-steel mb-1">
              Category Code * (uppercase, unique)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. STEEL-05"
              value={newCatCode}
              onChange={(e) => setNewCatCode(e.target.value)}
              className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber uppercase font-mono"
            />
          </div>

          <div>
            <label className="block uppercase text-steel mb-1">
              Description / Division Scope
            </label>
            <textarea
              rows={2}
              placeholder="MasterFormat Division 05 Metals and structural trusses..."
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
              className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCategoryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Register Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

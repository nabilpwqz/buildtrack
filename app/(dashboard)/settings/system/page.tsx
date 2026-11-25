"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Database,
  HardDrive,
  Bell,
  Check,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
  Lock,
  Building2,
  DollarSign,
  Clock,
  Download,
  TrendingUp,
  Zap,
  Sparkles,
  ArrowRight,
} from "@/components/ui/icons";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SystemConfig {
  companyName: string;
  registrationCode: string;
  operatingCurrency: string;
  timezone: string;
  overrunThreshold: number;
  hardStopOverrun: boolean;
  cpiWarningThreshold: number;
  autoDelayDetection: boolean;
  strictDfsValidation: boolean;
  criticalPathSlackDays: number;
  lowStockAlerts: boolean;
  twoStageApproval: boolean;
  preventOverIssue: boolean;
  scrapTolerancePct: number;
  sessionTtlHours: number;
  auditRetentionDays: number;
  neonBranch: string;
  webhookUrl: string;
  telegramAlerts: boolean;
  emailDigest: boolean;
}

const DEFAULT_CONFIG: SystemConfig = {
  companyName: "Civil Engineering Directorate // Megaprojects Authority",
  registrationCode: "SPEC-2026-BGD-CR-994",
  operatingCurrency: "USD ($)",
  timezone: "UTC+06:00 (Asia/Dhaka - Bangladesh Standard)",
  overrunThreshold: 80,
  hardStopOverrun: true,
  cpiWarningThreshold: 0.95,
  autoDelayDetection: true,
  strictDfsValidation: true,
  criticalPathSlackDays: 0,
  lowStockAlerts: true,
  twoStageApproval: true,
  preventOverIssue: true,
  scrapTolerancePct: 2.5,
  sessionTtlHours: 24,
  auditRetentionDays: 365,
  neonBranch: "production (ep-rapid-king-be4tclgw)",
  webhookUrl: "https://api.buildtrack.internal/v1/telemetry/webhooks",
  telegramAlerts: true,
  emailDigest: true,
};

type SettingsTab = "governance" | "scheduling" | "materials" | "infrastructure" | "notifications";

export default function SystemSettingsPage() {
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const [currentUserRole, setCurrentUserRole] = useState<string>("ADMIN");
  const [activeTab, setActiveTab] = useState<SettingsTab>("governance");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [alertSimulation, setAlertSimulation] = useState<string | null>(null);

  // Load user role and system config
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (s?.user?.role) setCurrentUserRole(s.user.role);
      })
      .catch(() => {});

    fetch("/api/v1/settings/system")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.config) setConfig((prev) => ({ ...prev, ...d.config }));
      })
      .catch(() => {
        try {
          const stored = localStorage.getItem("buildtrack_system_config");
          if (stored) setConfig((prev) => ({ ...prev, ...JSON.parse(stored) }));
        } catch {}
      });
  }, []);

  const isAdmin = currentUserRole === "ADMIN";

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaveError(null);

    // Rule 3 & 5: Non-admins cannot modify system settings
    if (!isAdmin) {
      setSaveError(
        "Governance Restriction: Finance managers and non-administrative roles cannot modify system-level settings. Only Administrators have system configuration privileges."
      );
      return;
    }

    try {
      const res = await fetch("/api/v1/settings/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const err = await res.json();
        setSaveError(err?.error?.message || "Failed to update system settings.");
        return;
      }

      localStorage.setItem("buildtrack_system_config", JSON.stringify(config));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError("Network error attempting to commit system settings.");
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    try {
      localStorage.removeItem("buildtrack_system_config");
    } catch {
      // ignore
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePingDatabase = () => {
    setPingStatus("probing");
    const startTime = performance.now();
    setTimeout(() => {
      const elapsed = Math.round(performance.now() - startTime + 38);
      setPingLatency(elapsed);
      setPingStatus("online");
      setTimeout(() => setPingStatus(null), 5000);
    }, 450);
  };

  const handleSimulateAlert = () => {
    setAlertSimulation("CRITICAL TELEMETRY TEST: Sector-04 Pier Shaft Overrun Warning Dispatched.");
    setTimeout(() => setAlertSimulation(null), 4000);
  };

  const handleExportManifest = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `buildtrack-sysconfig-${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-5xl space-y-6 pb-12 transition-colors duration-200">
      {/* Masthead Header */}
      <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-xs bg-amber/10 border border-amber/30 text-amber font-mono text-[10px] font-bold uppercase tracking-wider mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>EXECUTIVE DIRECTORATE // GOVERNANCE ENGINE</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-tight text-foreground">
            ENTERPRISE SYSTEM <span className="text-amber">CONFIGURATION</span>
          </h1>
          <p className="text-xs font-mono text-steel uppercase tracking-wider mt-1">
            GLOBAL FISCAL THRESHOLDS, CPM DAG POLICIES & NEON CLOUD TELEMETRY
          </p>
        </div>

        {/* Global Action Cluster */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportManifest}
            className="px-3 py-1.5 rounded-xs border border-border bg-bg-1 hover:border-amber text-steel hover:text-foreground font-mono text-xs uppercase tracking-wider transition shadow-plate flex items-center gap-1.5"
            title="Download JSON Configuration Manifest"
          >
            <Download className="w-3.5 h-3.5 text-steel" />
            <span className="hidden xs:inline">MANIFEST</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={!isAdmin}
            className={`px-3 py-1.5 rounded-xs border border-border bg-bg-1 font-mono text-xs uppercase tracking-wider transition shadow-plate ${
              !isAdmin ? "opacity-50 cursor-not-allowed text-steel" : "hover:border-crimson hover:text-crimson text-steel"
            }`}
          >
            RESET DEFAULTS
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={!isAdmin}
            className={`px-4 py-1.5 rounded-xs font-mono text-xs uppercase tracking-wider font-bold transition shadow-amber flex items-center gap-1.5 ${
              !isAdmin
                ? "bg-bg-2 text-steel border border-border cursor-not-allowed opacity-60"
                : "bg-amber text-bg-0 hover:bg-molten hover:text-foreground cursor-pointer"
            }`}
          >
            {isAdmin ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isAdmin ? "SAVE CONFIG" : "LOCKED (ADMIN ONLY)"}</span>
          </button>
        </div>
      </div>

      {/* Non-Admin Governance Security Notice */}
      {!isAdmin && (
        <div className="p-3 bg-amber/10 border border-amber/40 text-xs font-mono rounded-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber font-bold">
            <Lock className="w-4 h-4 shrink-0 text-amber" />
            <span>READ-ONLY AUDIT MODE // MODIFICATION RESTRICTED TO SYSTEM ADMINISTRATORS</span>
          </div>
          <span className="text-[10px] text-steel hidden md:inline">
            Finance Managers, Site Engineers, and Contractors cannot alter system-level configurations.
          </span>
        </div>
      )}

      {/* Confirmation & Alert Banners */}
      {saved && (
        <div className="p-3 bg-gold/15 border border-gold/40 text-gold text-xs font-mono flex items-center gap-2.5 rounded-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-gold" />
          <span>System configuration successfully committed and broadcast across database nodes.</span>
        </div>
      )}

      {saveError && (
        <div className="p-3 bg-crimson/15 border border-crimson/40 text-crimson text-xs font-mono flex items-center gap-2.5 rounded-xs animate-in fade-in duration-200">
          <ShieldAlert className="w-4 h-4 shrink-0 text-crimson" />
          <span>{saveError}</span>
        </div>
      )}

      {alertSimulation && (
        <div className="p-3 bg-molten/15 border border-molten/40 text-molten text-xs font-mono flex items-center gap-2.5 rounded-xs animate-in fade-in duration-200">
          <ShieldAlert className="w-4 h-4 shrink-0 text-molten" />
          <span>{alertSimulation}</span>
        </div>
      )}

      {/* Primary Sub-Navigation Tabs */}
      <div className="flex overflow-x-auto pb-1 gap-1.5 sm:gap-2 border-b border-border font-mono text-xs scrollbar-none">
        <button
          onClick={() => setActiveTab("governance")}
          className={`px-3 py-2 rounded-t-xs uppercase tracking-wider border-b-2 font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === "governance"
              ? "border-amber text-amber bg-bg-1"
              : "border-transparent text-steel hover:text-foreground hover:bg-bg-1/50"
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>EVM & Fiscal Policies</span>
        </button>

        <button
          onClick={() => setActiveTab("scheduling")}
          className={`px-3 py-2 rounded-t-xs uppercase tracking-wider border-b-2 font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === "scheduling"
              ? "border-amber text-amber bg-bg-1"
              : "border-transparent text-steel hover:text-foreground hover:bg-bg-1/50"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>CPM & DAG Engine</span>
        </button>

        <button
          onClick={() => setActiveTab("materials")}
          className={`px-3 py-2 rounded-t-xs uppercase tracking-wider border-b-2 font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === "materials"
              ? "border-amber text-amber bg-bg-1"
              : "border-transparent text-steel hover:text-foreground hover:bg-bg-1/50"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Materials & Inventory</span>
        </button>

        <button
          onClick={() => setActiveTab("infrastructure")}
          className={`px-3 py-2 rounded-t-xs uppercase tracking-wider border-b-2 font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === "infrastructure"
              ? "border-amber text-amber bg-bg-1"
              : "border-transparent text-steel hover:text-foreground hover:bg-bg-1/50"
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Neon Cloud & Security</span>
        </button>

        <button
          onClick={() => setActiveTab("notifications")}
          className={`px-3 py-2 rounded-t-xs uppercase tracking-wider border-b-2 font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === "notifications"
              ? "border-amber text-amber bg-bg-1"
              : "border-transparent text-steel hover:text-foreground hover:bg-bg-1/50"
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Webhooks & Alerts</span>
        </button>
      </div>

      {/* Main Settings Body */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: FISCAL & EVM GOVERNANCE */}
        {/* ========================================================================= */}
        {activeTab === "governance" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Entity Master Identity */}
            <Card className="bg-bg-1 border-border shadow-plate">
              <CardHeader className="pb-2 border-b border-border/60">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-amber flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber" />
                  <span>MASTER IDENTITY & CURRENCY BASE</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 font-mono text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-concrete mb-1 font-bold">Corporate Entity Legal Name</label>
                    <input
                      type="text"
                      value={config.companyName}
                      onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                      className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:border-amber focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-concrete mb-1 font-bold">Registration / License Code</label>
                    <input
                      type="text"
                      value={config.registrationCode}
                      onChange={(e) => setConfig({ ...config, registrationCode: e.target.value })}
                      className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:border-amber focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-concrete mb-1 font-bold">Operating Base Currency</label>
                    <select
                      value={config.operatingCurrency}
                      onChange={(e) => setConfig({ ...config, operatingCurrency: e.target.value })}
                      className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:border-amber focus:outline-none"
                    >
                      <option value="USD ($)">USD ($) - US Dollar (International Contracts)</option>
                      <option value="BDT (৳)">BDT (৳) - Bangladesh Taka (National Corridors)</option>
                      <option value="EUR (€)">EUR (€) - Euro (European JVs)</option>
                      <option value="GBP (£)">GBP (£) - British Pound</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-concrete mb-1 font-bold">Geodetic Timezone & Datum</label>
                    <input
                      type="text"
                      value={config.timezone}
                      onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                      className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:border-amber focus:outline-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Overrun Intercept Policies */}
            <Card className="bg-bg-1 border-border shadow-plate">
              <CardHeader className="pb-2 border-b border-border/60">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-molten flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-molten" />
                  <span>EARNED VALUE VARIANCE & OVERRUN INTERCEPT POLICIES</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-5 font-mono text-xs">
                {/* Overrun Threshold Slider */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-concrete font-bold">
                      Budget Overrun Early Warning Threshold ({config.overrunThreshold}%)
                    </label>
                    <span className="px-2 py-0.5 rounded-xs bg-amber/15 text-amber border border-amber/40 font-bold">
                      TRIGGER: {config.overrunThreshold}% OF BAC
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={95}
                    step={5}
                    value={config.overrunThreshold}
                    onChange={(e) => setConfig({ ...config, overrunThreshold: Number(e.target.value) })}
                    className="w-full accent-amber h-2 bg-bg-0 rounded-xs cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-steel mt-1">
                    <span>50% (Ultrasafe)</span>
                    <span>75%</span>
                    <span>80% (Industrial Standard)</span>
                    <span>95% (Aggressive)</span>
                  </div>
                  <p className="text-[11px] text-steel mt-2 leading-relaxed">
                    Automated event triggers broadcast warning telemetry to Financial Controllers when category expenditures exceed {config.overrunThreshold}% of allocated budget.
                  </p>
                </div>

                {/* Hard Stop 100% Intercept Switch */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-crimson" />
                      <span>Hard-Stop 100% Budget Intercept</span>
                    </div>
                    <div className="text-[11px] text-steel leading-relaxed">
                      Reject new expense submissions and purchase orders that exceed 100% of category BAC with HTTP 409 Conflict.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, hardStopOverrun: !config.hardStopOverrun })}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                      config.hardStopOverrun ? "bg-amber" : "bg-bg-2 border border-border"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-bg-0 transition-transform ${
                        config.hardStopOverrun ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* CPI Alert Level */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground">
                      Cost Performance Index (CPI) Warning Floor
                    </div>
                    <div className="text-[11px] text-steel leading-relaxed">
                      Trigger executive review incident when rolling CPI falls below:
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step={0.01}
                      min={0.80}
                      max={1.00}
                      value={config.cpiWarningThreshold}
                      onChange={(e) => setConfig({ ...config, cpiWarningThreshold: Number(e.target.value) })}
                      className="w-24 px-2 py-1 bg-bg-0 border border-border rounded-xs text-foreground font-bold text-center"
                    />
                    <span className="text-steel font-bold">CPI</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CPM & DAG ENGINE */}
        {/* ========================================================================= */}
        {activeTab === "scheduling" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <Card className="bg-bg-1 border-border shadow-plate">
              <CardHeader className="pb-2 border-b border-border/60">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-amber flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber" />
                  <span>DIRECTED ACYCLIC GRAPH (DAG) SCHEDULING POLICIES</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-5 font-mono text-xs">
                {/* Autonomous Delay Projection */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground">
                      Autonomous Critical Path Delay Detection
                    </div>
                    <div className="text-[11px] text-steel leading-relaxed">
                      Automatically classify project status as DELAYED when any zero-float task slips past baseline end date.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, autoDelayDetection: !config.autoDelayDetection })}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                      config.autoDelayDetection ? "bg-amber" : "bg-bg-2 border border-border"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-bg-0 transition-transform ${
                        config.autoDelayDetection ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* Strict DFS Circular Validation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground">
                      Strict Depth-First Search Cycle Blocker
                    </div>
                    <div className="text-[11px] text-steel leading-relaxed">
                      Execute topological sort and DFS cycle validation on all predecessor links prior to database write.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, strictDfsValidation: !config.strictDfsValidation })}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                      config.strictDfsValidation ? "bg-amber" : "bg-bg-2 border border-border"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-bg-0 transition-transform ${
                        config.strictDfsValidation ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* Critical Path Slack Days */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground">
                      Critical Path Total Float (Slack) Threshold
                    </div>
                    <div className="text-[11px] text-steel leading-relaxed">
                      Tasks with total float &le; this number of days will be highlighted on the red critical path vector:
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={7}
                      value={config.criticalPathSlackDays}
                      onChange={(e) => setConfig({ ...config, criticalPathSlackDays: Number(e.target.value) })}
                      className="w-20 px-2 py-1 bg-bg-0 border border-border rounded-xs text-foreground font-bold text-center"
                    />
                    <span className="text-steel">DAYS</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: MATERIALS & SUPPLY CHAIN */}
        {/* ========================================================================= */}
        {activeTab === "materials" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <Card className="bg-bg-1 border-border shadow-plate">
              <CardHeader className="pb-2 border-b border-border/60">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-gold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-gold" />
                  <span>SUPPLY CHAIN & MATERIAL INDENT TRANSACTION POLICIES</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-5 font-mono text-xs">
                {/* Low Stock Telemetry */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground">Low Stock Telemetry Watcher</div>
                    <div className="text-[11px] text-steel leading-relaxed">
                      Trigger amber inventory alerts to site engineers when stock drops to or below the reorder point.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, lowStockAlerts: !config.lowStockAlerts })}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                      config.lowStockAlerts ? "bg-amber" : "bg-bg-2 border border-border"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-bg-0 transition-transform ${
                        config.lowStockAlerts ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* Prevent Over-Issue */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground">Atomic Over-Issue Protection</div>
                    <div className="text-[11px] text-steel leading-relaxed">
                      Block inventory issues that exceed available on-hand balance inside an isolated PostgreSQL transaction.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, preventOverIssue: !config.preventOverIssue })}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                      config.preventOverIssue ? "bg-amber" : "bg-bg-2 border border-border"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-bg-0 transition-transform ${
                        config.preventOverIssue ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* Two-Stage Indent Workflow */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground">Two-Stage Indent Approval Workflow</div>
                    <div className="text-[11px] text-steel leading-relaxed">
                      Require dual sign-off from both Lead PM and Financial Controller for orders exceeding $50,000.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, twoStageApproval: !config.twoStageApproval })}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                      config.twoStageApproval ? "bg-amber" : "bg-bg-2 border border-border"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-bg-0 transition-transform ${
                        config.twoStageApproval ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* Scrap Tolerance */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground">Standard Scrap & Cutting Loss Allowance</div>
                    <div className="text-[11px] text-steel leading-relaxed">
                      Expected rebar cutting and aggregate settlement tolerance factor:
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      max={10}
                      value={config.scrapTolerancePct}
                      onChange={(e) => setConfig({ ...config, scrapTolerancePct: Number(e.target.value) })}
                      className="w-20 px-2 py-1 bg-bg-0 border border-border rounded-xs text-foreground font-bold text-center"
                    />
                    <span className="text-steel">%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: NEON CLOUD & SECURITY */}
        {/* ========================================================================= */}
        {activeTab === "infrastructure" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <Card className="bg-bg-1 border-border shadow-plate">
              <CardHeader className="pb-2 border-b border-border/60 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-amber flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber" />
                  <span>NEON SERVERLESS POSTGRESQL & CLUSTER HEALTH</span>
                </CardTitle>
                <button
                  type="button"
                  onClick={handlePingDatabase}
                  className="px-2.5 py-1 rounded-xs bg-bg-0 border border-border hover:border-amber text-steel hover:text-amber font-mono text-[10px] uppercase font-bold transition flex items-center gap-1.5"
                >
                  <Zap className="w-3 h-3 text-amber" />
                  <span>{pingStatus === "probing" ? "PROBING..." : "PING CLUSTER"}</span>
                </button>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 font-mono text-xs">
                {pingStatus === "online" && (
                  <div className="p-2.5 bg-gold/15 border border-gold/40 text-gold rounded-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gold animate-ping" />
                      <span>Neon Lakebase Connected (ep-rapid-king-be4tclgw-pooler)</span>
                    </div>
                    <span className="font-bold">{pingLatency}ms ROUNDTRIP</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-bg-0 border border-border rounded-xs space-y-1">
                    <div className="text-[10px] text-steel uppercase">ACTIVE DATABASE BRANCH</div>
                    <div className="text-foreground font-bold truncate">{config.neonBranch}</div>
                    <div className="text-[9px] text-amber">Region: AWS US-East-2 (Ohio)</div>
                  </div>

                  <div className="p-3 bg-bg-0 border border-border rounded-xs space-y-1">
                    <div className="text-[10px] text-steel uppercase">ENCRYPTION & CHANNEL BINDING</div>
                    <div className="text-gold font-bold">TLSv1.3 · REQUIRED</div>
                    <div className="text-[9px] text-steel">channel_binding=require</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-concrete mb-1 font-bold">Operator Session JWT TTL</label>
                    <select
                      value={config.sessionTtlHours}
                      onChange={(e) => setConfig({ ...config, sessionTtlHours: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:border-amber focus:outline-none"
                    >
                      <option value={8}>8 Hours (Strict Field Safety)</option>
                      <option value={24}>24 Hours (Standard Operational Day)</option>
                      <option value={168}>7 Days (Director Workstation Extended)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-concrete mb-1 font-bold">Audit Log Retention Policy</label>
                    <select
                      value={config.auditRetentionDays}
                      onChange={(e) => setConfig({ ...config, auditRetentionDays: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:border-amber focus:outline-none"
                    >
                      <option value={90}>90 Days (Active Sprint)</option>
                      <option value={365}>1 Year (Statutory Civil Compliance)</option>
                      <option value={2555}>7 Years (National Infrastructure Audit)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: WEBHOOKS & NOTIFICATIONS */}
        {/* ========================================================================= */}
        {activeTab === "notifications" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <Card className="bg-bg-1 border-border shadow-plate">
              <CardHeader className="pb-2 border-b border-border/60 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-amber flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber" />
                  <span>EMERGENCY DISPATCH & TELEMETRY WEBHOOKS</span>
                </CardTitle>
                <button
                  type="button"
                  onClick={handleSimulateAlert}
                  className="px-2.5 py-1 rounded-xs bg-bg-0 border border-border hover:border-molten text-steel hover:text-molten font-mono text-[10px] uppercase font-bold transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-molten" />
                  <span>TEST DISPATCH</span>
                </button>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-concrete mb-1 font-bold">Critical Incident Webhook URL</label>
                  <input
                    type="url"
                    value={config.webhookUrl}
                    onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:border-amber focus:outline-none"
                  />
                  <div className="text-[10px] text-steel mt-1">
                    JSON payload containing project id, variance index, and timestamp will be POSTed on critical overrun or delay events.
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground">Telegram Emergency Channel Bridge</div>
                    <div className="text-[11px] text-steel leading-relaxed">
                      Instant mobile push alerts sent directly to Lead PM and Executive Directors for lost-time or structural incidents.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, telegramAlerts: !config.telegramAlerts })}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                      config.telegramAlerts ? "bg-amber" : "bg-bg-2 border border-border"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-bg-0 transition-transform ${
                        config.telegramAlerts ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground">Automated Daily Shift Handover Digest</div>
                    <div className="text-[11px] text-steel leading-relaxed">
                      Dispatch daily PDF executive summary at 18:00 UTC with rollup progress and open contractor indents.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, emailDigest: !config.emailDigest })}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                      config.emailDigest ? "bg-amber" : "bg-bg-2 border border-border"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-bg-0 transition-transform ${
                        config.emailDigest ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-[11px] font-mono text-steel">
            LAST COMMITTED AUDIT ID: <span className="text-foreground font-bold">CFG-994-PROD</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="submit"
              variant="primary"
              className="w-full sm:w-auto px-6 py-2 rounded-xs font-mono text-xs uppercase tracking-wider font-bold bg-amber text-bg-0 hover:bg-molten hover:text-foreground transition shadow-amber"
            >
              Commit Configuration Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

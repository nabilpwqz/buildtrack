"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Database,
  RefreshCw,
  Search,
  Download,
  Eye,
  X,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Clock,
  Zap,
  Layers,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  Plus,
  ArrowUpDown,
  TrendingUp,
} from "@/components/ui/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
} from "recharts";

interface TableMeta {
  key: string;
  label: string;
  category: "CORE" | "PROJECTS" | "FINANCIALS" | "SUPPLY" | "FIELD_AUDIT";
  rowCount: number;
  orderByField: string;
}

interface ActiveTablePayload {
  table: string;
  label: string;
  category: string;
  totalCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
  latencyMs: number;
  records: Record<string, any>[];
}

interface EngineInfo {
  engine: string;
  databaseSizeBytes: number;
  databaseSizePretty: string;
  activeConnections: number;
  postgresVersion: string;
}

interface DatabaseOverviewPayload {
  serverTimestamp: string;
  latencyMs: number;
  totalTables: number;
  totalRecords: number;
  engineInfo?: EngineInfo;
  tables: TableMeta[];
  liveStreams: {
    recentActivity: any[];
    recentExpenses: any[];
    recentTransactions: any[];
    recentProgress: any[];
  };
  activeTable?: ActiveTablePayload;
}

const CATEGORIES = [
  { id: "ALL", label: "ALL 25 TABLES" },
  { id: "CORE", label: "CORE & AUTH" },
  { id: "PROJECTS", label: "PROJECTS & CPM" },
  { id: "FINANCIALS", label: "FINANCIALS" },
  { id: "SUPPLY", label: "MATERIALS & SUPPLY" },
  { id: "FIELD_AUDIT", label: "FIELD & AUDIT" },
];

const SQL_PRESETS = [
  {
    label: "Top Projects by Budget",
    sql: `SELECT id, name, status, progress, "totalBudget", location FROM "Project" ORDER BY "totalBudget" DESC LIMIT 10`,
  },
  {
    label: "Overdue & Critical Tasks",
    sql: `SELECT id, title, priority, status, progress, deadline FROM "Task" WHERE "isDeleted" = false AND status != 'COMPLETED' ORDER BY deadline ASC LIMIT 15`,
  },
  {
    label: "Low Stock Materials",
    sql: `SELECT sku, name, unit, "availableQty", "reorderLevel", "unitCost" FROM "Material" WHERE "availableQty" <= "reorderLevel" ORDER BY "availableQty" ASC LIMIT 20`,
  },
  {
    label: "Recent High-Value Expenses",
    sql: `SELECT title, amount, date, "documentUrl" FROM "Expense" ORDER BY amount DESC LIMIT 15`,
  },
];

export default function AdminLiveDatabasePage() {
  const [role, setRole] = useState<string | null>(null);
  const [overview, setOverview] = useState<DatabaseOverviewPayload | null>(null);
  const [activeTableKey, setActiveTableKey] = useState<string>("project");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mode & Sorting
  const [workspaceMode, setWorkspaceMode] = useState<"explorer" | "sql">("explorer");
  const [streamTab, setStreamTab] = useState<"activity" | "expenses" | "transactions" | "progress">("activity");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDesc, setSortDesc] = useState<boolean>(true);

  // Live SSE & Telemetry History
  const [sseConnected, setSseConnected] = useState<boolean>(false);
  const [livePaused, setLivePaused] = useState<boolean>(false);
  const [latencyHistory, setLatencyHistory] = useState<Array<{ time: string; latency: number }>>([]);
  const [selectedRow, setSelectedRow] = useState<Record<string, any> | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [seeding, setSeeding] = useState<boolean>(false);
  const [seedNotice, setSeedNotice] = useState<string | null>(null);

  // Read-Only SQL Console State
  const [sqlInput, setSqlInput] = useState<string>(SQL_PRESETS[0].sql);
  const [sqlRunning, setSqlRunning] = useState<boolean>(false);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [sqlResult, setSqlResult] = useState<{ latencyMs: number; rowCount: number; rows: any[] } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("table");
      if (t) setActiveTableKey(t);
    }
  }, []);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        setRole(s?.user?.role || "GUEST");
      })
      .catch(() => setRole("GUEST"));
  }, []);

  const appendLatencyPoint = useCallback((timestamp: string, latency: number) => {
    setLatencyHistory((prev) => {
      const next = [
        ...prev,
        {
          time: new Date(timestamp).toLocaleTimeString([], {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          latency,
        },
      ];
      return next.slice(-20);
    });
  }, []);

  const fetchTableSnapshot = useCallback(async () => {
    if (role && role !== "ADMIN") {
      setLoading(false);
      return;
    }
    try {
      const params = new URLSearchParams({
        table: activeTableKey,
        page: page.toString(),
        pageSize: "20",
      });
      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim());
      }
      const res = await fetch(`/api/v1/admin/database?${params.toString()}`, {
        cache: "no-store",
      });
      if (res.status === 403 || res.status === 401) {
        setErrorMsg("ACCESS DENIED: Live database telemetry is strictly restricted to ADMIN.");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const msg = errBody?.error?.message || `HTTP ${res.status}`;
        throw new Error(msg);
      }
      const data = (await res.json()) as DatabaseOverviewPayload;
      setOverview(data);
      appendLatencyPoint(data.serverTimestamp, data.latencyMs);
      setErrorMsg(null);
    } catch (err: any) {
      const raw = err?.message || "";
      if (/prisma|DATABASE_URL|schema\.prisma|invocation|HTTP 500/i.test(raw)) {
        setErrorMsg("Please visit the database manually for security reasons.");
      } else {
        setErrorMsg(raw || "Please visit the database manually for security reasons.");
      }
    } finally {
      setLoading(false);
    }
  }, [activeTableKey, page, searchQuery, role, appendLatencyPoint]);

  useEffect(() => {
    if (role === "ADMIN") {
      fetchTableSnapshot();
    } else if (role !== null) {
      setLoading(false);
    }
  }, [role, fetchTableSnapshot]);

  // Real-time SSE stream for ADMIN
  useEffect(() => {
    if (role !== "ADMIN" || livePaused) {
      setSseConnected(false);
      return;
    }

    const es = new EventSource("/api/v1/admin/realtime/stream");

    es.addEventListener("snapshot", (ev) => {
      try {
        const snap = JSON.parse((ev as MessageEvent).data) as DatabaseOverviewPayload;
        setOverview((prev) => ({
          ...snap,
          activeTable: prev?.activeTable,
        }));
        appendLatencyPoint(snap.serverTimestamp, snap.latencyMs);
        setSseConnected(true);
      } catch {}
    });

    es.addEventListener("update", (ev) => {
      try {
        const snap = JSON.parse((ev as MessageEvent).data) as DatabaseOverviewPayload;
        setOverview((prev) => ({
          ...snap,
          activeTable: prev?.activeTable,
        }));
        appendLatencyPoint(snap.serverTimestamp, snap.latencyMs);
        setSseConnected(true);
        fetchTableSnapshot();
      } catch {}
    });

    es.addEventListener("heartbeat", (ev) => {
      try {
        const hb = JSON.parse((ev as MessageEvent).data);
        setOverview((prev) =>
          prev
            ? {
                ...prev,
                serverTimestamp: hb.serverTimestamp,
                latencyMs: hb.latencyMs,
                totalRecords: hb.totalRecords,
              }
            : prev
        );
        appendLatencyPoint(hb.serverTimestamp, hb.latencyMs);
        setSseConnected(true);
      } catch {}
    });

    es.onerror = () => {
      setSseConnected(false);
    };

    return () => {
      es.close();
    };
  }, [role, livePaused, fetchTableSnapshot, appendLatencyPoint]);

  const filteredTables = useMemo(() => {
    const all = overview?.tables || [];
    if (activeCategory === "ALL") return all;
    return all.filter((t) => t.category === activeCategory);
  }, [overview?.tables, activeCategory]);

  const domainDistribution = useMemo(() => {
    const groups: Record<string, number> = {
      CORE: 0,
      PROJECTS: 0,
      FINANCIALS: 0,
      SUPPLY: 0,
      FIELD_AUDIT: 0,
    };
    (overview?.tables || []).forEach((t) => {
      groups[t.category] = (groups[t.category] || 0) + t.rowCount;
    });
    return [
      { domain: "Core", rows: groups.CORE },
      { domain: "Projects", rows: groups.PROJECTS },
      { domain: "Finance", rows: groups.FINANCIALS },
      { domain: "Supply", rows: groups.SUPPLY },
      { domain: "Field/Audit", rows: groups.FIELD_AUDIT },
    ];
  }, [overview?.tables]);

  const activeRecords = useMemo(() => {
    const raw = overview?.activeTable?.records || [];
    if (!sortCol) return raw;
    return [...raw].sort((a, b) => {
      const av = a[sortCol];
      const bv = b[sortCol];
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDesc ? -cmp : cmp;
    });
  }, [overview?.activeTable?.records, sortCol, sortDesc]);

  const columns = useMemo(() => {
    if (activeRecords.length === 0) return [];
    return Object.keys(activeRecords[0]).slice(0, 6);
  }, [activeRecords]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDesc(!sortDesc);
    } else {
      setSortCol(col);
      setSortDesc(true);
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const rows = workspaceMode === "sql" ? sqlResult?.rows || [] : activeRecords;
    const prefix = workspaceMode === "sql" ? "sql_query" : overview?.activeTable?.table || activeTableKey;
    downloadFile(
      JSON.stringify(rows, null, 2),
      `buildtrack_${prefix}_${new Date().toISOString().slice(0, 19)}.json`,
      "application/json"
    );
  };

  const handleExportCsv = () => {
    const rows = workspaceMode === "sql" ? sqlResult?.rows || [] : activeRecords;
    if (rows.length === 0) return;
    const keys = Object.keys(rows[0]);
    const escapeCell = (val: any) => {
      const str = val === null || val === undefined ? "" : typeof val === "object" ? JSON.stringify(val) : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };
    const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => escapeCell(r[k])).join(","))].join("\n");
    const prefix = workspaceMode === "sql" ? "sql_query" : overview?.activeTable?.table || activeTableKey;
    downloadFile(csv, `buildtrack_${prefix}_${new Date().toISOString().slice(0, 19)}.csv`, "text/csv;charset=utf-8");
  };

  const handleCopyJson = () => {
    if (!selectedRow) return;
    navigator.clipboard.writeText(JSON.stringify(selectedRow, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleSeedDemoProject = async () => {
    setSeeding(true);
    setSeedNotice(null);
    try {
      const res = await fetch("/api/v1/admin/database/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        const raw = data?.error?.message || "";
        setErrorMsg(
          /prisma|DATABASE_URL|schema\.prisma|invocation/i.test(raw)
            ? "Please visit the database manually for security reasons."
            : raw || "Please visit the database manually for security reasons."
        );
      } else {
        setSeedNotice(
          `Seeded live project: ${data?.project?.name || "New Megaproject"} ($${((data?.project?.totalBudget || 0) / 1_000_000).toFixed(1)}M)`
        );
        await fetchTableSnapshot();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Seed request failed.");
    } finally {
      setSeeding(false);
    }
  };

  const handleRunSql = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSqlRunning(true);
    setSqlError(null);
    try {
      const res = await fetch("/api/v1/admin/database/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: sqlInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSqlError(data?.error?.message || "SQL execution failed.");
      } else {
        setSqlResult(data);
      }
    } catch (err: any) {
      setSqlError(err?.message || "Network error executing SQL.");
    } finally {
      setSqlRunning(false);
    }
  };

  if (role !== null && role !== "ADMIN") {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-bg-1 border border-crimson/50 rounded-sm shadow-plate text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-sm bg-crimson/15 border border-crimson/40 flex items-center justify-center">
          <Lock className="w-7 h-7 text-crimson" />
        </div>
        <h1 className="font-heading text-2xl font-extrabold uppercase tracking-wider text-foreground">
          ADMIN CLEARANCE REQUIRED
        </h1>
        <p className="text-xs font-mono text-steel">
          Real-time PostgreSQL database telemetry is strictly restricted to the ADMIN role. Your current role ({role.replace(/_/g, " ")}) does not have database inspection privileges.
        </p>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber hover:bg-amber-glow text-bg-0 text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition"
          >
            RETURN TO DASHBOARD
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold uppercase tracking-wider text-foreground">
              OPERATIONAL DATA <span className="text-amber">HUB</span>
            </h1>
            <span className="px-2 py-0.5 bg-amber/15 border border-amber/40 text-amber text-[10px] font-mono font-bold uppercase rounded-xs flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              ADMIN ONLY
            </span>
          </div>
          <p className="text-xs font-mono text-steel uppercase tracking-widest mt-1">
            REAL-TIME POSTGRESQL ENGINE TELEMETRY, 25-TABLE INSPECTOR & READ-ONLY SQL CONSOLE
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setLivePaused(!livePaused)}
            className={cn(
              "px-3 py-2 border rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer",
              sseConnected && !livePaused
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                : "bg-bg-2 border-border text-steel hover:text-amber"
            )}
          >
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                sseConnected && !livePaused ? "bg-emerald-400 animate-pulse" : "bg-steel"
              )}
            />
            <span>{livePaused ? "STREAM PAUSED" : sseConnected ? "SSE LIVE" : "CONNECTING"}</span>
          </button>

          <button
            type="button"
            onClick={fetchTableSnapshot}
            className="px-3 py-2 bg-bg-2 border border-border hover:border-amber text-foreground hover:text-amber text-xs font-mono uppercase tracking-wider rounded-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber" />
            <span>SYNC NOW</span>
          </button>

          <button
            type="button"
            onClick={handleSeedDemoProject}
            disabled={seeding}
            className="px-3.5 py-2 bg-bg-2 border border-amber/60 hover:bg-amber/15 text-amber text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5 text-amber" />
            <span>{seeding ? "SEEDING..." : "SEED PROJECT"}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 bg-bg-2 border border-border hover:border-amber text-foreground hover:text-amber text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="px-3.5 py-2 bg-amber hover:bg-amber-glow text-bg-0 text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-bg-0" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-crimson/10 border border-crimson/40 rounded-sm text-xs font-mono text-crimson flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {seedNotice && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/40 rounded-sm text-xs font-mono text-emerald-400 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{seedNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSeedNotice(null)}
            className="text-emerald-400 hover:text-foreground cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 5 Engine & Telemetry KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-bg-1 border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-steel">POSTGRES ENGINE</div>
              <div className="text-xl font-heading font-extrabold text-foreground mt-1">
                {overview?.engineInfo?.postgresVersion || "v16"}
              </div>
              <div className="text-[10px] font-mono text-amber">
                Size: {overview?.engineInfo?.databaseSizePretty || "..."}
              </div>
            </div>
            <HardDrive className="w-5 h-5 text-amber shrink-0" />
          </CardContent>
        </Card>

        <Card className="bg-bg-1 border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-steel">ACTIVE CONNECTIONS</div>
              <div className="text-2xl font-heading font-extrabold text-foreground mt-1">
                {overview?.engineInfo?.activeConnections ?? 1}
              </div>
              <div className="text-[10px] font-mono text-steel">25 Tables Active</div>
            </div>
            <Layers className="w-5 h-5 text-amber shrink-0" />
          </CardContent>
        </Card>

        <Card className="bg-bg-1 border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-steel">TOTAL LIVE RECORDS</div>
              <div className="text-2xl font-heading font-extrabold text-amber mt-1">
                {overview ? overview.totalRecords.toLocaleString() : "..."}
              </div>
              <div className="text-[10px] font-mono text-steel">PostgreSQL Live</div>
            </div>
            <Database className="w-5 h-5 text-amber shrink-0" />
          </CardContent>
        </Card>

        <Card className="bg-bg-1 border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-steel">DB QUERY LATENCY</div>
              <div className="text-2xl font-heading font-extrabold text-emerald-400 mt-1">
                {overview ? `${overview.latencyMs} ms` : "..."}
              </div>
              <div className="text-[10px] font-mono text-steel">25-Table Rollup</div>
            </div>
            <Zap className="w-5 h-5 text-emerald-400 shrink-0" />
          </CardContent>
        </Card>

        <Card className="bg-bg-1 border-border col-span-2 lg:col-span-1">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-steel">LAST REALTIME SYNC</div>
              <div className="text-sm font-mono font-bold text-foreground mt-2">
                {overview?.serverTimestamp
                  ? new Date(overview.serverTimestamp).toLocaleTimeString()
                  : "..."}
              </div>
              <div className="text-[10px] font-mono text-emerald-400">
                {sseConnected && !livePaused ? "SSE Streaming" : "Manual Sync"}
              </div>
            </div>
            <Clock className="w-5 h-5 text-steel shrink-0" />
          </CardContent>
        </Card>
      </div>

      {/* Live Telemetry Charts: Latency Pulse & Domain Record Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-bg-1 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber" />
              <span>REAL-TIME POSTGRESQL QUERY LATENCY (MS)</span>
            </CardTitle>
            <CardDescription className="text-[11px] font-mono">
              Live roundtrip latency telemetry sampled from SSE heartbeats and snapshots
            </CardDescription>
          </CardHeader>
          <CardContent className="h-44 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latencyHistory}>
                <defs>
                  <linearGradient id="amberLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                <XAxis dataKey="time" stroke="#78716C" fontSize={10} />
                <YAxis stroke="#78716C" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1C1917",
                    borderColor: "#D97706",
                    fontSize: "11px",
                    fontFamily: "monospace",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="latency"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  fill="url(#amberLatency)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-bg-1 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber" />
              <span>RECORD DISTRIBUTION BY ENTERPRISE DOMAIN</span>
            </CardTitle>
            <CardDescription className="text-[11px] font-mono">
              Live row volume across Core, Projects, Financials, Supply Chain, and Field Audit
            </CardDescription>
          </CardHeader>
          <CardContent className="h-44 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={domainDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                <XAxis dataKey="domain" stroke="#78716C" fontSize={10} />
                <YAxis stroke="#78716C" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1C1917",
                    borderColor: "#D97706",
                    fontSize: "11px",
                    fontFamily: "monospace",
                  }}
                />
                <Bar dataKey="rows" fill="#D97706" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Primary Workspace Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWorkspaceMode("explorer")}
            className={cn(
              "px-4 py-2 rounded-xs text-xs font-mono font-bold uppercase tracking-wider border transition cursor-pointer",
              workspaceMode === "explorer"
                ? "bg-amber text-bg-0 border-amber"
                : "bg-bg-1 text-steel border-border hover:border-amber/60 hover:text-foreground"
            )}
          >
            25-TABLE LIVE EXPLORER
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceMode("sql")}
            className={cn(
              "px-4 py-2 rounded-xs text-xs font-mono font-bold uppercase tracking-wider border transition cursor-pointer",
              workspaceMode === "sql"
                ? "bg-amber text-bg-0 border-amber"
                : "bg-bg-1 text-steel border-border hover:border-amber/60 hover:text-foreground"
            )}
          >
            SQL READ-ONLY CONSOLE
          </button>
        </div>

        {workspaceMode === "explorer" && (
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-2.5 py-1 rounded-xs text-[10px] font-mono font-bold uppercase tracking-wider border transition cursor-pointer",
                  activeCategory === cat.id
                    ? "bg-amber/20 text-amber border-amber"
                    : "bg-bg-1 text-steel border-border hover:border-amber/60 hover:text-foreground"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {workspaceMode === "explorer" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: All 25 Tables Directory */}
          <Card className="lg:col-span-4 bg-bg-1 border-border h-fit">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-amber" />
                <span>DATABASE TABLES ({filteredTables.length})</span>
              </CardTitle>
              <CardDescription className="text-[11px] font-mono">
                Select any table to inspect real-time PostgreSQL rows
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 max-h-[540px] overflow-y-auto space-y-1">
              {filteredTables.map((t) => {
                const isSelected = t.key === activeTableKey;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      setActiveTableKey(t.key);
                      setPage(0);
                      setSortCol(null);
                    }}
                    className={cn(
                      "w-full px-3 py-2 rounded-xs flex items-center justify-between text-left font-mono text-xs transition cursor-pointer",
                      isSelected
                        ? "bg-amber/15 border-l-2 border-amber text-amber font-bold"
                        : "hover:bg-bg-2 text-concrete"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate">{t.label}</div>
                      <div className="text-[9px] text-steel uppercase">{t.key}</div>
                    </div>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-xs text-[10px] font-bold shrink-0",
                        isSelected ? "bg-amber text-bg-0" : "bg-bg-0 border border-border text-steel"
                      )}
                    >
                      {t.rowCount}
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Right: Active Table Live Records */}
          <Card className="lg:col-span-8 bg-bg-1 border-border">
            <CardHeader className="pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-foreground">
                  TABLE: <span className="text-amber">{overview?.activeTable?.label || activeTableKey}</span>
                </CardTitle>
                <CardDescription className="text-[11px] font-mono">
                  {overview?.activeTable
                    ? `${overview.activeTable.totalCount} total rows | Query ${overview.activeTable.latencyMs} ms`
                    : "Loading live table rows..."}
                </CardDescription>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-steel absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                  }}
                  placeholder="Filter live rows..."
                  className="w-full pl-8 pr-3 py-1.5 bg-bg-0 border border-border focus:border-amber rounded-xs text-xs font-mono text-foreground outline-none"
                />
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading && !overview?.activeTable ? (
                <div className="p-8 text-center font-mono text-xs text-steel">
                  QUERYING POSTGRESQL TABLE...
                </div>
              ) : activeRecords.length === 0 ? (
                <div className="p-8 text-center font-mono text-xs text-steel">
                  NO RECORDS MATCHING FILTER IN THIS TABLE
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead>
                      <tr className="bg-bg-0 border-b border-border text-[10px] uppercase text-steel">
                        {columns.map((col) => (
                          <th key={col} className="px-3 py-2.5 font-bold whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleSort(col)}
                              className="inline-flex items-center gap-1 hover:text-amber cursor-pointer"
                            >
                              <span>{col}</span>
                              <ArrowUpDown className="w-3 h-3 opacity-60" />
                            </button>
                          </th>
                        ))}
                        <th className="px-3 py-2.5 text-right font-bold">INSPECT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {activeRecords.map((row, idx) => (
                        <tr
                          key={row.id || idx}
                          onClick={() => setSelectedRow(row)}
                          className="hover:bg-bg-2/70 transition cursor-pointer"
                        >
                          {columns.map((col) => {
                            const val = row[col];
                            const display =
                              val === null || val === undefined
                                ? "null"
                                : typeof val === "object"
                                ? JSON.stringify(val)
                                : String(val);
                            return (
                              <td
                                key={col}
                                className="px-3 py-2 max-w-[180px] truncate text-concrete"
                                title={display}
                              >
                                {display}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRow(row);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-xs bg-bg-0 border border-border hover:border-amber text-[10px] text-amber cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>JSON</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {overview?.activeTable && overview.activeTable.pageCount > 1 && (
                <div className="px-4 py-3 border-t border-border flex items-center justify-between font-mono text-xs">
                  <span className="text-steel">
                    Page {overview.activeTable.page + 1} of {overview.activeTable.pageCount}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      className="p-1.5 bg-bg-0 border border-border rounded-xs disabled:opacity-40 hover:border-amber cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={page + 1 >= overview.activeTable.pageCount}
                      onClick={() => setPage((p) => p + 1)}
                      className="p-1.5 bg-bg-0 border border-border rounded-xs disabled:opacity-40 hover:border-amber cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Read-Only SQL Console */
        <Card className="bg-bg-1 border-border">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber" />
              <span>ADMIN READ-ONLY SQL DIAGNOSTICS CONSOLE</span>
            </CardTitle>
            <CardDescription className="text-[11px] font-mono">
              Execute safe SELECT / WITH queries against live PostgreSQL tables (capped at 100 rows; DML/DDL blocked)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {SQL_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setSqlInput(preset.sql)}
                  className="px-2.5 py-1 bg-bg-0 border border-border hover:border-amber rounded-xs text-[11px] font-mono text-steel hover:text-amber transition cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleRunSql} className="space-y-3">
              <textarea
                value={sqlInput}
                onChange={(e) => setSqlInput(e.target.value)}
                rows={4}
                className="w-full p-3 bg-bg-0 border border-border focus:border-amber rounded-xs font-mono text-xs text-foreground outline-none"
                placeholder="SELECT * FROM &quot;Project&quot; LIMIT 10"
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-mono text-steel">
                  {sqlResult
                    ? `Returned ${sqlResult.rowCount} rows in ${sqlResult.latencyMs} ms`
                    : "Ready for read-only SELECT execution"}
                </span>
                <button
                  type="submit"
                  disabled={sqlRunning}
                  className="px-4 py-2 bg-amber hover:bg-amber-glow text-bg-0 text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition cursor-pointer disabled:opacity-50"
                >
                  {sqlRunning ? "EXECUTING..." : "RUN SQL QUERY"}
                </button>
              </div>
            </form>

            {sqlError && (
              <div className="p-3 bg-crimson/10 border border-crimson/40 rounded-xs text-xs font-mono text-crimson">
                {sqlError}
              </div>
            )}

            {sqlResult && sqlResult.rows.length > 0 && (
              <div className="overflow-x-auto border border-border rounded-xs">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-bg-0 border-b border-border text-[10px] uppercase text-steel">
                      {Object.keys(sqlResult.rows[0]).map((col) => (
                        <th key={col} className="px-3 py-2 font-bold whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {sqlResult.rows.map((r, i) => (
                      <tr
                        key={i}
                        onClick={() => setSelectedRow(r)}
                        className="hover:bg-bg-2/70 cursor-pointer"
                      >
                        {Object.keys(sqlResult.rows[0]).map((col) => (
                          <td key={col} className="px-3 py-2 max-w-[220px] truncate text-concrete">
                            {r[col] === null || r[col] === undefined ? "null" : String(r[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Multi-Stream Real-Time Operational Feed */}
      <Card className="bg-bg-1 border-border">
        <CardHeader className="pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber" />
              <span>MULTI-STREAM REAL-TIME DATABASE FEED</span>
            </CardTitle>
            <CardDescription className="text-[11px] font-mono">
              Switch live between Audit Logs, Financial Expenses, Material Stock Ledger, and Field Progress
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "activity", label: "AUDIT LOGS" },
              { id: "expenses", label: "EXPENSES" },
              { id: "transactions", label: "STOCK LEDGER" },
              { id: "progress", label: "FIELD PROGRESS" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStreamTab(tab.id as any)}
                className={cn(
                  "px-2.5 py-1 rounded-xs text-[10px] font-mono font-bold uppercase border transition cursor-pointer",
                  streamTab === tab.id
                    ? "bg-amber text-bg-0 border-amber"
                    : "bg-bg-0 text-steel border-border hover:border-amber/60"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-border/50 max-h-80 overflow-y-auto font-mono text-xs">
            {streamTab === "activity" &&
              (overview?.liveStreams?.recentActivity || []).map((act: any) => (
                <div
                  key={act.id}
                  onClick={() => setSelectedRow(act)}
                  className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-bg-2/60 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-1.5 py-0.5 rounded-xs bg-amber/15 border border-amber/40 text-amber text-[10px] font-bold shrink-0">
                      {act.action}
                    </span>
                    <span className="text-foreground font-bold shrink-0">{act.entity}</span>
                    <span className="text-steel truncate">
                      {act.actorName} ({act.actorRole})
                    </span>
                  </div>
                  <span className="text-[10px] text-steel shrink-0">
                    {new Date(act.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}

            {streamTab === "expenses" &&
              (overview?.liveStreams?.recentExpenses || []).map((exp: any) => (
                <div
                  key={exp.id}
                  onClick={() => setSelectedRow(exp)}
                  className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-bg-2/60 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-1.5 py-0.5 rounded-xs bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold shrink-0">
                      ${Number(exp.amount || 0).toLocaleString()}
                    </span>
                    <span className="text-foreground font-bold truncate">{exp.title}</span>
                    <span className="text-steel truncate hidden sm:inline">
                      {exp.project?.name} ({exp.category?.name})
                    </span>
                  </div>
                  <span className="text-[10px] text-steel shrink-0">
                    {new Date(exp.date).toLocaleDateString()}
                  </span>
                </div>
              ))}

            {streamTab === "transactions" &&
              (overview?.liveStreams?.recentTransactions || []).map((tx: any) => (
                <div
                  key={tx.id}
                  onClick={() => setSelectedRow(tx)}
                  className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-bg-2/60 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-1.5 py-0.5 rounded-xs bg-amber/15 border border-amber/40 text-amber text-[10px] font-bold shrink-0">
                      {tx.type}
                    </span>
                    <span className="text-foreground font-bold truncate">
                      {tx.material?.name} ({tx.quantity} {tx.material?.unit})
                    </span>
                    <span className="text-steel truncate hidden sm:inline">{tx.material?.sku}</span>
                  </div>
                  <span className="text-[10px] text-steel shrink-0">
                    {new Date(tx.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}

            {streamTab === "progress" &&
              (overview?.liveStreams?.recentProgress || []).map((rep: any) => (
                <div
                  key={rep.id}
                  onClick={() => setSelectedRow(rep)}
                  className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-bg-2/60 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-1.5 py-0.5 rounded-xs bg-amber/15 border border-amber/40 text-amber text-[10px] font-bold shrink-0">
                      {rep.percentage}%
                    </span>
                    <span className="text-foreground font-bold truncate">{rep.project?.name}</span>
                    <span className="text-steel truncate hidden sm:inline">{rep.task?.title || rep.description}</span>
                  </div>
                  <span className="text-[10px] text-steel shrink-0">
                    {new Date(rep.date || rep.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Raw JSON Record Inspector Modal */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-bg-1 border border-amber/50 rounded-sm max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="font-mono text-xs font-bold uppercase text-amber">
                RAW POSTGRESQL RECORD INSPECTOR
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="px-2.5 py-1 bg-bg-0 border border-border hover:border-amber rounded-xs text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "COPIED" : "COPY"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRow(null)}
                  className="p-1 text-steel hover:text-amber cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <pre className="p-4 overflow-auto text-xs font-mono text-concrete bg-bg-0 flex-1">
              {JSON.stringify(selectedRow, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

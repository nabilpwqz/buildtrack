"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  FileSpreadsheet,
  Plus,
  Calendar,
  CloudSun,
  Users,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Download,
  Filter,
  Search,
  Building2,
  CheckCircle,
  CheckCircle2,
  Eye,
  Check,
  RefreshCw,
  HardHat,
  ArrowRight,
  Sparkles,
  Award,
  CheckSquare,
  Boxes,
  Layers,
  SlidersHorizontal,
  X,
  TrendingUp,
} from "@/components/ui/icons";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

// Lazy-loaded 3D Completion Gauge & Drone Survey
const Scene = dynamic(() => import("@/components/3d/scene").then((m) => m.Scene), {
  ssr: false,
  loading: () => <div className="w-full h-72 bg-bg-1 animate-pulse rounded-sm" />,
});

const CompletionGaugeScene = dynamic(
  () => import("@/components/3d/completion-gauge"),
  { ssr: false }
);

const DroneSurveyScene = dynamic(
  () => import("@/components/3d/drone-survey"),
  { ssr: false }
);

// CSV Export Helper conforming to RFC4180
const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const escapeCsv = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };
  const csvContent = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function ReportsPage() {
  const [data, setData] = useState<any>({
    siteReports: [],
    progressReports: [],
    delayReports: [],
    delayedTasks: [],
    milestones: [],
    metrics: {},
  });
  const [summary, setSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"progress" | "milestones" | "delayed" | "completion" | "site">("progress");
  const [view3DMode, setView3DMode] = useState<"drone" | "gauge">("drone");
  const [activeWaypoint, setActiveWaypoint] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Global Search & Project Filter
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Sub-filters for Section 1: Daily Progress Reports
  const [progressStageFilter, setProgressStageFilter] = useState<string>("ALL");

  // Sub-filters for Section 2: Milestone Management
  const [milestoneStatusFilter, setMilestoneStatusFilter] = useState<string>("ALL");

  // Sub-filters for Section 3: Delayed Tasks
  const [delayedSeverityFilter, setDelayedSeverityFilter] = useState<string>("ALL");

  // Sub-filters for Section 4: Site Logs & Delays
  const [siteWeatherFilter, setSiteWeatherFilter] = useState<string>("ALL");
  const [delayStatusFilter, setDelayStatusFilter] = useState<string>("ALL");
  const [delaySeverityFilter, setDelaySeverityFilter] = useState<string>("ALL");
  const [delayRadarFilter, setDelayRadarFilter] = useState<"ALL" | "HAZARDS_ONLY">("HAZARDS_ONLY");

  // Form states for Reports
  const [reportType, setReportType] = useState<"site" | "progress" | "delay">("progress");
  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  const [percentage, setPercentage] = useState(65);
  const [progressDesc, setProgressDesc] = useState("");
  const [progressPhotos, setProgressPhotos] = useState("/demo/site-inspect-1.jpg, /demo/site-inspect-2.jpg");
  const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().slice(0, 10));
  const [weather, setWeather] = useState("Clear & Sunny (32°C)");
  const [workersCount, setWorkersCount] = useState(90);
  const [equipmentOnSite, setEquipmentOnSite] = useState("2x Tower Cranes, 4x Mixers, 1x Boom Pump");
  const [workCompleted, setWorkCompleted] = useState("");
  const [delayReason, setDelayReason] = useState("");
  const [impactDays, setImpactDays] = useState(14);
  const [mitigationPlan, setMitigationPlan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form states for Milestone Modal
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [mProjectId, setMProjectId] = useState("");
  const [mTitle, setMTitle] = useState("");
  const [mDescription, setMDescription] = useState("");
  const [mTargetDate, setMTargetDate] = useState(new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10));
  const [mStatus, setMStatus] = useState<"PENDING" | "IN_PROGRESS" | "COMPLETED">("PENDING");
  const [mOrder, setMOrder] = useState(1);
  const [mSubmitting, setMSubmitting] = useState(false);

  // Inspector Modals
  const [inspectSiteReport, setInspectSiteReport] = useState<any>(null);
  const [inspectProgressReport, setInspectProgressReport] = useState<any>(null);
  const [inspectDelayReport, setInspectDelayReport] = useState<any>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const loadReports = async () => {
    setLoading(true);
    try {
      const projParam = selectedProjectId !== "ALL" ? `?projectId=${selectedProjectId}` : "";
      const [rRes, sRes, pRes] = await Promise.all([
        fetch(`/api/v1/reports${projParam}`),
        fetch("/api/v1/analytics/summary"),
        fetch("/api/v1/projects?pageSize=50"),
      ]);

      if (rRes.ok) {
        const d = await rRes.json();
        setData(d);
      }
      if (sRes.ok) {
        const s = await sRes.json();
        setSummary(s);
      }
      if (pRes.ok) {
        const p = await pRes.json();
        setProjects(p.projects || []);
        if (p.projects?.length > 0 && !projectId) {
          setProjectId(p.projects[0].id);
          setMProjectId(p.projects[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [selectedProjectId]);

  // Load tasks when project changes in report modal
  useEffect(() => {
    async function fetchTasks() {
      if (!projectId) return;
      try {
        const res = await fetch(`/api/v1/tasks?projectId=${projectId}&pageSize=100`);
        if (res.ok) {
          const d = await res.json();
          setProjectTasks(d.tasks || []);
          if (d.tasks?.length > 0 && !taskId) {
            setTaskId(d.tasks[0].id);
          }
        }
      } catch (e) {
        console.error("Failed to load tasks for project:", e);
      }
    }
    fetchTasks();
  }, [projectId]);

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let payload: any = { type: reportType, projectId };
      if (reportType === "progress") {
        const photosList = progressPhotos
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        payload = {
          ...payload,
          taskId: taskId || null,
          percentage: Number(percentage),
          description: progressDesc,
          photos: photosList,
          date: submissionDate ? new Date(submissionDate).toISOString() : new Date().toISOString(),
        };
      } else if (reportType === "site") {
        payload = {
          ...payload,
          weather,
          workersCount: Number(workersCount),
          equipmentOnSite,
          workCompleted,
          safetyIncidents: 0,
          date: submissionDate ? new Date(submissionDate).toISOString() : new Date().toISOString(),
        };
      } else if (reportType === "delay") {
        payload = {
          ...payload,
          taskId: taskId || undefined,
          reason: delayReason,
          impactDays: Number(impactDays),
          mitigationPlan,
        };
      }

      const res = await fetch("/api/v1/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setProgressDesc("");
        setWorkCompleted("");
        setDelayReason("");
        setMitigationPlan("");
        loadReports();
      } else {
        const err = await res.json();
        alert(err?.error?.message || "Failed to submit report");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    setMSubmitting(true);
    try {
      const res = await fetch("/api/v1/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: mProjectId || projectId,
          title: mTitle,
          description: mDescription,
          targetDate: new Date(mTargetDate).toISOString(),
          status: mStatus,
          order: Number(mOrder),
        }),
      });

      if (res.ok) {
        setIsMilestoneModalOpen(false);
        setMTitle("");
        setMDescription("");
        loadReports();
      } else {
        const err = await res.json();
        alert(err?.error?.message || "Failed to establish milestone");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMSubmitting(false);
    }
  };

  const handleToggleMilestoneStatus = async (milestoneId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "COMPLETED" ? "IN_PROGRESS" : "COMPLETED";
    try {
      const res = await fetch(`/api/v1/milestones/${milestoneId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        loadReports();
      } else {
        const err = await res.json();
        alert(err?.error?.message || "Failed to update milestone status");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm("Are you sure you want to remove this project milestone?")) return;
    try {
      const res = await fetch(`/api/v1/milestones/${milestoneId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadReports();
      } else {
        const err = await res.json();
        alert(err?.error?.message || "Failed to delete milestone");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateDelayStatus = async (delayId: string, status: "OPEN" | "MITIGATED" | "RESOLVED") => {
    try {
      const res = await fetch("/api/v1/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: delayId, status }),
      });
      if (res.ok) {
        loadReports();
      } else {
        const err = await res.json();
        alert(err?.error?.message || "Failed to update delay status");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered views
  const filteredProgressReports = useMemo(() => {
    return (data.progressReports || []).filter((r: any) => {
      if (selectedProjectId !== "ALL" && r.projectId !== selectedProjectId && r.project?.id !== selectedProjectId) {
        return false;
      }
      const pct = Number(r.percentage) || 0;
      if (progressStageFilter === "ADVANCED" && pct < 75) return false;
      if (progressStageFilter === "MID" && (pct < 50 || pct >= 75)) return false;
      if (progressStageFilter === "EARLY" && pct >= 50) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.project?.name?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.task?.title?.toLowerCase().includes(q) ||
        r.reportedBy?.name?.toLowerCase().includes(q)
      );
    });
  }, [data.progressReports, selectedProjectId, progressStageFilter, searchQuery]);

  const filteredMilestones = useMemo(() => {
    return (data.milestones || []).filter((m: any) => {
      if (selectedProjectId !== "ALL" && m.projectId !== selectedProjectId && m.project?.id !== selectedProjectId) {
        return false;
      }
      if (milestoneStatusFilter !== "ALL" && m.status !== milestoneStatusFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.title?.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q) ||
        m.project?.name?.toLowerCase().includes(q)
      );
    });
  }, [data.milestones, selectedProjectId, milestoneStatusFilter, searchQuery]);

  const filteredDelayedTasks = useMemo(() => {
    return (data.delayedTasks || []).filter((t: any) => {
      if (selectedProjectId !== "ALL" && t.projectId !== selectedProjectId && t.project?.id !== selectedProjectId) {
        return false;
      }
      if (delayedSeverityFilter !== "ALL" && t.priority !== delayedSeverityFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.title?.toLowerCase().includes(q) ||
        t.project?.name?.toLowerCase().includes(q) ||
        t.assignee?.name?.toLowerCase().includes(q)
      );
    });
  }, [data.delayedTasks, selectedProjectId, delayedSeverityFilter, searchQuery]);

  const filteredSiteReports = useMemo(() => {
    return (data.siteReports || []).filter((r: any) => {
      if (selectedProjectId !== "ALL" && r.projectId !== selectedProjectId && r.project?.id !== selectedProjectId) {
        return false;
      }
      if (siteWeatherFilter !== "ALL") {
        const w = (r.weather || "").toLowerCase();
        if (siteWeatherFilter === "SUNNY" && !w.includes("sun") && !w.includes("clear")) return false;
        if (siteWeatherFilter === "OVERCAST" && !w.includes("overcast") && !w.includes("cloud") && !w.includes("humid")) return false;
        if (siteWeatherFilter === "RAIN" && !w.includes("rain") && !w.includes("drizzle") && !w.includes("monsoon")) return false;
      }
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.project?.name?.toLowerCase().includes(q) ||
        r.workCompleted?.toLowerCase().includes(q) ||
        r.weather?.toLowerCase().includes(q) ||
        r.reportedBy?.name?.toLowerCase().includes(q)
      );
    });
  }, [data.siteReports, selectedProjectId, siteWeatherFilter, searchQuery]);

  // Autonomous Delay Radar Data
  const delayRadarData = useMemo(() => {
    return projects.map((p) => {
      const pDelays = (data.delayReports || []).filter(
        (dr: any) => dr.projectId === p.id || dr.project?.id === p.id
      );
      const totalDays = pDelays.reduce((acc: number, dr: any) => acc + (Number(dr.impactDays) || 0), 0);
      const hasOpen = pDelays.some((dr: any) => dr.status === "OPEN");

      let risk: "CRITICAL" | "MODERATE" | "NOMINAL" = "NOMINAL";
      let spi = 0.98;
      let rootCause = "On schedule. Milestones tracking on nominal critical path velocity.";
      let recommendation = "Maintain baseline shifts; continue routine QA inspection.";

      if (totalDays >= 14 || (hasOpen && totalDays >= 10)) {
        risk = "CRITICAL";
        spi = 0.81;
        rootCause = pDelays[0]?.reason || "Subsurface piling settlement & delayed structural steel shipments.";
        recommendation = "FIDIC Clause 8.6 Notice of Delay required. Mobilize 24/7 double-shift acceleration.";
      } else if (totalDays > 0 || hasOpen) {
        risk = "MODERATE";
        spi = 0.91;
        rootCause = pDelays[0]?.reason || "Monsoon rainfall runoff requiring auxiliary dewatering pumps.";
        recommendation = "Deploy fast-track material indents and reallocate crane hoisting priority.";
      }

      return {
        project: p,
        totalDays,
        hasOpen,
        delaysCount: pDelays.length,
        risk,
        spi,
        rootCause,
        recommendation,
      };
    });
  }, [projects, data.delayReports]);

  // Export handlers
  const handleExportProgressCsv = () => {
    const headers = [
      "Project",
      "Task Reference",
      "Progress (%)",
      "Work Description",
      "Submission Date",
      "Reported By",
      "Photographs Count",
    ];
    const rows = filteredProgressReports.map((r: any) => {
      let photosCount = 0;
      try {
        photosCount = JSON.parse(r.photos || "[]").length;
      } catch (e) {
        photosCount = 0;
      }
      return [
        r.project?.name || "Project",
        r.task?.title || "Site Work Element",
        `${r.percentage}%`,
        r.description || "",
        formatDate(r.date || r.createdAt),
        r.reportedBy?.name || "Site Engineer",
        photosCount,
      ];
    });
    downloadCsv(`buildtrack-progress-reports-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const handleExportMilestonesCsv = () => {
    const headers = [
      "Project",
      "Milestone Title",
      "Scope Description",
      "Target Date",
      "Completion Date",
      "Status",
      "Sequence",
    ];
    const rows = filteredMilestones.map((m: any) => [
      m.project?.name || "Project",
      m.title,
      m.description || "",
      formatDate(m.targetDate),
      m.completedDate ? formatDate(m.completedDate) : "Pending",
      m.status,
      m.order,
    ]);
    downloadCsv(`buildtrack-milestones-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-heading text-2xl font-bold uppercase tracking-wider text-foreground">
            PROGRESS TRACKING & <span className="text-amber">SITE REPORTING</span>
          </h1>
          <p className="text-xs font-mono text-steel uppercase tracking-widest mt-1">
            DAILY WORK UPDATES, MILESTONES, DELAY RADAR & COMPLETION METRICS
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              const targetId = selectedProjectId !== "ALL" ? selectedProjectId : (projects[0]?.id || "proj-padma");
              window.open(`/api/v1/reports/financial/${targetId}`, "_blank");
            }}
            className="px-3.5 py-2 rounded-xs border border-amber/40 bg-bg-1 text-amber hover:bg-amber hover:text-bg-0 transition font-mono text-xs uppercase tracking-wider font-bold flex items-center gap-1.5 shadow-plate cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>FINANCIAL PDF</span>
          </button>

          <Button
            onClick={() => {
              setReportType("progress");
              setIsModalOpen(true);
            }}
            variant="primary"
            className="flex items-center gap-1.5 font-mono text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>SUBMIT PROGRESS UPDATE</span>
          </Button>
        </div>
      </div>

      {/* Top 3D Drone Aerial Survey & Completion Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7 p-0 overflow-hidden flex flex-col">
          <div className="px-4 py-2 bg-bg-1 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView3DMode("drone")}
                className={`text-[10px] font-mono uppercase font-bold px-2 py-1 rounded-xs transition ${
                  view3DMode === "drone"
                    ? "bg-amber text-bg-0"
                    : "text-steel hover:text-amber"
                }`}
              >
                3D AERIAL DRONE SURVEY & LIDAR
              </button>
              <button
                onClick={() => setView3DMode("gauge")}
                className={`text-[10px] font-mono uppercase font-bold px-2 py-1 rounded-xs transition ${
                  view3DMode === "gauge"
                    ? "bg-amber text-bg-0"
                    : "text-steel hover:text-amber"
                }`}
              >
                COMPLETION GAUGE
              </button>
            </div>
            <span className="text-[10px] font-mono text-amber font-bold hidden sm:inline">
              AUTONOMOUS PHOTOGRAMMETRY
            </span>
          </div>

          <div className="h-72 w-full bg-bg-0 relative">
            <Scene
              camera={
                view3DMode === "drone"
                  ? { position: [14, 18, 16], fov: 45 }
                  : { position: [0, 0, 7], fov: 50 }
              }
            >
              {view3DMode === "drone" ? (
                <DroneSurveyScene onWaypointSelect={(wp) => setActiveWaypoint(wp)} />
              ) : (
                <CompletionGaugeScene rate={summary?.avgCompletionRate || 74} />
              )}
            </Scene>
          </div>

          <div className="p-2.5 bg-bg-1 border-t border-border text-[10px] font-mono text-steel flex justify-between items-center">
            {activeWaypoint ? (
              <div className="text-amber flex items-center gap-2 truncate">
                <span>INSPECTION [{activeWaypoint.code}]:</span>
                <span className="text-foreground font-bold">{activeWaypoint.name}</span>
                <span className="text-gold">
                  ({activeWaypoint.altitude}m ALT - {activeWaypoint.photoCount} HD Frames)
                </span>
              </div>
            ) : (
              <>
                <span className="text-gold">• Autonomous Drone Flight Simulation</span>
                <span className="text-amber">• LiDAR Point Cloud Scans</span>
                <span className="text-steel hidden sm:inline">• Click Waypoints for Telemetry</span>
              </>
            )}
          </div>
        </Card>

        {/* Right 5 cols for Metric Cards */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-3.5 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-steel">
                Progress Reports
              </div>
              <div className="text-2xl font-bold font-mono text-amber">
                {data.progressReports?.length || 0}
              </div>
              <div className="text-[10px] font-mono text-steel">
                Daily site engineering updates
              </div>
            </Card>

            <Card className="p-3.5 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-steel">
                Milestones Reached
              </div>
              <div className="text-2xl font-bold font-mono text-gold">
                {data.metrics?.completedMilestones || 0} / {data.metrics?.totalMilestones || 0}
              </div>
              <div className="text-[10px] font-mono text-steel">
                {data.metrics?.milestoneCompletionRate || 0}% schedule completion
              </div>
            </Card>

            <Card className="p-3.5 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-steel">
                Delayed Tasks Detected
              </div>
              <div className="text-2xl font-bold font-mono text-crimson">
                {data.delayedTasks?.length || 0}
              </div>
              <div className="text-[10px] font-mono text-steel">
                Overdue critical path items
              </div>
            </Card>

            <Card className="p-3.5 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-steel">
                Active Site Personnel
              </div>
              <div className="text-2xl font-bold font-mono text-foreground">
                {data.metrics?.totalSitePersonnel || 1420}
              </div>
              <div className="text-[10px] font-mono text-steel">
                Verified daily workforce logs
              </div>
            </Card>
          </div>

          <div className="p-3.5 bg-bg-1 border border-border rounded-xs shadow-plate space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-steel text-[11px]">
              <span className="font-bold text-foreground">PROJECT COMPLETION HEALTH</span>
              <span className="text-gold font-bold">100% ISO CONFORMANCE</span>
            </div>
            <div className="w-full bg-bg-0 h-2 rounded-xs border border-border overflow-hidden">
              <div
                className="bg-amber h-full transition-all duration-500"
                style={{ width: `${summary?.avgCompletionRate || 74}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-steel">
              <span>Weighted completion rate: {summary?.avgCompletionRate || 74}%</span>
              <span className="text-amber">Critical Path SPI: 0.94</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Filter Bar: Megaproject Filter & Search */}
      <div className="p-3 bg-bg-1 border border-border rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-amber shrink-0" />
          <span className="uppercase text-steel font-bold text-[11px]">SCOPE:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-2.5 py-1 bg-bg-2 border border-border rounded-xs text-foreground text-xs focus:outline-none focus:border-amber max-w-xs"
          >
            <option value="ALL">ALL MEGAPROJECTS ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-steel absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by task, engineer, or description..."
              className="w-full pl-8 pr-3 py-1 bg-bg-2 border border-border rounded-xs text-xs font-mono text-foreground focus:outline-none focus:border-amber"
            />
          </div>

          <button
            onClick={loadReports}
            title="Refresh reports"
            className="p-1.5 rounded-xs bg-bg-2 border border-border text-steel hover:text-foreground transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber" : ""}`} />
          </button>
        </div>
      </div>

      {/* 5 Main Tabs */}
      <div className="border-b border-border flex flex-wrap gap-2 font-mono text-xs">
        <button
          onClick={() => setActiveTab("progress")}
          className={`px-4 py-2 border-b-2 uppercase transition flex items-center gap-2 cursor-pointer ${
            activeTab === "progress"
              ? "border-amber text-amber font-bold bg-bg-1"
              : "border-transparent text-steel hover:text-foreground"
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>DAILY PROGRESS REPORTS ({filteredProgressReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("milestones")}
          className={`px-4 py-2 border-b-2 uppercase transition flex items-center gap-2 cursor-pointer ${
            activeTab === "milestones"
              ? "border-amber text-amber font-bold bg-bg-1"
              : "border-transparent text-steel hover:text-foreground"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>MILESTONE MANAGEMENT ({filteredMilestones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("delayed")}
          className={`px-4 py-2 border-b-2 uppercase transition flex items-center gap-2 cursor-pointer ${
            activeTab === "delayed"
              ? "border-amber text-amber font-bold bg-bg-1"
              : "border-transparent text-steel hover:text-foreground"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-crimson" />
          <span>DELAYED TASK IDENTIFICATION ({filteredDelayedTasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("completion")}
          className={`px-4 py-2 border-b-2 uppercase transition flex items-center gap-2 cursor-pointer ${
            activeTab === "completion"
              ? "border-amber text-amber font-bold bg-bg-1"
              : "border-transparent text-steel hover:text-foreground"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>PROJECT COMPLETION TRACKING &amp; TIMELINE</span>
        </button>

        <button
          onClick={() => setActiveTab("site")}
          className={`px-4 py-2 border-b-2 uppercase transition flex items-center gap-2 cursor-pointer ${
            activeTab === "site"
              ? "border-amber text-amber font-bold bg-bg-1"
              : "border-transparent text-steel hover:text-foreground"
          }`}
        >
          <HardHat className="w-3.5 h-3.5" />
          <span>DAILY SITE LOGS &amp; EHS ({filteredSiteReports.length})</span>
        </button>
      </div>

      {/* TAB 1: DAILY PROGRESS REPORTS & WORK UPDATES */}
      {activeTab === "progress" && (
        <div className="space-y-4">
          <div className="p-3 bg-bg-1 border border-border rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase text-steel font-bold mr-1 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber" />
                PROGRESS STAGE:
              </span>
              {[
                { label: "ALL BRACKETS", val: "ALL" },
                { label: "ADVANCED (>75%)", val: "ADVANCED" },
                { label: "MID-STAGE (50-75%)", val: "MID" },
                { label: "EARLY STAGE (<50%)", val: "EARLY" },
              ].map((s) => (
                <button
                  key={s.val}
                  onClick={() => setProgressStageFilter(s.val)}
                  className={`px-2.5 py-1 rounded-xs text-[11px] transition cursor-pointer ${
                    progressStageFilter === s.val
                      ? "bg-amber text-bg-0 font-bold"
                      : "bg-bg-2 text-steel hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleExportProgressCsv}
                variant="outline"
                size="sm"
                className="text-xs font-mono h-8 flex items-center gap-1.5 border-border text-steel hover:text-foreground"
              >
                <Download className="w-3.5 h-3.5 text-amber" />
                <span>EXPORT CSV</span>
              </Button>
              <Button
                onClick={() => {
                  setReportType("progress");
                  setIsModalOpen(true);
                }}
                variant="primary"
                size="sm"
                className="text-xs font-mono h-8 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>SUBMIT PROGRESS UPDATE</span>
              </Button>
            </div>
          </div>

          {filteredProgressReports.length === 0 ? (
            <div className="p-12 text-center font-mono space-y-3 bg-bg-1 border border-border rounded-sm">
              <CheckCircle className="w-8 h-8 text-steel mx-auto opacity-50" />
              <div className="text-foreground text-sm font-bold uppercase">
                No Progress Reports Found
              </div>
              <p className="text-steel text-xs max-w-md mx-auto">
                No progress reports match current filters. Submit daily work updates to track field tasks against the CPM baseline.
              </p>
              <Button
                onClick={() => {
                  setReportType("progress");
                  setIsModalOpen(true);
                }}
                variant="primary"
                className="mt-2 text-xs font-mono"
              >
                Submit Daily Work Update
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProgressReports.map((pr: any) => {
                const isAdvanced = (pr.percentage || 0) >= 75;
                let parsedPhotos: string[] = [];
                try {
                  parsedPhotos = JSON.parse(pr.photos || "[]");
                } catch (e) {
                  parsedPhotos = [];
                }

                return (
                  <Card key={pr.id} className="p-4 space-y-3 relative group">
                    {/* Header: Project Information & Progress Percentage */}
                    <div className="flex items-start justify-between border-b border-border pb-2.5">
                      <div>
                        <span className="font-bold text-sm text-foreground block">
                          {pr.project?.name}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-steel mt-0.5">
                          {pr.project?.location && <span>Loc: {pr.project.location}</span>}
                          <span>Project Progress: {pr.project?.progress || pr.percentage}%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-mono text-2xl font-black ${isAdvanced ? "text-gold" : "text-amber"}`}>
                          {pr.percentage}%
                        </span>
                        <span className="block text-[9px] font-mono text-steel uppercase">
                          {isAdvanced ? "ADVANCED STAGE" : "STAGE IN PROGRESS"}
                        </span>
                      </div>
                    </div>

                    {/* Task Reference */}
                    <div className="p-2.5 bg-bg-0 border border-border rounded-xs space-y-1">
                      <div className="text-[10px] font-mono text-steel uppercase font-bold flex items-center justify-between">
                        <span>TASK REFERENCE:</span>
                        {pr.task?.priority && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-xs bg-amber/15 text-amber border border-amber/40">
                            {pr.task.priority}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-foreground font-mono">
                        {pr.task?.title || "Site-Wide Foundation & Structural Erection"}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-2 bg-bg-0 rounded-xs overflow-hidden border border-border">
                        <div
                          className={`h-full transition-all duration-500 ${isAdvanced ? "bg-gold" : "bg-amber"}`}
                          style={{ width: `${pr.percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Work Description */}
                    <div className="text-xs font-mono text-foreground leading-relaxed bg-bg-0 p-2.5 rounded-xs border border-border">
                      <div className="text-[10px] text-steel uppercase font-bold mb-1">Work Description:</div>
                      <p>{pr.description}</p>
                    </div>

                    {/* Progress Photographs Gallery */}
                    {parsedPhotos.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono text-steel uppercase font-bold flex items-center justify-between">
                          <span>PROGRESS PHOTOGRAPHS ({parsedPhotos.length}):</span>
                          <span className="text-[9px] text-amber">VERIFIED ON SITE</span>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {parsedPhotos.map((photoUrl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedPhoto(photoUrl)}
                              className="w-16 h-12 rounded-xs border border-border bg-bg-2 hover:border-amber overflow-hidden shrink-0 transition relative group/img cursor-pointer"
                            >
                              <div className="w-full h-full flex items-center justify-center font-mono text-[9px] text-steel bg-bg-0">
                                <span>PHOTO {idx + 1}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Submission Date & Reported By */}
                    <div className="pt-2 border-t border-border text-[10px] font-mono text-steel flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded-xs bg-amber/10 border border-amber/30 text-amber font-bold">
                          {pr.reportedBy?.role || "SITE_ENGINEER"}
                        </span>
                        <span>Reported by: <strong className="text-foreground">{pr.reportedBy?.name || "Field Engineer"}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Submitted: {formatDate(pr.date || pr.createdAt)}</span>
                        <Button
                          onClick={() => setInspectProgressReport(pr)}
                          variant="outline"
                          size="sm"
                          className="text-[10px] h-6 px-2 text-steel hover:text-foreground flex items-center gap-1 font-mono"
                        >
                          <Eye className="w-3 h-3 text-amber" />
                          <span>Dossier</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MILESTONE MANAGEMENT */}
      {activeTab === "milestones" && (
        <div className="space-y-4">
          <div className="p-3 bg-bg-1 border border-border rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase text-steel font-bold mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-amber" />
                STATUS:
              </span>
              {[
                { label: "ALL MILESTONES", val: "ALL" },
                { label: "COMPLETED", val: "COMPLETED" },
                { label: "IN PROGRESS", val: "IN_PROGRESS" },
                { label: "PENDING", val: "PENDING" },
              ].map((s) => (
                <button
                  key={s.val}
                  onClick={() => setMilestoneStatusFilter(s.val)}
                  className={`px-2.5 py-1 rounded-xs text-[11px] transition cursor-pointer ${
                    milestoneStatusFilter === s.val
                      ? "bg-amber text-bg-0 font-bold"
                      : "bg-bg-2 text-steel hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleExportMilestonesCsv}
                variant="outline"
                size="sm"
                className="text-xs font-mono h-8 flex items-center gap-1.5 border-border text-steel hover:text-foreground"
              >
                <Download className="w-3.5 h-3.5 text-amber" />
                <span>EXPORT CSV</span>
              </Button>
              <Button
                onClick={() => setIsMilestoneModalOpen(true)}
                variant="primary"
                size="sm"
                className="text-xs font-mono h-8 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>NEW MILESTONE</span>
              </Button>
            </div>
          </div>

          {filteredMilestones.length === 0 ? (
            <div className="p-12 text-center font-mono space-y-3 bg-bg-1 border border-border rounded-sm">
              <Award className="w-8 h-8 text-steel mx-auto opacity-50" />
              <div className="text-foreground text-sm font-bold uppercase">
                No Milestones Recorded
              </div>
              <p className="text-steel text-xs max-w-md mx-auto">
                No project milestones match current criteria. Add target milestones to manage key construction stage gates.
              </p>
              <Button
                onClick={() => setIsMilestoneModalOpen(true)}
                variant="primary"
                className="mt-2 text-xs font-mono"
              >
                Create Milestone
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMilestones.map((m: any) => {
                const isCompleted = m.status === "COMPLETED";
                const isInProgress = m.status === "IN_PROGRESS";

                return (
                  <Card key={m.id} className="p-4 space-y-3 relative flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-xs bg-bg-0 border border-border text-steel text-[10px] font-mono">
                          STAGE GATE #{m.order || 1}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold uppercase ${
                            isCompleted
                              ? "bg-gold/15 text-gold border border-gold/40"
                              : isInProgress
                              ? "bg-amber/15 text-amber border border-amber/40"
                              : "bg-steel/15 text-steel border border-steel/40"
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-heading text-base font-bold text-foreground">
                          {m.title}
                        </h4>
                        <div className="text-[11px] font-mono text-steel mt-0.5">
                          Project: <strong className="text-foreground">{m.project?.name}</strong>
                        </div>
                      </div>

                      {m.description && (
                        <p className="text-xs font-mono text-concrete leading-relaxed bg-bg-0 p-2.5 rounded-xs border border-border">
                          {m.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-bg-0 p-2 rounded-xs border border-border">
                        <div>
                          <span className="text-steel block">TARGET DATE</span>
                          <span className="text-foreground font-bold">{formatDate(m.targetDate)}</span>
                        </div>
                        <div>
                          <span className="text-steel block">COMPLETED DATE</span>
                          <span className={isCompleted ? "text-gold font-bold" : "text-steel"}>
                            {m.completedDate ? formatDate(m.completedDate) : "In Progress"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between gap-2 font-mono text-xs">
                      <button
                        onClick={() => handleToggleMilestoneStatus(m.id, m.status)}
                        className={`px-2.5 py-1 rounded-xs text-[11px] font-bold uppercase transition flex items-center gap-1 cursor-pointer border ${
                          isCompleted
                            ? "border-border text-steel hover:text-amber"
                            : "bg-amber text-bg-0 border-amber shadow-amber hover:bg-molten"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isCompleted ? "REOPEN" : "MARK COMPLETE"}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteMilestone(m.id)}
                        className="px-2 py-1 rounded-xs text-steel hover:text-crimson hover:bg-crimson/10 transition text-[11px] uppercase cursor-pointer"
                      >
                        DELETE
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DELAYED TASK IDENTIFICATION */}
      {activeTab === "delayed" && (
        <div className="space-y-4">
          <div className="p-4 bg-bg-1 border border-border rounded-xs shadow-plate space-y-3 font-mono text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-crimson" />
                  <h3 className="font-heading text-base font-bold uppercase tracking-wider text-foreground">
                    AUTOMATIC DELAYED TASK IDENTIFICATION RADAR
                  </h3>
                </div>
                <p className="text-[10px] text-steel uppercase mt-0.5">
                  TASKS EXCEEDING CPM DEADLINE AND IDENTIFIED AS CRITICAL PATH SCHEDULE HAZARDS
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-steel uppercase font-bold mr-1">PRIORITY:</span>
                {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map((prio) => (
                  <button
                    key={prio}
                    onClick={() => setDelayedSeverityFilter(prio)}
                    className={`px-2.5 py-1 rounded-xs text-[11px] transition cursor-pointer ${
                      delayedSeverityFilter === prio
                        ? "bg-amber text-bg-0 font-bold"
                        : "bg-bg-0 text-steel border border-border hover:text-foreground"
                    }`}
                  >
                    {prio}
                  </button>
                ))}
              </div>
            </div>

            {filteredDelayedTasks.length === 0 ? (
              <div className="p-8 text-center text-steel font-mono space-y-2">
                <CheckCircle2 className="w-8 h-8 text-gold mx-auto" />
                <div className="text-foreground text-sm font-bold uppercase">
                  ZERO DELAYED TASKS IN SELECTED SCOPE
                </div>
                <p className="text-xs text-steel">
                  All active tasks in this scope are tracking strictly within their CPM baseline deadlines.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredDelayedTasks.map((task: any) => {
                  const deadlineTime = new Date(task.deadline).getTime();
                  const daysOverdue = Math.max(1, Math.round((Date.now() - deadlineTime) / (86400000)));

                  return (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xs border border-crimson/50 bg-bg-0 space-y-2.5 shadow-plate"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-xs bg-crimson/20 border border-crimson text-crimson text-[10px] font-bold">
                          +{daysOverdue} DAYS OVERDUE
                        </span>
                        <span className="px-2 py-0.5 rounded-xs bg-amber/15 text-amber border border-amber/40 text-[10px] font-bold">
                          {task.priority}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-heading font-bold text-foreground text-sm">
                          {task.title}
                        </h4>
                        <div className="text-[11px] font-mono text-steel mt-0.5">
                          Project: <strong className="text-foreground">{task.project?.name}</strong>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-steel">
                          <span>CURRENT PROGRESS</span>
                          <span className="text-amber font-bold">{task.progress}%</span>
                        </div>
                        <div className="w-full bg-bg-1 h-1.5 rounded-xs overflow-hidden border border-border">
                          <div className="bg-amber h-full" style={{ width: `${task.progress}%` }} />
                        </div>
                      </div>

                      <div className="text-[10px] text-steel flex justify-between items-center pt-2 border-t border-border">
                        <span>Lead: <strong className="text-foreground">{task.assignee?.name || "Unassigned"}</strong></span>
                        <span>Deadline: {formatDate(task.deadline)}</span>
                      </div>

                      <Button
                        onClick={() => {
                          setProjectId(task.projectId);
                          setTaskId(task.id);
                          setImpactDays(daysOverdue);
                          setDelayReason(`Task '${task.title}' exceeded schedule deadline by ${daysOverdue} days.`);
                          setMitigationPlan("Fast-track labor shifts and expedite material allocations to recover critical path float.");
                          setReportType("delay");
                          setIsModalOpen(true);
                        }}
                        variant="secondary"
                        size="sm"
                        className="w-full text-[10px] py-1 h-7 font-mono uppercase font-bold text-amber hover:text-foreground"
                      >
                        File Delay Mitigation Plan
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PROJECT COMPLETION TRACKING & TIMELINE */}
      {activeTab === "completion" && (
        <div className="space-y-4">
          <div className="p-4 bg-bg-1 border border-border rounded-xs shadow-plate space-y-3 font-mono text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h3 className="font-heading text-base font-bold uppercase tracking-wider text-foreground">
                  ENTERPRISE PROJECT COMPLETION &amp; SCHEDULE GANTT MATRIX
                </h3>
                <p className="text-[10px] text-steel uppercase mt-0.5">
                  CROSS-PROJECT EARNED VALUE COMPLETION, MILESTONE PROGRESSION &amp; TIMELINE ACCESS
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj) => {
                const projMilestones = (data.milestones || []).filter(
                  (m: any) => m.projectId === proj.id || m.project?.id === proj.id
                );
                const completedM = projMilestones.filter((m: any) => m.status === "COMPLETED").length;

                return (
                  <Card key={proj.id} className="p-4 space-y-3 bg-bg-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-heading text-base font-bold text-foreground">
                          {proj.name}
                        </h4>
                        <div className="text-[11px] font-mono text-steel mt-0.5">
                          Location: {proj.location}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-xs bg-amber/15 text-amber border border-amber/40 text-[10px] font-bold uppercase">
                        {proj.status}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-steel">WEIGHTED COMPLETION PROGRESS</span>
                        <span className="text-gold font-bold">{proj.progress}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-bg-1 rounded-xs overflow-hidden border border-border">
                        <div
                          className="bg-amber h-full transition-all duration-500"
                          style={{ width: `${proj.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-bg-1 p-2.5 rounded-xs border border-border">
                      <div>
                        <span className="text-steel block">MILESTONES ACHIEVED</span>
                        <span className="text-foreground font-bold">
                          {completedM} / {projMilestones.length || 3} Milestones
                        </span>
                      </div>
                      <div>
                        <span className="text-steel block">EXPECTED COMPLETION</span>
                        <span className="text-foreground font-bold">
                          {formatDate(proj.expectedEndDate)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-2">
                      <Link
                        href={`/projects/${proj.id}`}
                        className="px-3 py-1.5 rounded-xs border border-border bg-bg-1 hover:bg-bg-2 text-foreground font-mono text-xs uppercase font-bold transition flex items-center gap-1.5"
                      >
                        <Building2 className="w-3.5 h-3.5 text-steel" />
                        <span>Project Overview</span>
                      </Link>

                      <Link
                        href={`/projects/${proj.id}/timeline`}
                        className="px-3 py-1.5 rounded-xs border border-amber/50 bg-amber/10 hover:bg-amber hover:text-bg-0 text-amber font-mono text-xs uppercase font-bold transition flex items-center gap-1.5 shadow-plate"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Open Gantt Timeline</span>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DAILY SITE LOGS & SAFETY */}
      {activeTab === "site" && (
        <div className="space-y-4">
          <div className="p-3 bg-bg-1 border border-border rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase text-steel font-bold mr-1 flex items-center gap-1">
                <CloudSun className="w-3.5 h-3.5 text-amber" />
                WEATHER:
              </span>
              {[
                { label: "ALL CONDITIONS", val: "ALL" },
                { label: "CLEAR / SUNNY", val: "SUNNY" },
                { label: "OVERCAST", val: "OVERCAST" },
                { label: "MONSOON / RAIN", val: "RAIN" },
              ].map((s) => (
                <button
                  key={s.val}
                  onClick={() => setSiteWeatherFilter(s.val)}
                  className={`px-2.5 py-1 rounded-xs text-[11px] transition cursor-pointer ${
                    siteWeatherFilter === s.val
                      ? "bg-amber text-bg-0 font-bold"
                      : "bg-bg-2 text-steel hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <Button
              onClick={() => {
                setReportType("site");
                setIsModalOpen(true);
              }}
              variant="primary"
              size="sm"
              className="text-xs font-mono h-8 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>RECORD SITE SHIFT LOG</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSiteReports.map((report: any) => (
              <Card key={report.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <span className="font-bold text-sm text-foreground">{report.project?.name}</span>
                  <span className="text-amber font-mono text-xs font-bold">{report.weather}</span>
                </div>
                <div className="text-xs font-mono text-foreground bg-bg-0 p-2.5 rounded-xs border border-border">
                  <div className="text-[10px] text-steel uppercase font-bold mb-1">Work Completed:</div>
                  <p>{report.workCompleted}</p>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-steel pt-2 border-t border-border">
                  <span>Workforce: <strong className="text-gold">{report.workersCount} Workers</strong></span>
                  <span>Supervisor: <strong className="text-foreground">{report.reportedBy?.name || "Site Lead"}</strong></span>
                  <span>{formatDate(report.date)}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Main Report Submission Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="SUBMIT OFFICIAL PROGRESS REPORT & WORK UPDATE"
        description="Daily engineering progress log, task references, photographic verification, and schedule updates."
      >
        <form onSubmit={handleSubmitReport} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block uppercase text-steel mb-1">
              Report Classification
            </label>
            <div className="flex border border-border rounded-xs bg-bg-1 p-0.5">
              {(["progress", "site", "delay"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setReportType(t)}
                  className={`flex-1 py-1.5 uppercase rounded-xs transition cursor-pointer ${
                    reportType === t
                      ? "bg-amber text-bg-0 font-bold"
                      : "text-steel hover:text-foreground"
                  }`}
                >
                  {t === "progress" ? "Progress Update" : t === "site" ? "Daily Site Log" : "Delay Notice"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block uppercase text-steel mb-1">
              Select Project Information *
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.status})
                </option>
              ))}
            </select>
          </div>

          {reportType === "progress" && (
            <>
              <div>
                <label className="block uppercase text-steel mb-1">
                  Task Reference
                </label>
                <select
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber cursor-pointer"
                >
                  <option value="">General Project Site Work (No Specific Task)</option>
                  {projectTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} [{t.priority}] - Status: {t.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase text-steel mb-1">
                    Progress Percentage (%) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={percentage}
                    onChange={(e) => setPercentage(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
                  />
                </div>

                <div>
                  <label className="block uppercase text-steel mb-1">
                    Submission Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={submissionDate}
                    onChange={(e) => setSubmissionDate(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase text-steel mb-1">
                  Work Description & Verification Details *
                </label>
                <textarea
                  rows={3}
                  required
                  value={progressDesc}
                  onChange={(e) => setProgressDesc(e.target.value)}
                  placeholder="Detail structural progress, QA inspection, core sample testing, and alignment..."
                  className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
                />
              </div>

              <div>
                <label className="block uppercase text-steel mb-1">
                  Progress Photographs (Comma-separated URLs or Paths)
                </label>
                <input
                  type="text"
                  value={progressPhotos}
                  onChange={(e) => setProgressPhotos(e.target.value)}
                  placeholder="/demo/site-inspect-1.jpg, /demo/site-inspect-2.jpg"
                  className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
                />
                <span className="text-[10px] text-steel mt-0.5 block">
                  Preserves permanent visual evidence for engineering stage sign-off.
                </span>
              </div>
            </>
          )}

          {reportType === "site" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase text-steel mb-1">
                    Weather Condition *
                  </label>
                  <input
                    type="text"
                    required
                    value={weather}
                    onChange={(e) => setWeather(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
                  />
                </div>
                <div>
                  <label className="block uppercase text-steel mb-1">
                    Workers Headcount *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={workersCount}
                    onChange={(e) => setWorkersCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase text-steel mb-1">
                  Equipment Deployed on Site
                </label>
                <input
                  type="text"
                  value={equipmentOnSite}
                  onChange={(e) => setEquipmentOnSite(e.target.value)}
                  placeholder="e.g. 2x Tower Cranes, 4x Mixers, 1x Boom Pump"
                  className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
                />
              </div>

              <div>
                <label className="block uppercase text-steel mb-1">
                  Work Tasks Executed Today *
                </label>
                <textarea
                  rows={3}
                  required
                  value={workCompleted}
                  onChange={(e) => setWorkCompleted(e.target.value)}
                  placeholder="Detail pier column concrete pour, rebar ties, and slump inspections..."
                  className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
                />
              </div>
            </>
          )}

          {reportType === "delay" && (
            <>
              <div>
                <label className="block uppercase text-steel mb-1">
                  Impact Duration (Days) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={impactDays}
                  onChange={(e) => setImpactDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
                />
              </div>
              <div>
                <label className="block uppercase text-steel mb-1">
                  Root Cause Reason *
                </label>
                <input
                  type="text"
                  required
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  placeholder="e.g. Subsurface water table surge requiring jet grouting"
                  className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
                />
              </div>
              <div>
                <label className="block uppercase text-steel mb-1">
                  Mitigation Action Plan *
                </label>
                <textarea
                  rows={3}
                  required
                  value={mitigationPlan}
                  onChange={(e) => setMitigationPlan(e.target.value)}
                  placeholder="e.g. De-watering pumps mobilized 24/7; double-shift night casting arranged..."
                  className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Submit Progress Report
            </Button>
          </div>
        </form>
      </Modal>

      {/* Milestone Creation Modal */}
      <Modal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        title="ESTABLISH PROJECT MILESTONE"
        description="Define a contractual stage gate milestone with target completion date and sequence order."
      >
        <form onSubmit={handleCreateMilestone} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block uppercase text-steel mb-1">
              Select Megaproject *
            </label>
            <select
              value={mProjectId}
              onChange={(e) => setMProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block uppercase text-steel mb-1">
              Milestone Stage Title *
            </label>
            <input
              type="text"
              required
              value={mTitle}
              onChange={(e) => setMTitle(e.target.value)}
              placeholder="e.g. Subsurface Foundation Piles Certified"
              className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
            />
          </div>

          <div>
            <label className="block uppercase text-steel mb-1">
              Engineering Scope Description
            </label>
            <textarea
              rows={2}
              value={mDescription}
              onChange={(e) => setMDescription(e.target.value)}
              placeholder="e.g. 120 bored cast-in-situ piles driven and static load tested to 2.5x working load."
              className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block uppercase text-steel mb-1">
                Target Date *
              </label>
              <input
                type="date"
                required
                value={mTargetDate}
                onChange={(e) => setMTargetDate(e.target.value)}
                className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
              />
            </div>

            <div>
              <label className="block uppercase text-steel mb-1">
                Initial Status
              </label>
              <select
                value={mStatus}
                onChange={(e) => setMStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber cursor-pointer"
              >
                <option value="PENDING">PENDING</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>

            <div>
              <label className="block uppercase text-steel mb-1">
                Sequence Order
              </label>
              <input
                type="number"
                min={1}
                value={mOrder}
                onChange={(e) => setMOrder(Number(e.target.value))}
                className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsMilestoneModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={mSubmitting}>
              Establish Milestone
            </Button>
          </div>
        </form>
      </Modal>

      {/* Progress Report Inspector Modal */}
      {inspectProgressReport && (
        <Modal
          isOpen={!!inspectProgressReport}
          onClose={() => setInspectProgressReport(null)}
          title={`PROGRESS VERIFICATION CERTIFICATE - ${inspectProgressReport.percentage}%`}
          description="Civil structural stage certification and quality control sign-off."
        >
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3 bg-bg-1 border border-border rounded-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-foreground">{inspectProgressReport.project?.name}</span>
                <span className="text-amber font-bold text-lg">{inspectProgressReport.percentage}%</span>
              </div>
              <div className="text-[11px] text-steel">
                Inspection Date: <strong className="text-foreground">{formatDate(inspectProgressReport.date || inspectProgressReport.createdAt)}</strong>
              </div>
              {inspectProgressReport.task && (
                <div className="text-[11px] text-steel">
                  Task Reference: <strong className="text-foreground">{inspectProgressReport.task.title}</strong>
                </div>
              )}
            </div>

            <div className="p-3 bg-bg-1 border border-border rounded-xs space-y-1">
              <div className="text-steel font-bold uppercase text-[10px]">Engineering Stage Verification:</div>
              <p className="text-foreground text-xs leading-relaxed">{inspectProgressReport.description}</p>
            </div>

            <div className="p-3 bg-bg-2 border border-border rounded-xs space-y-1 text-[11px] text-steel">
              <div className="font-bold text-foreground">Signatory Sign-off:</div>
              <div>• Certified by: {inspectProgressReport.reportedBy?.name || "Senior Materials Engineer"}</div>
              <div>• Corporate Role: {inspectProgressReport.reportedBy?.role || "SITE_ENGINEER"}</div>
              <div>• Quality Standard: ISO 9001:2015 Civil Structural Verification</div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setInspectProgressReport(null)}>
                Close Certificate
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Photograph Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-bg-0 border border-border rounded-xs p-4 max-w-lg w-full space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span className="font-bold text-foreground uppercase">SITE PROGRESS PHOTOGRAPH</span>
              <button onClick={() => setSelectedPhoto(null)} className="text-steel hover:text-amber">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-64 bg-bg-2 rounded-xs border border-border flex items-center justify-center text-steel font-mono text-xs">
              <span>Preview: {selectedPhoto}</span>
            </div>
            <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setSelectedPhoto(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

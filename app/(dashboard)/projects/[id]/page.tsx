"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  FileText,
  HardHat,
  Lock,
  Layers,
  Users2,
  TrendingUp,
  AlertTriangle,
  Flame,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Award,
  User,
  Edit3,
  Trash2,
  X,
  AlertCircle,
  RefreshCw,
} from "@/components/ui/icons";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { calculateEarnedValue, analyzeProjectRisks } from "@/lib/ai-intelligence";
import type { BIMLayerConfig, IoTSensor } from "@/components/3d/bim-viewer";

// Lazy-loaded 3D Scenes
const Scene = dynamic(() => import("@/components/3d/scene").then((m) => m.Scene), {
  ssr: false,
  loading: () => <div className="w-full h-88 bg-bg-1 animate-pulse rounded-sm border border-border" />,
});

const BuildingFloorsScene = dynamic(
  () => import("@/components/3d/building-floors"),
  { ssr: false }
);

const BIMViewerScene = dynamic(
  () => import("@/components/3d/bim-viewer"),
  { ssr: false }
);

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const id = params.id as string;

  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tasks" | "milestones" | "contractors" | "budget">("tasks");
  const [view3DMode, setView3DMode] = useState<"bim" | "milestones">("bim");
  const [bimLayers, setBimLayers] = useState<BIMLayerConfig>({
    structure: true,
    mep: true,
    facade: false,
    scaffolding: false,
    sensors: true,
    exploded: false,
  });
  const [selectedSensor, setSelectedSensor] = useState<IoTSensor | null>(null);

  // Edit Project Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("PLANNING");
  const [editStartDate, setEditStartDate] = useState("");
  const [editExpectedEndDate, setEditExpectedEndDate] = useState("");
  const [editTotalBudget, setEditTotalBudget] = useState(0);
  const [editManagerId, setEditManagerId] = useState("");
  const [editProgress, setEditProgress] = useState(0);
  const [editContractorIds, setEditContractorIds] = useState<string[]>([]);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Selectors Data
  const [availableManagers, setAvailableManagers] = useState<any[]>([]);
  const [availableContractors, setAvailableContractors] = useState<any[]>([]);

  const userRole = currentUser?.role;
  const userId = currentUser?.id;

  const fetchProjectDetails = async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        fetch(`/api/v1/projects/${id}`),
        fetch("/api/auth/session"),
      ]);
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData?.user) setCurrentUser(sData.user);
      }
      if (pRes.ok) {
        const data = await pRes.json();
        setProjectData(data);
      }
    } catch (e) {
      console.error("Failed to load project details:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const loadSelectors = async () => {
    try {
      const [uRes, cRes] = await Promise.all([
        fetch("/api/v1/users"),
        fetch("/api/v1/contractors"),
      ]);
      if (uRes.ok) {
        const uData = await uRes.json();
        const pms = (uData.users || []).filter(
          (u: any) => u.role === "PROJECT_MANAGER" || u.role === "ADMIN"
        );
        setAvailableManagers(pms);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setAvailableContractors(cData.contractors || []);
      }
    } catch (err) {
      console.error("Failed to load selectors:", err);
    }
  };

  const handleOpenEditModal = () => {
    if (!projectData?.project) return;
    const p = projectData.project;
    setEditName(p.name || "");
    setEditLocation(p.location || "");
    setEditDescription(p.description || "");
    setEditStatus(p.status || "PLANNING");
    setEditStartDate(p.startDate ? new Date(p.startDate).toISOString().slice(0, 10) : "");
    setEditExpectedEndDate(p.expectedEndDate ? new Date(p.expectedEndDate).toISOString().slice(0, 10) : "");
    setEditTotalBudget(p.totalBudget || 0);
    setEditManagerId(p.managerId || "");
    setEditProgress(p.progress || 0);
    setEditContractorIds(p.contractors?.map((c: any) => c.contractorId) || []);
    setEditError(null);
    setEditSuccess(null);
    loadSelectors();
    setIsEditModalOpen(true);
  };

  const toggleEditContractor = (cId: string) => {
    setEditContractorIds((prev) =>
      prev.includes(cId) ? prev.filter((id) => id !== cId) : [...prev, cId]
    );
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSubmitting(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      const payload: any = {
        name: editName.trim(),
        location: editLocation.trim(),
        description: editDescription.trim() || undefined,
        status: editStatus,
        startDate: editStartDate ? new Date(editStartDate).toISOString() : undefined,
        expectedEndDate: editExpectedEndDate ? new Date(editExpectedEndDate).toISOString() : undefined,
        managerId: editManagerId || undefined,
        progress: Number(editProgress),
        contractorIds: editContractorIds,
      };

      // Only include totalBudget if user is Admin or Finance Manager per Rule 10
      if (userRole === "ADMIN" || userRole === "FINANCE_MANAGER") {
        payload.totalBudget = Number(editTotalBudget);
      }

      const res = await fetch(`/api/v1/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to update project specifications.");
      }

      setEditSuccess("Project specifications updated successfully.");
      setTimeout(() => {
        setIsEditModalOpen(false);
        fetchProjectDetails();
      }, 600);
    } catch (err: any) {
      setEditError(err.message || "Failed to update project.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    setDeleteSubmitting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/v1/projects/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to decommission project.");
      }
      setIsDeleteModalOpen(false);
      router.push("/projects");
    } catch (err: any) {
      setDeleteError(err.message || "Network error deleting project.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-bg-1 w-72 rounded-xs border border-border" />
        <div className="h-64 bg-bg-1 rounded-sm border border-border" />
      </div>
    );
  }

  if (!projectData?.project) {
    return (
      <div className="steel-card p-12 text-center font-mono border border-crimson/50 bg-bg-1 rounded-sm">
        <h2 className="text-lg font-bold text-crimson">PROJECT RECORD NOT FOUND</h2>
        <Link href="/projects" className="text-amber hover:underline text-xs mt-2 inline-block">
          Return to Projects Directory
        </Link>
      </div>
    );
  }

  const { project, budgetSummary, calculatedProgress } = projectData;

  const canEdit =
    userRole === "ADMIN" ||
    userRole === "PROJECT_MANAGER" ||
    userRole === "FINANCE_MANAGER";

  const canDelete =
    userRole === "ADMIN" ||
    (userRole === "PROJECT_MANAGER" && project.managerId === userId);

  const canEditBudget = userRole === "ADMIN" || userRole === "FINANCE_MANAGER";

  const eva = useMemo(() => {
    if (!project) return null;
    return calculateEarnedValue({
      totalBudget: project.totalBudget || 1000000,
      calculatedProgress: calculatedProgress || 0,
      totalSpent: budgetSummary?.totalSpent || 0,
      startDate: project.startDate,
      expectedEndDate: project.expectedEndDate,
    });
  }, [project, calculatedProgress, budgetSummary]);

  const riskAssessment = useMemo(() => {
    if (!eva || !project) return null;
    const overdueTasks = (project.tasks || []).filter((t: any) => {
      return t.status !== "COMPLETED" && new Date(t.deadline) < new Date();
    }).length;
    return analyzeProjectRisks({
      eva,
      overdueTasksCount: overdueTasks,
      lowStockItemsCount: 0,
      contractorCount: project.contractors?.length || 0,
    });
  }, [eva, project]);

  // Task breakdown counters for Progress Monitoring
  const tasks = project.tasks || [];
  const completedTasks = tasks.filter((t: any) => t.status === "COMPLETED");
  const inProgressTasks = tasks.filter((t: any) => t.status === "IN_PROGRESS");
  const reviewTasks = tasks.filter((t: any) => t.status === "REVIEW");
  const todoTasks = tasks.filter((t: any) => t.status === "TODO");
  const totalTasksCount = tasks.length;
  const taskCompletionRate =
    totalTasksCount > 0 ? Math.round((completedTasks.length / totalTasksCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/projects"
              className="p-1.5 rounded-xs border border-border bg-bg-2 text-steel hover:text-amber hover:border-amber transition"
              title="Return to Projects Directory"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="font-heading text-2xl font-bold uppercase tracking-wider text-foreground">
              {project.name}
            </h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="text-xs font-mono text-steel uppercase tracking-widest mt-1">
            LOCATION: {project.location} • MOBILIZED: {formatDate(project.startDate)} • TARGET: {formatDate(project.expectedEndDate)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/projects/${project.id}/timeline`}
            className="px-3 py-1.5 bg-bg-2 border border-border hover:border-amber text-foreground hover:text-amber text-xs font-mono uppercase tracking-wider rounded-sm transition flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-amber" />
            <span>GANTT TIMELINE</span>
          </Link>

          <a
            href={`/api/v1/reports/financial/${project.id}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-amber hover:bg-amber-glow text-bg-0 font-mono text-xs font-bold uppercase tracking-wider rounded-sm transition shadow-sm flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-bg-0" />
            <span>FINANCIAL AUDIT PDF</span>
          </a>

          {canEdit && (
            <button
              onClick={handleOpenEditModal}
              className="px-3 py-1.5 bg-bg-2 border border-border hover:border-amber text-foreground hover:text-amber text-xs font-mono uppercase tracking-wider rounded-sm transition flex items-center gap-1.5 font-semibold"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber" />
              <span>EDIT PROJECT</span>
            </button>
          )}

          {canDelete && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-3 py-1.5 bg-crimson/10 border border-crimson/30 hover:border-crimson text-crimson text-xs font-mono uppercase tracking-wider rounded-sm transition flex items-center gap-1.5 font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5 text-crimson" />
              <span>DELETE</span>
            </button>
          )}
        </div>
      </div>

      {/* 10 Required Project Attributes Executive Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Project Official Title & Location */}
        <div className="steel-card p-3 rounded-sm border border-border bg-bg-1 space-y-1">
          <div className="text-[10px] font-mono text-steel uppercase flex items-center justify-between">
            <span>SITE LOCATION</span>
            <Building2 className="w-3.5 h-3.5 text-amber" />
          </div>
          <div className="text-xs font-bold font-mono text-foreground truncate" title={project.location}>
            {project.location}
          </div>
          <div className="text-[10px] font-mono text-steel truncate">Civil Work Site</div>
        </div>

        {/* 2. Project Manager */}
        <div className="steel-card p-3 rounded-sm border border-border bg-bg-1 space-y-1">
          <div className="text-[10px] font-mono text-steel uppercase flex items-center justify-between">
            <span>PROJECT DIRECTOR</span>
            <User className="w-3.5 h-3.5 text-gold" />
          </div>
          <div className="text-xs font-bold font-mono text-foreground truncate">
            {project.manager?.name || "Unassigned"}
          </div>
          <div className="text-[10px] font-mono text-steel truncate">
            {project.manager?.email || "No email registered"}
          </div>
        </div>

        {/* 3. Authorized Capital (Total Budget) */}
        <div className="steel-card p-3 rounded-sm border border-border bg-bg-1 space-y-1">
          <div className="text-[10px] font-mono text-steel uppercase flex items-center justify-between">
            <span>TOTAL BUDGET</span>
            <DollarSign className="w-3.5 h-3.5 text-amber" />
          </div>
          <div className="text-xs font-bold font-mono text-foreground">
            {formatCurrency(project.totalBudget)}
          </div>
          <div className="text-[10px] font-mono text-steel">
            Spent: {formatCurrency(budgetSummary?.totalSpent || 0)}
          </div>
        </div>

        {/* 4. Timeline Schedule (Start & Expected End) */}
        <div className="steel-card p-3 rounded-sm border border-border bg-bg-1 space-y-1">
          <div className="text-[10px] font-mono text-steel uppercase flex items-center justify-between">
            <span>TIMELINE DATES</span>
            <Clock className="w-3.5 h-3.5 text-steel" />
          </div>
          <div className="text-xs font-bold font-mono text-foreground">
            {formatDate(project.startDate)}
          </div>
          <div className="text-[10px] font-mono text-amber">
            Target: {formatDate(project.expectedEndDate)}
          </div>
        </div>

        {/* 5. Assigned Contractor Firms */}
        <div className="steel-card p-3 rounded-sm border border-border bg-bg-1 space-y-1">
          <div className="text-[10px] font-mono text-steel uppercase flex items-center justify-between">
            <span>CONTRACTOR PARTNERS</span>
            <HardHat className="w-3.5 h-3.5 text-gold" />
          </div>
          <div className="text-xs font-bold font-mono text-foreground">
            {project.contractors?.length || 0} Assigned Firms
          </div>
          <div className="text-[10px] font-mono text-gold truncate">
            {project.contractors?.[0]?.contractor?.company || "No contractors assigned"}
          </div>
        </div>
      </div>

      {/* Monitor Project Progress Barometer */}
      <div className="steel-card p-4 rounded-sm border border-amber/40 bg-bg-1 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber" />
            <span className="text-xs font-heading font-bold uppercase tracking-wider text-amber">
              PROJECT PROGRESS & EXECUTION BAROMETER
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-steel">
              WEIGHTED PROGRESS: <strong className="text-amber">{calculatedProgress}%</strong>
            </span>
            <span className="text-steel">
              TASK COMPLETION: <strong className="text-foreground">{taskCompletionRate}%</strong>
            </span>
          </div>
        </div>

        {/* Dual Progress Bars */}
        <div className="space-y-2">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono text-steel">
              <span>Overall Rollup Progress</span>
              <span className="text-amber font-bold">{calculatedProgress}%</span>
            </div>
            <div className="h-2 w-full bg-bg-0 rounded-full overflow-hidden border border-border">
              <div
                className={`h-full transition-all ${
                  calculatedProgress === 100
                    ? "bg-gold"
                    : calculatedProgress > 50
                    ? "bg-amber"
                    : "bg-steel"
                }`}
                style={{ width: `${calculatedProgress}%` }}
              />
            </div>
          </div>

          {/* Task Status Distribution Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            <div className="p-2 bg-bg-0 rounded-xs border border-border text-center font-mono">
              <div className="text-[10px] text-steel uppercase">COMPLETED</div>
              <div className="text-sm font-bold text-gold">{completedTasks.length}</div>
              <div className="text-[9px] text-steel">
                {totalTasksCount > 0 ? Math.round((completedTasks.length / totalTasksCount) * 100) : 0}% of tasks
              </div>
            </div>

            <div className="p-2 bg-bg-0 rounded-xs border border-border text-center font-mono">
              <div className="text-[10px] text-steel uppercase">IN PROGRESS</div>
              <div className="text-sm font-bold text-amber">{inProgressTasks.length}</div>
              <div className="text-[9px] text-steel">
                {totalTasksCount > 0 ? Math.round((inProgressTasks.length / totalTasksCount) * 100) : 0}% active
              </div>
            </div>

            <div className="p-2 bg-bg-0 rounded-xs border border-border text-center font-mono">
              <div className="text-[10px] text-steel uppercase">UNDER REVIEW</div>
              <div className="text-sm font-bold text-foreground">{reviewTasks.length}</div>
              <div className="text-[9px] text-steel">QA sign-off</div>
            </div>

            <div className="p-2 bg-bg-0 rounded-xs border border-border text-center font-mono">
              <div className="text-[10px] text-steel uppercase">PENDING / TODO</div>
              <div className="text-sm font-bold text-steel">{todoTasks.length}</div>
              <div className="text-[9px] text-steel">Backlog items</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3D BIM Twin & Summary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3D Visual Twin (Left 5 cols) */}
        <div className="lg:col-span-5 steel-card p-0 overflow-hidden flex flex-col rounded-sm border border-border bg-bg-1 shadow-sm">
          <div className="px-4 py-2.5 bg-bg-0 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView3DMode("bim")}
                className={`text-[10px] font-mono uppercase font-bold px-2 py-1 rounded-xs transition ${
                  view3DMode === "bim"
                    ? "bg-amber text-bg-0"
                    : "text-steel hover:text-amber"
                }`}
              >
                4D BIM SPATIAL TWIN
              </button>
              <button
                onClick={() => setView3DMode("milestones")}
                className={`text-[10px] font-mono uppercase font-bold px-2 py-1 rounded-xs transition ${
                  view3DMode === "milestones"
                    ? "bg-amber text-bg-0"
                    : "text-steel hover:text-amber"
                }`}
              >
                MILESTONE FLOORS
              </button>
            </div>
            <span className="text-[10px] font-mono text-amber font-bold">
              {calculatedProgress}% PROGRESS
            </span>
          </div>

          {/* BIM Layer Filter Controls */}
          {view3DMode === "bim" && (
            <div className="px-3 py-1.5 bg-bg-2 border-b border-border flex flex-wrap items-center gap-1.5 text-[9px] font-mono">
              <span className="text-steel uppercase mr-1">LAYERS:</span>
              <button
                onClick={() => setBimLayers((l) => ({ ...l, structure: !l.structure }))}
                className={`px-1.5 py-0.5 rounded-xs border transition ${
                  bimLayers.structure
                    ? "bg-amber/20 border-amber text-amber font-bold"
                    : "border-border text-steel"
                }`}
              >
                Structure
              </button>
              <button
                onClick={() => setBimLayers((l) => ({ ...l, mep: !l.mep }))}
                className={`px-1.5 py-0.5 rounded-xs border transition ${
                  bimLayers.mep
                    ? "bg-gold/20 border-gold text-gold font-bold"
                    : "border-border text-steel"
                }`}
              >
                MEP Ducts
              </button>
              <button
                onClick={() => setBimLayers((l) => ({ ...l, facade: !l.facade }))}
                className={`px-1.5 py-0.5 rounded-xs border transition ${
                  bimLayers.facade
                    ? "bg-amber/20 border-amber text-amber font-bold"
                    : "border-border text-steel"
                }`}
              >
                Curtain Wall
              </button>
              <button
                onClick={() => setBimLayers((l) => ({ ...l, scaffolding: !l.scaffolding }))}
                className={`px-1.5 py-0.5 rounded-xs border transition ${
                  bimLayers.scaffolding
                    ? "bg-steel/20 border-steel text-foreground font-bold"
                    : "border-border text-steel"
                }`}
              >
                Scaffold
              </button>
              <button
                onClick={() => setBimLayers((l) => ({ ...l, sensors: !l.sensors }))}
                className={`px-1.5 py-0.5 rounded-xs border transition ${
                  bimLayers.sensors
                    ? "bg-amber/30 border-amber text-amber font-bold"
                    : "border-border text-steel"
                }`}
              >
                IoT Sensors
              </button>
              <button
                onClick={() => setBimLayers((l) => ({ ...l, exploded: !l.exploded }))}
                className={`px-1.5 py-0.5 rounded-xs border transition ${
                  bimLayers.exploded
                    ? "bg-gold/30 border-gold text-gold font-bold"
                    : "border-border text-steel"
                }`}
              >
                {bimLayers.exploded ? "Collapse" : "Exploded View"}
              </button>
            </div>
          )}

          <div className="h-88 w-full bg-bg-0 relative">
            <Scene camera={{ position: [9, 14, 12], fov: 44 }}>
              {view3DMode === "bim" ? (
                <BIMViewerScene
                  layers={bimLayers}
                  progress={calculatedProgress}
                  onSelectSensor={(s) => setSelectedSensor(s)}
                />
              ) : (
                <BuildingFloorsScene
                  milestones={project.milestones}
                  progress={calculatedProgress}
                />
              )}
            </Scene>
          </div>

          <div className="p-2.5 bg-bg-1 border-t border-border text-[10px] font-mono text-steel flex justify-between items-center">
            {selectedSensor ? (
              <div className="text-amber flex items-center gap-2">
                <span>SENSOR [{selectedSensor.code}]:</span>
                <span className="text-foreground font-bold">{selectedSensor.name}</span>
                <span className="text-gold">({selectedSensor.value})</span>
              </div>
            ) : (
              <>
                <span className="text-gold">• Rotate & Pan 3D Camera</span>
                <span className="text-amber">• Click IoT Sensor Orbs</span>
                <span className="text-steel">• Toggle Layers Above</span>
              </>
            )}
          </div>
        </div>

        {/* Metrics & Scope (Right 7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="steel-card p-3 rounded-sm border border-border bg-bg-1 space-y-1">
              <div className="text-xs font-mono text-steel uppercase">Calculated Progress</div>
              <div className="text-2xl font-bold font-mono text-amber">
                {calculatedProgress}%
              </div>
              <div className="text-[10px] font-mono text-steel">
                Weighted by estimated hours
              </div>
            </div>

            <div className="steel-card p-3 rounded-sm border border-border bg-bg-1 space-y-1">
              <div className="text-xs font-mono text-steel uppercase">Spent / Allocated</div>
              <div className="text-2xl font-bold font-mono text-foreground">
                {formatCurrency(budgetSummary?.totalSpent || 0)}
              </div>
              <div className="text-[10px] font-mono text-steel">
                Budget: {formatCurrency(project.totalBudget)} ({budgetSummary?.utilizationRate}%)
              </div>
            </div>

            <div className="steel-card p-3 rounded-sm border border-border bg-bg-1 space-y-1">
              <div className="text-xs font-mono text-steel uppercase">Remaining Capital</div>
              <div className="text-2xl font-bold font-mono text-gold">
                {formatCurrency(budgetSummary?.remainingBudget || 0)}
              </div>
              <div className="text-[10px] font-mono text-steel">
                Uncommitted balance
              </div>
            </div>

            <div className="steel-card p-3 rounded-sm border border-border bg-bg-1 space-y-1">
              <div className="text-xs font-mono text-steel uppercase">Total Tasks</div>
              <div className="text-2xl font-bold font-mono text-foreground">
                {project.tasks?.length || 0}
              </div>
              <div className="text-[10px] font-mono text-steel">
                Active work breakdown units
              </div>
            </div>
          </div>

          {/* AI Construction Intelligence & Predictive EVA Telemetry Card */}
          {eva && riskAssessment && (
            <div className="steel-card p-4 rounded-sm border border-amber/40 bg-bg-1/90 space-y-3">
              <div className="flex flex-row items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber" />
                  <span className="text-xs font-heading text-amber uppercase font-bold tracking-wider">
                    AI CONSTRUCTION INTELLIGENCE & EARNED VALUE TELEMETRY
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-xs font-mono text-[10px] font-bold ${
                      riskAssessment.overallRiskLevel === "CRITICAL"
                        ? "bg-crimson/20 text-crimson border border-crimson"
                        : riskAssessment.overallRiskLevel === "HIGH"
                        ? "bg-amber/20 text-amber border border-amber"
                        : "bg-gold/20 text-gold border border-gold"
                    }`}
                  >
                    RISK: {riskAssessment.overallRiskLevel}
                  </span>
                  <span className="font-mono text-xs text-gold font-bold">
                    HEALTH: {eva.healthScore}/100
                  </span>
                </div>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {/* 4 EVA KPI Columns */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 bg-bg-2 rounded-xs border border-border">
                    <div className="text-[10px] text-steel">CPI (Cost Index)</div>
                    <div className={`text-sm font-bold ${eva.cpi < 0.95 ? "text-crimson" : "text-amber"}`}>
                      {eva.cpi}
                    </div>
                    <div className="text-[9px] text-steel">
                      {eva.cpi >= 1.0 ? "Under budget" : "Cost variance"}
                    </div>
                  </div>
                  <div className="p-2 bg-bg-2 rounded-xs border border-border">
                    <div className="text-[10px] text-steel">SPI (Schedule Index)</div>
                    <div className={`text-sm font-bold ${eva.spi < 0.95 ? "text-amber" : "text-gold"}`}>
                      {eva.spi}
                    </div>
                    <div className="text-[9px] text-steel">
                      {eva.spi >= 1.0 ? "Ahead of time" : "Pace slippage"}
                    </div>
                  </div>
                  <div className="p-2 bg-bg-2 rounded-xs border border-border">
                    <div className="text-[10px] text-steel">Est. at Completion</div>
                    <div className="text-sm font-bold text-foreground">
                      {formatCurrency(eva.estimateAtCompletion)}
                    </div>
                    <div className="text-[9px] text-steel">
                      BAC: {formatCurrency(eva.budgetAtCompletion)}
                    </div>
                  </div>
                  <div className="p-2 bg-bg-2 rounded-xs border border-border">
                    <div className="text-[10px] text-steel">Forecast Slippage</div>
                    <div className={`text-sm font-bold ${riskAssessment.projectedDelayDays > 0 ? "text-crimson" : "text-gold"}`}>
                      {riskAssessment.projectedDelayDays > 0 ? `+${riskAssessment.projectedDelayDays} Days` : "On Schedule"}
                    </div>
                    <div className="text-[9px] text-steel">Critical path impact</div>
                  </div>
                </div>

                {/* Critical Factor & Intervention */}
                {riskAssessment.criticalFactors.length > 0 && (
                  <div className="p-2.5 bg-bg-2 rounded-xs border border-border text-[11px] space-y-1">
                    <div className="text-amber font-bold flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber" />
                      <span>PRIMARY BOTTLENECK: {riskAssessment.criticalFactors[0].factor}</span>
                    </div>
                    <p className="text-steel leading-snug">
                      {riskAssessment.criticalFactors[0].description}
                    </p>
                    <div className="text-gold pt-1">
                      <span className="font-bold">RECOMMENDED ACTION: </span>
                      {riskAssessment.criticalFactors[0].mitigationAction}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description & Technical Specifications Panel */}
          <div className="steel-card p-4 rounded-sm border border-border bg-bg-1 flex-1 space-y-3">
            <h3 className="text-xs font-heading font-bold text-amber uppercase tracking-wider">
              ENGINEERING SCOPE & OBJECTIVES
            </h3>
            <div className="space-y-3 text-xs text-steel font-mono leading-relaxed">
              <p>{project.description || "No formal engineering description specified."}</p>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border text-[11px]">
                <div>
                  <span className="text-steel">Lead Project Director: </span>
                  <span className="text-foreground font-bold">{project.manager?.name || "Unassigned"}</span>
                </div>
                <div>
                  <span className="text-steel">Team Members: </span>
                  <span className="text-foreground">{project.members?.length || 0} Engineers</span>
                </div>
                <div>
                  <span className="text-steel">Contractor Partners: </span>
                  <span className="text-foreground">{project.contractors?.length || 0} Firms</span>
                </div>
                <div>
                  <span className="text-steel">Scheduled Tasks: </span>
                  <span className="text-foreground">{project.tasks?.length || 0} Work Packages</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border flex gap-2 font-mono text-xs">
        {[
          { id: "tasks", label: `WORK TASKS (${project.tasks?.length || 0})` },
          { id: "milestones", label: `MILESTONES (${project.milestones?.length || 0})` },
          { id: "budget", label: "BUDGET VARIANCE" },
          { id: "contractors", label: `CONTRACTORS (${project.contractors?.length || 0})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 border-b-2 uppercase transition ${
              activeTab === tab.id
                ? "border-amber text-amber font-bold bg-bg-1"
                : "border-transparent text-steel hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Tasks */}
      {activeTab === "tasks" && (
        <div className="steel-card rounded-sm overflow-hidden divide-y divide-border border border-border bg-bg-1">
          {project.tasks?.map((task: any) => (
            <div key={task.id} className="p-4 flex items-center justify-between gap-4 hover:bg-bg-2 transition">
              <div className="space-y-1 max-w-lg">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-foreground">{task.title}</span>
                  {task.dependencies?.some((d: any) => d.dependsOn.status !== "COMPLETED") && (
                    <span className="px-1.5 py-0.5 rounded-xs bg-crimson/20 border border-crimson text-gold text-[9px] font-mono flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-crimson" />
                      <span>PREREQ PENDING</span>
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-steel flex items-center gap-3">
                  <span>Assignee: {task.assignee?.name || "Unassigned"}</span>
                  <span>•</span>
                  <span>Estimated: {task.estimatedHours}h</span>
                  <span>•</span>
                  <span>Target: {new Date(task.deadline).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-28 text-right font-mono text-xs">
                  <span className="text-amber font-bold">{task.progress}%</span>
                </div>
                <StatusBadge status={task.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Milestones */}
      {activeTab === "milestones" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {project.milestones?.map((m: any, idx: number) => (
            <div key={m.id} className="steel-card p-4 rounded-sm border border-border bg-bg-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-steel">FLOOR LEVEL {idx + 1}</span>
                <StatusBadge status={m.status} />
              </div>
              <div className="font-bold text-sm text-foreground">{m.title}</div>
              <p className="text-xs text-steel font-mono">{m.description}</p>
              <div className="text-[10px] font-mono text-amber pt-2 border-t border-border">
                Target: {formatDate(m.targetDate)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Budget Variance */}
      {activeTab === "budget" && (
        <div className="steel-card p-4 rounded-sm border border-border bg-bg-1 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-border text-steel uppercase">
                  <th className="py-2 px-3">Expense Category</th>
                  <th className="py-2 px-3 text-right">Allocated</th>
                  <th className="py-2 px-3 text-right">Actual Spent</th>
                  <th className="py-2 px-3 text-right">Variance</th>
                  <th className="py-2 px-3 text-right">Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {budgetSummary?.categories.map((c: any) => (
                  <tr key={c.categoryId} className="hover:bg-bg-2">
                    <td className="py-2.5 px-3 font-semibold text-foreground">{c.categoryName}</td>
                    <td className="py-2.5 px-3 text-right text-steel">{formatCurrency(c.allocated)}</td>
                    <td className={`py-2.5 px-3 text-right font-bold ${c.isOverrun ? "text-crimson" : "text-foreground"}`}>
                      {formatCurrency(c.spent)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-steel">{formatCurrency(c.remaining)}</td>
                    <td className={`py-2.5 px-3 text-right font-bold ${c.isOverrun ? "text-crimson" : "text-amber"}`}>
                      {c.utilizationRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Assigned Contractors Detail */}
      {activeTab === "contractors" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {project.contractors?.map((pc: any) => (
            <div key={pc.id} className="steel-card p-4 rounded-sm border border-border bg-bg-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-amber uppercase font-semibold">{pc.role}</span>
                <span className="font-mono text-xs text-gold">★ {pc.contractor?.rating}</span>
              </div>
              <div className="font-bold text-sm text-foreground">{pc.contractor?.company}</div>
              <div className="text-xs font-mono text-steel">
                Contact Person: <span className="text-foreground">{pc.contractor?.contact}</span> ({pc.contractor?.phone})
              </div>
              <div className="text-xs font-mono text-steel">
                Email: <span className="text-foreground">{pc.contractor?.email}</span>
              </div>
              <div className="text-[10px] font-mono text-steel">
                Trade Specialty: <span className="text-amber">{pc.contractor?.specialty}</span>
              </div>
            </div>
          ))}
          {(!project.contractors || project.contractors.length === 0) && (
            <div className="col-span-2 p-6 text-center text-steel font-mono text-xs border border-border rounded-sm bg-bg-0">
              No contractor partners assigned yet. Click EDIT PROJECT to assign partner firms.
            </div>
          )}
        </div>
      )}

      {/* EDIT PROJECT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-0/80 backdrop-blur-xs">
          <div className="w-full max-w-3xl steel-card border border-border bg-bg-1 rounded-sm shadow-xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-foreground">
                  UPDATE PROJECT <span className="text-amber">SPECIFICATIONS</span>
                </h3>
                <p className="text-[11px] font-mono text-steel uppercase">
                  ID: {project.id} • AUTHORIZED PROJECT DIRECTORS & ADMINISTRATORS
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-steel hover:text-foreground transition rounded-xs hover:bg-bg-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xs bg-crimson/10 border border-crimson flex items-center gap-2 text-xs text-crimson font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {editSuccess && (
              <div className="p-3 rounded-xs bg-gold/10 border border-gold flex items-center gap-2 text-xs text-gold font-mono">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{editSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-steel mb-1">
                    Project Official Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs text-foreground focus:outline-none focus:border-amber transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-steel mb-1">
                    Project Status *
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs text-foreground focus:outline-none focus:border-amber transition font-mono"
                  >
                    <option value="PLANNING">PLANNING</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="DELAYED">DELAYED</option>
                    <option value="ON_HOLD">ON_HOLD</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-steel mb-1">
                    Site Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs text-foreground focus:outline-none focus:border-amber transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-steel mb-1">
                    Authorized Total Budget (USD) {canEditBudget ? "*" : "(Read-Only: Finance Required)"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    disabled={!canEditBudget}
                    value={editTotalBudget}
                    onChange={(e) => setEditTotalBudget(Number(e.target.value))}
                    className={`w-full px-3 py-2 bg-bg-0 border rounded-xs text-xs font-mono transition ${
                      canEditBudget
                        ? "border-border text-foreground focus:outline-none focus:border-amber"
                        : "border-border/60 text-steel cursor-not-allowed bg-bg-2"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-steel mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs text-foreground focus:outline-none focus:border-amber transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-steel mb-1">
                    Expected End Date
                  </label>
                  <input
                    type="date"
                    value={editExpectedEndDate}
                    onChange={(e) => setEditExpectedEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs text-foreground focus:outline-none focus:border-amber transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-steel mb-1">
                    Lead Project Director
                  </label>
                  <select
                    value={editManagerId}
                    onChange={(e) => setEditManagerId(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs text-foreground focus:outline-none focus:border-amber transition font-mono"
                  >
                    <option value="">Unassigned</option>
                    {availableManagers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-steel mb-1">
                  Engineering Scope & Technical Specifications
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs text-foreground focus:outline-none focus:border-amber transition font-mono"
                />
              </div>

              {/* Progress Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-mono uppercase tracking-wider text-steel">
                    Rollup Progress Percentage
                  </label>
                  <span className="font-mono text-xs font-bold text-amber">{editProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editProgress}
                  onChange={(e) => setEditProgress(Number(e.target.value))}
                  className="w-full accent-amber cursor-pointer"
                />
              </div>

              {/* Contractor Assignments */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-steel">
                    Assign Contractor Partners ({editContractorIds.length} Assigned)
                  </label>
                  <span className="text-[10px] font-mono text-steel">
                    Click to toggle assignments
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 bg-bg-0 border border-border rounded-xs">
                  {availableContractors.map((c) => {
                    const isSelected = editContractorIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => toggleEditContractor(c.id)}
                        className={`p-1.5 rounded-xs border text-[11px] font-mono cursor-pointer transition flex items-start gap-1.5 ${
                          isSelected
                            ? "bg-amber/15 border-amber text-foreground"
                            : "bg-bg-1 border-border/80 text-steel hover:border-steel hover:text-foreground"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-0.5 accent-amber cursor-pointer"
                        />
                        <div className="overflow-hidden">
                          <div className="font-semibold truncate">{c.company}</div>
                          <div className="text-[9px] text-steel truncate">{c.specialty}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-border text-xs font-mono uppercase text-steel hover:text-foreground rounded-xs transition"
                >
                  Cancel
                </button>
                <Button type="submit" variant="primary" loading={editSubmitting} className="px-5 h-9">
                  <span>SAVE SPECIFICATIONS</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE PROJECT CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-0/80 backdrop-blur-xs">
          <div className="w-full max-w-md steel-card border border-crimson/50 bg-bg-1 rounded-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-crimson">
              <AlertTriangle className="w-6 h-6 shrink-0 text-crimson" />
              <div>
                <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-crimson">
                  CONFIRM DECOMMISSION
                </h3>
                <p className="text-[11px] font-mono text-steel uppercase">
                  PERMANENT CASCADING REMOVAL
                </p>
              </div>
            </div>

            <p className="text-xs font-mono text-steel leading-relaxed">
              Are you sure you want to permanently decommission and delete{" "}
              <strong className="text-foreground">{project.name}</strong>? All associated
              work packages, milestones, expense ledgers, and site reports will be permanently purged.
            </p>

            {deleteError && (
              <div className="p-2.5 rounded-xs bg-crimson/10 border border-crimson text-xs text-crimson font-mono">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-border text-xs font-mono uppercase text-steel hover:text-foreground rounded-xs transition"
              >
                Abort
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={deleteSubmitting}
                className="px-4 py-2 bg-crimson hover:bg-crimson/90 text-white font-mono text-xs uppercase font-bold tracking-wider rounded-xs transition shadow-sm"
              >
                {deleteSubmitting ? "DECOMMISSIONING..." : "CONFIRM DELETE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

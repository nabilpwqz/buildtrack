"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  ArrowUpRight,
  Calendar,
  DollarSign,
  Download,
  Clock,
  TrendingUp,
  AlertTriangle,
  Award,
  User,
  X,
  AlertCircle,
  Edit3,
  Trash2,
  HardHat,
  CheckCircle2,
} from "@/components/ui/icons";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";

interface ProjectMetrics {
  totalProjects: number;
  activeProjects: number;
  delayedProjects: number;
  planningProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  totalBudget: number;
  avgProgress: number;
}

export default function ProjectsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState<ProjectMetrics>({
    totalProjects: 0,
    activeProjects: 0,
    delayedProjects: 0,
    planningProjects: 0,
    completedProjects: 0,
    onHoldProjects: 0,
    totalBudget: 0,
    avgProgress: 0,
  });

  // Selectors
  const [availableManagers, setAvailableManagers] = useState<any[]>([]);
  const [availableContractors, setAvailableContractors] = useState<any[]>([]);

  // New project modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState("PLANNING");
  const [newTotalBudget, setNewTotalBudget] = useState(25000000);
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [newEndDate, setNewEndDate] = useState(
    new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10)
  );
  const [newManagerId, setNewManagerId] = useState("");
  const [newContractorIds, setNewContractorIds] = useState<string[]>([]);

  // Edit project modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("PLANNING");
  const [editTotalBudget, setEditTotalBudget] = useState(0);
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editManagerId, setEditManagerId] = useState("");
  const [editProgress, setEditProgress] = useState(0);
  const [editContractorIds, setEditContractorIds] = useState<string[]>([]);

  // Delete project modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<any>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const userRole = currentUser?.role;
  const userId = currentUser?.id;
  const canCreate = userRole === "ADMIN" || userRole === "PROJECT_MANAGER";
  const canEditBudget = userRole === "ADMIN" || userRole === "FINANCE_MANAGER";

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        q: search,
      });
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/v1/projects?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
        setTotal(data.total || 0);
        if (data.metrics) {
          setMetrics(data.metrics);
        }
      }
    } catch (e) {
      console.error("Failed to load projects:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectors = async () => {
    try {
      const [uRes, cRes, sRes] = await Promise.all([
        fetch("/api/v1/users"),
        fetch("/api/v1/contractors"),
        fetch("/api/auth/session"),
      ]);
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData?.user) setCurrentUser(sData.user);
      }
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

  useEffect(() => {
    fetchProjects();
    loadSelectors();
  }, [page, pageSize, search, statusFilter]);

  const toggleNewContractor = (cId: string) => {
    setNewContractorIds((prev) =>
      prev.includes(cId) ? prev.filter((id) => id !== cId) : [...prev, cId]
    );
  };

  const toggleEditContractor = (cId: string) => {
    setEditContractorIds((prev) =>
      prev.includes(cId) ? prev.filter((id) => id !== cId) : [...prev, cId]
    );
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newLocation.trim()) {
      setCreateError("Project title and location are required.");
      return;
    }

    setCreateSubmitting(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          location: newLocation.trim(),
          description: newDescription.trim() || undefined,
          status: newStatus,
          totalBudget: Number(newTotalBudget) || 1000000,
          startDate: new Date(newStartDate).toISOString(),
          expectedEndDate: new Date(newEndDate).toISOString(),
          managerId: newManagerId || undefined,
          contractorIds: newContractorIds,
        }),
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        setNewName("");
        setNewLocation("");
        setNewDescription("");
        setNewContractorIds([]);
        fetchProjects();
      } else {
        const err = await res.json();
        setCreateError(err?.error?.message || "Failed to initialize project.");
      }
    } catch (err: any) {
      setCreateError(err.message || "Network error commissioning project.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleOpenEditModal = (p: any) => {
    setEditingProjectId(p.id);
    setEditName(p.name || "");
    setEditLocation(p.location || "");
    setEditDescription(p.description || "");
    setEditStatus(p.status || "PLANNING");
    setEditTotalBudget(p.totalBudget || 0);
    setEditStartDate(p.startDate ? new Date(p.startDate).toISOString().slice(0, 10) : "");
    setEditEndDate(p.expectedEndDate ? new Date(p.expectedEndDate).toISOString().slice(0, 10) : "");
    setEditManagerId(p.managerId || p.manager?.id || "");
    setEditProgress(p.progress || 0);
    setEditContractorIds(p.contractors?.map((c: any) => c.contractorId || c.contractor?.id) || []);
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProjectId) return;

    setEditSubmitting(true);
    setEditError(null);

    try {
      const payload: any = {
        name: editName.trim(),
        location: editLocation.trim(),
        description: editDescription.trim() || undefined,
        status: editStatus,
        startDate: editStartDate ? new Date(editStartDate).toISOString() : undefined,
        expectedEndDate: editEndDate ? new Date(editEndDate).toISOString() : undefined,
        managerId: editManagerId || undefined,
        progress: Number(editProgress),
        contractorIds: editContractorIds,
      };

      if (canEditBudget) {
        payload.totalBudget = Number(editTotalBudget);
      }

      const res = await fetch(`/api/v1/projects/${editingProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || "Failed to update project specifications.");
      }

      setIsEditModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      setEditError(err.message || "Failed to update project.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProject) return;
    setDeleteSubmitting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/v1/projects/${deletingProject.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || "Failed to delete project.");
      }

      setIsDeleteModalOpen(false);
      setDeletingProject(null);
      fetchProjects();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete project.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (!projects || projects.length === 0) return;
    const headers = [
      "Project ID",
      "Project Official Title",
      "Site Location",
      "Work Status",
      "Calculated Progress (%)",
      "Authorized Capital (USD)",
      "Project Director",
      "Expected Completion",
    ];

    const rows: (string | number)[][] = projects.map((p: any) => [
      `"${p.id}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.location}"`,
      p.status,
      p.progress,
      p.totalBudget,
      `"${p.manager?.name || "Unassigned"}"`,
      p.expectedEndDate ? new Date(p.expectedEndDate).toISOString().slice(0, 10) : "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `buildtrack-projects-portfolio-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "PROJECT NAME / LOCATION",
      cell: ({ row }) => (
        <div className="space-y-0.5 max-w-sm">
          <Link
            href={`/projects/${row.original.id}`}
            className="font-semibold text-xs text-foreground hover:text-amber transition-colors flex items-center gap-1.5"
          >
            <span>{row.original.name}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-steel opacity-70" />
          </Link>
          <div className="text-[11px] text-steel font-mono">
            {row.original.location}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "STATUS",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "progress",
      header: "PROGRESS ROLLUP",
      cell: ({ row }) => (
        <div className="w-32 space-y-1">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-steel">Weighted</span>
            <span className="text-amber font-bold">{row.original.progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-bg-0 rounded-full overflow-hidden border border-border">
            <div
              className={`h-full transition-all ${
                row.original.progress === 100
                  ? "bg-gold"
                  : row.original.progress > 50
                  ? "bg-amber"
                  : "bg-steel"
              }`}
              style={{ width: `${row.original.progress}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      accessorKey: "totalBudget",
      header: "AUTHORIZED CAPITAL",
      cell: ({ row }) => (
        <div className="font-mono text-xs font-bold text-foreground">
          {formatCurrency(row.original.totalBudget)}
        </div>
      ),
    },
    {
      accessorKey: "manager",
      header: "PROJECT DIRECTOR",
      cell: ({ row }) => (
        <div className="text-xs font-mono text-foreground flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-steel shrink-0" />
          <span className="truncate max-w-[120px]">{row.original.manager?.name || "Unassigned"}</span>
        </div>
      ),
    },
    {
      accessorKey: "contractors",
      header: "ASSIGNED CONTRACTORS",
      cell: ({ row }) => {
        const assigned = row.original.contractors || [];
        if (assigned.length === 0) {
          return <span className="text-[10px] font-mono text-steel">None assigned</span>;
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-[160px]">
            {assigned.slice(0, 2).map((c: any) => (
              <span
                key={c.id || c.contractorId}
                className="px-1.5 py-0.5 rounded-xs bg-bg-2 border border-border text-[9px] font-mono text-amber truncate max-w-[110px]"
                title={c.contractor?.company || c.contractor?.name}
              >
                {c.contractor?.company || c.contractor?.name}
              </span>
            ))}
            {assigned.length > 2 && (
              <span className="px-1 py-0.5 rounded-xs bg-bg-2 border border-border text-[9px] font-mono text-steel">
                +{assigned.length - 2}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "expectedEndDate",
      header: "TARGET DATE",
      cell: ({ row }) => (
        <div className="text-xs font-mono text-steel">
          {formatDate(row.original.expectedEndDate)}
        </div>
      ),
    },
    {
      id: "actions",
      header: "OPERATIONS",
      cell: ({ row }) => {
        const p = row.original;
        const canManage =
          userRole === "ADMIN" ||
          (userRole === "PROJECT_MANAGER" && (p.managerId === userId || p.manager?.id === userId));

        return (
          <div className="flex items-center gap-1.5">
            <Link
              href={`/projects/${p.id}`}
              className="px-2.5 py-1 text-[10px] font-mono text-amber bg-amber/10 border border-amber/30 hover:border-amber rounded-xs uppercase tracking-wider transition font-semibold"
              title="View Project Details & BIM Spatial Twin"
            >
              DETAILS
            </Link>
            <Link
              href={`/projects/${p.id}/timeline`}
              className="p-1 text-[10px] font-mono text-steel bg-bg-2 border border-border hover:border-amber hover:text-foreground rounded-xs transition"
              title="Gantt Timeline View"
            >
              <Calendar className="w-3.5 h-3.5" />
            </Link>
            {canManage && (
              <button
                onClick={() => handleOpenEditModal(p)}
                className="p-1 text-[10px] font-mono text-steel bg-bg-2 border border-border hover:border-amber hover:text-amber rounded-xs transition"
                title="Edit Project Specifications"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            {canManage && (
              <button
                onClick={() => {
                  setDeletingProject(p);
                  setIsDeleteModalOpen(true);
                }}
                className="p-1 text-[10px] font-mono text-crimson/70 bg-crimson/10 border border-crimson/30 hover:border-crimson hover:text-crimson rounded-xs transition"
                title="Decommission Project"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-heading text-2xl font-bold uppercase tracking-wider text-foreground">
            CAPITAL PROJECTS <span className="text-amber">DIRECTORY</span>
          </h1>
          <p className="text-xs font-mono text-steel uppercase tracking-widest mt-1">
            MANAGED CIVIL & INFRASTRUCTURE UNDERTAKINGS ({metrics.totalProjects || total} TOTAL)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canCreate && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2 bg-amber hover:bg-amber-glow text-bg-0 text-xs font-mono uppercase tracking-wider rounded-sm font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-bg-0" />
              <span>+ NEW PROJECT</span>
            </button>
          )}

          <Link
            href="/projects/new"
            className="px-3 py-2 bg-bg-2 border border-border hover:border-amber text-foreground hover:text-amber text-xs font-mono uppercase tracking-wider rounded-sm transition flex items-center gap-1.5"
          >
            <span>FULL SPEC FORM</span>
          </Link>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-bg-2 border border-border hover:border-amber text-foreground hover:text-amber text-xs font-mono uppercase tracking-wider rounded-sm transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-amber" />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Capital Commitment */}
        <div className="steel-card p-4 rounded-sm border border-border bg-bg-1 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-steel">
            <span>PROGRAM CAPITAL COMMITMENT</span>
            <DollarSign className="w-4 h-4 text-amber" />
          </div>
          <div className="text-2xl font-heading font-bold text-foreground">
            {formatCurrency(metrics.totalBudget)}
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-steel">
            <span>Program Scope</span>
            <span className="text-amber">{metrics.totalProjects} Megaprojects</span>
          </div>
          <div className="h-1 w-full bg-bg-0 rounded-full overflow-hidden border border-border">
            <div className="h-full bg-amber w-full" />
          </div>
        </div>

        {/* Card 2: Active Construction Sites */}
        <div className="steel-card p-4 rounded-sm border border-border bg-bg-1 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-steel">
            <span>ACTIVE CONSTRUCTION SITES</span>
            <Building2 className="w-4 h-4 text-gold" />
          </div>
          <div className="text-2xl font-heading font-bold text-foreground">
            {metrics.activeProjects}
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-steel">
            <span>Mobilized Rate</span>
            <span className="text-gold">
              {metrics.totalProjects > 0
                ? Math.round((metrics.activeProjects / metrics.totalProjects) * 100)
                : 0}
              % Active
            </span>
          </div>
          <div className="h-1 w-full bg-bg-0 rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-gold"
              style={{
                width: `${
                  metrics.totalProjects > 0
                    ? (metrics.activeProjects / metrics.totalProjects) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Card 3: Delayed Works */}
        <div className="steel-card p-4 rounded-sm border border-border bg-bg-1 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-steel">
            <span>CRITICAL PATH DELAYS</span>
            <AlertTriangle className="w-4 h-4 text-crimson" />
          </div>
          <div className="text-2xl font-heading font-bold text-crimson">
            {metrics.delayedProjects}
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-steel">
            <span>On-Hold Projects</span>
            <span className="text-steel">{metrics.onHoldProjects} Paused</span>
          </div>
          <div className="h-1 w-full bg-bg-0 rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-crimson"
              style={{
                width: `${
                  metrics.totalProjects > 0
                    ? (metrics.delayedProjects / metrics.totalProjects) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Card 4: Portfolio Weighted Completion */}
        <div className="steel-card p-4 rounded-sm border border-border bg-bg-1 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-steel">
            <span>PORTFOLIO WEIGHTED PROGRESS</span>
            <TrendingUp className="w-4 h-4 text-amber" />
          </div>
          <div className="text-2xl font-heading font-bold text-amber">
            {metrics.avgProgress}%
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-steel">
            <span>Completed Undertakings</span>
            <span className="text-gold">{metrics.completedProjects} Finished</span>
          </div>
          <div className="h-1 w-full bg-bg-0 rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-amber"
              style={{ width: `${Math.min(100, metrics.avgProgress)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="steel-card p-4 rounded-sm border border-border bg-bg-1 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search projects by title, municipality, corridor..."
            className="w-full bg-bg-0 border border-border px-3.5 py-2 text-xs font-mono text-foreground placeholder:text-steel focus:outline-none focus:border-amber rounded-xs transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-mono text-steel uppercase">STATUS:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="bg-bg-0 border border-border px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-amber rounded-xs transition"
          >
            <option value="">ALL STATUSES ({total})</option>
            <option value="PLANNING">PLANNING ({metrics.planningProjects})</option>
            <option value="IN_PROGRESS">IN_PROGRESS ({metrics.activeProjects})</option>
            <option value="DELAYED">DELAYED ({metrics.delayedProjects})</option>
            <option value="ON_HOLD">ON_HOLD ({metrics.onHoldProjects})</option>
            <option value="COMPLETED">COMPLETED ({metrics.completedProjects})</option>
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <DataTable
        columns={columns}
        data={projects}
        pageCount={Math.ceil(total / pageSize)}
        pageIndex={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {/* QUICK CREATE PROJECT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-0/80 backdrop-blur-xs">
          <div className="w-full max-w-2xl steel-card border border-border bg-bg-1 rounded-sm shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-foreground">
                  COMMISSION NEW CAPITAL <span className="text-amber">PROJECT</span>
                </h3>
                <p className="text-[11px] font-mono text-steel uppercase">
                  INITIALIZE BASELINE SPECIFICATIONS & SCHEDULE
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-steel hover:text-foreground transition rounded-xs hover:bg-bg-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xs bg-crimson/10 border border-crimson flex items-center gap-2 text-xs text-crimson font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] text-steel uppercase">PROJECT OFFICIAL TITLE *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Padma Mega Bridge Rail Link Phase 4"
                    className="w-full bg-bg-0 border border-border px-3 py-2 rounded-xs text-foreground focus:outline-none focus:border-amber"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-steel uppercase">PROJECT STATUS *</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-bg-0 border border-border px-3 py-2 rounded-xs text-foreground focus:outline-none focus:border-amber"
                  >
                    <option value="PLANNING">PLANNING</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="DELAYED">DELAYED</option>
                    <option value="ON_HOLD">ON_HOLD</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-steel uppercase">SITE LOCATION / CORRIDOR *</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Dhaka-Mawa Expressway"
                    className="w-full bg-bg-0 border border-border px-3 py-2 rounded-xs text-foreground focus:outline-none focus:border-amber"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-steel uppercase">AUTHORIZED CAPITAL (USD) *</label>
                  <input
                    type="number"
                    min="10000"
                    step="50000"
                    value={newTotalBudget}
                    onChange={(e) => setNewTotalBudget(Number(e.target.value))}
                    className="w-full bg-bg-0 border border-border px-3 py-2 rounded-xs text-foreground focus:outline-none focus:border-amber"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-steel uppercase">MOBILIZATION START DATE *</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full bg-bg-0 border border-border px-3 py-2 rounded-xs text-foreground focus:outline-none focus:border-amber"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-steel uppercase">TARGET COMPLETION DATE *</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full bg-bg-0 border border-border px-3 py-2 rounded-xs text-foreground focus:outline-none focus:border-amber"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-steel uppercase">PROJECT DIRECTOR</label>
                  <select
                    value={newManagerId}
                    onChange={(e) => setNewManagerId(e.target.value)}
                    className="w-full bg-bg-0 border border-border px-3 py-2 rounded-xs text-foreground focus:outline-none focus:border-amber"
                  >
                    <option value="">Select Project Manager...</option>
                    {availableManagers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-steel uppercase">ENGINEERING SCOPE / SPECIFICATIONS</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detail structural scope, geotechnical conditions, structural concrete specs..."
                  className="w-full bg-bg-0 border border-border px-3 py-2 rounded-xs text-foreground focus:outline-none focus:border-amber"
                />
              </div>

              {/* Contractors Selection */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] text-steel uppercase">
                    ASSIGN CONTRACTORS ({newContractorIds.length} SELECTED)
                  </label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 bg-bg-0 border border-border rounded-xs">
                  {availableContractors.map((c) => {
                    const isSelected = newContractorIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => toggleNewContractor(c.id)}
                        className={`p-1.5 rounded-xs border text-[11px] cursor-pointer transition flex items-start gap-1.5 ${
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

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-bg-2 border border-border text-steel hover:text-foreground text-xs font-mono uppercase rounded-xs transition"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-2 bg-amber hover:bg-amber-glow text-bg-0 text-xs font-mono font-bold uppercase rounded-xs transition shadow-sm"
                >
                  {createSubmitting ? "COMMISSIONING..." : "COMMISSION PROJECT"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK EDIT PROJECT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-0/80 backdrop-blur-xs">
          <div className="w-full max-w-2xl steel-card border border-border bg-bg-1 rounded-sm shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-foreground">
                  EDIT PROJECT <span className="text-amber">SPECIFICATIONS</span>
                </h3>
                <p className="text-[11px] font-mono text-steel uppercase">
                  MODIFY BASELINE DATA, STATUS, DIRECTORS & CONTRACTOR PARTNERS
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

            <form onSubmit={handleSaveEdit} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] text-steel uppercase">PROJECT OFFICIAL TITLE *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-bg-0 border border-border px-3 py-2 rounded-xs text-foreground focus:outline-none focus:border-amber"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-steel uppercase">STATUS *</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-bg-0 border border-border px-3 py-2 rounded-xs text-foreground focus:outline-none focus:border-amber"
                  >
                    <option value="PLANNING">PLANNING</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="DELAYED">DELAYED</option>
                    <option value="ON_HOLD">ON_HOLD</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-steel uppercase">SITE LOCATION *</label>
                  <input
                    type="text"
                    required
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full bg-bg-0 border border-border px-3 py-2 rounded-xs text-foreground focus:outline-none focus:border-amber"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-steel uppercase">
                    AUTHORIZED CAPITAL (USD) {canEditBudget ? "*" : "(Read-Only: Finance)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    disabled={!canEditBudget}
                    value={editTotalBudget}
                    onChange={(e) => setEditTotalBudget(Number(e.target.value))}
                    className={`w-full bg-bg-0 border px-3 py-2 rounded-xs transition ${
                      canEditBudget
                        ? "border-border text-foreground focus:outline-none focus:border-amber"
                        : "border-border/60 text-steel cursor-not-allowed bg-bg-2"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-steel uppercase">START DATE</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full bg-bg-0 border border-border px-3 py-2 rounded-xs text-foreground focus:outline-none focus:border-amber"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-steel uppercase">EXPECTED END DATE</label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full bg-bg-0 border border-border px-3 py-2 rounded-xs text-foreground focus:outline-none focus:border-amber"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-steel uppercase">PROJECT DIRECTOR</label>
                  <select
                    value={editManagerId}
                    onChange={(e) => setEditManagerId(e.target.value)}
                    className="w-full bg-bg-0 border border-border px-3 py-2 rounded-xs text-foreground focus:outline-none focus:border-amber"
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

              <div className="space-y-1">
                <label className="text-[10px] text-steel uppercase">ENGINEERING SCOPE</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-bg-0 border border-border px-3 py-2 rounded-xs text-foreground focus:outline-none focus:border-amber"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-steel uppercase">PROGRESS ROLLUP</label>
                  <span className="text-amber font-bold">{editProgress}%</span>
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

              {/* Contractors */}
              <div className="pt-2 border-t border-border">
                <label className="block text-[10px] text-steel uppercase mb-1">
                  ASSIGN CONTRACTOR PARTNERS ({editContractorIds.length} ASSIGNED)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-28 overflow-y-auto p-2 bg-bg-0 border border-border rounded-xs">
                  {availableContractors.map((c) => {
                    const isSelected = editContractorIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => toggleEditContractor(c.id)}
                        className={`p-1.5 rounded-xs border text-[11px] cursor-pointer transition flex items-start gap-1.5 ${
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

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-bg-2 border border-border text-steel hover:text-foreground text-xs font-mono uppercase rounded-xs transition"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 bg-amber hover:bg-amber-glow text-bg-0 text-xs font-mono font-bold uppercase rounded-xs transition shadow-sm"
                >
                  {editSubmitting ? "SAVING..." : "SAVE CHANGES"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {isDeleteModalOpen && deletingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-0/80 backdrop-blur-xs">
          <div className="w-full max-w-md steel-card border border-crimson/50 bg-bg-1 rounded-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-crimson">
              <AlertTriangle className="w-6 h-6 shrink-0 text-crimson" />
              <div>
                <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-crimson">
                  CONFIRM DECOMMISSION
                </h3>
                <p className="text-[11px] font-mono text-steel uppercase">
                  PERMANENT PROJECT REMOVAL
                </p>
              </div>
            </div>

            <p className="text-xs font-mono text-steel leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground">{deletingProject.name}</strong>? All associated
              work breakdown tasks, milestones, and expense ledgers will be permanently purged.
            </p>

            {deleteError && (
              <div className="p-2.5 rounded-xs bg-crimson/10 border border-crimson text-xs text-crimson font-mono">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingProject(null);
                }}
                className="px-4 py-2 border border-border text-xs font-mono uppercase text-steel hover:text-foreground rounded-xs transition"
              >
                Abort
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
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

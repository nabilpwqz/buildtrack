"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Trello,
  Plus,
  Lock,
  ShieldAlert,
  ArrowRight,
  User,
  Clock,
  Building2,
  Filter,
  Download,
  AlertCircle,
  Sparkles,
  Layers,
  Award,
  CheckCircle2,
  X,
  FileText,
  MessageSquare,
  Send,
  History,
} from "@/components/ui/icons";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/lib/utils";

interface TaskMetrics {
  totalTasks: number;
  todoCount: number;
  inProgressCount: number;
  reviewCount: number;
  completedCount: number;
  criticalCount: number;
  overdueCount: number;
  blockedCount: number;
  averageProgress: number;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<TaskMetrics>({
    totalTasks: 0,
    todoCount: 0,
    inProgressCount: 0,
    reviewCount: 0,
    completedCount: 0,
    criticalCount: 0,
    overdueCount: 0,
    blockedCount: 0,
    averageProgress: 0,
  });

  // Modal states
  const [selectedTaskForDossier, setSelectedTaskForDossier] = useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // New task form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newProjectId, setNewProjectId] = useState("");
  const [newAssigneeId, setNewAssigneeId] = useState("");
  const [newPriority, setNewPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [newEstimatedHours, setNewEstimatedHours] = useState(16);
  const [newDeadline, setNewDeadline] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );
  const [newDependsOnIds, setNewDependsOnIds] = useState<string[]>([]);
  const [availableProjectTasks, setAvailableProjectTasks] = useState<any[]>([]);

  // Dossier interactive states
  const [newCommentText, setNewCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [editProgress, setEditProgress] = useState(0);
  const [savingProgress, setSavingProgress] = useState(false);

  // Fetch available tasks for prerequisite dependency selection
  useEffect(() => {
    if (!newProjectId) {
      setAvailableProjectTasks([]);
      return;
    }
    fetch(`/api/v1/tasks?projectId=${newProjectId}&pageSize=100`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.tasks) setAvailableProjectTasks(data.tasks);
      })
      .catch((err) => console.error("Failed to load project tasks:", err));
  }, [newProjectId]);

  // Initial reference data
  useEffect(() => {
    async function loadMeta() {
      try {
        const [projRes, usersRes] = await Promise.all([
          fetch("/api/v1/projects?pageSize=50"),
          fetch("/api/v1/users?pageSize=50"),
        ]);
        if (projRes.ok) {
          const p = await projRes.json();
          setProjects(p.projects || []);
          if (p.projects?.length > 0 && !newProjectId) {
            setNewProjectId(p.projects[0].id);
          }
        }
        if (usersRes.ok) {
          const u = await usersRes.json();
          setUsers(u.users || []);
        }
      } catch (err) {
        console.error("Failed to load reference data:", err);
      }
    }
    loadMeta();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        q: search,
      });
      if (statusFilter) params.set("status", statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      if (selectedProjectId) params.set("projectId", selectedProjectId);
      if (blockedOnly) params.set("blockedOnly", "true");
      if (overdueOnly) params.set("overdueOnly", "true");

      const res = await fetch(`/api/v1/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        setTotal(data.total || 0);
        if (data.metrics) {
          setMetrics(data.metrics);
        }
      }
    } catch (e) {
      console.error("Failed to load tasks:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [page, pageSize, search, statusFilter, priorityFilter, selectedProjectId, blockedOnly, overdueOnly]);

  const fetchTaskDetails = async (taskId: string) => {
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTaskForDossier(data.task);
        setEditProgress(data.task.progress || 0);
      }
    } catch (err) {
      console.error("Failed to load task details:", err);
    }
  };

  const openDossier = (task: any) => {
    setSelectedTaskForDossier(task);
    setEditProgress(task.progress || 0);
    setNewCommentText("");
    setCommentError(null);
    fetchTaskDetails(task.id);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForDossier || !newCommentText.trim()) return;
    setSubmittingComment(true);
    setCommentError(null);
    try {
      const res = await fetch(`/api/v1/tasks/${selectedTaskForDossier.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newCommentText.trim() }),
      });
      if (res.ok) {
        setNewCommentText("");
        await fetchTaskDetails(selectedTaskForDossier.id);
        fetchTasks();
      } else {
        const err = await res.json();
        setCommentError(err?.error?.message || "Failed to post comment");
      }
    } catch (err: any) {
      setCommentError(err.message || "Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSaveProgress = async () => {
    if (!selectedTaskForDossier) return;
    setSavingProgress(true);
    try {
      const res = await fetch(`/api/v1/tasks/${selectedTaskForDossier.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: Number(editProgress) }),
      });
      if (res.ok) {
        await fetchTaskDetails(selectedTaskForDossier.id);
        fetchTasks();
      } else {
        const err = await res.json();
        alert(err?.error?.message || "Failed to update progress");
      }
    } catch (err) {
      console.error("Failed to update progress:", err);
    } finally {
      setSavingProgress(false);
    }
  };

  const handleQuickTransition = async (taskId: string, targetStatus: string) => {
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
      if (res.ok) {
        fetchTasks();
        if (selectedTaskForDossier?.id === taskId) {
          await fetchTaskDetails(taskId);
        }
      } else {
        const err = await res.json();
        alert(err?.error?.message || "Transition rejected by prerequisite rule");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newProjectId) {
      setCreateError("Title and project assignment are required.");
      return;
    }

    setCreateSubmitting(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/v1/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: newProjectId,
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          assigneeId: newAssigneeId || undefined,
          priority: newPriority,
          estimatedHours: Number(newEstimatedHours) || 8,
          deadline: new Date(newDeadline).toISOString(),
          dependsOnIds: newDependsOnIds.length > 0 ? newDependsOnIds : undefined,
        }),
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        setNewTitle("");
        setNewDescription("");
        setNewDependsOnIds([]);
        fetchTasks();
      } else {
        const err = await res.json();
        setCreateError(err?.error?.message || "Failed to create work package.");
      }
    } catch (err: any) {
      setCreateError(err.message || "Network error submitting work package.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (!tasks || tasks.length === 0) return;
    const headers = [
      "Task ID",
      "Work Package Title",
      "Megaproject",
      "Work Status",
      "Priority Level",
      "Completion (%)",
      "Assignee Name",
      "Target Deadline",
      "Is Blocked",
      "Is Overdue",
    ];

    const rows: (string | number)[][] = tasks.map((t: any) => [
      `"${t.id}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.project?.name || "General"}"`,
      t.status,
      t.priority,
      t.progress,
      `"${t.assignee?.name || "Unassigned"}"`,
      t.deadline ? new Date(t.deadline).toISOString().slice(0, 10) : "",
      t.isBlocked ? "YES" : "NO",
      t.isOverdue ? "YES" : "NO",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `buildtrack-work-packages-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "title",
      header: "TASK TITLE / SCOPE",
      cell: ({ row }) => (
        <div className="space-y-1 max-w-sm">
          <div
            onClick={() => openDossier(row.original)}
            className="font-semibold text-xs text-foreground hover:text-amber cursor-pointer transition leading-snug"
          >
            {row.original.title}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-steel uppercase truncate">
              {row.original.project?.name || "General"}
            </span>
            {row.original.isBlocked && (
              <span
                className="px-1.5 py-0.5 bg-crimson/20 border border-crimson/60 text-gold text-[9px] font-mono flex items-center gap-1 rounded-xs"
                title={`Blocked by ${row.original.blockedByCount || 1} incomplete prerequisites`}
              >
                <Lock className="w-2.5 h-2.5 text-crimson" />
                <span>BLOCKED</span>
              </span>
            )}
            {row.original.isOverdue && (
              <span
                className="px-1.5 py-0.5 bg-crimson/20 border border-crimson text-crimson text-[9px] font-mono flex items-center gap-1 rounded-xs"
                title="Target deadline exceeded"
              >
                <ShieldAlert className="w-2.5 h-2.5 text-crimson" />
                <span>OVERDUE</span>
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "WORK STATUS",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "priority",
      header: "PRIORITY",
      cell: ({ row }) => {
        const p = row.original.priority;
        const color =
          p === "CRITICAL"
            ? "text-crimson font-bold border-crimson/40 bg-crimson/10"
            : p === "HIGH"
            ? "text-amber font-semibold border-amber/40 bg-amber/10"
            : p === "MEDIUM"
            ? "text-gold border-gold/40 bg-gold/10"
            : "text-steel border-border bg-bg-2";
        return (
          <span className={`px-2 py-0.5 rounded-xs border text-[10px] font-mono uppercase ${color}`}>
            {p}
          </span>
        );
      },
    },
    {
      accessorKey: "progress",
      header: "PROGRESS",
      cell: ({ row }) => (
        <div className="w-28 space-y-1">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-steel">{row.original.progress}%</span>
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
      accessorKey: "assignee",
      header: "ASSIGNEE",
      cell: ({ row }) => (
        <div className="text-xs font-mono text-foreground flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-steel" />
          <span>{row.original.assignee?.name || "Unassigned"}</span>
        </div>
      ),
    },
    {
      accessorKey: "deadline",
      header: "TARGET DATE",
      cell: ({ row }) => (
        <div
          className={`text-xs font-mono ${
            row.original.isOverdue ? "text-crimson font-bold" : "text-steel"
          }`}
        >
          {formatDate(row.original.deadline)}
        </div>
      ),
    },
    {
      id: "quick_actions",
      header: "ACTION & DOSSIER",
      cell: ({ row }) => {
        const status = row.original.status;
        const nextStatus =
          status === "TODO"
            ? "IN_PROGRESS"
            : status === "IN_PROGRESS"
            ? "REVIEW"
            : status === "REVIEW"
            ? "COMPLETED"
            : null;

        return (
          <div className="flex items-center gap-1.5">
            {nextStatus ? (
              <button
                onClick={() => handleQuickTransition(row.original.id, nextStatus)}
                className="px-2 py-1 bg-bg-2 border border-border hover:border-amber text-amber text-[10px] font-mono uppercase tracking-wider rounded-xs transition flex items-center gap-1"
                title={`Advance to ${nextStatus.replace("_", " ")}`}
              >
                <span>Move to {nextStatus.replace("_", " ")}</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </button>
            ) : (
              <span className="text-[10px] font-mono text-gold px-2 py-1 bg-gold/10 border border-gold/30 rounded-xs flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-gold" />
                <span>Certified</span>
              </span>
            )}
            <button
              onClick={() => openDossier(row.original)}
              className="p-1 bg-bg-2 border border-border hover:border-amber text-steel hover:text-amber rounded-xs transition"
              title="Inspect Task Dossier & Audit History"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
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
            WORK PACKAGES & <span className="text-amber">TASKS REGISTRY</span>
          </h1>
          <p className="text-xs font-mono text-steel uppercase tracking-widest mt-1">
            SCHEDULED CONTRACTUAL DELIVERABLES & DEPENDENCY STATUS ({metrics.totalTasks || total} TOTAL)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 bg-amber hover:bg-amber-glow text-bg-0 text-xs font-mono uppercase tracking-wider rounded-sm font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-bg-0" />
            <span>+ NEW WORK PACKAGE</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-bg-2 border border-border hover:border-amber text-foreground hover:text-amber text-xs font-mono uppercase tracking-wider rounded-sm transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-amber" />
            <span>EXPORT CSV</span>
          </button>

          <Link
            href="/tasks/kanban"
            className="px-3.5 py-2 bg-bg-2 border border-border hover:border-amber text-foreground hover:text-amber text-xs font-mono uppercase tracking-wider rounded-sm transition flex items-center gap-1.5"
          >
            <Trello className="w-3.5 h-3.5 text-amber" />
            <span>KANBAN BOARD</span>
          </Link>
        </div>
      </div>

      {/* 4 Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Work Packages */}
        <div className="steel-card p-4 rounded-sm border border-border bg-bg-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-steel">
              ACTIVE WORK PACKAGES
            </span>
            <CheckSquare className="w-4 h-4 text-amber" />
          </div>
          <div className="text-2xl font-heading font-bold text-foreground">
            {metrics.totalTasks}
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-steel">
            <span>Portfolio Scope</span>
            <span className="text-amber">{projects.length || 12} Projects Active</span>
          </div>
          <div className="h-1 w-full bg-bg-0 rounded-full overflow-hidden border border-border">
            <div className="h-full bg-amber w-full" />
          </div>
        </div>

        {/* Card 2: In Progress & Review */}
        <div className="steel-card p-4 rounded-sm border border-border bg-bg-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-steel">
              IN PROGRESS & REVIEW
            </span>
            <Clock className="w-4 h-4 text-gold" />
          </div>
          <div className="text-2xl font-heading font-bold text-foreground">
            {metrics.inProgressCount + metrics.reviewCount}
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-steel">
            <span>Execution Volume</span>
            <span className="text-gold">
              {metrics.totalTasks > 0
                ? Math.round(((metrics.inProgressCount + metrics.reviewCount) / metrics.totalTasks) * 100)
                : 0}
              % Active
            </span>
          </div>
          <div className="h-1 w-full bg-bg-0 rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-gold transition-all"
              style={{
                width: `${
                  metrics.totalTasks > 0
                    ? ((metrics.inProgressCount + metrics.reviewCount) / metrics.totalTasks) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Card 3: Critical Path & Blocked */}
        <div className="steel-card p-4 rounded-sm border border-border bg-bg-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-steel">
              CRITICAL PATH & BLOCKED
            </span>
            <Lock className="w-4 h-4 text-crimson" />
          </div>
          <div className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <span>{metrics.blockedCount}</span>
            {metrics.blockedCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-crimson/20 border border-crimson text-crimson">
                ACTION REQ
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-steel">
            <span>Critical Priority</span>
            <span className="text-crimson font-bold">{metrics.criticalCount} Packages</span>
          </div>
          <div className="h-1 w-full bg-bg-0 rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-crimson transition-all"
              style={{
                width: `${
                  metrics.totalTasks > 0 ? (metrics.blockedCount / metrics.totalTasks) * 100 : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Card 4: Completed Deliverables */}
        <div className="steel-card p-4 rounded-sm border border-border bg-bg-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-steel">
              COMPLETED DELIVERABLES
            </span>
            <Award className="w-4 h-4 text-amber" />
          </div>
          <div className="text-2xl font-heading font-bold text-gold">
            {metrics.completedCount}
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-steel">
            <span>Portfolio Completion</span>
            <span className="text-gold font-bold">{metrics.averageProgress}% Avg</span>
          </div>
          <div className="h-1 w-full bg-bg-0 rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-gold transition-all"
              style={{ width: `${metrics.averageProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Control Bar: Projects, Status, Priority, Blocked/Overdue */}
      <div className="steel-card p-3 rounded-sm border border-border bg-bg-1 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Project selector */}
          <div className="flex items-center gap-2 bg-bg-2 border border-border px-3 py-1.5 rounded-sm">
            <Building2 className="w-3.5 h-3.5 text-amber" />
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setPage(0);
              }}
              className="bg-transparent text-xs font-mono text-foreground focus:outline-none"
            >
              <option value="" className="bg-bg-1 text-foreground">
                All Megaprojects ({projects.length})
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-bg-1 text-foreground">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Blocked & Overdue toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setBlockedOnly(!blockedOnly);
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-xs border text-xs font-mono uppercase transition flex items-center gap-1.5 ${
                blockedOnly
                  ? "bg-crimson/20 border-crimson text-crimson font-bold"
                  : "bg-bg-2 border-border text-steel hover:text-foreground hover:border-amber/50"
              }`}
            >
              <Lock className="w-3 h-3 text-crimson" />
              <span>BLOCKED ONLY ({metrics.blockedCount})</span>
            </button>

            <button
              onClick={() => {
                setOverdueOnly(!overdueOnly);
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-xs border text-xs font-mono uppercase transition flex items-center gap-1.5 ${
                overdueOnly
                  ? "bg-crimson/20 border-crimson text-crimson font-bold"
                  : "bg-bg-2 border-border text-steel hover:text-foreground hover:border-amber/50"
              }`}
            >
              <ShieldAlert className="w-3 h-3 text-crimson" />
              <span>OVERDUE ONLY ({metrics.overdueCount})</span>
            </button>
          </div>
        </div>

        {/* Status and Priority Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs font-mono">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "", label: "ALL STATUSES", count: metrics.totalTasks },
              { id: "TODO", label: "TO DO", count: metrics.todoCount },
              { id: "IN_PROGRESS", label: "IN PROGRESS", count: metrics.inProgressCount },
              { id: "REVIEW", label: "REVIEW", count: metrics.reviewCount },
              { id: "COMPLETED", label: "COMPLETED", count: metrics.completedCount },
            ].map((st) => (
              <button
                key={st.id || "all"}
                onClick={() => {
                  setStatusFilter(st.id);
                  setPage(0);
                }}
                className={`px-2.5 py-1 rounded-xs border uppercase text-[11px] transition flex items-center gap-1.5 ${
                  statusFilter === st.id
                    ? "bg-amber text-bg-0 border-amber font-bold"
                    : "bg-bg-2 text-steel border-border hover:border-amber/50 hover:text-foreground"
                }`}
              >
                <span>{st.label}</span>
                <span
                  className={`px-1 py-0.2 rounded-2xs text-[9px] font-bold ${
                    statusFilter === st.id ? "bg-bg-0 text-amber" : "bg-bg-0 text-steel"
                  }`}
                >
                  {st.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 border-l border-border pl-2">
            {[
              { id: "", label: "All Priority" },
              { id: "CRITICAL", label: "CRITICAL", color: "text-crimson" },
              { id: "HIGH", label: "HIGH", color: "text-amber" },
              { id: "MEDIUM", label: "MEDIUM", color: "text-gold" },
              { id: "LOW", label: "LOW", color: "text-steel" },
            ].map((pr) => (
              <button
                key={pr.id || "all-pr"}
                onClick={() => {
                  setPriorityFilter(pr.id);
                  setPage(0);
                }}
                className={`px-2 py-1 rounded-xs border uppercase text-[10px] transition ${
                  priorityFilter === pr.id
                    ? "bg-bg-2 text-foreground border-amber font-bold shadow-xs"
                    : "bg-bg-2 text-steel border-border hover:text-foreground"
                } ${pr.color || ""}`}
              >
                {pr.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <DataTable
        columns={columns}
        data={tasks}
        pageCount={Math.ceil(total / pageSize)}
        pageIndex={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setPage(0);
        }}
        onSearchChange={setSearch}
        searchValue={search}
        searchPlaceholder="Search work packages by deliverable title or project..."
        loading={loading}
        exportFileName="buildtrack-work-packages.csv"
      />

      {/* Task Forensic Dossier Modal */}
      {selectedTaskForDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-0/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="steel-card max-w-2xl w-full border border-border bg-bg-1 rounded-sm shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-steel uppercase">
                    WORK PACKAGE DOSSIER
                  </span>
                  <span className="text-[10px] font-mono text-amber">
                    #{selectedTaskForDossier.id}
                  </span>
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground mt-0.5">
                  {selectedTaskForDossier.title}
                </h3>
                <p className="text-xs font-mono text-steel uppercase mt-0.5">
                  PROJECT: {selectedTaskForDossier.project?.name || "General"}
                </p>
              </div>
              <button
                onClick={() => setSelectedTaskForDossier(null)}
                className="p-1 rounded-xs hover:bg-bg-2 text-steel hover:text-foreground transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Priority Badge Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-bg-2 p-3 rounded-sm border border-border text-xs font-mono">
              <div>
                <div className="text-[10px] text-steel uppercase">STATUS</div>
                <div className="mt-1">
                  <StatusBadge status={selectedTaskForDossier.status} />
                </div>
              </div>
              <div>
                <div className="text-[10px] text-steel uppercase">PRIORITY</div>
                <div className="mt-1 font-bold text-amber">
                  {selectedTaskForDossier.priority}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-steel uppercase">PROGRESS</div>
                <div className="mt-1 font-bold text-foreground">
                  {selectedTaskForDossier.progress}%
                </div>
              </div>
              <div>
                <div className="text-[10px] text-steel uppercase">DEADLINE</div>
                <div
                  className={`mt-1 font-bold ${
                    selectedTaskForDossier.isOverdue ? "text-crimson" : "text-foreground"
                  }`}
                >
                  {formatDate(selectedTaskForDossier.deadline)}
                </div>
              </div>
            </div>

            {/* Interactive Progress Slider & Rollup Update */}
            <div className="flex items-center justify-between p-3 bg-bg-2 rounded-sm border border-border">
              <div className="flex items-center gap-3 flex-1 mr-4">
                <label className="text-[10px] font-mono text-steel uppercase tracking-wider shrink-0">
                  UPDATE PROGRESS:
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editProgress}
                  onChange={(e) => setEditProgress(Number(e.target.value))}
                  className="w-full accent-amber"
                />
                <span className="text-xs font-mono font-bold text-amber w-10 text-right">
                  {editProgress}%
                </span>
              </div>
              <button
                type="button"
                onClick={handleSaveProgress}
                disabled={savingProgress}
                className="px-3 py-1.5 bg-amber hover:bg-amber-glow text-bg-0 text-xs font-mono font-bold uppercase rounded-xs transition shadow-xs"
              >
                {savingProgress ? "SAVING..." : "COMMIT %"}
              </button>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-steel uppercase tracking-wider">
                SCOPE / TECHNICAL SPECIFICATION
              </label>
              <div className="p-3 bg-bg-2 rounded-sm border border-border text-xs text-foreground font-mono leading-relaxed">
                {selectedTaskForDossier.description ||
                  "No detailed specification provided. Deliverable governed by baseline architectural drawing sets."}
              </div>
            </div>

            {/* Prerequisites & Blockers Chain */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-steel uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-amber" />
                  <span>PREREQUISITE DEPENDENCIES ({selectedTaskForDossier.dependencies?.length || 0})</span>
                </label>
                {selectedTaskForDossier.isBlocked && (
                  <span className="text-[10px] font-mono text-crimson font-bold uppercase flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-crimson" />
                    EXECUTION BLOCKED BY INCOMPLETE PREREQUISITE
                  </span>
                )}
              </div>

              {selectedTaskForDossier.dependencies && selectedTaskForDossier.dependencies.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedTaskForDossier.dependencies.map((dep: any, idx: number) => {
                    const isDone = dep.dependsOn?.status === "COMPLETED";
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 rounded-xs border text-xs font-mono ${
                          isDone
                            ? "bg-bg-2 border-border text-steel"
                            : "bg-crimson/10 border-crimson/50 text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-crimson shrink-0" />
                          )}
                          <span className={isDone ? "line-through text-steel" : "font-semibold"}>
                            {dep.dependsOn?.title}
                          </span>
                        </div>
                        <StatusBadge status={dep.dependsOn?.status} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-2.5 bg-bg-2 rounded-xs border border-border text-xs font-mono text-steel flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
                  <span>No prerequisites required. Work package ready for independent execution.</span>
                </div>
              )}
            </div>

            {/* Comments & Field Observations Section */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-steel uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-amber" />
                <span>TASK COMMENTS & SITE LOGS ({selectedTaskForDossier.comments?.length || 0})</span>
              </label>
              <div className="max-h-44 overflow-y-auto space-y-2 p-2.5 bg-bg-2 border border-border rounded-sm font-mono text-xs">
                {selectedTaskForDossier.comments && selectedTaskForDossier.comments.length > 0 ? (
                  selectedTaskForDossier.comments.map((c: any) => (
                    <div key={c.id} className="p-2 rounded-xs bg-bg-1 border border-border space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-foreground">{c.user?.name || "Field Engineer"}</span>
                          <span className="px-1 py-0.2 rounded-2xs bg-steel/15 text-steel border border-steel/30 text-[9px]">
                            {c.user?.role || "USER"}
                          </span>
                        </div>
                        <span className="text-steel">{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-foreground text-xs leading-relaxed">{c.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-steel text-center py-2 text-xs">No comments recorded yet. Add the first observation below.</div>
                )}
              </div>

              {/* New Comment Input */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Log engineering update or site comment..."
                  className="flex-1 bg-bg-2 border border-border px-3 py-1.5 rounded-xs text-xs font-mono text-foreground focus:outline-none focus:border-amber"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newCommentText.trim()}
                  className="px-3 py-1.5 bg-amber hover:bg-amber-glow text-bg-0 text-xs font-mono font-bold uppercase rounded-xs transition flex items-center gap-1 disabled:opacity-50"
                >
                  <Send className="w-3 h-3 text-bg-0" />
                  <span>{submittingComment ? "POSTING..." : "POST"}</span>
                </button>
              </form>
              {commentError && (
                <div className="text-crimson text-[10px] font-mono">{commentError}</div>
              )}
            </div>

            {/* Audit History Trail */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-steel uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-amber" />
                <span>IMMUTABLE AUDIT TRAIL</span>
              </label>
              <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-bg-2 border border-border rounded-sm font-mono text-[11px]">
                {selectedTaskForDossier.history && selectedTaskForDossier.history.length > 0 ? (
                  selectedTaskForDossier.history.map((h: any, idx: number) => (
                    <div key={idx} className="flex items-start justify-between border-b border-border/40 pb-1">
                      <div>
                        <span className="text-amber font-semibold">{h.action}</span>
                        {h.from && h.to && (
                          <span className="text-steel ml-1">
                            ({h.from} → {h.to})
                          </span>
                        )}
                        <div className="text-steel text-[10px]">{h.details}</div>
                      </div>
                      <div className="text-right text-[10px] text-steel">
                        <div>{h.user?.name || "System"}</div>
                        <div>{new Date(h.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-steel text-center py-2">Initial package created. No transitions recorded.</div>
                )}
              </div>
            </div>

            {/* Transition Controls */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-[10px] font-mono text-steel uppercase">
                ADVANCE MILESTONE STATUS
              </span>
              <div className="flex gap-2">
                {["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleQuickTransition(selectedTaskForDossier.id, st)}
                    disabled={selectedTaskForDossier.status === st}
                    className={`px-2.5 py-1 text-[10px] font-mono uppercase rounded-xs border transition ${
                      selectedTaskForDossier.status === st
                        ? "bg-amber text-bg-0 border-amber font-bold cursor-default"
                        : "bg-bg-2 border-border text-steel hover:text-foreground hover:border-amber"
                    }`}
                  >
                    {st.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Work Package Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-0/80 backdrop-blur-sm p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateTask}
            className="steel-card max-w-xl w-full border border-border bg-bg-1 rounded-sm shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  COMMISSION <span className="text-amber">WORK PACKAGE</span>
                </h3>
                <p className="text-xs font-mono text-steel uppercase mt-0.5">
                  INITIALIZE NEW CONTRACTUAL DELIVERABLE
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-xs hover:bg-bg-2 text-steel hover:text-foreground transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-crimson/15 border border-crimson rounded-xs text-xs font-mono text-crimson flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <div className="space-y-3 font-mono text-xs">
              {/* Project Selection */}
              <div className="space-y-1">
                <label className="text-[10px] text-steel uppercase">ASSIGNED MEGAPROJECT *</label>
                <select
                  value={newProjectId}
                  onChange={(e) => {
                    setNewProjectId(e.target.value);
                    setNewDependsOnIds([]);
                  }}
                  className="w-full bg-bg-2 border border-border px-3 py-2 rounded-xs text-foreground focus:outline-none focus:border-amber"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Title */}
              <div className="space-y-1">
                <label className="text-[10px] text-steel uppercase">DELIVERABLE TITLE *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Substructure Piling Inspection Phase 3"
                  className="w-full bg-bg-2 border border-border px-3 py-2 rounded-xs text-foreground focus:outline-none focus:border-amber"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] text-steel uppercase">TECHNICAL SCOPE / NOTES</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Specify contractual engineering requirements, testing standards, and compliance gates..."
                  className="w-full bg-bg-2 border border-border px-3 py-2 rounded-xs text-foreground focus:outline-none focus:border-amber"
                />
              </div>

              {/* Prerequisite Dependencies Selector */}
              <div className="space-y-1">
                <label className="text-[10px] text-steel uppercase">PREREQUISITE DEPENDENCIES (OPTIONAL)</label>
                {availableProjectTasks.length > 0 ? (
                  <div className="max-h-28 overflow-y-auto p-2 bg-bg-2 border border-border rounded-xs space-y-1 font-mono text-xs">
                    {availableProjectTasks.map((t) => (
                      <label key={t.id} className="flex items-center gap-2 cursor-pointer hover:bg-bg-1 p-1 rounded-2xs">
                        <input
                          type="checkbox"
                          checked={newDependsOnIds.includes(t.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewDependsOnIds([...newDependsOnIds, t.id]);
                            } else {
                              setNewDependsOnIds(newDependsOnIds.filter((id) => id !== t.id));
                            }
                          }}
                          className="accent-amber"
                        />
                        <span className="text-foreground truncate">{t.title}</span>
                        <span className="text-steel text-[10px] ml-auto">({t.status})</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="p-2 bg-bg-2 border border-border rounded-xs text-[10px] text-steel">
                    No other work packages in selected project to depend on.
                  </div>
                )}
              </div>

              {/* Priority, Assignee, Hours, Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-steel uppercase">PRIORITY RATING</label>
                  <select
                    value={newPriority}
                    onChange={(e: any) => setNewPriority(e.target.value)}
                    className="w-full bg-bg-2 border border-border px-3 py-2 rounded-xs text-foreground focus:outline-none focus:border-amber"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-steel uppercase">ASSIGNED ENGINEER</label>
                  <select
                    value={newAssigneeId}
                    onChange={(e) => setNewAssigneeId(e.target.value)}
                    className="w-full bg-bg-2 border border-border px-3 py-2 rounded-xs text-foreground focus:outline-none focus:border-amber"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-steel uppercase">ESTIMATED EFFORT (HOURS)</label>
                  <input
                    type="number"
                    min="1"
                    value={newEstimatedHours}
                    onChange={(e) => setNewEstimatedHours(Number(e.target.value))}
                    className="w-full bg-bg-2 border border-border px-3 py-2 rounded-xs text-foreground focus:outline-none focus:border-amber"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-steel uppercase">TARGET DEADLINE *</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full bg-bg-2 border border-border px-3 py-2 rounded-xs text-foreground focus:outline-none focus:border-amber"
                    required
                  />
                </div>
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
                {createSubmitting ? "COMMISSIONING..." : "COMMISSION WORK PACKAGE"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

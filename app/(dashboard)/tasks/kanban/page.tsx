"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import {
  Trello,
  List,
  Filter,
  Building2,
  Plus,
  Lock,
  ShieldAlert,
  Clock,
  Award,
  CheckSquare,
  Search,
  X,
  AlertCircle,
} from "@/components/ui/icons";

export default function KanbanPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // New task modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newProjectId, setNewProjectId] = useState("");
  const [newAssigneeId, setNewAssigneeId] = useState("");
  const [newPriority, setNewPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [newStatus, setNewStatus] = useState<"TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED">("TODO");
  const [newEstimatedHours, setNewEstimatedHours] = useState(16);
  const [newDeadline, setNewDeadline] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );
  const [newDependsOnIds, setNewDependsOnIds] = useState<string[]>([]);
  const [availableProjectTasks, setAvailableProjectTasks] = useState<any[]>([]);

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

  const loadData = async () => {
    try {
      const [projRes, tasksRes, usersRes] = await Promise.all([
        fetch("/api/v1/projects?pageSize=50"),
        fetch(
          selectedProjectId
            ? `/api/v1/tasks?projectId=${selectedProjectId}&pageSize=200`
            : "/api/v1/tasks?pageSize=500"
        ),
        fetch("/api/v1/users?pageSize=50"),
      ]);
      if (projRes.ok) {
        const p = await projRes.json();
        setProjects(p.projects || []);
        if (p.projects?.length > 0 && !newProjectId) {
          setNewProjectId(p.projects[0].id);
        }
      }
      if (tasksRes.ok) {
        const t = await tasksRes.json();
        setTasks(t.tasks || []);
      }
      if (usersRes.ok) {
        const u = await usersRes.json();
        setUsers(u.users || []);
      }
    } catch (e) {
      console.error("Failed to load Kanban data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProjectId]);

  const openCreateModal = (initialStatus: "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" = "TODO") => {
    setNewStatus(initialStatus);
    setCreateError(null);
    if (selectedProjectId) {
      setNewProjectId(selectedProjectId);
    } else if (projects.length > 0 && !newProjectId) {
      setNewProjectId(projects[0].id);
    }
    setIsCreateModalOpen(true);
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
          status: newStatus,
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
        loadData();
      } else {
        const err = await res.json();
        setCreateError(err?.error?.message || "Failed to commission deliverable.");
      }
    } catch (err: any) {
      setCreateError(err.message || "Network error submitting deliverable.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Filter tasks client-side for ultra-fast responsiveness
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.project?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assignee?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = !priorityFilter || t.priority === priorityFilter;
    const matchesBlocked = !blockedOnly || t.isBlocked;
    const matchesOverdue = !overdueOnly || t.isOverdue;

    return matchesSearch && matchesPriority && matchesBlocked && matchesOverdue;
  });

  // Calculate live Kanban telemetry
  const totalCount = filteredTasks.length;
  const inExecutionCount = filteredTasks.filter(
    (t) => t.status === "IN_PROGRESS" || t.status === "REVIEW"
  ).length;
  const blockedCount = filteredTasks.filter((t) => t.isBlocked).length;
  const completedCount = filteredTasks.filter((t) => t.status === "COMPLETED").length;
  const completionPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-heading text-2xl font-bold uppercase tracking-wider text-foreground">
            INTERACTIVE KANBAN <span className="text-amber">TASK BOARD</span>
          </h1>
          <p className="text-xs font-mono text-steel uppercase tracking-widest mt-1">
            DRAG CARDS ACROSS MILESTONE LANES WITH PREREQUISITE VALIDATION & ROLLUP
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Selector */}
          <div className="flex items-center gap-2 bg-bg-2 border border-border px-3 py-2 rounded-sm">
            <Building2 className="w-3.5 h-3.5 text-amber" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
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

          <button
            type="button"
            onClick={() => openCreateModal("TODO")}
            className="px-3.5 py-2 bg-amber hover:bg-amber-glow text-bg-0 text-xs font-mono uppercase tracking-wider rounded-sm font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-bg-0" />
            <span>+ NEW TASK</span>
          </button>

          <Link
            href="/tasks"
            className="px-3.5 py-2 bg-bg-2 border border-border hover:border-amber text-foreground hover:text-amber text-xs font-mono uppercase tracking-wider rounded-sm transition flex items-center gap-1.5"
          >
            <List className="w-3.5 h-3.5 text-amber" />
            <span>LIST VIEW</span>
          </Link>
        </div>
      </div>

      {/* Telemetry Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="steel-card p-3 rounded-sm border border-border bg-bg-1 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-steel">
            <span>BOARD PACKAGES</span>
            <CheckSquare className="w-3.5 h-3.5 text-amber" />
          </div>
          <div className="text-xl font-heading font-bold text-foreground">
            {totalCount}
          </div>
          <div className="text-[10px] font-mono text-steel">
            Across 4 Milestone Lanes
          </div>
        </div>

        <div className="steel-card p-3 rounded-sm border border-border bg-bg-1 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-steel">
            <span>IN EXECUTION</span>
            <Clock className="w-3.5 h-3.5 text-gold" />
          </div>
          <div className="text-xl font-heading font-bold text-foreground">
            {inExecutionCount}
          </div>
          <div className="text-[10px] font-mono text-gold">
            {totalCount > 0 ? Math.round((inExecutionCount / totalCount) * 100) : 0}% Active Load
          </div>
        </div>

        <div className="steel-card p-3 rounded-sm border border-border bg-bg-1 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-steel">
            <span>PREREQ BLOCKED</span>
            <Lock className="w-3.5 h-3.5 text-crimson" />
          </div>
          <div className="text-xl font-heading font-bold text-crimson flex items-center gap-1.5">
            <span>{blockedCount}</span>
            {blockedCount > 0 && (
              <span className="text-[9px] font-mono px-1 py-0.2 rounded-xs bg-crimson/20 border border-crimson">
                LOCKED
              </span>
            )}
          </div>
          <div className="text-[10px] font-mono text-steel">
            Requires Preceding Sign-off
          </div>
        </div>

        <div className="steel-card p-3 rounded-sm border border-border bg-bg-1 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-steel">
            <span>CERTIFIED DELIVERED</span>
            <Award className="w-3.5 h-3.5 text-amber" />
          </div>
          <div className="text-xl font-heading font-bold text-gold">
            {completedCount}
          </div>
          <div className="text-[10px] font-mono text-gold font-bold">
            {completionPercent}% Milestone Progress
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="steel-card p-3 rounded-sm border border-border bg-bg-1 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm bg-bg-2 border border-border px-3 py-1.5 rounded-sm">
          <Search className="w-3.5 h-3.5 text-steel" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deliverables, projects, engineers..."
            className="w-full bg-transparent text-xs text-foreground placeholder:text-steel/60 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-steel hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Priority Filters */}
          <div className="flex items-center gap-1 border-r border-border pr-2">
            {[
              { id: "", label: "ALL" },
              { id: "CRITICAL", label: "CRITICAL", color: "text-crimson" },
              { id: "HIGH", label: "HIGH", color: "text-amber" },
              { id: "MEDIUM", label: "MEDIUM", color: "text-gold" },
              { id: "LOW", label: "LOW", color: "text-steel" },
            ].map((p) => (
              <button
                key={p.id || "all-p"}
                onClick={() => setPriorityFilter(p.id)}
                className={`px-2 py-1 rounded-xs border text-[10px] uppercase transition ${
                  priorityFilter === p.id
                    ? "bg-bg-2 text-foreground border-amber font-bold shadow-xs"
                    : "bg-bg-2 text-steel border-border hover:text-foreground"
                } ${p.color || ""}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Blocked and Overdue Toggles */}
          <button
            onClick={() => setBlockedOnly(!blockedOnly)}
            className={`px-2.5 py-1 rounded-xs border text-[11px] uppercase transition flex items-center gap-1 ${
              blockedOnly
                ? "bg-crimson/20 border-crimson text-crimson font-bold"
                : "bg-bg-2 border-border text-steel hover:text-foreground"
            }`}
          >
            <Lock className="w-2.5 h-2.5 text-crimson" />
            <span>BLOCKED ({blockedCount})</span>
          </button>

          <button
            onClick={() => setOverdueOnly(!overdueOnly)}
            className={`px-2.5 py-1 rounded-xs border text-[11px] uppercase transition flex items-center gap-1 ${
              overdueOnly
                ? "bg-crimson/20 border-crimson text-crimson font-bold"
                : "bg-bg-2 border-border text-steel hover:text-foreground"
            }`}
          >
            <ShieldAlert className="w-2.5 h-2.5 text-crimson" />
            <span>OVERDUE</span>
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 h-[750px] bg-bg-1 border border-border rounded-sm animate-pulse" />
          ))}
        </div>
      ) : (
        <KanbanBoard
          initialTasks={filteredTasks}
          onRefresh={loadData}
          onAddTask={(colStatus) =>
            openCreateModal(colStatus as "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED")
          }
        />
      )}

      {/* Commission Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-0/80 backdrop-blur-sm p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateTask}
            className="steel-card max-w-xl w-full border border-border bg-bg-1 rounded-sm shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  COMMISSION <span className="text-amber">KANBAN TASK</span>
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
              <div className="space-y-1">
                <label className="text-[10px] text-steel uppercase">ASSIGNED MEGAPROJECT *</label>
                <select
                  value={newProjectId}
                  onChange={(e) => setNewProjectId(e.target.value)}
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

              <div className="space-y-1">
                <label className="text-[10px] text-steel uppercase">TARGET KANBAN LANE</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full bg-bg-2 border border-border px-3 py-2 rounded-xs text-foreground focus:outline-none focus:border-amber"
                >
                  <option value="TODO">TO DO (0%)</option>
                  <option value="IN_PROGRESS">IN PROGRESS (25%)</option>
                  <option value="REVIEW">QUALITY REVIEW (80%)</option>
                  <option value="COMPLETED">COMPLETED (100%)</option>
                </select>
              </div>

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
                    No other deliverables in selected project to depend on.
                  </div>
                )}
              </div>

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
                {createSubmitting ? "COMMISSIONING..." : "COMMISSION TASK"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

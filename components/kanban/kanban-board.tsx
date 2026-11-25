"use client";

import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Clock,
  User,
  AlertCircle,
  Lock,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  FileText,
  X,
  CheckCircle2,
  Building2,
  MessageSquare,
  Send,
  History,
  Plus,
} from "@/components/ui/icons";
import { cn, formatDate } from "@/lib/utils";

export interface KanbanTask {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  deadline: string | Date;
  progress: number;
  isOverdue?: boolean;
  isBlocked?: boolean;
  blockedByCount?: number;
  blockedBy?: { id: string; title: string; status: string }[];
  assignee?: { id: string; name: string; role?: string } | null;
  project?: { id: string; name: string } | null;
  dependencies?: any[];
  history?: any[];
  comments?: any[];
}

const COLUMNS: {
  id: string;
  label: string;
  borderClass: string;
  badgeClass: string;
}[] = [
  {
    id: "TODO",
    label: "TO DO",
    borderClass: "border-t-steel",
    badgeClass: "bg-steel/15 text-steel border-steel/30",
  },
  {
    id: "IN_PROGRESS",
    label: "IN PROGRESS",
    borderClass: "border-t-amber",
    badgeClass: "bg-amber/15 text-amber border-amber/30",
  },
  {
    id: "REVIEW",
    label: "QUALITY REVIEW",
    borderClass: "border-t-gold",
    badgeClass: "bg-gold/15 text-gold border-gold/30",
  },
  {
    id: "COMPLETED",
    label: "COMPLETED",
    borderClass: "border-t-gold",
    badgeClass: "bg-gold/20 text-gold border-gold/40 font-bold",
  },
];

function TaskCard({
  task,
  isOverlay = false,
  onInspect,
  onQuickAdvance,
}: {
  task: KanbanTask;
  isOverlay?: boolean;
  onInspect?: () => void;
  onQuickAdvance?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { task },
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const nextStatus =
    task.status === "TODO"
      ? "IN_PROGRESS"
      : task.status === "IN_PROGRESS"
      ? "REVIEW"
      : task.status === "REVIEW"
      ? "COMPLETED"
      : null;

  const priorityColor =
    task.priority === "CRITICAL"
      ? "text-crimson font-bold border-crimson/40 bg-crimson/10"
      : task.priority === "HIGH"
      ? "text-amber font-semibold border-amber/40 bg-amber/10"
      : task.priority === "MEDIUM"
      ? "text-gold border-gold/40 bg-gold/10"
      : "text-steel border-border bg-bg-2";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "steel-card p-3.5 rounded-sm space-y-2.5 cursor-grab active:cursor-grabbing select-none transition-all border border-border bg-bg-1 hover:border-amber/60 shadow-sm",
        isDragging && "opacity-25 border-amber shadow-none",
        isOverlay &&
          "rotate-1 scale-105 shadow-[0_12px_30px_rgba(217,119,6,0.25)] border-amber bg-bg-2 z-50 pointer-events-none",
        task.isBlocked && "border-crimson/40 bg-bg-1",
        task.isOverdue && "border-t-2 border-t-crimson"
      )}
    >
      {/* Card Header: Project tag + Blocked/Overdue chips */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-mono text-steel uppercase truncate max-w-[150px]">
          {task.project?.name || "PROJECT WORK"}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {task.isBlocked && (
            <span
              className="px-1.5 py-0.5 rounded-xs bg-crimson/20 border border-crimson/60 text-gold text-[9px] font-mono flex items-center gap-1"
              title="Blocked by incomplete prerequisites"
            >
              <Lock className="w-2.5 h-2.5 text-crimson" />
              <span>BLOCKED</span>
            </span>
          )}
          {task.isOverdue && (
            <span
              className="px-1.5 py-0.5 rounded-xs bg-crimson/20 border border-crimson text-crimson text-[9px] font-mono flex items-center gap-1"
              title="Target deadline exceeded"
            >
              <ShieldAlert className="w-2.5 h-2.5 text-crimson" />
              <span>OVERDUE</span>
            </span>
          )}
        </div>
      </div>

      {/* Task Title & Priority */}
      <div className="space-y-1.5">
        <div
          onClick={(e) => {
            e.stopPropagation();
            onInspect?.();
          }}
          className="font-semibold text-xs text-foreground hover:text-amber cursor-pointer leading-snug line-clamp-2 transition"
        >
          {task.title}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`px-1.5 py-0.2 rounded-2xs border text-[9px] font-mono uppercase ${priorityColor}`}>
            {task.priority}
          </span>
          <span className="text-[10px] font-mono text-steel">
            #{task.id.slice(-6)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-steel">
          <span>Execution</span>
          <span className={task.progress === 100 ? "text-gold font-bold" : "text-amber font-semibold"}>
            {task.progress}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-bg-0 rounded-full overflow-hidden border border-border">
          <div
            className={`h-full transition-all duration-300 ${
              task.progress === 100 ? "bg-gold" : task.progress > 50 ? "bg-amber" : "bg-steel"
            }`}
            style={{ width: `${task.progress}%` }}
          />
        </div>
      </div>

      {/* Footer Info: Target Date + Assignee */}
      <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[10px] font-mono text-steel">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-steel" />
          <span className={task.isOverdue ? "text-crimson font-bold" : ""}>
            {formatDate(task.deadline)}
          </span>
        </div>
        {task.assignee ? (
          <div className="flex items-center gap-1 text-foreground max-w-[110px] truncate">
            <User className="w-3 h-3 text-amber" />
            <span className="truncate">{task.assignee.name}</span>
          </div>
        ) : (
          <span className="text-steel italic">Unassigned</span>
        )}
      </div>

      {/* Card Quick Action Bar */}
      <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[10px] font-mono">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onInspect?.();
          }}
          className="text-steel hover:text-amber flex items-center gap-1 transition"
        >
          <FileText className="w-3 h-3" />
          <span>Dossier</span>
        </button>

        {nextStatus && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdvance?.();
            }}
            className="px-2 py-0.5 rounded-xs bg-bg-2 border border-border hover:border-amber text-amber text-[9px] uppercase tracking-wider flex items-center gap-1 transition"
          >
            <span>{nextStatus.replace("_", " ")}</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({
  column,
  tasks,
  totalBoardTasks,
  onInspectTask,
  onQuickAdvanceTask,
  onAddTask,
}: {
  column: (typeof COLUMNS)[number];
  tasks: KanbanTask[];
  totalBoardTasks: number;
  onInspectTask?: (task: KanbanTask) => void;
  onQuickAdvanceTask?: (taskId: string, targetStatus: string) => void;
  onAddTask?: (columnStatus: string) => void;
}) {
  const percentage =
    totalBoardTasks > 0 ? Math.round((tasks.length / totalBoardTasks) * 100) : 0;

  return (
    <div
      className={cn(
        "flex flex-col flex-1 min-w-[280px] max-w-sm bg-bg-1/70 border border-border rounded-sm overflow-hidden h-[780px] shadow-sm",
        column.borderClass,
        "border-t-3"
      )}
    >
      {/* Column Header */}
      <div className="px-4 py-3 bg-bg-0 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
            {column.label}
          </span>
          <span
            className={cn(
              "px-1.5 py-0.2 rounded-xs text-[10px] font-mono border",
              column.badgeClass
            )}
          >
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-steel">{percentage}%</span>
          {onAddTask && (
            <button
              type="button"
              onClick={() => onAddTask(column.id)}
              title={`Add task to ${column.label}`}
              className="px-1.5 py-0.5 rounded-xs bg-bg-1 border border-border hover:border-amber text-[10px] font-mono text-amber flex items-center gap-0.5 transition cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>ADD</span>
            </button>
          )}
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => {
            const nextStatus =
              task.status === "TODO"
                ? "IN_PROGRESS"
                : task.status === "IN_PROGRESS"
                ? "REVIEW"
                : task.status === "REVIEW"
                ? "COMPLETED"
                : null;

            return (
              <TaskCard
                key={task.id}
                task={task}
                onInspect={() => onInspectTask?.(task)}
                onQuickAdvance={() =>
                  nextStatus && onQuickAdvanceTask?.(task.id, nextStatus)
                }
              />
            );
          })}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="h-32 border border-dashed border-border rounded-sm flex flex-col items-center justify-center text-center p-4 text-xs font-mono text-steel space-y-1">
            <span>No tasks in this lane</span>
            <span className="text-[10px] text-steel/60">
              Drop deliverables here to update milestone status
            </span>
          </div>
        )}
        {onAddTask && (
          <button
            type="button"
            onClick={() => onAddTask(column.id)}
            className="w-full py-2 border border-dashed border-border hover:border-amber rounded-xs text-[11px] font-mono uppercase text-steel hover:text-amber flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD TO {column.label}</span>
          </button>
        )}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  initialTasks: KanbanTask[];
  onTaskClick?: (taskId: string) => void;
  onRefresh?: () => void;
  onAddTask?: (columnStatus: string) => void;
}

export function KanbanBoard({ initialTasks, onTaskClick, onRefresh, onAddTask }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [alertError, setAlertError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [dossierTask, setDossierTask] = useState<KanbanTask | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [editProgress, setEditProgress] = useState(0);
  const [savingProgress, setSavingProgress] = useState(false);

  // Sync state if initialTasks prop updates
  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleQuickAdvance = async (taskId: string, targetStatus: string) => {
    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask) return;

    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: targetStatus,
              progress: targetStatus === "COMPLETED" ? 100 : t.progress,
            }
          : t
      )
    );
    setAlertError(null);

    try {
      const res = await fetch(`/api/v1/tasks/${taskId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          notes: `Quick transition to ${targetStatus}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTasks(previousTasks);
        setAlertError(
          data?.error?.message || "Task transition rejected by business validation."
        );
      } else {
        setSuccessNotice(`Deliverable advanced to ${targetStatus.replace("_", " ")}`);
        setTimeout(() => setSuccessNotice(null), 3000);
        onRefresh?.();
      }
    } catch (err: any) {
      setTasks(previousTasks);
      setAlertError("Network error advancing deliverable. State rolled back.");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const currentTask = tasks.find((t) => t.id === activeId);
    if (!currentTask) return;

    // Determine target status: either the column id, or the status of the hovered task
    let targetStatus = over.id as string;
    const overTask = tasks.find((t) => t.id === over.id);
    if (overTask) {
      targetStatus = overTask.status;
    }

    if (currentTask.status === targetStatus) return;

    // Snapshot for optimistic rollback
    const previousTasks = [...tasks];

    // Optimistic Update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === activeId
          ? {
              ...t,
              status: targetStatus,
              progress: targetStatus === "COMPLETED" ? 100 : t.progress,
            }
          : t
      )
    );
    setAlertError(null);

    try {
      const res = await fetch(`/api/v1/tasks/${activeId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          notes: `Transitioned via Kanban Drag-and-Drop`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Rollback optimistic update
        setTasks(previousTasks);
        setAlertError(
          data?.error?.message ||
            "Task transition rejected: Incomplete prerequisite deliverables must be certified first."
        );
      } else {
        setSuccessNotice(
          `Moved '${currentTask.title.slice(0, 30)}...' to ${targetStatus.replace("_", " ")}`
        );
        setTimeout(() => setSuccessNotice(null), 3000);
        onRefresh?.();
      }
    } catch (err: any) {
      setTasks(previousTasks);
      setAlertError("Network error during task transition. State rolled back.");
    }
  };

  const handleInspectTask = async (task: KanbanTask) => {
    setNewCommentText("");
    setCommentError(null);
    setEditProgress(task.progress || 0);
    try {
      const res = await fetch(`/api/v1/tasks/${task.id}`);
      if (res.ok) {
        const data = await res.json();
        setDossierTask(data.task);
        setEditProgress(data.task.progress || 0);
      } else {
        setDossierTask(task);
      }
    } catch (e) {
      setDossierTask(task);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dossierTask || !newCommentText.trim()) return;
    setSubmittingComment(true);
    setCommentError(null);
    try {
      const res = await fetch(`/api/v1/tasks/${dossierTask.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newCommentText.trim() }),
      });
      if (res.ok) {
        setNewCommentText("");
        const detailRes = await fetch(`/api/v1/tasks/${dossierTask.id}`);
        if (detailRes.ok) {
          const d = await detailRes.json();
          setDossierTask(d.task);
        }
        onRefresh?.();
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
    if (!dossierTask) return;
    setSavingProgress(true);
    try {
      const res = await fetch(`/api/v1/tasks/${dossierTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: Number(editProgress) }),
      });
      if (res.ok) {
        const detailRes = await fetch(`/api/v1/tasks/${dossierTask.id}`);
        if (detailRes.ok) {
          const d = await detailRes.json();
          setDossierTask(d.task);
        }
        setTasks((prev) =>
          prev.map((t) => (t.id === dossierTask.id ? { ...t, progress: Number(editProgress) } : t))
        );
        onRefresh?.();
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

  return (
    <div className="space-y-4 w-full">
      {/* Alert Error Banner */}
      {alertError && (
        <div className="p-3.5 rounded-sm bg-crimson/15 border border-crimson flex items-center justify-between text-xs text-crimson font-mono animate-in fade-in shadow-md">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-crimson" />
            <span className="font-semibold uppercase tracking-wider">{alertError}</span>
          </div>
          <button
            onClick={() => setAlertError(null)}
            className="text-crimson hover:underline uppercase text-[10px] font-bold"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Success Notice Banner */}
      {successNotice && (
        <div className="p-3 rounded-sm bg-gold/15 border border-gold/40 flex items-center justify-between text-xs text-gold font-mono animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button
            onClick={() => setSuccessNotice(null)}
            className="text-gold hover:underline uppercase text-[10px]"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Kanban DnD Canvas */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={colTasks}
                totalBoardTasks={tasks.length}
                onInspectTask={handleInspectTask}
                onQuickAdvanceTask={handleQuickAdvance}
                onAddTask={onAddTask}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {/* Task Dossier Inspector Modal */}
      {dossierTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-0/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="steel-card max-w-2xl w-full border border-border bg-bg-1 rounded-sm shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-steel uppercase">
                    KANBAN WORK PACKAGE DOSSIER
                  </span>
                  <span className="text-[10px] font-mono text-amber">
                    #{dossierTask.id}
                  </span>
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground mt-0.5">
                  {dossierTask.title}
                </h3>
                <p className="text-xs font-mono text-steel uppercase mt-0.5">
                  PROJECT: {dossierTask.project?.name || "General"}
                </p>
              </div>
              <button
                onClick={() => setDossierTask(null)}
                className="p-1 rounded-xs hover:bg-bg-2 text-steel hover:text-foreground transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Badges Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-bg-2 p-3 rounded-sm border border-border text-xs font-mono">
              <div>
                <div className="text-[10px] text-steel uppercase">CURRENT STATUS</div>
                <div className="mt-1">
                  <StatusBadge status={dossierTask.status} />
                </div>
              </div>
              <div>
                <div className="text-[10px] text-steel uppercase">PRIORITY</div>
                <div className="mt-1 font-bold text-amber">
                  {dossierTask.priority}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-steel uppercase">COMPLETION</div>
                <div className="mt-1 font-bold text-foreground">
                  {dossierTask.progress}%
                </div>
              </div>
              <div>
                <div className="text-[10px] text-steel uppercase">TARGET DATE</div>
                <div
                  className={`mt-1 font-bold ${
                    dossierTask.isOverdue ? "text-crimson" : "text-foreground"
                  }`}
                >
                  {formatDate(dossierTask.deadline)}
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
                {dossierTask.description ||
                  "No detailed specification attached. Governed by structural project master schedule."}
              </div>
            </div>

            {/* Prerequisites / Blockers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-steel uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-amber" />
                  <span>PREREQUISITE DEPENDENCIES ({dossierTask.dependencies?.length || 0})</span>
                </label>
                {dossierTask.isBlocked && (
                  <span className="text-[10px] font-mono text-crimson font-bold uppercase flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-crimson" />
                    BLOCKED BY UNRESOLVED PREREQUISITES
                  </span>
                )}
              </div>

              {dossierTask.dependencies && dossierTask.dependencies.length > 0 ? (
                <div className="space-y-1.5">
                  {dossierTask.dependencies.map((dep: any, idx: number) => {
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
                  <span>No prerequisites required. Work package ready for execution.</span>
                </div>
              )}
            </div>

            {/* Task Comments & Field Observations Section */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-steel uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-amber" />
                <span>TASK COMMENTS & SITE LOGS ({dossierTask.comments?.length || 0})</span>
              </label>
              <div className="max-h-44 overflow-y-auto space-y-2 p-2.5 bg-bg-2 border border-border rounded-sm font-mono text-xs">
                {dossierTask.comments && dossierTask.comments.length > 0 ? (
                  dossierTask.comments.map((c: any) => (
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
                {dossierTask.history && dossierTask.history.length > 0 ? (
                  dossierTask.history.map((h: any, idx: number) => (
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
                  <div className="text-steel text-center py-2">
                    Package initialized. No status transitions recorded.
                  </div>
                )}
              </div>
            </div>

            {/* Advance Milestone Controls */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-[10px] font-mono text-steel uppercase">
                ADVANCE MILESTONE STATUS
              </span>
              <div className="flex gap-2">
                {["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      handleQuickAdvance(dossierTask.id, st);
                      setDossierTask(null);
                    }}
                    disabled={dossierTask.status === st}
                    className={`px-2.5 py-1 text-[10px] font-mono uppercase rounded-xs border transition ${
                      dossierTask.status === st
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
    </div>
  );
}

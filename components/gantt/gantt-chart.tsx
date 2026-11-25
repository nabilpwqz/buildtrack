"use client";

import React, { useState, useMemo } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  AlertCircle,
  Calendar,
  Eye,
  ZoomIn,
  ZoomOut,
  Clock,
  ShieldCheck,
  CheckCircle2,
  X,
  Layers,
  ArrowRight,
} from "@/components/ui/icons";
import { Modal } from "@/components/ui/modal";
import { cn, formatDate } from "@/lib/utils";

export interface GanttTask {
  id: string;
  title: string;
  startDate?: string | Date;
  deadline: string | Date;
  status: string;
  priority: string;
  progress: number;
  dependencies?: { dependsOnId: string }[];
}

interface GanttChartProps {
  tasks: GanttTask[];
  projectStartDate?: string | Date;
  projectEndDate?: string | Date;
  onTaskClick?: (taskId: string) => void;
}

export function GanttChart({
  tasks,
  projectStartDate,
  projectEndDate,
  onTaskClick,
}: GanttChartProps) {
  const [zoom, setZoom] = useState<"days" | "weeks">("days");
  const [highlightCriticalOnly, setHighlightCriticalOnly] = useState(false);
  const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);

  // Compute timeline bounds
  const { minDate, totalDays, dayWidth } = useMemo(() => {
    let min = projectStartDate ? new Date(projectStartDate).getTime() : Date.now();
    let max = projectEndDate ? new Date(projectEndDate).getTime() : Date.now();

    tasks.forEach((t) => {
      const d = new Date(t.deadline).getTime();
      if (d > max) max = d;
      const s = t.startDate ? new Date(t.startDate).getTime() : d - 14 * 86400000;
      if (s < min) min = s;
    });

    // Add padding
    min = min - 3 * 86400000;
    max = max + 7 * 86400000;

    const days = Math.max(20, Math.ceil((max - min) / 86400000));
    const width = zoom === "days" ? 36 : 14;

    return { minDate: new Date(min), totalDays: days, dayWidth: width };
  }, [tasks, projectStartDate, projectEndDate, zoom]);

  // Layout parameters
  const rowHeight = 44;
  const headerHeight = 50;
  const taskListWidth = 280;
  const timelineWidth = totalDays * dayWidth;

  // Compute task coordinates and dependency arrows
  const taskMap = useMemo(() => {
    const map = new Map<string, { x: number; width: number; y: number }>();
    tasks.forEach((task, idx) => {
      const deadline = new Date(task.deadline);
      const start = task.startDate
        ? new Date(task.startDate)
        : new Date(deadline.getTime() - 10 * 86400000);

      const startOffset = Math.max(0, Math.floor((start.getTime() - minDate.getTime()) / 86400000));
      const durationDays = Math.max(2, Math.ceil((deadline.getTime() - start.getTime()) / 86400000));

      const x = startOffset * dayWidth;
      const width = durationDays * dayWidth;
      const y = headerHeight + idx * rowHeight + 10;

      map.set(task.id, { x, width, y });
    });
    return map;
  }, [tasks, minDate, dayWidth]);

  const handleBarClick = (task: GanttTask) => {
    setSelectedTask(task);
    if (onTaskClick) onTaskClick(task.id);
  };

  return (
    <div className="bg-bg-1 border border-border shadow-plate rounded-sm overflow-hidden flex flex-col w-full transition-colors duration-200">
      {/* Top Toolbar */}
      <div className="px-4 py-3 bg-bg-0 border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber" />
          <span className="font-bold text-foreground uppercase tracking-wider">
            PROJECT EXECUTION TIMELINE & CPM GANTT
          </span>
          <span className="text-steel">({tasks.length} Tracked Tasks)</span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-steel hover:text-amber transition">
            <input
              type="checkbox"
              checked={highlightCriticalOnly}
              onChange={(e) => setHighlightCriticalOnly(e.target.checked)}
              className="accent-amber rounded w-3.5 h-3.5 cursor-pointer"
            />
            <span className="font-bold">Highlight Critical Path</span>
          </label>

          <div className="flex items-center border border-border rounded-xs bg-bg-1 p-0.5">
            <button
              onClick={() => setZoom("days")}
              className={cn(
                "px-2.5 py-1 text-[11px] font-mono uppercase rounded-xs transition cursor-pointer",
                zoom === "days" ? "bg-amber text-bg-0 font-bold shadow-amber" : "text-steel hover:text-foreground"
              )}
            >
              Days
            </button>
            <button
              onClick={() => setZoom("weeks")}
              className={cn(
                "px-2.5 py-1 text-[11px] font-mono uppercase rounded-xs transition cursor-pointer",
                zoom === "weeks" ? "bg-amber text-bg-0 font-bold shadow-amber" : "text-steel hover:text-foreground"
              )}
            >
              Weeks
            </button>
          </div>
        </div>
      </div>

      {/* Gantt Scroll Container */}
      <div className="overflow-x-auto overflow-y-auto max-h-[620px] relative flex bg-bg-0">
        {/* Left Sticky Task Names Pane */}
        <div
          className="shrink-0 bg-bg-1 border-r border-border sticky left-0 z-20 shadow-md"
          style={{ width: taskListWidth }}
        >
          <div className="h-[50px] border-b border-border px-4 flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-steel bg-bg-0">
            <span>TASK / WORK BREAKDOWN</span>
            <span>STATUS</span>
          </div>
          <div>
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleBarClick(task)}
                className="h-[44px] px-4 flex items-center justify-between border-b border-border/60 hover:bg-bg-2 cursor-pointer transition text-xs font-mono group"
              >
                <div className="min-w-0 pr-2">
                  <span className="truncate text-foreground group-hover:text-amber font-medium block">
                    {task.title}
                  </span>
                  <span className="text-[10px] text-steel">
                    {task.priority === "CRITICAL" ? (
                      <span className="text-crimson font-bold">CRITICAL &middot; </span>
                    ) : null}
                    {task.progress}% complete
                  </span>
                </div>
                <StatusBadge status={task.status} icon={false} className="text-[9px] px-1.5 py-0 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Interactive SVG Timeline Canvas */}
        <div className="shrink-0 relative bg-bg-0">
          <svg
            width={timelineWidth}
            height={headerHeight + tasks.length * rowHeight + 30}
            className="select-none"
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#FFB000" />
              </marker>
              <marker
                id="arrowhead-crit"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#E03131" />
              </marker>
            </defs>

            {/* Timeline Header (Days/Dates) */}
            {Array.from({ length: totalDays }).map((_, dIdx) => {
              const current = new Date(minDate.getTime() + dIdx * 86400000);
              const x = dIdx * dayWidth;
              const isWeekend = current.getDay() === 5 || current.getDay() === 6;

              return (
                <g key={`day-hdr-${dIdx}`}>
                  {/* Vertical Column Grid Line */}
                  <line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={headerHeight + tasks.length * rowHeight}
                    stroke={isWeekend ? "#211E1B" : "#171513"}
                    strokeWidth={isWeekend ? dayWidth : 1}
                    opacity={isWeekend ? 0.6 : 0.8}
                  />
                  {/* Header text */}
                  {(zoom === "days" || dIdx % 7 === 0) && (
                    <text
                      x={x + 4}
                      y={26}
                      fill="#8C8782"
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {current.getDate()} {current.toLocaleString("default", { month: "short" })}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Header bottom divider */}
            <line
              x1={0}
              y1={headerHeight}
              x2={timelineWidth}
              y2={headerHeight}
              stroke="#2F2A25"
              strokeWidth="2"
            />

            {/* Dependency Connecting Curves */}
            {tasks.map((task) => {
              const targetCoord = taskMap.get(task.id);
              if (!targetCoord || !task.dependencies) return null;

              return task.dependencies.map((dep) => {
                const sourceCoord = taskMap.get(dep.dependsOnId);
                if (!sourceCoord) return null;

                const isCrit = highlightCriticalOnly || task.priority === "CRITICAL";

                const startX = sourceCoord.x + sourceCoord.width;
                const startY = sourceCoord.y + 12;
                const endX = targetCoord.x;
                const endY = targetCoord.y + 12;

                const dx = Math.max(20, (endX - startX) / 2);
                const pathD = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

                return (
                  <path
                    key={`dep-${dep.dependsOnId}-${task.id}`}
                    d={pathD}
                    fill="none"
                    stroke={isCrit ? "#E03131" : "#FFB000"}
                    strokeWidth={isCrit ? 2 : 1.5}
                    strokeDasharray={isCrit ? "none" : "3,3"}
                    markerEnd={isCrit ? "url(#arrowhead-crit)" : "url(#arrowhead)"}
                    opacity={0.85}
                  />
                );
              });
            })}

            {/* Task Bars */}
            {tasks.map((task) => {
              const coord = taskMap.get(task.id);
              if (!coord) return null;

              const isCompleted = task.status === "COMPLETED";
              const isOverdue = !isCompleted && new Date(task.deadline).getTime() < Date.now();
              const isCrit = task.priority === "CRITICAL";

              let barColor = "#8C8782";
              if (isCompleted) barColor = "#E8C547";
              else if (isOverdue) barColor = "#E03131";
              else if (task.status === "IN_PROGRESS") barColor = "#FFB000";
              else if (task.status === "REVIEW") barColor = "#FF6A13";

              const milestoneX = coord.x + coord.width;
              const milestoneY = coord.y + 12;

              return (
                <g
                  key={`task-bar-${task.id}`}
                  onClick={() => handleBarClick(task)}
                  className="cursor-pointer group"
                >
                  {/* Task Bar Background */}
                  <rect
                    x={coord.x}
                    y={coord.y}
                    width={coord.width}
                    height={24}
                    rx={3}
                    fill="#171513"
                    stroke={barColor}
                    strokeWidth={isCrit ? 2 : 1}
                  />

                  {/* Task Progress Fill */}
                  {task.progress > 0 && (
                    <rect
                      x={coord.x}
                      y={coord.y}
                      width={(coord.width * task.progress) / 100}
                      height={24}
                      rx={3}
                      fill={barColor}
                      opacity={0.75}
                    />
                  )}

                  {/* Task Label inside bar */}
                  <text
                    x={coord.x + 8}
                    y={coord.y + 16}
                    fill="#F4EFE6"
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="600"
                    pointerEvents="none"
                  >
                    {task.title.length > 25 ? task.title.substring(0, 25) + "…" : task.title} ({task.progress}%)
                  </text>

                  {/* Milestone Diamond Marker at End of Bar */}
                  <polygon
                    points={`${milestoneX},${milestoneY - 5} ${milestoneX + 5},${milestoneY} ${milestoneX},${milestoneY + 5} ${milestoneX - 5},${milestoneY}`}
                    fill={isCompleted ? "#E8C547" : isOverdue ? "#E03131" : "#FFB000"}
                    stroke="#0E0D0C"
                    strokeWidth="1"
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Task Details Inspection Modal */}
      {selectedTask && (
        <Modal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title="WORK PACKAGE GANTT INSPECTION"
          maxWidth="md"
        >
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3 bg-bg-0 border border-border rounded-xs">
              <div className="text-[10px] text-steel uppercase">Task Title</div>
              <div className="font-bold text-sm text-foreground">{selectedTask.title}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 bg-bg-0 border border-border rounded-xs">
                <div className="text-[10px] text-steel uppercase">Execution Status</div>
                <div className="mt-1">
                  <StatusBadge status={selectedTask.status} />
                </div>
              </div>

              <div className="p-2.5 bg-bg-0 border border-border rounded-xs">
                <div className="text-[10px] text-steel uppercase">Critical Priority</div>
                <div className="font-bold text-foreground mt-1">
                  {selectedTask.priority === "CRITICAL" ? (
                    <span className="text-crimson font-bold">CRITICAL PATH ITEM</span>
                  ) : (
                    selectedTask.priority
                  )}
                </div>
              </div>

              <div className="p-2.5 bg-bg-0 border border-border rounded-xs">
                <div className="text-[10px] text-steel uppercase">Completion Progress</div>
                <div className="font-bold text-amber mt-1">{selectedTask.progress}%</div>
                <div className="h-1.5 w-full bg-bg-1 rounded-full mt-1.5 overflow-hidden border border-border">
                  <div className="h-full bg-amber" style={{ width: `${selectedTask.progress}%` }} />
                </div>
              </div>

              <div className="p-2.5 bg-bg-0 border border-border rounded-xs">
                <div className="text-[10px] text-steel uppercase">Deadline Milestone</div>
                <div className="font-bold text-foreground mt-1">{formatDate(selectedTask.deadline)}</div>
              </div>
            </div>

            <div className="p-3 bg-bg-0 border border-border rounded-xs">
              <div className="text-[10px] text-steel uppercase mb-1">Prerequisite Dependencies</div>
              {selectedTask.dependencies && selectedTask.dependencies.length > 0 ? (
                <div className="text-amber">
                  {selectedTask.dependencies.length} upstream task constraint(s) enforcing DAG precedence.
                </div>
              ) : (
                <div className="text-steel">Independent work package with zero upstream blockers.</div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 rounded-xs bg-amber text-bg-0 font-bold uppercase tracking-wider text-xs shadow-amber"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

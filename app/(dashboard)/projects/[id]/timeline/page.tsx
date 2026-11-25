"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { GanttChart } from "@/components/gantt/gantt-chart";
import {
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Clock,
  Layers,
  CheckCircle2,
  Trello,
  Building2,
  Download,
} from "@/components/ui/icons";
import { formatDate } from "@/lib/utils";

export default function ProjectTimelinePage() {
  const params = useParams();
  const id = params.id as string;

  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/v1/projects/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProjectData(data);
        }
      } catch (e) {
        console.error("Failed to load project timeline:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-bg-1 w-64 rounded-xs" />
        <div className="h-96 bg-bg-1 rounded-sm" />
      </div>
    );
  }

  const project = projectData?.project;
  const tasks = project?.tasks || [];
  const criticalTasksCount = tasks.filter((t: any) => t.priority === "CRITICAL").length;
  const overdueTasksCount = tasks.filter(
    (t: any) => t.status !== "COMPLETED" && new Date(t.deadline).getTime() < Date.now()
  ).length;

  return (
    <div className="space-y-6 pb-12 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${id}`}
            className="p-2 rounded-xs border border-border bg-bg-1 text-steel hover:text-amber hover:border-amber transition shadow-plate"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-xs bg-amber/10 border border-amber/30 text-amber font-mono text-[10px] font-bold uppercase tracking-wider mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>CPM DIRECTED ACYCLIC GRAPH</span>
            </div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold uppercase tracking-wider text-foreground">
              {project?.name || "PROJECT"} &middot; <span className="text-amber">GANTT TIMELINE</span>
            </h1>
            <p className="text-xs font-mono text-steel uppercase tracking-widest mt-0.5">
              CRITICAL PATH NETWORK, DEPENDENCY ARROWS & EARNED MILESTONES
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${id}`}
            className="px-3 py-1.5 rounded-xs border border-border bg-bg-1 text-foreground hover:text-amber font-mono text-xs uppercase font-bold transition shadow-plate flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5 text-steel" />
            <span>Overview</span>
          </Link>
          <Link
            href="/tasks/kanban"
            className="px-3 py-1.5 rounded-xs border border-border bg-bg-1 text-foreground hover:text-amber font-mono text-xs uppercase font-bold transition shadow-plate flex items-center gap-1.5"
          >
            <Trello className="w-3.5 h-3.5 text-amber" />
            <span>Kanban</span>
          </Link>
          <a
            href={`/api/v1/reports/financial/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xs border border-amber/40 bg-amber/10 text-amber hover:bg-amber hover:text-bg-0 font-mono text-xs uppercase font-bold transition shadow-plate flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Financial PDF</span>
          </a>
        </div>
      </div>

      {/* Schedule Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-3 bg-bg-1 border border-border rounded-xs space-y-1 shadow-plate">
          <div className="text-[10px] text-steel uppercase">Tracked Work Packages</div>
          <div className="font-heading text-xl font-bold text-foreground">{tasks.length} Tasks</div>
          <div className="text-[10px] text-steel">Active schedule network</div>
        </div>

        <div className="p-3 bg-bg-1 border border-border rounded-xs space-y-1 shadow-plate">
          <div className="text-[10px] text-steel uppercase">Critical Path Tasks</div>
          <div className="font-heading text-xl font-bold text-crimson">{criticalTasksCount} Critical</div>
          <div className="text-[10px] text-steel">Zero float activities</div>
        </div>

        <div className="p-3 bg-bg-1 border border-border rounded-xs space-y-1 shadow-plate">
          <div className="text-[10px] text-steel uppercase">Schedule Overruns</div>
          <div className="font-heading text-xl font-bold text-amber">
            {overdueTasksCount > 0 ? `${overdueTasksCount} Delayed` : "0 Overdue"}
          </div>
          <div className="text-[10px] text-steel">Past baseline deadline</div>
        </div>

        <div className="p-3 bg-bg-1 border border-border rounded-xs space-y-1 shadow-plate">
          <div className="text-[10px] text-steel uppercase">Target Handover Date</div>
          <div className="font-heading text-xl font-bold text-gold">
            {formatDate(project?.expectedEndDate || new Date())}
          </div>
          <div className="text-[10px] text-steel">Contractual completion</div>
        </div>
      </div>

      {/* Gantt Component */}
      <GanttChart
        tasks={tasks}
        projectStartDate={project?.startDate}
        projectEndDate={project?.expectedEndDate}
      />
    </div>
  );
}

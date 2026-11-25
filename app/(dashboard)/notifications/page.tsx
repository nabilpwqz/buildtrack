"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  Check,
  RefreshCw,
  Clock,
  Filter,
  Boxes,
  DollarSign,
  Building2,
  HardHat,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

type NotifFilter = "ALL" | "MILESTONE" | "DELAY" | "BUDGET" | "SUPPLY";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState<NotifFilter>("ALL");
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/notifications");
      if (res.ok) {
        const d = await res.json();
        setNotifications(d.notifications || []);
        setUnreadCount(d.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const markAllRead = async () => {
    try {
      await fetch("/api/v1/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      fetchNotifs();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredNotifs = notifications.filter((n) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "MILESTONE") return n.type === "REPORT_SUBMITTED" || n.type === "TASK_ASSIGNED";
    if (activeFilter === "DELAY") return n.type === "OVERDUE";
    if (activeFilter === "BUDGET") return n.type === "BUDGET_OVERRUN";
    if (activeFilter === "SUPPLY") return n.type === "LOW_STOCK" || n.type === "REQUEST_APPROVED";
    return true;
  });

  return (
    <div className="max-w-5xl space-y-6 pb-12 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-xs bg-amber/10 border border-amber/30 text-amber font-mono text-[10px] font-bold uppercase tracking-wider mb-1.5">
            <Bell className="w-3.5 h-3.5" />
            <span>REAL-TIME PROJECT PROGRESS TELEMETRY</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-foreground">
            PROJECT PROGRESS & <span className="text-amber">CRITICAL ALERTS</span>
          </h1>
          <p className="text-xs font-mono text-steel uppercase tracking-wider mt-1">
            EARNED MILESTONES, SCHEDULE FLOAT SLIPPAGE, BUDGET THRESHOLDS & INVENTORY HAZARDS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotifs}
            className="p-2 rounded-xs border border-border bg-bg-1 text-steel hover:text-amber hover:border-amber transition shadow-plate"
            title="Refresh Alert Stream"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber" : ""}`} />
          </button>
          {unreadCount > 0 && (
            <Button
              onClick={markAllRead}
              variant="secondary"
              className="px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border-border bg-bg-1 hover:border-amber text-foreground"
            >
              <Check className="w-3.5 h-3.5 mr-1 text-gold" />
              <span>Mark All Acknowledged ({unreadCount})</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-bg-1 border border-border rounded-xs font-mono text-xs shadow-plate">
        <button
          onClick={() => setActiveFilter("ALL")}
          className={`px-3 py-1.5 rounded-xs uppercase font-bold transition cursor-pointer ${
            activeFilter === "ALL"
              ? "bg-amber text-bg-0 shadow-amber"
              : "text-steel hover:text-foreground hover:bg-bg-2"
          }`}
        >
          ALL ALERTS ({notifications.length})
        </button>
        <button
          onClick={() => setActiveFilter("MILESTONE")}
          className={`px-3 py-1.5 rounded-xs uppercase font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeFilter === "MILESTONE"
              ? "bg-amber text-bg-0 shadow-amber"
              : "text-steel hover:text-foreground hover:bg-bg-2"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>PROGRESS MILESTONES</span>
        </button>
        <button
          onClick={() => setActiveFilter("DELAY")}
          className={`px-3 py-1.5 rounded-xs uppercase font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeFilter === "DELAY"
              ? "bg-amber text-bg-0 shadow-amber"
              : "text-steel hover:text-foreground hover:bg-bg-2"
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-crimson" />
          <span>SCHEDULE DELAYS</span>
        </button>
        <button
          onClick={() => setActiveFilter("BUDGET")}
          className={`px-3 py-1.5 rounded-xs uppercase font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeFilter === "BUDGET"
              ? "bg-amber text-bg-0 shadow-amber"
              : "text-steel hover:text-foreground hover:bg-bg-2"
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-gold" />
          <span>BUDGET OVERRUNS</span>
        </button>
        <button
          onClick={() => setActiveFilter("SUPPLY")}
          className={`px-3 py-1.5 rounded-xs uppercase font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeFilter === "SUPPLY"
              ? "bg-amber text-bg-0 shadow-amber"
              : "text-steel hover:text-foreground hover:bg-bg-2"
          }`}
        >
          <Boxes className="w-3.5 h-3.5 text-molten" />
          <span>MATERIALS & INDENTS</span>
        </button>
      </div>

      {/* Notification Stream Cards */}
      <div className="bg-bg-1 border border-border rounded-sm shadow-plate divide-y divide-border overflow-hidden">
        {filteredNotifs.length === 0 ? (
          <div className="p-8 text-center text-steel font-mono text-xs">
            No active alerts matching the selected category.
          </div>
        ) : (
          filteredNotifs.map((n) => {
            const isDelay = n.type === "OVERDUE";
            const isBudget = n.type === "BUDGET_OVERRUN";
            const isSupply = n.type === "LOW_STOCK";
            const isMilestone = n.type === "REPORT_SUBMITTED" || n.type === "TASK_ASSIGNED" || n.type === "REQUEST_APPROVED";

            return (
              <div
                key={n.id}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                  !n.isRead
                    ? "bg-bg-0/60 border-l-4 border-l-amber"
                    : "hover:bg-bg-2/50"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xs bg-bg-0 border border-border shrink-0 mt-0.5">
                    {isDelay ? (
                      <Clock className="w-4 h-4 text-crimson" />
                    ) : isBudget ? (
                      <ShieldAlert className="w-4 h-4 text-gold" />
                    ) : isSupply ? (
                      <AlertTriangle className="w-4 h-4 text-molten" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-amber" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-bold text-sm text-foreground uppercase tracking-wide">
                        {n.title}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded-xs font-bold uppercase border ${
                          isDelay
                            ? "bg-crimson/15 text-crimson border-crimson/30"
                            : isBudget
                            ? "bg-gold/15 text-gold border-gold/30"
                            : isSupply
                            ? "bg-molten/15 text-molten border-molten/30"
                            : "bg-amber/15 text-amber border-amber/30"
                        }`}
                      >
                        {n.type.replace(/_/g, " ")}
                      </span>
                      {!n.isRead && (
                        <span className="text-[8px] font-mono px-1 py-0.2 rounded-xs bg-amber text-bg-0 font-bold uppercase">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-concrete font-mono leading-relaxed">
                      {n.message}
                    </p>
                    <div className="text-[10px] font-mono text-steel flex items-center gap-2 pt-0.5">
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                      <span>&middot;</span>
                      <span>BuildTrack Event Dispatcher</span>
                    </div>
                  </div>
                </div>

                {n.link && (
                  <Link
                    href={n.link}
                    className="self-end sm:self-center px-3 py-1.5 rounded-xs border border-border bg-bg-0 hover:border-amber text-foreground hover:text-amber font-mono text-xs uppercase font-bold tracking-wider transition flex items-center gap-1.5 shrink-0 shadow-plate"
                  >
                    <span>Inspect Target</span>
                    <ExternalLink className="w-3.5 h-3.5 text-amber" />
                  </Link>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

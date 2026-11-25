"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Database, Zap, ArrowUpRight, RefreshCw, Clock, ShieldCheck } from "@/components/ui/icons";

interface AdminTelemetryOverview {
  serverTimestamp: string;
  latencyMs: number;
  totalTables: number;
  totalRecords: number;
  tables: Array<{ key: string; label: string; category: string; rowCount: number }>;
  liveStreams?: {
    recentActivity?: Array<{
      id: string;
      actorName: string;
      actorRole: string;
      action: string;
      entity: string;
      entityId: string;
      createdAt: string;
    }>;
  };
}

interface AdminRealtimeTelemetryProps {
  isAdmin: boolean;
  onDatabaseUpdate?: () => void;
}

export function AdminRealtimeTelemetry({ isAdmin, onDatabaseUpdate }: AdminRealtimeTelemetryProps) {
  const [connected, setConnected] = useState(false);
  const [overview, setOverview] = useState<AdminTelemetryOverview | null>(null);
  const [lastPingMs, setLastPingMs] = useState<number | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;

    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/v1/admin/realtime/stream");

      es.addEventListener("snapshot", (ev) => {
        try {
          const data = JSON.parse((ev as MessageEvent).data) as AdminTelemetryOverview;
          setOverview(data);
          setLastPingMs(data.latencyMs);
          setLastSync(data.serverTimestamp);
          setConnected(true);
        } catch {}
      });

      es.addEventListener("update", (ev) => {
        try {
          const data = JSON.parse((ev as MessageEvent).data) as AdminTelemetryOverview;
          setOverview(data);
          setLastPingMs(data.latencyMs);
          setLastSync(data.serverTimestamp);
          setConnected(true);
          onDatabaseUpdate?.();
        } catch {}
      });

      es.addEventListener("heartbeat", (ev) => {
        try {
          const hb = JSON.parse((ev as MessageEvent).data);
          setLastPingMs(hb.latencyMs);
          setLastSync(hb.serverTimestamp);
          setConnected(true);
        } catch {}
      });

      es.onerror = () => {
        setConnected(false);
      };
    } catch {
      setConnected(false);
    }

    return () => {
      es?.close();
    };
  }, [isAdmin, onDatabaseUpdate]);

  if (!isAdmin) return null;

  const latestEvent = overview?.liveStreams?.recentActivity?.[0];
  const topTables = overview?.tables?.slice(0, 6) || [];

  return (
    <div className="bg-bg-1 border border-amber/50 rounded-sm p-4 shadow-plate space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-sm bg-amber/15 border border-amber/40 flex items-center justify-center shrink-0">
            <Database className="w-4 h-4 text-amber" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-foreground">
                ADMIN OPERATIONAL DATA HUB
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold uppercase border ${
                  connected
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                    : "bg-amber/10 border-amber/40 text-amber"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    connected ? "bg-emerald-400 animate-pulse" : "bg-amber"
                  }`}
                />
                {connected ? "SSE LIVE STREAM" : "CONNECTING..."}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-mono bg-bg-2 border border-border text-steel">
                <ShieldCheck className="w-3 h-3 text-amber" />
                ADMIN ONLY
              </span>
            </div>
            <p className="text-[11px] font-mono text-steel mt-0.5">
              {overview
                ? `${overview.totalTables} PostgreSQL tables active | ${overview.totalRecords.toLocaleString()} total live records | Ping ${lastPingMs ?? overview.latencyMs} ms`
                : "Establishing direct PostgreSQL live telemetry stream..."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {lastSync && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-bg-0 border border-border rounded-xs text-[10px] font-mono text-steel">
              <Clock className="w-3 h-3 text-amber" />
              <span>SYNC {new Date(lastSync).toLocaleTimeString()}</span>
            </div>
          )}
          <Link
            href="/admin/database"
            className="px-3.5 py-1.5 bg-amber hover:bg-amber-glow text-bg-0 text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition flex items-center gap-1.5 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-bg-0" />
            <span>OPEN OPERATIONAL DATA HUB</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-bg-0" />
          </Link>
        </div>
      </div>

      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-border/60">
          {topTables.map((t) => (
            <Link
              key={t.key}
              href={`/admin/database?table=${t.key}`}
              className="px-2.5 py-1.5 bg-bg-0 border border-border hover:border-amber/60 rounded-xs transition flex items-center justify-between gap-2"
            >
              <span className="text-[10px] font-mono uppercase text-steel truncate">
                {t.label}
              </span>
              <span className="text-xs font-mono font-bold text-amber">
                {t.rowCount}
              </span>
            </Link>
          ))}
        </div>
      )}

      {latestEvent && (
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60 text-[11px] font-mono">
          <div className="flex items-center gap-2 min-w-0">
            <RefreshCw className="w-3 h-3 text-amber shrink-0" />
            <span className="text-steel uppercase shrink-0">LATEST DB MUTATION:</span>
            <span className="text-foreground font-bold truncate">
              {latestEvent.action} {latestEvent.entity}
            </span>
            <span className="text-steel truncate hidden sm:inline">
              by {latestEvent.actorName} ({latestEvent.actorRole})
            </span>
          </div>
          <span className="text-[10px] text-steel shrink-0">
            {new Date(latestEvent.createdAt).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
}


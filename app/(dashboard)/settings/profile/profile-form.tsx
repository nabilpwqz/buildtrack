"use client";

import React, { useState } from "react";
import {
  User,
  Mail,
  ShieldCheck,
  KeyRound,
  Check,
  CheckCircle2,
  Lock,
  Clock,
  Sparkles,
  Zap,
} from "@/components/ui/icons";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProfileFormProps {
  initialUser?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

export function ProfileForm({ initialUser }: ProfileFormProps) {
  const [saved, setSaved] = useState(false);
  const [apiKeyGenerated, setApiKeyGenerated] = useState<string | null>(null);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyApp, setNotifyApp] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleGenerateApiKey = () => {
    const key = `btk_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
    setApiKeyGenerated(key);
  };

  const displayName = initialUser?.name || "Authenticated Operator";
  const displayEmail = initialUser?.email || "operator@buildtrack.com";
  const displayRole = (initialUser as any)?.role || "ADMIN";

  return (
    <div className="max-w-3xl space-y-6 pb-12 transition-colors duration-200">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-xs bg-amber/10 border border-amber/30 text-amber font-mono text-[10px] font-bold uppercase tracking-wider mb-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>SECURITY CREDENTIALS & WORKSTATION PREFERENCES</span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-tight text-foreground">
          OPERATOR PROFILE & <span className="text-amber">SECURITY KEYS</span>
        </h1>
        <p className="text-xs font-mono text-steel uppercase tracking-wider mt-1">
          PERSONAL IDENTITY, CRYPTOGRAPHIC AUTH TOKENS & DISPATCH RULES
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-gold/15 border border-gold/40 text-gold text-xs font-mono flex items-center gap-2.5 rounded-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-gold" />
          <span>Profile configuration and alert preferences successfully updated.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Active Operator Credential */}
        <Card className="bg-bg-1 border-border shadow-plate">
          <CardHeader className="pb-2 border-b border-border/60">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-amber flex items-center gap-2">
              <User className="w-4 h-4 text-amber" />
              <span>ACTIVE OPERATOR IDENTITY</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-concrete mb-1 font-bold">Registered Full Name</label>
                <div className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground font-semibold">
                  {displayName}
                </div>
              </div>

              <div>
                <label className="block text-concrete mb-1 font-bold">Assigned Authentication Email</label>
                <div className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-steel">
                  {displayEmail}
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-concrete mb-1 font-bold">Assigned RBAC Security Role</label>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xs bg-amber/15 border border-amber/40 text-amber font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber" />
                  <span>{String(displayRole).replace(/_/g, " ")}</span>
                </div>
              </div>
              <div className="text-[11px] text-steel">
                Session Token: <span className="text-gold font-bold">Signed JWT · RS256</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* REST API Access Key */}
        <Card className="bg-bg-1 border-border shadow-plate">
          <CardHeader className="pb-2 border-b border-border/60 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-molten flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-molten" />
              <span>FIELD TELEMETRY API TOKENS</span>
            </CardTitle>
            <button
              type="button"
              onClick={handleGenerateApiKey}
              className="px-2.5 py-1 rounded-xs bg-bg-0 border border-border hover:border-amber text-steel hover:text-amber font-mono text-[10px] uppercase font-bold transition flex items-center gap-1.5"
            >
              <Zap className="w-3 h-3 text-amber" />
              <span>ROTATE KEY</span>
            </button>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 font-mono text-xs">
            <p className="text-steel leading-relaxed">
              Use your programmatic API bearer token to synchronize IoT geotechnical sensors, concrete curing monitors, and batch truck weight tickets.
            </p>

            <div className="p-3 bg-bg-0 border border-border rounded-xs flex items-center justify-between gap-3">
              <div className="font-mono text-xs text-foreground truncate">
                {apiKeyGenerated || "btk_live_9488a0b73c4d1e2f"}
              </div>
              <span className="px-2 py-0.5 rounded-xs bg-gold/15 text-gold border border-gold/40 text-[10px] font-bold shrink-0">
                ACTIVE
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="bg-bg-1 border-border shadow-plate">
          <CardHeader className="pb-2 border-b border-border/60">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-steel" />
              <span>PERSONAL ALERT DISPATCH RULES</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-foreground">Email Notifications on Assigned Tasks</div>
                <div className="text-[11px] text-steel">Dispatch email when task status transitions to IN_PROGRESS or BLOCKED.</div>
              </div>
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
                className="accent-amber w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div>
                <div className="font-bold text-foreground">In-App Banner Notifications</div>
                <div className="text-[11px] text-steel">Display high-priority amber flash notifications on the masthead.</div>
              </div>
              <input
                type="checkbox"
                checked={notifyApp}
                onChange={(e) => setNotifyApp(e.target.checked)}
                className="accent-amber w-4 h-4 cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            className="px-6 py-2 rounded-xs font-mono text-xs uppercase tracking-wider font-bold bg-amber text-bg-0 hover:bg-molten hover:text-foreground transition shadow-amber"
          >
            Update Profile Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}


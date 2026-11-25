"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import {
  Bell,
  Search,
  Sun,
  Moon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  X,
  ExternalLink,
  ChevronDown,
  LogOut,
  Zap,
} from "@/components/ui/icons";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NavbarProps {
  userRole?: string;
  userName?: string;
  onOpenCommandPalette?: () => void;
}

const DEMO_SWITCH_ROLES = [
  { role: "ADMIN", email: "admin@buildtrack.com", label: "Executive Director", desc: "Full governance & audit" },
  { role: "PROJECT_MANAGER", email: "pm@buildtrack.com", label: "Lead PM", desc: "Lifecycle & CPM DAG" },
  { role: "SITE_ENGINEER", email: "engineer@buildtrack.com", label: "Site Lead", desc: "Field logs & daily execution" },
  { role: "FINANCE_MANAGER", email: "finance@buildtrack.com", label: "Financial Controller", desc: "Budgets & earned value" },
  { role: "CONTRACTOR", email: "contractor@buildtrack.com", label: "Prime Contractor", desc: "Tasks & material indents" },
];

export function Navbar({
  userRole = "SITE_ENGINEER",
  userName = "Operator",
  onOpenCommandPalette,
}: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/v1/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id?: string) => {
    try {
      await fetch("/api/v1/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchNotifications();
    } catch (e) {
      // ignore
    }
  };

  const handleSwitchRole = async (targetEmail: string, targetRole: string) => {
    setSwitchingRole(true);
    try {
      const res = await signIn("credentials", {
        email: targetEmail,
        password: "Demo@1234",
        role: targetRole,
        redirect: false,
        callbackUrl: "/dashboard",
      });
      if (res?.ok || !res?.error) {
        window.location.href = "/dashboard";
      } else {
        setSwitchingRole(false);
      }
    } catch (err) {
      console.error("Role switch error:", err);
      setSwitchingRole(false);
    }
  };

  return (
    <header className="h-14 sm:h-16 border-b border-border bg-bg-0/90 backdrop-blur-xs sticky top-0 z-20 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 transition-colors duration-200">
      {/* Left: Quick search & command trigger */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md ml-10 sm:ml-12 lg:ml-0">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-sm bg-bg-1 border border-border hover:border-amber/60 text-xs text-steel hover:text-concrete transition shadow-xs group cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-3.5 h-3.5 text-steel group-hover:text-amber transition-colors shrink-0" />
            <span className="font-mono truncate">Quick jump or search...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-bg-2 border border-border text-steel rounded shrink-0">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Instant Role Workstation Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setShowNotifMenu(false);
            }}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xs border border-amber/40 bg-amber/10 hover:bg-amber/20 hover:border-amber text-amber text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-bold transition shadow-plate cursor-pointer"
            title="Click to Switch Role Perspective"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber shrink-0" />
            <span className="truncate max-w-[80px] xs:max-w-[120px] sm:max-w-none">{userRole.replace("_", " ")}</span>
            <ChevronDown className="w-3 h-3 text-amber opacity-70 shrink-0" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 sm:w-76 max-w-[calc(100vw-24px)] bg-bg-1 border border-border shadow-plate rounded-sm p-0 z-50 overflow-hidden animate-in fade-in duration-150 font-mono">
              <div className="px-3.5 py-2.5 bg-bg-0 border-b border-border flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-steel">
                  SWITCH ROLE PERSPECTIVE
                </span>
                <span className="text-[9px] text-amber font-bold">1-CLICK</span>
              </div>
              <div className="p-1 divide-y divide-border/40">
                {DEMO_SWITCH_ROLES.map((r) => {
                  const isCurrent = userRole === r.role;
                  return (
                    <button
                      key={r.role}
                      type="button"
                      disabled={switchingRole}
                      onClick={() => handleSwitchRole(r.email, r.role)}
                      className={`w-full p-2 text-left rounded-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                        isCurrent
                          ? "bg-amber/20 text-amber font-bold border-l-2 border-amber pl-2"
                          : "text-steel hover:text-foreground hover:bg-bg-2"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold truncate">
                          {r.role.replace("_", " ")}
                        </div>
                        <div className="text-[9px] text-steel truncate">
                          {r.label} &middot; {r.desc}
                        </div>
                      </div>
                      {isCurrent && <span className="text-[9px] text-amber shrink-0 font-bold">ACTIVE</span>}
                    </button>
                  );
                })}
              </div>
              <div className="p-2 bg-bg-0 border-t border-border flex items-center justify-between text-[10px]">
                <span className="text-steel truncate">{userName}</span>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-crimson hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>SIGN OUT</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowRoleMenu(false);
            }}
            className="relative p-1.5 sm:p-2 rounded-sm bg-bg-1 border border-border text-concrete hover:text-amber hover:border-amber/60 transition cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-crimson text-ivory font-mono text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-72 sm:w-96 max-w-[calc(100vw-24px)] bg-bg-1 border border-border shadow-plate rounded-sm p-0 z-50 overflow-hidden animate-in fade-in duration-150">
              <div className="px-4 py-3 bg-bg-0 border-b border-border flex items-center justify-between">
                <div className="font-mono text-xs uppercase font-bold text-foreground flex items-center gap-2">
                  <span>SYSTEM NOTIFICATIONS</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber text-bg-0 text-[10px] font-bold rounded-xs">
                      {unreadCount} NEW
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAsRead()}
                    className="text-[10px] font-mono text-amber hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-border">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "p-3 text-xs transition hover:bg-bg-2/80 flex items-start gap-2.5",
                        !n.isRead && "bg-bg-2/30 border-l-2 border-amber"
                      )}
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.type === "OVERDUE" || n.type === "BUDGET_OVERRUN" ? (
                          <ShieldAlert className="w-4 h-4 text-crimson" />
                        ) : n.type === "LOW_STOCK" ? (
                          <AlertTriangle className="w-4 h-4 text-molten" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-amber" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground text-xs leading-snug">
                          {n.title}
                        </div>
                        <p className="text-[11px] text-steel mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/50 text-[10px] font-mono text-steel">
                          <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                          <div className="flex items-center gap-2">
                            {n.link && (
                              <Link
                                href={n.link}
                                onClick={() => setShowNotifMenu(false)}
                                className="text-amber hover:underline flex items-center gap-1"
                              >
                                View <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
                            )}
                            {!n.isRead && (
                              <button
                                onClick={() => markAsRead(n.id)}
                                className="text-concrete hover:text-amber cursor-pointer"
                              >
                                Dismiss
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs font-mono text-steel">
                    No unread notifications.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-sm bg-bg-1 border border-border text-concrete hover:text-amber hover:border-amber/60 transition cursor-pointer"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}

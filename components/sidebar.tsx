"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CheckSquare,
  Trello,
  PieChart,
  Receipt,
  Boxes,
  Users2,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  Settings,
  History,
  HardHat,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  User,
  Database,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { Role } from "@/types";
import { signOut } from "next-auth/react";
import { LogoLink } from "@/components/ui/logo";
import { useTheme } from "@/components/theme-provider";

interface SidebarProps {
  userRole?: Role | string;
  userName?: string;
  userEmail?: string;
}

export function Sidebar({ userRole = "SITE_ENGINEER", userName = "Operator", userEmail = "" }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const navSections = [
    {
      label: "OPERATIONS",
      items: [
        {
          label: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          allowed: ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "FINANCE_MANAGER", "CONTRACTOR"],
        },
        {
          label: "Projects",
          href: "/projects",
          icon: Building2,
          allowed: ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "FINANCE_MANAGER", "CONTRACTOR"],
        },
        {
          label: "Tasks List",
          href: "/tasks",
          icon: CheckSquare,
          allowed: ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "FINANCE_MANAGER", "CONTRACTOR"],
        },
        {
          label: "Kanban Board",
          href: "/tasks/kanban",
          icon: Trello,
          allowed: ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "CONTRACTOR"],
        },
      ],
    },
    {
      label: "FINANCIALS",
      items: [
        {
          label: "Budget Tracking",
          href: "/budget",
          icon: PieChart,
          allowed: ["ADMIN", "PROJECT_MANAGER", "FINANCE_MANAGER"],
        },
        {
          label: "Expense Ledger",
          href: "/expenses",
          icon: Receipt,
          allowed: ["ADMIN", "PROJECT_MANAGER", "FINANCE_MANAGER"],
        },
      ],
    },
    {
      label: "SUPPLY & FIELD",
      items: [
        {
          label: "Materials & Inventory",
          href: "/materials",
          icon: Boxes,
          allowed: ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "CONTRACTOR"],
        },
        {
          label: "Contractors",
          href: "/contractors",
          icon: Users2,
          allowed: ["ADMIN", "PROJECT_MANAGER"],
        },
        {
          label: "Reports & Analytics",
          href: "/reports",
          icon: FileSpreadsheet,
          allowed: ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "FINANCE_MANAGER", "CONTRACTOR"],
        },
        {
          label: "Documents",
          href: "/documents",
          icon: FileText,
          allowed: ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "FINANCE_MANAGER", "CONTRACTOR"],
        },
      ],
    },
    {
      label: "ADMINISTRATION",
      items: [
        {
          label: "Operational Data Hub",
          href: "/admin/database",
          icon: Database,
          allowed: ["ADMIN"],
        },
        {
          label: "User Management",
          href: "/users",
          icon: ShieldCheck,
          allowed: ["ADMIN"],
        },
        {
          label: "Activity Audit Logs",
          href: "/activity-logs",
          icon: History,
          allowed: ["ADMIN", "PROJECT_MANAGER", "FINANCE_MANAGER"],
        },
        {
          label: "Profile Settings",
          href: "/settings/profile",
          icon: User,
          allowed: ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "FINANCE_MANAGER", "CONTRACTOR"],
        },
        {
          label: "System Settings",
          href: "/settings/system",
          icon: Settings,
          allowed: ["ADMIN"],
        },
      ],
    },
  ];

  const content = (
    <div className="flex flex-col h-full bg-bg-0 border-r border-border transition-colors duration-200">
      {/* Brand Header */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <LogoLink href="/dashboard" size="md" />
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded text-steel hover:text-amber lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => {
          const visibleItems = section.items.filter((item) =>
            item.allowed.includes(userRole)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label} className="space-y-1">
              <div className="px-3 text-[10px] font-mono font-bold uppercase tracking-widest text-steel">
                {section.label}
              </div>
              <div className="space-y-0.5 pt-1">
                {visibleItems.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-xs text-xs font-medium font-mono uppercase tracking-wider transition-colors group",
                        isActive
                          ? "bg-bg-2 text-amber border-l-2 border-amber pl-2.5 font-bold shadow-plate"
                          : "text-concrete hover:bg-bg-1 hover:text-amber"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={cn(
                            "w-4 h-4 transition-colors",
                            isActive
                              ? "text-amber"
                              : "text-steel group-hover:text-amber"
                          )}
                        />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* User Footer with Theme Toggle */}
      <div className="p-3 border-t border-border bg-bg-1/80 flex items-center justify-between gap-2">
        <Link
          href="/settings/profile"
          title="Open Profile Settings"
          className="min-w-0 flex-1 group block hover:opacity-90 transition"
        >
          <div className="text-xs font-semibold text-foreground truncate group-hover:text-amber transition">
            {userName}
          </div>
          <div className="text-[10px] font-mono text-amber uppercase truncate">
            {userRole.replace("_", " ")}
          </div>
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="p-1.5 rounded-xs text-steel hover:text-amber hover:bg-bg-2 transition"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign Out"
            className="p-1.5 rounded-xs text-steel hover:text-crimson hover:bg-bg-2 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-sm bg-bg-1 border border-border text-amber hover:text-foreground hover:border-amber transition shadow-plate"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-full h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}

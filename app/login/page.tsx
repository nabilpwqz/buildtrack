"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  HardHat,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sun,
  Moon,
  Zap,
  Building2,
  Trello,
  Receipt,
  Users2,
  CheckCircle2,
  Layers,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

// Lazy loaded 3D scene with ssr: false
const Scene = dynamic(() => import("@/components/3d/scene").then((m) => m.Scene), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-bg-0 animate-pulse" />,
});

const ConstructionSiteScene = dynamic(
  () => import("@/components/3d/construction-site"),
  { ssr: false }
);

interface RoleOption {
  role: "ADMIN" | "PROJECT_MANAGER" | "SITE_ENGINEER" | "FINANCE_MANAGER" | "CONTRACTOR";
  email: string;
  title: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLE_ACCOUNTS: RoleOption[] = [
  {
    role: "ADMIN",
    email: "admin@buildtrack.com",
    title: "Executive Director",
    badge: "ROOT GOVERNANCE",
    description: "Company settings, user access, permissions, and enterprise audit",
    icon: ShieldCheck,
  },
  {
    role: "PROJECT_MANAGER",
    email: "pm@buildtrack.com",
    title: "Lead Project Manager",
    badge: "CPM LIFECYCLE",
    description: "Create projects, assign tasks, milestones, and monitor budgets",
    icon: Building2,
  },
  {
    role: "SITE_ENGINEER",
    email: "engineer@buildtrack.com",
    title: "Lead Site Engineer",
    badge: "FIELD OPERATIONS",
    description: "Daily site logs, task progress, material consumption, and delay reports",
    icon: HardHat,
  },
  {
    role: "FINANCE_MANAGER",
    email: "finance@buildtrack.com",
    title: "Financial Controller",
    badge: "CAPITAL LEDGER",
    description: "Manage project budgets, expense vouchers, and EVM variance",
    icon: Receipt,
  },
  {
    role: "CONTRACTOR",
    email: "contractor@buildtrack.com",
    title: "Prime Contractor",
    badge: "WORK PACKAGES",
    description: "Assigned tasks, work progress updates, and material requisitions",
    icon: Users2,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [selectedRole, setSelectedRole] = useState<RoleOption["role"]>("ADMIN");
  const [email, setEmail] = useState("admin@buildtrack.com");
  const [password, setPassword] = useState("Demo@1234");
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill email from query param if provided (e.g. /login?email=pm@buildtrack.com or /login?role=CONTRACTOR)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get("email");
      const roleParam = params.get("role")?.toUpperCase();

      if (roleParam) {
        const found = ROLE_ACCOUNTS.find((r) => r.role === roleParam);
        if (found) {
          setSelectedRole(found.role);
          setEmail(found.email);
          setPassword("Demo@1234");
          return;
        }
      }

      if (emailParam) {
        setEmail(emailParam);
        setPassword("Demo@1234");
        const found = ROLE_ACCOUNTS.find((r) => r.email.toLowerCase() === emailParam.toLowerCase());
        if (found) setSelectedRole(found.role);
      }
    }
  }, []);

  const handleRoleTabClick = (roleOpt: RoleOption) => {
    setSelectedRole(roleOpt.role);
    setEmail(roleOpt.email);
    setPassword("Demo@1234");
    setError(null);
  };

  const executeRoleSignIn = async (targetRole: RoleOption["role"], targetEmail: string) => {
    setLoadingRole(targetRole);
    setError(null);

    try {
      const res = await signIn("credentials", {
        email: targetEmail,
        password: "Demo@1234",
        role: targetRole,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (res?.error) {
        setError(`Authentication failure for ${targetRole.replace(/_/g, " ")}: ${res.error}`);
        setLoadingRole(null);
        return;
      }

      // Hard navigation to ensure all server layouts and session cookies are loaded cleanly
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err?.message || "An authentication error occurred.");
      setLoadingRole(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSubmit(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        email: (email || "admin@buildtrack.com").trim(),
        password: password || "Demo@1234",
        role: selectedRole,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (res?.error) {
        setError(`Invalid credentials or access denied: ${res.error}`);
        setLoadingSubmit(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Please verify credentials.");
      setLoadingSubmit(false);
    }
  };

  const activeRoleConfig = ROLE_ACCOUNTS.find((r) => r.role === selectedRole) || ROLE_ACCOUNTS[0];

  return (
    <div className="relative w-screen min-h-screen overflow-x-hidden bg-bg-0 flex items-center justify-center py-10 px-4 transition-colors duration-200">
      {/* Theme Toggle Top Right */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
        <Link
          href="/"
          className="px-3 py-1.5 rounded-xs bg-bg-1/90 border border-border text-steel hover:text-amber hover:border-amber transition font-mono text-xs uppercase shadow-plate backdrop-blur-xs"
        >
          &larr; Portal Home
        </Link>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xs bg-bg-1/90 border border-border text-steel hover:text-amber hover:border-amber/60 transition backdrop-blur-xs shadow-plate"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Background 3D Construction Site Scene */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <Scene camera={{ position: [16, 18, 16], fov: 45 }}>
          <ConstructionSiteScene />
        </Scene>
      </div>

      {/* Themed Vignette Overlay */}
      <div className="fixed inset-0 z-1 pointer-events-none bg-gradient-to-t from-bg-0 via-transparent to-bg-0/90" />

      {/* Main Authentication Card */}
      <div className="relative z-10 w-full max-w-2xl bg-bg-1/95 border border-border shadow-plate backdrop-blur-md rounded-sm p-6 sm:p-8 transition-colors duration-200">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-sm bg-amber text-bg-0 flex items-center justify-center font-bold shadow-amber">
              <HardHat className="w-6 h-6 text-bg-0" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold tracking-wider text-foreground uppercase">
                BUILD<span className="text-amber">TRACK</span>
              </h1>
              <p className="text-[10px] font-mono text-steel tracking-widest uppercase">
                CIVIL MEGAPROJECT WORKSTATION ACCESS
              </p>
            </div>
          </div>
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-amber/10 border border-amber/30 text-amber font-mono text-[10px] font-bold uppercase">
            <Zap className="w-3.5 h-3.5" />
            <span>ROLE-BASED DIRECT DISPATCH</span>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xs bg-crimson/10 border border-crimson/40 flex items-center gap-2 text-xs text-crimson font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* SECTION 1: 1-Click Role Workstation Launchpad */}
        <div className="mb-6">
          <div className="text-[10px] font-mono uppercase tracking-widest text-steel mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber" />
              <span className="font-bold text-foreground">1-CLICK ROLE WORKSTATION LAUNCHPAD:</span>
            </span>
            <span className="text-amber font-bold">Select Perspective to Enter</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {ROLE_ACCOUNTS.map((acc) => {
              const Icon = acc.icon;
              const isCurrentLoading = loadingRole === acc.role;
              const isSelected = selectedRole === acc.role;

              return (
                <button
                  key={acc.role}
                  type="button"
                  disabled={loadingRole !== null || loadingSubmit}
                  onClick={() => executeRoleSignIn(acc.role, acc.email)}
                  className={`p-3 rounded-xs border text-left transition flex flex-col justify-between group cursor-pointer disabled:opacity-50 ${
                    isSelected
                      ? "border-amber bg-amber/15 shadow-plate"
                      : "border-border bg-bg-0 hover:border-amber/70 hover:bg-bg-2"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-xs bg-bg-1 border border-border group-hover:border-amber text-amber">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-foreground uppercase truncate">
                        {acc.role.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-xs bg-bg-1 border border-border text-steel font-bold uppercase">
                      {acc.badge}
                    </span>
                  </div>

                  <div className="text-[11px] font-bold text-foreground mb-1">
                    {acc.title}
                  </div>

                  <p className="text-[10px] font-mono text-steel leading-relaxed mb-3 line-clamp-2">
                    {acc.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[10px] font-mono">
                    <span className="text-steel truncate">{acc.email}</span>
                    <span className="text-amber font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      {isCurrentLoading ? "LAUNCHING..." : "ENTER &rarr;"}
                    </span>
                  </div>
                </button>
              );
            })}

            {/* Quick Guest / Visitor Box */}
            <div className="p-3 rounded-xs border border-dashed border-border bg-bg-0/60 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono font-bold text-steel uppercase mb-1">
                  NEW FIELD OPERATOR?
                </div>
                <p className="text-[10px] font-mono text-steel leading-relaxed">
                  Sign in with any custom email below or create a dedicated legal profile.
                </p>
              </div>
              <Link
                href="/register"
                className="mt-2 text-[10px] font-mono text-amber hover:underline font-bold inline-flex items-center gap-1"
              >
                Register Custom Role Profile &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* SECTION 2: Custom Credentials Form with Explicit Role Selector */}
        <div className="border-t border-border pt-5">
          <div className="text-[10px] font-mono uppercase tracking-widest text-steel mb-3 flex items-center justify-between">
            <span className="font-bold text-foreground">MANUAL CREDENTIALS & ROLE DISPATCH:</span>
            <span>Target Role: <strong className="text-amber">{selectedRole.replace(/_/g, " ")}</strong></span>
          </div>

          {/* Interactive Role Tabs */}
          <div className="flex flex-wrap gap-1.5 mb-4 p-1.5 bg-bg-0 border border-border rounded-xs">
            {ROLE_ACCOUNTS.map((opt) => (
              <button
                key={opt.role}
                type="button"
                onClick={() => handleRoleTabClick(opt)}
                className={`px-2.5 py-1 rounded-xs font-mono text-[10px] uppercase font-bold transition cursor-pointer ${
                  selectedRole === opt.role
                    ? "bg-amber text-bg-0 shadow-amber"
                    : "text-steel hover:text-foreground hover:bg-bg-1"
                }`}
              >
                {opt.role.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-concrete mb-1.5">
                  Authorized Email or Alias
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email or shortcut (pm, contractor...)"
                    className="w-full pl-9 pr-4 py-2 bg-bg-0 border border-border rounded-xs text-xs text-foreground placeholder:text-steel focus:outline-none focus:border-amber transition font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-concrete mb-1.5">
                  Workstation Passcode
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Demo@1234"
                    className="w-full pl-9 pr-4 py-2 bg-bg-0 border border-border rounded-xs text-xs text-foreground placeholder:text-steel focus:outline-none focus:border-amber transition font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="text-[11px] font-mono text-steel">
                Active Role: <span className="text-amber font-bold">{activeRoleConfig.title}</span> ({activeRoleConfig.badge})
              </div>

              <Button
                type="submit"
                variant="primary"
                loading={loadingSubmit}
                className="w-full sm:w-auto px-6 h-9 text-xs font-mono uppercase tracking-wider font-bold shadow-amber"
              >
                <span>SIGN IN AS {selectedRole.replace(/_/g, " ")}</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <div className="mt-5 pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-steel gap-2">
          <div>
            BuildTrack Megaproject Intelligence · Neon Serverless PostgreSQL
          </div>
          <div>
            Need assistance? <Link href="/register" className="text-amber hover:underline font-bold">Register Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  HardHat,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sun,
  Moon,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        // If user already exists, proceed to sign in directly
        if (res.status === 409) {
          await signIn("credentials", {
            email,
            password,
            redirect: false,
            callbackUrl: "/dashboard",
          });
          window.location.href = "/dashboard";
          return;
        }
        throw new Error(data?.error?.message || "Registration failed");
      }

      setSuccess(true);
      // Auto-sign in the newly registered user immediately!
      setTimeout(async () => {
        await signIn("credentials", {
          email,
          password,
          redirect: false,
          callbackUrl: "/dashboard",
        });
        window.location.href = "/dashboard";
      }, 800);
    } catch (err: any) {
      setError(err?.message || "Failed to register account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-bg-0 flex items-center justify-center p-4 transition-colors duration-200">
      {/* Theme Toggle Top Right */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
        <Link
          href="/login"
          className="px-3 py-1.5 rounded-xs bg-bg-1 border border-border text-steel hover:text-amber hover:border-amber transition font-mono text-xs uppercase shadow-plate"
        >
          &larr; Return to Sign In
        </Link>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xs bg-bg-1 border border-border text-steel hover:text-amber hover:border-amber/60 transition shadow-plate"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="w-full max-w-lg p-6 sm:p-8 bg-bg-1 border border-border shadow-plate rounded-sm transition-colors duration-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-sm bg-amber text-bg-0 flex items-center justify-center font-bold shadow-amber">
            <HardHat className="w-6 h-6 text-bg-0" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold tracking-wider text-foreground uppercase">
              BUILD<span className="text-amber">TRACK</span>
            </h1>
            <p className="text-[10px] font-mono text-steel tracking-widest uppercase">
              REGISTER CIVIL OPERATOR CREDENTIAL
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xs bg-crimson/10 border border-crimson/40 flex items-center gap-2 text-xs text-crimson font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xs bg-amber/10 border border-amber/40 flex items-center gap-2 text-xs text-amber font-mono">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Account verified! Initializing session and launching dashboard...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-concrete mb-1.5">
              Full Legal Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Engr. Tariqul Islam"
                className="w-full pl-9 pr-4 py-2 bg-bg-0 border border-border rounded-xs text-sm text-foreground placeholder:text-steel focus:outline-none focus:border-amber transition font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-concrete mb-1.5">
              Corporate / Personal Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@buildtrack.com or your email"
                className="w-full pl-9 pr-4 py-2 bg-bg-0 border border-border rounded-xs text-sm text-foreground placeholder:text-steel focus:outline-none focus:border-amber transition font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-concrete mb-1.5">
              Role Authority Level
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-sm text-foreground focus:outline-none focus:border-amber transition font-mono uppercase cursor-pointer"
            >
              <option value="ADMIN">ADMIN (Executive Director &amp; Full System Governance)</option>
              <option value="PROJECT_MANAGER">PROJECT MANAGER (Scope, Schedule &amp; Team Oversight)</option>
              <option value="SITE_ENGINEER">SITE ENGINEER (Field Execution &amp; Daily Logs)</option>
              <option value="FINANCE_MANAGER">FINANCE MANAGER (Budgets &amp; Earned Value Audits)</option>
              <option value="CONTRACTOR">CONTRACTOR / SUBCONTRACTOR (Task Reports &amp; Material Indents)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-concrete mb-1.5">
              Access Passcode
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-9 pr-4 py-2 bg-bg-0 border border-border rounded-xs text-sm text-foreground placeholder:text-steel focus:outline-none focus:border-amber transition font-mono"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full h-10 text-xs font-mono uppercase tracking-wider font-bold shadow-amber"
          >
            <span>REGISTER &amp; LAUNCH CONSOLE</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="mt-5 text-center text-xs font-mono text-steel">
          Already have an authorized credential?{" "}
          <Link href="/login" className="text-amber hover:underline font-bold">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}

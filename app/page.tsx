"use client";

import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { signIn } from "next-auth/react";
import { Logo, LogoLink } from "@/components/ui/logo";
import {
  Building2,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Boxes,
  FileText,
  Calendar,
  Lock,
  Sun,
  Moon,
  ExternalLink,
} from "@/components/ui/icons";
import { useTheme } from "@/components/theme-provider";
import { ThemedProjectImage } from "@/components/ui/themed-project-image";

// Lazy-load the 3D Hero Digital Twin
const HeroTwinScene = dynamic(
  () => import("@/components/3d/hero-twin").then((mod) => mod.HeroTwinScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[540px] lg:h-[620px] rounded-sm bg-bg-1 border border-border flex items-center justify-center font-mono text-xs text-steel">
        INITIALIZING 3D ENGINE...
      </div>
    ),
  }
);

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const [selectedRole, setSelectedRole] = useState("ADMIN");
  const [launchingRole, setLaunchingRole] = useState(false);

  const handleInstantEnter = async (email: string) => {
    setLaunchingRole(true);
    try {
      await signIn("credentials", {
        email,
        password: "Demo@1234",
        callbackUrl: "/dashboard",
      });
      window.location.href = "/dashboard";
    } catch {
      window.location.href = `/login?email=${email}`;
    }
  };

  const demoRoles = [
    {
      role: "ADMIN",
      email: "admin@buildtrack.com",
      title: "Chief Executive Director",
      scope: "Full system governance, audit trail verification, company config",
    },
    {
      role: "PROJECT_MANAGER",
      email: "pm@buildtrack.com",
      title: "Lead Project Director",
      scope: "Project lifecycle, critical path schedules, contractor oversight",
    },
    {
      role: "SITE_ENGINEER",
      email: "engineer@buildtrack.com",
      title: "Senior Site Lead",
      scope: "Daily progress logs, photographic verification, material consumption",
    },
    {
      role: "FINANCE_MANAGER",
      email: "finance@buildtrack.com",
      title: "Chief Financial Controller",
      scope: "Budget allocations, variance auditing, PDF financial statements",
    },
    {
      role: "CONTRACTOR",
      email: "contractor@buildtrack.com",
      title: "Apex Steel Partner",
      scope: "Task progress reports, material indent requests, delivery logs",
    },
  ];

  const showcaseProjects = [
    {
      name: "Dhaka Metro Rail Line 6 Viaduct",
      location: "Dhaka, Bangladesh",
      budget: "$2.80B",
      status: "IN_PROGRESS",
      progress: 88,
      image: "/images/metro-viaduct.svg",
    },
    {
      name: "Bangabandhu Sub-River Tunnel",
      location: "Karnaphuli River, Chattogram",
      budget: "$1.10B",
      status: "COMPLETED",
      progress: 100,
      image: "/images/karnaphuli-tunnel.svg",
    },
    {
      name: "Padma Bridge Rail Link Corridor",
      location: "Dhaka-Jessore Corridor",
      budget: "$3.12B",
      status: "IN_PROGRESS",
      progress: 92,
      image: "/images/padma-rail-link.svg",
    },
    {
      name: "Matarbari Deep Sea Port",
      location: "Cox's Bazar Coastline",
      budget: "$2.15B",
      status: "IN_PROGRESS",
      progress: 64,
      image: "/images/matarbari-port.svg",
    },
  ];

  return (
    <div className="min-h-screen bg-bg-0 text-foreground transition-colors duration-200 selection:bg-amber selection:text-bg-0">
      {/* Top Engineering Masthead Navigation */}
      <header className="sticky top-0 z-50 bg-bg-0/95 backdrop-blur-md border-b border-border transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 md:h-18 flex items-center justify-between gap-2">
          <LogoLink href="/" size="md" className="py-0.5" />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-7 font-mono text-xs uppercase tracking-wider text-concrete">
            <a href="#digital-twins" className="hover:text-amber transition-colors py-2">
              3D Digital Twins
            </a>
            <a href="#earned-value" className="hover:text-amber transition-colors py-2">
              Earned Value
            </a>
            <a href="#critical-path" className="hover:text-amber transition-colors py-2">
              Critical Path DAG
            </a>
            <a href="#audit-trail" className="hover:text-amber transition-colors py-2">
              Audit Ledger
            </a>
            <a href="#showcase" className="hover:text-amber transition-colors py-2">
              Portfolio
            </a>
            <a href="#workstations" className="hover:text-amber transition-colors py-2">
              Role Access
            </a>
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-xs border border-border text-steel hover:text-amber hover:border-amber/60 transition bg-bg-1/80 backdrop-blur-xs shadow-plate"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>

            <Link
              href="/login"
              className="hidden sm:inline-flex px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xs font-mono text-xs uppercase tracking-wider font-semibold border border-border text-foreground hover:border-amber hover:text-amber transition bg-bg-1/80 shadow-plate"
            >
              Log In
            </Link>

            <Link
              href="/login"
              className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xs font-mono text-[11px] sm:text-xs uppercase tracking-wider font-bold bg-amber text-bg-0 hover:bg-molten hover:text-foreground transition shadow-amber flex items-center gap-1.5"
            >
              <span>Demo Console</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section: Procedural 3D Twin & High-Density Telemetry (2 Columns) */}
      <section className="relative pt-2 sm:pt-4 lg:pt-6 pb-12 sm:pb-16 lg:pb-24 border-b border-border overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-center">
            {/* Left 7 Columns: Product Intent & Role Direct Dispatch */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              <h1 className="font-heading text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-foreground leading-[1.08] break-words">
                AUTONOMOUS <span className="text-amber">3D SITE INTELLIGENCE</span> FOR
                MEGAPROJECTS
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-concrete leading-relaxed max-w-2xl font-body">
                Precision construction intelligence platform uniting real-time 3D structural visual
                twins, earned value variance analysis, directed acyclic graph task scheduling, and
                supply chain telemetry across 5 role authorities.
              </p>

              {/* Primary Call to Action Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4 pt-1 sm:pt-2">
                <Link
                  href="/login"
                  className="w-full sm:w-auto justify-center px-5 py-2.5 sm:py-3 rounded-xs font-mono text-xs uppercase tracking-wider font-bold bg-amber text-bg-0 hover:bg-molten hover:text-foreground transition shadow-amber flex items-center gap-2 text-center"
                >
                  <span>LAUNCH OPERATOR PLATFORM</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </Link>

                <Link
                  href="/api/docs"
                  target="_blank"
                  className="w-full sm:w-auto justify-center px-5 py-2.5 sm:py-3 rounded-xs font-mono text-xs uppercase tracking-wider bg-bg-1 border border-border text-concrete hover:border-amber hover:text-amber transition flex items-center gap-2 shadow-plate text-center"
                >
                  <span>OPENAPI 3.0 SPEC</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </Link>
              </div>

              {/* Role Quick Selector */}
              <div className="pt-2 sm:pt-4 space-y-2">
                <div className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-steel">
                  INSTANT ROLE WORKSTATION SELECTOR:
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {demoRoles.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => setSelectedRole(r.role)}
                      className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-xs font-mono text-[10px] sm:text-xs uppercase tracking-wider border transition ${
                        selectedRole === r.role
                          ? "bg-amber/20 border-amber text-amber font-bold"
                          : "bg-bg-1 border-border text-steel hover:text-foreground"
                      }`}
                    >
                      {r.role.replace("_", " ")}
                    </button>
                  ))}
                </div>

                {/* Selected Role Card */}
                {(() => {
                  const current = demoRoles.find((r) => r.role === selectedRole);
                  return (
                    <div className="p-2.5 sm:p-3 bg-bg-1 border border-border rounded-xs font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2 shadow-plate">
                      <div className="min-w-0">
                        <div className="text-foreground font-bold text-xs sm:text-sm truncate">
                          {current?.title} <span className="text-[11px] text-steel font-normal">({current?.email})</span>
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-steel mt-0.5 line-clamp-2">{current?.scope}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                        <button
                          disabled={launchingRole}
                          onClick={() => handleInstantEnter(current?.email || "admin@buildtrack.com")}
                          className="w-full sm:w-auto justify-center px-3 py-2 sm:py-1.5 bg-amber text-bg-0 hover:bg-molten hover:text-foreground rounded-xs font-bold transition font-mono uppercase text-xs shadow-amber flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <span>1-CLICK ENTER</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          href={`/login?email=${current?.email}`}
                          className="hidden sm:inline-flex px-2.5 py-1.5 bg-bg-2 border border-border text-steel hover:border-amber hover:text-amber rounded-xs font-mono text-xs transition"
                        >
                          OPEN LOGIN
                        </Link>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Right 5 Columns: Interactive 3D Digital Twin Viewer */}
            <div className="lg:col-span-5 w-full">
              <HeroTwinScene />
            </div>
          </div>
        </div>
      </section>

      {/* Telemetry Strip (4 Columns: strictly avoiding 3 feature cards in a row) */}
      <section className="py-8 bg-bg-1 border-b border-border transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 font-mono text-center">
            <div className="p-4 bg-bg-0 border border-border rounded-xs shadow-plate">
              <div className="text-[10px] text-steel tracking-wider uppercase">
                CAPITAL MONITORED
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-amber mt-1">$3.48B</div>
              <div className="text-[10px] text-steel mt-0.5">12 Megaprojects Active</div>
            </div>

            <div className="p-4 bg-bg-0 border border-border rounded-xs shadow-plate">
              <div className="text-[10px] text-steel tracking-wider uppercase">
                ROLLUP COMPLETION
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gold mt-1">68.4%</div>
              <div className="text-[10px] text-steel mt-0.5">Hours-Weighted Rollup</div>
            </div>

            <div className="p-4 bg-bg-0 border border-border rounded-xs shadow-plate">
              <div className="text-[10px] text-steel tracking-wider uppercase">
                CRITICAL PATH UNITS
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-concrete mt-1">180</div>
              <div className="text-[10px] text-steel mt-0.5">Zero Cyclic Dependencies</div>
            </div>

            <div className="p-4 bg-bg-0 border border-border rounded-xs shadow-plate">
              <div className="text-[10px] text-steel tracking-wider uppercase">
                SAFETY INTEGRITY
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-molten mt-1">99.8%</div>
              <div className="text-[10px] text-steel mt-0.5">Zero Lost-Time Incidents</div>
            </div>
          </div>
        </div>
      </section>

      {/* Deep-Dive Module 1: 3D Visual Digital Twins (2 Columns) */}
      <section id="digital-twins" className="py-20 border-b border-border bg-bg-0 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="font-mono text-xs uppercase text-amber tracking-wider">
                FEATURE ARCHITECTURE // MODULE 01
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold uppercase text-foreground leading-tight">
                3D VISUAL DIGITAL TWINS SYNCHRONIZED TO PROGRESS
              </h2>
              <p className="text-sm sm:text-base text-concrete leading-relaxed">
                Every project and structural milestone renders as an interactive Three.js twin.
                Floors illuminate in solid amber as milestones reach verified completion, in-progress
                levels pulse in molten wireframe, and upcoming phases remain ghosted.
              </p>
              <div className="space-y-2 pt-2 font-mono text-xs text-steel">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber" />
                  <span>City-Grid Portfolio Skyline with real-time status coloring</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-molten" />
                  <span>Interactive floor-by-floor structural milestone breakdown</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-gold" />
                  <span>Procedural geometry eliminating multi-megabyte GLTF assets</span>
                </div>
              </div>
            </div>

            {/* Elevated Viaduct Segment Card (with light mode & dark mode 3D image support) */}
            <div className="steel-card p-2 rounded-sm border border-border bg-bg-1 shadow-plate">
              <ThemedProjectImage
                src="/images/metro-viaduct.svg"
                alt="Metro Viaduct Structural Twin - Elevated Span 04"
              />
              <div className="p-3 flex items-center justify-between font-mono text-[11px] text-steel">
                <span>ELEVATED VIADUCT SEGMENT // SPAN-04</span>
                <span className="text-amber font-bold">88% VERIFIED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deep-Dive Module 2: Earned Value Analysis & Overrun Prevention (2 Columns) */}
      <section id="earned-value" className="py-20 border-b border-border bg-bg-1/40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left 6 Columns: Interactive Telemetry Console & 3D Truss Illustration */}
            <div className="lg:col-span-6 steel-card p-4 rounded-sm border border-border bg-bg-1 shadow-plate space-y-4">
              {/* Telemetry Header */}
              <div className="flex items-center justify-between font-mono text-[11px] pb-2 border-b border-border">
                <div className="flex items-center gap-2 text-steel">
                  <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
                  <span className="uppercase tracking-wider font-semibold">
                    CORRIDOR TELEMETRY // SECTOR-08
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-xs bg-amber/10 border border-amber/40 text-amber font-bold">
                  CPI 1.02 · COST VARIANCE +$60M
                </span>
              </div>

              {/* Themed CAD Vector Illustration */}
              <ThemedProjectImage
                src="/images/padma-rail-link.svg"
                alt="Padma Bridge Rail Link Corridor - Double-Deck Steel Warren Truss"
                className="w-full h-auto rounded-xs border border-border"
              />

              {/* Sub-Image Caption & Metric Banner */}
              <div className="p-3 bg-bg-0 border border-border rounded-xs space-y-3">
                <div className="flex items-center justify-between font-mono text-[11px] text-steel">
                  <span className="font-bold text-foreground">PADMA CORRIDOR // HEAVY STEEL TRUSS</span>
                  <span className="text-amber font-extrabold">92% UTILIZATION (VERIFIED)</span>
                </div>

                {/* Real-time EVM Telemetry Strip (4 Columns) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border font-mono text-center">
                  <div className="p-1.5 bg-bg-1 rounded-xs border border-border/80">
                    <div className="text-[9px] text-steel uppercase">BAC (BUDGET)</div>
                    <div className="text-xs font-bold text-foreground mt-0.5">$3.12B</div>
                  </div>
                  <div className="p-1.5 bg-bg-1 rounded-xs border border-border/80">
                    <div className="text-[9px] text-steel uppercase">EV (EARNED)</div>
                    <div className="text-xs font-bold text-amber mt-0.5">$2.87B</div>
                  </div>
                  <div className="p-1.5 bg-bg-1 rounded-xs border border-border/80">
                    <div className="text-[9px] text-steel uppercase">AC (ACTUAL)</div>
                    <div className="text-xs font-bold text-concrete mt-0.5">$2.81B</div>
                  </div>
                  <div className="p-1.5 bg-bg-1 rounded-xs border border-border/80">
                    <div className="text-[9px] text-steel uppercase">CV (VARIANCE)</div>
                    <div className="text-xs font-bold text-gold mt-0.5">+$60M</div>
                  </div>
                </div>

                {/* Structural Milestone Meters */}
                <div className="space-y-1.5 pt-2 border-t border-border font-mono text-[10px]">
                  <div className="flex justify-between text-steel">
                    <span>WARREN STEEL SPANS (41/41 INSTALLED)</span>
                    <span className="text-foreground font-bold">100%</span>
                  </div>
                  <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-amber w-full rounded-full" />
                  </div>

                  <div className="flex justify-between text-steel pt-1">
                    <span>BALLASTLESS TRACK SLAB (154 / 169 KM)</span>
                    <span className="text-foreground font-bold">91.1%</span>
                  </div>
                  <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-gold w-[91.1%] rounded-full" />
                  </div>
                </div>
              </div>

              {/* Console Quick Action Link */}
              <div className="pt-1 flex items-center justify-between font-mono text-xs">
                <span className="text-steel text-[11px]">FINANCE ENGINE RUNTIME: ISOLATED</span>
                <Link
                  href="/login?email=finance@buildtrack.com"
                  className="text-amber hover:text-molten font-bold flex items-center gap-1 transition"
                >
                  <span>LAUNCH FINANCE CONSOLE</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right 6 Columns: Technical Architecture & Capabilities */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-bg-0 border border-border rounded-xs font-mono text-xs text-amber shadow-plate">
                  <span className="w-2 h-2 rounded-full bg-amber" />
                  <span className="font-bold uppercase tracking-wider">
                    FEATURE ARCHITECTURE // MODULE 02
                  </span>
                </div>

                <h2 className="font-heading text-3xl sm:text-4xl font-bold uppercase text-foreground leading-tight">
                  PADMA BRIDGE RAIL LINK // SERVER-SIDE EARNED VALUE VARIANCE AUDITING
                </h2>

                <p className="text-sm sm:text-base text-concrete leading-relaxed font-body">
                  Monitoring the 169-kilometer dual-gauge railway corridor connecting Dhaka to
                  Jessore across the Padma River. All financial summaries, EVM indices, and multi-category
                  expense rollups are computed strictly server-side in isolated transaction boundaries
                  with zero client tampering.
                </p>
              </div>

              {/* 4 Architectural Capability Cards (2x2 Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-bg-0 border border-border rounded-xs shadow-plate space-y-1.5">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber">
                    <span className="w-1.5 h-1.5 bg-amber" />
                    <span>AUTOMATED EVM CALCULATIONS</span>
                  </div>
                  <p className="font-mono text-xs text-steel leading-relaxed">
                    Server evaluates Earned Value (EV = % Progress &times; BAC), computing
                    CPI (EV / AC) and CV (EV - AC) with zero client-side calculation drift.
                  </p>
                </div>

                <div className="p-3.5 bg-bg-0 border border-border rounded-xs shadow-plate space-y-1.5">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-molten">
                    <span className="w-1.5 h-1.5 bg-molten" />
                    <span>80% / 100% OVERRUN INTERCEPT</span>
                  </div>
                  <p className="font-mono text-xs text-steel leading-relaxed">
                    Automated triggers broadcast warnings at 80% category utilization. Transactions
                    exceeding 100% budget allocation are rejected with immutable audit logs.
                  </p>
                </div>

                <div className="p-3.5 bg-bg-0 border border-border rounded-xs shadow-plate space-y-1.5">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-gold">
                    <span className="w-1.5 h-1.5 bg-gold" />
                    <span>3D CYLINDER BUDGET TOWERS</span>
                  </div>
                  <p className="font-mono text-xs text-steel leading-relaxed">
                    WebGL volumetric cylinder towers comparing allocated capital versus real-time
                    actual expenditures across all structural and MEP categories.
                  </p>
                </div>

                <div className="p-3.5 bg-bg-0 border border-border rounded-xs shadow-plate space-y-1.5">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-foreground">
                    <span className="w-1.5 h-1.5 bg-foreground" />
                    <span>CERTIFIED PDF STATEMENTS</span>
                  </div>
                  <p className="font-mono text-xs text-steel leading-relaxed">
                    On-demand, cryptographically verifiable financial balance reports generated via
                    server-side React-PDF streaming pipelines.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/login?email=finance@buildtrack.com"
                  className="px-5 py-2.5 rounded-xs font-mono text-xs uppercase tracking-wider font-bold bg-amber text-bg-0 hover:bg-molten hover:text-foreground transition shadow-amber flex items-center gap-2"
                >
                  <span>LAUNCH CORRIDOR BUDGET WORKSTATION</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/reports"
                  className="px-5 py-2.5 rounded-xs font-mono text-xs uppercase tracking-wider bg-bg-0 border border-border text-concrete hover:border-amber hover:text-amber transition flex items-center gap-2 shadow-plate"
                >
                  <span>FINANCIAL AUDIT REPORTS</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deep-Dive Module 3: Critical Path Gantt & Autonomous Delays (2 Columns) */}
      <section id="critical-path" className="py-20 border-b border-border bg-bg-0 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="font-mono text-xs uppercase text-amber tracking-wider">
                FEATURE ARCHITECTURE // MODULE 03
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold uppercase text-foreground leading-tight">
                DIRECTED ACYCLIC GRAPH CRITICAL PATH SCHEDULING
              </h2>
              <p className="text-sm sm:text-base text-concrete leading-relaxed">
                Pure SVG Gantt chart timeline with curved bezier dependency connectors and automatic
                critical path highlighting. Circular dependency detection via Depth-First Search
                rejects invalid scheduling submissions on the server.
              </p>
              <div className="space-y-2 pt-2 font-mono text-xs text-steel">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber" />
                  <span>Automated delay projection when critical path prerequisites slip</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-molten" />
                  <span>Kanban board with 3D lift physics and optimistic state rollback</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-gold" />
                  <span>Prerequisite transition guard blocking unauthorized task updates</span>
                </div>
              </div>
            </div>

            <div className="steel-card p-2 rounded-sm border border-border bg-bg-1 shadow-plate">
              <ThemedProjectImage
                src="/images/karnaphuli-tunnel.svg"
                alt="Sub-River Tunnel Schedule"
              />
              <div className="p-3 flex items-center justify-between font-mono text-[11px] text-steel">
                <span>BORE EXCAVATION SCHEDULE // DAG ENGINE</span>
                <span className="text-molten font-bold">CRITICAL PATH ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deep-Dive Module 4: Supply Chain Material Indents & Safety (2 Columns) */}
      <section className="py-20 border-b border-border bg-bg-1/40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 steel-card p-2 rounded-sm border border-border bg-bg-1 shadow-plate">
              <ThemedProjectImage
                src="/images/matarbari-port.svg"
                alt="Marine Material Inventory"
              />
              <div className="p-3 flex items-center justify-between font-mono text-[11px] text-steel">
                <span>MARITIME AGGREGATES & REBAR STOCK</span>
                <span className="text-gold font-bold">ZERO OVER-ISSUE</span>
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-4">
              <div className="font-mono text-xs uppercase text-amber tracking-wider">
                FEATURE ARCHITECTURE // MODULE 04
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold uppercase text-foreground leading-tight">
                TRANSACTIONAL MATERIAL INVENTORY SAFETY
              </h2>
              <p className="text-sm sm:text-base text-concrete leading-relaxed">
                Material issues and consumptions are executed within transactional boundaries. The
                system blocks dispatches that exceed on-hand inventory with HTTP 409 Conflict.
                Low-stock thresholds trigger molten amber alerts and notify project directors.
              </p>
              <div className="space-y-2 pt-2 font-mono text-xs text-steel">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber" />
                  <span>3D Warehouse Bay with stacked crate visual inventory scaling</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-molten" />
                  <span>Contractor indent submission and two-stage approval workflows</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-gold" />
                  <span>Immutable ledger of RECEIVE, ISSUE, CONSUME, ADJUST events</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deep-Dive Module 5: Immutable Activity Audit & Compliance Ledger (2 Columns) */}
      <section id="audit-trail" className="py-20 border-b border-border bg-bg-0 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column: Forensic Specifications */}
            <div className="space-y-4">
              <div className="font-mono text-xs uppercase text-amber tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber animate-ping" />
                <span>FEATURE ARCHITECTURE // MODULE 05</span>
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold uppercase text-foreground leading-tight">
                IMMUTABLE AUDIT TRAIL & STATUTORY COMPLIANCE LEDGER
              </h2>
              <p className="text-sm sm:text-base text-concrete leading-relaxed font-body">
                Every project state mutation, earned value disbursement, schedule task dependency
                transition, and material dispatch is chronologically sequenced in a tamper-evident
                audit ledger. Role-based authority checks enforce statutory non-repudiation across
                all 5 operational workstations.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-xs text-steel">
                <div className="p-3 bg-bg-1 border border-border rounded-xs shadow-plate space-y-1">
                  <div className="font-bold text-amber flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-amber" />
                    <span>CRYPTOGRAPHIC SEALS</span>
                  </div>
                  <p className="text-[11px] text-concrete">
                    Records actor identity, verified IP footprint, UTC chronometry, and payload state.
                  </p>
                </div>
                <div className="p-3 bg-bg-1 border border-border rounded-xs shadow-plate space-y-1">
                  <div className="font-bold text-gold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gold" />
                    <span>NON-REPUDIATION RBAC</span>
                  </div>
                  <p className="text-[11px] text-concrete">
                    Unauthorized access attempts and privilege escalations are logged with HTTP 403 blocks.
                  </p>
                </div>
                <div className="p-3 bg-bg-1 border border-border rounded-xs shadow-plate space-y-1">
                  <div className="font-bold text-molten flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-molten" />
                    <span>STATUTORY RETENTION</span>
                  </div>
                  <p className="text-[11px] text-concrete">
                    Compliant with national infrastructure 365-day and 7-year regulatory retention standards.
                  </p>
                </div>
                <div className="p-3 bg-bg-1 border border-border rounded-xs shadow-plate space-y-1">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-foreground" />
                    <span>CERTIFIED EXPORTS</span>
                  </div>
                  <p className="text-[11px] text-concrete">
                    Instant CSV and JSON export pipelines for government comptrollers and external audits.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-xs font-mono text-xs uppercase tracking-wider font-bold bg-amber text-bg-0 hover:bg-molten hover:text-foreground transition shadow-amber flex items-center gap-1.5"
                >
                  <span>ACCESS AUDIT TRAIL WORKSTATION</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Column: Live Simulated High-Density Audit Feed Terminal */}
            <div className="steel-card rounded-sm border border-border bg-bg-1 shadow-plate overflow-hidden">
              {/* Terminal Masthead */}
              <div className="px-4 py-3 bg-bg-0 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs text-steel">
                  <span className="w-2.5 h-2.5 rounded-full bg-crimson inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-gold inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber inline-block" />
                  <span className="text-foreground font-bold ml-1">AUDIT_LOG_STREAM // MERKLE_CHAIN_ACTIVE</span>
                </div>
                <span className="font-mono text-[10px] text-amber uppercase font-bold tracking-wider">
                  TAMPER-EVIDENT
                </span>
              </div>

              {/* Terminal Event Rows */}
              <div className="p-4 space-y-3 font-mono text-xs overflow-x-auto">
                <div className="p-2.5 rounded-xs bg-bg-0 border border-border space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-amber font-bold">SHA256-8F4B...994A</span>
                    <span className="text-steel">2026-11-21 08:44:12 UTC</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded-xs bg-amber/15 text-amber text-[10px] font-bold">
                      APPROVE
                    </span>
                    <span className="text-foreground font-semibold">Expense #EXP-094</span>
                    <span className="text-steel">• $420,000 Disbursement</span>
                  </div>
                  <div className="text-[11px] text-steel">
                    Operator: <span className="text-foreground">Fatima Rahman</span> (FINANCE_MANAGER) • Budget Conformance: 100%
                  </div>
                </div>

                <div className="p-2.5 rounded-xs bg-bg-0 border border-border space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-amber font-bold">SHA256-C31A...829F</span>
                    <span className="text-steel">2026-11-21 08:31:05 UTC</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded-xs bg-gold/15 text-gold text-[10px] font-bold">
                      TRANSITION
                    </span>
                    <span className="text-foreground font-semibold">Task #TSK-210</span>
                    <span className="text-steel">• IN_PROGRESS &rarr; COMPLETED</span>
                  </div>
                  <div className="text-[11px] text-steel">
                    Operator: <span className="text-foreground">Tariq Ahmed</span> (SITE_ENGINEER) • Segment Span-04 Viaduct Verified
                  </div>
                </div>

                <div className="p-2.5 rounded-xs bg-bg-0 border border-border space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-amber font-bold">SHA256-7E19...4D02</span>
                    <span className="text-steel">2026-11-21 08:15:40 UTC</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded-xs bg-amber/15 text-amber text-[10px] font-bold">
                      ISSUE
                    </span>
                    <span className="text-foreground font-semibold">Material #MAT-884</span>
                    <span className="text-steel">• 2,500 Tons Reinforcing Steel</span>
                  </div>
                  <div className="text-[11px] text-steel">
                    Operator: <span className="text-foreground">Kamal Uddin</span> (PROJECT_MANAGER) • Zero Over-Issue Enforced
                  </div>
                </div>

                <div className="p-2.5 rounded-xs bg-bg-0 border border-border space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-crimson font-bold">SHA256-11A0...37E4</span>
                    <span className="text-steel">2026-11-21 07:58:22 UTC</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded-xs bg-crimson/15 text-crimson text-[10px] font-bold">
                      UNAUTHORIZED_ATTEMPT
                    </span>
                    <span className="text-foreground font-semibold">Security Shield Intercept</span>
                  </div>
                  <div className="text-[11px] text-steel">
                    Actor: <span className="text-foreground">Operator Guest</span> • Action BLOCKED (HTTP 403 Forbidden)
                  </div>
                </div>
              </div>

              {/* Terminal Footer */}
              <div className="px-4 py-2.5 bg-bg-0 border-t border-border flex items-center justify-between font-mono text-[10px] text-steel">
                <span>BUFFER STATUS: 100% HEALTHY</span>
                <span className="text-amber font-bold">ZERO MUTATION DRIFT</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Megaproject Showcase Grid (4 Columns: avoiding 3 in a row) */}
      <section id="showcase" className="py-20 border-b border-border bg-bg-0 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="font-mono text-xs uppercase text-amber tracking-wider">
                ACTIVE PORTFOLIO
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold uppercase text-foreground mt-1">
                CIVIL INFRASTRUCTURE PORTFOLIO
              </h2>
            </div>
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-xs border border-border bg-bg-1 hover:border-amber text-amber font-mono text-xs uppercase tracking-wider font-semibold transition flex items-center gap-1.5 shadow-plate self-start sm:self-auto"
            >
              <span>ACCESS FULL 12 PROJECTS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {showcaseProjects.map((p) => (
              <div
                key={p.name}
                className="steel-card p-3 rounded-sm border border-border bg-bg-1 space-y-3 flex flex-col justify-between shadow-plate group hover:border-amber/60 transition"
              >
                <div>
                  <ThemedProjectImage
                    src={p.image}
                    alt={p.name}
                    className="w-full h-40 object-cover rounded-xs border border-border"
                  />
                  <div className="mt-3 font-semibold text-sm text-foreground leading-snug group-hover:text-amber transition-colors">
                    {p.name}
                  </div>
                  <div className="font-mono text-[11px] text-steel mt-0.5">{p.location}</div>
                </div>

                <div className="pt-3 border-t border-border font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-steel uppercase">BUDGET</div>
                      <div className="font-bold text-amber">{p.budget}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-steel uppercase">PROGRESS</div>
                      <div className="font-bold text-gold">{p.progress}%</div>
                    </div>
                  </div>
                  {/* Visual Progress Bar Gauge */}
                  <div className="w-full h-1 bg-border/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber transition-all duration-500 rounded-full"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Workstation Command Center (2 Columns) */}
      <section id="workstations" className="py-20 border-b border-border bg-bg-1/40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div>
            <div className="font-mono text-xs uppercase text-amber tracking-wider">
              AUTHORITY MATRIX
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold uppercase text-foreground mt-1">
              ROLE-BASED WORKSTATIONS
            </h2>
            <p className="text-sm text-concrete mt-1 font-body">
              Every role receives a dedicated interface with server-enforced security boundaries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {demoRoles.map((r) => (
              <div
                key={r.role}
                className="p-5 bg-bg-0 border border-border rounded-xs space-y-3 hover:border-amber transition group shadow-plate"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-xs bg-amber/10 border border-amber/40 text-amber text-xs font-mono font-bold">
                    {r.role.replace("_", " ")}
                  </span>
                  <span className="text-xs font-mono text-steel">PASSWORD: Demo@1234</span>
                </div>

                <div>
                  <div className="font-bold text-base text-foreground group-hover:text-amber transition-colors">
                    {r.title}
                  </div>
                  <div className="text-xs font-mono text-concrete mt-0.5">{r.email}</div>
                </div>

                <p className="text-xs text-steel font-body">{r.scope}</p>

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] font-mono text-steel">1-CLICK DIRECT ACCESS</span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={launchingRole}
                      onClick={() => handleInstantEnter(r.email)}
                      className="font-mono text-xs font-bold text-amber hover:text-molten flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <span>LAUNCH CONSOLE</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Production Footer adhering strictly to Hallmark */}
      <footer className="py-12 bg-bg-0 border-t border-border transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <Logo size="md" />

            <div className="flex flex-wrap items-center gap-6 font-mono text-xs text-steel">
              <Link href="/login" className="hover:text-amber transition">
                OPERATOR LOGIN
              </Link>
              <Link href="/register" className="hover:text-amber transition">
                CREDENTIAL PROVISIONING
              </Link>
              <Link href="/api/docs" target="_blank" className="hover:text-amber transition">
                REST API SPECS
              </Link>
              <a
                href="https://github.com/your-org/buildtrack"
                target="_blank"
                rel="noreferrer"
                className="hover:text-amber transition"
              >
                REPOSITORY
              </a>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-steel">
            <div>
              BUILDTRACK: CIVIL ENGINEERING PROJECT INTELLIGENCE PLATFORM // SPEC-2026
            </div>
            <div>
              DESIGN SYSTEM: FORGED STEEL &amp; MOLTEN AMBER // ZERO FORBIDDEN HUES
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

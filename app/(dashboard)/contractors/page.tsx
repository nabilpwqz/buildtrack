"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users2,
  Plus,
  Star,
  Award,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Download,
  ExternalLink,
  X,
  Boxes,
  CheckSquare,
  Sparkles,
  SlidersHorizontal,
  Clock,
  History,
  Layers,
} from "@/components/ui/icons";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ContractorItem {
  id: string;
  name: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  specialty: string;
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE" | string;
  rating: number;
  avgOnTime: number;
  totalDelays: number;
  reliabilityScore: number;
  projectAssignments?: {
    projectId: string;
    role?: string;
    project: {
      id: string;
      name: string;
      status: string;
      location?: string;
      totalBudget?: number;
      progress?: number;
    };
  }[];
  performances?: {
    id: string;
    projectId?: string;
    onTimeRate: number;
    qualityScore: number;
    delayIncidents: number;
    notes?: string;
    evaluatedAt: string;
  }[];
  assignedTasks?: {
    id: string;
    title: string;
    status: string;
    priority: string;
    deadline: string;
    progress: number;
    project?: { id: string; name: string };
  }[];
  workHistory?: {
    totalProjectsAssigned: number;
    activeProjectsCount: number;
    completedProjectsCount: number;
    totalTasksAssigned: number;
    completedTasksCount: number;
    evaluationsCount: number;
  };
  _count?: {
    projectAssignments: number;
  };
}

interface ProjectOption {
  id: string;
  name: string;
  status: string;
}

const SPECIALTY_OPTIONS = [
  "ALL",
  "Structural Steel & Reinforcement",
  "Geotechnical Piling & Deep Foundations",
  "Pre-stressed Concrete & Viaduct Girders",
  "MEP & Electromechanical Systems",
  "Marine Dredging & Sub-river Tunneling",
  "Ballastless Track & Rail Infrastructure",
];

const STATUS_OPTIONS = ["ALL", "ACTIVE", "SUSPENDED", "INACTIVE"];

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<ContractorItem[]>([]);
  const [metrics, setMetrics] = useState({
    totalFirms: 0,
    avgReliability: 96,
    totalAssignedProjects: 0,
    zeroDelayFirms: 0,
  });
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [rankingSort, setRankingSort] = useState<"COMPOSITE" | "ON_TIME" | "ZERO_DELAYS" | "RATING">("COMPOSITE");
  const [loading, setLoading] = useState(true);
  const [availableProjects, setAvailableProjects] = useState<ProjectOption[]>([]);

  // Register Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("Structural Steel & Reinforcement");
  const [initialStatus, setInitialStatus] = useState("ACTIVE");
  const [submitting, setSubmitting] = useState(false);

  // Dossier Modal state
  const [selectedContractor, setSelectedContractor] = useState<ContractorItem | null>(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [dossierTab, setDossierTab] = useState<"PROJECTS" | "TASKS" | "PERFORMANCE">("PROJECTS");

  // Edit Profile / Status Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCompany, setEditCompany] = useState("");
  const [editName, setEditName] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSpecialty, setEditSpecialty] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Performance Logging Modal state
  const [isPerfModalOpen, setIsPerfModalOpen] = useState(false);
  const [perfProjectId, setPerfProjectId] = useState("");
  const [perfOnTimeRate, setPerfOnTimeRate] = useState(95);
  const [perfQualityScore, setPerfQualityScore] = useState(4.8);
  const [perfDelays, setPerfDelays] = useState(0);
  const [perfNotes, setPerfNotes] = useState("");
  const [perfSubmitting, setPerfSubmitting] = useState(false);

  // Assign Project Modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignProjectId, setAssignProjectId] = useState("");
  const [assignRole, setAssignRole] = useState("Contractor Partner");
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  // Ranked Contractors Computation
  const rankedContractors = useMemo(() => {
    return [...contractors].sort((a, b) => {
      if (rankingSort === "ON_TIME") {
        return (b.avgOnTime || 0) - (a.avgOnTime || 0);
      }
      if (rankingSort === "ZERO_DELAYS") {
        return (a.totalDelays || 0) - (b.totalDelays || 0);
      }
      if (rankingSort === "RATING") {
        return (b.rating || 0) - (a.rating || 0);
      }
      // COMPOSITE: 40% On-Time + 40% Reliability + 20% Zero-Delays index
      const scoreA =
        (a.avgOnTime || 0) * 0.4 +
        (a.reliabilityScore || 0) * 0.4 +
        Math.max(0, 5 - (a.totalDelays || 0)) * 4;
      const scoreB =
        (b.avgOnTime || 0) * 0.4 +
        (b.reliabilityScore || 0) * 0.4 +
        Math.max(0, 5 - (b.totalDelays || 0)) * 4;
      return scoreB - scoreA;
    });
  }, [contractors, rankingSort]);

  const topPodium = useMemo(() => rankedContractors.slice(0, 3), [rankedContractors]);

  const loadContractors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("q", search.trim());
      if (selectedSpecialty !== "ALL") params.append("specialty", selectedSpecialty);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);

      const res = await fetch(`/api/v1/contractors?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setContractors(d.contractors || []);
        if (d.metrics) setMetrics(d.metrics);
      }
    } catch (e) {
      console.error("Failed to load contractors:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableProjects = async () => {
    try {
      const res = await fetch("/api/v1/projects?pageSize=100");
      if (res.ok) {
        const d = await res.json();
        setAvailableProjects(d.projects || []);
        if (d.projects?.length > 0 && !perfProjectId) {
          setPerfProjectId(d.projects[0].id);
          setAssignProjectId(d.projects[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load projects:", e);
    }
  };

  useEffect(() => {
    loadAvailableProjects();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadContractors();
    }, 250);
    return () => clearTimeout(handler);
  }, [search, selectedSpecialty, selectedStatus]);

  const inspectDossier = async (contractorId: string) => {
    setDossierLoading(true);
    try {
      const res = await fetch(`/api/v1/contractors/${contractorId}`);
      if (res.ok) {
        const d = await res.json();
        setSelectedContractor(d.contractor);
      } else {
        const err = await res.json();
        alert(err?.error?.message || "Failed to load contractor dossier");
      }
    } catch (e) {
      console.error("Failed to load contractor dossier:", e);
    } finally {
      setDossierLoading(false);
    }
  };

  const handleRegisterContractor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/contractors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          company,
          contact: contact || name,
          email,
          phone,
          specialty,
          status: initialStatus,
          rating: 5.0,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setName("");
        setCompany("");
        setContact("");
        setEmail("");
        setPhone("");
        setInitialStatus("ACTIVE");
        loadContractors();
      } else {
        const err = await res.json();
        alert(err?.error?.message || "Failed to register contractor");
      }
    } catch (e) {
      console.error("Registration error:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (c: ContractorItem) => {
    setEditCompany(c.company);
    setEditName(c.name);
    setEditContact(c.contact);
    setEditEmail(c.email);
    setEditPhone(c.phone);
    setEditSpecialty(c.specialty);
    setEditStatus(c.status || "ACTIVE");
    setIsEditModalOpen(true);
  };

  const handleUpdateContractor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractor) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/v1/contractors/${selectedContractor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: editCompany,
          name: editName,
          contact: editContact,
          email: editEmail,
          phone: editPhone,
          specialty: editSpecialty,
          status: editStatus,
        }),
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        await inspectDossier(selectedContractor.id);
        loadContractors();
      } else {
        const err = await res.json();
        alert(err?.error?.message || "Failed to update contractor profile");
      }
    } catch (e) {
      console.error("Update contractor error:", e);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleLogPerformance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractor || !perfProjectId) return;
    setPerfSubmitting(true);
    try {
      const res = await fetch(`/api/v1/contractors/${selectedContractor.id}/performance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: perfProjectId,
          onTimeRate: Number(perfOnTimeRate),
          qualityScore: Number(perfQualityScore),
          delayIncidents: Number(perfDelays),
          notes: perfNotes || undefined,
        }),
      });

      if (res.ok) {
        setIsPerfModalOpen(false);
        setPerfNotes("");
        setPerfDelays(0);
        await inspectDossier(selectedContractor.id);
        loadContractors();
      } else {
        const err = await res.json();
        alert(err?.error?.message || "Failed to record performance evaluation");
      }
    } catch (e) {
      console.error("Log performance error:", e);
    } finally {
      setPerfSubmitting(false);
    }
  };

  const handleAssignProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractor || !assignProjectId) return;
    setAssignSubmitting(true);
    try {
      const res = await fetch(`/api/v1/contractors/${selectedContractor.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: assignProjectId,
          role: assignRole,
          action: "ASSIGN",
        }),
      });

      if (res.ok) {
        setIsAssignModalOpen(false);
        await inspectDossier(selectedContractor.id);
        loadContractors();
      } else {
        const err = await res.json();
        alert(err?.error?.message || "Failed to assign project");
      }
    } catch (e) {
      console.error("Assign project error:", e);
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleUnassignProject = async (projectId: string) => {
    if (!selectedContractor) return;
    if (!confirm("Are you sure you want to unassign this contractor firm from this project?")) return;
    try {
      const res = await fetch(`/api/v1/contractors/${selectedContractor.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          action: "UNASSIGN",
        }),
      });

      if (res.ok) {
        await inspectDossier(selectedContractor.id);
        loadContractors();
      } else {
        const err = await res.json();
        alert(err?.error?.message || "Failed to unassign project");
      }
    } catch (e) {
      console.error("Unassign project error:", e);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "Company",
      "Principal Signatory",
      "Specialty",
      "Status",
      "Reliability Score",
      "On-Time Rate",
      "Rating",
      "Delays",
      "Email",
      "Phone",
    ];
    const rows = contractors.map((c) => [
      `"${c.company}"`,
      `"${c.name}"`,
      `"${c.specialty}"`,
      `"${c.status || "ACTIVE"}"`,
      `"${c.reliabilityScore}%"`,
      `"${c.avgOnTime}%"`,
      `"${c.rating}/5.0"`,
      c.totalDelays,
      `"${c.email}"`,
      `"${c.phone}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `buildtrack-subcontractors-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="px-2 py-0.5 rounded-xs bg-amber/10 border border-amber/40 text-amber text-[10px] font-mono font-bold uppercase tracking-wider">
            ACTIVE
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="px-2 py-0.5 rounded-xs bg-crimson/10 border border-crimson/40 text-crimson text-[10px] font-mono font-bold uppercase tracking-wider">
            SUSPENDED
          </span>
        );
      case "INACTIVE":
      default:
        return (
          <span className="px-2 py-0.5 rounded-xs bg-steel/10 border border-steel/40 text-steel text-[10px] font-mono font-bold uppercase tracking-wider">
            INACTIVE
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Masthead Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-wider text-foreground">
              CONTRACTOR DIRECTORY & <span className="text-amber">PERFORMANCE RANKING</span>
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-amber/10 border border-amber/30 text-amber font-mono text-[10px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-amber" />
              FIDIC EPC TIER-1 REGISTRY
            </span>
          </div>
          <p className="text-xs font-mono text-steel uppercase tracking-widest mt-1">
            QUALIFIED FIRMS, CONTACT REPOSITORIES, TASK ALLOCATIONS & PERFORMANCE TRACKING ({contractors.length} FIRMS)
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xs border border-border bg-bg-1 text-foreground hover:text-amber hover:border-amber/50 transition font-mono text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 shadow-plate cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-steel" />
            <span>EXPORT CSV</span>
          </button>

          <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            className="flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>PREQUALIFY CONTRACTOR</span>
          </Button>
        </div>
      </div>

      {/* High-Density Network Telemetry Bar (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xs border border-border bg-bg-1 shadow-plate space-y-1">
          <div className="flex items-center justify-between font-mono text-xs text-steel">
            <span>QUALIFIED PARTNER NETWORK</span>
            <Users2 className="w-4 h-4 text-amber" />
          </div>
          <div className="font-heading text-3xl font-black text-foreground">
            {metrics.totalFirms}
          </div>
          <div className="font-mono text-[10px] text-steel flex items-center gap-1">
            <span className="text-amber">● ACTIVE CONTRACTORS</span>
            <span>• 100% verified</span>
          </div>
        </div>

        <div className="p-4 rounded-xs border border-border bg-bg-1 shadow-plate space-y-1">
          <div className="flex items-center justify-between font-mono text-xs text-steel">
            <span>NETWORK RELIABILITY INDEX</span>
            <Award className="w-4 h-4 text-gold" />
          </div>
          <div className="font-heading text-3xl font-black text-gold">
            {metrics.avgReliability}%
          </div>
          <div className="font-mono text-[10px] text-steel">
            Weighted on-time SLA delivery benchmark
          </div>
        </div>

        <div className="p-4 rounded-xs border border-border bg-bg-1 shadow-plate space-y-1">
          <div className="flex items-center justify-between font-mono text-xs text-steel">
            <span>MEGAPROJECT ALLOCATIONS</span>
            <Building2 className="w-4 h-4 text-foreground" />
          </div>
          <div className="font-heading text-3xl font-black text-foreground">
            {metrics.totalAssignedProjects}
          </div>
          <div className="font-mono text-[10px] text-steel">
            Direct EPC & Joint Venture work packages
          </div>
        </div>

        <div className="p-4 rounded-xs border border-border bg-bg-1 shadow-plate space-y-1">
          <div className="flex items-center justify-between font-mono text-xs text-steel">
            <span>ZERO-DELAY PERFORMANCE</span>
            <ShieldCheck className="w-4 h-4 text-amber" />
          </div>
          <div className="font-heading text-3xl font-black text-amber">
            {metrics.zeroDelayFirms} / {metrics.totalFirms}
          </div>
          <div className="font-mono text-[10px] text-steel">
            Firms with pristine CPM schedule conformance
          </div>
        </div>
      </div>

      {/* TOP 3 PODIUM: CONTRACTOR PERFORMANCE CHAMPIONS */}
      {!loading && topPodium.length >= 3 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber" />
              <h2 className="font-heading text-lg font-black uppercase tracking-wider text-foreground">
                CONTRACTOR PERFORMANCE RANKING &amp; PODIUM
              </h2>
            </div>
            <span className="font-mono text-[10px] text-steel uppercase">
              TOP TIER-1 ENGINEERING PARTNERS BY COMPOSITE PERFORMANCE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rank #1: Gold Champion */}
            {topPodium[0] && (
              <div className="relative p-5 rounded-xs border-2 border-amber bg-bg-1 shadow-plate space-y-3 order-1 md:order-2 overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber text-bg-0 font-mono text-[10px] font-black px-3 py-1 uppercase tracking-wider flex items-center gap-1 shadow-xs">
                  <Award className="w-3.5 h-3.5" />
                  <span>RANK #1 GOLD CHAMPION</span>
                </div>
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-steel uppercase tracking-widest">
                      COMPOSITE: {topPodium[0].reliabilityScore}%
                    </span>
                    {renderStatusBadge(topPodium[0].status || "ACTIVE")}
                  </div>
                  <h3 className="font-heading text-xl font-black text-amber leading-tight mt-1">
                    {topPodium[0].company}
                  </h3>
                  <div className="text-xs font-mono text-concrete mt-0.5">
                    Signatory: <strong className="text-foreground">{topPodium[0].name}</strong>
                  </div>
                  <div className="text-[11px] font-mono text-steel line-clamp-1 mt-1">
                    {topPodium[0].specialty}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border font-mono text-center">
                  <div className="bg-bg-0 p-2 rounded-xs border border-border">
                    <div className="text-[9px] text-steel">RELIABILITY</div>
                    <div className="text-sm font-black text-amber">{topPodium[0].reliabilityScore}%</div>
                  </div>
                  <div className="bg-bg-0 p-2 rounded-xs border border-border">
                    <div className="text-[9px] text-steel">ON-TIME SLA</div>
                    <div className="text-sm font-black text-gold">{topPodium[0].avgOnTime}%</div>
                  </div>
                  <div className="bg-bg-0 p-2 rounded-xs border border-border">
                    <div className="text-[9px] text-steel">DELAYS</div>
                    <div className="text-sm font-black text-gold">{topPodium[0].totalDelays}</div>
                  </div>
                </div>

                <button
                  onClick={() => inspectDossier(topPodium[0].id)}
                  className="w-full py-2 rounded-xs bg-amber hover:bg-molten text-bg-0 hover:text-foreground font-mono text-xs uppercase tracking-wider font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-amber"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>INSPECT CHAMPION DOSSIER</span>
                </button>
              </div>
            )}

            {/* Rank #2: Silver Runner-Up */}
            {topPodium[1] && (
              <div className="relative p-5 rounded-xs border border-border hover:border-steel bg-bg-1 shadow-plate space-y-3 order-2 md:order-1 overflow-hidden">
                <div className="absolute top-0 right-0 bg-bg-2 border-b border-l border-border text-foreground font-mono text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-steel" />
                  <span>RANK #2 SILVER</span>
                </div>
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-steel uppercase tracking-widest">
                      COMPOSITE: {topPodium[1].reliabilityScore}%
                    </span>
                    {renderStatusBadge(topPodium[1].status || "ACTIVE")}
                  </div>
                  <h3 className="font-heading text-lg font-bold text-foreground leading-tight mt-1">
                    {topPodium[1].company}
                  </h3>
                  <div className="text-xs font-mono text-concrete mt-0.5">
                    Signatory: <strong className="text-foreground">{topPodium[1].name}</strong>
                  </div>
                  <div className="text-[11px] font-mono text-steel line-clamp-1 mt-1">
                    {topPodium[1].specialty}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border font-mono text-center">
                  <div className="bg-bg-0 p-2 rounded-xs border border-border">
                    <div className="text-[9px] text-steel">RELIABILITY</div>
                    <div className="text-sm font-black text-foreground">{topPodium[1].reliabilityScore}%</div>
                  </div>
                  <div className="bg-bg-0 p-2 rounded-xs border border-border">
                    <div className="text-[9px] text-steel">ON-TIME SLA</div>
                    <div className="text-sm font-black text-steel">{topPodium[1].avgOnTime}%</div>
                  </div>
                  <div className="bg-bg-0 p-2 rounded-xs border border-border">
                    <div className="text-[9px] text-steel">DELAYS</div>
                    <div className="text-sm font-black text-steel">{topPodium[1].totalDelays}</div>
                  </div>
                </div>

                <button
                  onClick={() => inspectDossier(topPodium[1].id)}
                  className="w-full py-2 rounded-xs border border-border bg-bg-0 hover:bg-bg-2 text-foreground font-mono text-xs uppercase tracking-wider font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Building2 className="w-3.5 h-3.5 text-steel" />
                  <span>INSPECT SILVER DOSSIER</span>
                </button>
              </div>
            )}

            {/* Rank #3: Bronze Performer */}
            {topPodium[2] && (
              <div className="relative p-5 rounded-xs border border-border hover:border-amber/40 bg-bg-1 shadow-plate space-y-3 order-3 overflow-hidden">
                <div className="absolute top-0 right-0 bg-bg-2 border-b border-l border-border text-amber font-mono text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber/80" />
                  <span>RANK #3 BRONZE</span>
                </div>
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-steel uppercase tracking-widest">
                      COMPOSITE: {topPodium[2].reliabilityScore}%
                    </span>
                    {renderStatusBadge(topPodium[2].status || "ACTIVE")}
                  </div>
                  <h3 className="font-heading text-lg font-bold text-foreground leading-tight mt-1">
                    {topPodium[2].company}
                  </h3>
                  <div className="text-xs font-mono text-concrete mt-0.5">
                    Signatory: <strong className="text-foreground">{topPodium[2].name}</strong>
                  </div>
                  <div className="text-[11px] font-mono text-steel line-clamp-1 mt-1">
                    {topPodium[2].specialty}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border font-mono text-center">
                  <div className="bg-bg-0 p-2 rounded-xs border border-border">
                    <div className="text-[9px] text-steel">RELIABILITY</div>
                    <div className="text-sm font-black text-foreground">{topPodium[2].reliabilityScore}%</div>
                  </div>
                  <div className="bg-bg-0 p-2 rounded-xs border border-border">
                    <div className="text-[9px] text-steel">ON-TIME SLA</div>
                    <div className="text-sm font-black text-amber/80">{topPodium[2].avgOnTime}%</div>
                  </div>
                  <div className="bg-bg-0 p-2 rounded-xs border border-border">
                    <div className="text-[9px] text-steel">DELAYS</div>
                    <div className="text-sm font-black text-steel">{topPodium[2].totalDelays}</div>
                  </div>
                </div>

                <button
                  onClick={() => inspectDossier(topPodium[2].id)}
                  className="w-full py-2 rounded-xs border border-border bg-bg-0 hover:bg-bg-2 text-foreground font-mono text-xs uppercase tracking-wider font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Building2 className="w-3.5 h-3.5 text-steel" />
                  <span>INSPECT BRONZE DOSSIER</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Specialty Filter Chips, Status Filter, Ranking Sort & Real-Time Search */}
      <div className="p-4 rounded-xs border border-border bg-bg-1 shadow-plate space-y-4">
        {/* Ranking Criteria Sort Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-1.5 font-mono text-xs flex-wrap">
            <span className="text-[10px] uppercase text-steel font-bold flex items-center gap-1 mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber" />
              RANK BY:
            </span>
            {[
              { id: "COMPOSITE", label: "COMPOSITE INDEX (40/40/20)" },
              { id: "ON_TIME", label: "ON-TIME SLA %" },
              { id: "ZERO_DELAYS", label: "ZERO DELAYS" },
              { id: "RATING", label: "HIGHEST RATING" },
            ].map((sortMode) => (
              <button
                key={sortMode.id}
                onClick={() => setRankingSort(sortMode.id as any)}
                className={cn(
                  "px-2.5 py-1 rounded-xs font-mono text-[11px] uppercase tracking-wider font-bold transition cursor-pointer border",
                  rankingSort === sortMode.id
                    ? "bg-amber text-bg-0 border-amber shadow-amber"
                    : "bg-bg-0 text-steel border-border hover:border-amber/50 hover:text-foreground"
                )}
              >
                {sortMode.label}
              </button>
            ))}
          </div>

          <span className="font-mono text-[10px] text-steel">
            SHOWING {rankedContractors.length} PREQUALIFIED CONTRACTORS
          </span>
        </div>

        {/* Filter Bar: Status & Specialty */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] text-steel uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-amber" /> STATUS:
            </span>
            {STATUS_OPTIONS.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={cn(
                  "px-2.5 py-1 rounded-xs font-mono text-xs uppercase tracking-wider font-bold transition cursor-pointer border",
                  selectedStatus === st
                    ? "bg-amber text-bg-0 border-amber shadow-amber"
                    : "bg-bg-0 text-steel border-border hover:border-amber/50 hover:text-foreground"
                )}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Bar Input */}
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-steel absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by firm name, signatory, trade specialty, or email..."
              className="w-full pl-9 pr-8 py-2 rounded-xs border border-border bg-bg-0 text-foreground font-mono text-xs placeholder:text-steel focus:border-amber focus:outline-none transition shadow-inner"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-steel hover:text-amber"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Specialty Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-border">
          <span className="font-mono text-[11px] text-steel uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-steel" /> TRADE:
          </span>
          {SPECIALTY_OPTIONS.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={cn(
                "px-3 py-1 rounded-xs font-mono text-xs uppercase tracking-wider font-bold transition shrink-0 cursor-pointer border",
                selectedSpecialty === spec
                  ? "bg-amber text-bg-0 border-amber shadow-amber"
                  : "bg-bg-0 text-steel border-border hover:border-amber/50 hover:text-foreground"
              )}
            >
              {spec === "ALL" ? "ALL SPECIALTIES" : spec.split(" ")[0] + " " + (spec.split(" ")[1] || "")}
            </button>
          ))}
        </div>
      </div>

      {/* Subcontractor Grid (4 Columns) */}
      {loading ? (
        <div className="py-20 text-center font-mono text-xs text-steel flex items-center justify-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber animate-ping" />
          <span>QUERYING CONTRACTOR DIRECTORY...</span>
        </div>
      ) : rankedContractors.length === 0 ? (
        <div className="p-12 text-center border border-border bg-bg-1 rounded-xs space-y-3">
          <Users2 className="w-8 h-8 text-steel mx-auto opacity-50" />
          <div className="font-heading text-lg font-bold uppercase text-foreground">
            NO CONTRACTORS MATCH QUERY
          </div>
          <p className="font-mono text-xs text-steel max-w-md mx-auto">
            No prequalified subcontractor firms match the current filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {rankedContractors.map((c, rankIdx) => (
            <div
              key={c.id}
              className="p-4 rounded-xs border border-border bg-bg-1 hover:border-amber/60 transition-all duration-200 shadow-plate space-y-3 relative group flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Top Rank, Status & Rating Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-xs bg-amber/10 border border-amber/40 text-amber text-[10px] font-mono font-bold flex items-center gap-1">
                      <Award className="w-3 h-3 text-amber" />
                      <span>RANK #{rankIdx + 1}</span>
                    </span>
                    {renderStatusBadge(c.status || "ACTIVE")}
                  </div>
                  <span className="text-xs font-mono text-gold flex items-center gap-1 font-semibold">
                    <Star className="w-3 h-3 fill-current text-gold" />
                    <span>{c.rating.toFixed(1)} / 5.0</span>
                  </span>
                </div>

                {/* Company Name & Signatory */}
                <div>
                  <h3 className="font-heading text-base font-bold text-foreground group-hover:text-amber transition-colors leading-snug">
                    {c.company}
                  </h3>
                  <div className="text-xs text-steel font-mono mt-0.5 flex items-center gap-1">
                    <span>Signatory:</span>
                    <span className="text-foreground font-semibold">{c.name}</span>
                  </div>
                </div>

                {/* Specialty Pill */}
                <div className="px-2.5 py-1.5 bg-bg-0 border border-border rounded-xs text-[11px] font-mono text-concrete line-clamp-1">
                  {c.specialty}
                </div>

                {/* Performance Radar Matrix */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border font-mono text-center">
                  <div className="bg-bg-0 p-2 rounded-xs border border-border">
                    <div className="text-[10px] text-steel">RELIABILITY</div>
                    <div className="text-sm font-black text-amber">{c.reliabilityScore}%</div>
                  </div>
                  <div className="bg-bg-0 p-2 rounded-xs border border-border">
                    <div className="text-[10px] text-steel">ON-TIME SLA</div>
                    <div className="text-sm font-black text-gold">{c.avgOnTime}%</div>
                  </div>
                </div>

                {/* Associated Projects & Delays */}
                <div className="flex items-center justify-between font-mono text-[11px] text-steel px-1">
                  <span>
                    Projects: <strong className="text-foreground">{c._count?.projectAssignments || 0}</strong>
                  </span>
                  <span className={c.totalDelays === 0 ? "text-gold font-bold" : "text-crimson font-bold"}>
                    {c.totalDelays === 0 ? "0 Delays" : `${c.totalDelays} Delays`}
                  </span>
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="pt-3 border-t border-border space-y-2">
                <div className="text-[10px] font-mono text-steel flex items-center justify-between">
                  <span className="flex items-center gap-1 truncate max-w-[130px]" title={c.email}>
                    <Mail className="w-3 h-3 text-steel shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-steel shrink-0" />
                    <span>{c.phone}</span>
                  </span>
                </div>

                <button
                  onClick={() => inspectDossier(c.id)}
                  className="w-full py-1.5 rounded-xs border border-border bg-bg-0 hover:bg-bg-2 hover:border-amber/50 text-foreground hover:text-amber transition font-mono text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>INSPECT DOSSIER</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Forensic Contractor Dossier Modal */}
      {selectedContractor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-4xl bg-bg-0 border border-border rounded-xs shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 bg-bg-1 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-amber" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-xl font-bold uppercase text-foreground leading-tight">
                      {selectedContractor.company}
                    </h3>
                    {renderStatusBadge(selectedContractor.status || "ACTIVE")}
                  </div>
                  <p className="font-mono text-xs text-steel">
                    CONTRACTOR DOSSIER // PARTNER ID: {selectedContractor.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(selectedContractor)}
                  className="px-2.5 py-1 rounded-xs border border-border bg-bg-0 hover:bg-bg-2 text-foreground hover:text-amber font-mono text-xs uppercase tracking-wider font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <span>EDIT PROFILE</span>
                </button>
                <button
                  onClick={() => setSelectedContractor(null)}
                  className="p-1 rounded text-steel hover:text-amber transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 font-mono text-xs">
              {/* Compliance & Rating Banner */}
              <div className="p-3 bg-bg-1 border border-border rounded-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <div className="text-[10px] text-steel uppercase font-bold">Prequalification Tier</div>
                  <div className="font-bold text-amber text-sm">FIDIC EPC TIER-1</div>
                </div>
                <div>
                  <div className="text-[10px] text-steel uppercase font-bold">Reliability Score</div>
                  <div className="font-bold text-gold text-sm">{selectedContractor.reliabilityScore}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-steel uppercase font-bold">Quality Rating</div>
                  <div className="font-bold text-foreground text-sm flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current text-gold" />
                    <span>{selectedContractor.rating.toFixed(1)} / 5.0</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-steel uppercase font-bold">Critical Delays</div>
                  <div className={cn("font-bold text-sm", selectedContractor.totalDelays === 0 ? "text-gold" : "text-crimson")}>
                    {selectedContractor.totalDelays} INCIDENTS
                  </div>
                </div>
              </div>

              {/* Corporate Identity & Key Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-bg-1 border border-border rounded-xs space-y-1">
                  <div className="text-[10px] text-steel uppercase">Principal Authorized Signatory</div>
                  <div className="font-bold text-foreground text-sm">{selectedContractor.name}</div>
                  <div className="text-[11px] text-concrete">Contact Reference: {selectedContractor.contact}</div>
                </div>

                <div className="p-3 bg-bg-1 border border-border rounded-xs space-y-1">
                  <div className="text-[10px] text-steel uppercase">Engineering Specialty Trade</div>
                  <div className="font-bold text-amber text-sm">{selectedContractor.specialty}</div>
                  <div className="text-[11px] text-steel flex items-center gap-1">
                    <span>Status:</span>
                    <span className="font-bold">{selectedContractor.status || "ACTIVE"}</span>
                  </div>
                </div>

                <div className="p-3 bg-bg-1 border border-border rounded-xs space-y-1">
                  <div className="text-[10px] text-steel uppercase">Corporate Contact Email</div>
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-steel" />
                    <span>{selectedContractor.email}</span>
                  </div>
                </div>

                <div className="p-3 bg-bg-1 border border-border rounded-xs space-y-1">
                  <div className="text-[10px] text-steel uppercase">Direct Dispatch Telephone</div>
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-steel" />
                    <span>{selectedContractor.phone}</span>
                  </div>
                </div>
              </div>

              {/* Work History Metric Badges */}
              <div className="p-3 bg-bg-1 border border-border rounded-xs space-y-2">
                <div className="text-[10px] text-steel uppercase font-bold flex items-center justify-between">
                  <span>WORK HISTORY & OPERATIONAL PORTFOLIO</span>
                  <span className="text-amber">CUMULATIVE PERFORMANCE METRICS</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
                  <div className="bg-bg-0 p-2 rounded-xs border border-border">
                    <div className="text-[9px] text-steel">TOTAL PROJECTS</div>
                    <div className="text-sm font-black text-foreground">
                      {selectedContractor.workHistory?.totalProjectsAssigned ?? selectedContractor.projectAssignments?.length ?? 0}
                    </div>
                  </div>
                  <div className="bg-bg-0 p-2 rounded-xs border border-border">
                    <div className="text-[9px] text-steel">ACTIVE PROJECTS</div>
                    <div className="text-sm font-black text-amber">
                      {selectedContractor.workHistory?.activeProjectsCount ?? 0}
                    </div>
                  </div>
                  <div className="bg-bg-0 p-2 rounded-xs border border-border">
                    <div className="text-[9px] text-steel">COMPLETED PRJ</div>
                    <div className="text-sm font-black text-gold">
                      {selectedContractor.workHistory?.completedProjectsCount ?? 0}
                    </div>
                  </div>
                  <div className="bg-bg-0 p-2 rounded-xs border border-border">
                    <div className="text-[9px] text-steel">ASSIGNED TASKS</div>
                    <div className="text-sm font-black text-foreground">
                      {selectedContractor.workHistory?.totalTasksAssigned ?? selectedContractor.assignedTasks?.length ?? 0}
                    </div>
                  </div>
                  <div className="bg-bg-0 p-2 rounded-xs border border-border">
                    <div className="text-[9px] text-steel">COMPLETED TASKS</div>
                    <div className="text-sm font-black text-gold">
                      {selectedContractor.workHistory?.completedTasksCount ?? 0}
                    </div>
                  </div>
                  <div className="bg-bg-0 p-2 rounded-xs border border-border">
                    <div className="text-[9px] text-steel">SLA AUDITS</div>
                    <div className="text-sm font-black text-amber">
                      {selectedContractor.workHistory?.evaluationsCount ?? selectedContractor.performances?.length ?? 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dossier Tabs: Projects vs Tasks vs Performance Audits */}
              <div className="flex items-center gap-2 border-b border-border pt-1">
                <button
                  onClick={() => setDossierTab("PROJECTS")}
                  className={cn(
                    "px-3 py-1.5 font-mono text-xs uppercase tracking-wider font-bold border-b-2 transition -mb-px flex items-center gap-1.5 cursor-pointer",
                    dossierTab === "PROJECTS"
                      ? "border-amber text-amber bg-bg-1"
                      : "border-transparent text-steel hover:text-foreground"
                  )}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>ASSIGNED PROJECTS ({selectedContractor.projectAssignments?.length || 0})</span>
                </button>
                <button
                  onClick={() => setDossierTab("TASKS")}
                  className={cn(
                    "px-3 py-1.5 font-mono text-xs uppercase tracking-wider font-bold border-b-2 transition -mb-px flex items-center gap-1.5 cursor-pointer",
                    dossierTab === "TASKS"
                      ? "border-amber text-amber bg-bg-1"
                      : "border-transparent text-steel hover:text-foreground"
                  )}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>ASSIGNED TASKS ({selectedContractor.assignedTasks?.length || 0})</span>
                </button>
                <button
                  onClick={() => setDossierTab("PERFORMANCE")}
                  className={cn(
                    "px-3 py-1.5 font-mono text-xs uppercase tracking-wider font-bold border-b-2 transition -mb-px flex items-center gap-1.5 cursor-pointer",
                    dossierTab === "PERFORMANCE"
                      ? "border-amber text-amber bg-bg-1"
                      : "border-transparent text-steel hover:text-foreground"
                  )}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>PERFORMANCE AUDITS ({selectedContractor.performances?.length || 0})</span>
                </button>
              </div>

              {/* Tab Content: Assigned Megaprojects */}
              {dossierTab === "PROJECTS" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase text-foreground text-xs">
                      Allocated Megaproject Work Packages
                    </span>
                    <button
                      onClick={() => setIsAssignModalOpen(true)}
                      className="px-2.5 py-1 rounded-xs bg-amber/10 border border-amber/40 hover:bg-amber hover:text-bg-0 text-amber font-mono text-[11px] uppercase tracking-wider font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>ASSIGN TO PROJECT</span>
                    </button>
                  </div>

                  {selectedContractor.projectAssignments && selectedContractor.projectAssignments.length > 0 ? (
                    <div className="space-y-2">
                      {selectedContractor.projectAssignments.map((pa) => (
                        <div
                          key={pa.projectId || pa.project.id}
                          className="p-3 rounded-xs bg-bg-1 border border-border flex items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="font-bold text-foreground text-sm flex items-center gap-2">
                              <span>{pa.project.name}</span>
                              <span className="px-2 py-0.5 rounded-xs bg-bg-0 border border-border text-steel text-[10px]">
                                {pa.role || "Partner"}
                              </span>
                            </div>
                            <div className="text-[11px] text-steel flex items-center gap-3">
                              <span>ID: {pa.project.id}</span>
                              {pa.project.location && <span>Loc: {pa.project.location}</span>}
                              {pa.project.progress !== undefined && (
                                <span className="text-amber">Progress: {pa.project.progress}%</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded-xs bg-amber/10 border border-amber/30 text-amber text-[10px] font-bold uppercase">
                              {pa.project.status}
                            </span>
                            <button
                              onClick={() => handleUnassignProject(pa.project.id)}
                              className="px-2 py-1 rounded-xs border border-border bg-bg-0 hover:bg-crimson/10 hover:text-crimson hover:border-crimson/40 text-steel font-mono text-[10px] uppercase font-bold transition cursor-pointer"
                            >
                              UNASSIGN
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xs bg-bg-1 border border-border text-steel text-center italic">
                      No active megaproject assignments recorded for this firm.
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content: Assigned Tasks */}
              {dossierTab === "TASKS" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase text-foreground text-xs">
                      Assigned Site Tasks & Responsibilities
                    </span>
                    <span className="text-steel text-[11px]">
                      Filter: Active Tasks ({selectedContractor.assignedTasks?.length || 0})
                    </span>
                  </div>

                  {selectedContractor.assignedTasks && selectedContractor.assignedTasks.length > 0 ? (
                    <div className="space-y-2">
                      {selectedContractor.assignedTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-3 rounded-xs bg-bg-1 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="font-bold text-foreground text-sm flex items-center gap-2">
                              <span>{task.title}</span>
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase",
                                  task.priority === "URGENT"
                                    ? "bg-crimson/15 text-crimson border border-crimson/40"
                                    : task.priority === "HIGH"
                                      ? "bg-amber/15 text-amber border border-amber/40"
                                      : "bg-steel/15 text-steel border border-steel/40"
                                )}
                              >
                                {task.priority}
                              </span>
                            </div>
                            <div className="text-[11px] text-steel flex items-center gap-3">
                              {task.project && <span>Project: {task.project.name}</span>}
                              <span>Deadline: {new Date(task.deadline).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-bg-0 h-2 rounded-xs border border-border overflow-hidden">
                              <div
                                className="bg-amber h-full transition-all duration-300"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] text-steel w-8 text-right">
                              {task.progress}%
                            </span>
                            <span
                              className={cn(
                                "px-2.5 py-1 rounded-xs text-[10px] font-bold uppercase tracking-wider",
                                task.status === "COMPLETED"
                                  ? "bg-gold/15 text-gold border border-gold/40"
                                  : task.status === "IN_PROGRESS"
                                    ? "bg-amber/15 text-amber border border-amber/40"
                                    : task.status === "REVIEW"
                                      ? "bg-amber/25 text-amber border border-amber/50"
                                      : "bg-steel/15 text-steel border border-steel/40"
                              )}
                            >
                              {task.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xs bg-bg-1 border border-border text-steel text-center italic">
                      No site tasks are currently assigned to this contractor firm.
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content: Performance Tracking & Audits */}
              {dossierTab === "PERFORMANCE" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase text-foreground text-xs">
                      SLA Quality &amp; On-Time Delivery Audits
                    </span>
                    <button
                      onClick={() => setIsPerfModalOpen(true)}
                      className="px-2.5 py-1 rounded-xs bg-amber/10 border border-amber/40 hover:bg-amber hover:text-bg-0 text-amber font-mono text-[11px] uppercase tracking-wider font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>LOG SLA AUDIT</span>
                    </button>
                  </div>

                  {selectedContractor.performances && selectedContractor.performances.length > 0 ? (
                    <div className="space-y-2">
                      {selectedContractor.performances.map((perf) => (
                        <div
                          key={perf.id}
                          className="p-3 rounded-xs bg-bg-1 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="font-bold text-foreground flex items-center gap-3">
                              <span className="text-foreground">Quality: {perf.qualityScore.toFixed(1)} / 5.0</span>
                              <span className="text-steel">•</span>
                              <span className="text-gold">On-Time SLA: {perf.onTimeRate}%</span>
                              <span className="text-steel">•</span>
                              <span className={perf.delayIncidents > 0 ? "text-crimson" : "text-steel"}>
                                Delays: {perf.delayIncidents}
                              </span>
                            </div>
                            {perf.notes && <div className="text-[11px] text-steel">{perf.notes}</div>}
                          </div>
                          <div className="text-right text-[10px] text-steel font-mono shrink-0">
                            Evaluated: {new Date(perf.evaluatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xs bg-bg-1 border border-border text-steel text-center italic">
                      No performance evaluations recorded yet.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-bg-1 border-t border-border flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(selectedContractor)}
                  className="px-3 py-1.5 rounded-xs border border-border bg-bg-0 hover:bg-bg-2 text-foreground font-mono text-xs uppercase tracking-wider font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <span>UPDATE STATUS / PROFILE</span>
                </button>
                <button
                  onClick={() => setIsPerfModalOpen(true)}
                  className="px-3 py-1.5 rounded-xs border border-amber/40 bg-amber/10 text-amber hover:bg-amber hover:text-bg-0 font-mono text-xs uppercase tracking-wider font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>LOG PERFORMANCE REVIEW</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedContractor(null)}
                className="px-4 py-1.5 rounded-xs font-mono text-xs uppercase tracking-wider font-bold bg-amber text-bg-0 hover:bg-molten hover:text-foreground transition shadow-amber cursor-pointer"
              >
                CLOSE DOSSIER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register / Prequalify Contractor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="QUALIFY & REGISTER SUBCONTRACTOR"
        description="Enroll specialized engineering and construction subcontract partner into the FIDIC compliance registry."
      >
        <form onSubmit={handleRegisterContractor} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-xs uppercase text-concrete mb-1 font-semibold">
              Company / Contracting Entity *
            </label>
            <input
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Padma Pre-Cast Engineering Ltd"
              className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs font-mono text-foreground focus:border-amber focus:outline-none transition shadow-inner"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase text-concrete mb-1 font-semibold">
                Authorized Signatory *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Zubair Al-Mamun"
                className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs font-mono text-foreground focus:border-amber focus:outline-none transition shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs uppercase text-concrete mb-1 font-semibold">
                Specialty Division *
              </label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs font-mono text-foreground focus:border-amber focus:outline-none transition cursor-pointer"
              >
                {SPECIALTY_OPTIONS.filter((s) => s !== "ALL").map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase text-concrete mb-1 font-semibold">
                Corporate Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@company.com"
                className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs font-mono text-foreground focus:border-amber focus:outline-none transition shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs uppercase text-concrete mb-1 font-semibold">
                Direct Contact Phone *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880-1711-000000"
                className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs font-mono text-foreground focus:border-amber focus:outline-none transition shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase text-concrete mb-1 font-semibold">
              Initial Contractor Status
            </label>
            <select
              value={initialStatus}
              onChange={(e) => setInitialStatus(e.target.value)}
              className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs font-mono text-foreground focus:border-amber focus:outline-none transition cursor-pointer"
            >
              <option value="ACTIVE">ACTIVE - Qualified for Bidding & Megaproject Allocation</option>
              <option value="SUSPENDED">SUSPENDED - Temporarily Disqualified from Site Work</option>
              <option value="INACTIVE">INACTIVE - Decommissioned / Archive Status</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="text-xs font-mono uppercase"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              className="text-xs font-mono uppercase font-bold"
            >
              Enroll Subcontractor
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Contractor Profile & Status Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="UPDATE CONTRACTOR PROFILE & STATUS"
        description="Modify corporate information, authorized personnel, trade classification, and compliance status."
      >
        <form onSubmit={handleUpdateContractor} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-xs uppercase text-concrete mb-1 font-semibold">
              Company Name *
            </label>
            <input
              type="text"
              required
              value={editCompany}
              onChange={(e) => setEditCompany(e.target.value)}
              className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs font-mono text-foreground focus:border-amber focus:outline-none transition shadow-inner"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase text-concrete mb-1 font-semibold">
                Authorized Signatory *
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs font-mono text-foreground focus:border-amber focus:outline-none transition shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs uppercase text-concrete mb-1 font-semibold">
                Contact Person Reference
              </label>
              <input
                type="text"
                value={editContact}
                onChange={(e) => setEditContact(e.target.value)}
                className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs font-mono text-foreground focus:border-amber focus:outline-none transition shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase text-concrete mb-1 font-semibold">
                Corporate Email *
              </label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs font-mono text-foreground focus:border-amber focus:outline-none transition shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs uppercase text-concrete mb-1 font-semibold">
                Direct Contact Phone *
              </label>
              <input
                type="text"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs font-mono text-foreground focus:border-amber focus:outline-none transition shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase text-concrete mb-1 font-semibold">
                Specialty Division *
              </label>
              <select
                value={editSpecialty}
                onChange={(e) => setEditSpecialty(e.target.value)}
                className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs font-mono text-foreground focus:border-amber focus:outline-none transition cursor-pointer"
              >
                {SPECIALTY_OPTIONS.filter((s) => s !== "ALL").map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase text-concrete mb-1 font-semibold">
                Compliance Status *
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs font-mono text-foreground focus:border-amber focus:outline-none transition cursor-pointer"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="text-xs font-mono uppercase"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={editSubmitting}
              className="text-xs font-mono uppercase font-bold"
            >
              Save Profile Updates
            </Button>
          </div>
        </form>
      </Modal>

      {/* Log Performance Evaluation Modal */}
      <Modal
        isOpen={isPerfModalOpen}
        onClose={() => setIsPerfModalOpen(false)}
        title="RECORD CONTRACTOR SLA EVALUATION"
        description="Conduct quality audit and schedule conformance review for this subcontractor partner."
      >
        <form onSubmit={handleLogPerformance} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-xs uppercase text-concrete mb-1 font-semibold">
              Evaluation Project Context *
            </label>
            <select
              value={perfProjectId}
              onChange={(e) => setPerfProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs font-mono text-foreground focus:border-amber focus:outline-none transition cursor-pointer"
            >
              {availableProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.status})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] uppercase text-concrete mb-1 font-semibold">
                On-Time Rate % (0-100) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={perfOnTimeRate}
                onChange={(e) => setPerfOnTimeRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs font-mono text-foreground focus:border-amber focus:outline-none transition shadow-inner"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase text-concrete mb-1 font-semibold">
                Quality Score (1-5) *
              </label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                required
                value={perfQualityScore}
                onChange={(e) => setPerfQualityScore(Number(e.target.value))}
                className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs font-mono text-foreground focus:border-amber focus:outline-none transition shadow-inner"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase text-concrete mb-1 font-semibold">
                Delay Incidents *
              </label>
              <input
                type="number"
                min="0"
                required
                value={perfDelays}
                onChange={(e) => setPerfDelays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs font-mono text-foreground focus:border-amber focus:outline-none transition shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase text-concrete mb-1 font-semibold">
              Auditor Notes & Observations
            </label>
            <textarea
              rows={3}
              value={perfNotes}
              onChange={(e) => setPerfNotes(e.target.value)}
              placeholder="Detailed evaluation notes on engineering execution, safety protocol compliance, and labor standards..."
              className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs font-mono text-foreground focus:border-amber focus:outline-none transition shadow-inner"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPerfModalOpen(false)}
              className="text-xs font-mono uppercase"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={perfSubmitting}
              className="text-xs font-mono uppercase font-bold"
            >
              Submit SLA Evaluation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign to Project Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="ASSIGN CONTRACTOR TO MEGAPROJECT"
        description="Allocate work package and engineering scope to this subcontractor."
      >
        <form onSubmit={handleAssignProject} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-xs uppercase text-concrete mb-1 font-semibold">
              Select Megaproject *
            </label>
            <select
              value={assignProjectId}
              onChange={(e) => setAssignProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs font-mono text-foreground focus:border-amber focus:outline-none transition cursor-pointer"
            >
              {availableProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase text-concrete mb-1 font-semibold">
              Subcontract Role / Scope *
            </label>
            <input
              type="text"
              required
              value={assignRole}
              onChange={(e) => setAssignRole(e.target.value)}
              placeholder="e.g. Primary Civil Subcontractor, Piling Partner, Structural Steel Fabricator"
              className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-xs font-mono text-foreground focus:border-amber focus:outline-none transition shadow-inner"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAssignModalOpen(false)}
              className="text-xs font-mono uppercase"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={assignSubmitting}
              className="text-xs font-mono uppercase font-bold"
            >
              Confirm Work Allocation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

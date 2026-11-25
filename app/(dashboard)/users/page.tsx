"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Plus,
  User,
  Mail,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  Building2,
  KeyRound,
  Check,
  X,
  Zap,
  Clock,
  ArrowRight,
  SlidersHorizontal,
  ChevronDown,
} from "@/components/ui/icons";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ROLE_CAPABILITIES } from "@/lib/rbac";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  contractorId?: string | null;
  contractor?: {
    id: string;
    name: string;
    company: string;
  } | null;
  _count?: {
    assignedTasks: number;
    managedProjects: number;
  };
}

const ROLE_DEFINITIONS = [
  {
    role: "ADMIN",
    label: "Administrator",
    level: "Tier 5 (Master Governance)",
    desc: "Manage company information, manage users and permissions, view all construction projects, monitor company-wide project activities, configure system settings, access overall analytics.",
    capabilities: ROLE_CAPABILITIES.ADMIN,
    badgeClass: "bg-crimson/15 text-crimson border-crimson/40",
  },
  {
    role: "PROJECT_MANAGER",
    label: "Project Manager",
    level: "Tier 4 (CPM & Scope Lead)",
    desc: "Create and manage projects, assign project tasks, set task priorities and deadlines, monitor project progress, manage project milestones, monitor project budgets, identify delayed tasks, review site reports.",
    capabilities: ROLE_CAPABILITIES.PROJECT_MANAGER,
    badgeClass: "bg-amber/15 text-amber border-amber/40",
  },
  {
    role: "SITE_ENGINEER",
    label: "Site Engineer",
    level: "Tier 3 (Field Operations)",
    desc: "Submit daily progress updates, update task status, record material usage, upload site progress photographs, submit construction site reports, report construction delays, monitor assigned site activities.",
    capabilities: ROLE_CAPABILITIES.SITE_ENGINEER,
    badgeClass: "bg-concrete/15 text-concrete border-border",
  },
  {
    role: "FINANCE_MANAGER",
    label: "Finance Manager",
    level: "Tier 2 (Fiscal & EVM)",
    desc: "Manage project budgets, record project expenses, manage expense categories, monitor budget utilization, compare estimated and actual costs, generate financial reports, identify budget overruns.",
    capabilities: ROLE_CAPABILITIES.FINANCE_MANAGER,
    badgeClass: "bg-gold/15 text-gold border-gold/40",
  },
  {
    role: "CONTRACTOR",
    label: "Contractor",
    level: "Tier 1 (Subcontractor)",
    desc: "View assigned projects, view assigned tasks, update task progress, submit material requests, upload work progress reports, view task deadlines.",
    capabilities: ROLE_CAPABILITIES.CONTRACTOR,
    badgeClass: "bg-molten/15 text-molten border-molten/40",
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [showMatrix, setShowMatrix] = useState(false);

  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Demo@1234");
  const [role, setRole] = useState("SITE_ENGINEER");
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Edit Modal state
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/users");
      if (res.ok) {
        const d = await res.json();
        setUsers(d.users || []);
      }
    } catch (e) {
      console.error("Failed to load users:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      if (res.ok) {
        setIsCreateModalOpen(false);
        setName("");
        setEmail("");
        setPassword("Demo@1234");
        setRole("SITE_ENGINEER");
        setStatusMessage(`Successfully provisioned account for ${name}.`);
        setTimeout(() => setStatusMessage(null), 3500);
        loadUsers();
      } else {
        const err = await res.json();
        alert(err?.error?.message || "Failed to create user account");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditSubmitting(true);
    try {
      const payload: any = {
        id: editingUser.id,
        role: editRole,
        status: editStatus,
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const res = await fetch("/api/v1/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEditingUser(null);
        setEditPassword("");
        setStatusMessage(`Operator account for ${editingUser.name} updated.`);
        setTimeout(() => setStatusMessage(null), 3500);
        loadUsers();
      } else {
        const err = await res.json();
        alert(err?.error?.message || "Failed to update user");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleToggleSuspend = async (u: UserRecord) => {
    const newStatus = u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const confirmMsg = u.status === "ACTIVE"
      ? `Are you sure you want to SUSPEND ${u.name}'s access privileges?`
      : `Re-activate ${u.name}'s operator clearance?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/v1/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: u.id, status: newStatus }),
      });

      if (res.ok) {
        setStatusMessage(`${u.name} status transitioned to ${newStatus}.`);
        setTimeout(() => setStatusMessage(null), 3500);
        loadUsers();
      } else {
        const err = await res.json();
        alert(err?.error?.message || "Action failed");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openEditModal = (u: UserRecord) => {
    setEditingUser(u);
    setEditRole(u.role);
    setEditStatus(u.status);
    setEditPassword("");
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.contractor?.company && u.contractor.company.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole = selectedRoleFilter === "ALL" || u.role === selectedRoleFilter;
      const matchesStatus = selectedStatusFilter === "ALL" || u.status === selectedStatusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, selectedRoleFilter, selectedStatusFilter]);

  // Telemetry Aggregations
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.status === "ACTIVE").length,
      directors: users.filter((u) => u.role === "ADMIN" || u.role === "PROJECT_MANAGER").length,
      engineers: users.filter((u) => u.role === "SITE_ENGINEER").length,
      contractors: users.filter((u) => u.role === "CONTRACTOR").length,
    };
  }, [users]);

  return (
    <div className="space-y-6 pb-12 transition-colors duration-200">
      {/* Masthead Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-xs bg-amber/10 border border-amber/30 text-amber font-mono text-[10px] font-bold uppercase tracking-wider mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ROLE-BASED ACCESS CONTROL (RBAC) GOVERNANCE</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-tight text-foreground">
            OPERATOR ACCOUNTS & <span className="text-amber">SECURITY CLEARANCE</span>
          </h1>
          <p className="text-xs font-mono text-steel uppercase tracking-wider mt-1">
            CRYPTOGRAPHIC CREDENTIAL ENROLLMENT, CLEARANCE TIERS & FIELD AUTHORITY
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMatrix(!showMatrix)}
            className="px-3 py-1.5 rounded-xs border border-border bg-bg-1 hover:border-amber text-steel hover:text-foreground font-mono text-xs uppercase tracking-wider transition shadow-plate flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-steel" />
            <span>{showMatrix ? "HIDE MATRIX" : "PERMISSIONS MATRIX"}</span>
          </button>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="primary"
            className="px-4 py-1.5 rounded-xs font-mono text-xs uppercase tracking-wider font-bold bg-amber text-bg-0 hover:bg-molten hover:text-foreground transition shadow-amber flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>PROVISION OPERATOR</span>
          </Button>
        </div>
      </div>

      {/* Confirmation Banner */}
      {statusMessage && (
        <div className="p-3 bg-gold/15 border border-gold/40 text-gold text-xs font-mono flex items-center gap-2.5 rounded-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-gold" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Top 4 Telemetry Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-mono">
        <div className="p-3 sm:p-4 bg-bg-1 border border-border rounded-xs shadow-plate space-y-1">
          <div className="text-[10px] text-steel uppercase tracking-wider">TOTAL OPERATORS</div>
          <div className="text-2xl sm:text-3xl font-bold text-foreground">{stats.total}</div>
          <div className="text-[10px] text-gold">{stats.active} Active Clearance</div>
        </div>

        <div className="p-3 sm:p-4 bg-bg-1 border border-border rounded-xs shadow-plate space-y-1">
          <div className="text-[10px] text-steel uppercase tracking-wider">DIRECTORATE & PMS</div>
          <div className="text-2xl sm:text-3xl font-bold text-amber">{stats.directors}</div>
          <div className="text-[10px] text-steel">Tier 4 & Tier 5 Clearance</div>
        </div>

        <div className="p-3 sm:p-4 bg-bg-1 border border-border rounded-xs shadow-plate space-y-1">
          <div className="text-[10px] text-steel uppercase tracking-wider">FIELD CADRE (ENGINEERS)</div>
          <div className="text-2xl sm:text-3xl font-bold text-concrete">{stats.engineers}</div>
          <div className="text-[10px] text-steel">Daily Logs & Inspection</div>
        </div>

        <div className="p-3 sm:p-4 bg-bg-1 border border-border rounded-xs shadow-plate space-y-1">
          <div className="text-[10px] text-steel uppercase tracking-wider">SUBCONTRACTORS</div>
          <div className="text-2xl sm:text-3xl font-bold text-molten">{stats.contractors}</div>
          <div className="text-[10px] text-steel">Indents & Task Execution</div>
        </div>
      </div>

      {/* Role Clearance Matrix Drawer */}
      {showMatrix && (
        <Card className="bg-bg-1 border-amber/40 shadow-plate animate-in fade-in duration-200">
          <CardHeader className="pb-2 border-b border-border/60">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-amber flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber" />
                <span>5-TIER RBAC CLEARANCE SPECIFICATION</span>
              </span>
              <span className="text-[10px] text-steel">ISO 27001 CONFORMANT</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 font-mono text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {ROLE_DEFINITIONS.map((def) => (
                <div key={def.role} className="p-3 bg-bg-0 border border-border rounded-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold border ${def.badgeClass}`}>
                      {def.role.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-steel">{def.level}</span>
                  </div>
                  <div className="font-bold text-foreground text-xs">{def.label}</div>
                  <div className="text-[11px] text-steel leading-relaxed">{def.desc}</div>
                  <div className="pt-2 border-t border-border/60 space-y-1">
                    <span className="text-[10px] font-bold text-amber uppercase tracking-wider block">
                      Enforced Capabilities:
                    </span>
                    <ul className="space-y-0.5 text-[10px] text-concrete">
                      {def.capabilities.map((cap) => (
                        <li key={cap} className="flex items-start gap-1.5">
                          <Check className="w-3 h-3 text-gold shrink-0 mt-0.5" />
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search & Multi-Filter Control Strip */}
      <div className="p-3 bg-bg-1 border border-border rounded-xs shadow-plate flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-steel absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by operator name, email, or company..."
            className="w-full pl-9 pr-3 py-1.5 bg-bg-0 border border-border rounded-xs text-foreground placeholder:text-steel focus:border-amber focus:outline-none"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-steel text-[10px] uppercase">ROLE:</span>
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="px-2 py-1 bg-bg-0 border border-border rounded-xs text-foreground focus:border-amber focus:outline-none text-[11px]"
            >
              <option value="ALL">ALL ROLES</option>
              <option value="ADMIN">ADMIN</option>
              <option value="PROJECT_MANAGER">PROJECT MANAGER</option>
              <option value="FINANCE_MANAGER">FINANCE MANAGER</option>
              <option value="SITE_ENGINEER">SITE ENGINEER</option>
              <option value="CONTRACTOR">CONTRACTOR</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-steel text-[10px] uppercase">STATUS:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-2 py-1 bg-bg-0 border border-border rounded-xs text-foreground focus:border-amber focus:outline-none text-[11px]"
            >
              <option value="ALL">ALL STATUSES</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          {(searchQuery || selectedRoleFilter !== "ALL" || selectedStatusFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedRoleFilter("ALL");
                setSelectedStatusFilter("ALL");
              }}
              className="px-2 py-1 bg-bg-2 border border-border text-steel hover:text-amber rounded-xs text-[10px]"
            >
              RESET
            </button>
          )}
        </div>
      </div>

      {/* Operator Accounts Ledger Table */}
      <div className="bg-bg-1 border border-border rounded-xs overflow-hidden shadow-plate divide-y divide-border font-mono text-xs">
        {loading ? (
          <div className="p-8 text-center text-steel">
            <div className="inline-block w-5 h-5 border-2 border-amber border-t-transparent rounded-full animate-spin mb-2" />
            <div>Synchronizing operator clearance records...</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-steel space-y-1">
            <div className="text-foreground font-bold">No Operator Accounts Found</div>
            <div className="text-[11px]">Adjust your search query or clearance filter criteria.</div>
          </div>
        ) : (
          filteredUsers.map((u) => {
            const roleMeta = ROLE_DEFINITIONS.find((r) => r.role === u.role);
            return (
              <div
                key={u.id}
                className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 hover:bg-bg-2/60 transition"
              >
                {/* Left: Identity & Initial Badge */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xs bg-bg-0 border border-border flex items-center justify-center text-amber font-bold text-sm shrink-0 shadow-plate">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-xs sm:text-sm truncate">
                        {u.name}
                      </span>
                      {u.status === "ACTIVE" ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" title="Active Clearance" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-crimson shrink-0" title="Suspended / Inactive" />
                      )}
                    </div>
                    <div className="text-[11px] text-steel flex flex-wrap items-center gap-2 truncate">
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </span>
                      {u.contractor?.company && (
                        <span className="text-concrete">
                          &bull; {u.contractor.company}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle: Workload & Role Badge */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
                  {/* Assigned Workload Pill */}
                  <div className="text-[10px] text-steel px-2 py-0.5 bg-bg-0 border border-border rounded-xs">
                    <span>TASKS: {u._count?.assignedTasks || 0}</span>
                    <span className="mx-1.5 text-border">|</span>
                    <span>PROJECTS: {u._count?.managedProjects || 0}</span>
                  </div>

                  {/* Role Badge */}
                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-bold rounded-xs border uppercase tracking-wider ${
                      roleMeta?.badgeClass || "bg-steel/15 text-steel border-steel"
                    }`}
                  >
                    {u.role.replace("_", " ")}
                  </span>

                  {/* Status Badge */}
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-xs border uppercase ${
                      u.status === "ACTIVE"
                        ? "bg-gold/15 text-gold border-gold/40"
                        : "bg-crimson/15 text-crimson border-crimson/40"
                    }`}
                  >
                    {u.status}
                  </span>
                </div>

                {/* Right: Operational Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/50">
                  <button
                    type="button"
                    onClick={() => openEditModal(u)}
                    className="px-2.5 py-1 rounded-xs bg-bg-0 border border-border hover:border-amber text-steel hover:text-foreground text-[10px] uppercase font-bold transition shadow-plate"
                  >
                    EDIT CLEARANCE
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleSuspend(u)}
                    className={`px-2.5 py-1 rounded-xs border text-[10px] uppercase font-bold transition shadow-plate ${
                      u.status === "ACTIVE"
                        ? "bg-bg-0 border-border hover:border-crimson text-steel hover:text-crimson"
                        : "bg-gold/20 border-gold text-gold"
                    }`}
                  >
                    {u.status === "ACTIVE" ? "SUSPEND" : "REACTIVATE"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PROVISION OPERATOR MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="PROVISION OPERATOR ACCOUNT"
        description="Configure cryptographic credentials and assign RBAC clearance tier."
      >
        <form onSubmit={handleCreateUser} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-concrete mb-1 font-bold uppercase text-[10px]">
              Operator Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engr. Asif Zaman"
              className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:border-amber focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-concrete mb-1 font-bold uppercase text-[10px]">
              Corporate Authentication Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="asif@buildtrack.internal"
              className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:border-amber focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-concrete mb-1 font-bold uppercase text-[10px]">
              RBAC Role Authority Tier *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:border-amber focus:outline-none"
            >
              <option value="SITE_ENGINEER">SITE ENGINEER - Tier 2 (Field Logs & Task Execution)</option>
              <option value="PROJECT_MANAGER">PROJECT MANAGER - Tier 4 (Scope, CPM & Team Lead)</option>
              <option value="FINANCE_MANAGER">FINANCE MANAGER - Tier 3 (Budgets & EVM Audits)</option>
              <option value="CONTRACTOR">CONTRACTOR - Tier 1 (Subcontractor Portal)</option>
              <option value="ADMIN">ADMINISTRATOR - Tier 5 (Master Directorate Control)</option>
            </select>
          </div>

          <div>
            <label className="block text-concrete mb-1 font-bold uppercase text-[10px]">
              Initial Temporary Passcode *
            </label>
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:border-amber focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-1.5 rounded-xs font-mono text-xs uppercase"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              className="px-5 py-1.5 rounded-xs font-mono text-xs uppercase font-bold bg-amber text-bg-0 hover:bg-molten"
            >
              Provision Operator
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT OPERATOR CLEARANCE MODAL */}
      <Modal
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title="UPDATE OPERATOR CLEARANCE"
        description={`Modify role authority and operational clearance for ${editingUser?.name}.`}
      >
        <form onSubmit={handleUpdateUser} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-concrete mb-1 font-bold uppercase text-[10px]">
              Operator Email (Identity)
            </label>
            <div className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-steel">
              {editingUser?.email}
            </div>
          </div>

          <div>
            <label className="block text-concrete mb-1 font-bold uppercase text-[10px]">
              Role Authority Level *
            </label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:border-amber focus:outline-none"
            >
              <option value="ADMIN">ADMIN - Tier 5 (Executive Governance)</option>
              <option value="PROJECT_MANAGER">PROJECT MANAGER - Tier 4 (Lifecycle & CPM DAG)</option>
              <option value="FINANCE_MANAGER">FINANCE MANAGER - Tier 3 (Fiscal & EVM Audits)</option>
              <option value="SITE_ENGINEER">SITE ENGINEER - Tier 2 (Field Operations)</option>
              <option value="CONTRACTOR">CONTRACTOR - Tier 1 (Subcontractor Portal)</option>
            </select>
          </div>

          <div>
            <label className="block text-concrete mb-1 font-bold uppercase text-[10px]">
              Account Status *
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:border-amber focus:outline-none"
            >
              <option value="ACTIVE">ACTIVE (Full Platform Access)</option>
              <option value="SUSPENDED">SUSPENDED (Access Intercepted)</option>
              <option value="INACTIVE">INACTIVE (Archived)</option>
            </select>
          </div>

          <div>
            <label className="block text-concrete mb-1 font-bold uppercase text-[10px]">
              Reset Password (Optional)
            </label>
            <input
              type="text"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="Leave blank to retain current password"
              className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:border-amber focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingUser(null)}
              className="px-4 py-1.5 rounded-xs font-mono text-xs uppercase"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={editSubmitting}
              className="px-5 py-1.5 rounded-xs font-mono text-xs uppercase font-bold bg-amber text-bg-0 hover:bg-molten"
            >
              Commit Updates
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

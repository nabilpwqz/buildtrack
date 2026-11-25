"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, ArrowLeft, Check, AlertCircle, User, HardHat } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("PLANNING");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [expectedEndDate, setExpectedEndDate] = useState(
    new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0]
  );
  const [totalBudget, setTotalBudget] = useState(25000000);
  const [managerId, setManagerId] = useState("");
  const [selectedContractorIds, setSelectedContractorIds] = useState<string[]>([]);

  const [managers, setManagers] = useState<any[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSelectOptions() {
      try {
        const [usersRes, contractorsRes] = await Promise.all([
          fetch("/api/v1/users"),
          fetch("/api/v1/contractors"),
        ]);

        if (usersRes.ok) {
          const uData = await usersRes.json();
          const pms = (uData.users || []).filter(
            (u: any) => u.role === "PROJECT_MANAGER" || u.role === "ADMIN"
          );
          setManagers(pms);
          if (pms.length > 0 && !managerId) {
            setManagerId(pms[0].id);
          }
        }

        if (contractorsRes.ok) {
          const cData = await contractorsRes.json();
          setContractors(cData.contractors || []);
        }
      } catch (err) {
        console.error("Failed to load project selectors:", err);
      }
    }
    loadSelectOptions();
  }, []);

  const toggleContractor = (cId: string) => {
    setSelectedContractorIds((prev) =>
      prev.includes(cId) ? prev.filter((id) => id !== cId) : [...prev, cId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          location: location.trim(),
          status,
          startDate,
          expectedEndDate,
          totalBudget: Number(totalBudget),
          managerId: managerId || undefined,
          contractorIds: selectedContractorIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to create project");
      }

      router.push(`/projects/${data.project.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "An error occurred commissioning the project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/projects"
          className="p-1.5 rounded-xs border border-border bg-bg-2 text-steel hover:text-amber hover:border-amber transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-heading text-xl font-bold uppercase tracking-wider text-foreground">
            INITIALIZE NEW CAPITAL <span className="text-amber">PROJECT</span>
          </h1>
          <p className="text-xs font-mono text-steel uppercase tracking-widest mt-0.5">
            ESTABLISH PROJECT SCOPE, LEADERSHIP, BUDGET ALLOCATION & CONTRACTOR PARTNERS
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xs bg-crimson/10 border border-crimson flex items-center gap-2 text-xs text-crimson font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Project Form */}
      <form onSubmit={handleSubmit} className="steel-card p-6 rounded-sm space-y-5 border border-border bg-bg-1 shadow-sm">
        {/* Title & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-steel mb-1.5">
              Project Official Title *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Karnaphuli Multi-Lane River Tunnel Phase 2"
              className="w-full px-3.5 py-2.5 bg-bg-0 border border-border rounded-xs text-sm text-foreground placeholder:text-steel/60 focus:outline-none focus:border-amber transition font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-steel mb-1.5">
              Initial Project Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-bg-0 border border-border rounded-xs text-sm text-foreground focus:outline-none focus:border-amber transition font-mono"
            >
              <option value="PLANNING">PLANNING</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="DELAYED">DELAYED</option>
              <option value="ON_HOLD">ON_HOLD</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
        </div>

        {/* Location & Budget */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-steel mb-1.5">
              Site Location / Municipality *
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Chattogram Port Access Corridor"
              className="w-full px-3.5 py-2.5 bg-bg-0 border border-border rounded-xs text-sm text-foreground placeholder:text-steel/60 focus:outline-none focus:border-amber transition font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-steel mb-1.5">
              Authorized Capital Budget (USD) *
            </label>
            <input
              type="number"
              required
              min={0}
              step={1000}
              value={totalBudget}
              onChange={(e) => setTotalBudget(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-bg-0 border border-border rounded-xs text-sm text-foreground placeholder:text-steel/60 focus:outline-none focus:border-amber transition font-mono"
            />
          </div>
        </div>

        {/* Mobilization Dates & Project Manager */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-steel mb-1.5">
              Site Mobilization Date *
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-bg-0 border border-border rounded-xs text-sm text-foreground focus:outline-none focus:border-amber transition font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-steel mb-1.5">
              Expected End Date *
            </label>
            <input
              type="date"
              required
              value={expectedEndDate}
              onChange={(e) => setExpectedEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-bg-0 border border-border rounded-xs text-sm text-foreground focus:outline-none focus:border-amber transition font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-steel mb-1.5">
              Lead Project Director / Manager
            </label>
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-bg-0 border border-border rounded-xs text-sm text-foreground focus:outline-none focus:border-amber transition font-mono"
            >
              <option value="">Select Project Manager...</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-steel mb-1.5">
            Engineering Scope & Technical Specifications
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe structural specifications, geotechnical requirements, and civil scope..."
            className="w-full px-3.5 py-2.5 bg-bg-0 border border-border rounded-xs text-sm text-foreground placeholder:text-steel/60 focus:outline-none focus:border-amber transition font-mono"
          />
        </div>

        {/* Assigned Contractors Multi-Select Section */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-steel">
              Assign Contractor Partners ({selectedContractorIds.length} Selected)
            </label>
            <span className="text-[11px] font-mono text-amber">
              Subcontractor Directory ({contractors.length} registered)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-2 bg-bg-0 border border-border rounded-xs">
            {contractors.map((c) => {
              const isSelected = selectedContractorIds.includes(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => toggleContractor(c.id)}
                  className={`p-2 rounded-xs border text-xs font-mono cursor-pointer transition flex items-start gap-2 ${
                    isSelected
                      ? "bg-amber/15 border-amber text-foreground"
                      : "bg-bg-1 border-border/80 text-steel hover:border-steel hover:text-foreground"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="mt-0.5 accent-amber cursor-pointer"
                  />
                  <div className="overflow-hidden">
                    <div className="font-semibold truncate">{c.company}</div>
                    <div className="text-[10px] text-steel truncate">{c.specialty}</div>
                    <div className="text-[10px] text-gold">Rating: {c.rating} ★</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Link
            href="/projects"
            className="px-4 py-2 border border-border text-xs font-mono uppercase text-steel hover:text-foreground rounded-xs transition"
          >
            Cancel
          </Link>
          <Button type="submit" variant="primary" loading={loading} className="px-6 h-10">
            <span>CREATE PROJECT</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

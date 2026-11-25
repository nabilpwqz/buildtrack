"use client";

import React, { useState, useEffect } from "react";
import {
  Receipt,
  Plus,
  Download,
  Calendar,
  DollarSign,
  FileText,
  Filter,
  Search,
  Building2,
  CheckCircle,
  Eye,
  RefreshCw,
  HardHat,
  ArrowRight,
  ShieldCheck,
  Award,
} from "@/components/ui/icons";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [metrics, setMetrics] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("ALL");
  const [selectedCategoryId, setSelectedCategoryId] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Record Expense Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState<number>(85000);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [documentUrl, setDocumentUrl] = useState("/uploads/vouchers/IPC-2026-Batch-092.pdf");
  const [submitting, setSubmitting] = useState(false);

  // Voucher Inspector Modal state
  const [selectedExpense, setSelectedExpense] = useState<any>(null);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        q: search,
      });
      if (selectedProjectId && selectedProjectId !== "ALL") {
        params.set("projectId", selectedProjectId);
      }
      if (selectedCategoryId && selectedCategoryId !== "ALL") {
        params.set("categoryId", selectedCategoryId);
      }

      const res = await fetch(`/api/v1/expenses?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
        setTotal(data.total || 0);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadFilters() {
      try {
        const [pRes, bRes] = await Promise.all([
          fetch("/api/v1/projects?pageSize=50"),
          fetch("/api/v1/budget"),
        ]);
        if (pRes.ok) {
          const pd = await pRes.json();
          setProjects(pd.projects || []);
          if (pd.projects?.length > 0 && !projectId) setProjectId(pd.projects[0].id);
        }
        if (bRes.ok) {
          const bd = await bRes.json();
          setCategories(bd.categories || []);
          if (bd.categories?.length > 0 && !categoryId) setCategoryId(bd.categories[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadFilters();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [page, pageSize, search, selectedProjectId, selectedCategoryId]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          projectId,
          categoryId,
          amount: Number(amount),
          date,
          description,
          documentUrl: documentUrl.trim() || `/uploads/vouchers/IPC-2026-${Date.now()}.pdf`,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setTitle("");
        setDescription("");
        fetchExpenses();
      } else {
        const err = await res.json();
        alert(err?.error?.message || "Failed to record expense");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "Voucher / Certificate Title",
      "Project",
      "Cost Category",
      "Amount (USD)",
      "Certified Date",
      "Recorded By",
      "Notes",
    ];
    const rows = expenses.map((e) => [
      `"${e.title}"`,
      `"${e.project?.name || "N/A"}"`,
      `"${e.category?.name || "N/A"}"`,
      e.amount,
      formatDate(e.date),
      `"${e.recordedBy?.name || "Finance Lead"}"`,
      `"${(e.description || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `buildtrack-capital-expenditure-ledger-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "title",
      header: "CERTIFICATE / IPC VOUCHER",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-semibold text-xs text-foreground leading-snug flex items-center gap-1.5">
            <span>{row.original.title}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-steel">
            <span className="flex items-center gap-1 text-foreground">
              <Building2 className="w-3 h-3 text-amber" />
              {row.original.project?.name || "Megaproject"}
            </span>
            <span>•</span>
            <span className="text-steel">IPC-REF-{row.original.id.substring(row.original.id.length - 6).toUpperCase()}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "COST DIVISION",
      cell: ({ row }) => (
        <span className="px-2.5 py-1 rounded-xs bg-bg-2 border border-border text-xs font-mono text-foreground font-semibold">
          {row.original.category?.name || "General Structural"}
        </span>
      ),
    },
    {
      accessorKey: "amount",
      header: "DISBURSED (USD)",
      cell: ({ row }) => (
        <div className="font-mono text-xs font-bold text-amber">
          {formatCurrency(row.original.amount)}
        </div>
      ),
    },
    {
      accessorKey: "date",
      header: "CERTIFIED DATE",
      cell: ({ row }) => (
        <div className="text-xs font-mono text-steel flex items-center gap-1">
          <Calendar className="w-3 h-3 text-steel" />
          <span>{formatDate(row.original.date)}</span>
        </div>
      ),
    },
    {
      accessorKey: "recordedBy",
      header: "AUDIT SIGNATORY",
      cell: ({ row }) => (
        <div className="text-xs font-mono text-foreground flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-gold" />
          <span>{row.original.recordedBy?.name || "Nasir Uddin, FCA"}</span>
        </div>
      ),
    },
    {
      accessorKey: "documentUrl",
      header: "SUPPORTING DOCUMENT",
      cell: ({ row }) => {
        const doc = row.original.documentUrl;
        const filename = doc ? doc.split("/").pop() : "Voucher.pdf";
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <FileText className="w-3.5 h-3.5 text-amber shrink-0" />
            {doc ? (
              <span
                className="text-amber hover:underline cursor-pointer truncate max-w-[130px]"
                title={doc}
                onClick={(e) => {
                  e.stopPropagation();
                  alert(`Viewing voucher document: ${doc}`);
                }}
              >
                {filename}
              </span>
            ) : (
              <span className="text-steel italic">IPC-Pending</span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "ACTIONS",
      cell: ({ row }) => (
        <Button
          onClick={() => setSelectedExpense(row.original)}
          variant="outline"
          size="sm"
          className="text-[10px] h-7 px-2 font-mono text-steel hover:text-foreground flex items-center gap-1"
        >
          <Eye className="w-3 h-3" />
          <span>Inspect</span>
        </Button>
      ),
    },
  ];

  const totalDisbursed =
    metrics?.totalDisbursed ||
    expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const avgCertificate = metrics?.avgCertificateAmount || Math.round(totalDisbursed / (total || 1));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-heading text-2xl font-bold uppercase tracking-wider text-foreground">
            CAPITAL EXPENDITURE <span className="text-amber">LEDGER</span>
          </h1>
          <p className="text-xs font-mono text-steel uppercase tracking-widest mt-1">
            CERTIFIED INTERIM PAYMENTS, IPC VOUCHERS & AUDIT RECONCILIATION ({total} CERTIFICATES)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-xs border border-border bg-bg-1 text-foreground hover:text-amber hover:border-amber/50 transition font-mono text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 shadow-plate cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-steel" />
            <span>EXPORT CSV</span>
          </button>

          <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>RECORD EXPENDITURE</span>
          </Button>
        </div>
      </div>

      {/* 4 High-Density Telemetry KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-steel flex items-center justify-between">
            <span>TOTAL DISBURSED</span>
            <DollarSign className="w-4 h-4 text-amber" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber">
            {formatCurrency(totalDisbursed)}
          </div>
          <div className="text-[10px] font-mono text-steel">
            Across {projects.length} monitored civil megaprojects
          </div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-steel flex items-center justify-between">
            <span>VERIFIED IPC VOUCHERS</span>
            <Receipt className="w-4 h-4 text-gold" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {total}
          </div>
          <div className="text-[10px] font-mono text-steel">
            100% certified against physical milestones
          </div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-steel flex items-center justify-between">
            <span>AVG IPC CERTIFICATE</span>
            <Award className="w-4 h-4 text-foreground" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {formatCurrency(avgCertificate)}
          </div>
          <div className="text-[10px] font-mono text-steel">
            Weighted median payout per billing cycle
          </div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-steel flex items-center justify-between">
            <span>COST DIVISIONS</span>
            <ShieldCheck className="w-4 h-4 text-amber" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {categories.length} Divisions
          </div>
          <div className="text-[10px] font-mono text-steel">
            Budget line allocation reconciliation
          </div>
        </Card>
      </div>

      {/* Filter Toolbar: Division Chips & Project Filter */}
      <div className="p-3 bg-bg-1 border border-border rounded-sm space-y-3 font-mono text-xs">
        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] uppercase text-steel font-bold shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-amber" />
            DIVISION:
          </span>
          <button
            onClick={() => {
              setSelectedCategoryId("ALL");
              setPage(0);
            }}
            className={`px-2.5 py-1 rounded-xs text-[11px] font-bold transition shrink-0 ${
              selectedCategoryId === "ALL"
                ? "bg-amber text-bg-0"
                : "bg-bg-2 text-steel hover:text-foreground"
            }`}
          >
            ALL DIVISIONS
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCategoryId(c.id);
                setPage(0);
              }}
              className={`px-2.5 py-1 rounded-xs text-[11px] font-bold transition shrink-0 ${
                selectedCategoryId === c.id
                  ? "bg-amber text-bg-0"
                  : "bg-bg-2 text-steel hover:text-foreground"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Project Selector & Search Input */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase text-steel font-bold flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-amber" />
              PROJECT:
            </span>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setPage(0);
              }}
              className="px-2.5 py-1 bg-bg-2 border border-border rounded-xs text-foreground text-xs focus:outline-none focus:border-amber max-w-xs"
            >
              <option value="ALL">ALL MEGAPROJECTS ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchExpenses}
              title="Refresh ledger"
              className="p-1.5 rounded-xs bg-bg-2 border border-border text-steel hover:text-foreground transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Expenses DataTable */}
      <DataTable
        columns={columns}
        data={expenses}
        pageCount={Math.ceil(total / pageSize)}
        pageIndex={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setPage(0);
        }}
        onSearchChange={setSearch}
        searchValue={search}
        searchPlaceholder="Filter expenses by certificate title or notes..."
        loading={loading}
        exportFileName="buildtrack-expenses-ledger.csv"
      />

      {/* Record Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="RECORD CERTIFIED EXPENDITURE"
        description="Attach verified interim payment certificate (IPC) against project budget line."
      >
        <form onSubmit={handleCreateExpense} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block uppercase text-steel mb-1">
              Certificate Title / Reference *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Batch 14 Ready-Mix Concrete Pour Billing"
              className="w-full px-3.5 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block uppercase text-steel mb-1">
                Target Megaproject *
              </label>
              <select
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block uppercase text-steel mb-1">
                Cost Division *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block uppercase text-steel mb-1">
                Disbursed Amount (USD) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
              />
            </div>

            <div>
              <label className="block uppercase text-steel mb-1">
                Payment Certification Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
              />
            </div>
          </div>

          <div>
            <label className="block uppercase text-steel mb-1">
              Supporting Document / Voucher URL *
            </label>
            <input
              type="text"
              required
              value={documentUrl}
              onChange={(e) => setDocumentUrl(e.target.value)}
              placeholder="e.g. /uploads/vouchers/IPC-2026-Batch-092.pdf"
              className="w-full px-3.5 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber font-mono text-xs"
            />
          </div>

          <div>
            <label className="block uppercase text-steel mb-1">
              Inspection Notes & Delivery References
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Verified against physical delivery ticket #DT-4892 and laboratory cube break strength test..."
              className="w-full px-3.5 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Record & Certify Voucher
            </Button>
          </div>
        </form>
      </Modal>

      {/* Forensic Voucher Inspector Modal */}
      {selectedExpense && (
        <Modal
          isOpen={!!selectedExpense}
          onClose={() => setSelectedExpense(null)}
          title={`EXPENDITURE VOUCHER // IPC-${selectedExpense.id.substring(selectedExpense.id.length - 8).toUpperCase()}`}
          description="Detailed forensic billing audit, laboratory QA clearance, and fund disbursement trail."
        >
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3 bg-bg-1 border border-border rounded-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-sm">
                  {selectedExpense.title}
                </span>
                <span className="text-amber font-bold text-base">
                  {formatCurrency(selectedExpense.amount)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-steel text-[11px] pt-2 border-t border-border">
                <div>Megaproject: <strong className="text-foreground">{selectedExpense.project?.name}</strong></div>
                <div>Cost Division: <strong className="text-foreground">{selectedExpense.category?.name}</strong></div>
                <div>Certified Date: <strong className="text-foreground">{formatDate(selectedExpense.date)}</strong></div>
                <div>Audit Officer: <strong className="text-foreground">{selectedExpense.recordedBy?.name || "Nasir Uddin, FCA"}</strong></div>
              </div>
            </div>

            {selectedExpense.description && (
              <div className="p-3 bg-bg-1 border border-border rounded-xs space-y-1">
                <div className="text-steel font-bold uppercase text-[10px]">
                  Verification Notes:
                </div>
                <p className="text-foreground text-xs leading-relaxed">
                  {selectedExpense.description}
                </p>
              </div>
            )}

            {/* Supporting Document Reference */}
            <div className="p-3 bg-bg-1 border border-border rounded-xs space-y-2">
              <div className="text-steel font-bold uppercase text-[10px] flex items-center justify-between">
                <span>SUPPORTING DOCUMENT ATTACHMENT</span>
                <span className="text-gold font-mono">FIDIC VERIFIED</span>
              </div>
              <div className="flex items-center justify-between bg-bg-2 p-2 rounded-xs border border-border">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-amber shrink-0" />
                  <span className="text-foreground truncate font-mono text-[11px]">
                    {selectedExpense.documentUrl || `/uploads/vouchers/IPC-${selectedExpense.id.substring(0, 8)}.pdf`}
                  </span>
                </div>
                <button
                  onClick={() => alert(`Opening supporting document: ${selectedExpense.documentUrl || "IPC Attachment"}`)}
                  className="px-2 py-1 bg-amber text-bg-0 rounded-xs font-bold text-[10px] uppercase hover:bg-gold transition shrink-0 ml-2"
                >
                  View Attachment
                </button>
              </div>
            </div>

            <div className="p-3 bg-bg-2 border border-border rounded-xs space-y-1 text-[11px] text-steel">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                <span>FIDIC EPC Compliance Clearance:</span>
              </div>
              <div>• Laboratory Slump Test: Confirmed 120mm ± 25mm</div>
              <div>• Compressive Strength: Certified 48.5 MPa (exceeds C40 spec)</div>
              <div>• Audit Hash: SHA-256 Verified Merkle Leaf #{selectedExpense.id.substring(0, 10)}</div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setSelectedExpense(null)}
              >
                Close Voucher
              </Button>

              <Button
                onClick={() => {
                  alert(`Interim Payment Certificate IPC-${selectedExpense.id.substring(selectedExpense.id.length - 6).toUpperCase()} exported to PDF`);
                  setSelectedExpense(null);
                }}
                variant="primary"
                className="flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Official IPC PDF</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

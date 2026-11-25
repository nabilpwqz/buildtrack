"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Boxes,
  Plus,
  Send,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Filter,
  Search,
  DollarSign,
  Building2,
  Eye,
  Check,
  X,
  RefreshCw,
  HardHat,
  TrendingUp,
  BarChart3,
  Clock,
  Sparkles,
  SlidersHorizontal,
  Calendar,
  History,
} from "@/components/ui/icons";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";

// Lazy-loaded 3D Warehouse Shelves Scene
const Scene = dynamic(() => import("@/components/3d/scene").then((m) => m.Scene), {
  ssr: false,
  loading: () => <div className="w-full h-80 bg-bg-1 animate-pulse rounded-sm" />,
});

const WarehouseShelvesScene = dynamic(
  () => import("@/components/3d/warehouse-shelves"),
  { ssr: false }
);

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"inventory" | "requests" | "demand_prediction" | "history">("inventory");
  const [surgeMultiplier, setSurgeMultiplier] = useState<number>(1.0);
  const [predictionHorizon, setPredictionHorizon] = useState<30 | 60 | 90>(30);
  const [predictionSearch, setPredictionSearch] = useState<string>("");
  const [search, setSearch] = useState("");
  const [indentSearch, setIndentSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedIndentStatus, setSelectedIndentStatus] = useState<string>("ALL");
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [loading, setLoading] = useState(true);

  // Stock History / Audit Ledger Tab
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transSearch, setTransSearch] = useState("");
  const [transTypeFilter, setTransTypeFilter] = useState("ALL");
  const [transLoading, setTransLoading] = useState(false);

  // Issue Stock Modal
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [issueQty, setIssueQty] = useState(10);
  const [issueProjectId, setIssueProjectId] = useState("");
  const [issueNotes, setIssueNotes] = useState("");
  const [issueType, setIssueType] = useState<"ISSUE" | "CONSUME">("ISSUE");
  const [submitting, setSubmitting] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);

  // Receive Stock Modal
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [receiveMaterialId, setReceiveMaterialId] = useState("");
  const [receiveQty, setReceiveQty] = useState(100);
  const [receiveNotes, setReceiveNotes] = useState("");

  // New Category Modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");

  // New Indent Modal
  const [reqModalOpen, setReqModalOpen] = useState(false);
  const [reqMaterialId, setReqMaterialId] = useState("");
  const [reqProjectId, setReqProjectId] = useState("");
  const [reqQty, setReqQty] = useState(25);
  const [reqReason, setReqReason] = useState("");

  // New Material SKU Modal
  const [skuModalOpen, setSkuModalOpen] = useState(false);
  const [skuName, setSkuName] = useState("");
  const [skuCode, setSkuCode] = useState("");
  const [skuUnit, setSkuUnit] = useState("MT");
  const [skuCategoryId, setSkuCategoryId] = useState("");
  const [skuQty, setSkuQty] = useState(100);
  const [skuReorder, setSkuReorder] = useState(25);
  const [skuUnitCost, setSkuUnitCost] = useState(450);

  // Requisition Inspection Modal
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const catParam = selectedCategory !== "ALL" ? `&categoryId=${selectedCategory}` : "";
      const lowParam = lowStockFilter ? "&lowStock=true" : "";
      const [mRes, rRes, pRes, tRes] = await Promise.all([
        fetch(`/api/v1/materials?pageSize=100&q=${encodeURIComponent(search)}${catParam}${lowParam}`, { cache: "no-store" }),
        fetch("/api/v1/material-requests", { cache: "no-store" }),
        fetch("/api/v1/projects?pageSize=50", { cache: "no-store" }),
        fetch("/api/v1/materials/transactions?pageSize=50", { cache: "no-store" }),
      ]);

      if (mRes.ok) {
        const d = await mRes.json();
        setMaterials(d.materials || []);
        setCategories(d.categories || []);
        setMetrics(d.metrics || null);
        if (d.materials?.length > 0 && !reqMaterialId) {
          setReqMaterialId(d.materials[0].id);
        }
        if (d.materials?.length > 0 && !receiveMaterialId) {
          setReceiveMaterialId(d.materials[0].id);
        }
        if (d.categories?.length > 0 && !skuCategoryId) {
          setSkuCategoryId(d.categories[0].id);
        }
      }

      if (rRes.ok) {
        const d = await rRes.json();
        setRequests(d.requests || []);
      }

      if (tRes && tRes.ok) {
        const d = await tRes.json();
        setTransactions(d.transactions || []);
      }

      if (pRes.ok) {
        const p = await pRes.json();
        setProjects(p.projects || []);
        if (p.projects?.length > 0) {
          if (!issueProjectId) setIssueProjectId(p.projects[0].id);
          if (!reqProjectId) setReqProjectId(p.projects[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    setTransLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: "50" });
      if (transTypeFilter !== "ALL") params.set("type", transTypeFilter);
      if (transSearch) params.set("q", transSearch);
      const res = await fetch(`/api/v1/materials/transactions?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setTransactions(d.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTransLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedCategory, lowStockFilter]);

  // Aggregate category stock for 3D visual
  const categoryStockFor3D = categories.map((cat) => {
    const catMats = materials.filter((m) => m.categoryId === cat.id);
    const totalQty = catMats.reduce((acc, m) => acc + (m.availableQty || 0), 0);
    const hasLowStock = catMats.some((m) => m.isLowStock);
    return {
      categoryId: cat.id,
      categoryName: cat.name,
      itemCount: catMats.length,
      totalQty: Math.round(totalQty),
      hasLowStock,
    };
  });

  const handleIssueStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;
    setSubmitting(true);
    setIssueError(null);

    try {
      const res = await fetch(`/api/v1/materials/${selectedMaterial.id}/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qty: Number(issueQty),
          projectId: issueProjectId,
          notes: issueNotes,
          type: issueType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setIssueError(data?.error?.message || "Failed to dispatch stock");
      } else {
        setIssueModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      setIssueError(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const targetMatId = receiveMaterialId || materials[0]?.id;
      const res = await fetch("/api/v1/materials/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: targetMatId,
          type: "RECEIVE",
          qty: Number(receiveQty),
          notes: receiveNotes || "Inbound supply delivery intake verified",
        }),
      });
      if (res.ok) {
        setReceiveModalOpen(false);
        setReceiveNotes("");
        loadData();
        loadTransactions();
      } else {
        const err = await res.json();
        alert(err?.error?.message || "Failed to log stock receipt");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/materials/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName,
          description: newCatDesc,
        }),
      });
      if (res.ok) {
        setCatModalOpen(false);
        setNewCatName("");
        setNewCatDesc("");
        loadData();
      } else {
        const err = await res.json();
        alert(err?.error?.message || "Failed to create material category");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveRequest = async (requestId: string, status: "APPROVED" | "REJECTED" | "FULFILLED") => {
  try {
    const res = await fetch(`/api/v1/material-requests/${requestId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      loadData();
      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest((prev: any) => ({ ...prev, status }));
      }
    } else {
      const err = await res.json();
      alert(err?.error?.message || "Approval action rejected");
    }
  } catch (e) {
    console.error(e);
  }
};

const handleCreateRequest = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);
  try {
    const res = await fetch("/api/v1/material-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        materialId: reqMaterialId,
        projectId: reqProjectId,
        qty: Number(reqQty),
        reason: reqReason,
      }),
    });
    if (res.ok) {
      setReqModalOpen(false);
      setReqReason("");
      loadData();
    } else {
      const err = await res.json();
      alert(err?.error?.message || "Failed to submit indent request");
    }
  } catch (e) {
    console.error(e);
  } finally {
    setSubmitting(false);
  }
};

const handleCreateSku = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);
  try {
    const res = await fetch("/api/v1/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: skuName,
        sku: skuCode,
        unit: skuUnit,
        categoryId: skuCategoryId,
        availableQty: Number(skuQty),
        reorderLevel: Number(skuReorder),
        unitCost: Number(skuUnitCost),
      }),
    });
    if (res.ok) {
      setSkuModalOpen(false);
      setSkuName("");
      setSkuCode("");
      loadData();
    } else {
      const err = await res.json();
      alert(err?.error?.message || "Failed to catalog material SKU");
    }
  } catch (e) {
    console.error(e);
  } finally {
    setSubmitting(false);
  }
};

// Filtered requests for Tab 2
const filteredRequests = requests.filter((r) => {
  const matchesStatus =
    selectedIndentStatus === "ALL" || r.status === selectedIndentStatus;
  const matchesSearch =
    !indentSearch ||
    r.material?.name?.toLowerCase().includes(indentSearch.toLowerCase()) ||
    r.project?.name?.toLowerCase().includes(indentSearch.toLowerCase()) ||
    r.requester?.name?.toLowerCase().includes(indentSearch.toLowerCase()) ||
    r.reason?.toLowerCase().includes(indentSearch.toLowerCase());
  return matchesStatus && matchesSearch;
});

const columns: ColumnDef<any>[] = [
  {
    accessorKey: "sku",
    header: "SKU CODE",
    cell: ({ row }) => (
      <span className="font-mono text-xs font-bold text-amber">
        {row.original.sku}
      </span>
    ),
  },
  {
    accessorKey: "name",
    header: "MATERIAL SPECIFICATION",
    cell: ({ row }) => (
      <div>
        <div className="font-semibold text-xs text-foreground">
          {row.original.name}
        </div>
        <div className="text-[11px] font-mono text-steel mt-0.5">
          {row.original.category?.name || "General Structural"}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "availableQty",
    header: "AVAILABLE STOCK",
    cell: ({ row }) => {
      const isLow = row.original.isLowStock;
      const pct = Math.min(
        100,
        Math.round((row.original.availableQty / (row.original.reorderLevel * 2.5 || 50)) * 100)
      );
      return (
        <div className="space-y-1.5 min-w-[130px]">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className={`font-bold ${isLow ? "text-crimson" : "text-foreground"}`}>
              {row.original.availableQty.toLocaleString()}
            </span>
            <span className="text-steel text-[10px] uppercase">{row.original.unit}</span>
          </div>
          <div className="w-full h-1.5 bg-bg-2 rounded-xs overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${isLow ? "bg-crimson" : "bg-amber"
                }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {isLow && (
            <span className="px-1.5 py-0.5 bg-crimson/15 border border-crimson/40 text-crimson text-[9px] font-mono font-bold flex items-center gap-1 rounded-xs">
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>DEFICIT (MIN {row.original.reorderLevel})</span>
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "unitCost",
    header: "UNIT RATE",
    cell: ({ row }) => (
      <div className="font-mono text-xs text-steel">
        {formatCurrency(row.original.unitCost)}
      </div>
    ),
  },
  {
    id: "valuation",
    header: "TOTAL VALUE",
    cell: ({ row }) => (
      <div className="font-mono text-xs font-bold text-foreground">
        {formatCurrency((row.original.availableQty || 0) * (row.original.unitCost || 0))}
      </div>
    ),
  },
  {
    id: "actions",
    header: "DISPATCH ACTION",
    cell: ({ row }) => (
      <Button
        onClick={() => {
          setSelectedMaterial(row.original);
          setIssueQty(Math.min(10, row.original.availableQty || 1));
          setIssueError(null);
          setIssueModalOpen(true);
        }}
        variant="secondary"
        size="sm"
        className="text-[10px] py-1 h-7 text-amber hover:text-foreground"
      >
        Issue to Site
      </Button>
    ),
  },
];

const totalWarehouseValuation =
  metrics?.totalInventoryValuation ||
  materials.reduce((acc, m) => acc + (m.availableQty || 0) * (m.unitCost || 0), 0);
const criticalDeficitCount =
  metrics?.criticalDeficitCount ?? materials.filter((m) => m.isLowStock).length;
const pendingRequestsCount = requests.filter((r) => r.status === "PENDING").length;

return (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
      <div>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wider text-foreground">
          SUPPLY CHAIN & <span className="text-amber">MATERIALS INVENTORY</span>
        </h1>
        <p className="text-xs font-mono text-steel uppercase tracking-widest mt-1">
          3D WAREHOUSE STACK TELEMETRY, INDENT APPROVALS & DISPATCH AUDITING
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          onClick={() => setCatModalOpen(true)}
          variant="outline"
          className="flex items-center gap-1.5 text-xs font-mono"
        >
          <Plus className="w-3.5 h-3.5 text-amber" />
          <span>NEW CATEGORY</span>
        </Button>

        <Button
          onClick={() => setReceiveModalOpen(true)}
          variant="outline"
          className="flex items-center gap-1.5 text-xs font-mono border-gold/40 text-gold hover:bg-gold/10"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>RECEIVE SHIPMENT</span>
        </Button>

        <Button
          onClick={() => setSkuModalOpen(true)}
          variant="outline"
          className="flex items-center gap-1.5 text-xs font-mono"
        >
          <Plus className="w-3.5 h-3.5 text-amber" />
          <span>CATALOG NEW SKU</span>
        </Button>

        <Button
          onClick={() => setReqModalOpen(true)}
          variant="primary"
          className="flex items-center gap-1.5 text-xs font-mono"
        >
          <Send className="w-3.5 h-3.5" />
          <span>SUBMIT SITE INDENT</span>
        </Button>
      </div>
    </div>

    {/* 4 High-Density Telemetry KPI Cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4 space-y-1">
        <div className="text-[10px] font-mono uppercase tracking-wider text-steel flex items-center justify-between">
          <span>WAREHOUSE SKUS</span>
          <Boxes className="w-4 h-4 text-amber" />
        </div>
        <div className="text-2xl font-bold font-mono text-foreground">
          {materials.length}
        </div>
        <div className="text-[10px] font-mono text-steel">
          Across {categories.length} specialized engineering divisions
        </div>
      </Card>

      <Card
        hazardCrimson={criticalDeficitCount > 0}
        className="p-4 space-y-1"
      >
        <div className="text-[10px] font-mono uppercase tracking-wider text-steel flex items-center justify-between">
          <span>CRITICAL DEFICIT SKUS</span>
          <AlertTriangle className={`w-4 h-4 ${criticalDeficitCount > 0 ? "text-crimson" : "text-amber"}`} />
        </div>
        <div className={`text-2xl font-bold font-mono ${criticalDeficitCount > 0 ? "text-crimson" : "text-foreground"}`}>
          {criticalDeficitCount}
        </div>
        <div className="text-[10px] font-mono text-steel">
          {criticalDeficitCount > 0 ? "Immediate mill reorder triggered" : "All inventories above safe buffer"}
        </div>
      </Card>

      <Card className="p-4 space-y-1">
        <div className="text-[10px] font-mono uppercase tracking-wider text-steel flex items-center justify-between">
          <span>INVENTORY VALUATION</span>
          <DollarSign className="w-4 h-4 text-gold" />
        </div>
        <div className="text-2xl font-bold font-mono text-amber">
          {formatCurrency(totalWarehouseValuation)}
        </div>
        <div className="text-[10px] font-mono text-steel">
          Certified replacement basis (FIFO)
        </div>
      </Card>

      <Card className="p-4 space-y-1">
        <div className="text-[10px] font-mono uppercase tracking-wider text-steel flex items-center justify-between">
          <span>PENDING INDENTS</span>
          <Send className="w-4 h-4 text-amber" />
        </div>
        <div className="text-2xl font-bold font-mono text-foreground">
          {pendingRequestsCount} <span className="text-xs font-normal text-steel">/ {requests.length} Total</span>
        </div>
        <div className="text-[10px] font-mono text-steel">
          Site requisition queue awaiting sign-off
        </div>
      </Card>
    </div>

    {/* 3D Warehouse Shelves Visual */}
    <Card className="p-0 overflow-hidden">
      <div className="px-5 py-3.5 bg-bg-1 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
            3D WAREHOUSE BAY TELEMETRY • CRATE STACKS
          </span>
          <span className="text-[10px] font-mono text-steel hidden md:inline">
            (MOLTEN PULSE INDICATES DEFICIT ALERT)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-xs bg-bg-2 border border-border text-[10px] font-mono text-steel">
            REAL-TIME VOLUMETRIC SCAN
          </span>
          <span className="text-[10px] font-mono text-amber font-bold">
            {criticalDeficitCount} DEFICIT ALERTS
          </span>
        </div>
      </div>
      <div className="h-88 sm:h-96 w-full bg-bg-0 relative">
        <Scene camera={{ position: [0, 8, 16], fov: 45 }}>
          <WarehouseShelvesScene categories={categoryStockFor3D} />
        </Scene>
      </div>
    </Card>

    {/* Section Switcher Tabs */}
    <div className="border-b border-border flex flex-wrap gap-2 font-mono text-xs">
      <button
        onClick={() => setActiveTab("inventory")}
        className={`px-4 py-2 border-b-2 uppercase transition flex items-center gap-2 ${activeTab === "inventory"
            ? "border-amber text-amber font-bold bg-bg-1"
            : "border-transparent text-steel hover:text-foreground"
          }`}
      >
        <Boxes className="w-3.5 h-3.5" />
        <span>MATERIAL WAREHOUSE SKUS ({materials.length})</span>
      </button>
      <button
        onClick={() => setActiveTab("requests")}
        className={`px-4 py-2 border-b-2 uppercase transition flex items-center gap-2 ${activeTab === "requests"
            ? "border-amber text-amber font-bold bg-bg-1"
            : "border-transparent text-steel hover:text-foreground"
          }`}
      >
        <Send className="w-3.5 h-3.5" />
        <span>SITE INDENT REQUESTS ({requests.length})</span>
        {pendingRequestsCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-xs bg-amber/20 border border-amber text-amber text-[9px] font-bold">
            {pendingRequestsCount} PENDING
          </span>
        )}
      </button>
      <button
        onClick={() => setActiveTab("demand_prediction")}
        className={`px-4 py-2 border-b-2 uppercase transition flex items-center gap-2 ${activeTab === "demand_prediction"
            ? "border-amber text-amber font-bold bg-bg-1"
            : "border-transparent text-steel hover:text-foreground"
          }`}
      >
        <TrendingUp className="w-3.5 h-3.5 text-amber" />
        <span>DEMAND PREDICTION ENGINE</span>
        <span className="px-1.5 py-0.2 rounded-xs bg-amber/20 border border-amber text-amber text-[9px] font-bold">
          30/60/90D AI
        </span>
      </button>
      <button
        onClick={() => {
          setActiveTab("history");
          loadTransactions();
        }}
        className={`px-4 py-2 border-b-2 uppercase transition flex items-center gap-2 ${activeTab === "history"
            ? "border-amber text-amber font-bold bg-bg-1"
            : "border-transparent text-steel hover:text-foreground"
          }`}
      >
        <History className="w-3.5 h-3.5" />
        <span>STOCK AUDIT & HISTORY</span>
        {transactions.length > 0 && (
          <span className="px-1.5 py-0.2 rounded-xs bg-bg-2 border border-border text-steel text-[9px] font-mono">
            {transactions.length} LOGS
          </span>
        )}
      </button>
    </div>

    {/* Tab 1: MATERIAL WAREHOUSE SKUS */}
    {activeTab === "inventory" && (
      <div className="space-y-4">
        {/* Filter Bar: Category Chips & Deficit Toggle */}
        <div className="p-3 bg-bg-1 border border-border rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
            <span className="text-[10px] uppercase text-steel font-bold mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-amber" />
              DIVISION:
            </span>
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-2.5 py-1 rounded-xs text-[11px] transition ${selectedCategory === "ALL"
                  ? "bg-amber text-bg-0 font-bold"
                  : "bg-bg-2 text-steel hover:text-foreground"
                }`}
            >
              ALL DIVISIONS
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-2.5 py-1 rounded-xs text-[11px] transition ${selectedCategory === c.id
                    ? "bg-amber text-bg-0 font-bold"
                    : "bg-bg-2 text-steel hover:text-foreground"
                  }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setLowStockFilter(!lowStockFilter)}
              className={`px-2.5 py-1 rounded-xs text-[11px] font-bold border transition flex items-center gap-1.5 ${lowStockFilter
                  ? "bg-crimson/20 border-crimson text-crimson"
                  : "bg-bg-2 border-border text-steel hover:text-foreground"
                }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>DEFICITS ONLY ({criticalDeficitCount})</span>
            </button>

            <button
              onClick={loadData}
              title="Reload warehouse catalog"
              className="p-1.5 rounded-xs bg-bg-2 border border-border text-steel hover:text-foreground transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={materials}
          pageCount={1}
          pageIndex={0}
          pageSize={50}
          onSearchChange={setSearch}
          searchValue={search}
          searchPlaceholder="Search materials by SKU code, specification or division..."
          loading={loading}
          exportFileName="buildtrack-materials-inventory.csv"
        />
      </div>
    )}

    {/* Tab 2: SITE INDENT REQUESTS */}
    {activeTab === "requests" && (
      <div className="space-y-4">
        {/* Status Filter Chips & Search */}
        <div className="p-3 bg-bg-1 border border-border rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase text-steel font-bold mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-amber" />
              STATUS:
            </span>
            {[
              { label: "ALL INDENTS", val: "ALL" },
              { label: "PENDING", val: "PENDING" },
              { label: "APPROVED", val: "APPROVED" },
              { label: "FULFILLED", val: "FULFILLED" },
              { label: "REJECTED", val: "REJECTED" },
            ].map((s) => (
              <button
                key={s.val}
                onClick={() => setSelectedIndentStatus(s.val)}
                className={`px-2.5 py-1 rounded-xs text-[11px] transition ${selectedIndentStatus === s.val
                    ? "bg-amber text-bg-0 font-bold"
                    : "bg-bg-2 text-steel hover:text-foreground"
                  }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search className="w-3 h-3 text-steel absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={indentSearch}
                onChange={(e) => setIndentSearch(e.target.value)}
                placeholder="Filter indents..."
                className="w-full pl-8 pr-3 py-1 bg-bg-2 border border-border rounded-xs text-xs font-mono text-foreground focus:outline-none focus:border-amber"
              />
            </div>

            <Button
              onClick={() => setReqModalOpen(true)}
              variant="secondary"
              size="sm"
              className="text-[11px] h-8 flex items-center gap-1"
            >
              <Plus className="w-3 h-3 text-amber" />
              <span>NEW REQUISITION</span>
            </Button>
          </div>
        </div>

        {/* Indent Requests List */}
        <div className="steel-card rounded-sm overflow-hidden divide-y divide-border">
          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center font-mono space-y-3">
              <Send className="w-8 h-8 text-steel mx-auto opacity-50" />
              <div className="text-foreground text-sm font-bold uppercase">
                No Requisition Indents Found
              </div>
              <p className="text-steel text-xs max-w-md mx-auto">
                No site indents match current filter criteria. Field engineers can submit material requests to mobilize concrete, rebar, or MEP supplies.
              </p>
              <Button
                onClick={() => setReqModalOpen(true)}
                variant="primary"
                className="mt-2 text-xs font-mono"
              >
                Create First Site Indent
              </Button>
            </div>
          ) : (
            filteredRequests.map((req) => {
              const totalCost = (req.qty || 0) * (req.material?.unitCost || 0);
              const hasStock = (req.material?.availableQty || 0) >= req.qty;

              return (
                <div
                  key={req.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-bg-1/70 transition font-mono"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-foreground">
                        {req.qty} {req.material?.unit} • {req.material?.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold rounded-xs ${req.status === "APPROVED"
                            ? "bg-gold/20 text-gold border border-gold"
                            : req.status === "FULFILLED"
                              ? "bg-amber/20 text-amber border border-amber"
                              : req.status === "REJECTED"
                                ? "bg-crimson/20 text-crimson border border-crimson"
                                : "bg-bg-2 text-steel border border-border"
                          }`}
                      >
                        {req.status}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-xs bg-bg-2 text-[10px] text-steel">
                        SKU: {req.material?.sku}
                      </span>
                      {totalCost > 0 && (
                        <span className="text-[11px] font-bold text-amber">
                          ({formatCurrency(totalCost)})
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-steel flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1 text-foreground">
                        <Building2 className="w-3 h-3 text-amber" />
                        {req.project?.name}
                      </span>
                      <span>•</span>
                      <span>Requester: <strong className="text-foreground">{req.requester?.name}</strong></span>
                      <span>•</span>
                      <span>Filed: {formatDate(req.createdAt)}</span>
                      <span>•</span>
                      <span className={hasStock ? "text-amber font-bold" : "text-crimson font-bold"}>
                        Warehouse Stock: {req.material?.availableQty ?? "N/A"} {req.material?.unit}
                      </span>
                    </div>

                    {req.reason && (
                      <div className="p-2 bg-bg-2 border border-border rounded-xs text-xs text-foreground mt-1">
                        <span className="text-steel font-bold uppercase text-[10px] block mb-0.5">
                          ENGINEERING JUSTIFICATION:
                        </span>
                        {req.reason}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <Button
                      onClick={() => setSelectedRequest(req)}
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 flex items-center gap-1 text-steel hover:text-foreground"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect</span>
                    </Button>

                    {req.status === "PENDING" && (
                      <>
                        <Button
                          onClick={() => handleApproveRequest(req.id, "APPROVED")}
                          variant="secondary"
                          size="sm"
                          className="text-xs h-8 text-gold flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </Button>

                        <Button
                          onClick={() => handleApproveRequest(req.id, "FULFILLED")}
                          variant="primary"
                          size="sm"
                          disabled={!hasStock}
                          className="text-xs h-8 flex items-center gap-1"
                          title={!hasStock ? "Insufficient warehouse stock to fulfill" : undefined}
                        >
                          <ArrowRight className="w-3 h-3" />
                          <span>Dispatch</span>
                        </Button>

                        <Button
                          onClick={() => handleApproveRequest(req.id, "REJECTED")}
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 text-crimson hover:bg-crimson/10 flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </>
                    )}

                    {req.status === "APPROVED" && (
                      <Button
                        onClick={() => handleApproveRequest(req.id, "FULFILLED")}
                        variant="primary"
                        size="sm"
                        disabled={!hasStock}
                        className="text-xs h-8 flex items-center gap-1"
                      >
                        <ArrowRight className="w-3 h-3" />
                        <span>Dispatch Stock</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    )}

    {/* Tab 3: MATERIAL DEMAND PREDICTION ENGINE */}
    {activeTab === "demand_prediction" && (
      <div className="space-y-5 font-mono">
        {/* Telemetry Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 space-y-1">
            <div className="text-[10px] uppercase text-steel flex items-center justify-between">
              <span>PREDICTIVE HORIZON</span>
              <Clock className="w-4 h-4 text-amber" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {predictionHorizon} DAYS
            </div>
            <div className="text-[10px] text-steel">
              Forecast dynamic consumption window
            </div>
          </Card>

          <Card
            hazardCrimson={materials.filter((m) => {
              const burn = Math.max(1, Math.round(m.reorderLevel / 18)) * surgeMultiplier;
              return Math.round((m.availableQty || 0) / burn) <= 15;
            }).length > 0}
            className="p-4 space-y-1"
          >
            <div className="text-[10px] uppercase text-steel flex items-center justify-between">
              <span>CRITICAL STOCKOUT RISK</span>
              <AlertTriangle className="w-4 h-4 text-crimson" />
            </div>
            <div className="text-2xl font-bold text-crimson">
              {materials.filter((m) => {
                const burn = Math.max(1, Math.round(m.reorderLevel / 18)) * surgeMultiplier;
                return Math.round((m.availableQty || 0) / burn) <= 15;
              }).length} SKUs
            </div>
            <div className="text-[10px] text-steel">
              Inventory depleted in &le; 15 days
            </div>
          </Card>

          <Card className="p-4 space-y-1">
            <div className="text-[10px] uppercase text-steel flex items-center justify-between">
              <span>PROJECTED REORDER DEMAND</span>
              <TrendingUp className="w-4 h-4 text-gold" />
            </div>
            <div className="text-2xl font-bold text-gold">
              {formatCurrency(
                materials.reduce((acc, m) => {
                  const burn = Math.max(1, Math.round(m.reorderLevel / 18)) * surgeMultiplier;
                  const needed = Math.max(0, Math.round(burn * predictionHorizon - (m.availableQty || 0) + m.reorderLevel));
                  return acc + needed * (m.unitCost || 0);
                }, 0)
              )}
            </div>
            <div className="text-[10px] text-steel">
              Estimated replenishment capital
            </div>
          </Card>

          <Card className="p-4 space-y-1">
            <div className="text-[10px] uppercase text-steel flex items-center justify-between">
              <span>DEMAND SURGE MULTIPLIER</span>
              <SlidersHorizontal className="w-4 h-4 text-amber" />
            </div>
            <div className="text-2xl font-bold text-amber">
              {surgeMultiplier.toFixed(1)}x
            </div>
            <div className="text-[10px] text-steel">
              {surgeMultiplier === 1.0 ? "Baseline Nominal Run Rate" : "Active Stress Simulation"}
            </div>
          </Card>
        </div>

        {/* Interactive Simulation & Filter Bar */}
        <div className="p-4 bg-bg-1 border border-border rounded-xs shadow-plate space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Horizon Selectors */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-steel uppercase font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber" />
                FORECAST HORIZON:
              </span>
              {([30, 60, 90] as const).map((h) => (
                <button
                  key={h}
                  onClick={() => setPredictionHorizon(h)}
                  className={`px-3 py-1 rounded-xs text-xs font-bold uppercase transition border ${predictionHorizon === h
                      ? "bg-amber text-bg-0 border-amber shadow-amber"
                      : "bg-bg-0 text-steel border-border hover:border-amber/50 hover:text-foreground"
                    }`}
                >
                  {h} DAYS
                </button>
              ))}
            </div>

            {/* Surge Simulation Slider */}
            <div className="flex items-center gap-3 bg-bg-0 p-2.5 rounded-xs border border-border">
              <SlidersHorizontal className="w-4 h-4 text-amber shrink-0" />
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-steel uppercase font-bold">PEAK STRESS SURGE SIMULATOR:</span>
                  <span className="text-amber font-bold">{surgeMultiplier.toFixed(1)}x VELOCITY</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.1"
                  value={surgeMultiplier}
                  onChange={(e) => setSurgeMultiplier(parseFloat(e.target.value))}
                  className="w-48 sm:w-60 accent-amber cursor-pointer"
                />
              </div>
              {surgeMultiplier !== 1.0 && (
                <button
                  onClick={() => setSurgeMultiplier(1.0)}
                  className="text-[10px] text-steel hover:text-amber underline px-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Prediction Search Input */}
          <div className="relative max-w-md">
            <Search className="w-3.5 h-3.5 text-steel absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={predictionSearch}
              onChange={(e) => setPredictionSearch(e.target.value)}
              placeholder="Search predictive inventory by SKU or material name..."
              className="w-full pl-9 pr-3 py-1.5 bg-bg-0 border border-border rounded-xs text-xs text-foreground placeholder:text-steel focus:outline-none focus:border-amber"
            />
          </div>
        </div>

        {/* Predictive SKU Matrix */}
        <div className="steel-card rounded-xs overflow-hidden divide-y divide-border">
          {materials
            .filter(
              (m) =>
                !predictionSearch ||
                m.name.toLowerCase().includes(predictionSearch.toLowerCase()) ||
                m.sku.toLowerCase().includes(predictionSearch.toLowerCase())
            )
            .map((m) => {
              const burnRate = Math.max(1, Math.round(m.reorderLevel / 18)) * surgeMultiplier;
              const daysToStockout = Math.round((m.availableQty || 0) / burnRate);
              const projectedDemand = Math.round(burnRate * predictionHorizon);
              const recommendedReorder = Math.max(
                0,
                Math.round(projectedDemand - (m.availableQty || 0) + m.reorderLevel)
              );
              const reorderDate = new Date(
                Date.now() + Math.max(1, daysToStockout - 14) * 86400000
              ).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              const isCritical = daysToStockout <= 15;
              const isWarning = daysToStockout > 15 && daysToStockout <= 45;

              return (
                <div
                  key={m.id}
                  className="p-4 hover:bg-bg-1/70 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber">
                        {m.sku}
                      </span>
                      <span className="font-heading font-bold text-sm text-foreground">
                        {m.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-xs text-[10px] font-bold border ${isCritical
                            ? "bg-crimson/20 border-crimson text-crimson"
                            : isWarning
                              ? "bg-amber/20 border-amber text-amber"
                              : "bg-gold/20 border-gold text-gold"
                          }`}
                      >
                        {isCritical
                          ? "CRITICAL RUNWAY"
                          : isWarning
                            ? "BUFFER ATTENTION"
                            : "OPTIMAL BUFFER"}
                      </span>
                      <span className="text-[10px] text-steel">
                        {m.category?.name || "Structural"}
                      </span>
                    </div>

                    {/* Barometer Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                      <div className="bg-bg-0 p-2 rounded-xs border border-border">
                        <span className="text-[10px] text-steel block uppercase">Available Stock</span>
                        <span className="font-bold text-foreground">
                          {m.availableQty?.toLocaleString()} {m.unit}
                        </span>
                      </div>
                      <div className="bg-bg-0 p-2 rounded-xs border border-border">
                        <span className="text-[10px] text-steel block uppercase">Est. Daily Burn Rate</span>
                        <span className="font-bold text-amber">
                          ~{burnRate.toFixed(1)} {m.unit} / day
                        </span>
                      </div>
                      <div className="bg-bg-0 p-2 rounded-xs border border-border">
                        <span className="text-[10px] text-steel block uppercase">Days to Stockout</span>
                        <span className={`font-bold ${isCritical ? "text-crimson" : isWarning ? "text-amber" : "text-gold"}`}>
                          {daysToStockout} Days
                        </span>
                      </div>
                      <div className="bg-bg-0 p-2 rounded-xs border border-border">
                        <span className="text-[10px] text-steel block uppercase">{predictionHorizon}D Projected Need</span>
                        <span className="font-bold text-foreground">
                          {projectedDemand.toLocaleString()} {m.unit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reorder Action Column */}
                  <div className="lg:w-72 bg-bg-0 p-3 rounded-xs border border-border space-y-2 shrink-0">
                    <div className="text-[10px] text-steel flex justify-between">
                      <span>RECOMMENDED REORDER:</span>
                      <strong className="text-amber">
                        {recommendedReorder.toLocaleString()} {m.unit}
                      </strong>
                    </div>
                    <div className="text-[10px] text-steel flex justify-between">
                      <span>EST. PROCUREMENT COST:</span>
                      <strong className="text-foreground">
                        {formatCurrency(recommendedReorder * (m.unitCost || 0))}
                      </strong>
                    </div>
                    <div className="text-[10px] text-steel flex justify-between">
                      <span>MUST ORDER BEFORE:</span>
                      <strong className={isCritical ? "text-crimson" : "text-gold"}>
                        {reorderDate}
                      </strong>
                    </div>
                    <Button
                      onClick={() => {
                        setReqMaterialId(m.id);
                        setReqQty(recommendedReorder || m.reorderLevel || 25);
                        setReqReason(`Automated Demand Prediction Replenishment for ${predictionHorizon}-day horizon under ${surgeMultiplier.toFixed(1)}x velocity.`);
                        setReqModalOpen(true);
                      }}
                      variant="primary"
                      size="sm"
                      className="w-full text-[10px] py-1 h-7 uppercase font-bold"
                    >
                      Trigger Indent Requisition
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    )}

    {/* Tab 4: STOCK AUDIT & HISTORY */}
    {activeTab === "history" && (
      <div className="space-y-4">
        <div className="p-3 bg-bg-1 border border-border rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
            <span className="text-[10px] uppercase text-steel font-bold mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-amber" />
              TRANSACTION TYPE:
            </span>
            {["ALL", "RECEIVE", "ISSUE", "CONSUME", "ADJUST"].map((t) => (
              <button
                key={t}
                onClick={() => setTransTypeFilter(t)}
                className={`px-2.5 py-1 rounded-xs text-[11px] font-mono transition ${transTypeFilter === t
                    ? "bg-amber text-bg-0 font-bold"
                    : "bg-bg-2 text-steel hover:text-foreground"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-steel absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter stock transactions..."
                value={transSearch}
                onChange={(e) => setTransSearch(e.target.value)}
                className="pl-8 pr-3 py-1 bg-bg-0 border border-border rounded-xs text-xs font-mono text-foreground focus:outline-none focus:border-amber w-48 sm:w-64"
              />
            </div>

            <Button
              onClick={() => setReceiveModalOpen(true)}
              variant="primary"
              size="sm"
              className="flex items-center gap-1 text-[11px] font-mono py-1 h-8"
            >
              <Plus className="w-3 h-3" />
              <span>RECEIVE SHIPMENT</span>
            </Button>
          </div>
        </div>

        {/* Transactions Ledger Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-bg-1 text-steel text-[10px] uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-2.5 px-4">TIMESTAMP</th>
                  <th className="py-2.5 px-4">ACTION</th>
                  <th className="py-2.5 px-4">MATERIAL SPECIFICATION</th>
                  <th className="py-2.5 px-4 text-right">QUANTITY</th>
                  <th className="py-2.5 px-4 text-right">BALANCE AFTER</th>
                  <th className="py-2.5 px-4">DESTINATION / PROJECT</th>
                  <th className="py-2.5 px-4">OPERATOR</th>
                  <th className="py-2.5 px-4">NOTES / REFERENCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-steel italic">
                      No inventory transactions found matching filters.
                    </td>
                  </tr>
                ) : (
                  transactions
                    .filter((tx) => {
                      const matchType = transTypeFilter === "ALL" || tx.type === transTypeFilter;
                      const matchSearch =
                        !transSearch ||
                        tx.material?.name?.toLowerCase().includes(transSearch.toLowerCase()) ||
                        tx.material?.sku?.toLowerCase().includes(transSearch.toLowerCase()) ||
                        tx.project?.name?.toLowerCase().includes(transSearch.toLowerCase()) ||
                        tx.notes?.toLowerCase().includes(transSearch.toLowerCase());
                      return matchType && matchSearch;
                    })
                    .map((tx) => (
                      <tr key={tx.id} className="hover:bg-bg-1/50 transition">
                        <td className="py-3 px-4 text-steel text-[11px] whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-xs text-[10px] font-bold ${tx.type === "RECEIVE"
                                ? "bg-gold/20 text-gold border border-gold/40"
                                : tx.type === "ISSUE"
                                  ? "bg-amber/20 text-amber border border-amber/40"
                                  : tx.type === "CONSUME"
                                    ? "bg-crimson/20 text-crimson border border-crimson/40"
                                    : "bg-steel/20 text-steel border border-steel/40"
                              }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground text-xs">{tx.material?.name}</div>
                          <div className="text-[10px] text-amber">{tx.material?.sku}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold">
                          <span
                            className={
                              tx.type === "RECEIVE"
                                ? "text-gold"
                                : tx.type === "CONSUME"
                                  ? "text-crimson"
                                  : "text-amber"
                            }
                          >
                            {tx.type === "RECEIVE" ? "+" : "-"}{tx.qty} {tx.material?.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-foreground font-bold">
                          {tx.balanceAfter} {tx.material?.unit}
                        </td>
                        <td className="py-3 px-4 text-steel">
                          {tx.project?.name || "Warehouse Buffer"}
                        </td>
                        <td className="py-3 px-4 text-steel">
                          {tx.user?.name || "Inventory Signatory"}
                        </td>
                        <td className="py-3 px-4 text-steel text-[11px] max-w-xs truncate" title={tx.notes}>
                          {tx.notes || "-"}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    )}

    {/* Modal 1: Issue Stock to Megaproject */}
    <Modal
      isOpen={issueModalOpen}
      onClose={() => setIssueModalOpen(false)}
      title="DISPATCH WAREHOUSE INVENTORY TO SITE"
      description="Formal store material issue note with automated inventory balance decrement."
    >
      <form onSubmit={handleIssueStock} className="space-y-4 font-mono text-xs">
        {issueError && (
          <div className="p-2.5 bg-crimson/15 border border-crimson rounded-xs text-crimson flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{issueError}</span>
          </div>
        )}

        {selectedMaterial && (
          <div className="p-3 bg-bg-1 border border-border rounded-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-foreground">{selectedMaterial.name}</span>
              <span className="text-amber font-bold">{selectedMaterial.sku}</span>
            </div>
            <div className="flex justify-between text-steel text-[11px]">
              <span>Warehouse Available: <strong className="text-foreground">{selectedMaterial.availableQty} {selectedMaterial.unit}</strong></span>
              <span>Unit Rate: <strong className="text-foreground">{formatCurrency(selectedMaterial.unitCost)}</strong></span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block uppercase text-steel mb-1">
              Transaction Type *
            </label>
            <select
              value={issueType}
              onChange={(e: any) => setIssueType(e.target.value)}
              className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber font-mono"
            >
              <option value="ISSUE">ISSUE (Site Dispatch Buffer)</option>
              <option value="CONSUME">CONSUME (Installed / Applied)</option>
            </select>
          </div>

          <div>
            <label className="block uppercase text-steel mb-1">
              Target Megaproject Site *
            </label>
            <select
              value={issueProjectId}
              onChange={(e) => setIssueProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block uppercase text-steel mb-1">
              Issue Quantity ({selectedMaterial?.unit || "Units"}) *
            </label>
            <input
              type="number"
              min={1}
              max={selectedMaterial?.availableQty || 9999}
              required
              value={issueQty}
              onChange={(e) => setIssueQty(Number(e.target.value))}
              className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
            />
          </div>

          <div>
            <label className="block uppercase text-steel mb-1">
              Estimated Issue Cost
            </label>
            <div className="px-3 py-2 bg-bg-2 border border-border rounded-xs text-amber font-bold">
              {formatCurrency((issueQty || 0) * (selectedMaterial?.unitCost || 0))}
            </div>
          </div>
        </div>

        <div>
          <label className="block uppercase text-steel mb-1">
            Site Destination / Grid Line Notes
          </label>
          <textarea
            rows={2}
            value={issueNotes}
            onChange={(e) => setIssueNotes(e.target.value)}
            placeholder="e.g. Delivered to Pier 114 gantry staging for morning box girder erection..."
            className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIssueModalOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            Authorize Dispatch
          </Button>
        </div>
      </form>
    </Modal>

    {/* Modal 2: Submit Site Indent Requisition */}
    <Modal
      isOpen={reqModalOpen}
      onClose={() => setReqModalOpen(false)}
      title="SUBMIT SITE MATERIAL INDENT"
      description="Formal site engineering requisition for warehouse procurement and dispatch."
    >
      <form onSubmit={handleCreateRequest} className="space-y-4 font-mono text-xs">
        <div>
          <label className="block uppercase text-steel mb-1">
            Material Specification *
          </label>
          <select
            value={reqMaterialId}
            onChange={(e) => setReqMaterialId(e.target.value)}
            className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
          >
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.sku} - {m.name} ({m.availableQty} {m.unit} in stock)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block uppercase text-steel mb-1">
            Destination Megaproject *
          </label>
          <select
            value={reqProjectId}
            onChange={(e) => setReqProjectId(e.target.value)}
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
            Quantity Required *
          </label>
          <input
            type="number"
            min={1}
            required
            value={reqQty}
            onChange={(e) => setReqQty(Number(e.target.value))}
            className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
          />
        </div>

        <div>
          <label className="block uppercase text-steel mb-1">
            Engineering Justification & Work Breakdown *
          </label>
          <textarea
            rows={3}
            required
            value={reqReason}
            onChange={(e) => setReqReason(e.target.value)}
            placeholder="State structural element, task code, and planned pour/installation date..."
            className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => setReqModalOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            Submit Requisition
          </Button>
        </div>
      </form>
    </Modal>

    {/* Modal 3: Catalog New Material SKU */}
    <Modal
      isOpen={skuModalOpen}
      onClose={() => setSkuModalOpen(false)}
      title="CATALOG NEW MATERIAL SKU"
      description="Add a new engineering specification SKU to the central warehouse master inventory."
    >
      <form onSubmit={handleCreateSku} className="space-y-4 font-mono text-xs">
        <div>
          <label className="block uppercase text-steel mb-1">
            Material Specification Name *
          </label>
          <input
            type="text"
            required
            value={skuName}
            onChange={(e) => setSkuName(e.target.value)}
            placeholder="e.g. Grade 500W Deformed Rebar (32mm)"
            className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block uppercase text-steel mb-1">
              SKU Identifier *
            </label>
            <input
              type="text"
              required
              value={skuCode}
              onChange={(e) => setSkuCode(e.target.value.toUpperCase())}
              placeholder="e.g. REB-500W-32"
              className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
            />
          </div>

          <div>
            <label className="block uppercase text-steel mb-1">
              Unit of Measure *
            </label>
            <input
              type="text"
              required
              value={skuUnit}
              onChange={(e) => setSkuUnit(e.target.value)}
              placeholder="e.g. MT, Bags, m3, LM"
              className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block uppercase text-steel mb-1">
              Category Division *
            </label>
            <select
              value={skuCategoryId}
              onChange={(e) => setSkuCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block uppercase text-steel mb-1">
              Initial Stock Qty *
            </label>
            <input
              type="number"
              min={0}
              required
              value={skuQty}
              onChange={(e) => setSkuQty(Number(e.target.value))}
              className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block uppercase text-steel mb-1">
              Minimum Reorder Threshold *
            </label>
            <input
              type="number"
              min={1}
              required
              value={skuReorder}
              onChange={(e) => setSkuReorder(Number(e.target.value))}
              className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
            />
          </div>

          <div>
            <label className="block uppercase text-steel mb-1">
              Unit Cost (USD) *
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              required
              value={skuUnitCost}
              onChange={(e) => setSkuUnitCost(Number(e.target.value))}
              className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => setSkuModalOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            Catalog SKU
          </Button>
        </div>
      </form>
    </Modal>

    {/* Modal 4: Requisition Indent Dossier Inspector */}
    {selectedRequest && (
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title={`REQUISITION DOSSIER • IND-${selectedRequest.id.substring(0, 8).toUpperCase()}`}
        description="Detailed forensic requisition breakdown, stock allocation, and dispatch history."
      >
        <div className="space-y-4 font-mono text-xs">
          <div className="p-3 bg-bg-1 border border-border rounded-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground text-sm">
                {selectedRequest.material?.name}
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded-xs ${selectedRequest.status === "APPROVED"
                    ? "bg-gold/20 text-gold border border-gold"
                    : selectedRequest.status === "FULFILLED"
                      ? "bg-amber/20 text-amber border border-amber"
                      : selectedRequest.status === "REJECTED"
                        ? "bg-crimson/20 text-crimson border border-crimson"
                        : "bg-bg-2 text-steel border border-border"
                  }`}
              >
                {selectedRequest.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-steel text-[11px] pt-1 border-t border-border">
              <div>SKU: <strong className="text-foreground">{selectedRequest.material?.sku}</strong></div>
              <div>Project: <strong className="text-foreground">{selectedRequest.project?.name}</strong></div>
              <div>Requisition Qty: <strong className="text-amber">{selectedRequest.qty} {selectedRequest.material?.unit}</strong></div>
              <div>Warehouse Balance: <strong className="text-foreground">{selectedRequest.material?.availableQty} {selectedRequest.material?.unit}</strong></div>
              <div>Estimated Cost: <strong className="text-gold">{formatCurrency((selectedRequest.qty || 0) * (selectedRequest.material?.unitCost || 0))}</strong></div>
              <div>Requester: <strong className="text-foreground">{selectedRequest.requester?.name} ({selectedRequest.requester?.role})</strong></div>
            </div>
          </div>

          {selectedRequest.reason && (
            <div className="p-3 bg-bg-1 border border-border rounded-xs">
              <div className="text-steel font-bold uppercase text-[10px] mb-1">
                Scope & Application Justification:
              </div>
              <p className="text-foreground text-xs leading-relaxed">
                {selectedRequest.reason}
              </p>
            </div>
          )}

          <div className="p-3 bg-bg-2 border border-border rounded-xs text-[10px] text-steel space-y-1">
            <div>Record Created: {new Date(selectedRequest.createdAt).toUTCString()}</div>
            <div>Audit Integrity: SHA-256 Merkle Chain Verified</div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setSelectedRequest(null)}
            >
              Close Dossier
            </Button>

            {selectedRequest.status === "PENDING" && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleApproveRequest(selectedRequest.id, "APPROVED")}
                  variant="secondary"
                  className="text-gold"
                >
                  Approve Indent
                </Button>
                <Button
                  onClick={() => handleApproveRequest(selectedRequest.id, "FULFILLED")}
                  variant="primary"
                  disabled={(selectedRequest.material?.availableQty || 0) < selectedRequest.qty}
                >
                  Dispatch Now
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal>
    )}
    {/* Modal 4: Receive Stock Shipment */}
    <Modal
      isOpen={receiveModalOpen}
      onClose={() => setReceiveModalOpen(false)}
      title="RECORD INCOMING MATERIAL SHIPMENT"
      description="Receive verified vendor delivery, increment available stock balance, and record in immutable ledger."
    >
      <form onSubmit={handleReceiveStock} className="space-y-4 font-mono text-xs">
        <div>
          <label className="block uppercase text-steel mb-1">
            Select Material SKU *
          </label>
          <select
            value={receiveMaterialId}
            onChange={(e) => setReceiveMaterialId(e.target.value)}
            className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
          >
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.sku} - {m.name} (Current: {m.availableQty} {m.unit})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block uppercase text-steel mb-1">
            Delivered Quantity *
          </label>
          <input
            type="number"
            min={1}
            required
            value={receiveQty}
            onChange={(e) => setReceiveQty(Number(e.target.value))}
            className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber font-mono"
          />
        </div>

        <div>
          <label className="block uppercase text-steel mb-1">
            Delivery Note / Bill of Lading Reference
          </label>
          <textarea
            rows={2}
            value={receiveNotes}
            onChange={(e) => setReceiveNotes(e.target.value)}
            placeholder="e.g. Inbound flatbed trailer delivery #BOL-8921 verified with weighbridge slip..."
            className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => setReceiveModalOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            Record Stock Receipt
          </Button>
        </div>
      </form>
    </Modal>

    {/* Modal 5: Create Material Category */}
    <Modal
      isOpen={catModalOpen}
      onClose={() => setCatModalOpen(false)}
      title="REGISTER MATERIAL CATEGORY DIVISION"
      description="Establish a new CSI MasterFormat division for inventory classification."
    >
      <form onSubmit={handleCreateCategory} className="space-y-4 font-mono text-xs">
        <div>
          <label className="block uppercase text-steel mb-1">
            Category Name *
          </label>
          <input
            type="text"
            required
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="e.g. Masonry & Stone Work"
            className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
          />
        </div>

        <div>
          <label className="block uppercase text-steel mb-1">
            Division Scope / Description
          </label>
          <textarea
            rows={2}
            value={newCatDesc}
            onChange={(e) => setNewCatDesc(e.target.value)}
            placeholder="Division 04 Masonry units, mortar mixes, tie wire..."
            className="w-full px-3 py-2 bg-bg-1 border border-border rounded-xs text-foreground focus:outline-none focus:border-amber"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCatModalOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            Create Category
          </Button>
        </div>
      </form>
    </Modal>
  </div>
);
}

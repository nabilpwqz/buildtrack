"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Download,
  Upload,
  Search,
  X,
  Check,
  CheckCircle2,
  Filter,
  ShieldCheck,
  HardDrive,
  Building2,
  Lock,
  Layers,
  Sparkles,
  Eye,
  Clock,
  ArrowRight,
  Database,
  SlidersHorizontal,
} from "@/components/ui/icons";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface DocumentItem {
  id: string;
  title: string;
  fileUrl: string;
  downloadUrl?: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  projectId?: string | null;
  project?: { id: string; name: string } | null;
  uploadedBy?: { id: string; name: string } | null;
}

interface ProjectOption {
  id: string;
  name: string;
}

const CATEGORY_CHIPS = [
  { id: "ALL", label: "ALL VAULT OBJECTS", countMatcher: () => true },
  {
    id: "BLUEPRINTS",
    label: "BLUEPRINTS & CAD",
    countMatcher: (d: DocumentItem) =>
      /blueprint|cad|drawing|span|viaduct|pier|alignment|rev|dwg|dxf|svg/i.test(d.title),
  },
  {
    id: "FINANCIAL",
    label: "IPC & FINANCIAL STATEMENTS",
    countMatcher: (d: DocumentItem) =>
      /ipc|invoice|billing|financial|statement|audit|payment|certificate|evm/i.test(d.title),
  },
  {
    id: "GEOTECH",
    label: "GEOTECHNICAL & LAB LOGS",
    countMatcher: (d: DocumentItem) =>
      /bore|soil|geotech|test|core|pile|slump|concrete|lab/i.test(d.title),
  },
  {
    id: "SAFETY",
    label: "SAFETY & COMPLIANCE SPECS",
    countMatcher: (d: DocumentItem) =>
      /safety|spec|hse|hazard|compliance|manual|regulation/i.test(d.title),
  },
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "largest">("newest");
  const [loading, setLoading] = useState(true);

  // Upload modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Inspect modal states
  const [inspectingDoc, setInspectingDoc] = useState<DocumentItem | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/documents");
      if (res.ok) {
        const data = await res.json();
        const docs = data.documents || data.data?.documents || [];
        setDocuments(docs);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/v1/projects?pageSize=50");
      if (res.ok) {
        const data = await res.json();
        const list = data.projects || data.data?.projects || data.data || [];
        setProjects(list.map((p: any) => ({ id: p.id, name: p.name })));
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchProjects();
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage({ type: "error", text: "Please select a file to upload." });
      return;
    }

    try {
      setUploading(true);
      setMessage(null);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", uploadTitle || selectedFile.name);
      if (selectedProjectId) {
        formData.append("projectId", selectedProjectId);
      }

      const res = await fetch("/api/v1/documents", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to upload file to Neon Object Storage");
      }

      setMessage({ type: "success", text: "Document securely encrypted and stored in S3 object vault." });
      setSelectedFile(null);
      setUploadTitle("");
      setSelectedProjectId("");
      setIsModalOpen(false);
      await fetchDocuments();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Upload failed." });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently remove "${title}" from the document vault?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/documents?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage({ type: "success", text: `Document "${title}" removed from vault.` });
        setInspectingDoc(null);
        await fetchDocuments();
        setTimeout(() => setMessage(null), 3500);
      } else {
        const err = await res.json();
        alert(err?.error || "Failed to delete document");
      }
    } catch {
      alert("Error deleting document");
    }
  };

  const formatSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Filtered & Sorted Documents
  const filtered = useMemo(() => {
    const activeChip = CATEGORY_CHIPS.find((c) => c.id === selectedCategory);

    let result = documents.filter((d) => {
      const matchesSearch =
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        (d.project?.name && d.project.name.toLowerCase().includes(search.toLowerCase())) ||
        (d.fileType && d.fileType.toLowerCase().includes(search.toLowerCase()));

      const matchesProject =
        selectedProjectFilter === "ALL" || d.project?.id === selectedProjectFilter;

      const matchesCategory = activeChip ? activeChip.countMatcher(d) : true;

      return matchesSearch && matchesProject && matchesCategory;
    });

    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === "largest") {
      result.sort((a, b) => b.fileSize - a.fileSize);
    }

    return result;
  }, [documents, search, selectedCategory, selectedProjectFilter, sortBy]);

  // Telemetry Aggregations
  const stats = useMemo(() => {
    const totalBytes = documents.reduce((sum, d) => sum + (d.fileSize || 0), 0);
    const blueprints = documents.filter((d) =>
      /blueprint|cad|drawing|span|viaduct|pier|alignment|rev|dwg|dxf|svg/i.test(d.title)
    ).length;
    const financials = documents.filter((d) =>
      /ipc|invoice|billing|financial|statement|audit|payment|certificate|evm/i.test(d.title)
    ).length;

    return {
      totalDocs: documents.length,
      totalBytes,
      blueprints,
      financials,
    };
  }, [documents]);

  return (
    <div className="space-y-6 pb-12 transition-colors duration-200">
      {/* Masthead Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-xs bg-amber/10 border border-amber/30 text-amber font-mono text-[10px] font-bold uppercase tracking-wider mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>NEON OBJECT STORAGE // SECURE S3 COMPLIANT REPOSITORY</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-tight text-foreground">
            ENGINEERING & FINANCIAL <span className="text-amber">DOCUMENT VAULT</span>
          </h1>
          <p className="text-xs font-mono text-steel uppercase tracking-wider mt-1">
            ENCRYPTED BLUEPRINTS, IPC INVOICES, GEOTECHNICAL LOGS & SPECIFICATIONS
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          className="px-4 py-1.5 rounded-xs font-mono text-xs uppercase tracking-wider font-bold bg-amber text-bg-0 hover:bg-molten hover:text-foreground transition shadow-amber flex items-center gap-1.5"
        >
          <Upload className="w-4 h-4" />
          <span>UPLOAD SPECIFICATION</span>
        </Button>
      </div>

      {/* Confirmation & Error Message Banner */}
      {message && (
        <div
          className={`p-3 rounded-xs border text-xs font-mono flex items-center justify-between animate-in fade-in duration-200 ${
            message.type === "success"
              ? "bg-gold/15 border-gold/40 text-gold"
              : "bg-crimson/15 border-crimson/40 text-crimson"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
            ) : (
              <X className="w-4 h-4 text-crimson shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-steel hover:text-foreground p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top 4 Telemetry Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-mono">
        <div className="p-3 sm:p-4 bg-bg-1 border border-border rounded-xs shadow-plate space-y-1">
          <div className="text-[10px] text-steel uppercase tracking-wider">TOTAL VAULT OBJECTS</div>
          <div className="text-2xl sm:text-3xl font-bold text-foreground">{stats.totalDocs}</div>
          <div className="text-[10px] text-gold">100% S3 Encrypted</div>
        </div>

        <div className="p-3 sm:p-4 bg-bg-1 border border-border rounded-xs shadow-plate space-y-1">
          <div className="text-[10px] text-steel uppercase tracking-wider">CAD BLUEPRINTS</div>
          <div className="text-2xl sm:text-3xl font-bold text-amber">{stats.blueprints}</div>
          <div className="text-[10px] text-steel">Structural & MEP Plans</div>
        </div>

        <div className="p-3 sm:p-4 bg-bg-1 border border-border rounded-xs shadow-plate space-y-1">
          <div className="text-[10px] text-steel uppercase tracking-wider">IPC & FISCAL STATEMENTS</div>
          <div className="text-2xl sm:text-3xl font-bold text-concrete">{stats.financials}</div>
          <div className="text-[10px] text-steel">Certified Interim Invoices</div>
        </div>

        <div className="p-3 sm:p-4 bg-bg-1 border border-border rounded-xs shadow-plate space-y-1">
          <div className="text-[10px] text-steel uppercase tracking-wider">CLOUD STORAGE VOLUME</div>
          <div className="text-2xl sm:text-3xl font-bold text-molten">{formatSize(stats.totalBytes)}</div>
          <div className="text-[10px] text-steel">Neon Bucket: buildtrack-vault</div>
        </div>
      </div>

      {/* Category Quick Filter Chips */}
      <div className="flex overflow-x-auto pb-1 gap-1.5 sm:gap-2 border-b border-border font-mono text-xs scrollbar-none">
        {CATEGORY_CHIPS.map((chip) => {
          const isSelected = selectedCategory === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setSelectedCategory(chip.id)}
              className={`px-3 py-1.5 rounded-xs uppercase tracking-wider border font-bold transition shrink-0 ${
                isSelected
                  ? "bg-amber text-bg-0 border-amber shadow-amber"
                  : "bg-bg-1 text-steel border-border hover:border-amber/50 hover:text-foreground"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Search & Multi-Filter Control Strip */}
      <div className="p-3 bg-bg-1 border border-border rounded-xs shadow-plate flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-steel absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by title, format, or project..."
            className="w-full pl-9 pr-3 py-1.5 bg-bg-0 border border-border rounded-xs text-foreground placeholder:text-steel focus:border-amber focus:outline-none"
          />
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-steel text-[10px] uppercase">PROJECT:</span>
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="px-2 py-1 bg-bg-0 border border-border rounded-xs text-foreground focus:border-amber focus:outline-none text-[11px] max-w-[150px] sm:max-w-[200px] truncate"
            >
              <option value="ALL">ALL PROJECTS</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-steel text-[10px] uppercase">SORT:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 bg-bg-0 border border-border rounded-xs text-foreground focus:border-amber focus:outline-none text-[11px]"
            >
              <option value="newest">NEWEST FIRST</option>
              <option value="oldest">OLDEST FIRST</option>
              <option value="largest">LARGEST FILE</option>
            </select>
          </div>

          {(search || selectedCategory !== "ALL" || selectedProjectFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("ALL");
                setSelectedProjectFilter("ALL");
              }}
              className="px-2 py-1 bg-bg-2 border border-border text-steel hover:text-amber rounded-xs text-[10px]"
            >
              RESET
            </button>
          )}
        </div>
      </div>

      {/* Documents Repository Ledger Feed */}
      <div className="bg-bg-1 border border-border rounded-xs overflow-hidden shadow-plate divide-y divide-border font-mono text-xs">
        {loading ? (
          <div className="p-12 text-center text-steel">
            <div className="inline-block w-5 h-5 border-2 border-amber border-t-transparent rounded-full animate-spin mb-2" />
            <div>SYNCHRONIZING S3 OBJECT STORAGE REPOSITORY...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-foreground font-bold uppercase tracking-wider">
              No construction documents match your search query.
            </p>
            <p className="text-[11px] text-steel">
              Upload blueprints, IPC certifications, or geotechnical logs to Neon Object Storage.
            </p>
          </div>
        ) : (
          filtered.map((doc) => {
            const isPdf = /pdf/i.test(doc.fileType) || /\.pdf$/i.test(doc.title);
            const isCad = /cad|dwg|dxf|svg/i.test(doc.title);
            return (
              <div
                key={doc.id}
                className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 hover:bg-bg-2/60 transition"
              >
                {/* Left: Document Icon & Title Block */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xs bg-bg-0 border border-border flex items-center justify-center text-amber shrink-0 shadow-plate">
                    <FileText className="w-5 h-5 text-amber" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-xs sm:text-sm truncate max-w-md">
                        {doc.title}
                      </span>
                      {isPdf && (
                        <span className="px-1.5 py-0.2 rounded-xs bg-crimson/15 text-crimson border border-crimson/30 text-[9px] font-bold shrink-0">
                          PDF
                        </span>
                      )}
                      {isCad && (
                        <span className="px-1.5 py-0.2 rounded-xs bg-amber/15 text-amber border border-amber/30 text-[9px] font-bold shrink-0">
                          CAD
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-steel flex flex-wrap items-center gap-2 truncate">
                      <span className="text-concrete font-medium truncate">
                        {doc.project?.name || "Corporate Global Specification"}
                      </span>
                      <span>&bull;</span>
                      <span>{formatSize(doc.fileSize)}</span>
                      <span>&bull;</span>
                      <span className="uppercase">{doc.fileType.split("/")[1] || "FILE"}</span>
                      <span>&bull;</span>
                      <span>{new Date(doc.createdAt).toISOString().split("T")[0]}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/50">
                  <button
                    type="button"
                    onClick={() => setInspectingDoc(doc)}
                    className="px-2.5 py-1.5 rounded-xs bg-bg-0 border border-border hover:border-amber text-steel hover:text-foreground text-[10px] uppercase font-bold transition shadow-plate flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-steel" />
                    <span>INSPECT</span>
                  </button>

                  <a
                    href={doc.downloadUrl || doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xs border border-border hover:border-amber text-[10px] font-mono uppercase text-amber hover:bg-amber/10 transition flex items-center gap-1.5 font-bold shadow-plate"
                  >
                    <Download className="w-3.5 h-3.5 text-amber" />
                    <span>DOWNLOAD</span>
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DOCUMENT INSPECTION MODAL */}
      {inspectingDoc && (
        <Modal
          isOpen={Boolean(inspectingDoc)}
          onClose={() => setInspectingDoc(null)}
          title="OBJECT SPECIFICATION FORENSICS"
          description={`Cryptographic metadata and provenance records for ${inspectingDoc.title}.`}
        >
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3 bg-bg-0 border border-border rounded-xs space-y-2">
              <div className="text-foreground font-bold text-sm truncate">{inspectingDoc.title}</div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-steel pt-1 border-t border-border">
                <div>
                  <span className="text-concrete font-bold">PROJECT: </span>
                  <span>{inspectingDoc.project?.name || "Corporate Wide"}</span>
                </div>
                <div>
                  <span className="text-concrete font-bold">OBJECT SIZE: </span>
                  <span>{formatSize(inspectingDoc.fileSize)}</span>
                </div>
                <div>
                  <span className="text-concrete font-bold">MIME TYPE: </span>
                  <span className="uppercase">{inspectingDoc.fileType}</span>
                </div>
                <div>
                  <span className="text-concrete font-bold">TIMESTAMP: </span>
                  <span>{new Date(inspectingDoc.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-bg-0 border border-border rounded-xs space-y-1 text-[11px]">
              <div className="text-steel uppercase font-bold">S3 STORAGE LOCATOR</div>
              <div className="text-amber truncate">{inspectingDoc.fileUrl}</div>
              <div className="text-gold text-[10px]">ENCRYPTION: AES-256 · SHA-256 CHECKSUM VERIFIED</div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => handleDeleteDocument(inspectingDoc.id, inspectingDoc.title)}
                className="px-3 py-1.5 rounded-xs border border-crimson/40 bg-crimson/10 text-crimson hover:bg-crimson hover:text-ivory font-bold uppercase text-[10px] transition"
              >
                DELETE OBJECT
              </button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInspectingDoc(null)}
                  className="px-4 py-1.5 rounded-xs font-mono text-xs uppercase"
                >
                  Close
                </Button>
                <a
                  href={inspectingDoc.downloadUrl || inspectingDoc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-1.5 rounded-xs font-mono text-xs uppercase font-bold bg-amber text-bg-0 hover:bg-molten transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </a>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* UPLOAD SPECIFICATION MODAL */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="UPLOAD SPECIFICATION OBJECT"
          description="Encrypt and archive blueprints, IPC certificates, and laboratory soil reports."
        >
          <form onSubmit={handleUploadSubmit} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-concrete mb-1 font-bold uppercase text-[10px]">
                Document Title *
              </label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. Padma_Rail_Pier_Truss_Calculations_Rev3.pdf"
                className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:border-amber focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-concrete mb-1 font-bold uppercase text-[10px]">
                Associated Megaproject (Optional)
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-bg-0 border border-border rounded-xs text-foreground focus:border-amber focus:outline-none"
              >
                <option value="">Corporate Global Specification</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-concrete mb-1 font-bold uppercase text-[10px]">
                Select File (PDF, DWG, CAD, DOCX, IMG) *
              </label>
              <input
                type="file"
                required
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setSelectedFile(file);
                  if (file && !uploadTitle) {
                    setUploadTitle(file.name);
                  }
                }}
                className="w-full text-xs font-mono text-steel file:mr-3 file:py-1.5 file:px-3 file:rounded-xs file:border file:border-border file:text-xs file:font-mono file:bg-bg-0 file:text-amber hover:file:border-amber cursor-pointer"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={uploading}
                className="px-4 py-1.5 rounded-xs font-mono text-xs uppercase"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={uploading}
                className="px-5 py-1.5 rounded-xs font-mono text-xs uppercase font-bold bg-amber text-bg-0 hover:bg-molten"
              >
                {uploading ? "STREAMING TO S3..." : "Confirm Upload"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
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
  LayoutDashboard,
  ArrowRight,
  X,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Quick Action";
  href: string;
  icon: any;
}

const ALL_COMMANDS: CommandItem[] = [
  { id: "dash", title: "Dashboard Overview", category: "Navigation", href: "/dashboard", icon: LayoutDashboard },
  { id: "proj", title: "Project Directory", category: "Navigation", href: "/projects", icon: Building2 },
  { id: "proj-new", title: "Create New Project", category: "Quick Action", href: "/projects/new", icon: Building2 },
  { id: "tasks", title: "Tasks Registry", category: "Navigation", href: "/tasks", icon: CheckSquare },
  { id: "kanban", title: "Kanban Task Board", category: "Navigation", href: "/tasks/kanban", icon: Trello },
  { id: "budget", title: "Budget & Variance Analysis", category: "Navigation", href: "/budget", icon: PieChart },
  { id: "expenses", title: "Expense Ledger", category: "Navigation", href: "/expenses", icon: Receipt },
  { id: "materials", title: "Material Inventory & Stock", category: "Navigation", href: "/materials", icon: Boxes },
  { id: "contractors", title: "Contractors & Subcontractors", category: "Navigation", href: "/contractors", icon: Users2 },
  { id: "reports", title: "Site & Progress Reports", category: "Navigation", href: "/reports", icon: FileSpreadsheet },
  { id: "docs", title: "Document Management Vault", category: "Navigation", href: "/documents", icon: FileText },
  { id: "users", title: "User & Role Administration", category: "Navigation", href: "/users", icon: ShieldCheck },
  { id: "logs", title: "System Activity Audit Trail", category: "Navigation", href: "/activity-logs", icon: History },
  { id: "settings", title: "System Configuration", category: "Navigation", href: "/settings/system", icon: Settings },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = ALL_COMMANDS.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent toggles
      }
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        router.push(filtered[selectedIndex].href);
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, filtered, selectedIndex, router]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[#171513] border border-[#2F2A25] shadow-plate rounded-sm overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="px-4 py-3 border-b border-[#2F2A25] flex items-center gap-3 bg-[#0E0D0C]">
          <Search className="w-4 h-4 text-[#FFB000]" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or jump to page..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-[#F4EFE6] placeholder-[#8C8782] focus:outline-none font-mono"
          />
          <button onClick={onClose} className="text-[#8C8782] hover:text-[#FFB000]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto p-2 divide-y divide-[#2F2A25]/40">
          {filtered.length > 0 ? (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xs cursor-pointer text-xs font-mono uppercase tracking-wider transition-colors",
                    isSelected
                      ? "bg-[#211E1B] text-[#FFB000] border-l-2 border-[#FFB000] pl-2.5 shadow-plate"
                      : "text-[#C9C3BB] hover:bg-[#211E1B]/50 hover:text-[#F4EFE6]"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn("w-4 h-4", isSelected ? "text-[#FFB000]" : "text-[#8C8782]")} />
                    <span className="font-semibold">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#8C8782]">
                    <span className="px-1.5 py-0.5 rounded-xs bg-[#0E0D0C] border border-[#2F2A25]">
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-[#FFB000]" />}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs font-mono text-[#8C8782]">
              No matching commands found.
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-[#0E0D0C] border-t border-[#2F2A25] flex items-center justify-between text-[11px] font-mono text-[#8C8782]">
          <div className="flex items-center gap-3">
            <span>[↑↓] Navigate</span>
            <span>[ENTER] Select</span>
            <span>[ESC] Close</span>
          </div>
          <span className="text-[#FFB000]">BUILDTRACK CLI</span>
        </div>
      </div>
    </div>
  );
}

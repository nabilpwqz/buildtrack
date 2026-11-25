"use client";

import React, { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount?: number;
  pageIndex?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSearchChange?: (query: string) => void;
  onSortChange?: (field: string, desc: boolean) => void;
  searchValue?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  exportFileName?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount = 1,
  pageIndex = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onSortChange,
  searchValue = "",
  searchPlaceholder = "Search records...",
  loading = false,
  exportFileName = "buildtrack-export.csv",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [showColMenu, setShowColMenu] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchValue);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    pageCount,
    manualPagination: true,
    manualSorting: true,
    onSortingChange: (updater) => {
      const nextSorting = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(nextSorting);
      if (nextSorting.length > 0 && onSortChange) {
        onSortChange(nextSorting[0].id, nextSorting[0].desc);
      }
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleExportCSV = () => {
    if (!data || data.length === 0) return;

    // Extract headers
    const headers = columns
      .filter((col: any) => col.accessorKey || col.id)
      .map((col: any) => col.header?.toString() || col.accessorKey || col.id);

    const keys = columns
      .filter((col: any) => col.accessorKey || col.id)
      .map((col: any) => col.accessorKey || col.id);

    const rows = data.map((item: any) => {
      return keys
        .map((k) => {
          let val = item[k];
          if (typeof val === "object" && val !== null) {
            val = JSON.stringify(val);
          }
          val = String(val ?? "").replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", exportFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-4">
      {/* Controls: Search, Column Toggle, Export */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {onSearchChange ? (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8782]" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                onSearchChange(e.target.value);
              }}
              className="w-full pl-9 pr-4 py-2 bg-[#171513] border border-[#2F2A25] rounded-sm text-sm text-[#F4EFE6] placeholder-[#8C8782] focus:outline-none focus:border-[#FFB000] transition"
            />
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2 relative">
          {/* Column Visibility */}
          <div className="relative">
            <button
              onClick={() => setShowColMenu(!showColMenu)}
              className="px-3 py-2 bg-[#171513] border border-[#2F2A25] hover:border-[#FFB000]/60 rounded-sm text-xs font-mono text-[#C9C3BB] hover:text-[#FFB000] flex items-center gap-2 transition"
              title="Toggle Columns"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>COLUMNS</span>
            </button>

            {showColMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#211E1B] border border-[#2F2A25] shadow-plate rounded-sm p-2 z-50 space-y-1.5">
                <div className="text-[11px] font-mono text-[#8C8782] uppercase px-1 pb-1 border-b border-[#2F2A25]">
                  Visible Columns
                </div>
                {table
                  .getAllLeafColumns()
                  .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
                  .map((column) => {
                    return (
                      <label
                        key={column.id}
                        className="flex items-center gap-2 px-2 py-1 text-xs text-[#C9C3BB] hover:bg-[#171513] cursor-pointer rounded-xs"
                      >
                        <input
                          type="checkbox"
                          checked={column.getIsVisible()}
                          onChange={column.getToggleVisibilityHandler()}
                          className="accent-[#FFB000] rounded"
                        />
                        <span className="capitalize">{column.id}</span>
                      </label>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-[#171513] border border-[#2F2A25] hover:border-[#FFB000]/60 rounded-sm text-xs font-mono text-[#C9C3BB] hover:text-[#FFB000] flex items-center gap-2 transition"
            title="Export as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="steel-card overflow-hidden rounded-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-[#2F2A25] bg-[#0E0D0C]/80">
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    return (
                      <th
                        key={header.id}
                        className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-[#8C8782] select-none"
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              "flex items-center gap-1.5",
                              canSort && "cursor-pointer hover:text-[#FFB000]"
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {canSort && <ArrowUpDown className="w-3 h-3 text-[#8C8782]" />}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-[#2F2A25]">
              {loading ? (
                Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                  <tr key={`skel-${i}`} className="animate-pulse">
                    {columns.map((_, cIdx) => (
                      <td key={`skel-c-${cIdx}`} className="px-4 py-4">
                        <div className="h-4 bg-[#211E1B] rounded-xs w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-[#211E1B]/60 transition-colors group"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3.5 text-[#C9C3BB] text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-32 text-center text-[#8C8782] font-mono text-xs uppercase tracking-wider"
                  >
                    No records found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 border-t border-[#2F2A25] bg-[#0E0D0C]/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[#8C8782]">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className="bg-[#171513] border border-[#2F2A25] rounded-xs text-[#F4EFE6] px-2 py-1 focus:outline-none focus:border-[#FFB000]"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>
              Page {pageIndex + 1} of {Math.max(1, pageCount)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange?.(0)}
              disabled={pageIndex === 0}
              className="p-1.5 rounded-xs border border-[#2F2A25] hover:border-[#FFB000]/60 hover:text-[#FFB000] disabled:opacity-30 disabled:pointer-events-none transition"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange?.(pageIndex - 1)}
              disabled={pageIndex === 0}
              className="p-1.5 rounded-xs border border-[#2F2A25] hover:border-[#FFB000]/60 hover:text-[#FFB000] disabled:opacity-30 disabled:pointer-events-none transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange?.(pageIndex + 1)}
              disabled={pageIndex >= pageCount - 1}
              className="p-1.5 rounded-xs border border-[#2F2A25] hover:border-[#FFB000]/60 hover:text-[#FFB000] disabled:opacity-30 disabled:pointer-events-none transition"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange?.(pageCount - 1)}
              disabled={pageIndex >= pageCount - 1}
              className="p-1.5 rounded-xs border border-[#2F2A25] hover:border-[#FFB000]/60 hover:text-[#FFB000] disabled:opacity-30 disabled:pointer-events-none transition"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

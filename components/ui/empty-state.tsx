import React from "react";
import { FolderX, AlertCircle } from "@/components/ui/icons";

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "No records found",
  description = "There is no data to display matching your criteria.",
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div className="steel-card p-10 flex flex-col items-center justify-center text-center space-y-4 rounded-sm">
      <div className="w-12 h-12 rounded-sm bg-[#211E1B] border border-[#2F2A25] flex items-center justify-center text-[#8C8782]">
        {icon || <FolderX className="w-6 h-6" />}
      </div>
      <div className="max-w-sm space-y-1">
        <h4 className="text-sm font-semibold font-mono uppercase tracking-wider text-[#F4EFE6]">
          {title}
        </h4>
        <p className="text-xs text-[#8C8782]">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

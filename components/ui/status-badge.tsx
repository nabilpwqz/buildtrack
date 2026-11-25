import React from "react";
import { Check, Lock, AlertTriangle, Clock, Hammer, ShieldAlert, Sparkles } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type BadgeStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "REVIEW"
  | "COMPLETED"
  | "DELAYED"
  | "OVERDUE"
  | "OVERRUN"
  | "BLOCKED"
  | "LOW_STOCK"
  | "ON_HOLD"
  | "PLANNING"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "FULFILLED"
  | "ACTIVE"
  | "SUSPENDED"
  | string;

interface StatusBadgeProps {
  status: BadgeStatus;
  label?: string;
  className?: string;
  icon?: boolean;
}

export function StatusBadge({ status, label, className, icon = true }: StatusBadgeProps) {
  const norm = (status || "").toUpperCase();

  let bgClass = "bg-[#211E1B] text-[#8C8782] border-[#2F2A25]";
  let iconComponent: React.ReactNode = null;
  let defaultLabel = status;

  switch (norm) {
    case "TODO":
    case "PLANNING":
    case "PENDING":
      bgClass = "bg-[#171513] text-[#8C8782] border-[#8C8782]/40";
      if (icon) iconComponent = <Clock className="w-3 h-3 text-[#8C8782]" />;
      defaultLabel = norm === "TODO" ? "To Do" : norm === "PLANNING" ? "Planning" : "Pending";
      break;

    case "IN_PROGRESS":
    case "ACTIVE":
      bgClass = "bg-[#FFB000]/10 text-[#FFB000] border-[#FFB000]/50";
      if (icon) iconComponent = <Hammer className="w-3 h-3 text-[#FFB000]" />;
      defaultLabel = norm === "IN_PROGRESS" ? "In Progress" : "Active";
      break;

    case "REVIEW":
    case "LOW_STOCK":
      bgClass = "bg-[#FF6A13]/10 text-[#FF6A13] border-[#FF6A13]/50";
      if (icon) iconComponent = <AlertTriangle className="w-3 h-3 text-[#FF6A13]" />;
      defaultLabel = norm === "REVIEW" ? "Under Review" : "Low Stock";
      break;

    case "COMPLETED":
    case "APPROVED":
    case "FULFILLED":
      // Ivory/Gold with Check icon - NEVER green!
      bgClass = "bg-[#E8C547]/10 text-[#E8C547] border-[#E8C547]/60";
      if (icon) iconComponent = <Check className="w-3 h-3 text-[#E8C547]" />;
      defaultLabel = norm === "COMPLETED" ? "Completed" : norm === "APPROVED" ? "Approved" : "Fulfilled";
      break;

    case "DELAYED":
    case "OVERDUE":
    case "OVERRUN":
    case "REJECTED":
    case "SUSPENDED":
      bgClass = "bg-[#E03131]/10 text-[#E03131] border-[#E03131]/50";
      if (icon) iconComponent = <ShieldAlert className="w-3 h-3 text-[#E03131]" />;
      defaultLabel =
        norm === "DELAYED"
          ? "Delayed"
          : norm === "OVERDUE"
          ? "Overdue"
          : norm === "OVERRUN"
          ? "Budget Overrun"
          : norm === "REJECTED"
          ? "Rejected"
          : "Suspended";
      break;

    case "BLOCKED":
      bgClass = "bg-[#8E2F1F]/20 text-[#D9B98A] border-[#8E2F1F]";
      if (icon) iconComponent = <Lock className="w-3 h-3 text-[#E03131]" />;
      defaultLabel = "Blocked";
      break;

    case "ON_HOLD":
      bgClass = "bg-[#8C8782]/20 text-[#C9C3BB] border-[#8C8782]";
      if (icon) iconComponent = <Clock className="w-3 h-3 text-[#8C8782]" />;
      defaultLabel = "On Hold";
      break;

    default:
      bgClass = "bg-[#211E1B] text-[#C9C3BB] border-[#2F2A25]";
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm border font-mono text-xs uppercase tracking-wider font-semibold select-none",
        bgClass,
        className
      )}
    >
      {iconComponent}
      <span>{label || defaultLabel}</span>
    </span>
  );
}

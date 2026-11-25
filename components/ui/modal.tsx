"use client";

import React, { useEffect } from "react";
import { X } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "lg",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={cn(
          "w-full bg-[#171513] border border-[#2F2A25] shadow-plate rounded-sm overflow-hidden flex flex-col max-h-[90vh]",
          maxWidthClasses[maxWidth]
        )}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2F2A25] flex items-center justify-between bg-[#0E0D0C]/80">
          <div>
            <h2 className="text-base font-semibold font-mono uppercase tracking-wider text-[#F4EFE6]">
              {title}
            </h2>
            {description && <p className="text-xs text-[#8C8782] mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xs text-[#8C8782] hover:text-[#FFB000] hover:bg-[#211E1B] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

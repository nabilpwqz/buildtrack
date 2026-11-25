"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { CommandPalette } from "@/components/command-palette";

interface DashboardShellProps {
  userRole?: string;
  userName?: string;
  userEmail?: string;
  children: React.ReactNode;
}

export function DashboardShell({
  userRole = "SITE_ENGINEER",
  userName = "Operator",
  userEmail = "",
  children,
}: DashboardShellProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar userRole={userRole} userName={userName} userEmail={userEmail} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          userRole={userRole}
          userName={userName}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}


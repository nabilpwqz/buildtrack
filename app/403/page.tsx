import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "@/components/ui/icons";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-[#0E0D0C] flex items-center justify-center p-4">
      <div className="steel-card p-8 sm:p-12 max-w-lg w-full text-center space-y-6 rounded-sm relative overflow-hidden">
        {/* Hazard stripe top bar */}
        <div className="absolute top-0 left-0 right-0 h-2 hazard-stripe-crimson" />

        <div className="w-16 h-16 rounded-sm bg-[#E03131]/10 border border-[#E03131] flex items-center justify-center text-[#E03131] mx-auto shadow-crimson">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-extrabold uppercase tracking-wider text-[#F4EFE6]">
            403 <span className="text-[#E03131]">ACCESS RESTRICTED</span>
          </h1>
          <p className="text-xs font-mono text-[#8C8782] uppercase tracking-widest">
            INSUFFICIENT RBAC AUTHORIZATION CLEARANCE TIER
          </p>
        </div>

        <p className="text-xs font-mono text-[#C9C3BB] leading-relaxed">
          Your active security role does not have execution permission for this sensitive engineering or financial division.
          This attempt has been logged to the immutable activity audit ledger.
        </p>

        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFB000] text-[#0E0D0C] font-mono text-xs font-bold uppercase tracking-wider rounded-xs hover:bg-[#FFB000]/90 transition shadow-amber"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO DASHBOARD</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

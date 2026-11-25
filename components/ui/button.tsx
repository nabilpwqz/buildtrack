import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, disabled, children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center font-mono uppercase tracking-wider font-semibold transition-all select-none rounded-sm border focus:outline-none focus:ring-2 focus:ring-[#FFB000]/50 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

    const variants = {
      primary:
        "bg-[#FFB000] text-[#0E0D0C] border-[#FFB000] hover:bg-[#FFB000]/90 shadow-amber hover:shadow-[0_0_20px_rgba(255,176,0,0.5)] font-bold",
      secondary:
        "bg-[#211E1B] text-[#F4EFE6] border-[#2F2A25] hover:border-[#FFB000]/60 hover:text-[#FFB000]",
      danger:
        "bg-[#E03131] text-[#F4EFE6] border-[#E03131] hover:bg-[#C92A2A] shadow-crimson hover:shadow-[0_0_20px_rgba(224,49,49,0.5)]",
      ghost:
        "bg-transparent text-[#C9C3BB] border-transparent hover:bg-[#211E1B] hover:text-[#FFB000]",
      outline:
        "bg-transparent text-[#F4EFE6] border-[#2F2A25] hover:border-[#FFB000] hover:text-[#FFB000]",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-9 px-4 text-xs gap-2",
      lg: "h-11 px-6 text-sm gap-2.5",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";


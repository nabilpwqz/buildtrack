import React from "react";
import Link from "next/link";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  iconOnly?: boolean;
}

export function Logo({ className = "", size = "md", iconOnly = false }: LogoProps) {
  const sizeMap = {
    sm: { icon: 20, text: "text-xs sm:text-sm", sub: "text-[8px]" },
    md: { icon: 28, text: "text-sm sm:text-base md:text-lg", sub: "text-[8px] sm:text-[9px]" },
    lg: { icon: 40, text: "text-xl sm:text-2xl", sub: "text-[10px] sm:text-xs" },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2 sm:gap-2.5 select-none min-w-0 ${className}`}>
      {/* Precision Geometric Hexagonal Truss Mark */}
      <svg
        width={currentSize.icon}
        height={currentSize.icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-[0_2px_8px_rgba(255,176,0,0.25)]"
      >
        {/* Outer Steel Hexagon Frame */}
        <polygon
          points="24,4 43,14 43,34 24,44 5,34 5,14"
          fill="var(--bg-1)"
          stroke="var(--steel)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Diagonal Structural Braces */}
        <line x1="24" y1="4" x2="24" y2="44" stroke="var(--border-color)" strokeWidth="2" />
        <line x1="5" y1="14" x2="43" y2="34" stroke="var(--border-color)" strokeWidth="1.5" />
        <line x1="5" y1="34" x2="43" y2="14" stroke="var(--border-color)" strokeWidth="1.5" />

        {/* Inner Molten Amber Crane Truss Core */}
        <polygon
          points="24,12 36,19 36,29 24,36 12,29 12,19"
          fill="var(--bg-0)"
          stroke="var(--amber)"
          strokeWidth="2"
        />

        {/* Central Structural Molten Node */}
        <circle cx="24" cy="24" r="4.5" fill="var(--molten)" stroke="var(--amber)" strokeWidth="1.5" />
        <circle cx="24" cy="24" r="1.5" fill="var(--ivory)" />

        {/* Corner Rivet Points */}
        <circle cx="24" cy="4" r="1.5" fill="var(--concrete)" />
        <circle cx="43" cy="14" r="1.5" fill="var(--concrete)" />
        <circle cx="43" cy="34" r="1.5" fill="var(--concrete)" />
        <circle cx="24" cy="44" r="1.5" fill="var(--concrete)" />
        <circle cx="5" cy="34" r="1.5" fill="var(--concrete)" />
        <circle cx="5" cy="14" r="1.5" fill="var(--concrete)" />
      </svg>

      {!iconOnly && (
        <div className="flex flex-col leading-none min-w-0">
          <span
            className={`font-heading font-black tracking-widest text-foreground uppercase truncate ${currentSize.text}`}
          >
            BUILD<span className="text-amber">TRACK</span>
          </span>
          <span
            className={`font-mono text-steel tracking-wider uppercase mt-0.5 sm:mt-1 truncate ${currentSize.sub}`}
          >
            PROJECT INTELLIGENCE
          </span>
        </div>
      )}
    </div>
  );
}

export function LogoLink({
  href = "/",
  className = "",
  size = "md",
  iconOnly = false,
}: LogoProps & { href?: string }) {
  return (
    <Link href={href} className="inline-block hover:opacity-95 transition-opacity">
      <Logo className={className} size={size} iconOnly={iconOnly} />
    </Link>
  );
}


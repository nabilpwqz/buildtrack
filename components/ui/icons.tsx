import React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
  className?: string;
}

const defaultProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function AlertCircle({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function AlertTriangle({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function ArrowLeft({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

export function ArrowRight({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function ArrowUpDown({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
    </svg>
  );
}

export function ArrowUpRight({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

export function Award({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

export function BarChart3({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}

export function Bell({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function Boxes({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l5.5 3.18a2 2 0 0 0 2.06 0l5.5-3.18a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L10.53 9.74a2 2 0 0 0-2.06 0l-5.5 3.18Z" />
      <path d="m12 15 5.5-3.18a2 2 0 0 0 .97-1.71V6.87a2 2 0 0 0-.97-1.71l-5.5-3.18a2 2 0 0 0-2.06 0l-5.5 3.18a2 2 0 0 0-.97 1.71v3.24a2 2 0 0 0 .97 1.71L10 13.82" />
      <path d="m7.5 4.27 9 5.2" />
      <path d="M2.5 14.5 12 20l9.5-5.5" />
    </svg>
  );
}

export function Building({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  );
}

export function Building2({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v8h4" />
      <path d="M18 9h2a2 2 0 0 1 2 2v11h-4" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  );
}

export function Calendar({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function Check({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function CheckCircle({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export function CheckCircle2({ size = 20, className = "", ...props }: IconProps) {
  return <CheckCircle size={size} className={className} {...props} />;
}

export function CheckSquare({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

export function ChevronDown({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function ChevronUp({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

export function ChevronLeft({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function ChevronRight({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function ChevronsLeft({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <polyline points="11 17 6 12 11 7" />
      <polyline points="18 17 13 12 18 7" />
    </svg>
  );
}

export function ChevronsRight({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <polyline points="13 17 18 12 13 7" />
      <polyline points="6 17 11 12 6 7" />
    </svg>
  );
}

export function Clock({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function CloudSun({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M12 2v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="M20 12h2" />
      <path d="m19.07 4.93-1.41 1.41" />
      <path d="M15.947 12.65a4 4 0 0 0-5.925-4.128" />
      <path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" />
    </svg>
  );
}

export function Database({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}

export function DollarSign({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

export function Download({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function ExternalLink({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export function Eye({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function File({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}

export function FileSpreadsheet({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M8 13h2" />
      <path d="M14 13h2" />
      <path d="M8 17h2" />
      <path d="M14 17h2" />
    </svg>
  );
}

export function FileText({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}

export function Filter({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export function Flame({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5Z" />
    </svg>
  );
}

export function Folder({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

export function FolderX({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
      <line x1="9.5" y1="10.5" x2="14.5" y2="15.5" />
      <line x1="14.5" y1="10.5" x2="9.5" y2="15.5" />
    </svg>
  );
}

export function Hammer({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="m15 12-8.5 8.5a2.12 2.12 0 1 1-3-3L12 9" />
      <path d="M17.64 15 22 10.64" />
      <path d="m20.91 3.26-4.17-1.11a1 1 0 0 0-1.12.56L14 6l4 4 3.29-1.62a1 1 0 0 0 .56-1.12l-1.11-4.17a1 1 0 0 0-.83-.83Z" />
    </svg>
  );
}

export function HardDrive({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <line x1="22" y1="12" x2="2" y2="12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
      <line x1="6" y1="16" x2="6.01" y2="16" />
      <line x1="10" y1="16" x2="10.01" y2="16" />
    </svg>
  );
}

export function HardHat({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2Z" />
      <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
    </svg>
  );
}

export function History({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

export function MessageSquare({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function KeyRound({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" />
      <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  );
}

export function LayoutDashboard({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

export function Layers({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

export function List({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

export function Lock({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function LogOut({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function Mail({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export function Menu({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

export function Moon({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

export function Phone({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export function PieChart({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}

export function Plus({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function Receipt({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 6v12" />
    </svg>
  );
}

export function Search({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function Send({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export function Settings({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function Shield({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export function ShieldAlert({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function ShieldCheck({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

export function SlidersHorizontal({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <line x1="21" y1="4" x2="14" y2="4" />
      <line x1="10" y1="4" x2="3" y2="4" />
      <line x1="21" y1="12" x2="12" y2="12" />
      <line x1="8" y1="12" x2="3" y2="12" />
      <line x1="21" y1="20" x2="16" y2="20" />
      <line x1="12" y1="20" x2="3" y2="20" />
      <line x1="14" y1="2" x2="14" y2="6" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <line x1="16" y1="18" x2="16" y2="22" />
    </svg>
  );
}

export function Sparkles({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

export function Star({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function Sun({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

export function Trello({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <rect width="3" height="9" x="7" y="7" />
      <rect width="3" height="5" x="14" y="7" />
    </svg>
  );
}

export function TrendingUp({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

export function Upload({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export function User({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function Users({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function Users2({ size = 20, className = "", ...props }: IconProps) {
  return <Users size={size} className={className} {...props} />;
}

export function X({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function XCircle({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

export function ZoomIn({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

export function ZoomOut({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

export function Zap({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function Copy({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

export function RefreshCw({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

export function Trash2({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export function Edit3({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaultProps} className={className} {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

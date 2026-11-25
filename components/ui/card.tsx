import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hazard?: boolean;
  hazardCrimson?: boolean;
}

export function Card({ className, hazard, hazardCrimson, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "steel-card rounded-sm p-5 relative overflow-hidden",
        hazard && "border-t-4 border-t-[#FFB000]",
        hazardCrimson && "border-t-4 border-t-[#E03131]",
        className
      )}
      {...props}
    >
      {hazard && (
        <div className="absolute top-0 left-0 right-0 h-1.5 hazard-stripe opacity-80" />
      )}
      {hazardCrimson && (
        <div className="absolute top-0 left-0 right-0 h-1.5 hazard-stripe-crimson opacity-80" />
      )}
      {children}
    </div>
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 pb-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-semibold uppercase tracking-wider text-[#F4EFE6] font-mono", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-[#8C8782]", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("pt-2", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center pt-4 border-t border-[#2F2A25] mt-4", className)} {...props} />;
}


import React from "react";
import { BudgetStatus } from "@/types/budget";
import { cn } from "@/utils/cn";

interface ProgressBarProps {
  percentage: number;
  status?: BudgetStatus;
  className?: string;
  heightClass?: string;
  showOverflowWarning?: boolean;
}

export function ProgressBar({
  percentage,
  status,
  className,
  heightClass = "h-2",
  showOverflowWarning = true,
}: ProgressBarProps) {
  // Cap visual width at 100% so it doesn't break layout, but keep state
  const visualWidth = Math.min(Math.max(percentage, 0), 100);
  const isOverflow = percentage > 100;

  let colorClasses = "bg-gradient-to-r from-emerald-500 to-teal-400";
  if (status === "warning" || (percentage > 80 && percentage <= 100)) {
    colorClasses = "bg-gradient-to-r from-amber-500 to-yellow-400";
  } else if (status === "overspent" || isOverflow) {
    colorClasses = "bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_8px_rgba(244,63,94,0.4)]";
  }

  return (
    <div className={cn("w-full bg-zinc-800/80 rounded-full overflow-hidden p-0.5 relative", className)}>
      <div
        className={cn(
          "rounded-full transition-all duration-500 ease-out",
          heightClass,
          colorClasses
        )}
        style={{ width: `${visualWidth}%` }}
      />
      {isOverflow && showOverflowWarning && (
        <span className="sr-only">Presupuesto excedido</span>
      )}
    </div>
  );
}

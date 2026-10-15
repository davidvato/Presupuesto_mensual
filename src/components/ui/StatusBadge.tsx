import React from "react";
import { BudgetStatus } from "@/types/budget";
import { formatMXN, formatPercentage } from "@/utils/formatters";
import { CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";

interface StatusBadgeProps {
  status: BudgetStatus;
  percentage?: number;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, percentage, className, showIcon = true }: StatusBadgeProps) {
  const configs = {
    healthy: {
      label: "Saludable",
      bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      icon: CheckCircle2,
    },
    warning: {
      label: "En Alerta",
      bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      icon: AlertTriangle,
    },
    overspent: {
      label: "Sobregiro",
      bg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      icon: AlertCircle,
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all",
        config.bg,
        className
      )}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{percentage !== undefined ? formatPercentage(percentage) : config.label}</span>
    </span>
  );
}

interface DifferenceBadgeProps {
  difference: number;
  className?: string;
}

export function DifferenceBadge({ difference, className }: DifferenceBadgeProps) {
  const isPositive = difference >= 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono font-medium text-xs md:text-sm px-2.5 py-1 rounded-lg border",
        isPositive
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : "bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]",
        className
      )}
    >
      <span>{isPositive ? "+" : ""}</span>
      <span>{formatMXN(difference, false)}</span>
    </span>
  );
}

"use client";

import React from "react";
import { useBudget } from "@/context/BudgetContext";
import { formatMXN, formatPercentage } from "@/utils/formatters";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Target,
  CreditCard,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  AlertOctagon,
  CheckCircle2,
} from "lucide-react";

export function KpiCards() {
  const { summary, transactions } = useBudget();
  const isSurplus = summary.totalDifference >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* CARD 1: TOTAL PLANEADO */}
      <div className="relative overflow-hidden rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-5 backdrop-blur-md shadow-xl transition-all hover:border-zinc-700/60 group">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-indigo-500/10 blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Total Planeado
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Target className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono">
            {formatMXN(summary.totalPlanned)}
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
            <span>{summary.categorySummaries.length} categorías activas</span>
            <span className="text-indigo-400/90 font-medium">Meta del mes</span>
          </div>
        </div>
      </div>

      {/* CARD 2: TOTAL GASTADO / ACTUAL */}
      <div className="relative overflow-hidden rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-5 backdrop-blur-md shadow-xl transition-all hover:border-zinc-700/60 group">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-sky-500/10 blur-2xl group-hover:bg-sky-500/20 transition-all pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Total Gastado (Actual)
          </span>
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono">
              {formatMXN(summary.totalActual)}
            </span>
            <StatusBadge status={summary.status} percentage={summary.totalPercentage} />
          </div>

          <div className="space-y-1.5 pt-1">
            <ProgressBar percentage={summary.totalPercentage} status={summary.status} />
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>{transactions.length} movimientos registrados</span>
              <span className="font-mono">{formatPercentage(summary.totalPercentage)} utilizado</span>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 3: REMANENTE / BALANCE */}
      <div
        className={`relative overflow-hidden rounded-2xl p-5 backdrop-blur-md shadow-xl transition-all border group ${
          isSurplus
            ? "bg-zinc-900/60 border-zinc-800/80 hover:border-emerald-500/40"
            : "bg-rose-950/20 border-rose-900/50 hover:border-rose-500/60"
        }`}
      >
        <div
          className={`absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full blur-2xl transition-all pointer-events-none ${
            isSurplus ? "bg-emerald-500/10 group-hover:bg-emerald-500/20" : "bg-rose-500/20 group-hover:bg-rose-500/30"
          }`}
        />

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Remanente / Balance
          </span>
          <div
            className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
              isSurplus
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-rose-500/15 border-rose-500/30 text-rose-400"
            }`}
          >
            {isSurplus ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
        </div>

        <div className="space-y-1">
          <div
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-mono ${
              isSurplus ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatMXN(summary.totalDifference)}
          </div>

          <div className="flex items-center gap-1.5 text-xs pt-1">
            {isSurplus ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-zinc-300">
                  Saldo a favor disponible para cerrar el mes
                </span>
              </>
            ) : (
              <>
                <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="text-rose-300 font-medium">
                  Presupuesto excedido por {formatMXN(Math.abs(summary.totalDifference))}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

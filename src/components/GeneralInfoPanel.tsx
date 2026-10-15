"use client";

import React, { useState } from "react";
import { useBudget } from "@/context/BudgetContext";
import { formatMXN } from "@/utils/formatters";
import {
  Wallet,
  Banknote,
  CreditCard,
  Zap,
  Fuel,
  Plus,
  Landmark,
  Calculator,
  ChevronDown,
  ChevronUp,
  Info,
  ArrowDownLeft,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export function GeneralInfoPanel() {
  const { generalInfo, openTransactionModal } = useBudget();
  const [showBreakdown, setShowBreakdown] = useState(false);

  const isCashPositive = generalInfo.availableCash >= 0;

  return (
    <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-4 sm:p-5 backdrop-blur-md shadow-xl space-y-4">
      {/* Header of General Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Información General del Mes
              </h2>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                100% Automatizado
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Resumen ejecutivo calculado dinámicamente según ingresos y egresos registrados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle breakdown details */}
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 text-xs font-medium rounded-xl border border-zinc-700/80 transition-all active:scale-95"
            title="Ver fórmula y desglose de cálculo"
          >
            <Calculator className="w-3.5 h-3.5 text-zinc-400" />
            <span>{showBreakdown ? "Ocultar Desglose" : "Ver Desglose"}</span>
            {showBreakdown ? (
              <ChevronUp className="w-3 h-3 text-zinc-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            )}
          </button>

          {/* Register Income Button */}
          <button
            onClick={() => openTransactionModal(undefined, undefined, "ingreso")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold rounded-xl border border-emerald-500/30 transition-all active:scale-95"
            title="Registrar nuevo ingreso o nómina del mes"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Registrar Ingreso</span>
          </button>
        </div>
      </div>

      {/* Grid of 6 Executive Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* 1. INGRESOS DEL MES (Calculado automáticamente) */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/30 to-zinc-950/70 border border-emerald-500/20 flex flex-col justify-between hover:border-emerald-500/40 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Ingresos del Mes
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-base sm:text-lg font-bold text-white font-mono tracking-tight block">
              {formatMXN(generalInfo.income)}
            </span>
            <div className="flex items-center justify-between text-[10px] text-emerald-400/90 font-medium">
              <span>{generalInfo.incomeCount} mov. registrados</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-300 font-mono">
                Auto
              </span>
            </div>
          </div>
        </div>

        {/* 2. EFECTIVO DISPONIBLE (Fórmula solicitada por usuario) */}
        <div
          className={`p-3.5 rounded-xl bg-gradient-to-br flex flex-col justify-between transition-all group border ${
            isCashPositive
              ? "from-teal-950/30 to-zinc-950/70 border-teal-500/20 hover:border-teal-500/40"
              : "from-rose-950/30 to-zinc-950/70 border-rose-500/30 hover:border-rose-500/50"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${
                isCashPositive ? "text-teal-400" : "text-rose-400"
              }`}
            >
              Efectivo Disp.
            </span>
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                isCashPositive
                  ? "bg-teal-500/15 text-teal-400"
                  : "bg-rose-500/15 text-rose-400"
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <span
              className={`text-base sm:text-lg font-bold font-mono tracking-tight block ${
                isCashPositive ? "text-white" : "text-rose-300"
              }`}
            >
              {formatMXN(generalInfo.availableCash)}
            </span>
            <div
              className={`flex items-center justify-between text-[10px] font-medium ${
                isCashPositive ? "text-teal-400/80" : "text-rose-400/80"
              }`}
            >
              <span>Flujo libre neto</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                  isCashPositive
                    ? "bg-teal-500/10 text-teal-300"
                    : "bg-rose-500/15 text-rose-300"
                }`}
              >
                Fórmula
              </span>
            </div>
          </div>
        </div>

        {/* 3. TOTAL TC BBVA */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-950/40 to-zinc-950/70 border border-blue-500/30 flex flex-col justify-between hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-blue-400">
              Total TC BBVA
            </span>
            <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-base sm:text-lg font-bold text-white font-mono tracking-tight block">
              {formatMXN(generalInfo.totalTcBbva)}
            </span>
            <div className="text-[10px] text-blue-300/80 font-medium truncate" title="Servicios + Gasolina + MSI + Varios">
              Serv + Gas + MSI + Var
            </div>
          </div>
        </div>

        {/* 4. TOTAL TC INVEX */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-purple-950/40 to-zinc-950/70 border border-purple-500/30 flex flex-col justify-between hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-purple-400">
              Total TC Invex
            </span>
            <div className="w-6 h-6 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-base sm:text-lg font-bold text-white font-mono tracking-tight block">
              {formatMXN(generalInfo.totalTcInvex)}
            </span>
            <div className="text-[10px] text-purple-300/80 font-medium truncate" title="Compras MSI + Gasolina Invex">
              MSI + Gasolina Invex
            </div>
          </div>
        </div>

        {/* 5. WATCHLIST SERVICIOS */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-sky-950/30 to-zinc-950/70 border border-sky-500/20 flex flex-col justify-between hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-sky-400">
              Servicios
            </span>
            <div className="w-6 h-6 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-base sm:text-lg font-bold text-white font-mono tracking-tight block">
              {formatMXN(generalInfo.totalServicios)}
            </span>
            <div className="text-[10px] text-sky-300/80 font-medium truncate" title="Luz, agua, internet, plataformas">
              Luz, internet, gas, apps
            </div>
          </div>
        </div>

        {/* 6. WATCHLIST GASOLINA */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-950/30 to-zinc-950/70 border border-amber-500/20 flex flex-col justify-between hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-amber-400">
              Gasolina
            </span>
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Fuel className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-base sm:text-lg font-bold text-white font-mono tracking-tight block">
              {formatMXN(generalInfo.totalGasolina)}
            </span>
            <div className="text-[10px] text-amber-300/80 font-medium truncate" title="Combustible acumulado">
              Combustible del mes
            </div>
          </div>
        </div>

      </div>

      {/* Expandable Mathematical Calculation Breakdown Drawer */}
      {showBreakdown && (
        <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 text-xs space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <div className="flex items-center gap-2 text-zinc-300 font-semibold">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>Desglose Matemático de Efectivo Disponible</span>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">
              Efectivo = Ingresos - TC - Hipoteca - Ahorro - GBM - TD
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Formula table */}
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between py-1 px-2 rounded bg-emerald-500/10 text-emerald-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                  (+) Ingresos del Mes (Nómina / Entradas)
                </span>
                <span>{formatMXN(generalInfo.income)}</span>
              </div>

              <div className="flex items-center justify-between py-1 px-2 rounded bg-zinc-900/60 text-zinc-300">
                <span className="text-zinc-400">(-) Pagos Tarjetas de Crédito (BBVA + Invex)</span>
                <span className="text-rose-400">-{formatMXN(generalInfo.totalTc)}</span>
              </div>

              <div className="flex items-center justify-between py-1 px-2 rounded bg-zinc-900/60 text-zinc-300">
                <span className="text-zinc-400">(-) Pagos / Transferencia Hipoteca</span>
                <span className="text-rose-400">-{formatMXN(generalInfo.totalHipoteca)}</span>
              </div>

              <div className="flex items-center justify-between py-1 px-2 rounded bg-zinc-900/60 text-zinc-300">
                <span className="text-zinc-400">(-) Pagos / Transferencia Fondo de Ahorro</span>
                <span className="text-rose-400">-{formatMXN(generalInfo.totalFondoAhorro)}</span>
              </div>

              <div className="flex items-center justify-between py-1 px-2 rounded bg-zinc-900/60 text-zinc-300">
                <span className="text-zinc-400">(-) Pagos / Transferencia GBM Inversión</span>
                <span className="text-rose-400">-{formatMXN(generalInfo.totalGbm)}</span>
              </div>

              <div className="flex items-center justify-between py-1 px-2 rounded bg-zinc-900/60 text-zinc-300">
                <span className="text-zinc-400">(-) Pagos / Transferencia TD Débito</span>
                <span className="text-rose-400">-{formatMXN(generalInfo.totalTd)}</span>
              </div>

              {generalInfo.totalOtherExpenses > 0 && (
                <div className="flex items-center justify-between py-1 px-2 rounded bg-zinc-900/60 text-zinc-300">
                  <span className="text-zinc-400">(-) Otros Egresos Registrados</span>
                  <span className="text-rose-400">-{formatMXN(generalInfo.totalOtherExpenses)}</span>
                </div>
              )}

              <div
                className={`flex items-center justify-between py-1.5 px-2 rounded font-bold border-t border-zinc-800 ${
                  isCashPositive
                    ? "bg-teal-500/15 text-teal-300 border-teal-500/30"
                    : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                }`}
              >
                <span>(=) Efectivo Disponible Final</span>
                <span className="text-sm">{formatMXN(generalInfo.availableCash)}</span>
              </div>
            </div>

            {/* Right: Explanatory notes */}
            <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-zinc-400 space-y-2 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-zinc-200 font-semibold">
                <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>¿Cómo funciona esta automatización?</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Cada vez que registras o eliminas un <strong className="text-zinc-200">Ingreso</strong> o un <strong className="text-zinc-200">Gasto</strong> con su método de pago o categoría correspondiente, este panel recalcula los saldos en tiempo real sin necesidad de ajustes manuales.
              </p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Sincronizado al instante con tu base de datos Neon PostgreSQL.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

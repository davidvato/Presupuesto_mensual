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
  Edit2,
  Check,
  X,
  Plus,
  Landmark,
  ShieldAlert,
  ArrowUpRight,
} from "lucide-react";

export function GeneralInfoPanel() {
  const { generalInfo, updateGeneralInfo, openTransactionModal } = useBudget();

  // Inline editing states for Income and Available Cash
  const [editingField, setEditingField] = useState<"income" | "availableCash" | null>(null);
  const [tempValue, setTempValue] = useState<string>("");

  const startEditing = (field: "income" | "availableCash", currentValue: number) => {
    setEditingField(field);
    setTempValue(currentValue.toString());
  };

  const saveEdit = async (field: "income" | "availableCash") => {
    const num = parseFloat(tempValue);
    if (!isNaN(num)) {
      await updateGeneralInfo({ [field]: Math.max(0, num) });
    }
    setEditingField(null);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setTempValue("");
  };

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
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Flujo & Pasivos
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Resumen ejecutivo consolidado de ingresos, liquidez, tarjetas y consumos críticos
            </p>
          </div>
        </div>

        <button
          onClick={() => openTransactionModal(undefined, undefined, "ingreso")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold rounded-xl border border-emerald-500/30 transition-all active:scale-95 self-start sm:self-auto"
          title="Registrar nuevo ingreso del mes"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Registrar Ingreso</span>
        </button>
      </div>

      {/* Grid of 6 Cards: 2 Flow + 2 Cards/Liabilities + 2 Critical Watchlist */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* 1. INGRESOS DEL MES */}
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
            {editingField === "income" ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit("income");
                    if (e.key === "Escape") cancelEdit();
                  }}
                  autoFocus
                  className="w-full px-1.5 py-0.5 bg-zinc-950 border border-emerald-500 rounded text-xs text-white font-mono"
                />
                <button onClick={() => saveEdit("income")} className="text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={cancelEdit} className="text-zinc-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => startEditing("income", generalInfo.income)}
                className="cursor-pointer group/val flex items-baseline justify-between"
                title="Clic para editar ingresos"
              >
                <span className="text-base sm:text-lg font-bold text-white font-mono tracking-tight">
                  {formatMXN(generalInfo.income)}
                </span>
                <Edit2 className="w-2.5 h-2.5 text-zinc-500 opacity-0 group-hover/val:opacity-100 transition-opacity" />
              </div>
            )}
            <div className="text-[10px] text-emerald-400/80 font-medium flex items-center gap-0.5">
              <span>Nómina y entradas</span>
            </div>
          </div>
        </div>

        {/* 2. EFECTIVO DISPONIBLE (CASH FLOW LIBRE) */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-teal-950/30 to-zinc-950/70 border border-teal-500/20 flex flex-col justify-between hover:border-teal-500/40 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-teal-400">
              Efectivo Disp.
            </span>
            <div className="w-6 h-6 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center">
              <Banknote className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            {editingField === "availableCash" ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit("availableCash");
                    if (e.key === "Escape") cancelEdit();
                  }}
                  autoFocus
                  className="w-full px-1.5 py-0.5 bg-zinc-950 border border-teal-500 rounded text-xs text-white font-mono"
                />
                <button onClick={() => saveEdit("availableCash")} className="text-teal-400">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={cancelEdit} className="text-zinc-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => startEditing("availableCash", generalInfo.availableCash)}
                className="cursor-pointer group/val flex items-baseline justify-between"
                title="Clic para editar efectivo disponible"
              >
                <span className="text-base sm:text-lg font-bold text-white font-mono tracking-tight">
                  {formatMXN(generalInfo.availableCash)}
                </span>
                <Edit2 className="w-2.5 h-2.5 text-zinc-500 opacity-0 group-hover/val:opacity-100 transition-opacity" />
              </div>
            )}
            <div className="text-[10px] text-teal-400/80 font-medium">
              <span>Cash Flow libre</span>
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
    </div>
  );
}

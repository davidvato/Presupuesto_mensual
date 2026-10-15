"use client";

import React, { useState } from "react";
import { useBudget } from "@/context/BudgetContext";
import { getPeriodInfo, shiftPeriod, formatMXN } from "@/utils/formatters";
import { Copy, X, ArrowRight, CheckCircle2 } from "lucide-react";

export function CloneMonthModal() {
  const {
    isCloneModalOpen,
    closeCloneModal,
    currentPeriod,
    summary,
    cloneBudgetToNextMonth,
  } = useBudget();

  const [isCloning, setIsCloning] = useState(false);
  const [clonedSuccessPeriod, setClonedSuccessPeriod] = useState<string | null>(null);

  if (!isCloneModalOpen) return null;

  const currentInfo = getPeriodInfo(currentPeriod);
  const nextPeriodKey = shiftPeriod(currentPeriod, 1);
  const nextInfo = getPeriodInfo(nextPeriodKey);

  const handleClone = async () => {
    try {
      setIsCloning(true);
      const newPeriod = await cloneBudgetToNextMonth();
      setClonedSuccessPeriod(newPeriod);
      setTimeout(() => {
        setClonedSuccessPeriod(null);
        closeCloneModal();
      }, 1500);
    } catch (err) {
      console.error("Error cloning budget:", err);
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto backdrop-blur-sm bg-black/75 animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-zinc-100 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Clonar Presupuesto al Siguiente Mes
              </h3>
              <p className="text-xs text-zinc-400">Herramienta de inicio de ciclo</p>
            </div>
          </div>
          <button
            onClick={closeCloneModal}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {clonedSuccessPeriod ? (
          <div className="p-6 text-center space-y-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="font-bold text-emerald-400">¡Presupuesto Clonado con Éxito!</h4>
            <p className="text-xs text-zinc-300">
              Redirigiéndote a <span className="font-semibold">{nextInfo.label}</span> con tu planeación lista.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-center">
              <div>
                <span className="text-[10px] uppercase text-zinc-400 block font-semibold">
                  Origen
                </span>
                <span className="text-sm font-bold text-zinc-200">{currentInfo.label}</span>
              </div>
              <ArrowRight className="w-5 h-5 text-indigo-400" />
              <div>
                <span className="text-[10px] uppercase text-emerald-400 block font-semibold">
                  Destino
                </span>
                <span className="text-sm font-bold text-emerald-400">{nextInfo.label}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-zinc-300 bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/80">
              <p className="flex justify-between">
                <span>Total planeado a transferir:</span>
                <span className="font-mono font-bold text-white">{formatMXN(summary.totalPlanned)}</span>
              </p>
              <p className="flex justify-between">
                <span>Categorías incluidas:</span>
                <span className="font-bold text-white">{summary.categorySummaries.length}</span>
              </p>
              <div className="pt-2 border-t border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
                ℹ️ Los montos planeados se replicarán idénticos. El nuevo mes arrancará con $0.00 MXN en gastos registrados para que tu historial quede totalmente limpio.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeCloneModal}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleClone}
                disabled={isCloning}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
              >
                <Copy className="w-4 h-4" />
                <span>{isCloning ? "Clonando..." : "Confirmar y Clonar"}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

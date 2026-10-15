"use client";

import React, { useState, useEffect, useRef } from "react";
import { useBudget } from "@/context/BudgetContext";
import { getPeriodInfo, shiftPeriod, formatMXN } from "@/utils/formatters";
import { Copy, X, ArrowRight, CheckCircle2, Calendar } from "lucide-react";

export function CloneMonthModal() {
  const {
    isCloneModalOpen,
    closeCloneModal,
    currentPeriod,
    summary,
    cloneBudgetToNextMonth,
  } = useBudget();

  const [targetPeriod, setTargetPeriod] = useState<string>("");
  const [isCloning, setIsCloning] = useState(false);
  const [clonedSuccessPeriod, setClonedSuccessPeriod] = useState<string | null>(null);

  const monthInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCloneModalOpen) {
      setTargetPeriod(shiftPeriod(currentPeriod, 1));
      setClonedSuccessPeriod(null);
    }
  }, [isCloneModalOpen, currentPeriod]);

  if (!isCloneModalOpen) return null;

  const currentInfo = getPeriodInfo(currentPeriod);
  const targetInfo = getPeriodInfo(targetPeriod || shiftPeriod(currentPeriod, 1));

  const handleClone = async () => {
    try {
      setIsCloning(true);
      const newPeriod = await cloneBudgetToNextMonth(targetPeriod);
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

  const openMonthPicker = () => {
    if (monthInputRef.current) {
      if (typeof monthInputRef.current.showPicker === "function") {
        monthInputRef.current.showPicker();
      } else {
        monthInputRef.current.focus();
      }
    }
  };

  // Preset future months
  const next1 = shiftPeriod(currentPeriod, 1);
  const next2 = shiftPeriod(currentPeriod, 2);
  const next3 = shiftPeriod(currentPeriod, 3);

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
                Clonar Presupuesto Mensual
              </h3>
              <p className="text-xs text-zinc-400">Replicar planeación a un nuevo ciclo</p>
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
              Redirigiéndote a <span className="font-semibold text-white">{targetInfo.label}</span> con tu planeación lista.
            </p>
          </div>
        ) : (
          <>
            {/* Visual Source -> Destination Indicator */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-center">
              <div>
                <span className="text-[10px] uppercase text-zinc-400 block font-semibold">
                  Mes Origen
                </span>
                <span className="text-sm font-bold text-zinc-200">{currentInfo.label}</span>
              </div>
              <ArrowRight className="w-5 h-5 text-indigo-400" />
              <div>
                <span className="text-[10px] uppercase text-emerald-400 block font-semibold">
                  Mes Destino
                </span>
                <span className="text-sm font-bold text-emerald-400">{targetInfo.label}</span>
              </div>
            </div>

            {/* Target Month Date Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Seleccionar Mes de Destino</span>
                </label>
                <button
                  type="button"
                  onClick={openMonthPicker}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300"
                >
                  Abrir selector
                </button>
              </div>

              <div className="relative">
                <input
                  ref={monthInputRef}
                  type="month"
                  value={targetPeriod}
                  onChange={(e) => setTargetPeriod(e.target.value)}
                  className="w-full py-2.5 pl-3 pr-10 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark] cursor-pointer"
                  id="input-clone-target-month"
                />
                <button
                  type="button"
                  onClick={openMonthPicker}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-indigo-400"
                  title="Seleccionar mes"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Presets for Target Month */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Atajos:</span>
                {[next1, next2, next3].map((pKey) => {
                  const info = getPeriodInfo(pKey);
                  const isSelected = targetPeriod === pKey;
                  return (
                    <button
                      key={pKey}
                      type="button"
                      onClick={() => setTargetPeriod(pKey)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                        isSelected
                          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                          : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {info.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Transfer Summary */}
            <div className="space-y-2 text-xs text-zinc-300 bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/80">
              <p className="flex justify-between">
                <span>Total planeado a transferir:</span>
                <span className="font-mono font-bold text-white">{formatMXN(summary.totalPlanned)}</span>
              </p>
              <p className="flex justify-between">
                <span>Categorías presupuestadas:</span>
                <span className="font-bold text-white">{summary.categorySummaries.length} rubros</span>
              </p>
              <div className="pt-2 border-t border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
                ℹ️ Los montos planeados se replicarán exactamente en el mes destino. El nuevo periodo iniciará con $0.00 MXN en gastos para registrar desde cero tus consumos.
              </div>
            </div>

            {/* Actions */}
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
                disabled={isCloning || !targetPeriod}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 active:scale-95"
                id="btn-confirm-clone"
              >
                <Copy className="w-4 h-4" />
                <span>{isCloning ? "Clonando..." : `Clonar a ${targetInfo.shortLabel}`}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

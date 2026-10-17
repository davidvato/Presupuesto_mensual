"use client";

import React, { useState, useEffect } from "react";
import { useBudget } from "@/context/BudgetContext";
import { getCycleRange, getCycleLabel, getCurrentPeriodKey, getPeriodInfo } from "@/utils/formatters";
import { Settings2, X, CheckCircle2, AlertTriangle, Calendar, ChevronDown, ChevronUp } from "lucide-react";

export function CycleSettingsModal() {
  const {
    isCycleSettingsOpen,
    closeCycleSettings,
    cycleStartDay,
    saveCycleStartDay,
    currentPeriod,
  } = useBudget();

  const [selectedDay, setSelectedDay] = useState<number>(cycleStartDay);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync with context value when modal opens
  useEffect(() => {
    if (isCycleSettingsOpen) {
      setSelectedDay(cycleStartDay);
      setSavedSuccess(false);
    }
  }, [isCycleSettingsOpen, cycleStartDay]);

  if (!isCycleSettingsOpen) return null;

  const previewPeriod = getCurrentPeriodKey(selectedDay);
  const previewLabel = getCycleLabel(previewPeriod, selectedDay);
  const previewRange = getCycleRange(previewPeriod, selectedDay);
  const isChanged = selectedDay !== cycleStartDay;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveCycleStartDay(selectedDay);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        closeCycleSettings();
      }, 1200);
    } catch (err) {
      console.error("Error saving cycle start day:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto backdrop-blur-sm bg-black/75 animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-zinc-100 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Configurar Ciclo de Registro</h3>
              <p className="text-xs text-zinc-400">Define el día de inicio de cada ciclo mensual</p>
            </div>
          </div>
          <button
            onClick={closeCycleSettings}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess ? (
          <div className="p-6 text-center space-y-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="font-bold text-emerald-400">¡Configuración Guardada!</h4>
            <p className="text-xs text-zinc-300">
              El ciclo ahora inicia el <span className="font-semibold text-white">día {selectedDay}</span> de cada mes.
            </p>
          </div>
        ) : (
          <>
            {/* Day selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Día de inicio del ciclo</span>
              </label>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={selectedDay}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v)) setSelectedDay(Math.max(1, Math.min(28, v)));
                  }}
                  className="w-24 py-2.5 px-3 bg-zinc-950 border border-zinc-700/80 rounded-xl text-lg font-bold text-white text-center focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
                  id="input-cycle-start-day"
                />
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedDay((d) => Math.min(28, d + 1))}
                    className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 hover:text-white transition-colors"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDay((d) => Math.max(1, d - 1))}
                    className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 hover:text-white transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-sm text-zinc-400 leading-tight">
                  <span>de cada mes</span>
                  <br />
                  <span className="text-xs text-zinc-600">(máximo: 28)</span>
                </div>
              </div>

              {/* Quick presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Atajos:</span>
                {[1, 5, 10, 11, 15, 20, 25].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDay(d)}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all ${
                      selectedDay === d
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                        : "bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
                    }`}
                  >
                    {d === 1 ? "1 (Cal.)" : `${d}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Live preview */}
            <div className="rounded-2xl bg-zinc-950/60 border border-indigo-500/20 p-4 space-y-2">
              <p className="text-[10px] uppercase font-semibold text-indigo-400 tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                Vista previa del ciclo activo
              </p>
              <p className="text-base font-bold text-white">{previewLabel}</p>
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <span>
                  Inicio:{" "}
                  <span className="font-semibold text-zinc-200">{previewRange.start}</span>
                </span>
                <span className="text-zinc-700">→</span>
                <span>
                  Fin:{" "}
                  <span className="font-semibold text-zinc-200">{previewRange.end}</span>
                </span>
              </div>
            </div>

            {/* Warning for non-calendar cycles */}
            {selectedDay > 1 && (
              <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/8 border border-amber-500/20 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  El cambio aplica a <strong>transacciones nuevas</strong>. Los movimientos ya registrados
                  conservan su periodo original. Se recomienda aplicar este ajuste al inicio de un nuevo ciclo.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={closeCycleSettings}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !isChanged}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-40 active:scale-95"
                id="btn-save-cycle-config"
              >
                <Settings2 className="w-4 h-4" />
                <span>{isSaving ? "Guardando..." : `Guardar — Día ${selectedDay}`}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

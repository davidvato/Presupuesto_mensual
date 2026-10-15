"use client";

import React, { useState } from "react";
import { useBudget } from "@/context/BudgetContext";
import { getPeriodInfo, getCurrentPeriodKey } from "@/utils/formatters";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Download,
  Calendar,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

export function Header() {
  const {
    currentPeriod,
    goToPreviousPeriod,
    goToNextPeriod,
    goToCurrentMonth,
    setCurrentPeriod,
    availablePeriods,
    openTransactionModal,
    openCategoryModal,
    openCloneModal,
    exportCsv,
    resetAllData,
    requestConfirm,
    isDatabaseActive,
  } = useBudget();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const periodInfo = getPeriodInfo(currentPeriod);
  const isCurrentMonth = currentPeriod === getCurrentPeriodKey();

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & App Branding */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
                <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">
                    Finanzas Pro
                  </h1>
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Mensual MX
                  </span>
                  {isDatabaseActive ? (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
                      title="Sincronizado con Neon PostgreSQL"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Neon DB</span>
                    </span>
                  ) : (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-850 text-zinc-400 border border-zinc-800 flex items-center gap-1"
                      title="Almacenamiento Local (Conecta Neon en Vercel)"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                      <span>Local</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">
                  Control de Presupuesto vs. Gasto Real
                </p>
              </div>
            </div>

            {/* Mobile Actions Drawer toggle */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => openTransactionModal()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-zinc-950 font-semibold text-xs rounded-lg transition-all shadow-md shadow-emerald-500/20"
                id="btn-quick-expense-mobile"
              >
                <Plus className="w-4 h-4" />
                <span>Gasto</span>
              </button>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 border border-zinc-800"
                aria-label="Herramientas"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Period Selector (Month & Year Navigation) */}
          <div className="flex items-center justify-center bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-1 shadow-inner self-center md:self-auto w-full md:w-auto">
            <button
              onClick={goToPreviousPeriod}
              aria-label="Mes anterior"
              className="p-2 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl transition-colors active:scale-95"
              id="btn-prev-month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative flex items-center gap-2 px-3 py-1 text-center min-w-[160px] justify-center cursor-pointer group hover:bg-zinc-800/50 rounded-xl transition-colors">
              <input
                type="month"
                value={currentPeriod}
                onChange={(e) => {
                  if (e.target.value) setCurrentPeriod(e.target.value);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 [color-scheme:dark]"
                title="Haz clic para seleccionar cualquier mes y año"
                id="header-month-picker"
              />
              <Calendar className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-sm md:text-base text-zinc-100 tracking-wide group-hover:text-emerald-300 transition-colors">
                {periodInfo.label}
              </span>
            </div>

            <button
              onClick={goToNextPeriod}
              aria-label="Mes siguiente"
              className="p-2 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl transition-colors active:scale-95"
              id="btn-next-month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isCurrentMonth && (
              <button
                onClick={goToCurrentMonth}
                className="ml-1 text-[11px] font-medium px-2 py-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors border border-emerald-500/20"
                title="Volver al mes actual"
              >
                Hoy
              </button>
            )}
          </div>

          {/* Desktop Executive Actions */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => openTransactionModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95"
              id="btn-new-expense"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Gasto</span>
            </button>

            <button
              onClick={() => openCategoryModal()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium text-xs rounded-xl border border-zinc-800 transition-colors"
              title="Añadir nueva categoría al presupuesto"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-400" />
              <span>Nueva Categoría</span>
            </button>

            <button
              onClick={openCloneModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium text-xs rounded-xl border border-zinc-800 transition-colors"
              title="Clonar presupuesto actual al próximo mes"
            >
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
              <span>Clonar Mes</span>
            </button>

            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium text-xs rounded-xl border border-zinc-800 transition-colors"
              title="Descargar respaldo en CSV"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={() => {
                requestConfirm({
                  title: "¿Reiniciar Datos de Fábrica?",
                  message: "¿Deseas restaurar todas las categorías, montos y transacciones a la configuración inicial por defecto?",
                  confirmLabel: "Sí, Reiniciar Todo",
                  variant: "warning",
                  onConfirm: async () => {
                    await resetAllData();
                  },
                });
              }}
              className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-500/20 transition-colors"
              title="Reiniciar datos de demostración"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Expanded Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-zinc-800/80 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <button
              onClick={() => {
                openCategoryModal();
                setIsMenuOpen(false);
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-200 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Categoría</span>
            </button>

            <button
              onClick={() => {
                openCloneModal();
                setIsMenuOpen(false);
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-200 rounded-xl"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Clonar Mes</span>
            </button>

            <button
              onClick={() => {
                exportCsv();
                setIsMenuOpen(false);
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-200 rounded-xl"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar</span>
            </button>

            <button
              onClick={() => {
                setIsMenuOpen(false);
                requestConfirm({
                  title: "¿Reiniciar Datos de Fábrica?",
                  message: "¿Deseas restaurar todas las categorías, montos y transacciones a la configuración inicial por defecto?",
                  confirmLabel: "Sí, Reiniciar Todo",
                  variant: "warning",
                  onConfirm: async () => {
                    await resetAllData();
                  },
                });
              }}
              className="p-2 text-zinc-400 hover:text-rose-400 bg-zinc-900 border border-zinc-800 rounded-xl"
              title="Reiniciar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

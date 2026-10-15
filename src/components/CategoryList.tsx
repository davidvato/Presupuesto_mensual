"use client";

import React, { useState } from "react";
import { useBudget } from "@/context/BudgetContext";
import { CategorySummary } from "@/types/budget";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { StatusBadge, DifferenceBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatMXN } from "@/utils/formatters";
import {
  Plus,
  Edit2,
  Check,
  X,
  Search,
  Filter,
  FileText,
  Sliders,
  DollarSign,
  Trash2,
} from "lucide-react";

export function CategoryList({
  onSelectCategoryFilter,
}: {
  onSelectCategoryFilter?: (categoryId: string) => void;
}) {
  const {
    summary,
    updatePlannedAmount,
    openTransactionModal,
    openCategoryModal,
    deleteCategory,
    requestConfirm,
  } = useBudget();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const handleDeleteCategory = (cat: any) => {
    requestConfirm({
      title: "¿Eliminar Categoría?",
      message: `¿Estás seguro de que deseas eliminar "${cat.name}" (${cat.typeLabel})? Se retirará de tu presupuesto y los totales se recalcularán automáticamente.`,
      confirmLabel: "Sí, Eliminar Categoría",
      variant: "danger",
      onConfirm: async () => {
        await deleteCategory(cat.id);
      },
    });
  };

  // Start inline editing
  const startEditing = (categoryId: string, currentPlanned: number) => {
    setEditingCategoryId(categoryId);
    setEditValue(currentPlanned.toString());
  };

  // Save inline edit
  const saveEditing = async (categoryId: string) => {
    const num = parseFloat(editValue);
    await updatePlannedAmount(categoryId, isNaN(num) ? 0 : num);
    setEditingCategoryId(null);
  };

  // Cancel inline edit
  const cancelEditing = () => {
    setEditingCategoryId(null);
    setEditValue("");
  };

  // Filter categories
  const filteredCategories = summary.categorySummaries.filter((item) => {
    const matchesSearch =
      item.category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.typeLabel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      selectedType === "all" || item.category.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md shadow-xl overflow-hidden">
      {/* Search & Filters Bar */}
      <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Presupuesto por Categoría</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              {filteredCategories.length}
            </span>
          </h2>
          <p className="text-xs text-zinc-400">
            Haz clic sobre cualquier monto planeado para editarlo en tiempo real
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-300 py-1.5 px-2.5 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="all">Todos los tipos</option>
            <option value="vivienda">Vivienda</option>
            <option value="servicios">Servicios</option>
            <option value="ahorro">Ahorro</option>
            <option value="inversion">Inversión</option>
            <option value="credito_msi">Crédito MSI</option>
            <option value="transporte">Transporte</option>
            <option value="gastos_variables">Gastos Variables</option>
          </select>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950/50 text-zinc-400 font-semibold text-xs uppercase tracking-wider border-b border-zinc-800">
            <tr>
              <th className="py-3 px-4">Categoría</th>
              <th className="py-3 px-4">Planeado</th>
              <th className="py-3 px-4">Actual (Real)</th>
              <th className="py-3 px-4 w-44">Semáforo / Progreso</th>
              <th className="py-3 px-4 text-right">Diferencia</th>
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-zinc-500 text-xs">
                  No se encontraron categorías que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filteredCategories.map((item) => {
                const isEditing = editingCategoryId === item.category.id;

                return (
                  <tr
                    key={item.category.id}
                    className="hover:bg-zinc-800/30 transition-colors group"
                  >
                    {/* Category Column */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/10"
                          style={{
                            backgroundColor: `${item.category.color}15`,
                            color: item.category.color,
                          }}
                        >
                          <CategoryIcon name={item.category.iconName} className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-100 flex items-center gap-2">
                            <span>{item.category.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <span>{item.category.typeLabel}</span>
                            <span>•</span>
                            <button
                              onClick={() => onSelectCategoryFilter?.(item.category.id)}
                              className="text-emerald-400/80 hover:text-emerald-300 hover:underline"
                            >
                              {item.transactionCount} {item.transactionCount === 1 ? "movimiento" : "movimientos"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Planned Column (Inline Editable) */}
                    <td className="py-3.5 px-4">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-mono">
                              $
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="10"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEditing(item.category.id);
                                if (e.key === "Escape") cancelEditing();
                              }}
                              autoFocus
                              className="w-28 pl-6 pr-2 py-1 bg-zinc-950 border border-emerald-500 rounded-lg text-xs font-mono text-white focus:outline-none"
                            />
                          </div>
                          <button
                            onClick={() => saveEditing(item.category.id)}
                            className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            title="Guardar"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-1 rounded-md bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                            title="Cancelar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(item.category.id, item.planned)}
                          className="group/btn flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-lg hover:bg-zinc-800/80 transition-colors text-left"
                          title="Clic para editar monto planeado"
                        >
                          <span className="font-mono font-medium text-zinc-200">
                            {formatMXN(item.planned)}
                          </span>
                          <Edit2 className="w-3 h-3 text-zinc-500 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </td>

                    {/* Actual Column */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-semibold text-white">
                        {formatMXN(item.actual)}
                      </span>
                    </td>

                    {/* Semaphore / Progress Column */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <StatusBadge status={item.status} percentage={item.percentage} />
                        </div>
                        <ProgressBar percentage={item.percentage} status={item.status} />
                      </div>
                    </td>

                    {/* Difference Column */}
                    <td className="py-3.5 px-4 text-right">
                      <DifferenceBadge difference={item.difference} />
                    </td>

                    {/* Actions Column */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openTransactionModal(item.category.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-xs rounded-lg border border-emerald-500/20 transition-all hover:scale-105"
                          title="Registrar gasto en esta categoría"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Gasto</span>
                        </button>

                        <button
                          onClick={() => openCategoryModal(item.category)}
                          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Configurar categoría"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteCategory(item.category)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Eliminar categoría"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE COMPACT CARDS VIEW */}
      <div className="lg:hidden p-3 divide-y divide-zinc-800/80">
        {filteredCategories.length === 0 ? (
          <div className="py-6 text-center text-zinc-500 text-xs">
            No se encontraron categorías.
          </div>
        ) : (
          filteredCategories.map((item) => {
            const isEditing = editingCategoryId === item.category.id;

            return (
              <div key={item.category.id} className="py-3.5 first:pt-1 last:pb-1 space-y-3">
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/10"
                      style={{
                        backgroundColor: `${item.category.color}15`,
                        color: item.category.color,
                      }}
                    >
                      <CategoryIcon name={item.category.iconName} className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <h3 className="font-semibold text-sm text-zinc-100 truncate">
                        {item.category.name}
                      </h3>
                      <p className="text-[11px] text-zinc-400">{item.category.typeLabel}</p>
                    </div>
                  </div>

                  <StatusBadge status={item.status} percentage={item.percentage} />
                </div>

                {/* Progress bar */}
                <ProgressBar percentage={item.percentage} status={item.status} />

                {/* 3 Metrics Row */}
                <div className="grid grid-cols-3 gap-2 bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/60 text-center">
                  {/* Planned */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">
                      Planeado
                    </span>
                    {isEditing ? (
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-16 px-1 py-0.5 bg-zinc-900 border border-emerald-500 rounded text-xs text-white text-center font-mono"
                          autoFocus
                        />
                        <button
                          onClick={() => saveEditing(item.category.id)}
                          className="text-emerald-400"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(item.category.id, item.planned)}
                        className="font-mono text-xs font-medium text-zinc-200 inline-flex items-center gap-1"
                      >
                        <span>{formatMXN(item.planned, false)}</span>
                        <Edit2 className="w-2.5 h-2.5 text-zinc-500" />
                      </button>
                    )}
                  </div>

                  {/* Actual */}
                  <div className="space-y-0.5 border-x border-zinc-800">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">
                      Actual
                    </span>
                    <span className="font-mono text-xs font-semibold text-white block">
                      {formatMXN(item.actual, false)}
                    </span>
                  </div>

                  {/* Difference */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">
                      Diferencia
                    </span>
                    <span
                      className={`font-mono text-xs font-semibold block ${
                        item.difference >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {item.difference >= 0 ? "+" : ""}
                      {formatMXN(item.difference, false)}
                    </span>
                  </div>
                </div>

                {/* Mobile Card Bottom Quick Actions */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => onSelectCategoryFilter?.(item.category.id)}
                    className="text-xs text-zinc-400 hover:text-emerald-400 inline-flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3" />
                    <span>{item.transactionCount} movimientos</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openCategoryModal(item.category)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-200 bg-zinc-800/60 rounded-lg text-xs"
                      title="Editar categoría"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(item.category)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 bg-zinc-800/60 rounded-lg text-xs"
                      title="Eliminar categoría"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openTransactionModal(item.category.id)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/15 text-emerald-400 font-semibold text-xs rounded-lg border border-emerald-500/30"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Gasto</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useBudget } from "@/context/BudgetContext";
import { Category, CategoryType } from "@/types/budget";
import { CategoryIcon, ICON_MAP } from "@/components/ui/CategoryIcon";
import { X, Check, Trash2, Tag, Palette } from "lucide-react";

const CATEGORY_TYPES: { type: CategoryType; label: string }[] = [
  { type: "vivienda", label: "Gasto Fijo / Vivienda" },
  { type: "servicios", label: "Servicios / Tarjeta" },
  { type: "ahorro", label: "Ahorro" },
  { type: "inversion", label: "Inversión" },
  { type: "credito_msi", label: "Crédito MSI" },
  { type: "transporte", label: "Transporte" },
  { type: "gastos_variables", label: "Gastos Variables" },
  { type: "otros", label: "Otros Gastos" },
];

const PRESET_COLORS = [
  "#6366f1", // Indigo
  "#0284c7", // Sky
  "#10b981", // Emerald
  "#14b8a6", // Teal
  "#8b5cf6", // Purple
  "#a855f7", // Violet
  "#f59e0b", // Amber
  "#ea580c", // Orange
  "#ec4899", // Pink
  "#f43f5e", // Rose
];

const AVAILABLE_ICONS = Object.keys(ICON_MAP);

export function CategoryModal() {
  const {
    isCategoryModalOpen,
    closeCategoryModal,
    editingCategory,
    saveCategory,
    deleteCategory,
    updatePlannedAmount,
    plannedAmounts,
    requestConfirm,
  } = useBudget();

  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("gastos_variables");
  const [iconName, setIconName] = useState("ShoppingBag");
  const [color, setColor] = useState("#10b981");
  const [basePlanned, setBasePlanned] = useState("0");
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setType(editingCategory.type);
      setIconName(editingCategory.iconName);
      setColor(editingCategory.color);
      setBasePlanned((plannedAmounts[editingCategory.id] || 0).toString());
    } else {
      setName("");
      setType("gastos_variables");
      setIconName("ShoppingBag");
      setColor("#10b981");
      setBasePlanned("1000");
    }
    setError("");
  }, [editingCategory, plannedAmounts, isCategoryModalOpen]);

  if (!isCategoryModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre de la categoría es requerido.");
      return;
    }

    const typeConfig = CATEGORY_TYPES.find((t) => t.type === type);
    const categoryToSave: Category = {
      id: editingCategory ? editingCategory.id : `cat_${Date.now()}`,
      name: name.trim(),
      type,
      typeLabel: typeConfig?.label || "Gastos",
      iconName,
      color,
      order: editingCategory ? editingCategory.order : Date.now(),
      isActive: true,
    };

    await saveCategory(categoryToSave);
    const plannedNum = parseFloat(basePlanned);
    if (!isNaN(plannedNum)) {
      await updatePlannedAmount(categoryToSave.id, plannedNum);
    }

    closeCategoryModal();
  };

  const handleDelete = () => {
    if (!editingCategory) return;
    const cat = editingCategory;
    closeCategoryModal();
    requestConfirm({
      title: "¿Eliminar Categoría?",
      message: `¿Estás seguro de que deseas eliminar la categoría "${cat.name}" (${cat.typeLabel}) del presupuesto? Los cálculos del mes se actualizarán automáticamente.`,
      confirmLabel: "Sí, Eliminar Categoría",
      variant: "danger",
      onConfirm: async () => {
        await deleteCategory(cat.id);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto backdrop-blur-sm bg-black/75 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border border-white/10"
              style={{ backgroundColor: `${color}20`, color }}
            >
              <CategoryIcon name={iconName} className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {editingCategory ? "Configurar Categoría" : "Nueva Categoría"}
              </h3>
              <p className="text-xs text-zinc-400">
                Personaliza nombre, clasificador, icono y meta mensual
              </p>
            </div>
          </div>

          <button
            onClick={closeCategoryModal}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Seguro de Auto, Gimnasio, Cursos..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full py-2.5 px-3 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Type / Classifier */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Clasificador / Tipo
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CategoryType)}
              className="w-full py-2.5 px-3 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
            >
              {CATEGORY_TYPES.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Planned Base Amount */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Monto Planeado Base (MXN)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-sm">
                $
              </span>
              <input
                type="number"
                min="0"
                step="10"
                value={basePlanned}
                onChange={(e) => setBasePlanned(e.target.value)}
                className="w-full pl-8 pr-14 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-semibold">
                MXN
              </span>
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Icono Representativo
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-zinc-950 rounded-xl border border-zinc-800">
              {AVAILABLE_ICONS.map((iconKey) => {
                const isSelected = iconName === iconKey;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setIconName(iconKey)}
                    className={`p-2 rounded-lg border transition-all ${
                      isSelected
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <CategoryIcon name={iconKey} className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Color Distintivo
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    color === c ? "scale-110 border-white shadow-md" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-between border-t border-zinc-800/80">
            {editingCategory ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Categoría</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeCategoryModal}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Categoría</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

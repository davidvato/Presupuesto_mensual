"use client";

import React, { useState, useEffect } from "react";
import { useBudget } from "@/context/BudgetContext";
import { getTodayDateString } from "@/utils/formatters";
import { TransactionType } from "@/types/budget";
import {
  X,
  Plus,
  Calendar,
  CreditCard,
  DollarSign,
  Tag,
  FileText,
  Check,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";

export function TransactionModal() {
  const {
    isTransactionModalOpen,
    closeTransactionModal,
    categories,
    currentPeriod,
    addTransaction,
    updateTransaction,
    editingTransaction,
    preselectedCategoryId,
    defaultTransactionType,
  } = useBudget();

  const [type, setType] = useState<TransactionType>("gasto");
  const [amount, setAmount] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [date, setDate] = useState<string>(getTodayDateString());
  const [concept, setConcept] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("TC BBVA");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form state
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type || "gasto");
      setAmount(editingTransaction.amount.toString());
      setCategoryId(editingTransaction.categoryId);
      setDate(editingTransaction.date);
      setConcept(editingTransaction.concept);
      setPaymentMethod(editingTransaction.paymentMethod || "TC BBVA");
      setNotes(editingTransaction.notes || "");
    } else {
      setType(defaultTransactionType || "gasto");
      setAmount("");
      setCategoryId(preselectedCategoryId || categories[0]?.id || "");
      setDate(getTodayDateString());
      setConcept("");
      setPaymentMethod(defaultTransactionType === "ingreso" ? "Transferencia" : "TC BBVA");
      setNotes("");
    }
    setError("");
  }, [editingTransaction, preselectedCategoryId, defaultTransactionType, categories, isTransactionModalOpen]);

  if (!isTransactionModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Por favor ingresa un monto válido mayor a $0.");
      return;
    }

    if (type === "gasto" && !categoryId) {
      setError("Por favor selecciona una categoría.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const periodFromDate = date.slice(0, 7) || currentPeriod;
      const finalCategory = categoryId || categories[0]?.id || "cat_general";

      if (editingTransaction) {
        await updateTransaction({
          ...editingTransaction,
          type,
          amount: parsedAmount,
          categoryId: finalCategory,
          date,
          period: periodFromDate,
          concept: concept.trim() || (type === "ingreso" ? "Ingreso registrado" : "Gasto sin concepto"),
          paymentMethod,
          notes: notes.trim(),
        });
      } else {
        await addTransaction({
          type,
          amount: parsedAmount,
          categoryId: finalCategory,
          date,
          period: periodFromDate,
          concept: concept.trim() || (type === "ingreso" ? "Ingreso registrado" : "Gasto sin concepto"),
          paymentMethod,
          notes: notes.trim(),
        });
      }

      closeTransactionModal();
    } catch (err) {
      console.error("Error saving transaction:", err);
      setError("Error al guardar la transacción.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAmounts = type === "ingreso" ? [500, 1000, 3000, 5000, 10000] : [100, 250, 500, 1000, 2500];
  const paymentMethods =
    type === "ingreso"
      ? ["Transferencia / Nómina", "Depósito Débito BBVA", "Efectivo", "Otro"]
      : ["TC BBVA", "TD BBVA", "TC Invex", "Efectivo", "Transferencia", "Otro"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto backdrop-blur-sm bg-black/75 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                type === "ingreso"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}
            >
              {type === "ingreso" ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {editingTransaction
                  ? "Editar Movimiento"
                  : type === "ingreso"
                  ? "Registrar Ingreso"
                  : "Registrar Gasto Rápido"}
              </h3>
              <p className="text-xs text-zinc-400">
                {type === "ingreso"
                  ? "Suma liquidez a tus ingresos del mes"
                  : "Añade el consumo a tu presupuesto mensual"}
              </p>
            </div>
          </div>

          <button
            onClick={closeTransactionModal}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Type Switcher: Gasto vs Ingreso */}
          <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setType("gasto");
                setPaymentMethod("TC BBVA");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                type === "gasto"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Gasto / Consumo</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType("ingreso");
                setPaymentMethod("Transferencia / Nómina");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                type === "ingreso"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Ingreso / Entrada</span>
            </button>
          </div>

          {/* Amount Input with numeric keyboard */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Monto del {type === "ingreso" ? "Ingreso" : "Gasto"} (MXN) *
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-zinc-400 pointer-events-none font-mono">
                $
              </div>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                autoFocus
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full pl-10 pr-16 py-3.5 bg-zinc-950 border rounded-2xl text-2xl sm:text-3xl font-extrabold text-white font-mono placeholder-zinc-600 focus:outline-none focus:ring-1 transition-all ${
                  type === "ingreso"
                    ? "border-emerald-500/50 focus:border-emerald-400 focus:ring-emerald-500/30"
                    : "border-zinc-700/80 focus:border-rose-400 focus:ring-rose-500/30"
                }`}
                id="input-expense-amount"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">
                MXN
              </span>
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(q.toString())}
                  className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                >
                  +${q.toLocaleString("es-MX")}
                </button>
              ))}
            </div>
          </div>

          {/* Category Dropdown (Only for Gastos or optional for Ingresos) */}
          {type === "gasto" ? (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Categoría del Presupuesto *
              </label>
              <div className="relative">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="w-full py-3 px-3 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  id="select-expense-category"
                >
                  <option value="" disabled>
                    Selecciona una categoría...
                  </option>
                  {categories
                    .filter((c) => c.isActive)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.typeLabel})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Cuenta Receptora / Destino
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full py-2.5 px-3 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Concept / Note */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              {type === "ingreso" ? "Concepto / Origen del Ingreso" : "Concepto / Comercio / Descripción"}
            </label>
            <input
              type="text"
              placeholder={
                type === "ingreso"
                  ? "Ej. Quincena 1 Nómina, Bono desempeño, Rendimientos GBM..."
                  : "Ej. Gasolina Oxxo Gas, Despensa fin de semana, CFE..."
              }
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="w-full py-2.5 px-3 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              id="input-expense-concept"
            />
          </div>

          {/* Date & Payment Method Grid for Gastos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full py-2.5 px-3 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {type === "gasto" && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Método de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full py-2.5 px-3 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeTransactionModal}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center gap-2 px-6 py-2.5 active:scale-95 font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50 ${
                type === "ingreso"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 shadow-emerald-500/25"
                  : "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-rose-500/25"
              }`}
              id="btn-submit-expense"
            >
              <Check className="w-4 h-4" />
              <span>
                {editingTransaction
                  ? "Guardar Cambios"
                  : type === "ingreso"
                  ? "Registrar Ingreso"
                  : "Registrar Gasto"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Mobile-friendly Floating Action Button (FAB)
 */
export function FloatingActionButton() {
  const { openTransactionModal } = useBudget();

  return (
    <button
      onClick={() => openTransactionModal()}
      className="md:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-extrabold text-sm rounded-full shadow-2xl shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all border border-emerald-400/40"
      aria-label="Registrar Movimiento"
      id="fab-register-expense"
    >
      <Plus className="w-5 h-5" />
      <span>Registrar Movimiento</span>
    </button>
  );
}

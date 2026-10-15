"use client";

import React, { useState, useEffect } from "react";
import { useBudget } from "@/context/BudgetContext";
import { getTodayDateString } from "@/utils/formatters";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import {
  X,
  Plus,
  Calendar,
  CreditCard,
  DollarSign,
  Tag,
  FileText,
  Check,
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
  } = useBudget();

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
      setAmount(editingTransaction.amount.toString());
      setCategoryId(editingTransaction.categoryId);
      setDate(editingTransaction.date);
      setConcept(editingTransaction.concept);
      setPaymentMethod(editingTransaction.paymentMethod || "TC BBVA");
      setNotes(editingTransaction.notes || "");
    } else {
      setAmount("");
      setCategoryId(preselectedCategoryId || categories[0]?.id || "");
      setDate(getTodayDateString());
      setConcept("");
      setPaymentMethod("TC BBVA");
      setNotes("");
    }
    setError("");
  }, [editingTransaction, preselectedCategoryId, categories, isTransactionModalOpen]);

  if (!isTransactionModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Por favor ingresa un monto válido mayor a $0.");
      return;
    }

    if (!categoryId) {
      setError("Por favor selecciona una categoría.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      // Derive period from date (YYYY-MM)
      const periodFromDate = date.slice(0, 7) || currentPeriod;

      if (editingTransaction) {
        await updateTransaction({
          ...editingTransaction,
          amount: parsedAmount,
          categoryId,
          date,
          period: periodFromDate,
          concept: concept.trim() || "Gasto sin concepto",
          paymentMethod,
          notes: notes.trim(),
        });
      } else {
        await addTransaction({
          amount: parsedAmount,
          categoryId,
          date,
          period: periodFromDate,
          concept: concept.trim() || "Gasto sin concepto",
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

  const quickAmounts = [100, 250, 500, 1000, 2500];
  const paymentMethods = ["TC BBVA", "TD BBVA", "TC Invex", "Efectivo", "Transferencia", "Otro"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto backdrop-blur-sm bg-black/75 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {editingTransaction ? "Editar Gasto" : "Registrar Gasto Rápido"}
              </h3>
              <p className="text-xs text-zinc-400">
                Añade el movimiento a tu presupuesto mensual
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

          {/* Amount Input with numeric keyboard */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Monto a Registrar (MXN) *
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
                className="w-full pl-10 pr-16 py-3.5 bg-zinc-950 border border-zinc-700/80 rounded-2xl text-2xl sm:text-3xl font-extrabold text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
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
                  +${q}
                </button>
              ))}
            </div>
          </div>

          {/* Category Dropdown */}
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

          {/* Concept / Note */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Concepto / Comercio / Descripción
            </label>
            <input
              type="text"
              placeholder="Ej. Gasolina Oxxo Gas, Despensa fin de semana, CFE..."
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="w-full py-2.5 px-3 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              id="input-expense-concept"
            />
          </div>

          {/* Date & Payment Method Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Fecha
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full py-2.5 px-3 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

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
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
              id="btn-submit-expense"
            >
              <Check className="w-4 h-4" />
              <span>{editingTransaction ? "Guardar Cambios" : "Registrar Gasto"}</span>
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
      aria-label="Registrar Gasto Rápido"
      id="fab-register-expense"
    >
      <Plus className="w-5 h-5" />
      <span>Registrar Gasto</span>
    </button>
  );
}

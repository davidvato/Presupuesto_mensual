"use client";

import React, { useState, useMemo } from "react";
import { useBudget } from "@/context/BudgetContext";
import { Transaction } from "@/types/budget";
import { formatMXN, formatDateES } from "@/utils/formatters";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import {
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  CreditCard,
  ArrowUpDown,
  X,
  Receipt,
} from "lucide-react";

interface TransactionHistoryProps {
  categoryFilter?: string;
  onClearCategoryFilter?: () => void;
}

export function TransactionHistory({
  categoryFilter,
  onClearCategoryFilter,
}: TransactionHistoryProps) {
  const {
    transactions,
    categories,
    deleteTransaction,
    openTransactionModal,
    requestConfirm,
  } = useBudget();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || "all");
  const [sortOrder, setSortOrder] = useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc">("date_desc");

  // Sync prop changes
  React.useEffect(() => {
    if (categoryFilter) {
      setSelectedCategory(categoryFilter);
    }
  }, [categoryFilter]);

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  // Filter & sort
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        const matchesCategory =
          selectedCategory === "all" || tx.categoryId === selectedCategory;
        const matchesSearch =
          tx.concept.toLowerCase().includes(search.toLowerCase()) ||
          (categoryMap.get(tx.categoryId)?.name || "").toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortOrder === "date_desc") {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortOrder === "date_asc") {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (sortOrder === "amount_desc") {
          return b.amount - a.amount;
        }
        if (sortOrder === "amount_asc") {
          return a.amount - b.amount;
        }
        return 0;
      });
  }, [transactions, selectedCategory, search, sortOrder, categoryMap]);

  const totalFilteredAmount = useMemo(() => {
    return filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredTransactions]);

  const handleDelete = (tx: Transaction) => {
    requestConfirm({
      title: "¿Eliminar Movimiento?",
      message: `¿Estás seguro de que deseas eliminar el gasto "${tx.concept}" por ${formatMXN(tx.amount)}? El saldo y los totales del mes se actualizarán automáticamente.`,
      confirmLabel: "Sí, Eliminar Movimiento",
      variant: "danger",
      onConfirm: async () => {
        await deleteTransaction(tx.id);
      },
    });
  };

  return (
    <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md shadow-xl overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <span>Historial de Movimientos</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              {filteredTransactions.length}
            </span>
          </h2>
          <p className="text-xs text-zinc-400">
            Registro detallado de gastos devengados en el mes seleccionado
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar concepto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              if (e.target.value === "all") onClearCategoryFilter?.();
            }}
            className="bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-300 py-1.5 px-2.5 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-300 py-1.5 px-2.5 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="date_desc">Más recientes primero</option>
            <option value="date_asc">Más antiguos primero</option>
            <option value="amount_desc">Mayor monto</option>
            <option value="amount_asc">Menor monto</option>
          </select>

          {/* Reset filter pill */}
          {(selectedCategory !== "all" || search) && (
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSearch("");
                onClearCategoryFilter?.();
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 bg-zinc-800/80 rounded-lg inline-flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Filtered Total Bar */}
      <div className="px-5 py-2 bg-zinc-950/40 border-b border-zinc-800/60 flex items-center justify-between text-xs">
        <span className="text-zinc-400">Total filtrado:</span>
        <span className="font-mono font-bold text-emerald-400 text-sm">
          {formatMXN(totalFilteredAmount)}
        </span>
      </div>

      {/* Transactions List */}
      <div className="divide-y divide-zinc-800/60 max-h-[460px] overflow-y-auto">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Receipt className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-sm font-medium text-zinc-400">No hay movimientos registrados</p>
            <p className="text-xs text-zinc-500">
              Usa el botón "+ Registrar Gasto" para agregar tu primer movimiento en este periodo.
            </p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const category = categoryMap.get(tx.categoryId);
            return (
              <div
                key={tx.id}
                className="p-3.5 sm:px-5 sm:py-3 hover:bg-zinc-800/30 transition-colors flex items-center justify-between gap-3 group"
              >
                {/* Left Info: Icon, Concept, Category, Date */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10"
                    style={{
                      backgroundColor: category ? `${category.color}15` : "#27272a",
                      color: category?.color || "#a1a1aa",
                    }}
                  >
                    <CategoryIcon
                      name={category?.iconName || "Tag"}
                      className="w-4 h-4"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-zinc-100 truncate">
                      {tx.concept}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-0.5">
                      <span className="font-medium text-zinc-300">
                        {category?.name || "Categoría eliminada"}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        {formatDateES(tx.date)}
                      </span>
                      {tx.paymentMethod && (
                        <>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] text-zinc-300 font-mono">
                            {tx.paymentMethod}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span
                      className={`font-mono font-bold text-sm sm:text-base block ${
                        tx.type === "ingreso" ? "text-emerald-400" : "text-white"
                      }`}
                    >
                      {tx.type === "ingreso" ? "+" : ""}
                      {formatMXN(tx.amount)}
                    </span>
                  </div>

                  {/* Edit / Delete Buttons */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openTransactionModal(tx.categoryId, tx)}
                      className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-lg transition-colors"
                      title="Editar transacción"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(tx)}
                      className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Eliminar transacción"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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

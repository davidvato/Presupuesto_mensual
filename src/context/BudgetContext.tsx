"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import {
  Category,
  Transaction,
  BudgetSummary,
  CategorySummary,
  CategoryTypeGroup,
} from "@/types/budget";
import { budgetService } from "@/services/budgetService";
import { calculateBudgetStatus, getCurrentPeriodKey, shiftPeriod } from "@/utils/formatters";
import { generateBudgetCsv, downloadCsv } from "@/services/csvExport";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface ConfirmDialogConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
}

interface BudgetContextType {
  currentPeriod: string;
  setCurrentPeriod: (period: string) => void;
  goToNextPeriod: () => void;
  goToPreviousPeriod: () => void;
  goToCurrentMonth: () => void;

  categories: Category[];
  plannedAmounts: Record<string, number>;
  transactions: Transaction[];
  allTransactions: Transaction[];
  summary: BudgetSummary;
  typeGroups: CategoryTypeGroup[];
  availablePeriods: string[];
  isLoading: boolean;

  // Actions
  updatePlannedAmount: (categoryId: string, amount: number) => Promise<void>;
  saveCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  addTransaction: (tx: Omit<Transaction, "id" | "createdAt">) => Promise<Transaction>;
  updateTransaction: (tx: Transaction) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  cloneBudgetToNextMonth: () => Promise<string>;
  exportCsv: () => void;
  resetAllData: () => Promise<void>;
  refreshData: () => Promise<void>;

  // Global In-App Confirmation
  requestConfirm: (config: ConfirmDialogConfig) => void;
  closeConfirm: () => void;

  // Modal States
  isTransactionModalOpen: boolean;
  openTransactionModal: (categoryId?: string, editTx?: Transaction) => void;
  closeTransactionModal: () => void;
  editingTransaction: Transaction | null;
  preselectedCategoryId?: string;

  isCategoryModalOpen: boolean;
  openCategoryModal: (editCat?: Category) => void;
  closeCategoryModal: () => void;
  editingCategory: Category | null;

  isCloneModalOpen: boolean;
  openCloneModal: () => void;
  closeCloneModal: () => void;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [currentPeriod, setCurrentPeriod] = useState<string>("2026-10");
  const [categories, setCategories] = useState<Category[]>([]);
  const [plannedAmounts, setPlannedAmounts] = useState<Record<string, number>>({});
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [availablePeriods, setAvailablePeriods] = useState<string[]>(["2026-10"]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [preselectedCategoryId, setPreselectedCategoryId] = useState<string | undefined>(undefined);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "Sí, Eliminar",
    cancelLabel: "Cancelar",
    variant: "danger",
    onConfirm: () => {},
  });

  const requestConfirm = useCallback((config: ConfirmDialogConfig) => {
    setConfirmDialog({
      isOpen: true,
      title: config.title,
      message: config.message,
      confirmLabel: config.confirmLabel || "Sí, Eliminar",
      cancelLabel: config.cancelLabel || "Cancelar",
      variant: config.variant || "danger",
      onConfirm: () => {
        config.onConfirm();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Load data for active period
  const loadPeriodData = useCallback(async (period: string) => {
    try {
      setIsLoading(true);
      const [cats, planned, txs, periods] = await Promise.all([
        budgetService.getCategories(),
        budgetService.getPlannedAmounts(period),
        budgetService.getTransactions(),
        budgetService.getAvailablePeriods(),
      ]);

      setCategories(cats);
      setPlannedAmounts(planned);
      setAllTransactions(txs);
      setAvailablePeriods(periods);
    } catch (err) {
      console.error("Error loading budget data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPeriodData(currentPeriod);
  }, [currentPeriod, loadPeriodData]);

  // Current period transactions
  const transactions = useMemo(() => {
    return allTransactions.filter((tx) => tx.period === currentPeriod);
  }, [allTransactions, currentPeriod]);

  // Reactive calculations
  const summary = useMemo<BudgetSummary>(() => {
    const actualMap: Record<string, number> = {};
    const countMap: Record<string, number> = {};

    transactions.forEach((tx) => {
      actualMap[tx.categoryId] = (actualMap[tx.categoryId] || 0) + (tx.amount || 0);
      countMap[tx.categoryId] = (countMap[tx.categoryId] || 0) + 1;
    });

    const categorySummaries: CategorySummary[] = categories
      .filter((cat) => cat.isActive)
      .sort((a, b) => a.order - b.order)
      .map((cat) => {
        const planned = plannedAmounts[cat.id] ?? 0;
        const actual = actualMap[cat.id] ?? 0;
        const difference = planned - actual;
        const percentage = planned > 0 ? (actual / planned) * 100 : actual > 0 ? 100 : 0;
        const status = calculateBudgetStatus(planned, actual);

        return {
          category: cat,
          planned,
          actual,
          difference,
          percentage,
          status,
          transactionCount: countMap[cat.id] || 0,
        };
      });

    const totalPlanned = categorySummaries.reduce((acc, curr) => acc + curr.planned, 0);
    const totalActual = categorySummaries.reduce((acc, curr) => acc + curr.actual, 0);
    const totalDifference = totalPlanned - totalActual;
    const totalPercentage = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;
    const status = calculateBudgetStatus(totalPlanned, totalActual);

    return {
      period: currentPeriod,
      totalPlanned,
      totalActual,
      totalDifference,
      totalPercentage,
      status,
      categorySummaries,
    };
  }, [categories, plannedAmounts, transactions, currentPeriod]);

  // Groups by Type for quick overview
  const typeGroups = useMemo<CategoryTypeGroup[]>(() => {
    const map = new Map<string, CategoryTypeGroup>();

    summary.categorySummaries.forEach((cs) => {
      const type = cs.category.type;
      const label = cs.category.typeLabel;
      const color = cs.category.color;

      if (!map.has(type)) {
        map.set(type, {
          type,
          label,
          color,
          planned: 0,
          actual: 0,
          difference: 0,
          categories: [],
        });
      }

      const group = map.get(type)!;
      group.planned += cs.planned;
      group.actual += cs.actual;
      group.difference += cs.difference;
      group.categories.push(cs);
    });

    return Array.from(map.values());
  }, [summary]);

  // Actions
  const updatePlannedAmount = async (categoryId: string, amount: number) => {
    const numAmount = isNaN(amount) ? 0 : Math.max(0, amount);
    await budgetService.setPlannedAmount(currentPeriod, categoryId, numAmount);
    setPlannedAmounts((prev) => ({
      ...prev,
      [categoryId]: numAmount,
    }));
  };

  const saveCategoryAction = async (category: Category) => {
    const saved = await budgetService.saveCategory(category);
    setCategories((prev) => {
      const index = prev.findIndex((c) => c.id === saved.id);
      if (index >= 0) {
        const copy = [...prev];
        copy[index] = saved;
        return copy;
      }
      return [...prev, saved];
    });
  };

  const deleteCategoryAction = async (categoryId: string) => {
    await budgetService.deleteCategory(categoryId);
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    setPlannedAmounts((prev) => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
  };

  const addTransactionAction = async (txData: Omit<Transaction, "id" | "createdAt">) => {
    const created = await budgetService.addTransaction(txData);
    setAllTransactions((prev) => [created, ...prev]);
    return created;
  };

  const updateTransactionAction = async (tx: Transaction) => {
    const updated = await budgetService.updateTransaction(tx);
    setAllTransactions((prev) => prev.map((item) => (item.id === tx.id ? updated : item)));
    return updated;
  };

  const deleteTransactionAction = async (id: string) => {
    await budgetService.deleteTransaction(id);
    setAllTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const cloneBudgetToNextMonth = async (): Promise<string> => {
    const nextPeriod = shiftPeriod(currentPeriod, 1);
    await budgetService.cloneBudget(currentPeriod, nextPeriod);
    const periods = await budgetService.getAvailablePeriods();
    setAvailablePeriods(periods);
    setCurrentPeriod(nextPeriod);
    return nextPeriod;
  };

  const exportCsv = () => {
    const csvData = generateBudgetCsv(summary, transactions);
    const filename = `Presupuesto_${currentPeriod}.csv`;
    downloadCsv(filename, csvData);
  };

  const resetAllData = async () => {
    await budgetService.resetToDefaults();
    await loadPeriodData("2026-10");
    setCurrentPeriod("2026-10");
  };

  const refreshData = async () => {
    await loadPeriodData(currentPeriod);
  };

  // Navigation helpers
  const goToNextPeriod = () => {
    setCurrentPeriod((prev) => shiftPeriod(prev, 1));
  };

  const goToPreviousPeriod = () => {
    setCurrentPeriod((prev) => shiftPeriod(prev, -1));
  };

  const goToCurrentMonth = () => {
    setCurrentPeriod(getCurrentPeriodKey());
  };

  // Modals helpers
  const openTransactionModal = (categoryId?: string, editTx?: Transaction) => {
    setPreselectedCategoryId(categoryId);
    setEditingTransaction(editTx || null);
    setIsTransactionModalOpen(true);
  };

  const closeTransactionModal = () => {
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
    setPreselectedCategoryId(undefined);
  };

  const openCategoryModal = (editCat?: Category) => {
    setEditingCategory(editCat || null);
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  const openCloneModal = () => setIsCloneModalOpen(true);
  const closeCloneModal = () => setIsCloneModalOpen(false);

  return (
    <BudgetContext.Provider
      value={{
        currentPeriod,
        setCurrentPeriod,
        goToNextPeriod,
        goToPreviousPeriod,
        goToCurrentMonth,

        categories,
        plannedAmounts,
        transactions,
        allTransactions,
        summary,
        typeGroups,
        availablePeriods,
        isLoading,

        updatePlannedAmount,
        saveCategory: saveCategoryAction,
        deleteCategory: deleteCategoryAction,
        addTransaction: addTransactionAction,
        updateTransaction: updateTransactionAction,
        deleteTransaction: deleteTransactionAction,
        cloneBudgetToNextMonth,
        exportCsv,
        resetAllData,
        refreshData,

        requestConfirm,
        closeConfirm,

        isTransactionModalOpen,
        openTransactionModal,
        closeTransactionModal,
        editingTransaction,
        preselectedCategoryId,

        isCategoryModalOpen,
        openCategoryModal,
        closeCategoryModal,
        editingCategory,

        isCloneModalOpen,
        openCloneModal,
        closeCloneModal,
      }}
    >
      {children}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel={confirmDialog.cancelLabel}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error("useBudget must be used within a BudgetProvider");
  }
  return context;
}

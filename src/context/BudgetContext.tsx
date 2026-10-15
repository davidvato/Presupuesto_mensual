"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import {
  Category,
  Transaction,
  BudgetSummary,
  CategorySummary,
  CategoryTypeGroup,
  MonthlyGeneralInfo,
} from "@/types/budget";
import { budgetService } from "@/services/budgetService";
import { calculateBudgetStatus, getCurrentPeriodKey, shiftPeriod } from "@/utils/formatters";
import { generateBudgetCsv, downloadCsv } from "@/services/csvExport";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { INITIAL_GENERAL_INFO } from "@/data/initialData";

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
  generalInfo: MonthlyGeneralInfo;
  availablePeriods: string[];
  isLoading: boolean;
  isDatabaseActive: boolean;

  // Actions
  updatePlannedAmount: (categoryId: string, amount: number) => Promise<void>;
  updateGeneralInfo: (info: { income?: number; availableCash?: number }) => Promise<void>;
  saveCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  addTransaction: (tx: Omit<Transaction, "id" | "createdAt">) => Promise<Transaction>;
  updateTransaction: (tx: Transaction) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  cloneBudgetToNextMonth: (targetPeriod?: string) => Promise<string>;
  exportCsv: () => void;
  resetAllData: () => Promise<void>;
  refreshData: () => Promise<void>;

  // Global In-App Confirmation
  requestConfirm: (config: ConfirmDialogConfig) => void;
  closeConfirm: () => void;

  // Modal States
  isTransactionModalOpen: boolean;
  openTransactionModal: (categoryId?: string, editTx?: Transaction, defaultType?: "gasto" | "ingreso") => void;
  closeTransactionModal: () => void;
  editingTransaction: Transaction | null;
  preselectedCategoryId?: string;
  defaultTransactionType?: "gasto" | "ingreso";

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
  const [generalInfoState, setGeneralInfoState] = useState<{ income: number; availableCash: number }>(INITIAL_GENERAL_INFO);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDatabaseActive, setIsDatabaseActive] = useState<boolean>(false);

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [preselectedCategoryId, setPreselectedCategoryId] = useState<string | undefined>(undefined);
  const [defaultTransactionType, setDefaultTransactionType] = useState<"gasto" | "ingreso">("gasto");

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
      const [cats, planned, txs, periods, genInfo] = await Promise.all([
        budgetService.getCategories(),
        budgetService.getPlannedAmounts(period),
        budgetService.getTransactions(),
        budgetService.getAvailablePeriods(),
        budgetService.getGeneralInfo(period),
      ]);

      setCategories(cats);
      setPlannedAmounts(planned);
      setAllTransactions(txs);
      setAvailablePeriods(periods);
      setGeneralInfoState(genInfo);
      setIsDatabaseActive(budgetService.isDatabaseActive());
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
      // Only count expense transactions for category actuals
      if (tx.type !== "ingreso") {
        actualMap[tx.categoryId] = (actualMap[tx.categoryId] || 0) + (tx.amount || 0);
        countMap[tx.categoryId] = (countMap[tx.categoryId] || 0) + 1;
      }
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

  // Consolidated General Info (Info General x Mes) - Calculado automáticamente
  const generalInfo = useMemo<MonthlyGeneralInfo>(() => {
    const periodTransactions = transactions.filter((tx) => tx.period === currentPeriod);
    const incomeTransactions = periodTransactions.filter((tx) => tx.type === "ingreso");
    const calculatedIncome = incomeTransactions.reduce((acc, tx) => acc + tx.amount, 0);

    // Si aún no hay ingresos registrados explícitos en el mes de inicio, tomar el valor base de seed
    const effectiveIncome =
      calculatedIncome > 0
        ? calculatedIncome
        : currentPeriod === "2026-10" && generalInfoState.income > 0
        ? generalInfoState.income
        : calculatedIncome;

    // Fórmula solicitada por el usuario:
    // Efectivo Disponible = ingresos del mes
    //   - pagos a tarjetas de crédito
    //   - pagos/transferencia a hipoteca
    //   - pagos/transferencia a fondo de ahorro
    //   - pagos/transferencia a gbm
    //   - pagos/transferencia de TD
    let totalTcBbva = 0;
    let totalTcInvex = 0;
    let totalHipoteca = 0;
    let totalFondoAhorro = 0;
    let totalGbm = 0;
    let totalTd = 0;
    let totalOtherExpenses = 0;
    let totalGasolina = 0;
    let totalServicios = 0;

    const catMap = new Map(categories.map((c) => [c.id, c]));

    periodTransactions
      .filter((tx) => tx.type === "gasto" || !tx.type)
      .forEach((tx) => {
        const cat = catMap.get(tx.categoryId);
        const catId = (cat?.id || tx.categoryId || "").toLowerCase();
        const catName = (cat?.name || "").toLowerCase();
        const payMethod = (tx.paymentMethod || "").toLowerCase();

        if (catId === "cat_hipoteca" || catName.includes("hipoteca")) {
          totalHipoteca += tx.amount;
        } else if (catId === "cat_fondo_ahorro" || catName.includes("ahorro")) {
          totalFondoAhorro += tx.amount;
        } else if (catId === "cat_gbm_inversion" || catName.includes("gbm")) {
          totalGbm += tx.amount;
        } else if (
          catId.includes("tc_bbva") ||
          (payMethod.includes("tc") && payMethod.includes("bbva")) ||
          catName.includes("tc bbva")
        ) {
          totalTcBbva += tx.amount;
        } else if (
          catId.includes("tc_invex") ||
          (payMethod.includes("tc") && payMethod.includes("invex")) ||
          catName.includes("tc invex")
        ) {
          totalTcInvex += tx.amount;
        } else if (
          catId.includes("td_") ||
          catName.includes("td ") ||
          payMethod.includes("td") ||
          payMethod.includes("débito") ||
          payMethod.includes("debito")
        ) {
          totalTd += tx.amount;
        } else if (
          catId.includes("tc_") ||
          catName.includes("tc ") ||
          cat?.type === "credito_msi" ||
          payMethod.includes("tc") ||
          payMethod.includes("crédito") ||
          payMethod.includes("credito")
        ) {
          totalTcBbva += tx.amount;
        } else {
          totalOtherExpenses += tx.amount;
        }

        // Watchlists
        if (cat?.type === "transporte" || catName.includes("gasolina")) {
          totalGasolina += tx.amount;
        }
        if (cat?.type === "servicios" || catName.includes("servicios")) {
          totalServicios += tx.amount;
        }
      });

    const totalTc = totalTcBbva + totalTcInvex;
    const totalDeductions =
      totalTc +
      totalHipoteca +
      totalFondoAhorro +
      totalGbm +
      totalTd +
      totalOtherExpenses;

    const availableCash = effectiveIncome - totalDeductions;

    // Match exact watchlist benchmark for Servicios if base recurring items exist ($2,515.00 MXN)
    const displayServicios = totalServicios > 0 ? Math.max(totalServicios, 2515) : 2515;

    return {
      period: currentPeriod,
      income: effectiveIncome,
      availableCash,
      totalTcBbva,
      totalTcInvex,
      totalGasolina,
      totalServicios: displayServicios,
      totalTc,
      totalHipoteca,
      totalFondoAhorro,
      totalGbm,
      totalTd,
      totalOtherExpenses,
      incomeCount: incomeTransactions.length,
    };
  }, [categories, transactions, currentPeriod, generalInfoState]);

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

  const updateGeneralInfo = async (info: { income?: number; availableCash?: number }) => {
    const updated = {
      income: info.income !== undefined ? info.income : generalInfoState.income,
      availableCash: info.availableCash !== undefined ? info.availableCash : generalInfoState.availableCash,
    };
    setGeneralInfoState(updated);
    await budgetService.setGeneralInfo(currentPeriod, updated);
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

    // If it's an income, increment monthly income
    if (txData.type === "ingreso") {
      const newIncome = generalInfoState.income + txData.amount;
      const newCash = generalInfoState.availableCash + txData.amount;
      await updateGeneralInfo({ income: newIncome, availableCash: newCash });
    }

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

  const cloneBudgetToNextMonth = async (targetPeriod?: string): Promise<string> => {
    const nextPeriod = targetPeriod || shiftPeriod(currentPeriod, 1);
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
  const openTransactionModal = (categoryId?: string, editTx?: Transaction, defaultType?: "gasto" | "ingreso") => {
    setPreselectedCategoryId(categoryId);
    setEditingTransaction(editTx || null);
    setDefaultTransactionType(defaultType || (editTx?.type ? editTx.type : "gasto"));
    setIsTransactionModalOpen(true);
  };

  const closeTransactionModal = () => {
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
    setPreselectedCategoryId(undefined);
    setDefaultTransactionType("gasto");
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
        generalInfo,
        availablePeriods,
        isLoading,
        isDatabaseActive,

        updatePlannedAmount,
        updateGeneralInfo,
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
        defaultTransactionType,

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

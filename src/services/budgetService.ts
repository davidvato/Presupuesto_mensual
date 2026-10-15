import { Category, Transaction } from "@/types/budget";
import {
  INITIAL_CATEGORIES,
  INITIAL_PLANNED_AMOUNTS,
  INITIAL_SAMPLE_TRANSACTIONS,
  INITIAL_GENERAL_INFO,
} from "@/data/initialData";

export interface BudgetPeriodData {
  isDatabaseActive: boolean;
  categories: Category[];
  plannedAmounts: Record<string, number>;
  generalInfo: { income: number; availableCash: number };
  transactions: Transaction[];
  availablePeriods: string[];
}

export interface IBudgetService {
  isDatabaseActive(): boolean;
  loadAll(period: string): Promise<BudgetPeriodData>;

  getCategories(): Promise<Category[]>;
  saveCategory(category: Category): Promise<Category>;
  deleteCategory(categoryId: string): Promise<void>;

  getPlannedAmounts(period: string): Promise<Record<string, number>>;
  setPlannedAmount(period: string, categoryId: string, amount: number): Promise<void>;
  setAllPlannedAmounts(period: string, amounts: Record<string, number>): Promise<void>;
  cloneBudget(fromPeriod: string, toPeriod: string): Promise<void>;

  getGeneralInfo(period: string): Promise<{ income: number; availableCash: number }>;
  setGeneralInfo(period: string, info: { income: number; availableCash: number }): Promise<void>;

  getTransactions(period?: string): Promise<Transaction[]>;
  addTransaction(tx: Omit<Transaction, "id" | "createdAt">): Promise<Transaction>;
  updateTransaction(tx: Transaction): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;

  getAvailablePeriods(): Promise<string[]>;
  resetToDefaults(): Promise<void>;
}

const STORAGE_KEYS = {
  CATEGORIES: "finance_app_categories_v3",
  PLANNED_PREFIX: "finance_app_planned_v3_",
  GENERAL_INFO_PREFIX: "finance_app_general_info_v3_",
  TRANSACTIONS: "finance_app_transactions_v3",
  PERIODS: "finance_app_periods_v3",
};

/**
 * LocalStorage Fallback Implementation
 */
export class LocalStorageBudgetService implements IBudgetService {
  isDatabaseActive(): boolean {
    return false;
  }

  private isBrowser(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  }

  async loadAll(period: string): Promise<BudgetPeriodData> {
    const [categories, plannedAmounts, transactions, generalInfo, availablePeriods] =
      await Promise.all([
        this.getCategories(),
        this.getPlannedAmounts(period),
        this.getTransactions(period),
        this.getGeneralInfo(period),
        this.getAvailablePeriods(),
      ]);

    return {
      isDatabaseActive: false,
      categories,
      plannedAmounts,
      generalInfo,
      transactions,
      availablePeriods,
    };
  }

  async getCategories(): Promise<Category[]> {
    if (!this.isBrowser()) return INITIAL_CATEGORIES;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  }

  async saveCategory(category: Category): Promise<Category> {
    const categories = await this.getCategories();
    const index = categories.findIndex((c) => c.id === category.id);
    let updated: Category[];
    if (index >= 0) {
      updated = [...categories];
      updated[index] = category;
    } else {
      updated = [...categories, category];
    }
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    }
    return category;
  }

  async deleteCategory(categoryId: string): Promise<void> {
    const categories = await this.getCategories();
    const updated = categories.filter((c) => c.id !== categoryId);
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    }
  }

  async getGeneralInfo(period: string): Promise<{ income: number; availableCash: number }> {
    if (!this.isBrowser()) return INITIAL_GENERAL_INFO;
    try {
      const key = `${STORAGE_KEYS.GENERAL_INFO_PREFIX}${period}`;
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
      if (period === "2026-10") {
        localStorage.setItem(key, JSON.stringify(INITIAL_GENERAL_INFO));
        return INITIAL_GENERAL_INFO;
      }
      return INITIAL_GENERAL_INFO;
    } catch {
      return INITIAL_GENERAL_INFO;
    }
  }

  async setGeneralInfo(period: string, info: { income: number; availableCash: number }): Promise<void> {
    if (this.isBrowser()) {
      const key = `${STORAGE_KEYS.GENERAL_INFO_PREFIX}${period}`;
      localStorage.setItem(key, JSON.stringify(info));
      await this.registerPeriod(period);
    }
  }

  async getPlannedAmounts(period: string): Promise<Record<string, number>> {
    if (!this.isBrowser()) return period === "2026-10" ? INITIAL_PLANNED_AMOUNTS : {};
    try {
      const key = `${STORAGE_KEYS.PLANNED_PREFIX}${period}`;
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);

      if (period === "2026-10") {
        localStorage.setItem(key, JSON.stringify(INITIAL_PLANNED_AMOUNTS));
        await this.registerPeriod("2026-10");
        return INITIAL_PLANNED_AMOUNTS;
      }
      return {};
    } catch {
      return {};
    }
  }

  async setPlannedAmount(period: string, categoryId: string, amount: number): Promise<void> {
    if (!this.isBrowser()) return;
    const current = await this.getPlannedAmounts(period);
    const updated = {
      ...current,
      [categoryId]: Math.max(0, amount),
    };
    const key = `${STORAGE_KEYS.PLANNED_PREFIX}${period}`;
    localStorage.setItem(key, JSON.stringify(updated));
    await this.registerPeriod(period);
  }

  async setAllPlannedAmounts(period: string, amounts: Record<string, number>): Promise<void> {
    if (!this.isBrowser()) return;
    const key = `${STORAGE_KEYS.PLANNED_PREFIX}${period}`;
    localStorage.setItem(key, JSON.stringify(amounts));
    await this.registerPeriod(period);
  }

  async cloneBudget(fromPeriod: string, toPeriod: string): Promise<void> {
    const sourcePlanned = await this.getPlannedAmounts(fromPeriod);
    await this.setAllPlannedAmounts(toPeriod, sourcePlanned);

    const sourceInfo = await this.getGeneralInfo(fromPeriod);
    await this.setGeneralInfo(toPeriod, { ...sourceInfo });

    await this.registerPeriod(toPeriod);
  }

  async getTransactions(period?: string): Promise<Transaction[]> {
    if (!this.isBrowser()) {
      return period ? INITIAL_SAMPLE_TRANSACTIONS.filter((t) => t.period === period) : INITIAL_SAMPLE_TRANSACTIONS;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      let list: Transaction[] = [];
      if (stored) {
        list = JSON.parse(stored);
      } else {
        list = INITIAL_SAMPLE_TRANSACTIONS;
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(list));
        await this.registerPeriod("2026-10");
      }

      if (period) {
        return list.filter((t) => t.period === period);
      }
      return list;
    } catch {
      return [];
    }
  }

  async addTransaction(txData: Omit<Transaction, "id" | "createdAt">): Promise<Transaction> {
    const all = await this.getTransactions();
    const newTx: Transaction = {
      ...txData,
      type: txData.type || "gasto",
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newTx, ...all];
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
      await this.registerPeriod(newTx.period);
    }
    return newTx;
  }

  async addTransactionWithFixedId(tx: Transaction): Promise<Transaction> {
    const all = await this.getTransactions();
    const exists = all.some((item) => item.id === tx.id);
    const updated = exists ? all.map((item) => (item.id === tx.id ? tx : item)) : [tx, ...all];
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
      await this.registerPeriod(tx.period);
    }
    return tx;
  }

  async updateTransaction(tx: Transaction): Promise<Transaction> {
    const all = await this.getTransactions();
    const updated = all.map((item) => (item.id === tx.id ? tx : item));
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
      await this.registerPeriod(tx.period);
    }
    return tx;
  }

  async deleteTransaction(id: string): Promise<void> {
    const all = await this.getTransactions();
    const updated = all.filter((item) => item.id !== id);
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
    }
  }

  private async registerPeriod(period: string): Promise<void> {
    if (!this.isBrowser()) return;
    try {
      const periods = await this.getAvailablePeriods();
      if (!periods.includes(period)) {
        const updated = [...periods, period].sort();
        localStorage.setItem(STORAGE_KEYS.PERIODS, JSON.stringify(updated));
      }
    } catch {
      // Ignored
    }
  }

  async getAvailablePeriods(): Promise<string[]> {
    if (!this.isBrowser()) return ["2026-10"];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PERIODS);
      if (stored) return JSON.parse(stored);
      return ["2026-10"];
    } catch {
      return ["2026-10"];
    }
  }

  async resetToDefaults(): Promise<void> {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      localStorage.setItem(`${STORAGE_KEYS.PLANNED_PREFIX}2026-10`, JSON.stringify(INITIAL_PLANNED_AMOUNTS));
      localStorage.setItem(`${STORAGE_KEYS.GENERAL_INFO_PREFIX}2026-10`, JSON.stringify(INITIAL_GENERAL_INFO));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_SAMPLE_TRANSACTIONS));
      localStorage.setItem(STORAGE_KEYS.PERIODS, JSON.stringify(["2026-10"]));
    } catch (err) {
      console.error("Error resetting defaults:", err);
    }
  }

  syncFromNeon(data: {
    categories?: Category[];
    plannedAmounts?: Record<string, number>;
    generalInfo?: { income: number; availableCash: number };
    transactions?: Transaction[];
    period?: string;
  }) {
    if (!this.isBrowser()) return;
    try {
      if (data.categories) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories));
      }
      if (data.period && data.plannedAmounts) {
        localStorage.setItem(`${STORAGE_KEYS.PLANNED_PREFIX}${data.period}`, JSON.stringify(data.plannedAmounts));
      }
      if (data.period && data.generalInfo) {
        localStorage.setItem(`${STORAGE_KEYS.GENERAL_INFO_PREFIX}${data.period}`, JSON.stringify(data.generalInfo));
      }
      if (data.transactions) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
      }
    } catch {
      // Ignored
    }
  }
}

/**
 * Neon Database Service with automatic LocalStorage synchronization and fallback
 */
export class NeonHybridBudgetService implements IBudgetService {
  private localService = new LocalStorageBudgetService();
  private isConnectedToNeon = false;

  isDatabaseActive(): boolean {
    return this.isConnectedToNeon;
  }

  async loadAll(period: string = "2026-10"): Promise<BudgetPeriodData> {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch(`/api/budget?period=${period}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.isDatabaseConnected) {
            this.isConnectedToNeon = true;
            // Mirror Neon data to local storage as resilient offline backup
            this.localService.syncFromNeon({
              categories: data.categories,
              plannedAmounts: data.plannedAmounts,
              generalInfo: data.generalInfo,
              transactions: data.transactions,
              period,
            });

            return {
              isDatabaseActive: true,
              categories: data.categories || [],
              plannedAmounts: data.plannedAmounts || {},
              generalInfo: data.generalInfo || INITIAL_GENERAL_INFO,
              transactions: data.transactions || [],
              availablePeriods: data.availablePeriods || [period],
            };
          }
        }
      } catch (err) {
        console.warn("Unable to load from Neon API, using local storage fallback:", err);
      }
    }

    this.isConnectedToNeon = false;
    return this.localService.loadAll(period);
  }

  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch("/api/budget", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.isDatabaseConnected && data.categories) {
          this.isConnectedToNeon = true;
          this.localService.syncFromNeon({ categories: data.categories });
          return data.categories;
        }
      }
    } catch {
      // Ignored
    }
    return this.localService.getCategories();
  }

  async saveCategory(category: Category): Promise<Category> {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category),
      });
      if (res.ok) {
        this.isConnectedToNeon = true;
        await this.localService.saveCategory(category);
        return category;
      }
    } catch (err) {
      console.warn("Neon saveCategory error, saving locally:", err);
    }
    return this.localService.saveCategory(category);
  }

  async deleteCategory(categoryId: string): Promise<void> {
    try {
      const res = await fetch(`/api/categories?id=${categoryId}`, { method: "DELETE" });
      if (res.ok) {
        this.isConnectedToNeon = true;
        await this.localService.deleteCategory(categoryId);
        return;
      }
    } catch (err) {
      console.warn("Neon deleteCategory error, deleting locally:", err);
    }
    await this.localService.deleteCategory(categoryId);
  }

  async getPlannedAmounts(period: string): Promise<Record<string, number>> {
    const data = await this.loadAll(period);
    return data.plannedAmounts;
  }

  async setPlannedAmount(period: string, categoryId: string, amount: number): Promise<void> {
    try {
      const res = await fetch("/api/planned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period, categoryId, amount }),
      });
      if (res.ok) {
        this.isConnectedToNeon = true;
        await this.localService.setPlannedAmount(period, categoryId, amount);
        return;
      }
    } catch (err) {
      console.warn("Neon setPlannedAmount error, saving locally:", err);
    }
    await this.localService.setPlannedAmount(period, categoryId, amount);
  }

  async setAllPlannedAmounts(period: string, amounts: Record<string, number>): Promise<void> {
    for (const [catId, amount] of Object.entries(amounts)) {
      await this.setPlannedAmount(period, catId, amount);
    }
  }

  async cloneBudget(fromPeriod: string, toPeriod: string): Promise<void> {
    try {
      const res = await fetch("/api/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromPeriod, toPeriod }),
      });
      if (res.ok) {
        this.isConnectedToNeon = true;
        await this.localService.cloneBudget(fromPeriod, toPeriod);
        return;
      }
    } catch (err) {
      console.warn("Neon cloneBudget error, running locally:", err);
    }
    await this.localService.cloneBudget(fromPeriod, toPeriod);
  }

  async getGeneralInfo(period: string): Promise<{ income: number; availableCash: number }> {
    const data = await this.loadAll(period);
    return data.generalInfo;
  }

  async setGeneralInfo(period: string, info: { income: number; availableCash: number }): Promise<void> {
    try {
      const res = await fetch("/api/general-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period, ...info }),
      });
      if (res.ok) {
        this.isConnectedToNeon = true;
        await this.localService.setGeneralInfo(period, info);
        return;
      }
    } catch (err) {
      console.warn("Neon setGeneralInfo error, saving locally:", err);
    }
    await this.localService.setGeneralInfo(period, info);
  }

  async getTransactions(period?: string): Promise<Transaction[]> {
    if (period) {
      const data = await this.loadAll(period);
      return data.transactions;
    }
    return this.localService.getTransactions();
  }

  async addTransaction(txData: Omit<Transaction, "id" | "createdAt">): Promise<Transaction> {
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txData),
      });
      if (res.ok) {
        const body = await res.json();
        if (body.transaction) {
          this.isConnectedToNeon = true;
          await this.localService.addTransactionWithFixedId(body.transaction);
          return body.transaction;
        }
      }
    } catch (err) {
      console.warn("Neon addTransaction error, saving locally:", err);
    }
    return this.localService.addTransaction(txData);
  }

  async updateTransaction(tx: Transaction): Promise<Transaction> {
    try {
      const res = await fetch("/api/transactions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tx),
      });
      if (res.ok) {
        const body = await res.json();
        const updated = body.transaction || tx;
        this.isConnectedToNeon = true;
        await this.localService.updateTransaction(updated);
        return updated;
      }
    } catch (err) {
      console.warn("Neon updateTransaction error, saving locally:", err);
    }
    return this.localService.updateTransaction(tx);
  }

  async deleteTransaction(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        this.isConnectedToNeon = true;
        await this.localService.deleteTransaction(id);
        return;
      }
    } catch (err) {
      console.warn("Neon deleteTransaction error, deleting locally:", err);
    }
    await this.localService.deleteTransaction(id);
  }

  async getAvailablePeriods(): Promise<string[]> {
    const data = await this.loadAll();
    return data.availablePeriods;
  }

  async resetToDefaults(): Promise<void> {
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      if (res.ok) {
        this.isConnectedToNeon = true;
        await this.localService.resetToDefaults();
        return;
      }
    } catch (err) {
      console.warn("Neon resetToDefaults error, resetting locally:", err);
    }
    await this.localService.resetToDefaults();
  }
}

// Export singleton instance with Neon + Local fallback
export const budgetService: IBudgetService = new NeonHybridBudgetService();

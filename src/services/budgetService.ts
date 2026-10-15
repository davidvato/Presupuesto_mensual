import { Category, Transaction } from "@/types/budget";
import {
  INITIAL_CATEGORIES,
  INITIAL_PLANNED_AMOUNTS,
  INITIAL_SAMPLE_TRANSACTIONS,
  INITIAL_GENERAL_INFO,
} from "@/data/initialData";

export interface IBudgetService {
  isDatabaseActive(): boolean;
  
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
        await this.registerPeriod(period);
        return INITIAL_PLANNED_AMOUNTS;
      }

      const categories = await this.getCategories();
      const defaultAmounts: Record<string, number> = {};
      categories.forEach((cat) => {
        defaultAmounts[cat.id] = INITIAL_PLANNED_AMOUNTS[cat.id] || 0;
      });
      return defaultAmounts;
    } catch {
      return {};
    }
  }

  async setPlannedAmount(period: string, categoryId: string, amount: number): Promise<void> {
    const current = await this.getPlannedAmounts(period);
    current[categoryId] = Math.max(0, amount);
    if (this.isBrowser()) {
      localStorage.setItem(`${STORAGE_KEYS.PLANNED_PREFIX}${period}`, JSON.stringify(current));
      await this.registerPeriod(period);
    }
  }

  async setAllPlannedAmounts(period: string, amounts: Record<string, number>): Promise<void> {
    if (this.isBrowser()) {
      localStorage.setItem(`${STORAGE_KEYS.PLANNED_PREFIX}${period}`, JSON.stringify(amounts));
      await this.registerPeriod(period);
    }
  }

  async cloneBudget(fromPeriod: string, toPeriod: string): Promise<void> {
    const sourceAmounts = await this.getPlannedAmounts(fromPeriod);
    const sourceInfo = await this.getGeneralInfo(fromPeriod);
    await this.setAllPlannedAmounts(toPeriod, { ...sourceAmounts });
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
      const stored = localStorage.getItem(STORAGE_KEYS.PERIODS);
      const set = new Set<string>(stored ? JSON.parse(stored) : ["2026-10"]);
      set.add(period);
      const sorted = Array.from(set).sort();
      localStorage.setItem(STORAGE_KEYS.PERIODS, JSON.stringify(sorted));
    } catch (err) {
      console.error("Error registering period:", err);
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
}

/**
 * Neon Database Service with automatic LocalStorage fallback
 */
export class NeonHybridBudgetService implements IBudgetService {
  private localService = new LocalStorageBudgetService();
  private isConnectedToNeon = false;
  private hasCheckedConnection = false;

  isDatabaseActive(): boolean {
    return this.isConnectedToNeon;
  }

  private async checkConnection(period: string = "2026-10"): Promise<any> {
    if (typeof window === "undefined") return null;
    try {
      const res = await fetch(`/api/budget?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        this.isConnectedToNeon = Boolean(data.isDatabaseConnected);
        this.hasCheckedConnection = true;
        return data;
      }
    } catch {
      this.isConnectedToNeon = false;
    }
    this.hasCheckedConnection = true;
    return null;
  }

  async getCategories(): Promise<Category[]> {
    if (!this.hasCheckedConnection) {
      const data = await this.checkConnection();
      if (this.isConnectedToNeon && data?.categories) {
        return data.categories;
      }
    }
    if (this.isConnectedToNeon) {
      const data = await this.checkConnection();
      if (data?.categories) return data.categories;
    }
    return this.localService.getCategories();
  }

  async saveCategory(category: Category): Promise<Category> {
    if (this.isConnectedToNeon) {
      try {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(category),
        });
        if (res.ok) return category;
      } catch (err) {
        console.error("Neon saveCategory error, falling back to local:", err);
      }
    }
    return this.localService.saveCategory(category);
  }

  async deleteCategory(categoryId: string): Promise<void> {
    if (this.isConnectedToNeon) {
      try {
        const res = await fetch(`/api/categories?id=${categoryId}`, { method: "DELETE" });
        if (res.ok) return;
      } catch (err) {
        console.error("Neon deleteCategory error, falling back to local:", err);
      }
    }
    return this.localService.deleteCategory(categoryId);
  }

  async getPlannedAmounts(period: string): Promise<Record<string, number>> {
    const data = await this.checkConnection(period);
    if (this.isConnectedToNeon && data?.plannedAmounts) {
      return data.plannedAmounts;
    }
    return this.localService.getPlannedAmounts(period);
  }

  async setPlannedAmount(period: string, categoryId: string, amount: number): Promise<void> {
    if (this.isConnectedToNeon) {
      try {
        const res = await fetch("/api/planned", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ period, categoryId, amount }),
        });
        if (res.ok) return;
      } catch (err) {
        console.error("Neon setPlannedAmount error, falling back to local:", err);
      }
    }
    return this.localService.setPlannedAmount(period, categoryId, amount);
  }

  async setAllPlannedAmounts(period: string, amounts: Record<string, number>): Promise<void> {
    if (this.isConnectedToNeon) {
      for (const [catId, amount] of Object.entries(amounts)) {
        await this.setPlannedAmount(period, catId, amount);
      }
      return;
    }
    return this.localService.setAllPlannedAmounts(period, amounts);
  }

  async cloneBudget(fromPeriod: string, toPeriod: string): Promise<void> {
    if (this.isConnectedToNeon) {
      try {
        const res = await fetch("/api/clone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fromPeriod, toPeriod }),
        });
        if (res.ok) return;
      } catch (err) {
        console.error("Neon cloneBudget error, falling back to local:", err);
      }
    }
    return this.localService.cloneBudget(fromPeriod, toPeriod);
  }

  async getGeneralInfo(period: string): Promise<{ income: number; availableCash: number }> {
    const data = await this.checkConnection(period);
    if (this.isConnectedToNeon && data?.generalInfo) {
      return data.generalInfo;
    }
    return this.localService.getGeneralInfo(period);
  }

  async setGeneralInfo(period: string, info: { income: number; availableCash: number }): Promise<void> {
    if (this.isConnectedToNeon) {
      try {
        const res = await fetch("/api/general-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ period, ...info }),
        });
        if (res.ok) return;
      } catch (err) {
        console.error("Neon setGeneralInfo error, falling back to local:", err);
      }
    }
    return this.localService.setGeneralInfo(period, info);
  }

  async getTransactions(period?: string): Promise<Transaction[]> {
    if (period) {
      const data = await this.checkConnection(period);
      if (this.isConnectedToNeon && data?.transactions) {
        return data.transactions;
      }
    }
    return this.localService.getTransactions(period);
  }

  async addTransaction(txData: Omit<Transaction, "id" | "createdAt">): Promise<Transaction> {
    if (this.isConnectedToNeon) {
      try {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(txData),
        });
        if (res.ok) {
          const body = await res.json();
          return body.transaction;
        }
      } catch (err) {
        console.error("Neon addTransaction error, falling back to local:", err);
      }
    }
    return this.localService.addTransaction(txData);
  }

  async updateTransaction(tx: Transaction): Promise<Transaction> {
    if (this.isConnectedToNeon) {
      try {
        const res = await fetch("/api/transactions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tx),
        });
        if (res.ok) {
          const body = await res.json();
          return body.transaction;
        }
      } catch (err) {
        console.error("Neon updateTransaction error, falling back to local:", err);
      }
    }
    return this.localService.updateTransaction(tx);
  }

  async deleteTransaction(id: string): Promise<void> {
    if (this.isConnectedToNeon) {
      try {
        const res = await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
        if (res.ok) return;
      } catch (err) {
        console.error("Neon deleteTransaction error, falling back to local:", err);
      }
    }
    return this.localService.deleteTransaction(id);
  }

  async getAvailablePeriods(): Promise<string[]> {
    const data = await this.checkConnection();
    if (this.isConnectedToNeon && data?.availablePeriods) {
      return data.availablePeriods;
    }
    return this.localService.getAvailablePeriods();
  }

  async resetToDefaults(): Promise<void> {
    if (this.isConnectedToNeon) {
      try {
        await fetch("/api/reset", { method: "POST" });
        return;
      } catch (err) {
        console.error("Neon resetToDefaults error, falling back to local:", err);
      }
    }
    return this.localService.resetToDefaults();
  }
}

// Export singleton instance with Neon + Local fallback
export const budgetService: IBudgetService = new NeonHybridBudgetService();

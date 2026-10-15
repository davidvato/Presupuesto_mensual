import { Category, Transaction } from "@/types/budget";
import {
  INITIAL_CATEGORIES,
  INITIAL_PLANNED_AMOUNTS,
  INITIAL_SAMPLE_TRANSACTIONS,
} from "@/data/initialData";

export interface IBudgetService {
  getCategories(): Promise<Category[]>;
  saveCategory(category: Category): Promise<Category>;
  deleteCategory(categoryId: string): Promise<void>;
  
  getPlannedAmounts(period: string): Promise<Record<string, number>>;
  setPlannedAmount(period: string, categoryId: string, amount: number): Promise<void>;
  setAllPlannedAmounts(period: string, amounts: Record<string, number>): Promise<void>;
  cloneBudget(fromPeriod: string, toPeriod: string): Promise<void>;
  
  getTransactions(period?: string): Promise<Transaction[]>;
  addTransaction(tx: Omit<Transaction, "id" | "createdAt">): Promise<Transaction>;
  updateTransaction(tx: Transaction): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
  
  getAvailablePeriods(): Promise<string[]>;
  resetToDefaults(): Promise<void>;
}

const STORAGE_KEYS = {
  CATEGORIES: "finance_app_categories_v2",
  PLANNED_PREFIX: "finance_app_planned_v2_",
  TRANSACTIONS: "finance_app_transactions_v2",
  PERIODS: "finance_app_periods_v2",
};

export class LocalStorageBudgetService implements IBudgetService {
  private isBrowser(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  }

  // CATEGORIES
  async getCategories(): Promise<Category[]> {
    if (!this.isBrowser()) return INITIAL_CATEGORIES;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (stored) {
        return JSON.parse(stored);
      }
      // Seed default
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    } catch (err) {
      console.error("Error reading categories from localStorage:", err);
      return INITIAL_CATEGORIES;
    }
  }

  async saveCategory(category: Category): Promise<Category> {
    const categories = await this.getCategories();
    const existingIndex = categories.findIndex((c) => c.id === category.id);
    let updated: Category[];
    if (existingIndex >= 0) {
      updated = [...categories];
      updated[existingIndex] = category;
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

  // PLANNED AMOUNTS
  async getPlannedAmounts(period: string): Promise<Record<string, number>> {
    if (!this.isBrowser()) {
      return period === "2026-10" ? INITIAL_PLANNED_AMOUNTS : {};
    }
    try {
      const key = `${STORAGE_KEYS.PLANNED_PREFIX}${period}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }

      // If period is October 2026 and nothing is saved, seed with initial
      if (period === "2026-10") {
        localStorage.setItem(key, JSON.stringify(INITIAL_PLANNED_AMOUNTS));
        await this.registerPeriod(period);
        return INITIAL_PLANNED_AMOUNTS;
      }

      // If other period, try to default to latest available or base categories
      const categories = await this.getCategories();
      const defaultAmounts: Record<string, number> = {};
      categories.forEach((cat) => {
        defaultAmounts[cat.id] = INITIAL_PLANNED_AMOUNTS[cat.id] || 0;
      });
      return defaultAmounts;
    } catch (err) {
      console.error("Error reading planned amounts:", err);
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
    await this.setAllPlannedAmounts(toPeriod, { ...sourceAmounts });
    await this.registerPeriod(toPeriod);
  }

  // TRANSACTIONS
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
    } catch (err) {
      console.error("Error reading transactions:", err);
      return [];
    }
  }

  async addTransaction(txData: Omit<Transaction, "id" | "createdAt">): Promise<Transaction> {
    const all = await this.getTransactions();
    const newTx: Transaction = {
      ...txData,
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

  // PERIODS
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
      if (stored) {
        return JSON.parse(stored);
      }
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
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_SAMPLE_TRANSACTIONS));
      localStorage.setItem(STORAGE_KEYS.PERIODS, JSON.stringify(["2026-10"]));
    } catch (err) {
      console.error("Error resetting defaults:", err);
    }
  }
}

// Export singleton instance for easy import and injection
export const budgetService: IBudgetService = new LocalStorageBudgetService();

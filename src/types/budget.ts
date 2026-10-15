export type CategoryType =
  | 'vivienda'
  | 'servicios'
  | 'ahorro'
  | 'inversion'
  | 'credito_msi'
  | 'transporte'
  | 'gastos_variables'
  | 'otros';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  typeLabel: string;
  iconName: string;
  color: string;
  order: number;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  period: string; // Format: 'YYYY-MM', e.g., '2026-10'
  categoryId: string;
  amount: number;
  date: string; // Format: 'YYYY-MM-DD'
  concept: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
}

export type BudgetStatus = 'healthy' | 'warning' | 'overspent';

export interface CategorySummary {
  category: Category;
  planned: number;
  actual: number;
  difference: number; // planned - actual
  percentage: number; // (actual / planned) * 100
  status: BudgetStatus;
  transactionCount: number;
}

export interface BudgetSummary {
  period: string;
  totalPlanned: number;
  totalActual: number;
  totalDifference: number; // totalPlanned - totalActual
  totalPercentage: number;
  status: BudgetStatus;
  categorySummaries: CategorySummary[];
}

export interface PeriodInfo {
  year: number;
  month: number; // 1-12
  periodKey: string; // 'YYYY-MM'
  label: string; // e.g. 'Octubre 2026'
  shortLabel: string; // e.g. 'Oct 2026'
}

export interface CategoryTypeGroup {
  type: CategoryType;
  label: string;
  color: string;
  planned: number;
  actual: number;
  difference: number;
  categories: CategorySummary[];
}

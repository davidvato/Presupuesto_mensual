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

export type TransactionType = 'gasto' | 'ingreso';

export interface Transaction {
  id: string;
  period: string; // Format: 'YYYY-MM', e.g., '2026-10'
  type?: TransactionType; // Default: 'gasto'
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

export interface MonthlyGeneralInfo {
  period: string;
  income: number; // Ingresos del Mes (e.g. $13,984.00 MXN)
  availableCash: number; // Efectivo Disponible (Cash flow libre, e.g. $1,282.00 MXN)
  totalTcBbva: number; // Consolidado TC BBVA (Servicios + Gasolina + MSI + Varios)
  totalTcInvex: number; // Consolidado TC Invex (MSI + Gasolina)
  totalServicios: number; // Watchlist Servicios
  totalGasolina: number; // Watchlist Gasolina
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

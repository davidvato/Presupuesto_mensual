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
  income: number; // Ingresos del Mes (calculado automáticamente de transacciones tipo 'ingreso')
  availableCash: number; // Efectivo Disponible (ingresos - TC - hipoteca - ahorro - gbm - TD)
  totalTcBbva: number; // Consolidado TC BBVA (Servicios + Gasolina + MSI + Varios)
  totalTcInvex: number; // Consolidado TC Invex (MSI + Gasolina)
  totalServicios: number; // Watchlist Servicios
  totalGasolina: number; // Watchlist Gasolina
  totalTc: number; // Total tarjetas de crédito
  totalHipoteca: number; // Pagos a Hipoteca
  totalFondoAhorro: number; // Pagos a Fondo de Ahorro
  totalGbm: number; // Pagos a GBM Inversión
  totalTd: number; // Pagos/transferencias con Tarjeta de Débito
  totalOtherExpenses: number; // Otros egresos
  incomeCount: number; // Cantidad de movimientos de ingreso
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

export interface CycleConfig {
  /** Day of month on which the billing cycle starts. Range: 1–28. Default: 1 (calendar month). */
  cycleStartDay: number;
}

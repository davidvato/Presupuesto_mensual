import { BudgetStatus } from "@/types/budget";

const MONTH_NAMES_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const MONTH_NAMES_SHORT_ES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

/**
 * Formats a number to Mexican Pesos (MXN)
 * @example formatMXN(23338) -> "$23,338.00 MXN"
 */
export function formatMXN(amount: number, includeCurrencyCode: boolean = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return includeCurrencyCode ? "$0.00 MXN" : "$0.00";
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formatted = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount);

  const prefix = isNegative ? "-" : "";
  return includeCurrencyCode ? `${prefix}${formatted} MXN` : `${prefix}${formatted}`;
}

/**
 * Compact currency for charts or badges
 * @example formatCompactMXN(5420) -> "$5.4k"
 */
export function formatCompactMXN(amount: number): string {
  if (isNaN(amount)) return "$0";
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(1)}k`;
  }
  return `${sign}$${abs.toFixed(0)}`;
}

/**
 * Formats percentage
 * @example formatPercentage(75.4) -> "75.4%"
 */
export function formatPercentage(percentage: number): string {
  if (isNaN(percentage) || !isFinite(percentage)) return "0.0%";
  return `${percentage.toFixed(1)}%`;
}

/**
 * Calculates budget status semáforo
 * Verde: Gasto <= 80% del presupuesto
 * Ámbar: Gasto entre 81% y 100%
 * Rojo: Gasto > 100% (sobregiro)
 */
export function calculateBudgetStatus(planned: number, actual: number): BudgetStatus {
  if (planned <= 0) {
    return actual > 0 ? "overspent" : "healthy";
  }
  const ratio = actual / planned;
  if (ratio <= 0.8) {
    return "healthy";
  }
  if (ratio <= 1.0) {
    return "warning";
  }
  return "overspent";
}

/**
 * Returns month and year info from 'YYYY-MM'
 */
export function getPeriodInfo(periodKey: string) {
  const parts = periodKey.split("-");
  const year = parseInt(parts[0], 10) || 2026;
  const month = parseInt(parts[1], 10) || 10;
  const monthIndex = Math.max(0, Math.min(11, month - 1));

  const label = `${MONTH_NAMES_ES[monthIndex]} ${year}`;
  const shortLabel = `${MONTH_NAMES_SHORT_ES[monthIndex]} ${year}`;

  return {
    year,
    month,
    periodKey,
    label,
    shortLabel,
  };
}

/**
 * Navigate to next or previous period
 */
export function shiftPeriod(periodKey: string, delta: number): string {
  const { year, month } = getPeriodInfo(periodKey);
  let newMonth = month + delta;
  let newYear = year;

  while (newMonth > 12) {
    newMonth -= 12;
    newYear += 1;
  }
  while (newMonth < 1) {
    newMonth += 12;
    newYear -= 1;
  }

  const monthStr = newMonth.toString().padStart(2, "0");
  return `${newYear}-${monthStr}`;
}

/**
 * Format date string YYYY-MM-DD to human readable Spanish
 */
export function formatDateES(dateString: string): string {
  if (!dateString) return "";
  try {
    const [y, m, d] = dateString.split("-").map(Number);
    if (!y || !m || !d) return dateString;
    const monthShort = MONTH_NAMES_SHORT_ES[m - 1] || "";
    return `${d} ${monthShort} ${y}`;
  } catch {
    return dateString;
  }
}

/**
 * Get today's date formatted as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get current default period string 'YYYY-MM'
 */
export function getCurrentPeriodKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Get yesterday's date formatted as YYYY-MM-DD
 */
export function getYesterdayDateString(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format full human readable date in Spanish: e.g. "15 de Octubre 2026"
 */
export function formatFullDateES(dateString: string): string {
  if (!dateString) return "";
  try {
    const [y, m, d] = dateString.split("-").map(Number);
    if (!y || !m || !d) return dateString;
    const monthName = MONTH_NAMES_ES[m - 1] || "";
    return `${d} de ${monthName} ${y}`;
  } catch {
    return dateString;
  }
}


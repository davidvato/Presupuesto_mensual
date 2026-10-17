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
 * Get current default period string 'YYYY-MM'.
 * If cycleStartDay > 1, shifts back one period when today falls before the start day.
 * @example getCurrentPeriodKey(11) on Oct 5 → '2026-09' (cycle hasn't started yet)
 * @example getCurrentPeriodKey(11) on Oct 16 → '2026-10' (cycle started on Oct 11)
 */
export function getCurrentPeriodKey(cycleStartDay: number = 1): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-based
  const day = now.getDate();

  if (cycleStartDay <= 1) {
    return `${year}-${String(month).padStart(2, "0")}`;
  }

  // If today is before the cycle start day, the active period is the previous month
  if (day < cycleStartDay) {
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear -= 1;
    }
    return `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
  }

  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * Given a date string 'YYYY-MM-DD' and a cycle start day, returns the period key 'YYYY-MM'
 * that this date belongs to.
 * @example getPeriodForDate('2026-10-05', 11) → '2026-09' (before day 11, belongs to Sep cycle)
 * @example getPeriodForDate('2026-10-15', 11) → '2026-10' (on/after day 11, belongs to Oct cycle)
 * @example getPeriodForDate('2026-10-15', 1)  → '2026-10' (standard calendar month)
 */
export function getPeriodForDate(dateString: string, cycleStartDay: number = 1): string {
  if (!dateString) return getCurrentPeriodKey(cycleStartDay);
  try {
    const [y, m, d] = dateString.split("-").map(Number);
    if (!y || !m || !d) return getCurrentPeriodKey(cycleStartDay);

    if (cycleStartDay <= 1) {
      return `${y}-${String(m).padStart(2, "0")}`;
    }

    // If the day is before the cycle start, it belongs to the previous month's period
    if (d < cycleStartDay) {
      let prevMonth = m - 1;
      let prevYear = y;
      if (prevMonth < 1) {
        prevMonth = 12;
        prevYear -= 1;
      }
      return `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
    }

    return `${y}-${String(m).padStart(2, "0")}`;
  } catch {
    return getCurrentPeriodKey(cycleStartDay);
  }
}

/**
 * Returns the real start and end date strings of a cycle period.
 * @example getCycleRange('2026-10', 11) → { start: '2026-10-11', end: '2026-11-10' }
 * @example getCycleRange('2026-10', 1)  → { start: '2026-10-01', end: '2026-10-31' }
 */
export function getCycleRange(periodKey: string, cycleStartDay: number = 1): { start: string; end: string } {
  const { year, month } = getPeriodInfo(periodKey);

  if (cycleStartDay <= 1) {
    // Standard calendar month
    const lastDay = new Date(year, month, 0).getDate(); // day 0 of next month = last day of this month
    return {
      start: `${year}-${String(month).padStart(2, "0")}-01`,
      end: `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
    };
  }

  // Custom cycle: from cycleStartDay of this month to (cycleStartDay - 1) of next month
  const startDay = Math.min(cycleStartDay, 28); // cap at 28 to be safe
  const startStr = `${year}-${String(month).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`;

  let endMonth = month + 1;
  let endYear = year;
  if (endMonth > 12) {
    endMonth = 1;
    endYear += 1;
  }
  const endDay = startDay - 1; // e.g. if cycle starts on 11, it ends on the 10th of next month
  const endStr = `${endYear}-${String(endMonth).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;

  return { start: startStr, end: endStr };
}

/**
 * Returns a human-readable label for a cycle period.
 * @example getCycleLabel('2026-10', 11) → '11 Oct – 10 Nov 2026'
 * @example getCycleLabel('2026-10', 1)  → 'Octubre 2026'
 */
export function getCycleLabel(periodKey: string, cycleStartDay: number = 1): string {
  if (cycleStartDay <= 1) {
    return getPeriodInfo(periodKey).label;
  }
  const { start, end } = getCycleRange(periodKey, cycleStartDay);
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const startLabel = `${sd} ${MONTH_NAMES_SHORT_ES[sm - 1]}`;
  const endLabel = `${ed} ${MONTH_NAMES_SHORT_ES[em - 1]} ${ey}`;
  // If start and end are in the same year, omit start year
  const yearStr = sy !== ey ? ` ${sy}` : "";
  return `${startLabel}${yearStr} – ${endLabel}`;
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


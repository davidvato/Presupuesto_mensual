import { BudgetSummary, Transaction } from "@/types/budget";
import { getPeriodInfo } from "@/utils/formatters";

export function generateBudgetCsv(summary: BudgetSummary, transactions: Transaction[]): string {
  const { label } = getPeriodInfo(summary.period);
  const rows: string[] = [];

  // Title / Metadata
  rows.push(`"REPORTE DE PRESUPUESTO PERSONAL - ${label.toUpperCase()}"`);
  rows.push(`"Generado el:","${new Date().toLocaleString("es-MX")}"`);
  rows.push("");

  // Executive Summary
  rows.push(`"RESUMEN EJECUTIVO"`);
  rows.push(`"Total Planeado","Total Gastado Real","Remanente / Balance","% de Ejecución"`);
  rows.push(
    `"${summary.totalPlanned.toFixed(2)}","${summary.totalActual.toFixed(2)}","${summary.totalDifference.toFixed(2)}","${summary.totalPercentage.toFixed(1)}%"`
  );
  rows.push("");

  // Category Breakdown
  rows.push(`"DESGLOSE POR CATEGORÍA"`);
  rows.push(`"Categoría","Clasificador / Tipo","Planeado (MXN)","Actual (MXN)","Diferencia (MXN)","% Gastado","Estado / Semáforo"`);

  for (const item of summary.categorySummaries) {
    const statusLabel =
      item.status === "healthy"
        ? "Saludable (<=80%)"
        : item.status === "warning"
        ? "En Riesgo (81-100%)"
        : "Sobregiro (>100%)";

    rows.push(
      `"${item.category.name}","${item.category.typeLabel}","${item.planned.toFixed(2)}","${item.actual.toFixed(2)}","${item.difference.toFixed(2)}","${item.percentage.toFixed(1)}%","${statusLabel}"`
    );
  }
  rows.push("");

  // Transactions Section
  rows.push(`"DETALLE DE TRANSACCIONES / MOVIMIENTOS REGISTRADOS"`);
  rows.push(`"ID","Fecha","Concepto","Categoría","Monto (MXN)","Método de Pago"`);

  const categoryMap = new Map(summary.categorySummaries.map((c) => [c.category.id, c.category.name]));

  for (const tx of transactions) {
    const categoryName = categoryMap.get(tx.categoryId) || "Sin Categoría";
    rows.push(
      `"${tx.id}","${tx.date}","${(tx.concept || "").replace(/"/g, '""')}","${categoryName}","${tx.amount.toFixed(2)}","${tx.paymentMethod || "N/A"}"`
    );
  }

  return rows.join("\r\n");
}

export function downloadCsv(filename: string, csvContent: string): void {
  // Use UTF-8 BOM so Excel opens Spanish characters and accents properly
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

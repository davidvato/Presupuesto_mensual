import { NextResponse } from "next/server";
import { getSql, isDatabaseConfigured, ensureDatabaseInitialized } from "@/lib/db";
import { Transaction } from "@/types/budget";

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      isDatabaseConnected: false,
      message: "DATABASE_URL not configured. Using local storage fallback.",
    });
  }

  try {
    await ensureDatabaseInitialized();
    const sql = getSql();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "2026-10";

    // 1. Categories
    const categoriesRows = await sql`
      SELECT id, name, type, type_label as "typeLabel", icon_name as "iconName", color, order_num as "order", is_active as "isActive"
      FROM categories
      ORDER BY order_num ASC;
    `;

    // 2. Planned amounts for the period
    const plannedRows = await sql`
      SELECT category_id, amount
      FROM monthly_planned
      WHERE period = ${period};
    `;
    const plannedAmounts: Record<string, number> = {};
    for (const row of plannedRows) {
      plannedAmounts[row.category_id] = parseFloat(row.amount);
    }

    // 3. General info for the period
    const generalInfoRows = await sql`
      SELECT income, available_cash as "availableCash"
      FROM monthly_general_info
      WHERE period = ${period};
    `;
    const generalInfo = generalInfoRows.length > 0
      ? {
          income: parseFloat(generalInfoRows[0].income),
          availableCash: parseFloat(generalInfoRows[0].availableCash),
        }
      : { income: 13984, availableCash: 1282 };

    // 4. Transactions for the period
    const transactionsRows = await sql`
      SELECT id, period, type, category_id as "categoryId", amount, date, concept, payment_method as "paymentMethod", notes, created_at as "createdAt"
      FROM transactions
      WHERE period = ${period}
      ORDER BY date DESC, created_at DESC;
    `;
    const transactions: Transaction[] = transactionsRows.map((r) => ({
      id: r.id,
      period: r.period,
      type: r.type || "gasto",
      categoryId: r.categoryId,
      amount: parseFloat(r.amount),
      date: r.date,
      concept: r.concept,
      paymentMethod: r.paymentMethod || undefined,
      notes: r.notes || undefined,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    }));

    // 5. Available periods
    const periodsRows = await sql`
      SELECT DISTINCT period FROM (
        SELECT period FROM monthly_planned
        UNION
        SELECT period FROM transactions
        UNION
        SELECT '2026-10' as period
      ) p
      ORDER BY period ASC;
    `;
    const availablePeriods = periodsRows.map((p) => p.period);

    return NextResponse.json(
      {
        isDatabaseConnected: true,
        categories: categoriesRows,
        plannedAmounts,
        generalInfo,
        transactions,
        availablePeriods,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (err: any) {
    console.error("Error in GET /api/budget:", err);
    return NextResponse.json(
      { isDatabaseConnected: false, error: err.message },
      { status: 500 }
    );
  }
}

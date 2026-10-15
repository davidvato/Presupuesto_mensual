import { NextResponse } from "next/server";
import { getSql, isDatabaseConfigured } from "@/lib/db";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, message: "Database not configured" }, { status: 400 });
  }

  try {
    const sql = getSql();
    const { period, income, availableCash } = await request.json();

    if (!period) {
      return NextResponse.json({ success: false, message: "Missing period" }, { status: 400 });
    }

    const numIncome = parseFloat(income) || 0;
    const numCash = parseFloat(availableCash) || 0;

    await sql`
      INSERT INTO monthly_general_info (period, income, available_cash)
      VALUES (${period}, ${numIncome}, ${numCash})
      ON CONFLICT (period) DO UPDATE SET
        income = EXCLUDED.income,
        available_cash = EXCLUDED.available_cash;
    `;

    return NextResponse.json({ success: true, period, income: numIncome, availableCash: numCash });
  } catch (err: any) {
    console.error("Error updating general info in Neon:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

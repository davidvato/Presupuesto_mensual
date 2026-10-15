import { NextResponse } from "next/server";
import { getSql, isDatabaseConfigured } from "@/lib/db";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, message: "Database not configured" }, { status: 400 });
  }

  try {
    const sql = getSql();
    const { fromPeriod, toPeriod } = await request.json();

    if (!fromPeriod || !toPeriod) {
      return NextResponse.json({ success: false, message: "Missing periods" }, { status: 400 });
    }

    // 1. Copy planned amounts from fromPeriod to toPeriod
    const sourcePlanned = await sql`
      SELECT category_id, amount
      FROM monthly_planned
      WHERE period = ${fromPeriod};
    `;

    for (const item of sourcePlanned) {
      await sql`
        INSERT INTO monthly_planned (period, category_id, amount)
        VALUES (${toPeriod}, ${item.category_id}, ${item.amount})
        ON CONFLICT (period, category_id) DO UPDATE SET
          amount = EXCLUDED.amount;
      `;
    }

    // 2. Copy general info from fromPeriod to toPeriod
    const sourceInfo = await sql`
      SELECT income, available_cash
      FROM monthly_general_info
      WHERE period = ${fromPeriod};
    `;

    if (sourceInfo.length > 0) {
      await sql`
        INSERT INTO monthly_general_info (period, income, available_cash)
        VALUES (${toPeriod}, ${sourceInfo[0].income}, ${sourceInfo[0].available_cash})
        ON CONFLICT (period) DO UPDATE SET
          income = EXCLUDED.income,
          available_cash = EXCLUDED.available_cash;
      `;
    }

    return NextResponse.json({ success: true, toPeriod });
  } catch (err: any) {
    console.error("Error cloning budget in Neon:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

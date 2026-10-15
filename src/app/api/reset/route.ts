import { NextResponse } from "next/server";
import { getSql, isDatabaseConfigured } from "@/lib/db";
import {
  INITIAL_CATEGORIES,
  INITIAL_PLANNED_AMOUNTS,
  INITIAL_SAMPLE_TRANSACTIONS,
  INITIAL_GENERAL_INFO,
} from "@/data/initialData";

export async function POST() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, message: "Database not configured" }, { status: 400 });
  }

  try {
    const sql = getSql();

    // Clear existing data
    await sql`DELETE FROM transactions;`;
    await sql`DELETE FROM monthly_planned;`;
    await sql`DELETE FROM monthly_general_info;`;
    await sql`DELETE FROM categories;`;

    // Re-seed categories
    for (const cat of INITIAL_CATEGORIES) {
      await sql`
        INSERT INTO categories (id, name, type, type_label, icon_name, color, order_num, is_active)
        VALUES (${cat.id}, ${cat.name}, ${cat.type}, ${cat.typeLabel}, ${cat.iconName}, ${cat.color}, ${cat.order}, ${cat.isActive});
      `;
    }

    // Re-seed planned amounts for 2026-10
    for (const [catId, amount] of Object.entries(INITIAL_PLANNED_AMOUNTS)) {
      await sql`
        INSERT INTO monthly_planned (period, category_id, amount)
        VALUES ('2026-10', ${catId}, ${amount});
      `;
    }

    // Re-seed general info for 2026-10
    await sql`
      INSERT INTO monthly_general_info (period, income, available_cash)
      VALUES ('2026-10', ${INITIAL_GENERAL_INFO.income}, ${INITIAL_GENERAL_INFO.availableCash});
    `;

    // Re-seed sample transactions for 2026-10
    for (const tx of INITIAL_SAMPLE_TRANSACTIONS) {
      await sql`
        INSERT INTO transactions (id, period, type, category_id, amount, date, concept, payment_method, notes)
        VALUES (${tx.id}, ${tx.period}, ${tx.type || 'gasto'}, ${tx.categoryId}, ${tx.amount}, ${tx.date}, ${tx.concept}, ${tx.paymentMethod || null}, ${tx.notes || null});
      `;
    }

    return NextResponse.json({ success: true, message: "Reset to defaults completed" });
  } catch (err: any) {
    console.error("Error resetting data in Neon:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

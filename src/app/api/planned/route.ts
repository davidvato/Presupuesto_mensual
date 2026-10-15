import { NextResponse } from "next/server";
import { getSql, isDatabaseConfigured } from "@/lib/db";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, message: "Database not configured" }, { status: 400 });
  }

  try {
    const sql = getSql();
    const { period, categoryId, amount } = await request.json();

    if (!period || !categoryId) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const numericAmount = Math.max(0, parseFloat(amount) || 0);

    await sql`
      INSERT INTO monthly_planned (period, category_id, amount)
      VALUES (${period}, ${categoryId}, ${numericAmount})
      ON CONFLICT (period, category_id) DO UPDATE SET
        amount = EXCLUDED.amount;
    `;

    return NextResponse.json({ success: true, period, categoryId, amount: numericAmount });
  } catch (err: any) {
    console.error("Error updating planned amount in Neon:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

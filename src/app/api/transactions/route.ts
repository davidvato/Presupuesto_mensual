import { NextResponse } from "next/server";
import { getSql, isDatabaseConfigured } from "@/lib/db";
import { Transaction } from "@/types/budget";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, message: "Database not configured" }, { status: 400 });
  }

  try {
    const sql = getSql();
    const body = await request.json();

    const newTx: Transaction = {
      ...body,
      type: body.type || "gasto",
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    await sql`
      INSERT INTO transactions (id, period, type, category_id, amount, date, concept, payment_method, notes)
      VALUES (${newTx.id}, ${newTx.period}, ${newTx.type}, ${newTx.categoryId}, ${newTx.amount}, ${newTx.date}, ${newTx.concept}, ${newTx.paymentMethod || null}, ${newTx.notes || null});
    `;

    return NextResponse.json({ success: true, transaction: newTx });
  } catch (err: any) {
    console.error("Error creating transaction in Neon:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, message: "Database not configured" }, { status: 400 });
  }

  try {
    const sql = getSql();
    const tx: Transaction = await request.json();

    await sql`
      UPDATE transactions
      SET
        period = ${tx.period},
        type = ${tx.type || 'gasto'},
        category_id = ${tx.categoryId},
        amount = ${tx.amount},
        date = ${tx.date},
        concept = ${tx.concept},
        payment_method = ${tx.paymentMethod || null},
        notes = ${tx.notes || null}
      WHERE id = ${tx.id};
    `;

    return NextResponse.json({ success: true, transaction: tx });
  } catch (err: any) {
    console.error("Error updating transaction in Neon:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, message: "Database not configured" }, { status: 400 });
  }

  try {
    const sql = getSql();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "Missing id" }, { status: 400 });
    }

    await sql`DELETE FROM transactions WHERE id = ${id};`;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting transaction in Neon:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

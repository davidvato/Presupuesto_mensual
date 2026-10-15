import { NextResponse } from "next/server";
import { getSql, isDatabaseConfigured } from "@/lib/db";
import { Category } from "@/types/budget";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, message: "Database not configured" }, { status: 400 });
  }

  try {
    const sql = getSql();
    const category: Category = await request.json();

    await sql`
      INSERT INTO categories (id, name, type, type_label, icon_name, color, order_num, is_active)
      VALUES (${category.id}, ${category.name}, ${category.type}, ${category.typeLabel}, ${category.iconName}, ${category.color}, ${category.order}, ${category.isActive})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        type_label = EXCLUDED.type_label,
        icon_name = EXCLUDED.icon_name,
        color = EXCLUDED.color,
        order_num = EXCLUDED.order_num,
        is_active = EXCLUDED.is_active;
    `;

    return NextResponse.json({ success: true, category });
  } catch (err: any) {
    console.error("Error saving category in Neon:", err);
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

    await sql`DELETE FROM categories WHERE id = ${id};`;
    await sql`DELETE FROM monthly_planned WHERE category_id = ${id};`;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting category in Neon:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getSql, isDatabaseConfigured } from "@/lib/db";

const CYCLE_START_DAY_KEY = "cycle_start_day";
const DEFAULT_CYCLE_START_DAY = 1;

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ cycleStartDay: DEFAULT_CYCLE_START_DAY });
  }

  try {
    const sql = getSql();
    const rows = await sql`
      SELECT value FROM app_settings WHERE key = ${CYCLE_START_DAY_KEY};
    `;

    const cycleStartDay =
      rows.length > 0
        ? Math.max(1, Math.min(28, parseInt(rows[0].value, 10) || DEFAULT_CYCLE_START_DAY))
        : DEFAULT_CYCLE_START_DAY;

    return NextResponse.json({ cycleStartDay }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (err: any) {
    console.error("Error reading cycle_start_day:", err);
    return NextResponse.json({ cycleStartDay: DEFAULT_CYCLE_START_DAY });
  }
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, message: "Database not configured" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const raw = parseInt(body.cycleStartDay, 10);

    if (isNaN(raw) || raw < 1 || raw > 28) {
      return NextResponse.json(
        { success: false, message: "cycleStartDay must be an integer between 1 and 28" },
        { status: 400 }
      );
    }

    const sql = getSql();
    await sql`
      INSERT INTO app_settings (key, value)
      VALUES (${CYCLE_START_DAY_KEY}, ${String(raw)})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    `;

    return NextResponse.json({ success: true, cycleStartDay: raw });
  } catch (err: any) {
    console.error("Error saving cycle_start_day:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

import { neon, neonConfig } from "@neondatabase/serverless";
import {
  INITIAL_CATEGORIES,
  INITIAL_PLANNED_AMOUNTS,
  INITIAL_SAMPLE_TRANSACTIONS,
  INITIAL_GENERAL_INFO,
} from "@/data/initialData";

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

export function getSql() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL or POSTGRES_URL is not configured.");
  }
  return neon(url);
}

/**
 * Initializes tables in Neon PostgreSQL if they do not exist,
 * and seeds initial categories and October 2026 data.
 */
export async function ensureDatabaseInitialized() {
  if (!isDatabaseConfigured()) return;
  const sql = getSql();

  try {
    // 1. Create categories table
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        type_label VARCHAR(100) NOT NULL,
        icon_name VARCHAR(50) NOT NULL,
        color VARCHAR(20) NOT NULL DEFAULT '#6366f1',
        order_num BIGINT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true
      );
    `;

    // Ensure order_num column is BIGINT on existing databases
    try {
      await sql`ALTER TABLE categories ALTER COLUMN order_num TYPE BIGINT;`;
    } catch {
      // Column may already be BIGINT or up to date
    }

    // Ensure color column exists on existing databases
    try {
      await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS color VARCHAR(20) NOT NULL DEFAULT '#6366f1';`;
    } catch {
      // Column may already exist
    }

    // 2. Create monthly_planned table
    await sql`
      CREATE TABLE IF NOT EXISTS monthly_planned (
        period VARCHAR(7) NOT NULL,
        category_id VARCHAR(100) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
        PRIMARY KEY (period, category_id)
      );
    `;

    // 3. Create monthly_general_info table
    await sql`
      CREATE TABLE IF NOT EXISTS monthly_general_info (
        period VARCHAR(7) PRIMARY KEY,
        income NUMERIC(12, 2) NOT NULL DEFAULT 0,
        available_cash NUMERIC(12, 2) NOT NULL DEFAULT 0
      );
    `;

    // 4. Create transactions table
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(100) PRIMARY KEY,
        period VARCHAR(7) NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'gasto',
        category_id VARCHAR(100),
        amount NUMERIC(12, 2) NOT NULL,
        date VARCHAR(10) NOT NULL,
        concept VARCHAR(255) NOT NULL,
        payment_method VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // 5. Create app_settings table to track initialization lock
    await sql`
      CREATE TABLE IF NOT EXISTS app_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL
      );
    `;

    // Only seed once on initial brand new database setup
    const initRows = await sql`
      SELECT value FROM app_settings WHERE key = 'is_initialized';
    `;
    const isAlreadyInitialized = initRows.length > 0 && initRows[0].value === 'true';

    if (!isAlreadyInitialized) {
      // Seed categories
      for (const cat of INITIAL_CATEGORIES) {
        await sql`
          INSERT INTO categories (id, name, type, type_label, icon_name, color, order_num, is_active)
          VALUES (${cat.id}, ${cat.name}, ${cat.type}, ${cat.typeLabel}, ${cat.iconName}, ${cat.color}, ${cat.order}, ${cat.isActive})
          ON CONFLICT (id) DO NOTHING;
        `;
      }

      // Seed planned amounts for 2026-10
      for (const [catId, amount] of Object.entries(INITIAL_PLANNED_AMOUNTS)) {
        await sql`
          INSERT INTO monthly_planned (period, category_id, amount)
          VALUES ('2026-10', ${catId}, ${amount})
          ON CONFLICT (period, category_id) DO NOTHING;
        `;
      }

      // Seed general info for 2026-10
      await sql`
        INSERT INTO monthly_general_info (period, income, available_cash)
        VALUES ('2026-10', ${INITIAL_GENERAL_INFO.income}, ${INITIAL_GENERAL_INFO.availableCash})
        ON CONFLICT (period) DO NOTHING;
      `;

      // Seed sample transactions for 2026-10
      for (const tx of INITIAL_SAMPLE_TRANSACTIONS) {
        await sql`
          INSERT INTO transactions (id, period, type, category_id, amount, date, concept, payment_method, notes)
          VALUES (${tx.id}, ${tx.period}, ${tx.type || 'gasto'}, ${tx.categoryId}, ${tx.amount}, ${tx.date}, ${tx.concept}, ${tx.paymentMethod || null}, ${tx.notes || null})
          ON CONFLICT (id) DO NOTHING;
        `;
      }

      // Mark initialized permanently so user deletes are respected
      await sql`
        INSERT INTO app_settings (key, value)
        VALUES ('is_initialized', 'true')
        ON CONFLICT (key) DO UPDATE SET value = 'true';
      `;
    }
  } catch (err) {
    console.error("Error initializing Neon database tables:", err);
  }
}

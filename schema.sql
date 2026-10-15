-- Schema para PostgreSQL / Neon Database
-- Proyecto: Finanzas Pro MXN - Presupuesto Mensual Personal

-- 1. Tabla de Categorías de Presupuesto
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  type_label VARCHAR(100) NOT NULL,
  icon_name VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL,
  order_num INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- 2. Tabla de Metas Planeadas por Periodo y Categoría
CREATE TABLE IF NOT EXISTS monthly_planned (
  period VARCHAR(7) NOT NULL, -- Formato: 'YYYY-MM'
  category_id VARCHAR(100) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  PRIMARY KEY (period, category_id)
);

-- 3. Tabla de Información General por Periodo (Flujo de Efectivo)
CREATE TABLE IF NOT EXISTS monthly_general_info (
  period VARCHAR(7) PRIMARY KEY, -- Formato: 'YYYY-MM'
  income NUMERIC(12, 2) NOT NULL DEFAULT 0,
  available_cash NUMERIC(12, 2) NOT NULL DEFAULT 0
);

-- 4. Tabla de Movimientos / Transacciones (Gastos e Ingresos)
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(100) PRIMARY KEY,
  period VARCHAR(7) NOT NULL, -- Formato: 'YYYY-MM'
  type VARCHAR(20) NOT NULL DEFAULT 'gasto', -- 'gasto' | 'ingreso'
  category_id VARCHAR(100) REFERENCES categories(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  date VARCHAR(10) NOT NULL, -- Formato: 'YYYY-MM-DD'
  concept VARCHAR(255) NOT NULL,
  payment_method VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_transactions_period ON transactions(period);
CREATE INDEX IF NOT EXISTS idx_monthly_planned_period ON monthly_planned(period);

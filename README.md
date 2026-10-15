# Finanzas Pro MXN - Control de Presupuesto Mensual Personal

Aplicación web moderna, responsiva y orientada a dispositivos móviles para la gestión y seguimiento del presupuesto mensual personal en Pesos Mexicanos (MXN). Permite planificar, registrar gastos y comparar en tiempo real el gasto presupuestado frente al gasto real de cada mes, calculando automáticamente diferencias y remanentes.

![Preview](https://raw.githubusercontent.com/davidvato/Presupuesto_mensual/main/public/preview.png)

---

## Características Principales

- **Selector de Periodo y Resumen Ejecutivo:**
  - Navegación mensual (Mes anterior, siguiente y salto al mes actual).
  - 3 Tarjetas KPI: **Total Planeado**, **Total Gastado / Real** (con barra de progreso) y **Remanente / Balance** (con semáforo de superávit o sobregiro).
- **Visualización Gráfica Interactiva (Recharts):**
  - Gráfico de barras comparativas: **Planeado vs. Real por Categoría**.
  - Gráfico Donut de **Distribución por Clasificador** (Vivienda, Servicios, Ahorro, Inversión, Transporte, etc.).
- **Tabla y Tarjetas de Categorías:**
  - Vista en tabla para desktop y tarjetas compactas optimizadas para smartphones.
  - Edición *inline* en tiempo real de montos planeados.
  - Semáforos visuales de ejecución: Verde ($\le 80\%$), Ámbar ($81\% - 100\%$) y Rojo ($> 100\%$).
- **Registro Rápido de Gastos (Mobile-First):**
  - Botón flotante accesible con una sola mano en pantallas móviles (FAB).
  - Modal con teclado numérico (`inputMode="decimal"`), chips de montos rápidos ($100, $250, $500, $1,000, $2,500), selección de categoría y métodos de pago.
- **Historial de Movimientos:**
  - Listado detallado con búsqueda por concepto, filtro por categoría y ordenamiento cronológico o por monto.
  - Edición y eliminación con diálogo de confirmación in-app y recálculo instantáneo.
- **Herramientas del Mes:**
  - **Clonar presupuesto al siguiente mes:** Duplica las metas planeadas comenzando el nuevo mes con $0.00 en gastos reales.
  - **Exportar a CSV:** Respaldo completo compatible con Microsoft Excel (UTF-8 BOM).
  - **Reinicio a valores por defecto:** Restauración segura de datos demo.
- **Arquitectura Desacoplada:**
  - Patrón repositorio (`IBudgetService`) con persistencia local inicial y preparación plug & play para PostgreSQL / Supabase.

---

## Tecnologías Utilizadas

- **Frontend / Framework:** [Next.js](https://nextjs.org) (App Router) + [React](https://react.dev) 19 + [TypeScript](https://www.typescriptlang.org)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com) v4 con paleta FinTech Dark
- **Iconos:** [Lucide React](https://lucide.dev)
- **Gráficos:** [Recharts](https://recharts.org)

---

## Instalación y Ejecución Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/davidvato/Presupuesto_mensual.git
   cd Presupuesto_mensual
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Abre en tu navegador [http://localhost:3000](http://localhost:3000).

---

## Estructura del Proyecto

```
src/
├── app/                  # Next.js App Router (layout, page, estilos globales)
├── components/           # Componentes modulares
│   ├── ui/               # Componentes base (CategoryIcon, ProgressBar, StatusBadge, ConfirmDialog)
│   ├── BudgetCharts.tsx  # Gráficos Recharts
│   ├── CategoryList.tsx  # Tabla y tarjetas de categorías
│   ├── CategoryModal.tsx # Configuración y alta de categorías
│   ├── CloneMonthModal.tsx # Herramienta de clonado mensual
│   ├── Header.tsx        # Navegación y herramientas
│   ├── KpiCards.tsx      # Tarjetas ejecutivas KPI
│   ├── TransactionHistory.tsx # Historial de movimientos
│   └── TransactionModal.tsx   # Modal de registro rápido y FAB
├── context/              # BudgetContext (estado global y cálculos reactivos)
├── data/                 # Categorías y transacciones base
├── services/             # Capa desacoplada (budgetService, csvExport)
├── types/                # Modelos y contratos TypeScript
└── utils/                # Formato de moneda MXN, fechas y utilidades de estilos
```

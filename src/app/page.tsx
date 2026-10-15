"use client";

import React, { useState, useRef } from "react";
import { BudgetProvider, useBudget } from "@/context/BudgetContext";
import { Header } from "@/components/Header";
import { GeneralInfoPanel } from "@/components/GeneralInfoPanel";
import { KpiCards } from "@/components/KpiCards";
import { BudgetCharts } from "@/components/BudgetCharts";
import { CategoryList } from "@/components/CategoryList";
import { TransactionHistory } from "@/components/TransactionHistory";
import {
  TransactionModal,
  FloatingActionButton,
} from "@/components/TransactionModal";
import { CategoryModal } from "@/components/CategoryModal";
import { CloneMonthModal } from "@/components/CloneMonthModal";
import { ShieldCheck, Sparkles } from "lucide-react";

function DashboardContent() {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | undefined>(undefined);
  const transactionsSectionRef = useRef<HTMLDivElement>(null);
  const { isLoading, isDatabaseActive } = useBudget();

  const handleSelectCategoryFilter = (categoryId: string) => {
    setSelectedCategoryFilter(categoryId);
    // Smooth scroll to transactions section
    transactionsSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleClearCategoryFilter = () => {
    setSelectedCategoryFilter(undefined);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-spin text-emerald-400 mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-zinc-300">
          Cargando panel de finanzas...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      {/* Top Header & Navigation */}
      <Header />

      {/* Main Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6 sm:space-y-7">
        {/* Module 1: Top Dashboard - Información General del Mes */}
        <section aria-label="Información General del Mes">
          <GeneralInfoPanel />
        </section>

        {/* Executive KPI Cards */}
        <section aria-label="Métricas Principales">
          <KpiCards />
        </section>

        {/* Charts Section: Planned vs Real & Distribution */}
        <section aria-label="Visualización Gráfica">
          <BudgetCharts />
        </section>

        {/* Category Budget Table / Mobile Cards */}
        <section aria-label="Presupuesto por Categoría">
          <CategoryList onSelectCategoryFilter={handleSelectCategoryFilter} />
        </section>

        {/* Transaction History & Management */}
        <section ref={transactionsSectionRef} aria-label="Historial de Movimientos">
          <TransactionHistory
            categoryFilter={selectedCategoryFilter}
            onClearCategoryFilter={handleClearCategoryFilter}
          />
        </section>

        {/* Informative Footer & Financial Health Badge */}
        <footer className="pt-6 pb-16 md:pb-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {isDatabaseActive
                ? "Conectado a Neon PostgreSQL Serverless • Sincronización en la nube activa"
                : "Almacenamiento Local • Agrega la variable DATABASE_URL en Vercel para conectar Neon"}
            </span>
          </div>
          <div>
            <span>Finanzas Pro MX • Moneda base: Peso Mexicano (MXN)</span>
          </div>
        </footer>
      </main>

      {/* Modals & Triggers */}
      <TransactionModal />
      <FloatingActionButton />
      <CategoryModal />
      <CloneMonthModal />
    </div>
  );
}

export default function Home() {
  return (
    <BudgetProvider>
      <DashboardContent />
    </BudgetProvider>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useBudget } from "@/context/BudgetContext";
import { formatMXN, formatCompactMXN } from "@/utils/formatters";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart3, PieChart as PieIcon } from "lucide-react";

export function BudgetCharts() {
  const { summary, typeGroups } = useBudget();
  const [activeTab, setActiveTab] = useState<"bars" | "donut">("bars");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-80 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 animate-pulse flex items-center justify-center">
        <span className="text-sm text-zinc-500">Cargando visualizaciones financieras...</span>
      </div>
    );
  }

  // Data for Category Bar Comparison
  const barData = summary.categorySummaries.map((item) => ({
    name: item.category.name.length > 15 ? `${item.category.name.slice(0, 14)}…` : item.category.name,
    fullName: item.category.name,
    Planeado: item.planned,
    Actual: item.actual,
    Diferencia: item.difference,
    color: item.category.color,
  }));

  // Data for Classifier Donut Chart
  const donutData = typeGroups
    .filter((g) => g.planned > 0 || g.actual > 0)
    .map((g) => ({
      name: g.label,
      value: g.actual > 0 ? g.actual : g.planned,
      actual: g.actual,
      planned: g.planned,
      color: g.color || "#10b981",
    }));

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900/95 border border-zinc-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[200px]">
          <p className="font-semibold text-white border-b border-zinc-800 pb-1">
            {data.fullName}
          </p>
          <div className="flex justify-between items-center text-zinc-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
              Planeado:
            </span>
            <span className="font-mono font-medium text-white">{formatMXN(data.Planeado)}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
              Real (Actual):
            </span>
            <span className="font-mono font-medium text-emerald-400">{formatMXN(data.Actual)}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-400 border-t border-zinc-800 pt-1">
            <span>Diferencia:</span>
            <span
              className={`font-mono font-semibold ${
                data.Diferencia >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {data.Diferencia >= 0 ? "+" : ""}
              {formatMXN(data.Diferencia)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomDonutTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-zinc-900/95 border border-zinc-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1">
          <p className="font-semibold text-white" style={{ color: item.color }}>
            {item.name}
          </p>
          <div className="flex justify-between gap-4 text-zinc-300">
            <span>Gastado Real:</span>
            <span className="font-mono font-medium text-white">{formatMXN(item.actual)}</span>
          </div>
          <div className="flex justify-between gap-4 text-zinc-400">
            <span>Presupuestado:</span>
            <span className="font-mono">{formatMXN(item.planned)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-5 backdrop-blur-md shadow-xl">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Análisis Comparativo del Mes</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Visualización interactiva de metas presupuestadas vs. gastos devengados
          </p>
        </div>

        <div className="flex items-center bg-zinc-950/80 border border-zinc-800 rounded-xl p-1 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("bars")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "bars"
                ? "bg-zinc-800 text-white shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Planeado vs. Real</span>
          </button>

          <button
            onClick={() => setActiveTab("donut")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "donut"
                ? "bg-zinc-800 text-white shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Distribución por Tipo</span>
          </button>
        </div>
      </div>

      {/* Charts Content */}
      <div className="w-full h-72 sm:h-80">
        {activeTab === "bars" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
              barGap={4}
            >
              <XAxis
                dataKey="name"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
              />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCompactMXN(value)}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
              />
              <Bar
                name="Planeado"
                dataKey="Planeado"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                name="Real (Actual)"
                dataKey="Actual"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="w-full md:w-1/2 h-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomDonutTooltip />} />
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Type Breakdown Legend Table */}
            <div className="w-full md:w-1/2 flex flex-col gap-2 max-h-64 overflow-y-auto pr-2">
              {typeGroups.map((group) => {
                const percent =
                  summary.totalActual > 0
                    ? ((group.actual / summary.totalActual) * 100).toFixed(0)
                    : "0";
                return (
                  <div
                    key={group.type}
                    className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/40 border border-zinc-800/60 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="font-medium text-zinc-200">{group.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-white">
                        {formatMXN(group.actual)}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono w-10 text-right">
                        {percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

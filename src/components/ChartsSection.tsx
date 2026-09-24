import React, { useState } from 'react';
import { PieChart, BarChart3, TrendingDown, Info } from 'lucide-react';
import { Transaction, CustomCategory } from '../types';
import {
  formatCurrency,
  CATEGORY_COLORS,
  getDaysInMonth,
  getCategoryColor,
} from '../utils/formatters';

interface ChartsSectionProps {
  transactions: Transaction[];
  selectedMonth: string; // YYYY-MM
  customCategories?: CustomCategory[];
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  transactions,
  selectedMonth,
  customCategories,
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'daily'>('categories');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const monthExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.date.startsWith(selectedMonth)
  );

  const totalExpense = monthExpenses.reduce((sum, t) => sum + t.amount, 0);

  // Group by category
  const categoryTotals: Record<string, number> = {};
  monthExpenses.forEach((t) => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const categoryEntries = Object.entries(categoryTotals)
    .map(([cat, val]) => ({
      category: cat,
      amount: val,
      percent: totalExpense > 0 ? (val / totalExpense) * 100 : 0,
      color: getCategoryColor(cat, customCategories),
    }))
    .sort((a, b) => b.amount - a.amount);

  // Group by day of the month
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const daysInMonth = getDaysInMonth(year, month);

  const dailyExpenses: { day: number; amount: number }[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const dayStr = String(i).padStart(2, '0');
    const datePattern = `${selectedMonth}-${dayStr}`;
    const dayTotal = monthExpenses
      .filter((t) => t.date === datePattern)
      .reduce((sum, t) => sum + t.amount, 0);
    dailyExpenses.push({ day: i, amount: dayTotal });
  }

  const maxDailyExpense = Math.max(1, ...dailyExpenses.map((d) => d.amount));

  // Donut chart calculations
  let accumulatedAngle = 0;
  const donutSlices = categoryEntries.map((item) => {
    const angle = (item.percent / 100) * 360;
    const startAngle = accumulatedAngle;
    accumulatedAngle += angle;
    return {
      ...item,
      startAngle,
      angle,
    };
  });

  // SVG Helper for Donut slice path
  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
      {/* Header & Chart Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-rose-400" />
          <h2 className="text-sm font-bold text-slate-100">Gráficos de Gastos</h2>
        </div>

        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'categories'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            Categorias
          </button>

          <button
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'daily'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Por Dia
          </button>
        </div>
      </div>

      {totalExpense === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs">
          <Info className="w-6 h-6 mx-auto mb-2 text-slate-500" />
          Nenhum gasto registrado neste mês ainda.
        </div>
      ) : activeTab === 'categories' ? (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Donut Visual */}
          <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {donutSlices.map((slice) => {
                const strokeDasharray = `${(slice.percent * 251.2) / 100} 251.2`;
                const strokeDashoffset = -((slice.startAngle / 360) * 251.2);
                const isHovered = hoveredCategory === slice.category;

                return (
                  <circle
                    key={slice.category}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={isHovered ? '16' : '12'}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredCategory(slice.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() =>
                      setHoveredCategory(
                        hoveredCategory === slice.category ? null : slice.category
                      )
                    }
                  />
                );
              })}
            </svg>

            {/* Inner Center Info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Total
              </span>
              <span className="text-xs font-extrabold text-white leading-tight">
                {formatCurrency(totalExpense)}
              </span>
              {hoveredCategory && (
                <span className="text-[10px] text-emerald-400 font-semibold truncate max-w-[80px]">
                  {hoveredCategory}
                </span>
              )}
            </div>
          </div>

          {/* Categories Legend List */}
          <div className="w-full space-y-2 flex-1">
            {categoryEntries.slice(0, 5).map((item) => (
              <div
                key={item.category}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  hoveredCategory === item.category
                    ? 'bg-slate-700/80'
                    : 'bg-slate-900/50 hover:bg-slate-700/40'
                }`}
                onMouseEnter={() => setHoveredCategory(item.category)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-slate-200 truncate">
                      {item.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-slate-300 font-bold">
                    <span>{formatCurrency(item.amount)}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({item.percent.toFixed(0)}%)
                    </span>
                  </div>
                </div>
                {/* Thin progress bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${item.percent}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Daily Bar Chart */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Distribuição de gastos por dia do mês</span>
            <span>Máximo: {formatCurrency(maxDailyExpense)}</span>
          </div>

          <div className="h-32 flex items-end gap-1 pt-4 pb-1 overflow-x-auto">
            {dailyExpenses.map((d) => {
              const heightPercent =
                d.amount > 0 ? Math.max(8, (d.amount / maxDailyExpense) * 100) : 0;
              const hasExpense = d.amount > 0;

              return (
                <div
                  key={d.day}
                  className="flex-1 min-w-[10px] flex flex-col items-center group relative cursor-pointer"
                  title={`Dia ${d.day}: ${formatCurrency(d.amount)}`}
                >
                  {/* Tooltip on hover */}
                  {hasExpense && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-[9px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                      {formatCurrency(d.amount)}
                    </div>
                  )}

                  <div
                    className={`w-full rounded-t transition-all ${
                      hasExpense
                        ? 'bg-rose-500/80 group-hover:bg-rose-400'
                        : 'bg-slate-700/30'
                    }`}
                    style={{
                      height: hasExpense ? `${heightPercent}%` : '4px',
                    }}
                  />

                  {/* Day label on selective ticks */}
                  {(d.day === 1 ||
                    d.day === 5 ||
                    d.day === 10 ||
                    d.day === 15 ||
                    d.day === 20 ||
                    d.day === 25 ||
                    d.day === daysInMonth) && (
                    <span className="text-[9px] text-slate-400 mt-1 font-mono">
                      {d.day}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

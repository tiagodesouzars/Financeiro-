import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  Target,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Info,
  Sliders,
  DollarSign,
  ChevronRight,
  Layers,
  Activity,
} from 'lucide-react';
import {
  FinancialStats,
  UserFinancialProfile,
  Transaction,
  CustomCategory,
} from '../types';
import {
  formatCurrency,
  getDaysInMonth,
  getCurrentMonthKey,
  formatMonthYearPT,
} from '../utils/formatters';

interface BudgetVsActualChartProps {
  stats: FinancialStats;
  profile: UserFinancialProfile;
  transactions: Transaction[];
  selectedMonth: string; // YYYY-MM
  customCategories?: CustomCategory[];
  onOpenSalaryConfig?: () => void;
  onOpenQuickAdd?: () => void;
}

export const BudgetVsActualChart: React.FC<BudgetVsActualChartProps> = ({
  stats,
  profile,
  transactions,
  selectedMonth,
  customCategories,
  onOpenSalaryConfig,
  onOpenQuickAdd,
}) => {
  const [activeView, setActiveView] = useState<'bars' | 'categories' | 'pace'>('bars');

  // Total Income / Budget Baseline
  const totalIncome = stats.totalIncome > 0 ? stats.totalIncome : profile.fixedSalary || 0;

  // Target savings based on profile rules
  const savingsPercent =
    profile.savingsRule === 'growth_30'
      ? 30
      : profile.savingsRule === 'balanced_20'
      ? 20
      : profile.savingsRule === 'conservative_10'
      ? 10
      : profile.customSavingsPercent || 20;

  const targetSavings =
    stats.projectedSavings > 0
      ? stats.projectedSavings
      : (totalIncome * savingsPercent) / 100;

  // Spending Limit (Teto Orçamentário Definido)
  // O teto de despesas é o que pode ser gasto sem comprometer a meta de economia
  const definedBudgetLimit = Math.max(0, totalIncome - targetSavings) || totalIncome;

  // Actual Expenses consumed (transactions + bills)
  const actualExpenses = stats.totalExpenses;

  // Balance remaining
  const remainingBudget = definedBudgetLimit - actualExpenses;

  // Consumption percentage
  const consumptionRatio =
    definedBudgetLimit > 0
      ? Math.round((actualExpenses / definedBudgetLimit) * 100)
      : actualExpenses > 0
      ? 100
      : 0;

  const isOverBudget = actualExpenses > definedBudgetLimit;
  const isNearLimit = !isOverBudget && consumptionRatio >= 85;

  // Days calculations for pace
  const currentMonthKey = getCurrentMonthKey();
  const isCurrentMonth = selectedMonth === currentMonthKey;
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  const daysInMonth = getDaysInMonth(year, monthIndex);

  const todayDate = new Date();
  const currentDay = isCurrentMonth ? todayDate.getDate() : daysInMonth;
  const daysRemaining = isCurrentMonth
    ? Math.max(1, daysInMonth - currentDay + 1)
    : 1;

  // Safe daily allowance to stay within budget
  const safeDailyAllowance =
    remainingBudget > 0 ? remainingBudget / daysRemaining : 0;
  const actualDailyAvg =
    actualExpenses > 0 ? actualExpenses / Math.max(1, currentDay) : 0;

  // 1. Data for Side-by-Side Comparison
  const mainBarData = useMemo(() => {
    return [
      {
        name: 'Teto Definido',
        valor: definedBudgetLimit,
        metaEconomia: targetSavings,
        tipo: 'Planejado',
        color: '#38bdf8',
      },
      {
        name: 'Gasto Real',
        valor: actualExpenses,
        metaEconomia: Math.max(0, stats.availableBudget),
        tipo: 'Consumido',
        color: isOverBudget ? '#f43f5e' : isNearLimit ? '#fbbf24' : '#10b981',
      },
    ];
  }, [definedBudgetLimit, actualExpenses, targetSavings, stats.availableBudget, isOverBudget, isNearLimit]);

  // Breakdown Data (Fixas vs Variáveis vs Poupança)
  const breakdownData = useMemo(() => {
    const plannedFixed = stats.fixedBillsTotal;
    const plannedVariable = Math.max(0, definedBudgetLimit - stats.fixedBillsTotal);

    return [
      {
        categoria: 'Contas Fixas',
        Orçado: plannedFixed,
        Real: stats.fixedBillsTotal,
      },
      {
        categoria: 'Despesas Diárias',
        Orçado: plannedVariable,
        Real: stats.variableExpensesTotal,
      },
      {
        categoria: 'Meta Economia',
        Orçado: targetSavings,
        Real: Math.max(0, stats.availableBudget),
      },
    ];
  }, [stats.fixedBillsTotal, stats.variableExpensesTotal, stats.availableBudget, definedBudgetLimit, targetSavings]);

  // 2. Category Level Comparison
  const categoryComparisonData = useMemo(() => {
    const monthExpenses = transactions.filter(
      (t) => t.type === 'expense' && t.date.startsWith(selectedMonth)
    );

    const map: Record<string, number> = {};
    monthExpenses.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });

    // Default proportional weights based on popular budget guidelines
    const weights: Record<string, number> = {
      Alimentação: 0.25,
      Moradia: 0.30,
      Transporte: 0.12,
      Lazer: 0.10,
      Saúde: 0.08,
      Educação: 0.08,
      Outros: 0.07,
    };

    const categoriesList = Object.keys(map).length > 0
      ? Object.keys(map)
      : ['Alimentação', 'Moradia', 'Transporte', 'Lazer'];

    return categoriesList
      .map((cat) => {
        const spent = map[cat] || 0;
        const weight = weights[cat] || 0.10;
        const budgetCat = Math.round(definedBudgetLimit * weight);
        return {
          categoria: cat,
          GastoReal: spent,
          TetoSugerido: budgetCat,
          percent: budgetCat > 0 ? Math.round((spent / budgetCat) * 100) : 0,
        };
      })
      .sort((a, b) => b.GastoReal - a.GastoReal)
      .slice(0, 5);
  }, [transactions, selectedMonth, definedBudgetLimit]);

  // 3. Daily Pace Data (Ritmo diário de gastos acumulados)
  const paceData = useMemo(() => {
    const monthExpenses = transactions.filter(
      (t) => t.type === 'expense' && t.date.startsWith(selectedMonth)
    );

    let runningActual = 0;
    const data = [];

    const dailyBudgetStep = definedBudgetLimit / daysInMonth;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const dateKey = `${selectedMonth}-${dayStr}`;

      const dayExpenses = monthExpenses
        .filter((t) => t.date === dateKey)
        .reduce((sum, t) => sum + t.amount, 0);

      if (!isCurrentMonth || day <= currentDay) {
        runningActual += dayExpenses;
      }

      data.push({
        dia: `Dia ${day}`,
        diaNum: day,
        TetoLinear: Math.round(dailyBudgetStep * day),
        GastoRealAcumulado:
          !isCurrentMonth || day <= currentDay ? runningActual : null,
      });
    }

    return data;
  }, [transactions, selectedMonth, definedBudgetLimit, daysInMonth, isCurrentMonth, currentDay]);

  // Custom Tooltip for Recharts
  const CustomRechartsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs space-y-1.5 z-50">
          <p className="font-bold text-slate-200 border-b border-slate-800 pb-1">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div
              key={`item-${index}`}
              className="flex items-center justify-between gap-4"
            >
              <span className="flex items-center gap-1.5 text-slate-300">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-white">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
      {/* Background soft glow */}
      <div
        className={`absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-20 ${
          isOverBudget
            ? 'bg-rose-500'
            : isNearLimit
            ? 'bg-amber-500'
            : 'bg-emerald-500'
        }`}
      />

      {/* Header with Title & Quick Switchers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm ${
              isOverBudget
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : isNearLimit
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
            }`}
          >
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100">
                Orçamento vs. Gasto Real
              </h2>
              {/* Dynamic Status Badge */}
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  isOverBudget
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : isNearLimit
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {isOverBudget ? (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    Estourado (+{formatCurrency(Math.abs(remainingBudget))})
                  </>
                ) : isNearLimit ? (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    {consumptionRatio}% Usado
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    No Controle ({consumptionRatio}%)
                  </>
                )}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Controle imediato para {formatMonthYearPT(selectedMonth)}
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveView('bars')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeView === 'bars'
                ? 'bg-slate-800 text-slate-100 border border-slate-600 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Comparação geral entre teto orçado e gasto real"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Geral</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('categories')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeView === 'categories'
                ? 'bg-slate-800 text-slate-100 border border-slate-600 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Comparação por principais categorias"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Categorias</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('pace')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeView === 'pace'
                ? 'bg-slate-800 text-slate-100 border border-slate-600 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Ritmo diário de gastos no mês"
          >
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>Ritmo</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {/* Defined Limit */}
        <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-700/60">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
            <span>Teto Orçado</span>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          </div>
          <p className="text-xs font-extrabold text-white truncate">
            {formatCurrency(definedBudgetLimit)}
          </p>
          <span className="text-[9px] text-slate-400 truncate block">
            Salário - Poupança ({savingsPercent}%)
          </span>
        </div>

        {/* Real Consumed */}
        <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-700/60">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
            <span>Gasto Real</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOverBudget
                  ? 'bg-rose-500'
                  : isNearLimit
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
            />
          </div>
          <p
            className={`text-xs font-extrabold truncate ${
              isOverBudget
                ? 'text-rose-400'
                : isNearLimit
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {formatCurrency(actualExpenses)}
          </p>
          <span className="text-[9px] text-slate-400 truncate block">
            {consumptionRatio}% consumido
          </span>
        </div>

        {/* Remaining / Allowance */}
        <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-700/60">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
            <span>Disponível</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          </div>
          <p
            className={`text-xs font-extrabold truncate ${
              remainingBudget < 0 ? 'text-rose-400' : 'text-slate-100'
            }`}
          >
            {formatCurrency(remainingBudget)}
          </p>
          <span className="text-[9px] text-slate-400 truncate block">
            {isCurrentMonth ? `${formatCurrency(safeDailyAllowance)}/dia seguro` : 'Total final'}
          </span>
        </div>
      </div>

      {/* RECHARTS VISUALIZATION AREA */}
      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 mb-3">
        {activeView === 'bars' && (
          <div className="space-y-3">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={breakdownData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  barGap={6}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis
                    dataKey="categoria"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: '#475569' }}
                  />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    axisLine={{ stroke: '#475569' }}
                    tickFormatter={(val) => `R$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip content={<CustomRechartsTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: 8, fontSize: '11px', color: '#cbd5e1' }}
                  />
                  <Bar
                    dataKey="Orçado"
                    name="Teto / Orçado"
                    fill="#38bdf8"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={38}
                  />
                  <Bar
                    dataKey="Real"
                    name="Gasto Real"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={38}
                  >
                    {breakdownData.map((entry, index) => {
                      const isExceeded = entry.Real > entry.Orçado;
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={isExceeded ? '#f43f5e' : index === 2 ? '#6366f1' : '#10b981'}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                Orçado: {formatCurrency(definedBudgetLimit)}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Gasto: {formatCurrency(actualExpenses)}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                Meta Poupança: {formatCurrency(targetSavings)}
              </span>
            </div>
          </div>
        )}

        {activeView === 'categories' && (
          <div className="space-y-2">
            <p className="text-[11px] text-slate-400 mb-2">
              Comparativo nas principais categorias de despesas:
            </p>
            {categoryComparisonData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Nenhuma despesa categorizada neste mês ainda.
              </p>
            ) : (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryComparisonData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 35, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis
                      type="number"
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickFormatter={(val) => `R$${val}`}
                    />
                    <YAxis
                      dataKey="categoria"
                      type="category"
                      tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 600 }}
                      width={80}
                    />
                    <Tooltip content={<CustomRechartsTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }}
                    />
                    <Bar
                      dataKey="TetoSugerido"
                      name="Teto Sugerido"
                      fill="#38bdf8"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={16}
                    />
                    <Bar
                      dataKey="GastoReal"
                      name="Gasto Real"
                      fill="#10b981"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={16}
                    >
                      {categoryComparisonData.map((entry, idx) => (
                        <Cell
                          key={`cat-cell-${idx}`}
                          fill={entry.GastoReal > entry.TetoSugerido ? '#f43f5e' : '#10b981'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {activeView === 'pace' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Ritmo acumulado (Teto linear vs. Gastos reais)</span>
              {isCurrentMonth && (
                <span className="font-semibold text-purple-300">
                  Dia atual: {currentDay}/{daysInMonth}
                </span>
              )}
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={paceData}
                  margin={{ top: 5, right: 10, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={isOverBudget ? '#f43f5e' : '#10b981'}
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor={isOverBudget ? '#f43f5e' : '#10b981'}
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient id="colorTeto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis
                    dataKey="diaNum"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={(d) => `${d}`}
                  />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={(val) => `R$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip content={<CustomRechartsTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }} />
                  {isCurrentMonth && (
                    <ReferenceLine
                      x={currentDay}
                      stroke="#a855f7"
                      strokeDasharray="3 3"
                      label={{
                        value: 'Hoje',
                        fill: '#c084fc',
                        fontSize: 10,
                        position: 'top',
                      }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="TetoLinear"
                    name="Teto Linear Ideal"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTeto)"
                  />
                  <Area
                    type="monotone"
                    dataKey="GastoRealAcumulado"
                    name="Gasto Real Acumulado"
                    stroke={isOverBudget ? '#f43f5e' : '#10b981'}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorReal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Immediate Control Advisory Footer */}
      <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <span className="text-slate-300 font-medium">
              {isOverBudget ? (
                <span className="text-rose-300 font-bold">
                  Atenção: Você gastou {formatCurrency(Math.abs(remainingBudget))} a mais do que o teto planejado.
                </span>
              ) : (
                <>
                  Você pode gastar até{' '}
                  <strong className="text-emerald-400 font-extrabold">
                    {formatCurrency(safeDailyAllowance)}
                  </strong>
                  /dia pelos próximos {daysRemaining} dias.
                </>
              )}
            </span>
          </div>
        </div>

        {onOpenSalaryConfig && (
          <button
            type="button"
            onClick={onOpenSalaryConfig}
            className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-0.5 shrink-0 ml-2"
          >
            <span>Ajustar Teto</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

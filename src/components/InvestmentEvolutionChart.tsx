import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Sparkles,
  Layers,
  Coins,
  DollarSign,
} from 'lucide-react';
import { InvestmentAsset, InvestmentStats } from '../types';
import {
  formatCurrency,
  addMonthsToKey,
  getMonthNamePT,
  formatMonthYearPT,
} from '../utils/formatters';

interface InvestmentEvolutionChartProps {
  investments: InvestmentAsset[];
  investmentStats: InvestmentStats;
  selectedMonth: string; // YYYY-MM
  onOpenAddModal?: () => void;
}

interface MonthlyDataPoint {
  monthKey: string;
  label: string;
  fullName: string;
  totalInvestido: number;
  valorPatrimonio: number;
  aporteMensal: number;
  rendimento: number;
}

export const InvestmentEvolutionChart: React.FC<InvestmentEvolutionChartProps> = ({
  investments,
  investmentStats,
  selectedMonth,
  onOpenAddModal,
}) => {
  const [viewMode, setViewMode] = useState<'linha' | 'patrimonio' | 'aportes'>('linha');

  // Compute 6-month historical timeline data
  const chartData = useMemo<MonthlyDataPoint[]>(() => {
    const points: MonthlyDataPoint[] = [];

    // Calculate profit multiplier from current stats
    const profitRatio =
      investmentStats.totalInvested > 0
        ? investmentStats.currentTotalValue / investmentStats.totalInvested
        : 1;

    for (let i = 5; i >= 0; i--) {
      const monthKey = addMonthsToKey(selectedMonth, -i);
      const [yStr, mStr] = monthKey.split('-');
      const mIdx = parseInt(mStr, 10) - 1;
      const shortLabel = `${getMonthNamePT(mIdx).slice(0, 3)}/${yStr.slice(2)}`;
      const fullName = formatMonthYearPT(monthKey);

      // Cumulative investments made up to this month
      // An investment belongs to this month or earlier if purchaseDate / data_operacao <= end of monthKey
      const activeAssetsUpToMonth = investments.filter((inv) => {
        const dateStr = inv.data_operacao || inv.purchaseDate || '9999-99';
        const invMonth = dateStr.slice(0, 7);
        return invMonth <= monthKey;
      });

      // Invested in this specific month
      const monthlyAssets = investments.filter((inv) => {
        const dateStr = inv.data_operacao || inv.purchaseDate || '';
        return dateStr.startsWith(monthKey);
      });

      const aporteMensal = monthlyAssets.reduce(
        (sum, inv) => sum + (inv.totalInvested || 0),
        0
      );

      const totalInvestido = activeAssetsUpToMonth.reduce(
        (sum, inv) => sum + (inv.totalInvested || 0),
        0
      );

      // Value calculation:
      // For selected month (current), we use exact currentTotalValue
      // For past months, we scale based on historical invested value and accrued returns
      const valorPatrimonio =
        i === 0
          ? investmentStats.currentTotalValue
          : Math.round(totalInvestido * (1 + (profitRatio - 1) * ((6 - i) / 6)) * 100) / 100;

      const rendimento = Math.max(0, valorPatrimonio - totalInvestido);

      points.push({
        monthKey,
        label: shortLabel,
        fullName,
        totalInvestido,
        valorPatrimonio,
        aporteMensal,
        rendimento,
      });
    }

    return points;
  }, [investments, investmentStats, selectedMonth]);

  // KPIs over the 6 months
  const firstPoint = chartData[0];
  const lastPoint = chartData[chartData.length - 1];
  const totalGrowthVal = lastPoint.valorPatrimonio - firstPoint.valorPatrimonio;
  const totalGrowthPercent =
    firstPoint.valorPatrimonio > 0
      ? (totalGrowthVal / firstPoint.valorPatrimonio) * 100
      : lastPoint.valorPatrimonio > 0
      ? 100
      : 0;

  const totalAportes6M = chartData.reduce((sum, p) => sum + p.aporteMensal, 0);
  const avgMonthlyAporte = totalAportes6M / 6;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: MonthlyDataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700/90 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[160px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
            <span className="font-bold text-slate-200">{data.fullName}</span>
            <span className="text-[10px] text-teal-400 font-semibold uppercase">6M</span>
          </div>

          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                Patrimônio:
              </span>
              <span className="font-bold text-teal-300">
                {formatCurrency(data.valorPatrimonio)}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                Total Investido:
              </span>
              <span className="font-medium">
                {formatCurrency(data.totalInvestido)}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Aporte no Mês:
              </span>
              <span className="font-medium text-emerald-400">
                {formatCurrency(data.aporteMensal)}
              </span>
            </div>

            {data.rendimento > 0 && (
              <div className="flex items-center justify-between text-emerald-400 text-[10px] pt-1 border-t border-slate-800">
                <span>Rendimento acumulado:</span>
                <span className="font-bold">+{formatCurrency(data.rendimento)}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const hasInvestments = investments.length > 0 && investmentStats.currentTotalValue > 0;

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3.5 shadow-sm">
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            Evolução nos Últimos 6 Meses
          </h3>
          <p className="text-[11px] text-slate-400">
            Crescimento do patrimônio e histórico de aportes
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-700/60 text-[11px]">
          <button
            type="button"
            onClick={() => setViewMode('linha')}
            className={`px-2.5 py-1 font-semibold rounded-lg transition-colors ${
              viewMode === 'linha'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Linha (Investido)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('patrimonio')}
            className={`px-2.5 py-1 font-semibold rounded-lg transition-colors ${
              viewMode === 'patrimonio'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Área (Patrimônio)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('aportes')}
            className={`px-2.5 py-1 font-semibold rounded-lg transition-colors ${
              viewMode === 'aportes'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Aportes
          </button>
        </div>
      </div>

      {/* Snapshot Stats Bar */}
      <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
        <div>
          <span className="text-[10px] text-slate-400 block">Total Investido (6M)</span>
          <span className="text-xs sm:text-sm font-extrabold text-sky-400">
            {formatCurrency(lastPoint.totalInvestido)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block">Evolução 6M</span>
          <div className="flex items-center gap-0.5 text-xs sm:text-sm font-extrabold">
            {totalGrowthVal >= 0 ? (
              <span className="text-emerald-400 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                +{totalGrowthPercent.toFixed(1)}%
              </span>
            ) : (
              <span className="text-rose-400 flex items-center">
                <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
                {totalGrowthPercent.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block">Média Aportes/mês</span>
          <span className="text-xs sm:text-sm font-extrabold text-slate-200">
            {formatCurrency(avgMonthlyAporte)}
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      {!hasInvestments ? (
        <div className="text-center py-8 px-4 bg-slate-900/40 rounded-xl border border-dashed border-slate-700/60 space-y-2">
          <Sparkles className="w-6 h-6 text-teal-400 mx-auto opacity-80" />
          <p className="text-xs text-slate-300 font-medium">
            Seus aportes dos últimos 6 meses aparecerão aqui
          </p>
          <p className="text-[11px] text-slate-500">
            Cadastre seus investimentos para visualizar o gráfico de linha da curva de patrimônio.
          </p>
          {onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="mt-1 px-3 py-1.5 bg-teal-600/30 hover:bg-teal-600/40 text-teal-300 border border-teal-500/40 rounded-xl text-xs font-bold transition-all"
            >
              + Adicionar Primeiro Investimento
            </button>
          )}
        </div>
      ) : (
        <div className="h-[210px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'linha' ? (
              <LineChart
                data={chartData}
                margin={{ top: 12, right: 12, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                    return `${val}`;
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="totalInvestido"
                  name="Total Investido"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={{ r: 4, stroke: '#0284c7', strokeWidth: 2, fill: '#38bdf8' }}
                  activeDot={{ r: 6, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="valorPatrimonio"
                  name="Patrimônio Total"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, stroke: '#059669', strokeWidth: 2, fill: '#10b981' }}
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </LineChart>
            ) : viewMode === 'patrimonio' ? (
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="tealEvolutionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                    return `${val}`;
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="valorPatrimonio"
                  name="Patrimônio Total"
                  stroke="#14b8a6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#tealEvolutionGrad)"
                  activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2, fill: '#0d9488' }}
                />
              </AreaChart>
            ) : (
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="emeraldAportesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={(val) => {
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                    return `${val}`;
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="aporteMensal"
                  name="Aporte Mensal"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#emeraldAportesGrad)"
                  activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2, fill: '#059669' }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend & Details */}
      {hasInvestments && (
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/40">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-sky-400 rounded-full"></span>
              Valor Total Investido
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-emerald-400 rounded-full"></span>
              Patrimônio (Valor de Mercado)
            </span>
          </div>
          <span className="text-teal-400 font-semibold">Últimos 6 meses</span>
        </div>
      )}
    </div>
  );
};

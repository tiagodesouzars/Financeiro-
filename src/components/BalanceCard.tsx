import React from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  Plus,
  Sparkles,
  CalendarDays,
  CreditCard,
  TrendingUp,
  PieChart,
  Info,
  Download,
} from 'lucide-react';
import { FinancialStats, UserFinancialProfile, InvestmentStats } from '../types';
import { formatCurrency } from '../utils/formatters';

interface BalanceCardProps {
  stats: FinancialStats;
  profile: UserFinancialProfile;
  investmentStats?: InvestmentStats;
  onOpenQuickAdd: (defaultType: 'expense' | 'income') => void;
  onOpenDailyView: () => void;
  onOpenBills: () => void;
  onOpenInvestments?: () => void;
  onOpenMonthlyBalance?: () => void;
  onOpenSalaryConfig?: () => void;
  onExportPdf?: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  stats,
  profile,
  investmentStats,
  onOpenQuickAdd,
  onOpenDailyView,
  onOpenBills,
  onOpenInvestments,
  onOpenMonthlyBalance,
  onOpenSalaryConfig,
  onExportPdf,
}) => {
  // Available budget ratio
  const spendRatio = stats.totalIncome > 0
    ? Math.min(100, Math.round((stats.totalExpenses / stats.totalIncome) * 100))
    : 0;

  return (
    <div className="bg-gradient-to-b from-slate-800/90 to-slate-900/90 rounded-2xl p-4 border border-slate-700/70 shadow-lg relative overflow-hidden">
      {/* Background ambient accent */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Main Balance Header */}
      <div className="relative z-10">
        {/* Custom Salary / Current Balance Override Notice */}
        {stats.isCustomIncomeApplied && (
          <div className="mb-2.5 px-2.5 py-1.5 rounded-xl bg-blue-950/50 border border-blue-500/30 flex items-center justify-between text-xs text-blue-200">
            <div className="flex items-center gap-1.5 truncate">
              <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate font-medium">
                {stats.customIncomeNote || 'Saldo em conta aplicado para este mês'}
              </span>
            </div>
            {onOpenSalaryConfig && (
              <button
                onClick={onOpenSalaryConfig}
                className="text-[11px] underline text-blue-300 hover:text-white font-bold shrink-0 ml-2"
              >
                Ajustar
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
          <span>Orçamento Disponível Livre</span>
          <span className="flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <Sparkles className="w-3 h-3" />
            Meta: {stats.savingsRate}% Poupado
          </span>
        </div>

        {/* Big Available Number */}
        <div className="flex items-baseline justify-between gap-2 mt-0.5">
          <span className="text-3xl font-extrabold text-white tracking-tight">
            {formatCurrency(stats.availableBudget)}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            {spendRatio}% consumido
          </span>
        </div>

        {/* Progress Bar of Budget Consumption */}
        <div className="w-full bg-slate-700/50 h-2 rounded-full mt-2.5 overflow-hidden border border-slate-700/40">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              spendRatio > 90
                ? 'bg-rose-500'
                : spendRatio > 75
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${spendRatio}%` }}
          />
        </div>

        {/* 2-Column Summary: Rendas vs Gastos */}
        <div className="grid grid-cols-2 gap-2.5 mt-3.5 pt-3 border-t border-slate-700/60">
          {/* Rendas */}
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-400 font-medium truncate">Renda Total</p>
              <p className="text-sm font-bold text-emerald-400 truncate">
                {formatCurrency(stats.totalIncome)}
              </p>
            </div>
          </div>

          {/* Despesas */}
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-400 font-medium truncate">Total Gastos</p>
              <p className="text-sm font-bold text-rose-400 truncate">
                {formatCurrency(stats.totalExpenses)}
              </p>
            </div>
          </div>
        </div>

        {/* Automatic Savings Highlight */}
        <div className="mt-3 bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <PiggyBank className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-200">
                Economia Automática Sugerida
              </p>
              <p className="text-[11px] text-slate-400">
                {stats.savingsRate}% do seu disponível deste mês
              </p>
            </div>
          </div>
          <span className="text-sm font-bold text-indigo-300">
            {formatCurrency(stats.projectedSavings)}
          </span>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-3.5">
          <button
            id="quick-add-expense-btn"
            onClick={() => onOpenQuickAdd('expense')}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Registrar Gasto
          </button>

          <button
            id="quick-add-income-btn"
            onClick={() => onOpenQuickAdd('income')}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Registrar Renda
          </button>
        </div>

        {/* Secondary Navigation Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-700/40 text-xs">
          {onOpenMonthlyBalance && (
            <button
              onClick={onOpenMonthlyBalance}
              className="flex items-center gap-1.5 text-indigo-300 hover:text-white transition-colors py-1 px-2.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 font-bold"
            >
              <PieChart className="w-3.5 h-3.5 text-indigo-400" />
              <span>Balanço do Mês</span>
            </button>
          )}

          {onExportPdf && (
            <button
              onClick={onExportPdf}
              className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-slate-700/40 font-medium"
              title="Baixar Relatório Mensal e Metas em PDF"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>PDF</span>
            </button>
          )}

          <button
            onClick={onOpenDailyView}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-slate-700/40"
          >
            <CalendarDays className="w-3.5 h-3.5 text-blue-400" />
            <span>Visão Diária</span>
          </button>

          {onOpenInvestments && investmentStats && (
            <button
              onClick={onOpenInvestments}
              className="flex items-center gap-1.5 text-teal-300 hover:text-teal-200 transition-colors py-1 px-2 rounded-lg hover:bg-teal-500/10 font-semibold"
            >
              <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
              <span>Investimentos ({formatCurrency(investmentStats.currentTotalValue)})</span>
            </button>
          )}

          {stats.totalCreditCommittedGlobal != null && stats.totalCreditCommittedGlobal > 0 && (
            <button
              onClick={onOpenBills}
              className="flex items-center gap-1.5 text-purple-300 hover:text-white transition-colors py-1 px-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20"
              title="Limite de cartões bloqueado em parcelas e compras"
            >
              <CreditCard className="w-3.5 h-3.5 text-purple-400" />
              <span>Cartões ({formatCurrency(stats.totalCreditCommittedGlobal)})</span>
            </button>
          )}

          <button
            onClick={onOpenBills}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-slate-700/40"
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {stats.pendingBillsCount > 0
                ? `${stats.pendingBillsCount} Faturas (${formatCurrency(stats.pendingBillsAmount)})`
                : stats.nextUpcomingBillAmount && stats.nextUpcomingBillAmount > 0
                ? `Próx. Faturas: ${formatCurrency(stats.nextUpcomingBillAmount)}`
                : '0 Faturas (R$ 0,00)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

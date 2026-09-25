import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { FixedBill, Transaction, PaymentCard, UserFinancialProfile, SavingsGoal } from '../types';
import { formatCurrency, formatMonthYearPT, addMonthsToKey, getCurrentMonthKey } from '../utils/formatters';
import { getBillsForMonth, isBillForCard } from '../utils/storage';

interface CashFlowProjectionProps {
  currentMonth: string;
  transactions: Transaction[];
  bills: FixedBill[];
  cards: PaymentCard[];
  profile: UserFinancialProfile;
  goals?: SavingsGoal[];
}

export const CashFlowProjection: React.FC<CashFlowProjectionProps> = ({
  currentMonth,
  transactions,
  bills,
  cards,
  profile,
  goals = [],
}) => {
  const [horizonMonths, setHorizonMonths] = useState<6 | 12>(6);

  // Calculate projected cash flow per future month
  const projections = useMemo(() => {
    const list = [];
    const baseSalary = profile.fixedSalary || 0;

    for (let i = 1; i <= horizonMonths; i++) {
      const monthKey = addMonthsToKey(currentMonth, i);

      // 1. Projected Income (Salary or custom override)
      let projectedIncome = baseSalary;
      if (profile.monthlySalaryOverrides && profile.monthlySalaryOverrides[monthKey]) {
        projectedIncome = profile.monthlySalaryOverrides[monthKey].amount;
      }

      // 2. Projected Fixed Bills for this month
      const monthBills = getBillsForMonth(bills, monthKey).filter(
        (b) => b.resolvedStatus !== 'paused'
      );
      const billsTotal = monthBills.reduce((sum, b) => sum + b.amount, 0);

      // 3. Projected Credit Card Installments
      const creditCards = cards.filter((c) => c.type !== 'debit');
      const creditBills = monthBills.filter(
        (b) =>
          creditCards.some((c) => isBillForCard(b, c, cards)) &&
          (b.paymentMethod === 'Cartão de Crédito' || !b.paymentMethod)
      );
      const cardInstallmentsTotal = creditBills.reduce((sum, b) => sum + b.amount, 0);

      // 4. Projected standalone transactions with future installments
      const futureInstallmentTxs = transactions.filter((t) => {
        if (t.type !== 'expense' || t.paymentMethod !== 'Cartão de Crédito') return false;
        return t.date && t.date.startsWith(monthKey);
      });
      const txInstallmentsTotal = futureInstallmentTxs.reduce((sum, t) => sum + t.amount, 0);

      // 5. Goals savings target for this month
      const activeGoals = goals.filter((g) => (g as any).status !== 'completed');
      const monthlyGoalsSavings = activeGoals.reduce((sum, g) => {
        const goalDate = g.targetDate || (g as any).deadline;
        if (!goalDate) return sum + 100;
        return sum + Math.max(50, (g.targetAmount - g.currentAmount) / 12);
      }, 0);

      const totalOutflow = billsTotal + txInstallmentsTotal;
      const netMonthlyProjected = projectedIncome - totalOutflow;

      list.push({
        monthKey,
        label: formatMonthYearPT(monthKey),
        projectedIncome,
        billsTotal,
        cardInstallmentsTotal: cardInstallmentsTotal + txInstallmentsTotal,
        totalOutflow,
        netMonthlyProjected,
        billsCount: monthBills.length,
      });
    }

    // Cumulative balance calculation
    let runningCumulative = 0;
    return list.map((item) => {
      runningCumulative += item.netMonthlyProjected;
      return {
        ...item,
        cumulativeBalance: runningCumulative,
      };
    });
  }, [currentMonth, transactions, bills, cards, profile, goals, horizonMonths]);

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Projeção do Fluxo de Caixa Futuro
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-semibold">
                Tendência Preditiva
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Receitas previstas, faturas, contas fixas e parcelas programadas
            </p>
          </div>
        </div>

        {/* Horizon selector: 6 vs 12 months */}
        <div className="flex items-center bg-slate-950/60 border border-slate-800 rounded-2xl p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setHorizonMonths(6)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              horizonMonths === 6
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            6 Meses
          </button>
          <button
            type="button"
            onClick={() => setHorizonMonths(12)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              horizonMonths === 12
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            12 Meses
          </button>
        </div>
      </div>

      {/* Projection Cards Slider */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {projections.map((item, idx) => {
          const isPositive = item.netMonthlyProjected >= 0;
          return (
            <div
              key={item.monthKey}
              className="p-4 rounded-2xl bg-slate-800/30 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200 capitalize">
                  {item.label}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  +{idx + 1} mês(es)
                </span>
              </div>

              {/* In vs Out */}
              <div className="space-y-1.5 text-[11px] mb-3">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <ArrowUpRight className="w-3.5 h-3.5" /> Receitas
                  </span>
                  <span className="font-semibold text-slate-200">
                    {formatCurrency(item.projectedIncome)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1 text-rose-400">
                    <ArrowDownRight className="w-3.5 h-3.5" /> Despesas & Contas
                  </span>
                  <span className="font-semibold text-slate-200">
                    {formatCurrency(item.totalOutflow)}
                  </span>
                </div>

                {item.cardInstallmentsTotal > 0 && (
                  <div className="flex items-center justify-between text-[10px] text-indigo-300/80 bg-indigo-500/5 px-2 py-0.5 rounded-lg border border-indigo-500/10">
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3" /> Parcelas de Cartão
                    </span>
                    <span>{formatCurrency(item.cardInstallmentsTotal)}</span>
                  </div>
                )}
              </div>

              {/* Monthly Net & Cumulative Health */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block">Sobra Prevista:</span>
                  <span
                    className={`text-xs font-extrabold ${
                      isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isPositive ? '+' : ''}
                    {formatCurrency(item.netMonthlyProjected)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Saldo Acumulado:</span>
                  <span className="text-xs font-bold text-cyan-300">
                    {formatCurrency(item.cumulativeBalance)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

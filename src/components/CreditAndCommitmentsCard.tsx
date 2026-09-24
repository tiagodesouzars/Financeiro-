import React from 'react';
import {
  CreditCard,
  AlertCircle,
  Calendar,
  Lock,
  ChevronRight,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { PaymentCard, Transaction, FixedBill, FinancialStats } from '../types';
import { formatCurrency, formatMonthYearPT } from '../utils/formatters';
import { getCardUsage } from '../utils/storage';

interface CreditAndCommitmentsCardProps {
  cards: PaymentCard[];
  transactions: Transaction[];
  bills: FixedBill[];
  selectedMonth: string;
  stats: FinancialStats;
  onNavigateToMonth?: (month: string) => void;
  onOpenCardsManager: () => void;
  onOpenBills: () => void;
}

export const CreditAndCommitmentsCard: React.FC<CreditAndCommitmentsCardProps> = ({
  cards,
  transactions,
  bills,
  selectedMonth,
  stats,
  onNavigateToMonth,
  onOpenCardsManager,
  onOpenBills,
}) => {
  const creditCards = cards.filter((c) => c.type !== 'debit');

  if (creditCards.length === 0) {
    return null;
  }

  const usages = creditCards.map((c) => ({
    card: c,
    usage: getCardUsage(c, transactions, bills, selectedMonth, cards),
  }));

  const totalLimit = usages.reduce((acc, u) => acc + u.card.totalLimit, 0);
  const totalCommitted = usages.reduce((acc, u) => acc + u.usage.totalCommittedLimit, 0);
  const totalAvailable = Math.max(0, Math.round((totalLimit - totalCommitted) * 100) / 100);
  const totalMonthInvoices = usages.reduce((acc, u) => acc + u.usage.monthInvoiceAmount, 0);

  const globalUsagePercent =
    totalLimit > 0 ? Math.min(100, Math.round((totalCommitted / totalLimit) * 100)) : 0;

  return (
    <div className="bg-gradient-to-b from-slate-800/90 to-slate-900/90 rounded-2xl p-4 border border-slate-700/80 shadow-lg space-y-3.5 relative overflow-hidden">
      {/* Ambient background decoration */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>Cartões & Limite Comprometido</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Controle global do seu limite em aberto e parcelas
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCardsManager}
          className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-0.5 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-all"
        >
          <span>Gerenciar</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center relative z-10">
        <div>
          <span className="text-[10px] text-slate-400 block font-medium">Limite Total</span>
          <span className="text-xs sm:text-sm font-bold text-slate-200">
            {formatCurrency(totalLimit)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-amber-400/90 block font-medium flex items-center justify-center gap-0.5">
            <Lock className="w-2.5 h-2.5" />
            Comprometido
          </span>
          <span className="text-xs sm:text-sm font-bold text-amber-400">
            {formatCurrency(totalCommitted)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-emerald-400/90 block font-medium">Disponível Real</span>
          <span className="text-xs sm:text-sm font-extrabold text-emerald-400">
            {formatCurrency(totalAvailable)}
          </span>
        </div>
      </div>

      {/* Global Limit Progress Bar */}
      <div className="relative z-10 space-y-1">
        <div className="flex justify-between items-center text-[10px] text-slate-400">
          <span>{globalUsagePercent}% do limite total comprometido com compras e parcelas</span>
          <span>{formatCurrency(totalAvailable)} livre</span>
        </div>
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700/50">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              globalUsagePercent > 80
                ? 'bg-rose-500'
                : globalUsagePercent > 50
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`}
            style={{ width: `${globalUsagePercent}%` }}
          />
        </div>
      </div>

      {/* Individual Cards Status */}
      <div className="space-y-2 relative z-10">
        {usages.map(({ card, usage }) => {
          const cardUsagePercent =
            card.totalLimit > 0
              ? Math.min(100, Math.round((usage.totalCommittedLimit / card.totalLimit) * 100))
              : 0;

          return (
            <div
              key={card.id}
              className="bg-slate-900/70 hover:bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 transition-all"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: card.color || '#a855f7' }}
                  />
                  <span className="text-xs font-bold text-slate-200">{card.name}</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {card.bank}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400">
                    {formatCurrency(usage.availableLimit)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">disponível</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mb-1.5 border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    cardUsagePercent > 80
                      ? 'bg-rose-500'
                      : cardUsagePercent > 50
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${cardUsagePercent}%` }}
                />
              </div>

              {/* Card Context Information */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                {usage.totalCommittedLimit > 0 ? (
                  <>
                    <span className="text-slate-300">
                      Comprometido:{' '}
                      <strong className="text-amber-300">
                        {formatCurrency(usage.totalCommittedLimit)}
                      </strong>{' '}
                      ({cardUsagePercent}%)
                    </span>
                    <span>
                      {usage.monthInvoiceAmount > 0 ? (
                        <span className="text-rose-300 font-semibold">
                          Fatura {formatMonthYearPT(selectedMonth)}: {formatCurrency(usage.monthInvoiceAmount)}
                        </span>
                      ) : usage.nextInvoiceMonth ? (
                        <span className="text-indigo-300">
                          Próx. fatura: {formatCurrency(usage.nextInvoiceAmount || 0)} em{' '}
                          {formatMonthYearPT(usage.nextInvoiceMonth)}
                        </span>
                      ) : (
                        <span>Sem fatura este mês</span>
                      )}
                    </span>
                  </>
                ) : (
                  <span className="text-emerald-400/90 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    Limite 100% liberado • Nenhuma parcela em aberto
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Future Commitment Banner */}
      {stats.nextUpcomingBillMonth && stats.nextUpcomingBillMonth !== selectedMonth && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-200 flex items-start justify-between gap-2 relative z-10">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-200">
                Lançamentos Futuros Programados
              </p>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Você já tem <strong>{formatCurrency(stats.nextUpcomingBillAmount || 0)}</strong> ({stats.nextUpcomingBillCount} cobrança{stats.nextUpcomingBillCount !== 1 ? 's' : ''}) programadas para{' '}
                <strong>{formatMonthYearPT(stats.nextUpcomingBillMonth)}</strong>. O limite dos cartões já está bloqueado!
              </p>
            </div>
          </div>

          {onNavigateToMonth && (
            <button
              onClick={() => onNavigateToMonth(stats.nextUpcomingBillMonth!)}
              className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-100 rounded-lg text-[10px] font-bold shrink-0 transition-colors"
            >
              Ver {formatMonthYearPT(stats.nextUpcomingBillMonth).split(' ')[0]}
            </button>
          )}
        </div>
      )}

      {/* Total Open Installments Summary */}
      {stats.totalFutureDebtsAmount != null && stats.totalFutureDebtsAmount > 0 && (
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/50">
          <span className="flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-slate-400" />
            Dívida total parcelada em aberto (todos os meses):
          </span>
          <span className="font-bold text-slate-200">
            {formatCurrency(stats.totalFutureDebtsAmount)}
          </span>
        </div>
      )}
    </div>
  );
};

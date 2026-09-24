import React from 'react';
import { AlertTriangle, Clock, CheckCircle2, ChevronRight, Calendar } from 'lucide-react';
import { FixedBill } from '../types';
import { formatCurrency, getCurrentMonthKey, addMonthsToKey, formatMonthYearPT } from '../utils/formatters';
import { getBillsForMonth } from '../utils/storage';

interface PendingBillsBannerProps {
  bills: FixedBill[];
  onOpenBills: () => void;
  onPayBillQuick: (bill: FixedBill) => void;
}

export const PendingBillsBanner: React.FC<PendingBillsBannerProps> = ({
  bills,
  onOpenBills,
  onPayBillQuick,
}) => {
  const currentMonthKey = getCurrentMonthKey();
  const today = new Date();
  const currentDay = today.getDate();

  // Dynamically resolve bills strictly for the REAL current month
  const currentMonthBills = getBillsForMonth(bills, currentMonthKey);
  const pendingBills = currentMonthBills.filter(
    (b) => b.resolvedStatus === 'pending' && b.paymentRequired !== false
  );

  // If no bills pending in the current month, check upcoming month
  if (pendingBills.length === 0) {
    const nextMonthKey = addMonthsToKey(currentMonthKey, 1);
    const nextMonthBills = getBillsForMonth(bills, nextMonthKey).filter(
      (b) => b.resolvedStatus === 'pending' && b.paymentRequired !== false
    );
    const nextAmount = nextMonthBills.reduce((acc, b) => acc + b.amount, 0);

    if (nextMonthBills.length === 0) return null;

    return (
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">
                Tudo em dia em {formatMonthYearPT(currentMonthKey).split(' ')[0]}!
              </p>
              <p className="text-[11px] text-slate-400">
                Próximos compromissos: <strong className="text-amber-300">{formatCurrency(nextAmount)}</strong> programados para {formatMonthYearPT(nextMonthKey)} ({nextMonthBills.length} fatura{nextMonthBills.length > 1 ? 's' : ''}).
              </p>
            </div>
          </div>

          <button
            onClick={onOpenBills}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5 shrink-0 px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20"
          >
            Ver
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Classify by urgency for the REAL current month:
  // Overdue: dueDay < currentDay
  // Today: dueDay === currentDay
  // Soon: dueDay > currentDay && dueDay <= currentDay + 5
  const overdue = pendingBills.filter((b) => b.dueDay < currentDay);
  const dueToday = pendingBills.filter((b) => b.dueDay === currentDay);
  const dueSoon = pendingBills.filter(
    (b) => b.dueDay > currentDay && b.dueDay <= currentDay + 5
  );

  const urgentBill = overdue[0] || dueToday[0] || dueSoon[0] || pendingBills[0];

  const getUrgencyBadge = (dueDay: number) => {
    if (dueDay < currentDay) {
      const daysAgo = currentDay - dueDay;
      return {
        label: `Atrasada (${daysAgo}d)`,
        bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        icon: <AlertTriangle className="w-3 h-3 text-rose-400" />,
      };
    }
    if (dueDay === currentDay) {
      return {
        label: 'Vence Hoje!',
        bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        icon: <Clock className="w-3 h-3 text-amber-400" />,
      };
    }
    const daysLeft = dueDay - currentDay;
    return {
      label: `Vence em ${daysLeft}d (dia ${dueDay})`,
      bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      icon: <Clock className="w-3 h-3 text-blue-400" />,
    };
  };

  const badge = getUrgencyBadge(urgentBill.dueDay);

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Lembrete de Pagamento ({pendingBills.length} pendente{pendingBills.length > 1 ? 's' : ''})
          </h2>
        </div>

        <button
          onClick={onOpenBills}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-0.5"
        >
          Ver todas ({pendingBills.length})
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Featured Urgent Bill Item */}
      <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}
            >
              {badge.icon}
              {badge.label}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-100 truncate">
            {urgentBill.name}
          </p>
          <p className="text-xs text-slate-400">
            {formatCurrency(urgentBill.amount)} • {urgentBill.paymentMethod}
            {urgentBill.cardName ? ` (${urgentBill.cardName})` : ''}
          </p>
        </div>

        <button
          onClick={() => onPayBillQuick(urgentBill)}
          className="shrink-0 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors active:scale-95 shadow"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Pagar
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  CalendarDays,
  X,
  Plus,
  ArrowDownRight,
  TrendingDown,
  Info,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Transaction } from '../types';
import {
  formatCurrency,
  formatDateBR,
  formatShortDateBR,
  getTodayDateString,
  CATEGORY_COLORS,
  getDaysInMonth,
} from '../utils/formatters';

interface DailyViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  selectedMonth: string; // YYYY-MM
  availableBudget: number;
  onOpenQuickAdd: (type: 'expense' | 'income') => void;
}

export const DailyViewModal: React.FC<DailyViewModalProps> = ({
  isOpen,
  onClose,
  transactions,
  selectedMonth,
  availableBudget,
  onOpenQuickAdd,
}) => {
  const [selectedDayString, setSelectedDayString] = useState<string>(
    getTodayDateString()
  );

  if (!isOpen) return null;

  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const daysInMonth = getDaysInMonth(year, month);

  // Remaining days in month from today
  const today = new Date();
  const currentDay = today.getDate();
  const remainingDays = Math.max(1, daysInMonth - currentDay + 1);

  // Daily budget guideline: available budget / remaining days
  const recommendedDailyBudget = Math.max(0, availableBudget / remainingDays);

  // Transactions on the chosen day
  const dayTransactions = transactions.filter(
    (t) => t.date === selectedDayString
  );

  const dayExpenses = dayTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const dayIncome = dayTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  // Day buttons for quick navigation
  const dayList = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const dStr = String(d).padStart(2, '0');
    const fullDate = `${selectedMonth}-${dStr}`;
    const txCount = transactions.filter(
      (t) => t.date === fullDate && t.type === 'expense'
    ).length;
    return {
      day: d,
      fullDate,
      hasExpenses: txCount > 0,
    };
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Organização Diária de Gastos
              </h2>
              <p className="text-[11px] text-slate-400">
                Acompanhe o ritmo dia a dia
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Daily Target Engine */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 mb-3.5">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">Limite Diário Recomendado:</span>
            <span className="font-bold text-emerald-400">
              {formatCurrency(recommendedDailyBudget)}/dia
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Baseado no seu saldo livre de {formatCurrency(availableBudget)} dividido
            pelos {remainingDays} dias restantes do mês.
          </p>
        </div>

        {/* Horizontal Calendar Day Strip */}
        <div className="mb-4">
          <span className="text-xs font-semibold text-slate-300 block mb-1.5">
            Selecione o Dia
          </span>
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
            {dayList.map((item) => {
              const isSelected = item.fullDate === selectedDayString;
              return (
                <button
                  key={item.fullDate}
                  onClick={() => setSelectedDayString(item.fullDate)}
                  className={`flex flex-col items-center justify-center min-w-[38px] py-1.5 px-1 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 font-normal">
                    Dia
                  </span>
                  <span>{item.day}</span>
                  {item.hasExpenses && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Status Card */}
        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-200">
              {formatDateBR(selectedDayString)}
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                dayExpenses > recommendedDailyBudget
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {dayExpenses > recommendedDailyBudget
                ? 'Acima da meta diária'
                : 'Dentro do limite'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center pt-1">
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">
                Gastos no Dia
              </span>
              <span className="text-sm font-bold text-rose-400">
                {formatCurrency(dayExpenses)}
              </span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">
                Entradas no Dia
              </span>
              <span className="text-sm font-bold text-emerald-400">
                {formatCurrency(dayIncome)}
              </span>
            </div>
          </div>
        </div>

        {/* Day Transactions List */}
        <div className="space-y-2 mb-4">
          <span className="text-xs font-semibold text-slate-300 block">
            Registros Deste Dia ({dayTransactions.length})
          </span>

          {dayTransactions.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
              Nenhuma transação registrada neste dia.
            </div>
          ) : (
            dayTransactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: CATEGORY_COLORS[tx.category] || '#94a3b8',
                    }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-100 truncate">
                      {tx.description}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {tx.category} • {tx.paymentMethod}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold shrink-0 ${
                    tx.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {tx.type === 'expense' ? '-' : '+'}
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            onClose();
            onOpenQuickAdd('expense');
          }}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Registrar Transação Neste Dia
        </button>
      </div>
    </div>
  );
};

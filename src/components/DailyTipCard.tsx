import React, { useState, useMemo } from 'react';
import {
  Lightbulb,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  TrendingDown,
  CreditCard,
  Utensils,
  PiggyBank,
  ShoppingBag,
  RotateCcw,
  Check,
  X,
  ArrowRight,
} from 'lucide-react';
import {
  Transaction,
  FixedBill,
  UserFinancialProfile,
  FinancialStats,
} from '../types';
import {
  formatCurrency,
  getMonthNamePT,
  getCurrentMonthKey,
  formatMonthYearPT,
} from '../utils/formatters';

interface DailyTipCardProps {
  transactions: Transaction[];
  bills: FixedBill[];
  profile: UserFinancialProfile;
  stats: FinancialStats;
  selectedMonth: string; // YYYY-MM
  onNavigateToTab?: (tab: 'transactions' | 'bills' | 'goals') => void;
  onOpenSalaryConfig?: () => void;
}

interface SmartTip {
  id: string;
  category: string;
  icon: React.ReactNode;
  badge: string;
  title: string;
  message: string;
  impactValue?: string;
  actionLabel?: string;
  actionType?: 'transactions' | 'bills' | 'goals' | 'config';
}

export const DailyTipCard: React.FC<DailyTipCardProps> = ({
  transactions,
  bills,
  profile,
  stats,
  selectedMonth,
  onNavigateToTab,
  onOpenSalaryConfig,
}) => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  // Calculate previous month key
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevMonthKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  const prevMonthName = getMonthNamePT(prevMonth - 1);

  // Previous month data analysis
  const prevMonthExpenses = useMemo(() => {
    return transactions.filter(
      (t) => t.type === 'expense' && t.date.startsWith(prevMonthKey)
    );
  }, [transactions, prevMonthKey]);

  const prevMonthTotal = useMemo(() => {
    return prevMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
  }, [prevMonthExpenses]);

  // Category totals in previous month
  const prevCategoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    prevMonthExpenses.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return map;
  }, [prevMonthExpenses]);

  // Credit card usage in previous month
  const prevCardTotal = useMemo(() => {
    return prevMonthExpenses
      .filter((t) => t.paymentMethod === 'Cartão de Crédito')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [prevMonthExpenses]);

  // Current month pace
  const currentMonthExpenses = useMemo(() => {
    return transactions.filter(
      (t) => t.type === 'expense' && t.date.startsWith(selectedMonth)
    );
  }, [transactions, selectedMonth]);

  // Build smart customized tips based on real local data
  const tips: SmartTip[] = useMemo(() => {
    const list: SmartTip[] = [];

    const foodTotal = prevCategoryTotals['Alimentação'] || 0;
    const leisureTotal =
      (prevCategoryTotals['Lazer'] || 0) + (prevCategoryTotals['Compras'] || 0);
    const transportTotal = prevCategoryTotals['Transporte'] || 0;
    const fixedBillsTotal = bills.reduce((acc, b) => acc + b.amount, 0);

    // 1. Food & Dining Tip
    if (foodTotal > 150) {
      const estimatedSaving = foodTotal * 0.25;
      list.push({
        id: 'tip-food',
        category: 'Alimentação',
        icon: <Utensils className="w-4 h-4 text-amber-400" />,
        badge: `Gasto de ${formatCurrency(foodTotal)} em ${prevMonthName}`,
        title: 'Economia com Refeições e Delivery',
        message: `No mês anterior você gastou ${formatCurrency(foodTotal)} em alimentação. Planejar o cardápio semanal ou reduzir 1 pedido de delivery por semana pode economizar cerca de ${formatCurrency(estimatedSaving)} este mês.`,
        impactValue: `+${formatCurrency(estimatedSaving)}/mês`,
        actionLabel: 'Ver gastos com comida',
        actionType: 'transactions',
      });
    }

    // 2. Credit Card Tip
    if (prevCardTotal > 200 && prevMonthTotal > 0) {
      const cardPercent = Math.round((prevCardTotal / prevMonthTotal) * 100);
      list.push({
        id: 'tip-card',
        category: 'Cartões',
        icon: <CreditCard className="w-4 h-4 text-purple-400" />,
        badge: `${cardPercent}% dos gastos no crédito`,
        title: 'Mantenha o Limite Disponível',
        message: `Você concentrou ${cardPercent}% (${formatCurrency(prevCardTotal)}) das despesas no crédito em ${prevMonthName}. Priorizar Pix ou débito nas compras rotineiras evita comprometer as faturas dos próximos meses.`,
        actionLabel: 'Gerenciar Cartões & Faturas',
        actionType: 'bills',
      });
    }

    // 3. Subscriptions and Fixed Bills Tip
    if (fixedBillsTotal > 0) {
      list.push({
        id: 'tip-fixed-bills',
        category: 'Assinaturas & Fixas',
        icon: <TrendingDown className="w-4 h-4 text-rose-400" />,
        badge: `Total de ${formatCurrency(fixedBillsTotal)} em contas`,
        title: 'Revisão de Assinaturas e Serviços',
        message: `Suas despesas fixas somam ${formatCurrency(fixedBillsTotal)}. Faça uma varredura em assinaturas de streaming, academias ou serviços que você usou pouco no último mês para cancelar ou negociar planos.`,
        impactValue: 'R$ 50 a R$ 150/mês',
        actionLabel: 'Revisar Faturas e Contas',
        actionType: 'bills',
      });
    }

    // 4. Impulse Shopping & Leisure
    if (leisureTotal > 100) {
      list.push({
        id: 'tip-leisure',
        category: 'Lazer & Compras',
        icon: <ShoppingBag className="w-4 h-4 text-emerald-400" />,
        badge: `${formatCurrency(leisureTotal)} em compras e lazer`,
        title: 'Regra das 48 Horas para Compras',
        message: `Para compras não essenciais, espere 48 horas antes de pagar. Essa simples pausa reduz até 40% das compras por impulso e preserva seu orçamento para metas importantes.`,
        actionLabel: 'Ver extrato detalhado',
        actionType: 'transactions',
      });
    }

    // 5. Transportation Tip
    if (transportTotal > 120) {
      list.push({
        id: 'tip-transport',
        category: 'Transporte',
        icon: <RotateCcw className="w-4 h-4 text-blue-400" />,
        badge: `${formatCurrency(transportTotal)} no mês anterior`,
        title: 'Otimização de Deslocamentos',
        message: `Você investiu ${formatCurrency(transportTotal)} em transporte. Combinar caronas, comparar aplicativos de corrida ou abastecer com desconto via apps de cashback pode gerar até 15% de economia.`,
        actionLabel: 'Ver detalhes',
        actionType: 'transactions',
      });
    }

    // 6. Savings Habit Tip
    const monthlySalary = profile.fixedSalary || stats.totalIncome || 2000;
    const extraTenPercent = Math.round(monthlySalary * 0.1);
    list.push({
      id: 'tip-savings',
      category: 'Reserva & Futuro',
      icon: <PiggyBank className="w-4 h-4 text-teal-400" />,
      badge: 'Regra 50-30-20',
      title: 'Pague-se Primeiro',
      message: `Ao receber sua renda, separe imediatamente ${formatCurrency(extraTenPercent)} (10%) para suas metas antes de iniciar os gastos do mês. O dinheiro que sobra na conta quase sempre é gasto sem perceber!`,
      impactValue: `${formatCurrency(extraTenPercent * 12)}/ano`,
      actionLabel: 'Ajustar Regra de Metas',
      actionType: 'config',
    });

    // 7. General Financial Wellness Tip
    list.push({
      id: 'tip-daily-safe',
      category: 'Planejamento Diário',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      badge: 'Controle Imediato',
      title: 'Acompanhamento Frequente',
      message: `Registrar gastos logo após realizá-los aumenta em 80% as chances de fechar o mês dentro do orçamento planejado, além de evitar surpresas no extrato.`,
      actionLabel: 'Ver Metas de Economia',
      actionType: 'goals',
    });

    return list;
  }, [
    prevCategoryTotals,
    prevCardTotal,
    prevMonthTotal,
    prevMonthName,
    bills,
    profile,
    stats,
  ]);

  const activeTip = tips[currentTipIndex % tips.length] || tips[0];

  const handleNextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % tips.length);
  };

  const handlePrevTip = () => {
    setCurrentTipIndex((prev) => (prev - 1 + tips.length) % tips.length);
  };

  const handleAction = (type?: 'transactions' | 'bills' | 'goals' | 'config') => {
    if (type === 'config' && onOpenSalaryConfig) {
      onOpenSalaryConfig();
    } else if (type && onNavigateToTab) {
      onNavigateToTab(type as 'transactions' | 'bills' | 'goals');
    }
  };

  if (isDismissed) {
    return (
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
        <span className="text-slate-400 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Dica do dia oculta</span>
        </span>
        <button
          type="button"
          onClick={() => setIsDismissed(false)}
          className="text-emerald-400 font-bold hover:underline"
        >
          Exibir Dica
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-amber-500/30 rounded-2xl p-3.5 shadow-sm relative overflow-hidden">
      {/* Decorative ambient light */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between mb-2 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-100">
                Dica do Dia
              </span>
              <span className="text-[10px] bg-slate-800 text-amber-300 font-semibold px-2 py-0.2 rounded-full border border-slate-700">
                {activeTip.badge}
              </span>
            </div>
          </div>
        </div>

        {/* Carousel controls & close */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevTip}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Dica anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-slate-400 font-mono">
            {(currentTipIndex % tips.length) + 1}/{tips.length}
          </span>
          <button
            type="button"
            onClick={handleNextTip}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Próxima dica"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 ml-1 transition-colors"
            title="Ocultar dica"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tip Content */}
      <div className="space-y-2 relative z-10">
        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-0.5 border border-slate-700">
            {activeTip.icon}
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-slate-200">
              {activeTip.title}
            </h4>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              {activeTip.message}
            </p>
          </div>
        </div>

        {/* Impact Value & Action Link */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
          {activeTip.impactValue ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="text-slate-400">Impacto estimado:</span>
              <strong className="font-extrabold">{activeTip.impactValue}</strong>
            </span>
          ) : (
            <span className="text-[10px] text-slate-400">
              Baseado no histórico local dos seus gastos
            </span>
          )}

          {activeTip.actionLabel && (
            <button
              type="button"
              onClick={() => handleAction(activeTip.actionType)}
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 hover:underline transition-all"
            >
              <span>{activeTip.actionLabel}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

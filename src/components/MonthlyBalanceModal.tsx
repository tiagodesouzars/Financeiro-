import React, { useState } from 'react';
import {
  X,
  PieChart,
  Calendar,
  CreditCard,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Sparkles,
  TrendingUp,
  Wallet,
  Layers,
  FileText,
  Download,
} from 'lucide-react';
import {
  Transaction,
  FixedBill,
  UserFinancialProfile,
  FinancialStats,
  SavingsGoal,
} from '../types';
import {
  formatCurrency,
  formatMonthYearPT,
  addMonthsToKey,
  getMonthNamePT,
} from '../utils/formatters';
import { getBillsForMonth, getMonthEffectiveIncome } from '../utils/storage';

interface MonthlyBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string; // YYYY-MM
  transactions: Transaction[];
  bills: FixedBill[];
  profile: UserFinancialProfile;
  stats?: FinancialStats;
  goals?: SavingsGoal[];
  onExportPdf?: () => void;
  onChangeMonth?: (monthKey: string) => void;
  onOpenSalaryConfig?: () => void;
  onOpenBillsManager?: () => void;
}

export const MonthlyBalanceModal: React.FC<MonthlyBalanceModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  transactions,
  bills,
  profile,
  stats,
  goals,
  onExportPdf,
  onChangeMonth,
  onOpenSalaryConfig,
  onOpenBillsManager,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Month navigation
  const prevMonthKey = addMonthsToKey(selectedMonth, -1);
  const nextMonthKey = addMonthsToKey(selectedMonth, 1);

  // Current month context
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const isPastMonth = selectedMonth < currentMonthKey;
  const isCurrentMonth = selectedMonth === currentMonthKey;
  const isFutureMonth = selectedMonth > currentMonthKey;

  // 1. Income analysis for this month
  const incomeDetails = getMonthEffectiveIncome(selectedMonth, transactions, profile);
  const effectiveIncome = incomeDetails.totalIncome;

  // 2. Transactions for this month
  const monthTransactions = transactions.filter((t) =>
    t.date.startsWith(selectedMonth)
  );

  const totalExpenseTransactions = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // 3. Bills for this month (recurring and installments)
  const monthBills = getBillsForMonth(bills, selectedMonth);
  const recurringBills = monthBills.filter((b) => !b.isInstallment);
  const installmentBills = monthBills.filter((b) => b.isInstallment);

  const recurringPaid = recurringBills.filter((b) => b.resolvedStatus === 'paid');
  const recurringPending = recurringBills.filter((b) => b.resolvedStatus === 'pending');
  const recurringTotal = recurringBills.reduce((sum, b) => sum + b.amount, 0);

  const installmentsPaid = installmentBills.filter((b) => b.resolvedStatus === 'paid');
  const installmentsPending = installmentBills.filter((b) => b.resolvedStatus === 'pending');
  const installmentsTotal = installmentBills.reduce((sum, b) => sum + b.amount, 0);

  // 4. Daily / Variable Expenses
  const variableTransactions = monthTransactions.filter(
    (t) => t.type === 'expense' && !t.isFixed && !t.linkedBillId && !t.installment
  );
  const variableTotal = variableTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Category breakdown for variable expenses
  const variableByCategory: Record<string, number> = {};
  variableTransactions.forEach((t) => {
    variableByCategory[t.category] = (variableByCategory[t.category] || 0) + t.amount;
  });
  const sortedVariableCategories = Object.entries(variableByCategory).sort(
    (a, b) => b[1] - a[1]
  );

  // 5. Goals and Investments contributions
  const investmentTransactions = monthTransactions.filter(
    (t) =>
      t.type === 'expense' &&
      (t.category === 'Investimentos' || t.linkedInvestmentId != null)
  );
  const investmentsTotal = investmentTransactions.reduce((sum, t) => sum + t.amount, 0);

  // 6. Net Balance
  const totalCommittedExpenses =
    totalExpenseTransactions +
    recurringPending.reduce((sum, b) => sum + b.amount, 0) +
    installmentsPending.reduce((sum, b) => sum + b.amount, 0);

  const netBalance = effectiveIncome - totalExpenseTransactions;
  const projectedFreeBalance = effectiveIncome - totalCommittedExpenses;

  // 7. Future Installments Overview (lookahead for subsequent months)
  const futureMonthsKeys = [1, 2, 3].map((offset) =>
    addMonthsToKey(selectedMonth, offset)
  );
  const futureCommitments = futureMonthsKeys.map((mKey) => {
    const nextBills = getBillsForMonth(bills, mKey);
    const nextInstallments = nextBills.filter((b) => b.isInstallment);
    const totalInstAmount = nextInstallments.reduce((sum, b) => sum + b.amount, 0);
    const totalRecurAmount = nextBills
      .filter((b) => !b.isInstallment)
      .reduce((sum, b) => sum + b.amount, 0);
    return {
      monthKey: mKey,
      monthName: formatMonthYearPT(mKey),
      installmentsCount: nextInstallments.length,
      installmentsAmount: totalInstAmount,
      totalCommitted: totalInstAmount + totalRecurAmount,
      installments: nextInstallments,
    };
  });

  // Copy monthly report text
  const handleCopyReport = () => {
    const lines = [
      `📊 BALANÇO FINANCEIRO - ${formatMonthYearPT(selectedMonth).toUpperCase()}`,
      `----------------------------------------`,
      `💰 Renda / Saldo Considerado: ${formatCurrency(effectiveIncome)} ${
        incomeDetails.isCustomOverride ? `(${incomeDetails.overrideNote})` : ''
      }`,
      `💸 Gastos Totais Registrados: ${formatCurrency(totalExpenseTransactions)}`,
      `⚖️ Saldo Resultante: ${formatCurrency(netBalance)}`,
      `----------------------------------------`,
      `📌 GASTOS RELACIONADOS:`,
      `• Contas Fixas & Recorrentes: ${formatCurrency(recurringTotal)} (${recurringPaid.length} pagas, ${recurringPending.length} pendentes)`,
      `• Faturas & Parcelas de Cartão: ${formatCurrency(installmentsTotal)} (${installmentBills.length} parcelas neste mês)`,
      `• Gastos Variáveis do Dia a Dia: ${formatCurrency(variableTotal)}`,
      investmentsTotal > 0
        ? `• Aportes & Investimentos: ${formatCurrency(investmentsTotal)}`
        : '',
      `----------------------------------------`,
      `🔮 PRÓXIMOS MESES (PARCELAS E COMPROMISSOS):`,
      ...futureCommitments.map(
        (f) =>
          `• ${f.monthName}: ${formatCurrency(f.installmentsAmount)} em parcelas de cartão (Total compromissos: ${formatCurrency(f.totalCommitted)})`
      ),
      `----------------------------------------`,
      `Gerado pelo Planejador Financeiro Pessoal`,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/90 w-full max-w-xl rounded-t-3xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header with Month Navigator */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Balanço Mensal
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isCurrentMonth
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : isPastMonth
                      ? 'bg-slate-700/60 text-slate-300 border-slate-600'
                      : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                  }`}
                >
                  {isCurrentMonth
                    ? 'Mês Atual'
                    : isPastMonth
                    ? 'Mês Fechado'
                    : 'Previsão'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Detalhamento dos gastos e fechamento de contas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center justify-between bg-slate-800/80 rounded-xl p-1.5 my-3.5 border border-slate-700/60">
          <button
            onClick={() => onChangeMonth?.(prevMonthKey)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1 text-xs font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Mês Anterior</span>
          </button>

          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>{formatMonthYearPT(selectedMonth)}</span>
          </div>

          <button
            onClick={() => onChangeMonth?.(nextMonthKey)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1 text-xs font-medium"
          >
            <span className="hidden sm:inline">Próximo Mês</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Custom Salary / Balance Notice */}
        {incomeDetails.isCustomOverride && (
          <div className="mb-3 p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                <strong>Ajuste de Renda:</strong> {incomeDetails.overrideNote} (
                {formatCurrency(effectiveIncome)})
              </span>
            </div>
            {onOpenSalaryConfig && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSalaryConfig();
                }}
                className="text-[11px] underline font-bold text-blue-300 hover:text-white shrink-0 ml-2"
              >
                Editar
              </button>
            )}
          </div>
        )}

        {/* 4 Executive Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="bg-slate-800/80 border border-slate-700/70 p-3 rounded-xl">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Renda / Saldo Base
            </span>
            <span className="text-sm font-extrabold text-emerald-400 block mt-1">
              {formatCurrency(effectiveIncome)}
            </span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/70 p-3 rounded-xl">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Gastos Totais
            </span>
            <span className="text-sm font-extrabold text-rose-400 block mt-1">
              {formatCurrency(totalExpenseTransactions)}
            </span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/70 p-3 rounded-xl">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Saldo Restante
            </span>
            <span
              className={`text-sm font-extrabold block mt-1 ${
                netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(netBalance)}
            </span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/70 p-3 rounded-xl">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Livre Projetado
            </span>
            <span className="text-sm font-extrabold text-indigo-300 block mt-1">
              {formatCurrency(projectedFreeBalance)}
            </span>
          </div>
        </div>

        {/* Related Expense Groups Breakdown */}
        <div className="space-y-3.5 mb-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            Grupos de Gastos Relacionados
          </h3>

          {/* 1. Contas Fixas & Recorrentes (Academia, Streaming, Aluguel, etc.) */}
          <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Contas Fixas & Recorrentes
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Academia, moradia, internet, assinaturas recorrentes
                  </p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-slate-100">
                {formatCurrency(recurringTotal)}
              </span>
            </div>

            {recurringBills.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic py-1">
                Nenhuma conta fixa cadastrada.
              </p>
            ) : (
              <div className="space-y-1.5 mt-2">
                {recurringBills.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-900/50 border border-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      {b.resolvedStatus === 'paid' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span className="text-slate-200 font-medium">{b.name}</span>
                      <span className="text-[10px] text-slate-500">
                        (Dia {b.dueDay})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-300">
                        {formatCurrency(b.amount)}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          b.resolvedStatus === 'paid'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        {b.resolvedStatus === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Faturas & Parcelas de Cartão de Crédito */}
          <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Faturas & Parcelas do Cartão de Crédito
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Compras parceladas ativas neste mês
                  </p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-amber-300">
                {formatCurrency(installmentsTotal)}
              </span>
            </div>

            {installmentBills.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic py-1">
                Nenhuma parcela de cartão ativa para este mês.
              </p>
            ) : (
              <div className="space-y-1.5 mt-2">
                {installmentBills.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-slate-900/50 border border-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {b.resolvedInstallmentText || 'Parcelado'}
                      </span>
                      <span className="text-slate-200 font-medium">{b.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-300">
                        {formatCurrency(b.amount)}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          b.resolvedStatus === 'paid'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        {b.resolvedStatus === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Lookahead for Future Months Installments */}
            <div className="mt-3 pt-2.5 border-t border-slate-700/60">
              <span className="text-[11px] font-bold text-slate-300 block mb-1.5">
                Compromissos de Parcelas nos Próximos Meses:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {futureCommitments.map((fut) => (
                  <div
                    key={fut.monthKey}
                    className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-left"
                  >
                    <p className="text-[10px] text-slate-400 font-medium truncate">
                      {fut.monthName}
                    </p>
                    <p className="text-xs font-bold text-amber-400 mt-0.5">
                      {formatCurrency(fut.installmentsAmount)}
                    </p>
                    <p className="text-[9px] text-slate-500">
                      {fut.installmentsCount} parcelas ativas
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Gastos Variáveis do Dia a Dia */}
          <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Despesas do Dia a Dia (Variáveis)
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Alimentação, transporte, lazer e compras avulsas
                  </p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-rose-300">
                {formatCurrency(variableTotal)}
              </span>
            </div>

            {sortedVariableCategories.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic py-1">
                Nenhum gasto variável registrado neste mês.
              </p>
            ) : (
              <div className="space-y-1.5 mt-2">
                {sortedVariableCategories.map(([cat, val]) => {
                  const percent =
                    variableTotal > 0 ? Math.round((val / variableTotal) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>{cat}</span>
                        <span className="font-semibold">
                          {formatCurrency(val)} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500/80 h-full rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Projection for Next Month Box */}
        <div className="bg-gradient-to-r from-slate-800/90 to-indigo-950/60 border border-indigo-500/30 rounded-xl p-3.5 mb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-bold text-white">
              Projeção para {futureCommitments[0]?.monthName || 'Próximo Mês'}
            </h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {profile.salaryStartMonth && nextMonthKey >= profile.salaryStartMonth
              ? `A partir de ${formatMonthYearPT(profile.salaryStartMonth)}, seu salário integral de ${formatCurrency(profile.fixedSalary)} entra em vigor.`
              : `Com o salário de ${formatCurrency(profile.fixedSalary)}, `}
            você já possui{' '}
            <strong className="text-amber-300">
              {formatCurrency(futureCommitments[0]?.totalCommitted || 0)}
            </strong>{' '}
            em contas fixas e parcelas de cartão programadas.
          </p>
        </div>

        {/* Action Buttons: Copy / Export PDF and Close */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-2 border-t border-slate-800">
          {onExportPdf && (
            <button
              onClick={onExportPdf}
              className="py-2.5 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-sm shrink-0"
              title="Baixar Relatório Mensal Completo em PDF"
            >
              <Download className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          )}

          <button
            onClick={handleCopyReport}
            className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Copiado com Sucesso!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copiar Resumo do Balanço</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};

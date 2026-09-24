import React, { useState, useMemo } from 'react';
import {
  ListFilter,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  Trash2,
  Edit2,
  Calendar,
  Tag,
  Download,
  FileSpreadsheet,
  X,
  CreditCard,
  Check,
  ChevronDown,
} from 'lucide-react';
import { Transaction, TransactionType, CustomCategory } from '../types';
import {
  formatCurrency,
  formatDateBR,
  CATEGORY_COLORS,
  getTodayDateString,
  getCategoryColor,
  formatMonthYearPT,
} from '../utils/formatters';

interface TransactionListProps {
  transactions: Transaction[];
  selectedMonth: string; // YYYY-MM
  onDeleteTransaction: (id: string) => void;
  onEditTransaction?: (transaction: Transaction) => void;
  customCategories?: CustomCategory[];
  onExportPdf?: () => void;
  onExportCsv?: () => void;
  isFullPage?: boolean;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  selectedMonth,
  onDeleteTransaction,
  onEditTransaction,
  customCategories,
  onExportPdf,
  onExportCsv,
  isFullPage = false,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'month' | 'all'>('month');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedMethodFilter, setSelectedMethodFilter] = useState<string>('all');

  // Base list depending on scope
  const scopedTransactions = useMemo(() => {
    if (searchScope === 'all') {
      return transactions;
    }
    return transactions.filter((t) => t.date.startsWith(selectedMonth));
  }, [transactions, searchScope, selectedMonth]);

  // Matches in other (past/future) months for the current search query
  const matchesInOtherMonths = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || searchScope === 'all') return 0;

    return transactions.filter((t) => {
      if (t.date.startsWith(selectedMonth)) return false;
      const descMatch = t.description?.toLowerCase().includes(q);
      const catMatch = t.category?.toLowerCase().includes(q);
      const methodMatch = t.paymentMethod?.toLowerCase().includes(q);
      const cardMatch = t.cardName?.toLowerCase().includes(q);
      return descMatch || catMatch || methodMatch || cardMatch;
    }).length;
  }, [transactions, searchQuery, searchScope, selectedMonth]);

  // Unique categories in scoped transactions
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    scopedTransactions.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set).sort();
  }, [scopedTransactions]);

  // Available payment methods in scoped transactions
  const availablePaymentMethods = useMemo(() => {
    const set = new Set<string>();
    scopedTransactions.forEach((t) => {
      if (t.paymentMethod) set.add(t.paymentMethod);
    });
    return Array.from(set).sort();
  }, [scopedTransactions]);

  // Filtered transactions
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return scopedTransactions
      .filter((t) => {
        // Type filter
        if (filterType !== 'all' && t.type !== filterType) return false;

        // Category filter
        if (
          selectedCategoryFilter !== 'all' &&
          t.category.toLowerCase() !== selectedCategoryFilter.toLowerCase()
        ) {
          return false;
        }

        // Payment method filter
        if (
          selectedMethodFilter !== 'all' &&
          t.paymentMethod?.toLowerCase() !== selectedMethodFilter.toLowerCase()
        ) {
          return false;
        }

        // Text query: description, category, cardName, paymentMethod, or value
        if (q) {
          const descMatch = t.description?.toLowerCase().includes(q);
          const catMatch = t.category?.toLowerCase().includes(q);
          const methodMatch = t.paymentMethod?.toLowerCase().includes(q);
          const cardMatch = t.cardName?.toLowerCase().includes(q);
          const valueMatch = t.amount.toString().includes(q);
          if (!descMatch && !catMatch && !methodMatch && !cardMatch && !valueMatch) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  }, [scopedTransactions, filterType, selectedCategoryFilter, selectedMethodFilter, searchQuery]);

  // Summary of filtered results
  const filteredStats = useMemo(() => {
    let totalExpense = 0;
    let totalIncome = 0;
    filtered.forEach((t) => {
      if (t.type === 'expense') totalExpense += t.amount;
      else totalIncome += t.amount;
    });
    return {
      count: filtered.length,
      totalExpense,
      totalIncome,
      net: totalIncome - totalExpense,
    };
  }, [filtered]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    filtered.forEach((t) => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return map;
  }, [filtered]);

  const todayStr = getTodayDateString();
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    filterType !== 'all' ||
    selectedCategoryFilter !== 'all' ||
    selectedMethodFilter !== 'all' ||
    searchScope !== 'month';

  const resetFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setSelectedCategoryFilter('all');
    setSelectedMethodFilter('all');
    setSearchScope('month');
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm space-y-3">
      {/* Header & Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-700 text-slate-200 flex items-center justify-center shrink-0">
            <ListFilter className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">
              {searchScope === 'all' ? 'Histórico Geral' : 'Histórico do Mês'}
            </h2>
            <p className="text-[11px] text-slate-400">
              {searchScope === 'all'
                ? `${filtered.length} lançamentos em todo o histórico`
                : `${filtered.length} transações em ${formatMonthYearPT(selectedMonth)}`}
            </p>
          </div>
        </div>

        {/* Filter Type Pills */}
        <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-700/60 text-xs">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-2 py-1 font-semibold rounded-lg transition-colors ${
              filterType === 'all'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setFilterType('expense')}
            className={`px-2 py-1 font-semibold rounded-lg transition-colors ${
              filterType === 'expense'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Gastos
          </button>
          <button
            type="button"
            onClick={() => setFilterType('income')}
            className={`px-2 py-1 font-semibold rounded-lg transition-colors ${
              filterType === 'income'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Rendas
          </button>
        </div>
      </div>

      {/* Scope Selector: Selected Month vs All History */}
      <div className="flex items-center justify-between text-xs bg-slate-900/60 p-1.5 rounded-xl border border-slate-700/50">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-medium pl-1">Período:</span>
          <button
            type="button"
            onClick={() => setSearchScope('month')}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              searchScope === 'month'
                ? 'bg-slate-800 text-teal-300 border border-teal-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Mês Ativo ({formatMonthYearPT(selectedMonth)})
          </button>
          <button
            type="button"
            onClick={() => setSearchScope('all')}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              searchScope === 'all'
                ? 'bg-slate-800 text-teal-300 border border-teal-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Todo o Histórico ({transactions.length})
          </button>
        </div>

        {/* Action buttons (CSV / PDF) */}
        <div className="flex items-center gap-1">
          {onExportCsv && (
            <button
              type="button"
              onClick={onExportCsv}
              className="p-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"
              title="Exportar dados para Excel / Planilha (CSV)"
            >
              <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          )}

          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              className="p-1 px-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"
              title="Exportar Resumo e Extrato em PDF"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Input with Clear Button */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar por descrição, categoria, cartão ou valor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-200"
            title="Limpar busca"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Cross-month search suggestion banner for past expenses */}
      {matchesInOtherMonths > 0 && searchScope === 'month' && (
        <div className="bg-gradient-to-r from-teal-950/60 to-slate-900 border border-teal-500/40 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 text-xs font-bold">
              🔍
            </span>
            <p className="text-[11px] text-teal-200 truncate">
              Encontramos <strong>{matchesInOtherMonths}</strong> gasto{matchesInOtherMonths > 1 ? 's' : ''} em outros meses para "{searchQuery}".
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSearchScope('all')}
            className="text-[11px] font-bold text-teal-300 hover:text-white bg-teal-600/40 hover:bg-teal-600/70 px-2.5 py-1 rounded-lg border border-teal-500/50 shrink-0 transition-all active:scale-95"
          >
            Ver em todo histórico
          </button>
        </div>
      )}

      {/* Category Chips Bar (when available) */}
      {availableCategories.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 transition-all ${
              selectedCategoryFilter === 'all'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Todas Categorias
          </button>
          {availableCategories.map((cat) => {
            const isSelected = selectedCategoryFilter.toLowerCase() === cat.toLowerCase();
            const color = getCategoryColor(cat, customCategories);
            return (
              <button
                key={cat}
                type="button"
                onClick={() =>
                  setSelectedCategoryFilter(isSelected ? 'all' : cat)
                }
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium shrink-0 transition-all ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Payment Method Chips Bar */}
      {availablePaymentMethods.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
          <span className="text-[10px] text-slate-400 font-medium pl-0.5 shrink-0">Método:</span>
          <button
            type="button"
            onClick={() => setSelectedMethodFilter('all')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium shrink-0 transition-all ${
              selectedMethodFilter === 'all'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Todos
          </button>
          {availablePaymentMethods.map((method) => {
            const isSelected = selectedMethodFilter.toLowerCase() === method.toLowerCase();
            const isDebit = method.toLowerCase().includes('débito');
            const isCredit = method.toLowerCase().includes('crédito');
            return (
              <button
                key={method}
                type="button"
                onClick={() => setSelectedMethodFilter(isSelected ? 'all' : method)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium shrink-0 transition-all ${
                  isSelected
                    ? isDebit
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : isCredit
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-900/60 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                {isDebit ? (
                  <CreditCard className="w-2.5 h-2.5 text-cyan-300" />
                ) : isCredit ? (
                  <CreditCard className="w-2.5 h-2.5 text-purple-300" />
                ) : null}
                <span>{method}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Dynamic Results Summary Bar when filtering */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-700/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-bold">
              {filteredStats.count} {filteredStats.count === 1 ? 'resultado' : 'resultados'}
            </span>
            <span className="text-slate-500">•</span>
            {filteredStats.totalExpense > 0 && (
              <span className="text-rose-400 font-semibold">
                Gastos: -{formatCurrency(filteredStats.totalExpense)}
              </span>
            )}
            {filteredStats.totalIncome > 0 && (
              <span className="text-emerald-400 font-semibold">
                Renda: +{formatCurrency(filteredStats.totalIncome)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="text-[11px] text-teal-400 font-bold hover:underline"
          >
            Limpar Filtros
          </button>
        </div>
      )}

      {/* Grouped Transaction List */}
      {Object.keys(groupedByDate).length === 0 ? (
        <div className="text-center py-10 px-4 bg-slate-900/40 rounded-xl border border-dashed border-slate-700/70 space-y-2">
          <Search className="w-5 h-5 text-slate-500 mx-auto" />
          <p className="text-xs font-semibold text-slate-300">
            Nenhum lançamento encontrado
          </p>
          <p className="text-[11px] text-slate-500">
            {searchQuery
              ? `Não foram encontrados lançamentos para "${searchQuery}". Tente outros termos ou limpe os filtros.`
              : 'Nenhuma movimentação registrada para os critérios selecionados.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-1 text-xs text-teal-400 font-bold underline"
            >
              Restaurar todos os lançamentos
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {Object.entries(groupedByDate).map(([dateStr, items]) => {
            const dayTotal = items.reduce(
              (acc, item) =>
                item.type === 'expense' ? acc - item.amount : acc + item.amount,
              0
            );

            const isToday = dateStr === todayStr;

            return (
              <div key={dateStr} className="space-y-1.5">
                {/* Date subheader */}
                <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {isToday ? 'Hoje' : formatDateBR(dateStr)}
                  </span>
                  <span
                    className={`font-bold ${
                      dayTotal >= 0 ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {dayTotal >= 0 ? '+' : ''}
                    {formatCurrency(dayTotal)}
                  </span>
                </div>

                {/* Items in date */}
                <div className="space-y-1.5">
                  {items.map((tx) => {
                    const isExpense = tx.type === 'expense';
                    const color = getCategoryColor(tx.category, customCategories);

                    return (
                      <div
                        key={tx.id}
                        className="bg-slate-900/70 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2 hover:border-slate-700 transition-all group"
                      >
                        <div
                          onClick={() => onEditTransaction && onEditTransaction(tx)}
                          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                          title="Clique para editar este lançamento"
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isExpense
                                ? 'bg-rose-500/15 text-rose-400'
                                : 'bg-emerald-500/15 text-emerald-400'
                            }`}
                          >
                            {isExpense ? (
                              <ArrowDownRight className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-100 truncate flex items-center gap-1.5">
                              <span>{tx.description}</span>
                              {tx.cardName && (
                                <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                                  {tx.cardName}
                                </span>
                              )}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 flex-wrap">
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: color }}
                              />
                              <span>{tx.category}</span>
                              <span>•</span>
                              {tx.paymentMethod === 'Cartão de Débito' ? (
                                <span
                                  className="inline-flex items-center gap-1 text-[9px] bg-cyan-500/15 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/25 font-semibold"
                                  title="Debitado na hora do saldo da conta corrente"
                                >
                                  <CreditCard className="w-2.5 h-2.5 text-cyan-400" />
                                  Débito (Conta)
                                </span>
                              ) : tx.paymentMethod === 'Cartão de Crédito' ? (
                                <span
                                  className="inline-flex items-center gap-1 text-[9px] bg-purple-500/15 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/25 font-semibold"
                                  title="Lançado na fatura do cartão de crédito"
                                >
                                  <CreditCard className="w-2.5 h-2.5 text-purple-400" />
                                  Crédito (Fatura)
                                </span>
                              ) : tx.paymentMethod === 'Pix' ? (
                                <span className="inline-flex items-center gap-1 text-[9px] bg-teal-500/15 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/25 font-medium">
                                  Pix
                                </span>
                              ) : (
                                <span>{tx.paymentMethod}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-xs font-bold ${
                              isExpense ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {isExpense ? '-' : '+'}
                            {formatCurrency(tx.amount)}
                          </span>

                          {onEditTransaction && (
                            <button
                              type="button"
                              onClick={() => onEditTransaction(tx)}
                              className="p-1 rounded text-slate-500 hover:text-teal-300 opacity-70 group-hover:opacity-100 transition-opacity"
                              title="Editar lançamento"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onDeleteTransaction(tx.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 opacity-60 group-hover:opacity-100 transition-opacity"
                            title="Excluir lançamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

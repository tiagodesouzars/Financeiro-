import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  Building2,
  Calendar,
  Sparkles,
  Lock,
  ArrowDownRight,
  Search,
  Filter,
  Layers,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Wallet,
  Zap,
} from 'lucide-react';
import { PaymentCard, CardType, Transaction, FixedBill, PaymentMethod } from '../types';
import { formatCurrency, formatMonthYearPT, formatDateBR } from '../utils/formatters';
import { getCardUsage, isTransactionForCard } from '../utils/storage';

interface CardsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: PaymentCard[];
  onSaveCard: (card: PaymentCard) => void;
  onDeleteCard: (cardId: string) => void;
  transactions: Transaction[];
  bills: FixedBill[];
  selectedMonth: string;
}

const PRESET_BANKS = [
  { name: 'Nubank', color: '#820ad1' },
  { name: 'Inter', color: '#ff7a00' },
  { name: 'Itaú', color: '#ec7000' },
  { name: 'Bradesco', color: '#cc092f' },
  { name: 'Santander', color: '#e60000' },
  { name: 'C6 Bank', color: '#242424' },
  { name: 'Banco do Brasil', color: '#fbf400' },
  { name: 'Caixa', color: '#005ca9' },
  { name: 'Outro', color: '#334155' },
];

const CARD_COLORS = [
  { name: 'Roxo Nubank', value: '#820ad1' },
  { name: 'Laranja Inter', value: '#ff7a00' },
  { name: 'Azul Itaú / Safra', value: '#0f4c81' },
  { name: 'Vermelho Santander', value: '#e60000' },
  { name: 'Grafite Black', value: '#1e293b' },
  { name: 'Dourado Gold', value: '#b45309' },
  { name: 'Verde Esmeralda', value: '#059669' },
  { name: 'Prata Platinum', value: '#475569' },
];

export const CardsManagerModal: React.FC<CardsManagerModalProps> = ({
  isOpen,
  onClose,
  cards,
  onSaveCard,
  onDeleteCard,
  transactions,
  bills,
  selectedMonth,
}) => {
  // Modal active tab: 'overview' (Meus Cartões) vs 'statement' (Extrato & Compras)
  const [activeTab, setActiveTab] = useState<'overview' | 'statement'>('overview');
  const [selectedCardIdForStatement, setSelectedCardIdForStatement] = useState<string>(
    cards[0]?.id || ''
  );

  // Statement Filters
  const [statementFilterMethod, setStatementFilterMethod] = useState<'all' | 'credit' | 'debit'>('all');
  const [statementFilterPeriod, setStatementFilterPeriod] = useState<'month' | 'all'>('month');
  const [statementSearchQuery, setStatementSearchQuery] = useState('');

  // Form State for Adding / Editing Cards
  const [isEditing, setIsEditing] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [bank, setBank] = useState('Nubank');
  const [name, setName] = useState('');
  const [type, setType] = useState<CardType>('both');
  const [totalLimit, setTotalLimit] = useState('');
  const [dueDay, setDueDay] = useState('10');
  const [closingDay, setClosingDay] = useState('3');
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [color, setColor] = useState('#820ad1');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-select first card if selected card was deleted or empty
  React.useEffect(() => {
    if (cards.length > 0 && (!selectedCardIdForStatement || !cards.some((c) => c.id === selectedCardIdForStatement))) {
      setSelectedCardIdForStatement(cards[0].id);
    }
  }, [cards, selectedCardIdForStatement]);

  if (!isOpen) return null;

  const selectedCard = cards.find((c) => c.id === selectedCardIdForStatement) || cards[0];

  const handleOpenAdd = () => {
    setEditingCardId(null);
    setBank('Nubank');
    setName('Nubank Mastercard');
    setType('both');
    setTotalLimit('3500');
    setDueDay('10');
    setClosingDay('3');
    setLastFourDigits('');
    setColor('#820ad1');
    setErrorMsg('');
    setIsEditing(true);
  };

  const handleOpenEdit = (c: PaymentCard) => {
    setEditingCardId(c.id);
    setBank(c.bank);
    setName(c.name);
    setType(c.type);
    setTotalLimit(String(c.totalLimit));
    setDueDay(String(c.dueDay));
    setClosingDay(String(c.closingDay || Math.max(1, c.dueDay - 7)));
    setLastFourDigits(c.lastFourDigits || '');
    setColor(c.color || '#1e293b');
    setErrorMsg('');
    setIsEditing(true);
  };

  const handleSelectBankPreset = (presetName: string, presetColor: string) => {
    setBank(presetName);
    setColor(presetColor);
    if (!name || name === 'Nubank Mastercard' || PRESET_BANKS.some((b) => b.name === name)) {
      setName(presetName === 'Outro' ? 'Meu Cartão' : `${presetName} Card`);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Informe o nome ou apelido do cartão.');
      return;
    }

    const limitVal = parseFloat(totalLimit.replace(',', '.')) || 0;
    if (type !== 'debit' && limitVal <= 0) {
      setErrorMsg('Informe o limite total do cartão de crédito.');
      return;
    }

    const dueVal = parseInt(dueDay, 10);
    if (isNaN(dueVal) || dueVal < 1 || dueVal > 31) {
      setErrorMsg('Dia de vencimento inválido (de 1 a 31).');
      return;
    }

    const closingVal = parseInt(closingDay, 10) || Math.max(1, dueVal - 7);

    const card: PaymentCard = {
      id: editingCardId || `card-${Date.now()}`,
      bank: bank.trim() || 'Outro',
      name: name.trim(),
      type,
      totalLimit: type === 'debit' ? 0 : limitVal,
      dueDay: dueVal,
      closingDay: closingVal,
      lastFourDigits: lastFourDigits.replace(/\D/g, '').slice(0, 4) || undefined,
      color,
      createdAt: Date.now(),
    };

    onSaveCard(card);
    setSelectedCardIdForStatement(card.id);
    setIsEditing(false);
  };

  const handleCardClick = (c: PaymentCard) => {
    setSelectedCardIdForStatement(c.id);
    setActiveTab('statement');
  };

  // Transactions belonging to the currently selected card
  const cardTransactions = useMemo(() => {
    if (!selectedCard) return [];
    return transactions.filter((t) => isTransactionForCard(t, selectedCard, cards));
  }, [selectedCard, transactions, cards]);

  // Filtered card transactions for the statement list
  const filteredStatementTransactions = useMemo(() => {
    return cardTransactions.filter((t) => {
      // Filter by payment method
      if (statementFilterMethod === 'credit' && t.paymentMethod !== 'Cartão de Crédito') {
        return false;
      }
      if (statementFilterMethod === 'debit' && t.paymentMethod !== 'Cartão de Débito') {
        return false;
      }

      // Filter by period
      if (statementFilterPeriod === 'month' && !t.date.startsWith(selectedMonth)) {
        return false;
      }

      // Filter by search text
      if (statementSearchQuery.trim()) {
        const query = statementSearchQuery.toLowerCase().trim();
        const descMatch = (t.description || '').toLowerCase().includes(query);
        const catMatch = (t.category || '').toLowerCase().includes(query);
        const amountMatch = t.amount.toString().includes(query);
        if (!descMatch && !catMatch && !amountMatch) {
          return false;
        }
      }

      return true;
    });
  }, [cardTransactions, statementFilterMethod, statementFilterPeriod, statementSearchQuery, selectedMonth]);

  // Aggregated totals for filtered statement
  const totalCreditFiltered = filteredStatementTransactions
    .filter((t) => t.type === 'expense' && t.paymentMethod === 'Cartão de Crédito')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebitFiltered = filteredStatementTransactions
    .filter((t) => t.type === 'expense' && t.paymentMethod === 'Cartão de Débito')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalAllFiltered = totalCreditFiltered + totalDebitFiltered;

  // Selected card usage calculations
  const selectedCardUsage = selectedCard
    ? getCardUsage(selectedCard, transactions, bills, selectedMonth, cards)
    : null;

  const usagePercent =
    selectedCard && selectedCard.totalLimit > 0 && selectedCardUsage
      ? Math.min(100, Math.round((selectedCardUsage.totalCommittedLimit / selectedCard.totalLimit) * 100))
      : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[94vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                <span>Meus Cartões</span>
                <span className="text-[10px] text-purple-400 font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                  {cards.length} {cards.length === 1 ? 'cartão' : 'cartões'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Limites, faturas e extrato de compras no crédito e débito
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
            aria-label="Fechar modal de cartões"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Switcher (Overview vs Extrato & Compras) */}
        {!isEditing && (
          <div className="px-4 pt-3 pb-1 border-b border-slate-800/80 bg-slate-900/80 flex items-center gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'overview'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Visão dos Cartões</span>
            </button>
            <button
              onClick={() => setActiveTab('statement')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'statement'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Extrato & Compras</span>
              {cardTransactions.length > 0 && (
                <span className="text-[10px] bg-black/30 px-1.5 py-0.2 rounded-full font-mono">
                  {cardTransactions.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 pb-6">
          {!isEditing ? (
            activeTab === 'overview' ? (
              /* TAB 1: VISÃO GERAL DOS CARTÕES */
              <>
                <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      Gerenciamento e Limites
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Clique em um cartão para abrir o extrato de compras
                    </span>
                  </div>
                  <button
                    onClick={handleOpenAdd}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Cartão
                  </button>
                </div>

                {cards.length === 0 ? (
                  <div className="text-center py-10 px-4 space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 mx-auto flex items-center justify-center border border-purple-500/20">
                      <CreditCard className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">
                        Nenhum cartão cadastrado ainda
                      </h3>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                        Cadastre seus cartões de crédito e débito para acompanhar o limite comprometido global e segregar débitos da conta corrente.
                      </p>
                    </div>
                    <button
                      onClick={handleOpenAdd}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-500/20"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Nubank, Inter ou Outro
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cards.map((c) => {
                      const usage = getCardUsage(c, transactions, bills, selectedMonth, cards);
                      const usagePercentCard =
                        c.totalLimit > 0
                          ? Math.min(100, Math.round((usage.totalCommittedLimit / c.totalLimit) * 100))
                          : 0;
                      const txCount = transactions.filter((t) => isTransactionForCard(t, c, cards)).length;

                      return (
                        <div
                          key={c.id}
                          className="rounded-2xl border border-slate-700/80 p-4 relative overflow-hidden shadow-lg transition-all hover:border-purple-500/50 group"
                          style={{
                            background: `linear-gradient(135deg, ${c.color || '#1e293b'}dd 0%, #0f172a 100%)`,
                          }}
                        >
                          {/* Ambient glow */}
                          <div
                            className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-2xl opacity-30 pointer-events-none"
                            style={{ backgroundColor: c.color || '#a855f7' }}
                          />

                          {/* Top Card Info */}
                          <div className="flex items-start justify-between relative z-10">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200/90 bg-black/30 px-2 py-0.5 rounded-full border border-white/10">
                                  {c.bank}
                                </span>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                                    c.type === 'both'
                                      ? 'bg-purple-950/60 border-purple-500/30 text-purple-200'
                                      : c.type === 'credit'
                                      ? 'bg-indigo-950/60 border-indigo-500/30 text-indigo-200'
                                      : 'bg-cyan-950/60 border-cyan-500/30 text-cyan-200'
                                  }`}
                                >
                                  {c.type === 'both'
                                    ? 'Crédito & Débito'
                                    : c.type === 'credit'
                                    ? 'Apenas Crédito'
                                    : 'Apenas Débito'}
                                </span>
                              </div>
                              <h3 className="text-base font-bold text-white mt-1">
                                {c.name}
                              </h3>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(c);
                                }}
                                className="p-1.5 text-slate-300 hover:text-white bg-black/20 hover:bg-black/40 rounded-lg transition-colors"
                                title="Editar cartão"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Deseja excluir o cartão "${c.name}"?`)) {
                                    onDeleteCard(c.id);
                                  }
                                }}
                                className="p-1.5 text-rose-300 hover:text-rose-100 bg-black/20 hover:bg-rose-950/60 rounded-lg transition-colors"
                                title="Excluir cartão"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Last 4 Digits & Chip visual */}
                          <div className="mt-3 flex items-center justify-between text-xs text-slate-300/80 font-mono tracking-widest relative z-10">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-4 rounded bg-amber-400/80 border border-amber-300 flex items-center justify-center text-[7px] text-slate-900 font-bold font-sans">
                                CHIP
                              </div>
                              <span>•••• •••• •••• {c.lastFourDigits || '••••'}</span>
                            </div>
                            <span className="text-[10px] text-slate-300/70 font-sans tracking-normal">
                              {txCount} {txCount === 1 ? 'compra' : 'compras'}
                            </span>
                          </div>

                          {/* Credit Limit & Availability */}
                          {c.type !== 'debit' ? (
                            <div className="mt-3.5 pt-3 border-t border-white/10 relative z-10 space-y-2">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-[11px] text-slate-300/70 block">
                                    Limite Total Aprovado
                                  </span>
                                  <span className="text-sm font-bold text-white">
                                    {formatCurrency(c.totalLimit)}
                                  </span>
                                </div>

                                <div className="text-right">
                                  <span className="text-[11px] text-emerald-300/90 block font-semibold flex items-center justify-end gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    Limite Disponível Global
                                  </span>
                                  <span className="text-sm font-extrabold text-emerald-400">
                                    {formatCurrency(usage.availableLimit)}
                                  </span>
                                </div>
                              </div>

                              {/* Progress bar of limit committed */}
                              <div>
                                <div className="flex items-center justify-between text-[10px] text-slate-300/80 mb-1">
                                  <span className="flex items-center gap-1">
                                    <Lock className="w-2.5 h-2.5 text-amber-400" />
                                    Total Comprometido (Faturas + Parcelas Futuras):{' '}
                                    <strong>{formatCurrency(usage.totalCommittedLimit)}</strong>
                                  </span>
                                  <span className="font-bold">{usagePercentCard}%</span>
                                </div>
                                <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/10">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      usagePercentCard > 85
                                        ? 'bg-rose-500'
                                        : usagePercentCard > 60
                                        ? 'bg-amber-400'
                                        : 'bg-emerald-400'
                                    }`}
                                    style={{ width: `${usagePercentCard}%` }}
                                  />
                                </div>
                              </div>

                              {/* Month invoice vs future installments summary */}
                              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-200">
                                <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                                  <span className="text-[10px] text-slate-400 block">Fatura {formatMonthYearPT(selectedMonth)}</span>
                                  <span className="font-bold text-purple-300">{formatCurrency(usage.monthInvoiceAmount)}</span>
                                </div>
                                <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                                  <span className="text-[10px] text-slate-400 block">Parcelas Futuras</span>
                                  <span className="font-bold text-amber-300">
                                    {usage.futureInstallmentsTotal ? formatCurrency(usage.futureInstallmentsTotal) : 'R$ 0,00'}{' '}
                                    <span className="text-[9px] font-normal text-slate-400">({usage.futureInstallmentsCount} parc.)</span>
                                  </span>
                                </div>
                              </div>

                              {/* Due date info & CTA button */}
                              <div className="flex items-center justify-between text-[11px] text-slate-300/90 pt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-300" />
                                  Vencimento: <strong>Dia {c.dueDay}</strong>
                                </span>
                                <button
                                  onClick={() => handleCardClick(c)}
                                  className="text-xs text-purple-300 hover:text-white font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/40 hover:bg-black/60 transition-all border border-white/10"
                                >
                                  <span>Ver Compras & Limites</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Only Debit Card */
                            <div className="mt-3.5 pt-3 border-t border-white/10 relative z-10 space-y-2 text-xs">
                              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Zap className="w-4 h-4 text-cyan-400" />
                                  <div>
                                    <span className="text-[11px] font-bold text-cyan-200 block">
                                      Débito Direto em Conta Corrente
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      Debitado na hora do saldo • Sem fatura nem bloqueio de limite
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleCardClick(c)}
                                  className="text-xs text-cyan-300 hover:text-white font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/40 hover:bg-black/60 transition-all border border-white/10 shrink-0 ml-2"
                                >
                                  <span>Ver Compras</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              /* TAB 2: EXTRATO & COMPRAS DO CARTÃO SELECIONADO */
              <div className="space-y-4">
                {/* Card Switcher Chips */}
                {cards.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {cards.map((c) => {
                      const isCurr = c.id === selectedCard?.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCardIdForStatement(c.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 border transition-all ${
                            isCurr
                              ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: c.color || '#a855f7' }}
                          />
                          <span>{c.bank} - {c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedCard && (
                  <>
                    {/* Visual Card Summary Header */}
                    <div
                      className="rounded-2xl border border-slate-700/80 p-4 relative overflow-hidden shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${selectedCard.color || '#1e293b'}dd 0%, #0f172a 100%)`,
                      }}
                    >
                      <div className="flex items-start justify-between relative z-10">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200/90 bg-black/30 px-2 py-0.5 rounded-full border border-white/10">
                              {selectedCard.bank}
                            </span>
                            <span className="text-[10px] text-slate-300 font-medium">
                              {selectedCard.type === 'both'
                                ? 'Crédito & Débito'
                                : selectedCard.type === 'credit'
                                ? 'Crédito'
                                : 'Débito'}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-white mt-1">
                            {selectedCard.name}
                          </h3>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono tracking-widest text-slate-300 block">
                            •••• {selectedCard.lastFourDigits || '••••'}
                          </span>
                          {selectedCard.type !== 'debit' && (
                            <span className="text-[10px] text-slate-300 font-medium">
                              Venc: Dia {selectedCard.dueDay}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Limit Breakdown Block for Credit Cards */}
                      {selectedCard.type !== 'debit' && selectedCardUsage && (
                        <div className="mt-3.5 pt-3 border-t border-white/10 relative z-10 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-300/70 block">
                                Limite Total Aprovado
                              </span>
                              <span className="text-sm font-bold text-white">
                                {formatCurrency(selectedCard.totalLimit)}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-emerald-300/90 block font-semibold flex items-center justify-end gap-1">
                                <Sparkles className="w-3 h-3" />
                                Limite Disponível Global
                              </span>
                              <span className="text-sm font-extrabold text-emerald-400">
                                {formatCurrency(selectedCardUsage.availableLimit)}
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div>
                            <div className="flex items-center justify-between text-[10px] text-slate-300/80 mb-1">
                              <span className="flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5 text-amber-400" />
                                Comprometido: <strong>{formatCurrency(selectedCardUsage.totalCommittedLimit)}</strong>
                              </span>
                              <span>{usagePercent}%</span>
                            </div>
                            <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/10">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  usagePercent > 85
                                    ? 'bg-rose-500'
                                    : usagePercent > 60
                                    ? 'bg-amber-400'
                                    : 'bg-emerald-400'
                                }`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          </div>

                          {/* Limit Commitment Breakdown Cards */}
                          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                            <div className="bg-black/35 rounded-xl p-2.5 border border-white/10">
                              <span className="text-[10px] text-slate-400 block font-medium">
                                Fatura do Mês Atual
                              </span>
                              <span className="text-xs font-bold text-purple-300">
                                {formatCurrency(selectedCardUsage.monthInvoiceAmount)}
                              </span>
                            </div>

                            <div className="bg-black/35 rounded-xl p-2.5 border border-white/10">
                              <span className="text-[10px] text-slate-400 block font-medium">
                                Parcelas Futuras a Vencer
                              </span>
                              <span className="text-xs font-bold text-amber-300">
                                {selectedCardUsage.futureInstallmentsTotal
                                  ? formatCurrency(selectedCardUsage.futureInstallmentsTotal)
                                  : 'R$ 0,00'}
                              </span>
                              <span className="text-[9px] text-slate-400 block mt-0.5">
                                {selectedCardUsage.futureInstallmentsCount} parcelas nos meses seguintes
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Explanatory notice: Débito vs Crédito */}
                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px] space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-200">
                        <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                        <span>Entenda a segregação de Débito e Crédito:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-slate-400 pt-0.5">
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-750">
                          <p className="font-semibold text-purple-300 flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            Compras no Crédito
                          </p>
                          <p className="mt-0.5">
                            Comprometem o limite do cartão e entram na fatura para pagamento no dia {selectedCard.dueDay}.
                          </p>
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-750">
                          <p className="font-semibold text-cyan-300 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Compras no Débito
                          </p>
                          <p className="mt-0.5">
                            Descontadas no ato do saldo bancário em conta corrente. <strong>NÃO reduzem o limite de crédito</strong> nem afetam a fatura.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Filters Toolbar */}
                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 space-y-2.5">
                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={statementSearchQuery}
                          onChange={(e) => setStatementSearchQuery(e.target.value)}
                          placeholder="Buscar compras por descrição, categoria ou valor..."
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                        />
                        {statementSearchQuery && (
                          <button
                            onClick={() => setStatementSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Filters: Method & Period */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {/* Method Filter */}
                        <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-xl border border-slate-750">
                          <button
                            onClick={() => setStatementFilterMethod('all')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                              statementFilterMethod === 'all'
                                ? 'bg-purple-600 text-white'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Todos
                          </button>
                          <button
                            onClick={() => setStatementFilterMethod('credit')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${
                              statementFilterMethod === 'credit'
                                ? 'bg-purple-600 text-white'
                                : 'text-purple-400 hover:text-purple-300'
                            }`}
                          >
                            <span>Crédito</span>
                          </button>
                          <button
                            onClick={() => setStatementFilterMethod('debit')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${
                              statementFilterMethod === 'debit'
                                ? 'bg-cyan-600 text-white'
                                : 'text-cyan-400 hover:text-cyan-300'
                            }`}
                          >
                            <span>Débito</span>
                          </button>
                        </div>

                        {/* Period Filter */}
                        <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-xl border border-slate-750">
                          <button
                            onClick={() => setStatementFilterPeriod('month')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                              statementFilterPeriod === 'month'
                                ? 'bg-slate-700 text-white font-bold'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {formatMonthYearPT(selectedMonth)}
                          </button>
                          <button
                            onClick={() => setStatementFilterPeriod('all')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                              statementFilterPeriod === 'all'
                                ? 'bg-slate-700 text-white font-bold'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Histórico Todo
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Summary Strip for Filtered Purchases */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-center">
                      <div>
                        <span className="text-[10px] text-purple-400 font-semibold block">
                          Crédito (Fatura)
                        </span>
                        <span className="text-xs font-bold text-slate-100">
                          {formatCurrency(totalCreditFiltered)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-cyan-400 font-semibold block">
                          Débito (Conta)
                        </span>
                        <span className="text-xs font-bold text-slate-100">
                          {formatCurrency(totalDebitFiltered)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          Total Movimentado
                        </span>
                        <span className="text-xs font-bold text-emerald-400">
                          {formatCurrency(totalAllFiltered)}
                        </span>
                      </div>
                    </div>

                    {/* Transactions List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                        <span className="font-semibold text-slate-300">
                          Lançamentos do Cartão ({filteredStatementTransactions.length})
                        </span>
                        <span>{statementFilterPeriod === 'month' ? formatMonthYearPT(selectedMonth) : 'Todos'}</span>
                      </div>

                      {filteredStatementTransactions.length === 0 ? (
                        <div className="text-center py-8 px-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                          <p className="text-xs font-semibold text-slate-300">
                            Nenhuma compra encontrada neste filtro
                          </p>
                          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                            Ao registrar gastos no botão '+' do app e selecionar este cartão, eles aparecerão detalhados aqui com segregação de débito e crédito.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filteredStatementTransactions.map((tx) => {
                            const isCredit = tx.paymentMethod === 'Cartão de Crédito';
                            const isDebit = tx.paymentMethod === 'Cartão de Débito';

                            return (
                              <div
                                key={tx.id}
                                className="bg-slate-850 p-3 rounded-xl border border-slate-750 flex items-center justify-between hover:bg-slate-800 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                                      isCredit
                                        ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                        : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                                    }`}
                                  >
                                    {isCredit ? (
                                      <CreditCard className="w-4 h-4" />
                                    ) : (
                                      <Zap className="w-4 h-4" />
                                    )}
                                  </div>

                                  <div>
                                    <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                                      <span>{tx.description}</span>
                                      {tx.installment && (
                                        <span className="text-[10px] text-amber-300 font-semibold px-1.5 py-0.2 rounded-md bg-amber-500/10 border border-amber-500/20 font-mono">
                                          {tx.installment.current}/{tx.installment.total}
                                        </span>
                                      )}
                                    </h4>

                                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                                      <span>{formatDateBR(tx.date)}</span>
                                      <span>•</span>
                                      <span>{tx.category}</span>
                                      <span>•</span>
                                      <span
                                        className={`font-semibold ${
                                          isCredit ? 'text-purple-400' : 'text-cyan-400'
                                        }`}
                                      >
                                        {isCredit ? 'Crédito' : 'Débito'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <span className="text-xs sm:text-sm font-bold text-rose-400 block font-mono">
                                    - {formatCurrency(tx.amount)}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {isCredit ? 'Fatura' : 'Débito Conta'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          ) : (
            /* ADD / EDIT FORM */
            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-slate-200">
                  {editingCardId ? 'Editar Cartão' : 'Novo Cartão'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Voltar
                </button>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Bank Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Instituição Financeira / Banco
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {PRESET_BANKS.map((b) => (
                    <button
                      key={b.name}
                      type="button"
                      onClick={() => handleSelectBankPreset(b.name, b.color)}
                      className={`px-2 py-1.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                        bank === b.name
                          ? 'bg-slate-700 text-white border-purple-500 shadow-sm'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: b.color }}
                      />
                      <span className="truncate">{b.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Name / Nickname */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome / Apelido do Cartão
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Nubank Ultravioleta, Inter Gold"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Card Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tipo de Operação do Cartão
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('both')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      type === 'both'
                        ? 'bg-purple-600 text-white border-purple-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Crédito e Débito
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('credit')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      type === 'credit'
                        ? 'bg-purple-600 text-white border-purple-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Apenas Crédito
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('debit')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      type === 'debit'
                        ? 'bg-purple-600 text-white border-purple-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Apenas Débito
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {type === 'both'
                    ? 'Permite compras no crédito (com limite e fatura) e no débito (direto na conta).'
                    : type === 'credit'
                    ? 'Somente transações com fatura e limite de crédito.'
                    : 'Somente débito direto da conta bancária (sem limite nem fatura).'}
                </p>
              </div>

              {/* Limit, Due Day, Closing Day (If credit enabled) */}
              {type !== 'debit' && (
                <div className="space-y-3 bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Limite Total do Cartão de Crédito (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={totalLimit}
                      onChange={(e) => setTotalLimit(e.target.value)}
                      placeholder="Ex: 5000.00"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Dia do Vencimento
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={dueDay}
                        onChange={(e) => setDueDay(e.target.value)}
                        placeholder="Ex: 10"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Dia do Fechamento
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={closingDay}
                        onChange={(e) => setClosingDay(e.target.value)}
                        placeholder="Ex: 3"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Digits & Color Theme */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Últimos 4 Dígitos (Opcional)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={lastFourDigits}
                    onChange={(e) => setLastFourDigits(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 4821"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500 text-center font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cor Visual do Cartão
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {CARD_COLORS.map((col) => (
                      <button
                        key={col.value}
                        type="button"
                        onClick={() => setColor(col.value)}
                        style={{ backgroundColor: col.value }}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          color === col.value ? 'scale-110 border-white' : 'border-transparent opacity-80'
                        }`}
                        title={col.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/20"
                >
                  <Check className="w-4 h-4" />
                  Salvar Cartão
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

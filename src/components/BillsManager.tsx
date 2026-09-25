import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Bell,
  BellOff,
  ChevronDown,
  X,
  FileText,
  Calendar,
  Repeat,
  Layers,
  Sparkles,
  ChevronRight,
  Info,
  PauseCircle,
  PlayCircle,
  Building2,
  Edit2,
  Receipt,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  FixedBill,
  ExpenseCategory,
  PaymentMethod,
  CustomCategory,
  BillType,
  PaymentCard,
  CardType,
  Transaction,
} from '../types';
import {
  formatCurrency,
  EXPENSE_CATEGORIES,
  CATEGORY_COLORS,
  getCurrentMonthKey,
  formatMonthYearPT,
  addMonthsToKey,
} from '../utils/formatters';
import { getBillsForMonth, MonthBillView, getCardUsage } from '../utils/storage';
import { getEffectiveClosingDay, getInvoiceCycleForMonth } from '../utils/creditCardRules';

interface BillsManagerProps {
  bills: FixedBill[];
  selectedMonth?: string;
  onUpdateBills: (bills: FixedBill[]) => void;
  onPayBill: (bill: FixedBill, targetMonth?: string) => void;
  onClose?: () => void;
  customCategories?: CustomCategory[];
  cards?: PaymentCard[];
  onSaveCard?: (card: PaymentCard) => void;
  onDeleteCard?: (cardId: string) => void;
  transactions?: Transaction[];
  onOpenCardsManager?: () => void;
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

const PAYMENT_METHODS: PaymentMethod[] = [
  'Pix',
  'Boleto',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Transferência',
  'Dinheiro',
];

export const BillsManager: React.FC<BillsManagerProps> = ({
  bills,
  selectedMonth,
  onUpdateBills,
  onPayBill,
  onClose,
  customCategories = [],
  cards = [],
  onSaveCard,
  onDeleteCard,
  transactions = [],
  onOpenCardsManager,
}) => {
  const currentRealMonthKey = getCurrentMonthKey();
  const activeMonthKey = selectedMonth || currentRealMonthKey;
  const isPastMonth = activeMonthKey < currentRealMonthKey;
  const isFutureMonth = activeMonthKey > currentRealMonthKey;

  // Integrated Sub-Tabs: Faturas & Contas vs Meus Cartões
  const [activeSection, setActiveSection] = useState<'bills' | 'cards'>('bills');

  // Cards management state
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [cardBank, setCardBank] = useState('Nubank');
  const [cardName, setCardName] = useState('');
  const [cardType, setCardType] = useState<CardType>('both');
  const [cardTotalLimit, setCardTotalLimit] = useState('3500');
  const [cardDueDay, setCardDueDay] = useState('10');
  const [cardClosingDay, setCardClosingDay] = useState('3');
  const [cardLastFourDigits, setCardLastFourDigits] = useState('');
  const [cardColor, setCardColor] = useState('#820ad1');
  const [cardErrorMsg, setCardErrorMsg] = useState('');

  const handleOpenAddCard = () => {
    setEditingCardId(null);
    setCardBank('Nubank');
    setCardName('Nubank Mastercard');
    setCardType('both');
    setCardTotalLimit('3500');
    setCardDueDay('10');
    setCardClosingDay('3');
    setCardLastFourDigits('');
    setCardColor('#820ad1');
    setCardErrorMsg('');
    setIsEditingCard(true);
  };

  const handleOpenEditCard = (c: PaymentCard) => {
    setEditingCardId(c.id);
    setCardBank(c.bank);
    setCardName(c.name);
    setCardType(c.type);
    setCardTotalLimit(String(c.totalLimit));
    setCardDueDay(String(c.dueDay));
    setCardClosingDay(String(c.closingDay || getEffectiveClosingDay(c)));
    setCardLastFourDigits(c.lastFourDigits || '');
    setCardColor(c.color || '#1e293b');
    setCardErrorMsg('');
    setIsEditingCard(true);
  };

  const handleSelectBankPreset = (presetName: string, presetColor: string) => {
    setCardBank(presetName);
    setCardColor(presetColor);
    if (!cardName || cardName === 'Nubank Mastercard' || PRESET_BANKS.some((b) => b.name === cardName)) {
      setCardName(presetName === 'Outro' ? 'Meu Cartão' : `${presetName} Card`);
    }
  };

  const handleSaveCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName.trim()) {
      setCardErrorMsg('Informe o nome ou apelido do cartão.');
      return;
    }
    const limitVal = parseFloat(cardTotalLimit.replace(',', '.')) || 0;
    if (cardType !== 'debit' && limitVal <= 0) {
      setCardErrorMsg('Informe o limite total do cartão de crédito.');
      return;
    }
    const dueVal = parseInt(cardDueDay, 10);
    if (isNaN(dueVal) || dueVal < 1 || dueVal > 31) {
      setCardErrorMsg('Dia de vencimento inválido (1 a 31).');
      return;
    }
    const closingVal = parseInt(cardClosingDay, 10) || getEffectiveClosingDay({ dueDay: dueVal });

    const newOrUpdatedCard: PaymentCard = {
      id: editingCardId || `card-${Date.now()}`,
      bank: cardBank.trim() || 'Outro',
      name: cardName.trim(),
      type: cardType,
      totalLimit: cardType === 'debit' ? 0 : limitVal,
      dueDay: dueVal,
      closingDay: closingVal,
      lastFourDigits: cardLastFourDigits.replace(/\D/g, '').slice(0, 4) || undefined,
      color: cardColor,
      createdAt: Date.now(),
    };

    if (onSaveCard) {
      onSaveCard(newOrUpdatedCard);
    }
    setIsEditingCard(false);
  };

  const totalCreditLimit = cards.reduce(
    (acc, c) => acc + (c.type !== 'debit' ? c.totalLimit : 0),
    0
  );
  const allCardsUsage = cards.map((c) =>
    getCardUsage(c, transactions, bills, activeMonthKey, cards)
  );
  const totalCommittedLimit = allCardsUsage.reduce((acc, u) => acc + u.totalCommittedLimit, 0);
  const totalMonthInvoices = allCardsUsage.reduce((acc, u) => acc + u.monthInvoiceAmount, 0);
  const totalAvailableLimit = Math.max(0, Math.round((totalCreditLimit - totalCommittedLimit) * 100) / 100);

  const [filter, setFilter] = useState<
    'pending' | 'paid' | 'recurring' | 'installment' | 'all'
  >('pending');
  const [isAddingBill, setIsAddingBill] = useState(false);

  // New bill form state
  const [billType, setBillType] = useState<BillType>('recurring');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('10');
  const [category, setCategory] = useState<ExpenseCategory>('Faturas & Contas');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pix');
  const [barcodeOrPixKey, setBarcodeOrPixKey] = useState('');
  const [paymentRequired, setPaymentRequired] = useState(true);
  const [startMonth, setStartMonth] = useState(activeMonthKey);
  const [selectedCardId, setSelectedCardId] = useState('');

  // Installment specific state
  const [totalInstallments, setTotalInstallments] = useState('3');
  const [currentInstallment, setCurrentInstallment] = useState('1');
  const [installmentAmountMode, setInstallmentAmountMode] = useState<'per_month' | 'total'>('per_month');

  const today = new Date();
  const currentDay = today.getDate();

  // Dynamically resolve month views for the active month
  const resolvedMonthBills = getBillsForMonth(bills, activeMonthKey);

  const handleCardChange = (cardId: string) => {
    setSelectedCardId(cardId);
    const foundCard = cards.find((c) => c.id === cardId);
    if (foundCard && foundCard.dueDay) {
      setDueDay(String(foundCard.dueDay));
    }
  };

  const handleAddBill = (e: React.FormEvent) => {
    e.preventDefault();
    let rawAmount = parseFloat(amount.replace(',', '.'));
    const day = parseInt(dueDay, 10);

    if (!name.trim() || isNaN(rawAmount) || rawAmount <= 0) return;

    let finalAmount = rawAmount;
    let totalInst = parseInt(totalInstallments, 10) || 1;
    let currInst = parseInt(currentInstallment, 10) || 1;

    if (billType === 'installment') {
      if (installmentAmountMode === 'total') {
        finalAmount = Number((rawAmount / totalInst).toFixed(2));
      }
    }

    const linkedCard = cards.find((c) => c.id === selectedCardId);

    const newBill: FixedBill = {
      id: `bill-${Date.now()}`,
      name: name.trim(),
      amount: finalAmount,
      dueDay: Math.min(31, Math.max(1, day)),
      category,
      autoReminder: true,
      status: !paymentRequired ? 'paused' : 'pending',
      paymentMethod,
      cardId: linkedCard?.id,
      cardName: linkedCard ? `${linkedCard.bank} - ${linkedCard.name}` : undefined,
      barcodeOrPixKey: barcodeOrPixKey.trim() || '',
      billType,
      isRecurring: billType === 'recurring',
      isInstallment: billType === 'installment',
      paymentRequired,
      startMonth: startMonth || activeMonthKey,
      totalInstallments: billType === 'installment' ? totalInst : 1,
      currentInstallment: billType === 'installment' ? currInst : 1,
      paidMonths: [],
    };

    onUpdateBills([...bills, newBill]);
    setIsAddingBill(false);
    setName('');
    setAmount('');
    setDueDay('10');
    setBarcodeOrPixKey('');
    setBillType('recurring');
    setPaymentRequired(true);
    setTotalInstallments('3');
    setCurrentInstallment('1');
    setSelectedCardId('');
  };

  const handleDeleteBill = (id: string) => {
    if (confirm('Deseja realmente excluir esta fatura / cobrança?')) {
      onUpdateBills(bills.filter((b) => b.id !== id));
    }
  };

  const handleTogglePaymentRequired = (billId: string) => {
    onUpdateBills(
      bills.map((b) => {
        if (b.id === billId) {
          const currentlyRequired = b.paymentRequired !== false;
          const nextRequired = !currentlyRequired;
          return {
            ...b,
            paymentRequired: nextRequired,
            status: nextRequired ? 'pending' : 'paused',
          };
        }
        return b;
      })
    );
  };

  const handleToggleReminder = (id: string) => {
    onUpdateBills(
      bills.map((b) => (b.id === id ? { ...b, autoReminder: !b.autoReminder } : b))
    );
  };

  const handleToggleStatus = (billView: MonthBillView) => {
    if (billView.resolvedStatus === 'pending') {
      onPayBill(billView, activeMonthKey);
    } else {
      // Revert payment for this month
      const updatedPaidMonths = (billView.paidMonths || []).filter(
        (m) => m !== activeMonthKey
      );
      onUpdateBills(
        bills.map((b) =>
          b.id === billView.id
            ? {
                ...b,
                status: updatedPaidMonths.length > 0 ? 'paid' : 'pending',
                paidMonths: updatedPaidMonths,
                lastPaidMonth:
                  updatedPaidMonths[updatedPaidMonths.length - 1] || undefined,
              }
            : b
        )
      );
    }
  };

  // Filtered views based on current active month
  const filteredBills = resolvedMonthBills.filter((b) => {
    if (filter === 'pending') return b.resolvedStatus === 'pending';
    if (filter === 'paid') return b.resolvedStatus === 'paid';
    if (filter === 'recurring') return !b.isInstallment;
    if (filter === 'installment') return b.isInstallment;
    return true;
  });

  const totalPendingAmount = resolvedMonthBills
    .filter((b) => b.resolvedStatus === 'pending' && b.paymentRequired !== false)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const isCardSelected =
    paymentMethod === 'Cartão de Crédito' || paymentMethod === 'Cartão de Débito';

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
      {/* Integrated Section Selector: Faturas & Contas vs Meus Cartões */}
      <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-700/80 mb-4 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveSection('bills')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeSection === 'bills'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Faturas & Contas</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-semibold">
            {resolvedMonthBills.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('cards')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeSection === 'cards'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Meus Cartões</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-purple-300 font-semibold">
            {cards.length}
          </span>
        </button>
      </div>

      {activeSection === 'cards' ? (
        /* CARDS MANAGEMENT SECTION */
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100">
                  Meus Cartões de Crédito & Débito
                </h2>
                <p className="text-[11px] text-slate-400">
                  Limites, faturas e vencimentos
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenAddCard}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors active:scale-95 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Cartão
            </button>
          </div>

          {/* Cards Summary Strip */}
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Limite Total</span>
                <span className="text-xs font-bold text-slate-200">
                  {formatCurrency(totalCreditLimit)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-amber-400/90 block font-medium">Comprometido</span>
                <span className="text-xs font-bold text-amber-400">
                  {formatCurrency(totalCommittedLimit)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-400/90 block font-medium">Disponível Real</span>
                <span className="text-xs font-extrabold text-emerald-400">
                  {formatCurrency(totalAvailableLimit)}
                </span>
              </div>
            </div>

            {totalMonthInvoices > 0 ? (
              <div className="bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-300">
                  Faturas de {formatMonthYearPT(activeMonthKey)}:
                </span>
                <span className="font-bold text-rose-300">
                  {formatCurrency(totalMonthInvoices)}
                </span>
              </div>
            ) : totalCommittedLimit > 0 ? (
              <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl flex items-center justify-between text-xs">
                <span className="text-blue-200">
                  Fatura de {formatMonthYearPT(activeMonthKey)}: <strong>R$ 0,00</strong>
                </span>
                <span className="text-[11px] text-blue-300">
                  Limite já bloqueado pelas compras parceladas
                </span>
              </div>
            ) : null}
          </div>

          {/* Card Form when adding/editing */}
          {isEditingCard && (
            <form
              onSubmit={handleSaveCardSubmit}
              className="bg-slate-900 border border-purple-500/40 rounded-2xl p-4 space-y-3.5 shadow-lg animate-in fade-in"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-xs font-bold text-purple-300">
                  {editingCardId ? 'Editar Cartão' : 'Cadastrar Novo Cartão'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditingCard(false)}
                  className="p-1 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {cardErrorMsg && (
                <div className="p-2 bg-rose-950/40 border border-rose-500/40 rounded-lg text-rose-300 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{cardErrorMsg}</span>
                </div>
              )}

              {/* Bank Presets */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Instituição / Banco
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_BANKS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleSelectBankPreset(preset.name, preset.color)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                        cardBank === preset.name
                          ? 'bg-purple-600/30 border-purple-400 text-purple-200 shadow-sm'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Type */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Apelido do Cartão
                  </label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Ex: Nubank Roxinho"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Tipo de Função
                  </label>
                  <select
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value as CardType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="both">Crédito & Débito (Múltiplo)</option>
                    <option value="credit">Apenas Crédito</option>
                    <option value="debit">Apenas Débito</option>
                  </select>
                </div>
              </div>

              {/* Limit & Digits */}
              <div className="grid grid-cols-2 gap-2">
                {cardType !== 'debit' ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Limite Total de Crédito (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={cardTotalLimit}
                      onChange={(e) => setCardTotalLimit(e.target.value)}
                      placeholder="Ex: 3500.00"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-purple-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Limite
                    </label>
                    <input
                      type="text"
                      disabled
                      value="Débito em Conta"
                      className="w-full bg-slate-800/40 border border-slate-700/40 rounded-xl px-2.5 py-1.5 text-xs text-slate-400"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Últimos 4 Dígitos (Opcional)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={cardLastFourDigits}
                    onChange={(e) => setCardLastFourDigits(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 1234"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono text-center focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Due Day & Closing Day */}
              {cardType !== 'debit' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Dia de Vencimento
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={cardDueDay}
                      onChange={(e) => setCardDueDay(e.target.value)}
                      placeholder="Ex: 10"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Dia de Fechamento da Fatura
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={cardClosingDay}
                      onChange={(e) => setCardClosingDay(e.target.value)}
                      placeholder="Ex: 3"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Color Swatches */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Cor do Cartão
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  {CARD_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCardColor(c.value)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform flex items-center justify-center ${
                        cardColor === c.value
                          ? 'border-white scale-110 shadow-md'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    >
                      {cardColor === c.value && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingCard(false)}
                  className="flex-1 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs text-white bg-purple-600 hover:bg-purple-500 rounded-xl font-bold shadow"
                >
                  {editingCardId ? 'Salvar Alterações' : 'Cadastrar Cartão'}
                </button>
              </div>
            </form>
          )}

          {/* Cards List */}
          {cards.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-3 bg-slate-900/40 rounded-2xl border border-slate-700/60">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 mx-auto flex items-center justify-center border border-purple-500/20">
                <CreditCard className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">
                  Nenhum cartão cadastrado ainda
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  Cadastre seus cartões de crédito e débito para acompanhar limite disponível, faturas e vencimentos com precisão.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddCard}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-500/20"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Nubank, Inter ou Outro
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cards.map((c) => {
                const usage = getCardUsage(c, transactions, bills, activeMonthKey, cards);
                const usagePercent =
                  c.totalLimit > 0
                    ? Math.min(100, Math.round((usage.totalCommittedLimit / c.totalLimit) * 100))
                    : 0;

                return (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-slate-700/80 p-4 relative overflow-hidden shadow-lg transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${c.color || '#1e293b'}ee 0%, #0f172a 100%)`,
                    }}
                  >
                    {/* Top Card Info */}
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200/90 bg-black/30 px-2 py-0.5 rounded-full border border-white/10">
                            {c.bank}
                          </span>
                          <span className="text-[10px] text-slate-300 font-medium">
                            {c.type === 'both'
                              ? 'Crédito & Débito'
                              : c.type === 'credit'
                              ? 'Crédito'
                              : 'Débito'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white mt-1">
                          {c.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditCard(c)}
                          className="p-1.5 text-slate-300 hover:text-white bg-black/20 hover:bg-black/40 rounded-lg transition-colors"
                          title="Editar cartão"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteCard && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Deseja excluir o cartão "${c.name}"?`)) {
                                onDeleteCard(c.id);
                              }
                            }}
                            className="p-1.5 text-rose-300 hover:text-rose-100 bg-black/20 hover:bg-rose-950/60 rounded-lg transition-colors"
                            title="Excluir cartão"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Chip & Digits */}
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-300/80 font-mono tracking-widest relative z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-4 rounded bg-amber-400/80 border border-amber-300 flex items-center justify-center text-[7px] text-slate-900 font-bold font-sans">
                          CHIP
                        </div>
                        <span>•••• •••• •••• {c.lastFourDigits || '••••'}</span>
                      </div>
                    </div>

                    {/* Limit & Availability */}
                    {c.type !== 'debit' && (
                      <div className="mt-3.5 pt-3 border-t border-white/10 relative z-10 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[11px] text-slate-300/70 block">
                              Limite Disponível
                            </span>
                            <span className="font-extrabold text-sm text-emerald-300">
                              {formatCurrency(usage.availableLimit)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] text-slate-300/70 block">
                              Fatura {formatMonthYearPT(activeMonthKey).split(' ')[0]}
                            </span>
                            <span className="font-bold text-sm text-white">
                              {formatCurrency(usage.monthInvoiceAmount)}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar of Committed Limit */}
                        <div>
                          <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden border border-white/10">
                            <div
                              className={`h-full rounded-full transition-all ${
                                usagePercent > 90
                                  ? 'bg-rose-500'
                                  : usagePercent > 60
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-400'
                              }`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-300/80 mt-1">
                            <span>
                              {usagePercent}% bloqueado ({formatCurrency(usage.totalCommittedLimit)})
                            </span>
                            <span>Total: {formatCurrency(c.totalLimit)}</span>
                          </div>
                        </div>

                        {/* Informative Status Banner if no current month invoice but has future debt */}
                        {usage.monthInvoiceAmount === 0 && usage.totalCommittedLimit > 0 && usage.nextInvoiceMonth && (
                          <div className="bg-black/30 border border-white/10 rounded-lg p-2 text-[10px] text-slate-200 flex items-center justify-between">
                            <span>Sem fatura em {formatMonthYearPT(activeMonthKey).split(' ')[0]}</span>
                            <span className="text-amber-300 font-semibold">
                              Próx: {formatCurrency(usage.nextInvoiceAmount || 0)} em {formatMonthYearPT(usage.nextInvoiceMonth)}
                            </span>
                          </div>
                        )}

                        {/* Dates: Due and Closing */}
                        <div className="flex items-center justify-between text-[11px] pt-1 text-slate-200/90 font-medium">
                          <span>
                            Vencimento:{' '}
                            <strong className="text-white font-bold">
                              Dia {c.dueDay}
                            </strong>
                          </span>
                          {c.closingDay && (
                            <span>
                              Fecha em:{' '}
                              <strong className="text-white font-bold">
                                Dia {c.closingDay}
                              </strong>
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* BILLS MANAGEMENT SECTION */
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100">
                  Faturas & Contas Fixas
                </h2>
                <p className="text-[11px] text-slate-400">
                  Compromissos para {formatMonthYearPT(activeMonthKey)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setIsAddingBill(true);
                  setStartMonth(activeMonthKey);
                }}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-amber-600/90 hover:bg-amber-600 text-white rounded-lg transition-colors active:scale-95 shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                Nova Fatura
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Cards Limit Overview Banner */}
          {cards.length > 0 && (
            <div className="mb-3 p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="text-xs">
                  <span className="text-slate-300">
                    Limite disponível nos cartões:{' '}
                  </span>
                  <span className="font-extrabold text-purple-300">
                    {formatCurrency(totalAvailableLimit)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSection('cards')}
                className="px-2 py-0.5 text-[11px] font-bold text-purple-200 hover:text-white bg-purple-600/70 hover:bg-purple-600 rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                <span>Ver Cartões</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 mb-3 bg-slate-900/60 p-1 rounded-xl border border-slate-700/60 overflow-x-auto">
            <button
              onClick={() => setFilter('pending')}
              className={`flex-1 min-w-[70px] py-1.5 text-xs font-semibold rounded-lg transition-colors text-center truncate ${
                filter === 'pending'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pendentes (
              {
                resolvedMonthBills.filter(
                  (b) => b.resolvedStatus === 'pending' && b.paymentRequired !== false
                ).length
              }
              )
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`flex-1 min-w-[60px] py-1.5 text-xs font-semibold rounded-lg transition-colors text-center truncate ${
                filter === 'paid'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pagas (
              {resolvedMonthBills.filter((b) => b.resolvedStatus === 'paid').length}
              )
            </button>
            <button
              onClick={() => setFilter('recurring')}
              className={`flex-1 min-w-[85px] py-1.5 text-xs font-semibold rounded-lg transition-colors text-center truncate ${
                filter === 'recurring'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Recorrentes ({resolvedMonthBills.filter((b) => !b.isInstallment).length})
            </button>
            <button
              onClick={() => setFilter('installment')}
              className={`flex-1 min-w-[75px] py-1.5 text-xs font-semibold rounded-lg transition-colors text-center truncate ${
                filter === 'installment'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cartão ({resolvedMonthBills.filter((b) => b.isInstallment).length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 min-w-[55px] py-1.5 text-xs font-semibold rounded-lg transition-colors text-center truncate ${
                filter === 'all'
                  ? 'bg-slate-700 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todas ({resolvedMonthBills.length})
            </button>
          </div>

          {/* Pending Summary */}
          {filter === 'pending' && totalPendingAmount > 0 && (
            <div className="mb-3 px-3 py-2 bg-slate-900/80 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Total a pagar em {formatMonthYearPT(activeMonthKey)}:
              </span>
              <span className="font-bold text-amber-400">
                {formatCurrency(totalPendingAmount)}
              </span>
            </div>
          )}


      {/* Bills List */}
      <div className="space-y-2.5">
        {filteredBills.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            Nenhuma fatura encontrada para {formatMonthYearPT(activeMonthKey)} nesta categoria.
          </div>
        ) : (
          filteredBills.map((bill) => {
            const isPaid = bill.resolvedStatus === 'paid';
            const isPaused = bill.paymentRequired === false;

            // Accurate overdue check: ONLY overdue if past month OR (current month AND dueDay < currentDay)
            const isOverdue =
              !isPaid &&
              !isPaused &&
              (isPastMonth ? true : !isFutureMonth && bill.dueDay < currentDay);
            const isDueToday =
              !isPaid &&
              !isPaused &&
              !isPastMonth &&
              !isFutureMonth &&
              bill.dueDay === currentDay;

            return (
              <div
                key={bill.id}
                className={`p-3 rounded-xl border transition-all ${
                  isPaid
                    ? 'bg-slate-900/40 border-slate-800 opacity-75'
                    : isPaused
                    ? 'bg-slate-900/40 border-slate-800 opacity-60'
                    : isOverdue
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : isDueToday
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : 'bg-slate-900/70 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => handleToggleStatus(bill)}
                      disabled={isPaused}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                        isPaid
                          ? 'bg-emerald-500 border-emerald-400 text-white'
                          : isPaused
                          ? 'border-slate-700 bg-slate-800/40 text-slate-500 cursor-not-allowed'
                          : 'border-slate-600 hover:border-emerald-500 text-transparent hover:text-emerald-500'
                      }`}
                      title={
                        isPaused
                          ? 'Cobrança desmarcada como necessária'
                          : isPaid
                          ? 'Marcar como pendente'
                          : 'Marcar como paga'
                      }
                    >
                      <CheckCircle2 className="w-4 h-4 fill-current stroke-slate-900" />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-xs font-semibold truncate ${
                            isPaid
                              ? 'line-through text-slate-400'
                              : isPaused
                              ? 'text-slate-400 italic'
                              : 'text-slate-100'
                          }`}
                        >
                          {bill.name}
                        </span>

                        {/* Badges */}
                        {bill.isInstallment && (
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-mono font-medium">
                            {bill.currentInstallment}/{bill.totalInstallments}
                          </span>
                        )}

                        {bill.isRecurring && (
                          <span className="text-[10px] bg-blue-500/10 text-blue-300 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                            <Repeat className="w-2.5 h-2.5" />
                            Recorrente
                          </span>
                        )}

                        {isPaused ? (
                          <span className="text-[10px] bg-slate-700/60 text-slate-400 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                            <PauseCircle className="w-2.5 h-2.5 text-slate-400" />
                            Pausada
                          </span>
                        ) : isPaid ? (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-medium">
                            Paga
                          </span>
                        ) : isOverdue ? (
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Atrasada
                          </span>
                        ) : isDueToday ? (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            Hoje
                          </span>
                        ) : isFutureMonth ? (
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-medium">
                            Programada
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>Vence dia {bill.dueDay}</span>
                        <span>•</span>
                        <span>{bill.paymentMethod}</span>
                        {bill.cardName && (
                          <>
                            <span>•</span>
                            <span className="text-purple-300 font-medium">
                              {bill.cardName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold ${
                        isPaid
                          ? 'text-slate-400'
                          : isPaused
                          ? 'text-slate-500 line-through'
                          : 'text-slate-100'
                      }`}
                    >
                      {formatCurrency(bill.amount)}
                    </span>

                    {/* Quick Payment Required Toggle for Recurring Bills */}
                    {bill.isRecurring && (
                      <button
                        onClick={() => handleTogglePaymentRequired(bill.id)}
                        className={`p-1.5 rounded-lg transition-colors text-[10px] font-semibold flex items-center gap-1 ${
                          bill.paymentRequired !== false
                            ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60'
                            : 'text-slate-400 hover:text-slate-300 bg-slate-800 hover:bg-slate-700'
                        }`}
                        title={
                          bill.paymentRequired !== false
                            ? 'Pagamento necessário ativo (clique para pausar)'
                            : 'Cobrança desativada (clique para reativar)'
                        }
                      >
                        {bill.paymentRequired !== false ? (
                          <>
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Ativo</span>
                          </>
                        ) : (
                          <>
                            <PauseCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Pausado</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleReminder(bill.id)}
                      className={`p-1 rounded-lg transition-colors ${
                        bill.autoReminder
                          ? 'text-amber-400 hover:text-amber-300'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                      title={bill.autoReminder ? 'Lembrete ativo' : 'Lembrete desligado'}
                    >
                      {bill.autoReminder ? (
                        <Bell className="w-3.5 h-3.5" />
                      ) : (
                        <BellOff className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteBill(bill.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                      title="Excluir fatura"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add New Bill Modal */}
      {isAddingBill && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Cadastrar Nova Fatura
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Contas recorrentes, assinaturas ou parcelamentos
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddingBill(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBill} className="space-y-4">
              {/* Type Switch: Recorrente vs Parcela */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tipo de Cobrança
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBillType('recurring');
                      if (paymentMethod === 'Cartão de Crédito') {
                        setPaymentMethod('Boleto');
                      }
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      billType === 'recurring'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-100 shadow'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <Repeat className="w-3.5 h-3.5 text-blue-400" />
                      <span>Fixo Recorrente</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Academia, aluguel, plano de saúde, internet, boletos
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBillType('installment');
                      setPaymentMethod('Cartão de Crédito');
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      billType === 'installment'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-100 shadow'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                      <span>Parcela de Cartão</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Compras parceladas que vencem ao longo dos meses
                    </p>
                  </button>
                </div>
              </div>

              {/* Bill Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome da Fatura / Estabelecimento
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    billType === 'installment'
                      ? 'Ex: Fatura Nubank, Notebook 10x, Seguro Carro'
                      : 'Ex: Academia SmartFit, Aluguel, Netflix, Internet'
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Recurring Bill Configuration */}
              {billType === 'recurring' && (
                <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-200 flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5 text-blue-400" />
                      Início da Cobrança & Recorrência
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                      Qual é o 1º Mês a Ser Pago?
                    </label>
                    <input
                      type="month"
                      value={startMonth}
                      onChange={(e) => setStartMonth(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Ex: Se você já pagou este mês, selecione o próximo mês para que a fatura não fique pendente hoje.
                    </p>
                  </div>

                  <label className="flex items-start gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={paymentRequired}
                      onChange={(e) => setPaymentRequired(e.target.checked)}
                      className="w-3.5 h-3.5 accent-blue-500 rounded mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        Manter como "Pagamento Necessário" todo mês
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Ficará sempre marcada como pendente no início do mês até você desmarcar ou pagar.
                      </span>
                    </div>
                  </label>
                </div>
              )}

              {/* Installment Controls */}
              {billType === 'installment' && (
                <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      Configuração do Parcelamento
                    </span>
                    <span className="text-[10px] text-purple-300">
                      Será listado nos meses seguintes
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                        Total de Parcelas
                      </label>
                      <select
                        value={totalInstallments}
                        onChange={(e) => setTotalInstallments(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-bold focus:outline-none focus:border-purple-500"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48].map(
                          (num) => (
                            <option key={num} value={num}>
                              {num === 1 ? '1x (Única)' : `${num}x parcelas`}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                        Mês da 1ª Parcela
                      </label>
                      <input
                        type="month"
                        value={startMonth}
                        onChange={(e) => setStartMonth(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-semibold text-slate-300 mb-1">
                      O valor inserido abaixo é:
                    </span>
                    <div className="flex gap-2 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                        <input
                          type="radio"
                          name="installmentMode"
                          checked={installmentAmountMode === 'per_month'}
                          onChange={() => setInstallmentAmountMode('per_month')}
                          className="accent-purple-500"
                        />
                        <span>Valor de Cada Parcela</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                        <input
                          type="radio"
                          name="installmentMode"
                          checked={installmentAmountMode === 'total'}
                          onChange={() => setInstallmentAmountMode('total')}
                          className="accent-purple-500"
                        />
                        <span>Valor Total (dividir)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount and Due Day */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {billType === 'installment' && installmentAmountMode === 'total'
                      ? 'Valor Total (R$)'
                      : 'Valor Mensal (R$)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Dia do Vencimento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500 text-center font-bold"
                  />
                </div>
              </div>

              {/* Payment Method & Linked Card */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => {
                      const pm = e.target.value as PaymentMethod;
                      setPaymentMethod(pm);
                      if (pm === 'Cartão de Crédito' && cards.length > 0) {
                        const c = cards.find((x) => x.type === 'credit' || x.type === 'both');
                        if (c) handleCardChange(c.id);
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none"
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Card Link Option */}
              {isCardSelected && (
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                      Vincular a Qual Cartão?
                    </label>
                    {onOpenCardsManager && (
                      <button
                        type="button"
                        onClick={onOpenCardsManager}
                        className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
                      >
                        + Gerenciar Cartões
                      </button>
                    )}
                  </div>

                  {cards.length > 0 ? (
                    <select
                      value={selectedCardId}
                      onChange={(e) => handleCardChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none"
                    >
                      <option value="">Selecione o cartão...</option>
                      {cards.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.bank} - {c.name} (Venc: dia {c.dueDay})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      Nenhum cartão cadastrado ainda.
                    </p>
                  )}
                </div>
              )}

              {/* Barcode or Pix Key */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Código de Barras ou Chave Pix (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Cole aqui para copiar com 1 clique ao pagar"
                  value={barcodeOrPixKey}
                  onChange={(e) => setBarcodeOrPixKey(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingBill(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-amber-600/20"
                >
                  <Plus className="w-4 h-4" />
                  Salvar Fatura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export const CardsAndBillsManager = BillsManager;

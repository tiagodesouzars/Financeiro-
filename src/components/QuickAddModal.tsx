import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CreditCard,
  Tag,
  Check,
  Layers,
  Building2,
} from 'lucide-react';
import {
  Transaction,
  TransactionType,
  Category,
  PaymentMethod,
  CustomCategory,
  FixedBill,
  PaymentCard,
} from '../types';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  CATEGORY_COLORS,
  getTodayDateString,
  getCategoryColor,
  addMonthsToKey,
  formatCurrency,
  formatDateBR,
  formatMonthYearPT,
} from '../utils/formatters';
import {
  calculateCreditCardBilling,
  calculateInstallmentBillingSchedule,
  getEffectiveClosingDay,
  getEffectiveDueDay,
} from '../utils/creditCardRules';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onAddMultipleTransactions?: (
    transactions: Omit<Transaction, 'id' | 'createdAt'>[],
    bill?: FixedBill
  ) => void;
  transactionToEdit?: Transaction | null;
  onUpdateTransaction?: (transaction: Transaction) => void;
  initialType?: TransactionType;
  customCategories?: CustomCategory[];
  onOpenCategoriesManager?: () => void;
  cards?: PaymentCard[];
  onOpenCardsManager?: () => void;
}

const COMMON_EXPENSE_SUGGESTIONS = [
  'Almoço',
  'Supermercado',
  'Uber / Transporte',
  'Combustível',
  'Farmácia',
  'Café & Lanche',
  'Padaria',
  'Ifood / Jantar',
];

const COMMON_INCOME_SUGGESTIONS = [
  'Salário Mensal',
  'Freelance / Bico',
  'Pix Recebido',
  'Rendimento',
  'Venda de Item',
];

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  onAddMultipleTransactions,
  transactionToEdit,
  onUpdateTransaction,
  initialType = 'expense',
  customCategories,
  onOpenCategoriesManager,
  cards = [],
  onOpenCardsManager,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('');

  // Installments state
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState('1');
  const [installmentMode, setInstallmentMode] = useState<'total' | 'per_month'>('total');
  const [createBillForInstallment, setCreateBillForInstallment] = useState(false);

  // Card Selection state
  const [selectedCardId, setSelectedCardId] = useState<string>('');

  const [category, setCategory] = useState<Category>('Alimentação');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pix');
  const [date, setDate] = useState(getTodayDateString());

  // Sync state when opening or when transactionToEdit changes
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(transactionToEdit.amount.toString());
      setDescription(transactionToEdit.description || '');
      setCategory(transactionToEdit.category);
      setPaymentMethod(transactionToEdit.paymentMethod);
      setDate(transactionToEdit.date);
      setSelectedCardId(transactionToEdit.cardId || '');
      setIsInstallment(false);
    } else {
      setType(initialType);
      setAmount('');
      setDescription('');
      setDate(getTodayDateString());
      setIsInstallment(false);
      const activeCats = customCategories
        ? customCategories.filter((c) => c.type === initialType)
        : [];
      if (activeCats.length > 0) {
        setCategory(activeCats[0].name);
      } else {
        setCategory(initialType === 'expense' ? 'Alimentação' : 'Salário Fixo');
      }
    }
  }, [transactionToEdit, isOpen, initialType, customCategories]);

  // Auto-select first matching card when cards change or payment method changes
  useEffect(() => {
    if (cards.length > 0 && !selectedCardId && !transactionToEdit) {
      if (paymentMethod === 'Cartão de Crédito') {
        const creditCard = cards.find((c) => c.type === 'credit' || c.type === 'both');
        if (creditCard) setSelectedCardId(creditCard.id);
      } else if (paymentMethod === 'Cartão de Débito') {
        const debitCard = cards.find((c) => c.type === 'debit' || c.type === 'both');
        if (debitCard) setSelectedCardId(debitCard.id);
      }
    }
  }, [cards, paymentMethod, selectedCardId, transactionToEdit]);

  if (!isOpen) return null;

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'income') {
      setIsInstallment(false);
    }
    const newCategories = customCategories
      ? customCategories.filter((c) => c.type === newType)
      : [];
    if (newCategories.length > 0) {
      setCategory(newCategories[0].name);
    } else {
      setCategory(newType === 'expense' ? 'Alimentação' : 'Salário Fixo');
    }
  };

  const handleQuickAddAmount = (addValue: number) => {
    const current = parseFloat(amount.replace(',', '.')) || 0;
    setAmount((current + addValue).toFixed(2));
  };

  const selectedCard = cards.find((c) => c.id === selectedCardId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(rawAmount) || rawAmount <= 0) return;

    const baseDesc = description.trim() || category;
    const cardIdToSave = (paymentMethod === 'Cartão de Crédito' || paymentMethod === 'Cartão de Débito')
      ? selectedCard?.id
      : undefined;
    const cardNameToSave = selectedCard
      ? `${selectedCard.bank} (${selectedCard.name})`
      : undefined;

    // Direct update if editing an existing transaction
    if (transactionToEdit && onUpdateTransaction) {
      onUpdateTransaction({
        ...transactionToEdit,
        type,
        amount: rawAmount,
        description: baseDesc,
        category,
        paymentMethod,
        date,
        cardId: cardIdToSave,
        cardName: cardNameToSave,
      });
      onClose();
      return;
    }

    const numInst = parseInt(installmentCount, 10) || 1;

    // Multi-month installment only if isInstallment is true AND installments > 1
    if (type === 'expense' && isInstallment && numInst > 1 && onAddMultipleTransactions) {
      const perMonthVal =
        installmentMode === 'total'
          ? Number((rawAmount / numInst).toFixed(2))
          : rawAmount;
      const totalAmountVal =
        installmentMode === 'total' ? rawAmount : Number((rawAmount * numInst).toFixed(2));

      const groupId = `inst-${Date.now()}`;
      const schedule = selectedCard
        ? calculateInstallmentBillingSchedule(date, selectedCard, numInst)
        : null;

      const generatedTxs: Omit<Transaction, 'id' | 'createdAt'>[] = [];
      for (let i = 0; i < numInst; i++) {
        const itemSchedule = schedule ? schedule[i] : null;
        const instDate = itemSchedule ? itemSchedule.dueDate : (() => {
          const [yearStr, monthStr, dayStr] = date.split('-');
          const targetDateObj = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1 + i, parseInt(dayStr, 10));
          const y = targetDateObj.getFullYear();
          const m = String(targetDateObj.getMonth() + 1).padStart(2, '0');
          const d = String(targetDateObj.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        })();

        generatedTxs.push({
          type: 'expense',
          amount: perMonthVal,
          category,
          description: `${baseDesc} (${i + 1}/${numInst})`,
          paymentMethod: 'Cartão de Crédito',
          cardId: cardIdToSave,
          cardName: cardNameToSave,
          date: instDate,
          invoiceMonth: itemSchedule ? itemSchedule.invoiceMonthKey : undefined,
          invoiceDueDate: itemSchedule ? itemSchedule.dueDate : undefined,
          installment: {
            current: i + 1,
            total: numInst,
            groupId,
            originalAmount: totalAmountVal,
          },
        });
      }

      const initialMonthKey = schedule ? schedule[0].invoiceMonthKey : date.slice(0, 7);
      const firstDueDay = schedule
        ? parseInt(schedule[0].dueDate.slice(8, 10), 10)
        : (selectedCard?.dueDay || parseInt(date.slice(8, 10), 10));

      const optionalBill: FixedBill | undefined = createBillForInstallment
        ? {
            id: `bill-inst-${Date.now()}`,
            name: baseDesc,
            amount: perMonthVal,
            dueDay: firstDueDay || 10,
            category: category as any,
            autoReminder: true,
            status: 'pending',
            paymentMethod: 'Cartão de Crédito',
            cardId: cardIdToSave,
            cardName: cardNameToSave,
            barcodeOrPixKey: '',
            billType: 'installment',
            isInstallment: true,
            isRecurring: false,
            paymentRequired: true,
            startMonth: initialMonthKey,
            totalInstallments: numInst,
            currentInstallment: 1,
            paidMonths: [],
          }
        : undefined;

      onAddMultipleTransactions(generatedTxs, optionalBill);
    } else {
      // Single transaction (Pix, Débito, Crédito à vista 1x, Dinheiro, etc.)
      let invoiceMonth: string | undefined = undefined;
      let invoiceDueDate: string | undefined = undefined;
      if (paymentMethod === 'Cartão de Crédito' && selectedCard) {
        const billing = calculateCreditCardBilling(date, selectedCard);
        invoiceMonth = billing.invoiceMonthKey;
        invoiceDueDate = billing.dueDate;
      }

      onAddTransaction({
        type,
        amount: rawAmount,
        category,
        description: baseDesc,
        paymentMethod,
        cardId: cardIdToSave,
        cardName: cardNameToSave,
        date,
        invoiceMonth,
        invoiceDueDate,
      });
    }

    onClose();
    // Reset form
    setAmount('');
    setDescription('');
    setIsInstallment(false);
    setInstallmentCount('1');
  };

  const activeCustomCategories = customCategories
    ? customCategories.filter((c) => c.type === type)
    : [];

  const categoryList: { name: string; color: string }[] =
    activeCustomCategories.length > 0
      ? activeCustomCategories.map((c) => ({ name: c.name, color: c.color }))
      : (type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((catName) => ({
          name: catName,
          color: getCategoryColor(catName, customCategories),
        }));

  const suggestions =
    type === 'expense' ? COMMON_EXPENSE_SUGGESTIONS : COMMON_INCOME_SUGGESTIONS;

  const isCardPayment =
    paymentMethod === 'Cartão de Crédito' || paymentMethod === 'Cartão de Débito';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                type === 'expense'
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {type === 'expense' ? (
                <ArrowDownRight className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {transactionToEdit
                  ? 'Editar Lançamento'
                  : type === 'expense'
                  ? 'Registrar Gasto'
                  : 'Registrar Renda'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {transactionToEdit
                  ? 'Atualize os dados da movimentação'
                  : type === 'expense'
                  ? 'Saída de dinheiro'
                  : 'Entrada em conta'}
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

        {/* Type Toggle: Gasto vs Renda */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-800/90 rounded-xl mb-4 border border-slate-750">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              type === 'expense'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            Gasto / Despesa
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Renda / Entrada
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Field with Quick Add Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Valor (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white text-xl font-bold placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Quick addition pills */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 font-medium">Somar:</span>
              {[5, 10, 20, 50, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] font-semibold rounded-lg border border-slate-700/80 active:scale-95"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Description & Quick Suggestions */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Descrição / Detalhe
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Ex: ${type === 'expense' ? 'Almoço no restaurante, Uber, etc.' : 'Salário, Pix freelance...'}`}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />

            {/* Quick Suggestions Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {suggestions.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setDescription(sug)}
                  className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-750 text-slate-300 text-[10px] rounded-lg border border-slate-700/60 transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">
                Categoria
              </label>
              {onOpenCategoriesManager && (
                <button
                  type="button"
                  onClick={onOpenCategoriesManager}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                >
                  <Tag className="w-3 h-3" />
                  Gerenciar
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-1">
              {categoryList.map((item) => {
                const isSelected = category === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setCategory(item.name)}
                    className={`p-2 rounded-xl text-xs font-medium border text-left flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-slate-750 border-emerald-500 text-white shadow-sm'
                        : 'bg-slate-800/70 border-slate-700/80 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  const m = e.target.value as PaymentMethod;
                  setPaymentMethod(m);
                  if (m !== 'Cartão de Crédito') {
                    setIsInstallment(false);
                    setInstallmentCount('1');
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none"
              >
                <option value="Pix">Pix</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Boleto">Boleto</option>
                <option value="Transferência">Transferência</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Card Selector when paying with Credit or Debit */}
          {isCardPayment && (
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                  Qual Cartão foi Utilizado?
                </label>
                {onOpenCardsManager && (
                  <button
                    type="button"
                    onClick={onOpenCardsManager}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    + Meus Cartões
                  </button>
                )}
              </div>

              {cards.length > 0 ? (
                <div className="space-y-1.5">
                  <select
                    value={selectedCardId}
                    onChange={(e) => setSelectedCardId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Selecione o cartão...</option>
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.bank} - {c.name} {c.lastFourDigits ? `(•• ${c.lastFourDigits})` : ''}{' '}
                        {c.type !== 'debit' ? `[Venc: Dia ${c.dueDay}]` : '[Débito]'}
                      </option>
                    ))}
                  </select>

                  {selectedCard && selectedCard.type !== 'debit' && (() => {
                    const billing = calculateCreditCardBilling(date, selectedCard);
                    const numInst = parseInt(installmentCount, 10) || 1;
                    return (
                      <div className="bg-slate-900/90 border border-purple-500/30 rounded-xl p-2.5 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-slate-300">
                          <span>
                            Fechamento: <strong className="text-white">Todo dia {billing.closingDay}</strong>
                          </span>
                          <span className="text-purple-300">
                            Vencimento: <strong className="text-white">Dia {billing.dueDay}</strong>
                          </span>
                        </div>

                        <div className="text-[10px] rounded-lg p-2 bg-purple-950/40 border border-purple-500/20">
                          {billing.isClosedForPurchaseMonth ? (
                            <p className="text-amber-300 font-medium">
                              ⚠️ <strong>Compra após o fechamento:</strong> O mês da compra já fechou no dia {billing.closingDay}. Esta compra cai na fatura seguinte com vencimento em <strong>{formatDateBR(billing.dueDate)}</strong> (Fatura de {formatMonthYearPT(billing.invoiceMonthKey)}).
                            </p>
                          ) : (
                            <p className="text-emerald-300 font-medium">
                              ✅ <strong>Compra até o fechamento:</strong> Compra feita no ciclo atual (até dia {billing.closingDay}). Vence em <strong>{formatDateBR(billing.dueDate)}</strong> (Fatura de {formatMonthYearPT(billing.invoiceMonthKey)}).
                            </p>
                          )}
                          <p className="text-[9px] text-slate-400 mt-1">
                            Período da fatura: {formatDateBR(billing.cycleStartDate)} a {formatDateBR(billing.cycleEndDate)}
                          </p>
                          {isInstallment && numInst > 1 && (
                            <p className="text-[9px] text-purple-200 mt-0.5 font-semibold">
                              Parcelamento {numInst}x: 1ª parcela vence em {formatDateBR(billing.dueDate)} e a {numInst}ª em {formatMonthYearPT(addMonthsToKey(billing.invoiceMonthKey, numInst - 1))}.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {paymentMethod === 'Cartão de Débito' ? (
                    <p className="text-[10px] text-cyan-300/90 bg-cyan-950/30 px-2 py-1 rounded-md border border-cyan-500/20">
                      ℹ️ <strong>Débito:</strong> descontado na hora do saldo em conta corrente. Não compromete o limite de crédito.
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg border border-slate-750">
                  <span className="text-[11px] text-slate-400">
                    Nenhum cartão cadastrado ainda.
                  </span>
                  {onOpenCardsManager && (
                    <button
                      type="button"
                      onClick={onOpenCardsManager}
                      className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold rounded-lg"
                    >
                      Cadastrar Agora
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Credit Card Installment or Single Payment Options */}
          {type === 'expense' && paymentMethod === 'Cartão de Crédito' && (
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  Modalidade do Crédito
                </span>
              </div>

              {/* 1x À Vista vs Parcelado */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsInstallment(false);
                    setInstallmentCount('1');
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    !isInstallment || installmentCount === '1'
                      ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  À Vista (1x única)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsInstallment(true);
                    if (installmentCount === '1') setInstallmentCount('2');
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    isInstallment && installmentCount !== '1'
                      ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  Parcelar Compra
                </button>
              </div>

              {isInstallment && installmentCount !== '1' && (
                <div className="pt-2 border-t border-slate-700/60 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">
                        Número de Parcelas
                      </span>
                      <select
                        value={installmentCount}
                        onChange={(e) => setInstallmentCount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-bold"
                      >
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map((num) => (
                          <option key={num} value={num}>
                            {num}x parcelas
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">
                        O valor R$ digitado é:
                      </span>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => setInstallmentMode('total')}
                          className={`py-1 text-[10px] font-bold rounded-md border ${
                            installmentMode === 'total'
                              ? 'bg-slate-700 text-purple-300 border-purple-500'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          Total
                        </button>
                        <button
                          type="button"
                          onClick={() => setInstallmentMode('per_month')}
                          className={`py-1 text-[10px] font-bold rounded-md border ${
                            installmentMode === 'per_month'
                              ? 'bg-slate-700 text-purple-300 border-purple-500'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          Por Mês
                        </button>
                      </div>
                    </div>
                  </div>

                  {amount && !isNaN(parseFloat(amount)) && (
                    <div className="bg-purple-950/40 border border-purple-500/30 rounded-lg p-2 text-xs text-purple-200 flex items-center justify-between">
                      <span>Plano de Parcelamento:</span>
                      <span className="font-bold">
                        {installmentMode === 'total'
                          ? `${installmentCount}x de ${formatCurrency(
                              parseFloat(amount) / parseInt(installmentCount, 10)
                            )}`
                          : `${installmentCount}x de ${formatCurrency(parseFloat(amount))}`}
                      </span>
                    </div>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={createBillForInstallment}
                      onChange={(e) => setCreateBillForInstallment(e.target.checked)}
                      className="w-3.5 h-3.5 accent-purple-500 rounded"
                    />
                    <span className="text-[11px] text-slate-300">
                      Adicionar também à aba "Faturas" como compromisso mensal
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 ${
              type === 'expense'
                ? 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-rose-600/20'
                : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-emerald-600/20'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            {transactionToEdit
              ? 'Salvar Alterações'
              : `Salvar ${type === 'expense' ? 'Gasto' : 'Renda'}`}
          </button>
        </form>
      </div>
    </div>
  );
};

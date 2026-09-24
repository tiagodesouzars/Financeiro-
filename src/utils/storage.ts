import {
  Transaction,
  FixedBill,
  SavingsGoal,
  UserFinancialProfile,
  FinancialStats,
  CustomCategory,
  InvestmentAsset,
  InvestmentStats,
  InvestmentCategory,
  PaymentCard,
  CardUsage,
} from '../types';
import {
  getCurrentMonthKey,
  getTodayDateString,
  INVESTMENT_CATEGORY_COLORS,
  getMonthDifference,
  formatMonthYearPT,
  formatCurrency,
  addMonthsToKey,
} from './formatters';

const STORAGE_KEYS = {
  TRANSACTIONS: 'fp_transactions_v1',
  FIXED_BILLS: 'fp_fixed_bills_v1',
  SAVINGS_GOALS: 'fp_savings_goals_v1',
  USER_PROFILE: 'fp_user_profile_v1',
  CUSTOM_CATEGORIES: 'fp_custom_categories_v1',
  INVESTMENTS: 'fp_investments_v1',
  PAYMENT_CARDS: 'fp_payment_cards_v1',
};

// Known mock IDs from earlier templates or test seeds
export const MOCK_IDS = new Set([
  'tx-sal',
  'tx-freela',
  'tx-1',
  'tx-2',
  'tx-3',
  'tx-4',
  'tx-5',
  'tx-6',
  'tx-7',
  'tx-8',
  'tx-9',
  'tx-10',
  'bill-1',
  'bill-2',
  'bill-3',
  'bill-4',
  'bill-5',
  'bill-6',
  'goal-1',
  'goal-2',
  'goal-3',
  'goal-4',
  'inv-1',
  'inv-2',
  'inv-3',
  'inv-4',
  'inv-5',
]);

/**
 * Checks if a financial entity is a literal legacy mock/template item.
 * NOTE: Never checks description, name or title so legitimate user items (like 'Academia', 'Farmácia') are preserved permanently.
 */
export function isUnrealItem(item: {
  id?: string;
}): boolean {
  if (!item || !item.id) return false;
  return MOCK_IDS.has(item.id);
}

export const DEFAULT_CUSTOM_CATEGORIES: CustomCategory[] = [
  // Expenses
  { id: 'cat-exp-1', name: 'Alimentação', type: 'expense', color: '#f59e0b', isDefault: true },
  { id: 'cat-exp-2', name: 'Moradia', type: 'expense', color: '#3b82f6', isDefault: true },
  { id: 'cat-exp-3', name: 'Transporte', type: 'expense', color: '#8b5cf6', isDefault: true },
  { id: 'cat-exp-4', name: 'Lazer & Cultura', type: 'expense', color: '#ec4899', isDefault: true },
  { id: 'cat-exp-5', name: 'Saúde', type: 'expense', color: '#10b981', isDefault: true },
  { id: 'cat-exp-6', name: 'Educação', type: 'expense', color: '#06b6d4', isDefault: true },
  { id: 'cat-exp-7', name: 'Compras', type: 'expense', color: '#f97316', isDefault: true },
  { id: 'cat-exp-8', name: 'Faturas & Contas', type: 'expense', color: '#ef4444', isDefault: true },
  { id: 'cat-exp-9', name: 'Investimentos', type: 'expense', color: '#14b8a6', isDefault: true },
  { id: 'cat-exp-10', name: 'Outros', type: 'expense', color: '#64748b', isDefault: true },
  // Incomes
  { id: 'cat-inc-1', name: 'Salário Fixo', type: 'income', color: '#10b981', isDefault: true },
  { id: 'cat-inc-2', name: 'Renda Extra / Freelance', type: 'income', color: '#06b6d4', isDefault: true },
  { id: 'cat-inc-3', name: 'Rendimentos / Dividendos', type: 'income', color: '#8b5cf6', isDefault: true },
  { id: 'cat-inc-4', name: 'Benefícios', type: 'income', color: '#3b82f6', isDefault: true },
  { id: 'cat-inc-5', name: 'Presente / Outros', type: 'income', color: '#a855f7', isDefault: true },
];

export const DEFAULT_INVESTMENTS: InvestmentAsset[] = [];

const DEFAULT_PROFILE: UserFinancialProfile = {
  name: '',
  fixedSalary: 0,
  salaryPayDay: 5,
  additionalMonthlyIncome: 0,
  savingsRule: 'balanced_20',
  customSavingsPercent: 20,
  notificationsEnabled: true,
  currency: 'BRL',
};

// Initial default lists (strictly clean and empty)
const DEFAULT_BILLS: FixedBill[] = [];
const DEFAULT_GOALS: SavingsGoal[] = [];

export function loadUserProfile(): UserFinancialProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(DEFAULT_PROFILE));
      return DEFAULT_PROFILE;
    }
    const parsed = JSON.parse(raw);
    // Purge old mock default salary (4800) or mock placeholder name
    const cleanedSalary = parsed.fixedSalary === 4800 ? 0 : parsed.fixedSalary || 0;
    const cleanedName = parsed.name === 'Meu Orçamento' || parsed.name === 'Usuário Exemplo' ? '' : parsed.name || '';
    const cleaned = {
      ...DEFAULT_PROFILE,
      ...parsed,
      fixedSalary: cleanedSalary,
      name: cleanedName,
    };
    return cleaned;
  } catch (e) {
    return DEFAULT_PROFILE;
  }
}

export function saveUserProfile(profile: UserFinancialProfile): void {
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
}

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
      return [];
    }
    const list: Transaction[] = JSON.parse(raw);
    // Purge any mock/unreal transactions
    const cleaned = Array.isArray(list)
      ? list.filter((t) => !isUnrealItem(t))
      : [];
    if (cleaned.length !== list.length) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    return [];
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

export function loadFixedBills(): FixedBill[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FIXED_BILLS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.FIXED_BILLS, JSON.stringify([]));
      return [];
    }
    const list: FixedBill[] = JSON.parse(raw);
    // Purge any mock/unreal bills
    const cleaned = Array.isArray(list)
      ? list.filter((b) => !isUnrealItem(b))
      : [];
    if (cleaned.length !== list.length) {
      localStorage.setItem(STORAGE_KEYS.FIXED_BILLS, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    return [];
  }
}

export function saveFixedBills(bills: FixedBill[]): void {
  localStorage.setItem(STORAGE_KEYS.FIXED_BILLS, JSON.stringify(bills));
}

export function loadSavingsGoals(): SavingsGoal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVINGS_GOALS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify([]));
      return [];
    }
    const list: SavingsGoal[] = JSON.parse(raw);
    // Purge any mock/unreal goals
    const cleaned = Array.isArray(list)
      ? list.filter((g) => !isUnrealItem(g))
      : [];
    if (cleaned.length !== list.length) {
      localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    return [];
  }
}

export function saveSavingsGoals(goals: SavingsGoal[]): void {
  localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(goals));
}

export function clearAllFinancialData(): void {
  localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  localStorage.removeItem(STORAGE_KEYS.FIXED_BILLS);
  localStorage.removeItem(STORAGE_KEYS.SAVINGS_GOALS);
  localStorage.removeItem(STORAGE_KEYS.INVESTMENTS);
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(DEFAULT_PROFILE));
}

/**
 * Sweeps localStorage and purges all unreal/mock items across every collection
 */
export function purgeAllLocalUnrealData(): void {
  loadTransactions();
  loadFixedBills();
  loadSavingsGoals();
  loadInvestments();
  loadUserProfile();
}

export interface MonthBillView extends FixedBill {
  resolvedStatus: import('../types').BillStatus;
  resolvedInstallmentText?: string;
  isInstallment: boolean;
  installmentNumber?: number;
  totalInstallmentsCount?: number;
  remainingInstallmentsAfterMonth?: number;
  originalBillId: string;
}

/**
 * Resolves which bills apply to a given month (handles recurring bills and credit card installments)
 */
export function getBillsForMonth(bills: FixedBill[], targetMonth: string): MonthBillView[] {
  const result: MonthBillView[] = [];

  for (const bill of bills) {
    // 1. Installment Bill (e.g. Credit Card installment purchase: 3x, 10x, 12x)
    if (bill.billType === 'installment' || (bill.totalInstallments && bill.totalInstallments > 1)) {
      const startMonth = bill.startMonth || getCurrentMonthKey();
      const total = bill.totalInstallments || 1;
      const diff = getMonthDifference(startMonth, targetMonth);
      const currentInst = (bill.currentInstallment || 1) + diff;

      // Only include if this installment falls in the target month
      if (currentInst >= 1 && currentInst <= total) {
        const isPaid =
          (bill.paidMonths && bill.paidMonths.includes(targetMonth)) ||
          (bill.lastPaidMonth === targetMonth && bill.status === 'paid');

        result.push({
          ...bill,
          originalBillId: bill.id,
          name: `${bill.name} (${currentInst}/${total})`,
          status: isPaid ? 'paid' : 'pending',
          resolvedStatus: isPaid ? 'paid' : 'pending',
          resolvedInstallmentText: `${currentInst}/${total}`,
          isInstallment: true,
          installmentNumber: currentInst,
          totalInstallmentsCount: total,
          remainingInstallmentsAfterMonth: Math.max(0, total - currentInst),
        });
      }
    } else if (bill.billType === 'single') {
      // 2. Single month bill
      const matchesMonth =
        bill.startMonth === targetMonth ||
        (!bill.startMonth && bill.lastPaidMonth === targetMonth) ||
        (!bill.startMonth && !bill.lastPaidMonth);

      if (matchesMonth) {
        const isPaid =
          (bill.paidMonths && bill.paidMonths.includes(targetMonth)) ||
          bill.status === 'paid';

        result.push({
          ...bill,
          originalBillId: bill.id,
          status: isPaid ? 'paid' : 'pending',
          resolvedStatus: isPaid ? 'paid' : 'pending',
          isInstallment: false,
        });
      }
    } else {
      // 3. Recurring bill (e.g. Academia, Aluguel, Streaming, Internet)
      // Automatically active in all months from startMonth onwards
      if (!bill.startMonth || targetMonth >= bill.startMonth) {
        const isPaid =
          (bill.paidMonths && bill.paidMonths.includes(targetMonth)) ||
          (bill.lastPaidMonth === targetMonth && bill.status === 'paid');

        const isRequired = bill.paymentRequired !== false;
        const resolvedStatus = isPaid ? 'paid' : isRequired ? 'pending' : 'paused';

        result.push({
          ...bill,
          originalBillId: bill.id,
          status: resolvedStatus,
          resolvedStatus,
          isInstallment: false,
          paymentRequired: isRequired,
        });
      }
    }
  }

  return result;
}

/**
 * Calculates effective income considering user's month override, account starting balance,
 * full salary start month, and exact arrival date (dia que o salário cai)
 */
export function getMonthEffectiveIncome(
  selectedMonth: string,
  transactions: Transaction[],
  profile: UserFinancialProfile
): {
  totalIncome: number;
  projectedIncome: number;
  baseSalary: number;
  recordedIncome: number;
  isCustomOverride: boolean;
  overrideNote?: string;
  hasSalaryDropped: boolean;
  isFutureMonth: boolean;
  isCurrentMonth: boolean;
} {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonthKey = getCurrentMonthKey();
  const isCurrentMonth = selectedMonth === currentMonthKey;
  const isFutureMonth = selectedMonth > currentMonthKey;
  const isPastMonth = selectedMonth < currentMonthKey;
  const salaryPayDay = profile.salaryPayDay || 5;

  const monthTransactions = transactions.filter((t) => t.date.startsWith(selectedMonth));
  const recordedIncome = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  // 1. User has a specific salary or account balance override for this month (e.g. Setembro)
  if (profile.monthlySalaryOverrides && profile.monthlySalaryOverrides[selectedMonth]) {
    const override = profile.monthlySalaryOverrides[selectedMonth];
    const total = override.amount + recordedIncome;
    const defaultNote =
      override.type === 'account_balance'
        ? `Saldo em Conta (${formatMonthYearPT(selectedMonth)})`
        : `Salário Definido do Mês`;

    return {
      totalIncome: total,
      projectedIncome: total,
      baseSalary: override.amount,
      recordedIncome,
      isCustomOverride: true,
      overrideNote: override.note || defaultNote,
      hasSalaryDropped: true,
      isFutureMonth,
      isCurrentMonth,
    };
  }

  // 2. Full salary starts in a future month (e.g. Outubro) and this month is before it
  if (profile.salaryStartMonth && selectedMonth < profile.salaryStartMonth) {
    return {
      totalIncome: recordedIncome,
      projectedIncome: recordedIncome,
      baseSalary: 0,
      recordedIncome,
      isCustomOverride: true,
      overrideNote: `Salário integral inicia em ${formatMonthYearPT(profile.salaryStartMonth)}`,
      hasSalaryDropped: true,
      isFutureMonth,
      isCurrentMonth,
    };
  }

  const baseSalary = profile.fixedSalary || 0;
  const extra = recordedIncome > 0 ? recordedIncome : (profile.additionalMonthlyIncome || 0);
  const fullExpectedIncome = baseSalary + extra;

  // 3. Timing Check: Has the salary dropped into the account yet?
  // - Future month: NO, month hasn't arrived yet ("ele nem ocorreu ainda")
  // - Current month: YES only if currentDay >= salaryPayDay
  // - Past month: YES, already occurred in the past
  const hasSalaryDropped = isPastMonth || (isCurrentMonth && currentDay >= salaryPayDay);

  if (isFutureMonth) {
    return {
      totalIncome: recordedIncome, // Realized saldo is 0 (or only advance recorded incomes)
      projectedIncome: fullExpectedIncome, // Forecast income once month arrives and salary drops
      baseSalary,
      recordedIncome,
      isCustomOverride: false,
      hasSalaryDropped: false,
      isFutureMonth: true,
      isCurrentMonth: false,
      overrideNote: `Mês Futuro: Salário previsto para cair dia ${salaryPayDay} do mês`,
    };
  }

  if (isCurrentMonth && !hasSalaryDropped) {
    return {
      totalIncome: recordedIncome, // Realized saldo before salary drop is only recorded incomes
      projectedIncome: fullExpectedIncome,
      baseSalary,
      recordedIncome,
      isCustomOverride: false,
      hasSalaryDropped: false,
      isFutureMonth: false,
      isCurrentMonth: true,
      overrideNote: `Salário de ${formatCurrency(baseSalary)} previsto para cair dia ${salaryPayDay} (em ${salaryPayDay - currentDay} dias)`,
    };
  }

  return {
    totalIncome: fullExpectedIncome,
    projectedIncome: fullExpectedIncome,
    baseSalary,
    recordedIncome,
    isCustomOverride: false,
    hasSalaryDropped: true,
    isFutureMonth: false,
    isCurrentMonth,
  };
}

export function calculateFinancialStats(
  selectedMonth: string, // YYYY-MM
  transactions: Transaction[],
  bills: FixedBill[],
  profile: UserFinancialProfile
): FinancialStats {
  const incomeDetails = getMonthEffectiveIncome(selectedMonth, transactions, profile);
  const totalIncome = incomeDetails.totalIncome;
  const projectedIncome = incomeDetails.projectedIncome;

  const monthTransactions = transactions.filter((t) => t.date.startsWith(selectedMonth));
  const totalExpenses = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Resolve bills for this specific month (including gym, subscriptions and installments)
  const monthBills = getBillsForMonth(bills, selectedMonth);
  const activeMonthBills = monthBills.filter((b) => b.resolvedStatus !== 'paused');
  const fixedBillsTotal = activeMonthBills.reduce((sum, b) => sum + b.amount, 0);

  // Avoid duplication: if a bill was already recorded as an expense transaction this month
  // (e.g. direct debit, or paid via bill payment), do not double-subtract it from pending bills.
  const pendingBills = monthBills.filter((b) => {
    if (b.resolvedStatus !== 'pending') return false;
    const alreadyRecordedInTxs = monthTransactions.some(
      (t) =>
        t.type === 'expense' &&
        (t.linkedBillId === b.id ||
          (t.description.toLowerCase().trim().startsWith(b.name.toLowerCase().trim().slice(0, 8)) &&
            Math.abs(t.amount - b.amount) < 0.05))
    );
    return !alreadyRecordedInTxs;
  });
  const pendingBillsCount = pendingBills.length;
  const pendingBillsAmount = pendingBills.reduce((sum, b) => sum + b.amount, 0);

  // Today context for overdue detection (strictly only for CURRENT month!)
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonthKey = getCurrentMonthKey();
  const isCurrentMonth = selectedMonth === currentMonthKey;
  const isFutureMonth = selectedMonth > currentMonthKey;

  // Never mark future month bills as overdue!
  const overdueBillsCount = isCurrentMonth
    ? pendingBills.filter((b) => b.dueDay < currentDay).length
    : 0;

  // Credit Card Installments & Bills in this month (strictly credit only; direct debits never count here)
  const cardBillsAmount = monthBills
    .filter(
      (b) =>
        (b.isInstallment || b.category === 'Faturas & Contas' || b.paymentMethod === 'Cartão de Crédito') &&
        b.paymentMethod !== 'Cartão de Débito'
    )
    .reduce((sum, b) => sum + b.amount, 0);

  const cardTxAmount = monthTransactions
    .filter(
      (t) =>
        t.type === 'expense' &&
        t.paymentMethod === 'Cartão de Crédito' &&
        !monthBills.some(
          (b) =>
            t.linkedBillId === b.id ||
            (t.description.toLowerCase().startsWith(b.name.toLowerCase().slice(0, 8)) &&
              Math.abs(t.amount - b.amount) < 0.05)
        )
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const cardInstallmentsTotal = cardBillsAmount + cardTxAmount;

  // Available Budget calculation:
  // For current month (salary dropped) or past: realized totalIncome - (expenses + pending)
  // For current month (salary not dropped yet): realized totalIncome - expenses
  // For future month: projectedIncome - (pending bills planned)
  let availableBudget = 0;
  if (isFutureMonth) {
    availableBudget = Math.max(0, projectedIncome - (totalExpenses + pendingBillsAmount));
  } else if (isCurrentMonth && !incomeDetails.hasSalaryDropped) {
    // Salary hasn't dropped yet: available budget is current balance
    availableBudget = Math.max(0, totalIncome - totalExpenses);
  } else {
    availableBudget = Math.max(0, totalIncome - (totalExpenses + pendingBillsAmount));
  }

  // Determine savings percentage
  let savingsRate = 20;
  if (profile.savingsRule === 'conservative_10') savingsRate = 10;
  else if (profile.savingsRule === 'balanced_20') savingsRate = 20;
  else if (profile.savingsRule === 'growth_30') savingsRate = 30;
  else if (profile.savingsRule === 'custom') savingsRate = profile.customSavingsPercent || 20;

  // Projected automatic savings based on current available budget
  const projectedSavings = (availableBudget * savingsRate) / 100;

  const variableExpensesTotal = monthTransactions
    .filter((t) => t.type === 'expense' && !t.isFixed && !t.linkedBillId && !t.installment)
    .reduce((sum, t) => sum + t.amount, 0);

  // Global Credit Cards & Future Commitments Overview
  const allCards = loadPaymentCards();
  const creditCards = allCards.filter((c) => c.type !== 'debit');
  const totalCreditLimitGlobal = creditCards.reduce((sum, c) => sum + c.totalLimit, 0);

  let totalCreditCommittedGlobal = 0;
  for (const c of creditCards) {
    const cardUsageInfo = getCardUsage(c, transactions, bills, selectedMonth, allCards);
    totalCreditCommittedGlobal += cardUsageInfo.totalCommittedLimit;
  }
  const totalCreditAvailableGlobal = Math.max(0, Math.round((totalCreditLimitGlobal - totalCreditCommittedGlobal) * 100) / 100);

  // Total remaining open future installments across all bills (credit + others)
  let totalFutureDebtsAmount = 0;
  for (const b of bills) {
    if (b.billType === 'installment' || (b.totalInstallments && b.totalInstallments > 1)) {
      const total = b.totalInstallments || 1;
      const paidCount = Array.isArray(b.paidMonths) ? b.paidMonths.length : (b.status === 'paid' ? 1 : 0);
      const remainingCount = Math.max(0, total - paidCount);
      totalFutureDebtsAmount += remainingCount * b.amount;
    } else if (b.billType === 'single') {
      const isPaid = (Array.isArray(b.paidMonths) && b.paidMonths.length > 0) || b.status === 'paid';
      if (!isPaid) totalFutureDebtsAmount += b.amount;
    }
  }

  // Next upcoming month with pending bills (if selected month has 0 or for forward planning)
  let nextUpcomingBillMonth: string | undefined;
  let nextUpcomingBillAmount = 0;
  let nextUpcomingBillCount = 0;

  for (let i = 1; i <= 6; i++) {
    const checkMonth = addMonthsToKey(selectedMonth, i);
    const billsInCheck = getBillsForMonth(bills, checkMonth).filter((b) => b.resolvedStatus === 'pending');
    if (billsInCheck.length > 0) {
      nextUpcomingBillMonth = checkMonth;
      nextUpcomingBillAmount = billsInCheck.reduce((sum, b) => sum + b.amount, 0);
      nextUpcomingBillCount = billsInCheck.length;
      break;
    }
  }

  return {
    totalIncome,
    totalExpenses,
    fixedBillsTotal,
    variableExpensesTotal,
    availableBudget,
    projectedSavings,
    savingsRate,
    pendingBillsCount,
    pendingBillsAmount,
    overdueBillsCount,
    isCustomIncomeApplied: incomeDetails.isCustomOverride,
    customIncomeNote: incomeDetails.overrideNote,
    cardInstallmentsTotal,
    isFutureMonth,
    isCurrentMonth,
    hasSalaryDropped: incomeDetails.hasSalaryDropped,
    projectedSalary: projectedIncome,
    salaryPayDay: profile.salaryPayDay || 5,
    totalCreditLimitGlobal,
    totalCreditCommittedGlobal,
    totalCreditAvailableGlobal,
    totalFutureDebtsAmount,
    nextUpcomingBillMonth,
    nextUpcomingBillAmount,
    nextUpcomingBillCount,
  };
}

export function loadPaymentCards(): PaymentCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYMENT_CARDS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PAYMENT_CARDS, JSON.stringify([]));
      return [];
    }
    const list: PaymentCard[] = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function savePaymentCards(cards: PaymentCard[]): void {
  localStorage.setItem(STORAGE_KEYS.PAYMENT_CARDS, JSON.stringify(cards));
}

/**
 * Accurately determines if a bill belongs to a specific card
 */
export function isBillForCard(
  bill: FixedBill,
  card: PaymentCard,
  allCards: PaymentCard[] = []
): boolean {
  // A debit-only card cannot have credit bills
  if (card.type === 'debit') {
    return false;
  }
  if (bill.cardId) {
    return bill.cardId === card.id;
  }
  if (bill.cardName) {
    const cleanBillCard = bill.cardName.toLowerCase().trim();
    const cleanName = card.name.toLowerCase().trim();
    const cleanBank = card.bank.toLowerCase().trim();
    if (
      cleanBillCard.includes(cleanName) ||
      cleanBillCard.includes(cleanBank)
    ) {
      return true;
    }
  }
  // Only assign unlinked credit bills if there is exactly 1 credit card in the system
  const creditCards = allCards.filter((c) => c.type !== 'debit');
  if (
    (bill.paymentMethod === 'Cartão de Crédito' || !bill.paymentMethod) &&
    creditCards.length === 1 &&
    creditCards[0].id === card.id
  ) {
    return true;
  }
  return false;
}

/**
 * Accurately determines if a transaction belongs to a specific card
 * Rigorously segregating Debit and Credit cards to avoid misattribution
 */
export function isTransactionForCard(
  t: Transaction,
  card: PaymentCard,
  allCards: PaymentCard[] = []
): boolean {
  // A debit-only card cannot accept credit transactions
  if (card.type === 'debit' && t.paymentMethod === 'Cartão de Crédito') {
    return false;
  }
  // A credit-only card cannot accept debit transactions
  if (card.type === 'credit' && t.paymentMethod === 'Cartão de Débito') {
    return false;
  }

  if (t.cardId) {
    return t.cardId === card.id;
  }
  if (t.cardName) {
    const cleanTxCard = t.cardName.toLowerCase().trim();
    const cleanName = card.name.toLowerCase().trim();
    const cleanBank = card.bank.toLowerCase().trim();
    if (
      cleanTxCard.includes(cleanName) ||
      cleanTxCard.includes(cleanBank)
    ) {
      return true;
    }
  }

  // Fallbacks when cardId is unassigned:
  if (t.paymentMethod === 'Cartão de Crédito') {
    const creditCards = allCards.filter((c) => c.type !== 'debit');
    if (creditCards.length === 1 && creditCards[0].id === card.id) {
      return true;
    }
  }

  if (t.paymentMethod === 'Cartão de Débito') {
    const debitCards = allCards.filter((c) => c.type === 'debit' || c.type === 'both');
    if (debitCards.length === 1 && debitCards[0].id === card.id) {
      return true;
    }
  }

  return false;
}

/**
 * Global calculation of credit card usage and available limit.
 * Independently of the month viewed, credit limit is a global resource:
 * - Direct debits NEVER reduce credit limit or create invoice charges.
 * - Subtraction of all remaining future installments and current pending bills.
 */
export function getCardUsage(
  card: PaymentCard,
  transactions: Transaction[],
  bills: FixedBill[],
  targetMonth: string,
  allCardsInput?: PaymentCard[]
): CardUsage {
  const allCards = allCardsInput && allCardsInput.length > 0 ? allCardsInput : loadPaymentCards();
  const currentMonthKey = getCurrentMonthKey();

  // If card is strictly debit, it has ZERO credit limit and never consumes credit limit
  if (card.type === 'debit') {
    const monthDebitTxs = transactions.filter(
      (t) =>
        t.date.startsWith(targetMonth) &&
        t.type === 'expense' &&
        t.paymentMethod === 'Cartão de Débito' &&
        isTransactionForCard(t, card, allCards)
    );
    const monthDebitExpenses = monthDebitTxs.reduce((sum, t) => sum + t.amount, 0);

    return {
      totalLimit: 0,
      usedAmount: 0,
      monthInvoiceAmount: 0,
      totalCommittedLimit: 0,
      availableLimit: 0,
      monthCreditExpenses: 0,
      monthDebitExpenses,
      futureInstallmentsCount: 0,
      futureInstallmentsTotal: 0,
    };
  }

  // 1. Invoices & expenses strictly for targetMonth
  // CRITICAL: Only credit bills (paymentMethod === 'Cartão de Crédito') affect credit invoices
  const monthBills = getBillsForMonth(bills, targetMonth).filter(
    (b) =>
      isBillForCard(b, card, allCards) &&
      (b.paymentMethod === 'Cartão de Crédito' || !b.paymentMethod)
  );
  const pendingMonthBillsAmount = monthBills
    .filter((b) => b.resolvedStatus === 'pending')
    .reduce((sum, b) => sum + b.amount, 0);

  // Credit transactions in targetMonth
  const monthCreditTxs = transactions.filter(
    (t) =>
      t.date.startsWith(targetMonth) &&
      t.type === 'expense' &&
      t.paymentMethod === 'Cartão de Crédito' &&
      isTransactionForCard(t, card, allCards)
  );
  const monthCreditExpenses = monthCreditTxs.reduce((sum, t) => sum + t.amount, 0);

  // Debit transactions on this card in targetMonth (debit from bank account, NEVER affects credit limit)
  const monthDebitTxs = transactions.filter(
    (t) =>
      t.date.startsWith(targetMonth) &&
      t.type === 'expense' &&
      t.paymentMethod === 'Cartão de Débito' &&
      isTransactionForCard(t, card, allCards)
  );
  const monthDebitExpenses = monthDebitTxs.reduce((sum, t) => sum + t.amount, 0);

  // Discard transactions that already mirror a month bill to prevent double counting
  const unlinkedCreditTxs = monthCreditTxs.filter((t) => {
    if (t.linkedBillId) return false;
    const isDup = monthBills.some(
      (b) =>
        t.description.toLowerCase().startsWith(b.name.toLowerCase().slice(0, 8)) &&
        Math.abs(t.amount - b.amount) < 0.05
    );
    return !isDup;
  });
  const unlinkedTxsAmount = unlinkedCreditTxs.reduce((sum, t) => sum + t.amount, 0);
  const monthInvoiceAmount = Math.round((pendingMonthBillsAmount + unlinkedTxsAmount) * 100) / 100;

  // 2. Global Committed Limit (Limite Total Comprometido / Bloqueado de forma GLOBAL)
  // Regardless of the month being viewed, the credit limit available is a global resource:
  // Subtraction includes:
  // - All remaining unpaid installments across all bills on this card (current + future)
  // - All unpaid single bills on this card
  // - All open standalone credit transactions in current or future cycles
  // - Any standalone installment transactions not covered by bills
  let totalCommittedLimit = 0;
  let futureInstallmentsCount = 0;
  let futureInstallmentsTotal = 0;

  const cardBills = bills.filter(
    (b) =>
      isBillForCard(b, card, allCards) &&
      (b.paymentMethod === 'Cartão de Crédito' || !b.paymentMethod)
  );

  const seenInstallmentGroups = new Set<string>();

  for (const b of cardBills) {
    if (b.installmentGroupId) {
      seenInstallmentGroups.add(b.installmentGroupId);
    }
    if (b.billType === 'installment' || b.isInstallment || (b.totalInstallments && b.totalInstallments > 1)) {
      const total = b.totalInstallments || 1;
      const paidCount = Array.isArray(b.paidMonths)
        ? b.paidMonths.length
        : b.status === 'paid'
        ? 1
        : 0;
      const unpaidCount = Math.max(0, total - paidCount);
      const remainingDebt = unpaidCount * b.amount;
      totalCommittedLimit += remainingDebt;

      // Count installments that fall in future months (month > currentMonthKey)
      let futureCountForThisBill = 0;
      if (b.startMonth) {
        for (let idx = 0; idx < total; idx++) {
          const installmentMonthKey = addMonthsToKey(b.startMonth, idx);
          const isPaid = Array.isArray(b.paidMonths) && b.paidMonths.includes(installmentMonthKey);
          if (!isPaid && installmentMonthKey > currentMonthKey) {
            futureCountForThisBill++;
          }
        }
      } else {
        futureCountForThisBill = Math.max(0, unpaidCount - 1);
      }
      futureInstallmentsCount += futureCountForThisBill;
      futureInstallmentsTotal += futureCountForThisBill * b.amount;
    } else if (b.billType === 'single') {
      const isPaid =
        (Array.isArray(b.paidMonths) && b.paidMonths.length > 0) || b.status === 'paid';
      if (!isPaid) {
        totalCommittedLimit += b.amount;
      }
    } else if (b.billType === 'recurring') {
      if (b.paymentRequired !== false && b.status !== 'paid') {
        totalCommittedLimit += b.amount;
      }
    }
  }

  // Standalone credit transactions not represented in cardBills
  const standaloneCreditTxs = transactions.filter(
    (t) =>
      t.type === 'expense' &&
      t.paymentMethod === 'Cartão de Crédito' &&
      isTransactionForCard(t, card, allCards) &&
      !t.linkedBillId &&
      !cardBills.some(
        (b) =>
          t.description.toLowerCase().startsWith(b.name.toLowerCase().slice(0, 8)) &&
          Math.abs(t.amount - b.amount) < 0.05
      )
  );

  for (const t of standaloneCreditTxs) {
    if (t.installment && t.installment.groupId) {
      if (seenInstallmentGroups.has(t.installment.groupId)) {
        continue; // already handled via bill
      }
      const txMonth = t.date.slice(0, 7);
      if (txMonth >= currentMonthKey) {
        totalCommittedLimit += t.amount;
        if (txMonth > currentMonthKey) {
          futureInstallmentsCount += 1;
          futureInstallmentsTotal += t.amount;
        }
      }
    } else {
      const txMonth = t.date.slice(0, 7);
      if (txMonth >= currentMonthKey) {
        totalCommittedLimit += t.amount;
      }
    }
  }

  totalCommittedLimit = Math.round(totalCommittedLimit * 100) / 100;
  futureInstallmentsTotal = Math.round(futureInstallmentsTotal * 100) / 100;

  // Real available limit = totalLimit - totalCommittedLimit (never below 0)
  const availableLimit = Math.max(0, Math.round((card.totalLimit - totalCommittedLimit) * 100) / 100);

  // 3. Find next invoice month if targetMonth has R$ 0
  let nextInvoiceMonth: string | undefined;
  let nextInvoiceAmount: number | undefined;

  for (let i = 1; i <= 12; i++) {
    const futureKey = addMonthsToKey(targetMonth, i);
    const futureBills = getBillsForMonth(bills, futureKey).filter(
      (b) =>
        isBillForCard(b, card, allCards) &&
        (b.paymentMethod === 'Cartão de Crédito' || !b.paymentMethod) &&
        b.resolvedStatus === 'pending'
    );
    const futureAmt = futureBills.reduce((sum, b) => sum + b.amount, 0);
    if (futureAmt > 0) {
      nextInvoiceMonth = futureKey;
      nextInvoiceAmount = Math.round(futureAmt * 100) / 100;
      break;
    }
  }

  return {
    totalLimit: card.totalLimit,
    usedAmount: monthInvoiceAmount, // Backward-compatibility
    monthInvoiceAmount,
    totalCommittedLimit,
    availableLimit,
    monthCreditExpenses,
    monthDebitExpenses,
    futureInstallmentsCount,
    futureInstallmentsTotal,
    nextInvoiceMonth,
    nextInvoiceAmount,
  };
}

export function loadCustomCategories(): CustomCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
    if (!raw) {
      localStorage.setItem(
        STORAGE_KEYS.CUSTOM_CATEGORIES,
        JSON.stringify(DEFAULT_CUSTOM_CATEGORIES)
      );
      return DEFAULT_CUSTOM_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : DEFAULT_CUSTOM_CATEGORIES;
  } catch (e) {
    return DEFAULT_CUSTOM_CATEGORIES;
  }
}

export function saveCustomCategories(categories: CustomCategory[]): void {
  localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(categories));
}

export function resetDefaultCategories(): CustomCategory[] {
  localStorage.setItem(
    STORAGE_KEYS.CUSTOM_CATEGORIES,
    JSON.stringify(DEFAULT_CUSTOM_CATEGORIES)
  );
  return DEFAULT_CUSTOM_CATEGORIES;
}

export function getCategoryGroup(
  cat: InvestmentCategory
): import('../types').InvestmentCategoryGroup {
  if (['Ações', 'FIIs (Fundos Imobiliários)', 'ETFs', 'BDRs'].includes(cat)) return 'RENDA_VARIAVEL';
  if (['CDB', 'LCI / LCA', 'Debêntures & CRA/CRI', 'CDI / Renda Fixa'].includes(cat)) return 'RENDA_FIXA';
  if (['Tesouro Direto'].includes(cat)) return 'TESOURO_DIRETO';
  if (['Criptomoedas'].includes(cat)) return 'CRIPTO';
  if (['Fundos de Investimento'].includes(cat)) return 'FUNDOS';
  return 'OUTROS';
}

export function loadInvestments(): InvestmentAsset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVESTMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    const cleaned = Array.isArray(parsed)
      ? parsed
          .filter((inv) => !isUnrealItem(inv))
          .map((inv: any): InvestmentAsset => {
            const group = inv.categoria_ativo || getCategoryGroup(inv.category || 'Outros');
            const total = typeof inv.totalInvested === 'number' ? inv.totalInvested : 0;
            return {
              ...inv,
              categoria_ativo: group,
              tipo_operacao: inv.tipo_operacao || 'COMPRA',
              data_operacao: inv.data_operacao || inv.purchaseDate || getTodayDateString(),
              data_liquidacao: inv.data_liquidacao || undefined,
              valor_bruto: typeof inv.valor_bruto === 'number' ? inv.valor_bruto : total,
              valor_liquido: typeof inv.valor_liquido === 'number' ? inv.valor_liquido : total,
              moeda: inv.moeda || 'BRL',
              status: inv.status || 'EXECUTADA',
              institution: inv.institution || inv.id_instituicao || undefined,
              purchaseDate: inv.purchaseDate || inv.data_operacao || getTodayDateString(),
            };
          })
      : [];
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    return [];
  }
}

export function saveInvestments(investments: InvestmentAsset[]): void {
  localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(investments));
}

export function calculateInvestmentStats(
  investments: InvestmentAsset[],
  selectedMonth: string
): InvestmentStats {
  const totalInvested = investments.reduce((sum, inv) => sum + (inv.totalInvested || 0), 0);
  
  const currentTotalValue = investments.reduce((sum, inv) => {
    if (typeof inv.currentTotalValue === 'number' && !isNaN(inv.currentTotalValue)) {
      return sum + inv.currentTotalValue;
    }
    if (typeof inv.currentPrice === 'number' && inv.currentPrice > 0 && inv.quantity > 0) {
      return sum + inv.currentPrice * inv.quantity;
    }
    return sum + (inv.totalInvested || 0);
  }, 0);

  const totalProfitLoss = currentTotalValue - totalInvested;
  const totalProfitLossPercent =
    totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  // Monthly investments: money transformed into investments in this selected month
  const monthlyInvestedAmount = investments
    .filter((inv) => (inv.purchaseDate && inv.purchaseDate.startsWith(selectedMonth)) || (inv.data_operacao && inv.data_operacao.startsWith(selectedMonth)))
    .reduce((sum, inv) => sum + (inv.totalInvested || 0), 0);

  // Group by category allocation
  const categoryTotals: Record<InvestmentCategory, number> = {} as any;
  const groupTotals: Record<import('../types').InvestmentCategoryGroup, number> = {
    RENDA_VARIAVEL: 0,
    RENDA_FIXA: 0,
    TESOURO_DIRETO: 0,
    CRIPTO: 0,
    FUNDOS: 0,
    OUTROS: 0,
  };

  investments.forEach((inv) => {
    const cat = inv.category || 'Outros';
    const group = inv.categoria_ativo || getCategoryGroup(cat);
    const val =
      typeof inv.currentTotalValue === 'number' && inv.currentTotalValue > 0
        ? inv.currentTotalValue
        : inv.totalInvested || 0;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + val;
    groupTotals[group] = (groupTotals[group] || 0) + val;
  });

  const categoryAllocation = Object.entries(categoryTotals)
    .filter(([_, amount]) => amount > 0)
    .map(([cat, amount]) => ({
      category: cat as InvestmentCategory,
      amount,
      percent: currentTotalValue > 0 ? (amount / currentTotalValue) * 100 : 0,
      color: INVESTMENT_CATEGORY_COLORS[cat] || '#64748b',
    }))
    .sort((a, b) => b.amount - a.amount);

  const GROUP_METADATA: Record<
    import('../types').InvestmentCategoryGroup,
    { label: string; color: string }
  > = {
    RENDA_VARIAVEL: { label: 'Renda Variável', color: '#8b5cf6' },
    RENDA_FIXA: { label: 'Renda Fixa', color: '#3b82f6' },
    TESOURO_DIRETO: { label: 'Tesouro Direto', color: '#10b981' },
    CRIPTO: { label: 'Criptomoedas', color: '#f97316' },
    FUNDOS: { label: 'Fundos de Invest.', color: '#6366f1' },
    OUTROS: { label: 'Outros', color: '#64748b' },
  };

  const groupAllocation = (Object.keys(groupTotals) as import('../types').InvestmentCategoryGroup[])
    .filter((grp) => groupTotals[grp] > 0)
    .map((grp) => ({
      group: grp,
      label: GROUP_METADATA[grp].label,
      amount: groupTotals[grp],
      percent: currentTotalValue > 0 ? (groupTotals[grp] / currentTotalValue) * 100 : 0,
      color: GROUP_METADATA[grp].color,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    totalInvested,
    currentTotalValue,
    totalProfitLoss,
    totalProfitLossPercent,
    monthlyInvestedAmount,
    assetCount: investments.length,
    categoryAllocation,
    groupAllocation,
  };
}

export function exportFinancialData(): string {
  const data = {
    profile: loadUserProfile(),
    transactions: loadTransactions(),
    bills: loadFixedBills(),
    goals: loadSavingsGoals(),
    categories: loadCustomCategories(),
    investments: loadInvestments(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

export function importFinancialData(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (data.profile) saveUserProfile(data.profile);
    if (Array.isArray(data.transactions)) saveTransactions(data.transactions);
    if (Array.isArray(data.bills)) saveFixedBills(data.bills);
    if (Array.isArray(data.goals)) saveSavingsGoals(data.goals);
    if (Array.isArray(data.categories)) saveCustomCategories(data.categories);
    if (Array.isArray(data.investments)) saveInvestments(data.investments);
    return true;
  } catch (e) {
    console.error('Error importing data:', e);
    return false;
  }
}

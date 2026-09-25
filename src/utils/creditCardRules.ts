import { PaymentCard } from '../types';

export interface CreditCardBillingCycle {
  // Data original da compra ou parcela
  purchaseDate: string; // YYYY-MM-DD
  // Data exata de fechamento da fatura correspondente
  closingDate: string; // YYYY-MM-DD
  closingDay: number;
  // Data exata de vencimento da fatura
  dueDate: string; // YYYY-MM-DD
  dueDay: number;
  // Identificador do mês da fatura (mês do vencimento: YYYY-MM)
  invoiceMonthKey: string; // YYYY-MM
  // Início do ciclo de compras (dia seguinte ao fechamento anterior)
  cycleStartDate: string; // YYYY-MM-DD
  // Fim do ciclo de compras (dia do fechamento atual)
  cycleEndDate: string; // YYYY-MM-DD
  // Indica se a compra caiu após o fechamento do mês da compra
  isClosedForPurchaseMonth: boolean;
  // Texto explicativo legível (ex: "Compras de 26/08 a 25/09 • Vencimento 02/10")
  summaryLabel: string;
}

/**
 * Retorna o número de dias de um determinado mês em um determinado ano.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Retorna o dia de fechamento efetivo do cartão, garantindo um valor válido (1 - 31).
 * Se não informado:
 * - Se dueDay > 7: padrão de 7 dias antes do vencimento (ex: vencimento 10 -> fecha dia 3).
 * - Se dueDay <= 7: fechamento no mês anterior (ex: vencimento 2 -> fecha dia 25).
 */
export function getEffectiveClosingDay(card?: { closingDay?: number; dueDay?: number }): number {
  if (card?.closingDay && card.closingDay >= 1 && card.closingDay <= 31) {
    return card.closingDay;
  }
  const due = card?.dueDay && card.dueDay >= 1 && card.dueDay <= 31 ? card.dueDay : 10;
  if (due > 7) {
    return due - 7;
  }
  // Vencimento nos primeiros dias do mês (ex: dia 2): fecha por volta do dia 25 do mês anterior
  return Math.min(31, Math.max(1, due - 7 + 30));
}

/**
 * Retorna o dia de vencimento efetivo do cartão (1 - 31).
 */
export function getEffectiveDueDay(card?: { dueDay?: number }): number {
  if (card?.dueDay && card.dueDay >= 1 && card.dueDay <= 31) {
    return card.dueDay;
  }
  return 10;
}

/**
 * REGRA UNIVERSAL DE CARTÃO DE CRÉDITO:
 * 
 * Se a compra for realizada até o dia do fechamento (inclusive), ela entra na fatura que fecha
 * naquele ciclo e é paga no vencimento correspondente.
 * Se a compra for realizada APÓS o dia do fechamento, a fatura daquele mês já está fechada,
 * logo a compra é lançada para o ciclo seguinte e paga no vencimento do próximo mês.
 *
 * Exemplo prático do usuário (Cartão Inter Tiago: Fechamento dia 25, Vencimento dia 2):
 * - Compra até 25 de setembro (período de 26/08 a 25/09):
 *   Fatura fecha em 25/09 e vence em 02/10.
 * - Compra em 26 de setembro (período de 26/09 a 25/10):
 *   Fatura de setembro já fechou; compra entra no ciclo que fecha em 25/10 e vence em 02/11.
 */
export function calculateCreditCardBilling(
  purchaseDateStr: string,
  card?: { closingDay?: number; dueDay?: number }
): CreditCardBillingCycle {
  // Parsing seguro de YYYY-MM-DD
  const parts = (purchaseDateStr || '').split('-');
  const now = new Date();
  const purchaseYear = parts[0] ? parseInt(parts[0], 10) : now.getFullYear();
  const purchaseMonth = parts[1] ? parseInt(parts[1], 10) : now.getMonth() + 1;
  const purchaseDay = parts[2] ? parseInt(parts[2], 10) : now.getDate();

  const closingDay = getEffectiveClosingDay(card);
  const dueDay = getEffectiveDueDay(card);

  // Limite de dias do mês da compra (ex: Fev tem 28 ou 29)
  const maxDaysThisMonth = getDaysInMonth(purchaseYear, purchaseMonth);
  const clampedClosingDayThisMonth = Math.min(closingDay, maxDaysThisMonth);

  // 1. Determina o mês e ano do fechamento da fatura em que a compra entra
  let closingYear = purchaseYear;
  let closingMonth = purchaseMonth;
  const isClosedForPurchaseMonth = purchaseDay > clampedClosingDayThisMonth;

  if (isClosedForPurchaseMonth) {
    // Compra realizada APÓS o fechamento: entra na fatura do ciclo seguinte
    if (purchaseMonth === 12) {
      closingYear = purchaseYear + 1;
      closingMonth = 1;
    } else {
      closingMonth = purchaseMonth + 1;
    }
  }

  const maxDaysClosingMonth = getDaysInMonth(closingYear, closingMonth);
  const effectiveClosingDay = Math.min(closingDay, maxDaysClosingMonth);
  const closingDate = `${closingYear}-${String(closingMonth).padStart(2, '0')}-${String(effectiveClosingDay).padStart(2, '0')}`;

  // 2. Determina o ciclo de compras (início e fim)
  // O ciclo começou no dia seguinte ao fechamento anterior
  let prevClosingYear = closingYear;
  let prevClosingMonth = closingMonth - 1;
  if (prevClosingMonth < 1) {
    prevClosingMonth = 12;
    prevClosingYear = closingYear - 1;
  }
  const maxDaysPrevMonth = getDaysInMonth(prevClosingYear, prevClosingMonth);
  const prevClosingDay = Math.min(closingDay, maxDaysPrevMonth);
  
  // Data seguinte ao fechamento anterior
  const cycleStartDateObj = new Date(prevClosingYear, prevClosingMonth - 1, prevClosingDay);
  cycleStartDateObj.setDate(cycleStartDateObj.getDate() + 1);
  const cycleStartYear = cycleStartDateObj.getFullYear();
  const cycleStartMonth = cycleStartDateObj.getMonth() + 1;
  const cycleStartDay = cycleStartDateObj.getDate();
  const cycleStartDate = `${cycleStartYear}-${String(cycleStartMonth).padStart(2, '0')}-${String(cycleStartDay).padStart(2, '0')}`;
  const cycleEndDate = closingDate;

  // 3. Determina a data de vencimento da fatura
  // Se o dia de vencimento for maior que o dia de fechamento (ex: fecha dia 3, vence dia 10):
  // O vencimento ocorre no MESMO mês do fechamento.
  // Se o dia de vencimento for menor ou igual ao dia de fechamento (ex: fecha dia 25, vence dia 2):
  // O vencimento ocorre no mês SEGUINTE ao mês do fechamento.
  let dueYear = closingYear;
  let dueMonth = closingMonth;

  if (dueDay <= closingDay) {
    if (closingMonth === 12) {
      dueYear = closingYear + 1;
      dueMonth = 1;
    } else {
      dueMonth = closingMonth + 1;
    }
  }

  const maxDaysDueMonth = getDaysInMonth(dueYear, dueMonth);
  const effectiveDueDay = Math.min(dueDay, maxDaysDueMonth);
  const dueDate = `${dueYear}-${String(dueMonth).padStart(2, '0')}-${String(effectiveDueDay).padStart(2, '0')}`;
  const invoiceMonthKey = `${dueYear}-${String(dueMonth).padStart(2, '0')}`;

  const summaryLabel = `Compras de ${String(cycleStartDay).padStart(2, '0')}/${String(cycleStartMonth).padStart(2, '0')} a ${String(effectiveClosingDay).padStart(2, '0')}/${String(closingMonth).padStart(2, '0')} • Vencimento: ${String(effectiveDueDay).padStart(2, '0')}/${String(dueMonth).padStart(2, '0')}`;

  return {
    purchaseDate: purchaseDateStr,
    closingDate,
    closingDay: effectiveClosingDay,
    dueDate,
    dueDay: effectiveDueDay,
    invoiceMonthKey,
    cycleStartDate,
    cycleEndDate,
    isClosedForPurchaseMonth,
    summaryLabel,
  };
}

/**
 * Calcula o cronograma de faturas para uma compra parcelada em N vezes.
 * A 1ª parcela cai no vencimento correspondente à data da compra.
 * As parcelas subsequentes caem nos vencimentos dos meses seguintes.
 */
export function calculateInstallmentBillingSchedule(
  purchaseDateStr: string,
  card?: { closingDay?: number; dueDay?: number },
  totalInstallments: number = 1
): {
  installmentNumber: number;
  totalInstallments: number;
  dueDate: string;
  invoiceMonthKey: string;
}[] {
  const firstBilling = calculateCreditCardBilling(purchaseDateStr, card);
  const dueDay = firstBilling.dueDay;
  const [firstYearStr, firstMonthStr] = firstBilling.invoiceMonthKey.split('-');
  let currentYear = parseInt(firstYearStr, 10);
  let currentMonth = parseInt(firstMonthStr, 10);

  const schedule: {
    installmentNumber: number;
    totalInstallments: number;
    dueDate: string;
    invoiceMonthKey: string;
  }[] = [];

  for (let i = 0; i < totalInstallments; i++) {
    const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const maxDays = getDaysInMonth(currentYear, currentMonth);
    const day = Math.min(dueDay, maxDays);
    const dueDate = `${monthKey}-${String(day).padStart(2, '0')}`;

    schedule.push({
      installmentNumber: i + 1,
      totalInstallments,
      dueDate,
      invoiceMonthKey: monthKey,
    });

    // Avança 1 mês
    if (currentMonth === 12) {
      currentYear += 1;
      currentMonth = 1;
    } else {
      currentMonth += 1;
    }
  }

  return schedule;
}

/**
 * Encontra o cartão correspondente a uma transação (por cardId ou cardName).
 */
export function findCardForTransaction(
  tx: { cardId?: string; cardName?: string; paymentMethod?: string },
  cards: PaymentCard[] = []
): PaymentCard | undefined {
  if (tx.cardId) {
    const byId = cards.find((c) => c.id === tx.cardId);
    if (byId) return byId;
  }
  if (tx.cardName) {
    const normName = tx.cardName.toLowerCase().trim();
    const byName = cards.find(
      (c) =>
        c.name.toLowerCase().trim() === normName ||
        `${c.bank} - ${c.name}`.toLowerCase().trim() === normName ||
        `${c.bank} ${c.name}`.toLowerCase().trim() === normName
    );
    if (byName) return byName;
  }
  return undefined;
}

/**
 * Retorna o mês da fatura (YYYY-MM) em que a transação de cartão de crédito é cobrada/vencida.
 * Suporta transações à vista e parceladas.
 */
export function getTransactionInvoiceMonth(
  tx: {
    date: string;
    paymentMethod?: string;
    cardId?: string;
    cardName?: string;
    installment?: { current: number; total: number };
    invoiceMonth?: string;
  },
  cards: PaymentCard[] = []
): string {
  // Se não for cartão de crédito, o mês é o próprio mês da data
  if (tx.paymentMethod !== 'Cartão de Crédito') {
    return (tx.date || '').slice(0, 7);
  }

  // Se já possui invoiceMonth explícito definido
  if (tx.invoiceMonth) {
    return tx.invoiceMonth;
  }

  const card = findCardForTransaction(tx, cards);
  if (!card) {
    // Sem cartão configurado, fallback para o mês da transação
    return (tx.date || '').slice(0, 7);
  }

  // Se a transação for uma parcela específica (ex: parcela 2 de 3)
  const currentInst = tx.installment?.current || 1;
  const firstBilling = calculateCreditCardBilling(tx.date, card);

  if (currentInst <= 1) {
    return firstBilling.invoiceMonthKey;
  }

  // Para parcelas > 1, avança (currentInst - 1) meses a partir da primeira fatura
  const [firstYearStr, firstMonthStr] = firstBilling.invoiceMonthKey.split('-');
  let year = parseInt(firstYearStr, 10);
  let month = parseInt(firstMonthStr, 10) + (currentInst - 1);
  while (month > 12) {
    year += 1;
    month -= 12;
  }

  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Retorna a data exata de vencimento da fatura da transação (YYYY-MM-DD).
 */
export function getTransactionInvoiceDueDate(
  tx: {
    date: string;
    paymentMethod?: string;
    cardId?: string;
    cardName?: string;
    installment?: { current: number; total: number };
    invoiceDueDate?: string;
    invoiceMonth?: string;
  },
  cards: PaymentCard[] = []
): string {
  if (tx.paymentMethod !== 'Cartão de Crédito') {
    return tx.date;
  }
  if (tx.invoiceDueDate) {
    return tx.invoiceDueDate;
  }
  const card = findCardForTransaction(tx, cards);
  const dueDay = getEffectiveDueDay(card);
  const invoiceMonth = getTransactionInvoiceMonth(tx, cards);
  const [yearStr, monthStr] = invoiceMonth.split('-');
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);
  const maxDays = getDaysInMonth(y, m);
  const day = Math.min(dueDay, maxDays);
  return `${invoiceMonth}-${String(day).padStart(2, '0')}`;
}

/**
 * Retorna as datas de ciclo e vencimento para uma fatura de um determinado mês (targetMonthKey: YYYY-MM).
 * Ex: para targetMonthKey '2026-10', com Inter Tiago (C=25, V=2):
 * - Vencimento: 02/10/2026
 * - Fechamento: 25/09/2026
 * - Início do ciclo: 26/08/2026
 * - Fim do ciclo: 25/09/2026
 */
export function getInvoiceCycleForMonth(
  targetMonthKey: string,
  card?: { closingDay?: number; dueDay?: number }
): {
  targetMonthKey: string;
  dueDate: string;
  dueDay: number;
  closingDate: string;
  closingDay: number;
  cycleStartDate: string;
  cycleEndDate: string;
  label: string;
} {
  const [yearStr, monthStr] = targetMonthKey.split('-');
  const dueYear = parseInt(yearStr, 10);
  const dueMonth = parseInt(monthStr, 10);

  const closingDay = getEffectiveClosingDay(card);
  const dueDay = getEffectiveDueDay(card);

  // Se dueDay <= closingDay (ex: vence dia 2, fecha dia 25), o fechamento desta fatura ocorreu no mês anterior
  let closingYear = dueYear;
  let closingMonth = dueMonth;
  if (dueDay <= closingDay) {
    if (dueMonth === 1) {
      closingYear = dueYear - 1;
      closingMonth = 12;
    } else {
      closingMonth = dueMonth - 1;
    }
  }

  const maxDaysClosing = getDaysInMonth(closingYear, closingMonth);
  const effectiveClosingDay = Math.min(closingDay, maxDaysClosing);
  const closingDate = `${closingYear}-${String(closingMonth).padStart(2, '0')}-${String(effectiveClosingDay).padStart(2, '0')}`;

  // Início do ciclo: dia seguinte ao fechamento anterior
  let prevClosingYear = closingYear;
  let prevClosingMonth = closingMonth - 1;
  if (prevClosingMonth < 1) {
    prevClosingMonth = 12;
    prevClosingYear = closingYear - 1;
  }
  const maxDaysPrev = getDaysInMonth(prevClosingYear, prevClosingMonth);
  const prevClosingDay = Math.min(closingDay, maxDaysPrev);
  const cycleStartDateObj = new Date(prevClosingYear, prevClosingMonth - 1, prevClosingDay);
  cycleStartDateObj.setDate(cycleStartDateObj.getDate() + 1);

  const cycleStartYear = cycleStartDateObj.getFullYear();
  const cycleStartMonth = cycleStartDateObj.getMonth() + 1;
  const cycleStartDay = cycleStartDateObj.getDate();
  const cycleStartDate = `${cycleStartYear}-${String(cycleStartMonth).padStart(2, '0')}-${String(cycleStartDay).padStart(2, '0')}`;

  const maxDaysDue = getDaysInMonth(dueYear, dueMonth);
  const effectiveDueDay = Math.min(dueDay, maxDaysDue);
  const dueDate = `${targetMonthKey}-${String(effectiveDueDay).padStart(2, '0')}`;

  const label = `Compras de ${String(cycleStartDay).padStart(2, '0')}/${String(cycleStartMonth).padStart(2, '0')} a ${String(effectiveClosingDay).padStart(2, '0')}/${String(closingMonth).padStart(2, '0')} • Vence em ${String(effectiveDueDay).padStart(2, '0')}/${String(dueMonth).padStart(2, '0')}`;

  return {
    targetMonthKey,
    dueDate,
    dueDay: effectiveDueDay,
    closingDate,
    closingDay: effectiveClosingDay,
    cycleStartDate,
    cycleEndDate: closingDate,
    label,
  };
}

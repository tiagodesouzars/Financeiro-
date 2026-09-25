import { describe, it, expect } from 'vitest';
import {
  calculateCreditCardBilling,
  calculateInstallmentBillingSchedule,
  getTransactionInvoiceMonth,
  getTransactionInvoiceDueDate,
  getInvoiceCycleForMonth,
} from '../creditCardRules';
import { PaymentCard } from '../../types';

describe('Credit Card Universal Billing Rules', () => {
  // Cenário exato do usuário: Cartão Inter Tiago
  // Fechamento: dia 25
  // Vencimento: dia 2
  const interTiagoCard: PaymentCard = {
    id: 'card-inter-tiago',
    name: 'Inter Tiago',
    bank: 'Inter',
    type: 'credit',
    totalLimit: 10000,
    closingDay: 25,
    dueDay: 2,
    createdAt: Date.now(),
  };

  it('compra realizada no dia do fechamento (25/09) cai na fatura que vence em 02/10', () => {
    const billing = calculateCreditCardBilling('2026-09-25', interTiagoCard);

    expect(billing.isClosedForPurchaseMonth).toBe(false);
    expect(billing.closingDate).toBe('2026-09-25');
    expect(billing.dueDate).toBe('2026-10-02');
    expect(billing.invoiceMonthKey).toBe('2026-10');
    expect(billing.cycleStartDate).toBe('2026-08-26');
    expect(billing.cycleEndDate).toBe('2026-09-25');
  });

  it('compra realizada dentro do ciclo antes do fechamento (ex: 20/09) cai na fatura que vence em 02/10', () => {
    const billing = calculateCreditCardBilling('2026-09-20', interTiagoCard);

    expect(billing.isClosedForPurchaseMonth).toBe(false);
    expect(billing.closingDate).toBe('2026-09-25');
    expect(billing.dueDate).toBe('2026-10-02');
    expect(billing.invoiceMonthKey).toBe('2026-10');
  });

  it('compra em 30 de agosto (após 25/08) cai no ciclo que fecha em 25/09 e vence em 02/10', () => {
    const billing = calculateCreditCardBilling('2026-08-30', interTiagoCard);

    expect(billing.closingDate).toBe('2026-09-25');
    expect(billing.dueDate).toBe('2026-10-02');
    expect(billing.invoiceMonthKey).toBe('2026-10');
  });

  it('compra realizada após o dia do fechamento (26/09) cai na fatura do mês seguinte (02/11)', () => {
    const billing = calculateCreditCardBilling('2026-09-26', interTiagoCard);

    expect(billing.isClosedForPurchaseMonth).toBe(true);
    expect(billing.closingDate).toBe('2026-10-25');
    expect(billing.dueDate).toBe('2026-11-02');
    expect(billing.invoiceMonthKey).toBe('2026-11');
    expect(billing.cycleStartDate).toBe('2026-09-26');
    expect(billing.cycleEndDate).toBe('2026-10-25');
  });

  it('cartão com vencimento posterior ao fechamento no mesmo mês (fecha dia 3, vence dia 10)', () => {
    const nubankCard: PaymentCard = {
      id: 'card-nu',
      name: 'Nubank',
      bank: 'Nubank',
      type: 'credit',
      totalLimit: 5000,
      closingDay: 3,
      dueDay: 10,
      createdAt: Date.now(),
    };

    // Compra dia 02/10 (antes do fechamento 03/10) -> vence dia 10/10
    const b1 = calculateCreditCardBilling('2026-10-02', nubankCard);
    expect(b1.closingDate).toBe('2026-10-03');
    expect(b1.dueDate).toBe('2026-10-10');
    expect(b1.invoiceMonthKey).toBe('2026-10');

    // Compra dia 04/10 (após o fechamento 03/10) -> vence dia 10/11
    const b2 = calculateCreditCardBilling('2026-10-04', nubankCard);
    expect(b2.closingDate).toBe('2026-11-03');
    expect(b2.dueDate).toBe('2026-11-10');
    expect(b2.invoiceMonthKey).toBe('2026-11');
  });

  it('compra parcelada em 3x no dia 26/09 projeta as 3 parcelas a partir de 02/11', () => {
    const schedule = calculateInstallmentBillingSchedule('2026-09-26', interTiagoCard, 3);

    expect(schedule).toHaveLength(3);
    expect(schedule[0]).toEqual({
      installmentNumber: 1,
      totalInstallments: 3,
      dueDate: '2026-11-02',
      invoiceMonthKey: '2026-11',
    });
    expect(schedule[1]).toEqual({
      installmentNumber: 2,
      totalInstallments: 3,
      dueDate: '2026-12-02',
      invoiceMonthKey: '2026-12',
    });
    expect(schedule[2]).toEqual({
      installmentNumber: 3,
      totalInstallments: 3,
      dueDate: '2027-01-02',
      invoiceMonthKey: '2027-01',
    });
  });

  it('compra parcelada em 3x no dia 25/09 projeta as 3 parcelas a partir de 02/10', () => {
    const schedule = calculateInstallmentBillingSchedule('2026-09-25', interTiagoCard, 3);

    expect(schedule).toHaveLength(3);
    expect(schedule[0].dueDate).toBe('2026-10-02');
    expect(schedule[0].invoiceMonthKey).toBe('2026-10');
    expect(schedule[1].dueDate).toBe('2026-11-02');
    expect(schedule[1].invoiceMonthKey).toBe('2026-11');
    expect(schedule[2].dueDate).toBe('2026-12-02');
    expect(schedule[2].invoiceMonthKey).toBe('2026-12');
  });

  it('getTransactionInvoiceMonth e getTransactionInvoiceDueDate identificam corretamente', () => {
    const txBeforeClosing = {
      id: 'tx-1',
      date: '2026-09-25',
      paymentMethod: 'Cartão de Crédito',
      cardId: interTiagoCard.id,
    };
    expect(getTransactionInvoiceMonth(txBeforeClosing, [interTiagoCard])).toBe('2026-10');
    expect(getTransactionInvoiceDueDate(txBeforeClosing, [interTiagoCard])).toBe('2026-10-02');

    const txAfterClosing = {
      id: 'tx-2',
      date: '2026-09-26',
      paymentMethod: 'Cartão de Crédito',
      cardId: interTiagoCard.id,
    };
    expect(getTransactionInvoiceMonth(txAfterClosing, [interTiagoCard])).toBe('2026-11');
    expect(getTransactionInvoiceDueDate(txAfterClosing, [interTiagoCard])).toBe('2026-11-02');
  });

  it('getInvoiceCycleForMonth descreve corretamente o ciclo da fatura', () => {
    const cycleOct = getInvoiceCycleForMonth('2026-10', interTiagoCard);
    expect(cycleOct.dueDate).toBe('2026-10-02');
    expect(cycleOct.closingDate).toBe('2026-09-25');
    expect(cycleOct.cycleStartDate).toBe('2026-08-26');

    const cycleNov = getInvoiceCycleForMonth('2026-11', interTiagoCard);
    expect(cycleNov.dueDate).toBe('2026-11-02');
    expect(cycleNov.closingDate).toBe('2026-10-25');
    expect(cycleNov.cycleStartDate).toBe('2026-09-26');
  });
});

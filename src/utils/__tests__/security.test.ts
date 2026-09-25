import { describe, it, expect } from 'vitest';
import { runSecurityAudit, encryptPayload, decryptPayload } from '../security';
import { sanitizeForFirestore } from '../../services/cloudStorage';
import { PaymentCard, Transaction } from '../../types';
import { getCardUsage } from '../storage';

describe('Security & Data Integrity Suite', () => {
  it('strictly isolates Debit purchases from credit card limit', () => {
    const card: PaymentCard = {
      id: 'card-test-1',
      bank: 'Nubank',
      name: 'Roxinho Teste',
      type: 'both',
      totalLimit: 3000,
      dueDay: 10,
      closingDay: 3,
      createdAt: Date.now(),
    };

    const initialUsage = getCardUsage(card, [], [], '2026-09', [card]);
    expect(initialUsage.availableLimit).toBe(3000);

    const debitTx: Transaction = {
      id: 'tx-debit-1',
      type: 'expense',
      amount: 450,
      category: 'Alimentação',
      description: 'Supermercado Débito',
      date: '2026-09-10',
      paymentMethod: 'Cartão de Débito',
      cardId: card.id,
      createdAt: Date.now(),
    };

    const usageAfterDebit = getCardUsage(card, [debitTx], [], '2026-09', [card]);
    // Debit must NOT decrease credit limit
    expect(usageAfterDebit.availableLimit).toBe(3000);
    expect(usageAfterDebit.monthDebitExpenses).toBe(450);
    expect(usageAfterDebit.monthCreditExpenses).toBe(0);
  });

  it('correctly reduces credit limit for credit card transactions and future installments', () => {
    const card: PaymentCard = {
      id: 'card-test-2',
      bank: 'Inter',
      name: 'Black Teste',
      type: 'credit',
      totalLimit: 5000,
      dueDay: 20,
      closingDay: 13,
      createdAt: Date.now(),
    };

    const creditTx: Transaction = {
      id: 'tx-credit-1',
      type: 'expense',
      amount: 1000,
      category: 'Eletrônicos',
      description: 'Notebook',
      date: '2026-09-15',
      paymentMethod: 'Cartão de Crédito',
      cardId: card.id,
      installment: {
        current: 1,
        total: 5,
        groupId: 'grp-test-1',
        originalAmount: 1000,
      },
      createdAt: Date.now(),
    };

    const usage = getCardUsage(card, [creditTx], [], '2026-09', [card]);
    // 5000 limit - 1000 total commitment = 4000 available
    expect(usage.availableLimit).toBe(4000);
    expect(usage.totalCommittedLimit).toBe(1000);
    expect(usage.futureInstallmentsTotal).toBe(800); // 4 remaining installments of 200
  });

  it('sanitizes undefined values to prevent Firestore rejection', () => {
    const rawData = {
      id: '123',
      name: 'Teste',
      notes: undefined,
      nested: {
        valid: true,
        bad: undefined,
      },
      list: ['item', undefined, 'valid2'],
    };

    const cleaned = sanitizeForFirestore(rawData);
    expect(cleaned.notes).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(cleaned, 'notes')).toBe(false);
    expect(cleaned.nested.valid).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(cleaned.nested, 'bad')).toBe(false);
  });

  it('runs complete security audit suite with passing status', async () => {
    const auditReport = await runSecurityAudit([], [], [], undefined, {
      enabled: true,
      pinFallback: '1234',
      requireOnAppResume: true,
    });
    expect(auditReport.totalTests).toBeGreaterThanOrEqual(5);
    expect(auditReport.overallStatus).toBe('secure');
    expect(auditReport.score).toBeGreaterThanOrEqual(80);
  });
});

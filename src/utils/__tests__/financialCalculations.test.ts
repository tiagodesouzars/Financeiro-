import { describe, it, expect } from 'vitest';
import { calculateFinancialStats, calculateInvestmentsSummary } from '../storage';
import { Transaction, FixedBill, UserFinancialProfile, InvestmentAsset } from '../../types';

describe('Financial Calculations Suite', () => {
  const profile: UserFinancialProfile = {
    name: 'Usuário Teste',
    fixedSalary: 6000,
    salaryPayDay: 5,
    additionalMonthlyIncome: 0,
    savingsRule: 'balanced_20',
    customSavingsPercent: 20,
    notificationsEnabled: true,
    currency: 'BRL',
  };

  it('calculates monthly income, expenses, and net balance correctly', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        type: 'income',
        amount: 6000,
        category: 'Salário',
        description: 'Salário Mensal',
        date: '2026-09-05',
        paymentMethod: 'Pix',
        createdAt: Date.now(),
      },
      {
        id: 'tx-2',
        type: 'expense',
        amount: 1500,
        category: 'Aluguel & Moradia',
        description: 'Aluguel do Mês',
        date: '2026-09-10',
        paymentMethod: 'Transferência',
        createdAt: Date.now(),
      },
      {
        id: 'tx-3',
        type: 'expense',
        amount: 500,
        category: 'Alimentação',
        description: 'Mercado Semanal',
        date: '2026-09-12',
        paymentMethod: 'Cartão de Débito',
        createdAt: Date.now(),
      },
    ];

    const bills: FixedBill[] = [
      {
        id: 'bill-1',
        name: 'Internet Fibra',
        amount: 150,
        dueDay: 20,
        category: 'Serviços & Assinaturas',
        paymentMethod: 'Boleto',
        autoReminder: true,
        status: 'pending',
        paidMonths: [],
      },
    ];

    const stats = calculateFinancialStats('2026-09', transactions, bills, profile);

    // Profile salary (6000) + Extra income transaction (6000) = 12000
    expect(stats.totalIncome).toBe(12000);
    expect(stats.totalExpenses).toBe(2000);
    expect(stats.availableBudget).toBeGreaterThan(0);
    expect(stats.pendingBillsCount).toBe(1);
    expect(stats.pendingBillsAmount).toBe(150);
  });

  it('calculates investment portfolio summary correctly', () => {
    const assets: InvestmentAsset[] = [
      {
        id: 'ast-1',
        name: 'Tesouro Selic 2029',
        category: 'Tesouro Direto',
        categoria_ativo: 'TESOURO_DIRETO',
        tipo_operacao: 'COMPRA',
        data_operacao: '2026-09-01',
        purchaseDate: '2026-09-01',
        quantity: 10,
        purchasePrice: 1000,
        totalInvested: 10000,
        currentTotalValue: 10800,
        valor_bruto: 10000,
        valor_liquido: 10000,
        moeda: 'BRL',
        status: 'EXECUTADA',
        institution: 'Tesouro Direto',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'ast-2',
        name: 'KNIP11',
        category: 'FIIs (Fundos Imobiliários)',
        categoria_ativo: 'FUNDOS',
        tipo_operacao: 'COMPRA',
        data_operacao: '2026-09-02',
        purchaseDate: '2026-09-02',
        quantity: 50,
        purchasePrice: 100,
        totalInvested: 5000,
        currentTotalValue: 4700,
        valor_bruto: 5000,
        valor_liquido: 5000,
        moeda: 'BRL',
        status: 'EXECUTADA',
        institution: 'XP Investimentos',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const summary = calculateInvestmentsSummary(assets, '2026-09');
    expect(summary.totalInvested).toBe(15000);
    expect(summary.currentTotalValue).toBe(15500);
    expect(summary.totalProfitLoss).toBe(500);
    expect(summary.totalProfitLossPercent).toBeCloseTo(3.33, 1);
  });
});

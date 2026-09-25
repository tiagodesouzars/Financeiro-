import { describe, it, expect } from 'vitest';
import {
  generateRecommendedBudgets,
  analyzeCategorySpending,
  isCategoryEssential,
  applyAllRecommendedBudgets,
} from '../categoryBudgetAnalysis';
import { CustomCategory, Transaction, UserFinancialProfile, FixedBill } from '../../types';

describe('Spending Pattern Analysis & Recommended Category Budgets', () => {
  const profile: UserFinancialProfile = {
    name: 'Tiago',
    fixedSalary: 5000,
    salaryPayDay: 5,
    additionalMonthlyIncome: 1000, // Total = 6000
    savingsRule: 'balanced_20', // 20% = 1200
    customSavingsPercent: 20,
    notificationsEnabled: true,
    currency: 'BRL',
  };

  const fixedBills: FixedBill[] = [
    {
      id: 'b1',
      name: 'Aluguel & Condomínio',
      amount: 2000,
      dueDay: 10,
      category: 'Moradia',
      status: 'pending',
      billType: 'recurring',
      autoReminder: false,
      paymentMethod: 'Boleto',
    },
  ];

  // Discretionary Budget = 6000 - 1200 (reserva) - 2000 (aluguel) = 2800

  const categories: CustomCategory[] = [
    {
      id: 'cat-alimentacao',
      name: 'Alimentação & Supermercado',
      type: 'expense',
      color: '#10b981',
    },
    {
      id: 'cat-lazer',
      name: 'Lazer & Restaurantes',
      type: 'expense',
      color: '#f59e0b',
    },
  ];

  const transactions: Transaction[] = [
    // Mês 1: 2026-07
    {
      id: 'tx-1',
      type: 'expense',
      amount: 600,
      category: 'Alimentação & Supermercado',
      description: 'Supermercado Mensal',
      date: '2026-07-10',
      paymentMethod: 'Pix',
      createdAt: 1,
    },
    {
      id: 'tx-2',
      type: 'expense',
      amount: 400,
      category: 'Lazer & Restaurantes',
      description: 'Jantar amigos',
      date: '2026-07-15',
      paymentMethod: 'Pix',
      createdAt: 2,
    },
    // Mês 2: 2026-08
    {
      id: 'tx-3',
      type: 'expense',
      amount: 650,
      category: 'Alimentação & Supermercado',
      description: 'Supermercado',
      date: '2026-08-05',
      paymentMethod: 'Pix',
      createdAt: 3,
    },
    {
      id: 'tx-4',
      type: 'expense',
      amount: 550, // subindo
      category: 'Lazer & Restaurantes',
      description: 'Festas e cinema',
      date: '2026-08-20',
      paymentMethod: 'Pix',
      createdAt: 4,
    },
    // Mês 3: 2026-09
    {
      id: 'tx-5',
      type: 'expense',
      amount: 620,
      category: 'Alimentação & Supermercado',
      description: 'Compras mês',
      date: '2026-09-12',
      paymentMethod: 'Pix',
      createdAt: 5,
    },
    {
      id: 'tx-6',
      type: 'expense',
      amount: 600, // continua subindo
      category: 'Lazer & Restaurantes',
      description: 'Delivery fim de semana',
      date: '2026-09-18',
      paymentMethod: 'Pix',
      createdAt: 6,
    },
  ];

  it('identifica categorias essenciais corretamente', () => {
    expect(isCategoryEssential('Alimentação & Supermercado')).toBe(true);
    expect(isCategoryEssential('Farmácia & Saúde')).toBe(true);
    expect(isCategoryEssential('Transporte e Combustível')).toBe(true);
    expect(isCategoryEssential('Lazer e Cinema')).toBe(false);
    expect(isCategoryEssential('Compras & Vestuário')).toBe(false);
  });

  it('analisa médias, gastos máximos e tendências históricas por categoria', () => {
    const stats = analyzeCategorySpending(categories, transactions, '2026-09');
    expect(stats).toHaveLength(2);

    const alim = stats.find((s) => s.categoryId === 'cat-alimentacao')!;
    expect(alim.monthsCount).toBe(3);
    // (600 + 650 + 620) / 3 = 623.33
    expect(alim.avgMonthlySpend).toBeCloseTo(623.33, 1);
    expect(alim.maxMonthlySpend).toBe(650);

    const lazer = stats.find((s) => s.categoryId === 'cat-lazer')!;
    expect(lazer.trend).toBe('increasing'); // 400 -> 550 -> 600
  });

  it('sugere limites recomendados mantendo o usuário dentro de suas posses', () => {
    const analysis = generateRecommendedBudgets(
      categories,
      transactions,
      profile,
      fixedBills,
      '2026-09'
    );

    expect(analysis.discretionaryBudget).toBe(2800);
    expect(analysis.isWithinMeans).toBe(true);
    expect(analysis.recommendations).toHaveLength(2);

    const alimRec = analysis.recommendations.find((r) => r.categoryId === 'cat-alimentacao')!;
    // Categoria essencial ganha margem de ~5% sobre a média (~623 * 1.05 = ~650)
    expect(alimRec.isEssential).toBe(true);
    expect(alimRec.recommendedLimit).toBeGreaterThanOrEqual(600);
    expect(alimRec.rationale).toContain('Gasto essencial');

    const lazerRec = analysis.recommendations.find((r) => r.categoryId === 'cat-lazer')!;
    // Categoria não essencial em alta recebe teto de disciplina (~88% da média recente)
    expect(lazerRec.isEssential).toBe(false);
    expect(lazerRec.trend).toBe('increasing');
    expect(lazerRec.potentialMonthlySavings).toBeGreaterThan(0);
    expect(lazerRec.rationale).toContain('alta');
  });

  it('applyAllRecommendedBudgets atualiza as categorias com os limites sugeridos', () => {
    const analysis = generateRecommendedBudgets(
      categories,
      transactions,
      profile,
      fixedBills,
      '2026-09'
    );

    const updated = applyAllRecommendedBudgets(categories, analysis.recommendations);
    expect(updated[0].budgetLimit).toBe(analysis.recommendations[0].recommendedLimit);
    expect(updated[1].budgetLimit).toBe(analysis.recommendations[1].recommendedLimit);
    expect(updated[0].budgetRationale).toBeDefined();
  });
});

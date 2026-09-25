import { CustomCategory, Transaction, UserFinancialProfile, FixedBill, TransactionType } from '../types';
import { formatCurrency } from './formatters';

export interface CategorySpendingStats {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryType: TransactionType;
  totalSpentAllTime: number;
  monthsCount: number;
  avgMonthlySpend: number;
  last3MonthsAvg: number;
  currentMonthSpend: number;
  maxMonthlySpend: number;
  minMonthlySpend: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  trendPercent: number; // Ex: +18% ou -12%
  transactionCount: number;
  isEssential: boolean;
}

export interface CategoryBudgetRecommendation {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryType: TransactionType;
  currentLimit: number | null; // Limite atualmente cadastrado (se houver)
  recommendedLimit: number; // Limite sugerido com base nos padrões
  currentMonthSpend: number; // Gasto no mês atual
  avgMonthlySpend: number;
  last3MonthsAvg: number;
  maxMonthlySpend: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  trendPercent: number;
  isEssential: boolean;
  confidence: 'high' | 'medium' | 'low';
  rationale: string;
  potentialMonthlySavings: number; // Economia estimada ao cumprir o teto
  percentOfDiscretionaryBudget: number; // % do orçamento disponível
}

export interface OverallSpendingPatternAnalysis {
  effectiveMonthlyIncome: number;
  fixedBillsTotal: number;
  targetSavingsAmount: number;
  discretionaryBudget: number; // Renda Líquida - Contas Fixas - Meta de Poupança
  totalRecommendedBudgets: number;
  totalCurrentBudgets: number;
  isWithinMeans: boolean; // Se a soma dos limites recomendados cabe no orçamento livre
  monthlyBufferOrDeficit: number; // Folga orçamentária ou déficit
  potentialTotalSavings: number; // Soma das economias potenciais
  recommendations: CategoryBudgetRecommendation[];
}

// Lista de palavras-chave para identificar categorias essenciais
const ESSENTIAL_KEYWORDS = [
  'alimenta',
  'supermercado',
  'mercado',
  'moradia',
  'aluguel',
  'condomínio',
  'condominio',
  'transporte',
  'combust',
  'gasolina',
  'saúde',
  'saude',
  'farmácia',
  'farmacia',
  'médic',
  'medic',
  'educa',
  'escola',
  'faculdade',
  'conta',
  'energia',
  'luz',
  'água',
  'agua',
  'gás',
  'gas',
  'internet',
];

/**
 * Verifica se uma categoria é de necessidade essencial (necessidades básicas).
 */
export function isCategoryEssential(categoryName: string): boolean {
  const norm = categoryName.toLowerCase().trim();
  return ESSENTIAL_KEYWORDS.some((kw) => norm.includes(kw));
}

/**
 * Analisa os padrões históricos de gastos e calcula estatísticas detalhadas por categoria.
 */
export function analyzeCategorySpending(
  categories: CustomCategory[],
  transactions: Transaction[],
  currentMonthKey: string
): CategorySpendingStats[] {
  // Filtra apenas despesas reais (não investimentos ou transferências)
  const expenseTransactions = transactions.filter(
    (t) => t.type === 'expense' && !t.linkedInvestmentId
  );

  return categories
    .filter((c) => c.type === 'expense')
    .map((cat) => {
      const catNorm = cat.name.toLowerCase().trim();
      const catTxs = expenseTransactions.filter(
        (t) => (t.category || '').toLowerCase().trim() === catNorm
      );

      // Agrupa gastos por mês
      const monthlySpendMap = new Map<string, number>();
      for (const tx of catTxs) {
        const monthKey = (tx.date || '').slice(0, 7);
        if (monthKey) {
          monthlySpendMap.set(monthKey, (monthlySpendMap.get(monthKey) || 0) + tx.amount);
        }
      }

      const totalSpentAllTime = catTxs.reduce((sum, t) => sum + t.amount, 0);
      const transactionCount = catTxs.length;

      // Meses ordenados cronologicamente
      const sortedMonths = Array.from(monthlySpendMap.keys()).sort();
      const monthsCount = sortedMonths.length;

      const monthlyValues = sortedMonths.map((m) => monthlySpendMap.get(m) || 0);
      const avgMonthlySpend =
        monthsCount > 0
          ? Math.round((totalSpentAllTime / monthsCount) * 100) / 100
          : 0;

      const currentMonthSpend = monthlySpendMap.get(currentMonthKey) || 0;
      const maxMonthlySpend = monthlyValues.length > 0 ? Math.max(...monthlyValues) : 0;
      const minMonthlySpend = monthlyValues.length > 0 ? Math.min(...monthlyValues) : 0;

      // Média dos últimos 3 meses
      const recentMonths = sortedMonths.slice(-3);
      const recentValues = recentMonths.map((m) => monthlySpendMap.get(m) || 0);
      const last3MonthsAvg =
        recentValues.length > 0
          ? Math.round((recentValues.reduce((a, b) => a + b, 0) / recentValues.length) * 100) / 100
          : avgMonthlySpend;

      // Análise de tendência: compara o período mais recente com o histórico anterior
      let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
      let trendPercent = 0;
      if (sortedMonths.length >= 2) {
        const latestMonthValue = monthlyValues[monthlyValues.length - 1];
        const previousValues = monthlyValues.slice(0, -1);
        const previousAvg =
          previousValues.reduce((a, b) => a + b, 0) / previousValues.length;

        if (previousAvg > 0) {
          trendPercent = Math.round(((latestMonthValue - previousAvg) / previousAvg) * 100);
          if (trendPercent > 10) {
            trend = 'increasing';
          } else if (trendPercent < -10) {
            trend = 'decreasing';
          }
        }
      }

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        categoryColor: cat.color,
        categoryType: cat.type,
        totalSpentAllTime,
        monthsCount,
        avgMonthlySpend,
        last3MonthsAvg,
        currentMonthSpend,
        maxMonthlySpend,
        minMonthlySpend,
        trend,
        trendPercent,
        transactionCount,
        isEssential: isCategoryEssential(cat.name),
      };
    });
}

/**
 * Função principal: Analisa padrões de gastos e sugere limites recomendados de orçamento
 * para cada categoria personalizada, garantindo que o usuário viva dentro das suas posses.
 */
export function generateRecommendedBudgets(
  categories: CustomCategory[],
  transactions: Transaction[],
  profile: UserFinancialProfile,
  bills: FixedBill[] = [],
  currentMonthKey: string
): OverallSpendingPatternAnalysis {
  // 1. Capacidade Financeira Real do Usuário
  const baseSalary = profile.fixedSalary || 0;
  const extraIncome = profile.additionalMonthlyIncome || 0;
  const effectiveMonthlyIncome = baseSalary + extraIncome;

  // Meta de poupança (ex: 20%)
  let savingsRate = 20;
  if (profile.savingsRule === 'conservative_10') savingsRate = 10;
  else if (profile.savingsRule === 'growth_30') savingsRate = 30;
  else if (profile.savingsRule === 'custom') savingsRate = profile.customSavingsPercent || 20;
  const targetSavingsAmount = (effectiveMonthlyIncome * savingsRate) / 100;

  // Total de contas fixas ativas
  const fixedBillsTotal = bills
    .filter((b) => b.status !== 'paused')
    .reduce((sum, b) => sum + b.amount, 0);

  // Orçamento Discricionário Livre: o que sobra para gastos variáveis após contas fixas e reserva
  const discretionaryBudget = Math.max(
    0,
    effectiveMonthlyIncome - fixedBillsTotal - targetSavingsAmount
  );

  // 2. Análise estatística de cada categoria
  const statsList = analyzeCategorySpending(categories, transactions, currentMonthKey);

  // 3. Cálculo das Recomendações Categoria por Categoria
  const rawRecommendations: CategoryBudgetRecommendation[] = statsList.map((stat) => {
    const existingCat = categories.find((c) => c.id === stat.categoryId);
    const currentLimit = existingCat?.budgetLimit ?? null;

    let baseBenchmark = stat.last3MonthsAvg > 0 ? stat.last3MonthsAvg : stat.avgMonthlySpend;
    let recommended = 0;
    let rationale = '';
    let confidence: 'high' | 'medium' | 'low' = 'low';

    if (stat.monthsCount >= 3) confidence = 'high';
    else if (stat.monthsCount >= 1) confidence = 'medium';

    if (stat.monthsCount === 0 || baseBenchmark <= 0) {
      // Categoria sem histórico: sugere um teto inicial modesto proporcional ao orçamento livre
      if (stat.isEssential) {
        recommended = Math.max(100, Math.round((discretionaryBudget * 0.15) / 10) * 10);
        rationale = `Categoria essencial sem histórico registrado. Sugerimos um teto inicial de ${formatCurrency(recommended)} com base na sua renda disponível.`;
      } else {
        recommended = Math.max(50, Math.round((discretionaryBudget * 0.08) / 10) * 10);
        rationale = `Categoria de estilo de vida sem histórico recente. Sugerimos iniciar com ${formatCurrency(recommended)} para evitar gastos desnecessários.`;
      }
    } else if (stat.isEssential) {
      // Categoria Essencial (Alimentação, Moradia, Transporte, etc.)
      // Proteger o bem-estar: margem de 5% sobre a média para cobrir variações de preço
      recommended = Math.round((baseBenchmark * 1.05) / 10) * 10;
      rationale = `Gasto essencial (média de ${formatCurrency(baseBenchmark)}/mês). Teto com margem segura de 5% (${formatCurrency(recommended)}) para cobrir necessidades básicas sem aperto.`;
    } else {
      // Categoria de Estilo de Vida / Lazer / Desejos
      // Ajudar o usuário a economizar e viver dentro das suas posses!
      if (stat.trend === 'increasing') {
        // Gastos em alta: podar 12% para conter desperdício
        recommended = Math.round((baseBenchmark * 0.88) / 10) * 10;
        rationale = `Gastos recentes em alta (+${stat.trendPercent}%). Recomendamos um teto de ${formatCurrency(recommended)} (-12%) para frear excessos e preservar sua meta de economia.`;
      } else if (stat.trend === 'decreasing') {
        // Usuário já está economizando: consolidar a vitória mantendo o teto no nível recente
        recommended = Math.round(baseBenchmark / 10) * 10;
        rationale = `Ótima disciplina recente! Mantendo o teto em ${formatCurrency(recommended)} você consolida a redução já alcançada nesta categoria.`;
      } else {
        // Estável: sugerir otimização leve de 8% para gerar sobra no fim do mês
        recommended = Math.round((baseBenchmark * 0.92) / 10) * 10;
        rationale = `Gasto estável (média de ${formatCurrency(baseBenchmark)}). Reduzir 8% para ${formatCurrency(recommended)} gera folga no orçamento sem prejudicar o lazer.`;
      }
    }

    // Garante que o limite sugerido nunca seja menor que zero e arredonda para números limpos
    recommended = Math.max(30, recommended);

    const potentialMonthlySavings = Math.max(0, Math.round((stat.avgMonthlySpend - recommended) * 100) / 100);
    const percentOfDiscretionaryBudget =
      discretionaryBudget > 0
        ? Math.round((recommended / discretionaryBudget) * 100)
        : 0;

    return {
      categoryId: stat.categoryId,
      categoryName: stat.categoryName,
      categoryColor: stat.categoryColor,
      categoryType: stat.categoryType,
      currentLimit,
      recommendedLimit: recommended,
      currentMonthSpend: stat.currentMonthSpend,
      avgMonthlySpend: stat.avgMonthlySpend,
      last3MonthsAvg: stat.last3MonthsAvg,
      maxMonthlySpend: stat.maxMonthlySpend,
      trend: stat.trend,
      trendPercent: stat.trendPercent,
      isEssential: stat.isEssential,
      confidence,
      rationale,
      potentialMonthlySavings,
      percentOfDiscretionaryBudget,
    };
  });

  // 4. Balanço Global e Ajuste Fino para Viver Dentro das Posses
  // Se a soma dos limites recomendados ultrapassar o orçamento disponível,
  // ajustamos as categorias não-essenciais proporcionalmente para caber na renda!
  const totalRecommended = rawRecommendations.reduce((sum, r) => sum + r.recommendedLimit, 0);
  let finalRecommendations = rawRecommendations;

  if (discretionaryBudget > 0 && totalRecommended > discretionaryBudget) {
    const essentialTotal = rawRecommendations
      .filter((r) => r.isEssential)
      .reduce((sum, r) => sum + r.recommendedLimit, 0);

    const discretionaryAvailable = Math.max(discretionaryBudget * 0.2, discretionaryBudget - essentialTotal);
    const nonEssentialTotal = rawRecommendations
      .filter((r) => !r.isEssential)
      .reduce((sum, r) => sum + r.recommendedLimit, 0);

    if (nonEssentialTotal > 0 && discretionaryAvailable < nonEssentialTotal) {
      const scaleFactor = discretionaryAvailable / nonEssentialTotal;
      finalRecommendations = rawRecommendations.map((r) => {
        if (!r.isEssential) {
          const scaled = Math.max(30, Math.round((r.recommendedLimit * scaleFactor) / 10) * 10);
          return {
            ...r,
            recommendedLimit: scaled,
            potentialMonthlySavings: Math.max(0, Math.round((r.avgMonthlySpend - scaled) * 100) / 100),
            rationale: `${r.rationale} Ajustado para ${formatCurrency(scaled)} para garantir que o conjunto das suas categorias caiba no seu salário livre.`,
          };
        }
        return r;
      });
    }
  }

  const finalTotalRecommended = finalRecommendations.reduce((sum, r) => sum + r.recommendedLimit, 0);
  const totalCurrentBudgets = finalRecommendations.reduce((sum, r) => sum + (r.currentLimit || 0), 0);
  const potentialTotalSavings = finalRecommendations.reduce((sum, r) => sum + r.potentialMonthlySavings, 0);

  const isWithinMeans =
    discretionaryBudget > 0 ? finalTotalRecommended <= discretionaryBudget : true;
  const monthlyBufferOrDeficit =
    discretionaryBudget > 0
      ? Math.round((discretionaryBudget - finalTotalRecommended) * 100) / 100
      : 0;

  return {
    effectiveMonthlyIncome,
    fixedBillsTotal,
    targetSavingsAmount,
    discretionaryBudget,
    totalRecommendedBudgets: finalTotalRecommended,
    totalCurrentBudgets,
    isWithinMeans,
    monthlyBufferOrDeficit,
    potentialTotalSavings,
    recommendations: finalRecommendations,
  };
}

/**
 * Aplica todas as recomendações de limites de orçamento às categorias personalizadas.
 */
export function applyAllRecommendedBudgets(
  categories: CustomCategory[],
  recommendations: CategoryBudgetRecommendation[]
): CustomCategory[] {
  const recMap = new Map<string, CategoryBudgetRecommendation>();
  for (const r of recommendations) {
    recMap.set(r.categoryId, r);
  }

  return categories.map((cat) => {
    const rec = recMap.get(cat.id);
    if (rec) {
      return {
        ...cat,
        budgetLimit: rec.recommendedLimit,
        recommendedBudgetLimit: rec.recommendedLimit,
        budgetRationale: rec.rationale,
      };
    }
    return cat;
  });
}

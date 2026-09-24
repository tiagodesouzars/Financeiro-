import { ExpenseCategory, IncomeCategory, Category } from '../types';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatDateBR(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
}

export const formatDatePT = formatDateBR;

export function formatShortDateBR(dateString: string): string {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length < 3) return dateString;
  return `${parts[2]}/${parts[1]}`;
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMonthNamePT(monthIndex: number): string {
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  return months[monthIndex] || '';
}

export function getMonthLabelFromKey(monthKey: string): string {
  if (!monthKey) return '';
  const [, monthStr] = monthKey.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  return getMonthNamePT(monthIdx);
}

export function formatMonthYearPT(monthKey: string): string {
  if (!monthKey) return '';
  const [yearStr, monthStr] = monthKey.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  return `${getMonthNamePT(monthIdx)} de ${yearStr}`;
}

export function addMonthsToKey(monthKey: string, count: number): string {
  const [yearStr, monthStr] = monthKey.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) - 1; // 0-based
  month += count;
  year += Math.floor(month / 12);
  month = ((month % 12) + 12) % 12;
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function getMonthDifference(startMonthKey: string, targetMonthKey: string): number {
  const [sYear, sMonth] = startMonthKey.split('-').map(Number);
  const [tYear, tMonth] = targetMonthKey.split('-').map(Number);
  return (tYear - sYear) * 12 + (tMonth - sMonth);
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export const CATEGORY_COLORS: Record<string, string> = {
  'Alimentação': '#f59e0b', // amber
  'Moradia': '#3b82f6', // blue
  'Transporte': '#8b5cf6', // purple
  'Lazer & Cultura': '#ec4899', // pink
  'Saúde': '#10b981', // emerald
  'Educação': '#06b6d4', // cyan
  'Compras': '#f97316', // orange
  'Faturas & Contas': '#ef4444', // red
  'Investimentos': '#14b8a6', // teal
  'Outros': '#64748b', // slate
  'Salário Fixo': '#10b981',
  'Renda Extra / Freelance': '#06b6d4',
  'Rendimentos / Dividendos': '#8b5cf6',
  'Benefícios': '#3b82f6',
  'Presente / Outros': '#a855f7',
};

export const PRESET_CATEGORY_COLORS = [
  '#f59e0b', // amber
  '#ef4444', // red
  '#f97316', // orange
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // purple
  '#a855f7', // purple light
  '#ec4899', // pink
  '#f43f5e', // rose
  '#84cc16', // lime
  '#eab308', // yellow
  '#64748b', // slate
  '#0ea5e9', // sky
];

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Alimentação',
  'Moradia',
  'Transporte',
  'Lazer & Cultura',
  'Saúde',
  'Educação',
  'Compras',
  'Faturas & Contas',
  'Investimentos',
  'Outros',
];

export const INCOME_CATEGORIES: IncomeCategory[] = [
  'Salário Fixo',
  'Renda Extra / Freelance',
  'Rendimentos / Dividendos',
  'Benefícios',
  'Presente / Outros',
];

export const ALL_INVESTMENT_CATEGORIES: import('../types').InvestmentCategory[] = [
  'Ações',
  'FIIs (Fundos Imobiliários)',
  'ETFs',
  'BDRs',
  'CDB',
  'LCI / LCA',
  'Debêntures & CRA/CRI',
  'CDI / Renda Fixa',
  'Tesouro Direto',
  'Criptomoedas',
  'Fundos de Investimento',
  'Poupança',
  'Outros',
];

export const INVESTMENT_CATEGORY_GROUP_INFO: Record<
  import('../types').InvestmentCategoryGroup,
  { label: string; color: string; description: string }
> = {
  RENDA_VARIAVEL: {
    label: 'Renda Variável',
    color: '#8b5cf6',
    description: 'Ações, FIIs, ETFs, BDRs e Opções',
  },
  RENDA_FIXA: {
    label: 'Renda Fixa Privada',
    color: '#3b82f6',
    description: 'CDB, LCI, LCA, CRI, CRA e Debêntures',
  },
  TESOURO_DIRETO: {
    label: 'Tesouro Direto',
    color: '#10b981',
    description: 'Títulos Públicos Federais (Selic, IPCA, Prefixado)',
  },
  CRIPTO: {
    label: 'Criptomoedas',
    color: '#f97316',
    description: 'Bitcoin, Ethereum, Altcoins e DeFi',
  },
  FUNDOS: {
    label: 'Fundos de Investimento',
    color: '#6366f1',
    description: 'Multimercado, Ações, Renda Fixa e Cambial',
  },
  OUTROS: {
    label: 'Outros',
    color: '#64748b',
    description: 'Reservas e outros ativos',
  },
};

export const OPERATION_TYPE_LABELS: Record<
  import('../types').InvestmentOperationType,
  { label: string; color: string }
> = {
  COMPRA: { label: 'Compra', color: '#10b981' },
  VENDA: { label: 'Venda', color: '#3b82f6' },
  RESGATE: { label: 'Resgate', color: '#f59e0b' },
  RENDIMENTO: { label: 'Rendimento', color: '#8b5cf6' },
  PAGAMENTO_DIVIDENDO: { label: 'Dividendo / JCP', color: '#14b8a6' },
};

export const INVESTMENT_CATEGORY_COLORS: Record<string, string> = {
  'CDB': '#3b82f6', // blue
  'CDI / Renda Fixa': '#06b6d4', // cyan
  'Tesouro Direto': '#10b981', // emerald
  'Ações': '#8b5cf6', // purple
  'FIIs (Fundos Imobiliários)': '#f59e0b', // amber
  'Criptomoedas': '#f97316', // orange
  'LCI / LCA': '#14b8a6', // teal
  'Fundos de Investimento': '#6366f1', // indigo
  'ETFs': '#ec4899', // pink
  'BDRs': '#e11d48', // rose
  'Poupança': '#84cc16', // lime
  'Debêntures & CRA/CRI': '#a855f7', // violet
  'Outros': '#64748b', // slate
};

export function getCategoryColor(
  categoryName: string,
  customCategories?: import('../types').CustomCategory[]
): string {
  if (customCategories) {
    const found = customCategories.find(
      (c) => c.name.toLowerCase() === categoryName.toLowerCase()
    );
    if (found && found.color) return found.color;
  }
  return CATEGORY_COLORS[categoryName] || '#64748b';
}

export function formatStockQuantity(qty: number): string {
  if (Number.isInteger(qty)) {
    return qty.toString();
  }
  return qty.toLocaleString('pt-BR', { maximumFractionDigits: 6 });
}

export function triggerHaptic(duration = 15): void {
  if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(duration);
    } catch {
      // Ignore vibration error on unsupported platforms
    }
  }
}

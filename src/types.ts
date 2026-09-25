export type TransactionType = 'income' | 'expense';

// Categories can be default or user-created custom categories
export type ExpenseCategory = string;
export type IncomeCategory = string;
export type Category = string;

export type AppTheme = 'amoled-dark' | 'system-light';

export interface CustomCategory {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon?: string;
  isDefault?: boolean;
  budgetLimit?: number; // Limite mensal de gastos definido (R$)
  recommendedBudgetLimit?: number; // Limite mensal recomendado com base nos padrões de gastos (R$)
  budgetRationale?: string; // Racional da sugestão baseado no histórico financeiro
  createdAt?: number;
}

// Investment Enums and Base Architectures
export type InvestmentOperationType =
  | 'COMPRA'
  | 'VENDA'
  | 'RESGATE'
  | 'RENDIMENTO'
  | 'PAGAMENTO_DIVIDENDO';

export type InvestmentCurrency = 'BRL' | 'USD' | 'EUR';
export type InvestmentStatus = 'PENDENTE' | 'EXECUTADA' | 'CANCELADA' | 'FALHOU';

export type InvestmentCategoryGroup =
  | 'RENDA_VARIAVEL'
  | 'RENDA_FIXA'
  | 'TESOURO_DIRETO'
  | 'CRIPTO'
  | 'FUNDOS'
  | 'OUTROS';

// 2. Renda Fixa Privada (CDB, LCI, LCA, CRI, CRA, Debêntures)
export type RendaFixaTipoAtivo = 'CDB' | 'LCI' | 'LCA' | 'CRI' | 'CRA' | 'DEBENTURE';
export type RendaFixaRentabilidade = 'PREFIXADA' | 'POS_FIXADA' | 'HIBRIDA';
export type RendaFixaIndexador = 'CDI' | 'IPCA' | 'SELIC' | 'NENHUM';
export type RendaFixaLiquidez = 'DIARIA' | 'NO_VENCIMENTO' | 'APOS_CARENCIA';

export interface DetalhesRendaFixa {
  tipo_ativo: RendaFixaTipoAtivo;
  emissor: string;
  tipo_rentabilidade: RendaFixaRentabilidade;
  indexador: RendaFixaIndexador;
  taxa_pactuada: number; // Ex: 110.0 (% do CDI) ou 12.5 (% a.a.)
  data_vencimento?: string; // Date YYYY-MM-DD
  data_carencia?: string; // Date YYYY-MM-DD
  liquidez: RendaFixaLiquidez;
  isento_ir: boolean;
  imposto_renda_retido?: number;
  iof_retido?: number;
}

// 3. Tesouro Direto (Títulos Públicos)
export type TesouroTipoTitulo =
  | 'TESOURO_SELIC'
  | 'TESOURO_IPCA'
  | 'TESOURO_PREFIXADO'
  | 'RENDA_MAIS'
  | 'EDUCA_MAIS';

export interface DetalhesTesouro {
  tipo_titulo: TesouroTipoTitulo;
  ano_vencimento: number; // Ex: 2029
  quantidade_titulos: number; // Permite frações, ex: 0.05
  preco_unitario: number;
  taxa_b3?: number; // Geralmente 0.20%
  pagamento_cupom?: boolean;
}

// 4. Renda Variável (Ações, FIIs, ETFs, BDRs, Opções)
export type RendaVariavelTipoAtivo = 'ACAO' | 'FII' | 'ETF' | 'BDR' | 'OPCAO';

export interface DetalhesRendaVariavel {
  ticker: string; // Ex: PETR4, MXRF11, IVVB11
  tipo_ativo: RendaVariavelTipoAtivo;
  quantidade: number;
  preco_execucao: number;
  taxa_corretagem?: number;
  emolumentos_b3?: number;
  preco_medio: number; // Calculado dinamicamente: [Valor Total Investido + Custos] / Quantidade
  setor_atuacao?: string; // Ex: Energia, Bancos, Tecnologia
}

// 5. Criptomoedas (Bitcoin, Ethereum, Altcoins)
export type CriptoCustodia = 'EXCHANGE' | 'SELF_CUSTODY_HARDWARE' | 'SELF_CUSTODY_HOT';

export interface DetalhesCripto {
  symbol: string; // Ex: BTC, ETH, SOL
  rede_blockchain: string; // Ex: Bitcoin Network, ERC-20, BEP-20, Solana
  quantidade: number; // Alta precisão, ex: 0.00045123
  preco_unitario_fiat: number;
  taxa_rede?: number; // Gas fee
  taxa_exchange?: number; // Corretagem ou spread da exchange
  endereco_carteira?: string;
  custodia: CriptoCustodia;
}

// 6. Fundos de Investimento (Multimercado, Renda Fixa, Ações, Cambial)
export type FundoClasse = 'RENDA_FIXA' | 'MULTIMERCADO' | 'ACOES' | 'CAMBIAL';

export interface DetalhesFundos {
  cnpj_fundo?: string;
  nome_fundo: string;
  classe_fundo: FundoClasse;
  quantidade_cotas: number;
  valor_cota: number;
  prazo_cotizacao_resgate?: number; // D+N
  prazo_liquidacao_resgate?: number; // D+M
  come_cotas?: boolean;
}

// All possible investment categories (UI label compatibility)
export type InvestmentCategory =
  | 'CDB'
  | 'CDI / Renda Fixa'
  | 'Tesouro Direto'
  | 'Ações'
  | 'FIIs (Fundos Imobiliários)'
  | 'Criptomoedas'
  | 'LCI / LCA'
  | 'Fundos de Investimento'
  | 'ETFs'
  | 'BDRs'
  | 'Poupança'
  | 'Debêntures & CRA/CRI'
  | 'Outros';

export interface InvestmentAsset {
  // 1. Campos Base (Comuns a todas as transações e posições)
  id: string; // id_transacao (UUID)
  id_usuario?: string; // Dono do investimento
  id_instituicao?: string; // Nome ou código do banco/corretora: "XP", "BTG", "NuInvest", "Inter"
  tipo_operacao: InvestmentOperationType; // COMPRA, VENDA, RESGATE, RENDIMENTO, PAGAMENTO_DIVIDENDO
  data_operacao: string; // Data em que a ordem foi executada (YYYY-MM-DD ou ISO)
  data_liquidacao?: string; // Data em que o dinheiro efetivamente entra/sai da conta (ex: D+2)
  valor_bruto: number; // Quantidade × Preço Unitário
  valor_liquido: number; // Valor Bruto - Taxas - Impostos
  moeda: InvestmentCurrency; // BRL, USD, EUR
  status: InvestmentStatus; // PENDENTE, EXECUTADA, CANCELADA, FALHOU
  
  // Classificação e Agrupamento
  categoria_ativo: InvestmentCategoryGroup;
  category: InvestmentCategory;
  name: string; // Ex: "PETR4", "CDB Banco Master 120% CDI", "Tesouro Selic 2029"
  institution?: string; // alias para id_instituicao

  // Posição de Carteira
  quantity: number;
  purchasePrice: number;
  totalInvested: number; // Quantidade * Preço Médio ou Valor Líquido total
  currentPrice?: number;
  currentTotalValue?: number;
  purchaseDate: string; // alias para data_operacao
  notes?: string;
  linkedTransactionId?: string;
  createdAt: number;
  updatedAt: number;

  // Payloads de Extensão Específicos (Polimórficos)
  detalhes_renda_fixa?: DetalhesRendaFixa;
  detalhes_tesouro?: DetalhesTesouro;
  detalhes_renda_variavel?: DetalhesRendaVariavel;
  detalhes_cripto?: DetalhesCripto;
  detalhes_fundos?: DetalhesFundos;
}

export interface InvestmentStats {
  totalInvested: number;
  currentTotalValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  monthlyInvestedAmount: number; // Dinheiro transformado em investimento no mês selecionado
  assetCount: number;
  categoryAllocation: {
    category: InvestmentCategory;
    amount: number;
    percent: number;
    color: string;
  }[];
  groupAllocation?: {
    group: InvestmentCategoryGroup;
    label: string;
    amount: number;
    percent: number;
    color: string;
  }[];
}

export type PaymentMethod =
  | 'Pix'
  | 'Cartão de Crédito'
  | 'Cartão de Débito'
  | 'Dinheiro'
  | 'Boleto'
  | 'Transferência';

export interface InstallmentInfo {
  current: number;
  total: number;
  groupId: string;
  originalAmount?: number;
}

export type CardType = 'credit' | 'debit' | 'both';

export interface CardUsage {
  totalLimit: number;
  usedAmount: number; // Valor da fatura do mês selecionado
  monthInvoiceAmount: number; // Valor da fatura do mês selecionado
  totalCommittedLimit: number; // Limite global comprometido (bloqueado) em todas as faturas e parcelas em aberto
  availableLimit: number; // Limite disponível real: totalLimit - totalCommittedLimit
  monthCreditExpenses: number;
  monthDebitExpenses?: number;
  futureInstallmentsCount: number;
  futureInstallmentsTotal?: number;
  nextInvoiceMonth?: string;
  nextInvoiceAmount?: number;
}

export interface PaymentCard {
  id: string;
  name: string; // e.g. "Nubank Ultravioleta", "Inter Gold"
  bank: string; // e.g. "Nubank", "Inter", "Itaú", "Bradesco", "Santander", "C6 Bank", "Banco do Brasil", "Caixa", "Outro"
  type: CardType;
  totalLimit: number; // Limite total do cartão de crédito
  dueDay: number; // Dia de vencimento da fatura do crédito (ex: 10)
  closingDay?: number; // Dia de fechamento da fatura (ex: 3)
  color?: string; // Cor visual do cartão
  lastFourDigits?: string; // 4 últimos dígitos
  createdAt: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  description: string;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  cardId?: string; // ID do cartão utilizado (se crédito/débito)
  cardName?: string; // Nome do cartão para exibição rápida
  isFixed?: boolean;
  linkedBillId?: string;
  linkedInvestmentId?: string;
  installment?: InstallmentInfo;
  invoiceMonth?: string; // Mês da fatura em que a compra cai para pagamento (YYYY-MM)
  invoiceDueDate?: string; // Data exata do vencimento da fatura (YYYY-MM-DD)
  createdAt: number;
}

export type BillStatus = 'pending' | 'paid' | 'overdue' | 'paused';
export type BillType = 'recurring' | 'installment' | 'single';

export interface FixedBill {
  id: string;
  name: string;
  amount: number;
  dueDay: number; // 1 - 31
  category: ExpenseCategory;
  autoReminder: boolean;
  status: BillStatus;
  paidDate?: string;
  lastPaidMonth?: string; // YYYY-MM
  paidMonths?: string[]; // Array of YYYY-MM where this bill has been paid
  paymentMethod: PaymentMethod;
  cardId?: string; // ID do cartão vinculado à fatura
  cardName?: string; // Nome do cartão vinculado
  barcodeOrPixKey?: string;
  billType?: BillType; // 'recurring' (academia, aluguel) | 'installment' (fatura do cartão parcelada) | 'single'
  isRecurring?: boolean;
  isInstallment?: boolean;
  paymentRequired?: boolean; // Default true: flagged as mandatory payment every month until user unchecks this option
  totalInstallments?: number; // e.g. 3, 10
  currentInstallment?: number; // starting installment index (usually 1)
  startMonth?: string; // YYYY-MM (e.g. "2026-09" ou "2026-10")
  installmentGroupId?: string;
  notes?: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  icon: string; // e.g. 'Shield', 'Car', 'Plane', 'Home', 'Smartphone', 'PiggyBank'
  color: string;
  targetDate?: string;
  autoAllocationPriority: number; // 1 = highest priority for automatic savings
}

export type AutoSavingsRule = 'conservative_10' | 'balanced_20' | 'growth_30' | 'custom';

export interface BiometricSecurityConfig {
  enabled: boolean;
  credentialId?: string; // WebAuthn Credential ID
  pinFallback?: string;   // 4-6 digit security PIN if biometrics unavailable
  requireOnAppResume: boolean;
  lastUnlockedAt?: number;
}

export interface MonthSalaryConfig {
  amount: number;
  type: 'partial_salary' | 'account_balance' | 'full';
  note?: string;
}

export interface UserFinancialProfile {
  name: string;
  fixedSalary: number;
  salaryPayDay: number; // e.g. 5
  salaryStartMonth?: string; // e.g. "2026-10"
  monthlySalaryOverrides?: Record<string, MonthSalaryConfig>; // e.g. { "2026-09": { amount: 850, type: 'account_balance' } }
  additionalMonthlyIncome: number;
  savingsRule: AutoSavingsRule;
  customSavingsPercent: number; // 1 - 90%
  notificationsEnabled: boolean;
  currency: string;
  theme?: AppTheme; // 'amoled-dark' | 'system-light'
  securityConfig?: BiometricSecurityConfig;
}

export interface FinancialStats {
  totalIncome: number;
  totalExpenses: number;
  fixedBillsTotal: number;
  variableExpensesTotal: number;
  availableBudget: number; // Income - Total Committed Expenses
  projectedSavings: number;
  savingsRate: number; // %
  pendingBillsCount: number;
  pendingBillsAmount: number;
  overdueBillsCount: number;
  isCustomIncomeApplied?: boolean;
  customIncomeNote?: string;
  cardInstallmentsTotal?: number;
  // Timing & Month Status flags
  isFutureMonth?: boolean;
  isCurrentMonth?: boolean;
  hasSalaryDropped?: boolean;
  projectedSalary?: number;
  salaryPayDay?: number;
  // Global Credit Card and Future Commitments
  totalCreditLimitGlobal?: number;
  totalCreditCommittedGlobal?: number;
  totalCreditAvailableGlobal?: number;
  totalFutureDebtsAmount?: number;
  nextUpcomingBillMonth?: string;
  nextUpcomingBillAmount?: number;
  nextUpcomingBillCount?: number;
}

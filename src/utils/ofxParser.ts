import { ExpenseCategory, IncomeCategory, PaymentMethod } from '../types';

export interface OfxTransaction {
  id: string;
  fitId: string;
  type: 'expense' | 'income';
  rawType: string;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  memo?: string;
  suggestedCategory: ExpenseCategory | IncomeCategory;
  suggestedPaymentMethod: PaymentMethod;
  selected: boolean;
  isDuplicate?: boolean;
}

/**
 * Suggests an expense or income category based on description / memo
 */
export function guessCategory(desc: string, isExpense: boolean): ExpenseCategory | IncomeCategory {
  const d = desc.toLowerCase();

  if (!isExpense) {
    if (d.includes('salario') || d.includes('remunera') || d.includes('folha') || d.includes('ted recebid')) {
      return 'Salário';
    }
    if (d.includes('divid') || d.includes('rendimento') || d.includes('juros') || d.includes('provento')) {
      return 'Investimentos';
    }
    if (d.includes('freela') || d.includes('servico') || d.includes('prestacao')) {
      return 'Freelance';
    }
    return 'Outros';
  }

  // Expenses
  if (
    d.includes('mercado') ||
    d.includes('supermerc') ||
    d.includes('padaria') ||
    d.includes('restaurante') ||
    d.includes('ifood') ||
    d.includes('lanche') ||
    d.includes('acougue')
  ) {
    return 'Alimentação';
  }

  if (
    d.includes('uber') ||
    d.includes('99app') ||
    d.includes('posto') ||
    d.includes('gasolina') ||
    d.includes('combustivel') ||
    d.includes('estacionamento') ||
    d.includes('pedagio')
  ) {
    return 'Transporte';
  }

  if (
    d.includes('aluguel') ||
    d.includes('condominio') ||
    d.includes('energia') ||
    d.includes('enel') ||
    d.includes('cpfl') ||
    d.includes('sabesp') ||
    d.includes('agua') ||
    d.includes('gas')
  ) {
    return 'Aluguel & Moradia';
  }

  if (
    d.includes('netflix') ||
    d.includes('spotify') ||
    d.includes('prime') ||
    d.includes('disney') ||
    d.includes('cinema') ||
    d.includes('show') ||
    d.includes('steam')
  ) {
    return 'Lazer & Entretenimento';
  }

  if (
    d.includes('farmacia') ||
    d.includes('drogaria') ||
    d.includes('hospital') ||
    d.includes('medico') ||
    d.includes('dentista') ||
    d.includes('consulta') ||
    d.includes('exame')
  ) {
    return 'Saúde & Farmácia';
  }

  if (
    d.includes('escola') ||
    d.includes('faculdade') ||
    d.includes('curso') ||
    d.includes('livraria') ||
    d.includes('udemy')
  ) {
    return 'Educação';
  }

  if (
    d.includes('internet') ||
    d.includes('vivo') ||
    d.includes('claro') ||
    d.includes('tim') ||
    d.includes('assinatura')
  ) {
    return 'Serviços & Assinaturas';
  }

  return 'Outros';
}

/**
 * Parses raw OFX (XML or SGML) text into structured financial transactions
 */
export function parseOfxContent(ofxText: string): OfxTransaction[] {
  const transactions: OfxTransaction[] = [];

  // Match all <STMTTRN>...</STMTTRN> blocks (case-insensitive)
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>)|$)/gi;
  let match;

  while ((match = stmtTrnRegex.exec(ofxText)) !== null) {
    const block = match[1];

    const getTagValue = (tagName: string): string => {
      // Handles both <TAG>value</TAG> and SGML <TAG>value\n
      const regex = new RegExp(`<${tagName}>([^<\r\n]+)(?:<\\/${tagName}>)?`, 'i');
      const tagMatch = block.match(regex);
      return tagMatch ? tagMatch[1].trim() : '';
    };

    const rawType = getTagValue('TRNTYPE').toUpperCase();
    const dtPostedRaw = getTagValue('DTPOSTED');
    const trnAmtRaw = getTagValue('TRNAMT');
    const fitId = getTagValue('FITID') || `ofx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const name = getTagValue('NAME');
    const memo = getTagValue('MEMO');

    // Parse date (OFX format: YYYYMMDDHHMMSS or YYYYMMDD)
    let formattedDate = new Date().toISOString().split('T')[0];
    if (dtPostedRaw && dtPostedRaw.length >= 8) {
      const year = dtPostedRaw.substring(0, 4);
      const month = dtPostedRaw.substring(4, 6);
      const day = dtPostedRaw.substring(6, 8);
      formattedDate = `${year}-${month}-${day}`;
    }

    // Parse amount
    const parsedAmount = parseFloat(trnAmtRaw.replace(',', '.'));
    if (isNaN(parsedAmount)) continue;

    const isExpense = parsedAmount < 0 || rawType === 'DEBIT';
    const absAmount = Math.abs(parsedAmount);
    const description = (name || memo || 'Lançamento Bancário').replace(/\s+/g, ' ').trim();

    const suggestedCategory = guessCategory(description, isExpense);
    const suggestedPaymentMethod: PaymentMethod = isExpense ? 'Cartão de Débito' : 'Pix';

    transactions.push({
      id: `ofx-tx-${fitId}`,
      fitId,
      type: isExpense ? 'expense' : 'income',
      rawType,
      amount: absAmount,
      date: formattedDate,
      description,
      memo,
      suggestedCategory,
      suggestedPaymentMethod,
      selected: true,
    });
  }

  return transactions;
}

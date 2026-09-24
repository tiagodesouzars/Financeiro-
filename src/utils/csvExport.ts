import { Transaction } from '../types';
import { formatCurrency, formatDateBR } from './formatters';

export function exportTransactionsToCsv(
  transactions: Transaction[],
  selectedMonthLabel?: string
): void {
  // UTF-8 BOM so Excel opens PT-BR accented characters properly
  const bom = '\uFEFF';
  const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Forma de Pagamento', 'Cartão', 'Valor (R$)'];

  const rows = transactions.map((t) => {
    const isIncome = t.type === 'income';
    const typeLabel = isIncome ? 'Receita' : 'Despesa';
    const cleanDesc = (t.description || '').replace(/"/g, '""');
    const cleanCat = (t.category || '').replace(/"/g, '""');
    const cleanMethod = (t.paymentMethod || '').replace(/"/g, '""');
    const cleanCard = (t.cardName || '').replace(/"/g, '""');
    const formattedAmount = (isIncome ? t.amount : -t.amount).toFixed(2).replace('.', ',');

    return [
      formatDateBR(t.date),
      typeLabel,
      `"${cleanDesc}"`,
      `"${cleanCat}"`,
      `"${cleanMethod}"`,
      `"${cleanCard}"`,
      formattedAmount,
    ];
  });

  const csvContent = bom + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const fileSuffix = selectedMonthLabel ? `-${selectedMonthLabel.replace(/[^a-zA-Z0-9]/g, '-')}` : '';
  link.href = url;
  link.setAttribute('download', `extrato-financeiro${fileSuffix}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Transaction,
  FixedBill,
  SavingsGoal,
  UserFinancialProfile,
  FinancialStats,
  PaymentCard,
} from '../types';
import {
  formatCurrency,
  formatMonthYearPT,
  formatDatePT,
} from './formatters';

interface ExportPdfOptions {
  selectedMonth: string; // YYYY-MM
  profile: UserFinancialProfile;
  stats: FinancialStats;
  transactions: Transaction[];
  bills: FixedBill[];
  goals: SavingsGoal[];
  cards?: PaymentCard[];
}

export const exportMonthlyReportPdf = ({
  selectedMonth,
  profile,
  stats,
  transactions,
  bills,
  goals,
  cards = [],
}: ExportPdfOptions) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const monthName = formatMonthYearPT(selectedMonth);
  const now = new Date();
  const generatedAt = now.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Filter transactions for this month
  const monthTransactions = transactions
    .filter((t) => t.date.startsWith(selectedMonth))
    .sort((a, b) => b.date.localeCompare(a.date));

  // Filter bills for this month
  const monthBills = bills.filter((b) => {
    if (b.isInstallment && b.startMonth) {
      const billStart = b.startMonth;
      const total = b.totalInstallments || 1;
      const [sY, sM] = billStart.split('-').map(Number);
      const [curY, curM] = selectedMonth.split('-').map(Number);
      const diff = (curY - sY) * 12 + (curM - sM);
      return diff >= 0 && diff < total;
    }
    return true;
  });

  // Primary Colors
  const primaryNavy = [15, 23, 42]; // Slate 900
  const emerald = [16, 185, 129];
  const rose = [239, 68, 68];
  const sky = [14, 165, 233];
  const slateDark = [51, 65, 85];
  const slateLight = [241, 245, 249];

  // 1. Header Banner
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('Relatório Financeiro Mensal', 14, 16);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text(
    `Mês de Referência: ${monthName.toUpperCase()}  |  Usuário: ${profile.name || 'Titular'}`,
    14,
    23
  );
  doc.text(`Gerado em: ${generatedAt}`, 14, 29);

  // Accent Line
  doc.setFillColor(emerald[0], emerald[1], emerald[2]);
  doc.rect(0, 36, pageWidth, 2, 'F');

  let currentY = 44;

  // 2. Summary KPI Cards
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('1. Resumo Consolidado do Mês', 14, currentY);

  currentY += 4;

  // 4 Boxes for KPIs
  const boxWidth = (pageWidth - 28 - 9) / 4;
  const boxHeight = 20;

  const kpis = [
    {
      label: 'Renda Total',
      value: formatCurrency(stats.totalIncome),
      color: emerald,
      bg: [236, 253, 245],
    },
    {
      label: 'Despesas Totais',
      value: formatCurrency(stats.totalExpenses),
      color: rose,
      bg: [254, 242, 242],
    },
    {
      label: 'Saldo Disponível',
      value: formatCurrency(stats.availableBudget),
      color: stats.availableBudget >= 0 ? emerald : rose,
      bg: stats.availableBudget >= 0 ? [236, 253, 245] : [254, 242, 242],
    },
    {
      label: 'Taxa de Poupança',
      value: `${stats.savingsRate}%`,
      color: sky,
      bg: [240, 249, 255],
    },
  ];

  kpis.forEach((kpi, index) => {
    const x = 14 + index * (boxWidth + 3);
    doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
    doc.roundedRect(x, currentY, boxWidth, boxHeight, 2, 2, 'F');
    doc.setDrawColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, currentY, boxWidth, boxHeight, 2, 2, 'D');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 3, currentY + 14);
  });

  currentY += boxHeight + 8;

  // 3. Savings Goals Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('2. Estado Atual das Metas de Economia', 14, currentY);

  currentY += 3;

  if (goals.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Nenhuma meta de economia cadastrada.', 14, currentY + 5);
    currentY += 10;
  } else {
    const goalsTableData = goals.map((goal) => {
      const progress =
        goal.targetAmount > 0
          ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
          : 0;
      const statusText =
        progress >= 100
          ? 'Concluída 100%'
          : `${progress}% Atingido`;

      return [
        goal.title,
        formatCurrency(goal.targetAmount),
        formatCurrency(goal.currentAmount),
        formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount)),
        statusText,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Meta / Objetivo', 'Valor Alvo', 'Acumulado', 'Faltante', 'Progresso']],
      body: goalsTableData,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontSize: 8.5,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right' },
        2: { halign: 'right', textColor: [16, 185, 129] },
        3: { halign: 'right' },
        4: { halign: 'center', fontStyle: 'bold' },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Check if we need a new page before bills
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  // 4. Fixed Bills & Cards Status
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('3. Faturas & Contas do Mês', 14, currentY);

  currentY += 3;

  if (monthBills.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Nenhuma fatura ou conta registrada para este mês.', 14, currentY + 5);
    currentY += 10;
  } else {
    const billsTableData = monthBills.map((bill) => {
      const isPaid =
        bill.status === 'paid' ||
        (bill.paidMonths && bill.paidMonths.includes(selectedMonth));
      const statusText = isPaid ? 'Paga' : 'Pendente';

      return [
        bill.name,
        `Dia ${bill.dueDay}`,
        bill.category,
        bill.paymentMethod,
        formatCurrency(bill.amount),
        statusText,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Nome da Conta', 'Vencimento', 'Categoria', 'Forma', 'Valor', 'Situação']],
      body: billsTableData,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontSize: 8.5,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center' },
        4: { halign: 'right', fontStyle: 'bold' },
        5: { halign: 'center', fontStyle: 'bold' },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Check if we need a new page before transactions
  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = 20;
  }

  // 5. Detailed Transactions Ledger
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text(`4. Extrato Detalhado de Transações (${monthTransactions.length} registros)`, 14, currentY);

  currentY += 3;

  if (monthTransactions.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Nenhuma movimentação registrada no mês.', 14, currentY + 5);
  } else {
    const txTableData = monthTransactions.map((tx) => {
      const isIncome = tx.type === 'income';
      const typeText = isIncome ? 'Receita' : 'Despesa';
      const formattedAmount = `${isIncome ? '+' : '-'} ${formatCurrency(tx.amount)}`;

      return [
        formatDatePT(tx.date),
        tx.description,
        tx.category,
        tx.paymentMethod + (tx.cardName ? ` (${tx.cardName})` : ''),
        typeText,
        formattedAmount,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Data', 'Descrição', 'Categoria', 'Pagamento', 'Tipo', 'Valor']],
      body: txTableData,
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontSize: 8.5,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { halign: 'center' },
        1: { fontStyle: 'bold' },
        4: { halign: 'center' },
        5: { halign: 'right', fontStyle: 'bold' },
      },
    });
  }

  // Page Numbers and Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // Slate 400

    // Footer line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.text(
      'Finanças Pessoais  •  Documento confidencial gerado pelo usuário  •  Armazenamento 100% privado',
      14,
      pageHeight - 7
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 14, pageHeight - 7, {
      align: 'right',
    });
  }

  // Save the PDF
  const safeName = (profile.name || 'usuario')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
  const fileName = `Relatorio_Financeiro_${selectedMonth}_${safeName}.pdf`;
  doc.save(fileName);
};

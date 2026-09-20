import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { LoyverseReceipt, IncomeReportSummary } from '../types/incomes';
import { formatCurrency, formatDateTime } from './expensesExport';

/**
 * Export Loyverse Income Report to Excel (.xlsx)
 */
export function exportIncomesToExcel(
  receipts: LoyverseReceipt[],
  periodTitle: string,
  summary: IncomeReportSummary
) {
  const data: (string | number)[][] = [
    ['LA CASA DEL DISFRAZ - REPORTE DE INGRESOS (LOYVERSE POS)'],
    [`Período: ${periodTitle}`],
    [`Fecha de Generación: ${new Date().toLocaleString('es-MX')}`],
    [''],
    ['RESUMEN FINANCIERO:'],
    ['Ventas Brutas:', formatCurrency(summary.totalGross)],
    ['Reembolsos / Devoluciones:', formatCurrency(summary.totalRefunds)],
    ['Ingreso Neto Real:', formatCurrency(summary.totalNet)],
    ['Tickets de Venta:', summary.salesCount],
    ['Ticket Promedio:', formatCurrency(summary.averageTicket)],
    [''],
    ['DESGLOSE DETALLADO DE TICKETS:'],
    [
      '#',
      'Número de Ticket',
      'Tipo',
      'Fecha',
      'Hora',
      'Total ($ MXN)',
      'Métodos de Pago',
      'Descuento ($)',
      'Artículos Vendidos',
      'Nota'
    ]
  ];

  receipts.forEach((receipt, index) => {
    const { date, time } = formatDateTime(receipt.created_at || receipt.receipt_date || '');
    const paymentsStr = (receipt.payments || [])
      .map(p => `${p.name || p.type || 'Pago'}: ${formatCurrency(p.money_amount || 0)}`)
      .join(' | ') || 'N/A';

    const itemsStr = (receipt.line_items || [])
      .map(item => `${item.quantity}x ${item.item_name}${item.variant_name ? ` (${item.variant_name})` : ''}`)
      .join(', ') || 'Varios';

    const isRefund = receipt.receipt_type === 'REFUND';
    const amountVal = isRefund ? -Math.abs(receipt.total_money || 0) : (receipt.total_money || 0);

    data.push([
      index + 1,
      receipt.receipt_number,
      isRefund ? 'DEVOLUCIÓN' : 'VENTA',
      date,
      time,
      amountVal,
      paymentsStr,
      receipt.total_discount || 0,
      itemsStr,
      receipt.note || ''
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ingresos Loyverse');

  const cleanPeriod = periodTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Ingresos_Loyverse_${cleanPeriod}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Export Loyverse Income Report to PDF
 */
export function exportIncomesToPDF(
  receipts: LoyverseReceipt[],
  periodTitle: string,
  summary: IncomeReportSummary
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Header banner
  doc.setFillColor(112, 26, 117); // #701a75
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('LA CASA DEL DISFRAZ', 14, 14);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Reporte Oficial de Ingresos - Loyverse POS', 14, 21);
  doc.text(`Período: ${periodTitle}`, 14, 27);

  const genDate = new Date().toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.setFontSize(8);
  doc.text(`Generado: ${genDate}`, 196, 27, { align: 'right' });

  // Summary Metrics Cards
  let currentY = 40;

  // Box 1: Ventas Brutas
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 56, 22, 2, 2, 'FD');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text('VENTAS BRUTAS', 18, currentY + 7);
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(summary.totalGross), 18, currentY + 16);

  // Box 2: Devoluciones
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(77, currentY, 56, 22, 2, 2, 'FD');
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('DEVOLUCIONES', 81, currentY + 7);
  doc.setTextColor(225, 29, 72);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`-${formatCurrency(summary.totalRefunds)}`, 81, currentY + 16);

  // Box 3: Ingreso Neto
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(140, currentY, 56, 22, 2, 2, 'FD');
  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('INGRESO NETO REAL', 144, currentY + 7);
  doc.setTextColor(21, 128, 61);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(summary.totalNet), 144, currentY + 16);

  currentY += 28;

  // Secondary metrics line
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `Total de Tickets: ${summary.salesCount + summary.refundsCount} (${summary.salesCount} ventas, ${summary.refundsCount} reembolsos)  |  Ticket Promedio: ${formatCurrency(summary.averageTicket)}`,
    14,
    currentY
  );

  currentY += 6;

  // Receipts Table
  const tableData = receipts.map((receipt, index) => {
    const { full } = formatDateTime(receipt.created_at || receipt.receipt_date || '');
    const isRefund = receipt.receipt_type === 'REFUND';
    const amountVal = isRefund ? -Math.abs(receipt.total_money || 0) : (receipt.total_money || 0);

    const payments = (receipt.payments || [])
      .map(p => p.name || p.type || 'Pago')
      .join(', ') || 'N/A';

    return [
      String(index + 1),
      receipt.receipt_number || 'S/N',
      isRefund ? 'DEVOLUCIÓN' : 'VENTA',
      full,
      payments,
      formatCurrency(amountVal)
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Ticket', 'Tipo', 'Fecha y Hora', 'Método', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [112, 26, 117],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28, fontStyle: 'bold' },
      2: { cellWidth: 26 },
      3: { cellWidth: 50 },
      4: { cellWidth: 46 },
      5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const text = String(data.cell.raw);
        if (text.startsWith('-')) {
          doc.setTextColor(225, 29, 72);
        } else {
          doc.setTextColor(15, 23, 42);
        }
      }
    },
    foot: [
      ['', '', '', '', 'TOTAL NETO:', formatCurrency(summary.totalNet)]
    ],
    footStyles: {
      fillColor: [248, 250, 252],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'right'
    },
    margin: { left: 14, right: 14 }
  });

  const cleanPeriod = periodTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Ingresos_Loyverse_${cleanPeriod}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

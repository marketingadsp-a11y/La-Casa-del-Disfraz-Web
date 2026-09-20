import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ExpenseItem } from '../types/expenses';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(amount);
}

export function formatDateTime(isoString: string): { date: string; time: string; full: string } {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: 'Fecha no válida', time: '', full: 'Fecha no válida' };
    
    const dateStr = d.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const timeStr = d.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return {
      date: dateStr,
      time: timeStr,
      full: `${dateStr}, ${timeStr}`
    };
  } catch {
    return { date: isoString, time: '', full: isoString };
  }
}

/**
 * Export filtered expenses to Excel (.xlsx)
 */
export function exportExpensesToExcel(
  expenses: ExpenseItem[],
  periodTitle: string,
  totalAmount: number
) {
  const data: (string | number)[][] = [
    ['LA CASA DEL DISFRAZ - REPORTE DE GASTOS Y EGRESOS'],
    [`Período: ${periodTitle}`],
    [`Fecha de Generación: ${new Date().toLocaleString('es-MX')}`],
    [''],
    ['#', 'Fecha', 'Hora', 'Concepto del Gasto', 'Monto ($ MXN)', 'Notas / Detalle']
  ];

  expenses.forEach((item, index) => {
    const { date, time } = formatDateTime(item.date);
    data.push([
      index + 1,
      date,
      time,
      item.concept,
      Number(item.amount.toFixed(2)),
      item.notes || '-'
    ]);
  });

  data.push(['']);
  data.push(['', '', '', 'TOTAL GENERAL:', Number(totalAmount.toFixed(2)), '']);

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Column width hints
  ws['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 12 },
    { wch: 45 },
    { wch: 16 },
    { wch: 30 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Gastos');

  const safeFilename = `Gastos_LaCasaDelDisfraz_${periodTitle.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, safeFilename);
}

/**
 * Export filtered expenses to a professionally styled PDF
 */
export function exportExpensesToPDF(
  expenses: ExpenseItem[],
  periodTitle: string,
  totalAmount: number
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Top header banner background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Accent stripe
  doc.setFillColor(192, 38, 211); // fuchsia-600
  doc.rect(0, 32, pageWidth, 2.5, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('LA CASA DEL DISFRAZ', 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('Control Interno de Gastos y Egresos Operativos', 14, 22);

  // Right date indicator
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Emisión: ${new Date().toLocaleString('es-MX')}`, pageWidth - 14, 22, { align: 'right' });

  // Report info cards
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Reporte de Gastos: ${periodTitle}`, 14, 44);

  // Summary Metrics Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, 48, pageWidth - 28, 18, 3, 3, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('TOTAL GASTADO', 20, 55);
  doc.text('REGISTROS', 85, 55);
  doc.text('PROMEDIO POR GASTO', 145, 55);

  const avg = expenses.length > 0 ? totalAmount / expenses.length : 0;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(192, 38, 211); // fuchsia-600
  doc.text(formatCurrency(totalAmount), 20, 62);

  doc.setTextColor(15, 23, 42);
  doc.text(`${expenses.length} gastos`, 85, 62);
  doc.text(formatCurrency(avg), 145, 62);

  // Table rows
  const tableRows = expenses.map((item, idx) => {
    const { date, time } = formatDateTime(item.date);
    return [
      String(idx + 1),
      `${date}\n${time}`,
      item.concept + (item.notes ? `\nNota: ${item.notes}` : ''),
      formatCurrency(item.amount)
    ];
  });

  autoTable(doc, {
    startY: 72,
    head: [['#', 'Fecha / Hora', 'Concepto del Gasto', 'Monto']],
    body: tableRows,
    foot: [['', '', 'TOTAL GENERAL ACUMULADO:', formatCurrency(totalAmount)]],
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left'
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'right'
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 32 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 32, halign: 'right', fontStyle: 'bold' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didDrawPage: (data) => {
      // Footer page number
      const pageNum = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Página ${data.pageNumber} de ${pageNum} — La Casa del Disfraz`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    }
  });

  const safeFilename = `Reporte_Gastos_${periodTitle.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(safeFilename);
}

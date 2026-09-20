import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './expensesExport';

export interface DayExpenseDetail {
  id: string;
  concept: string;
  amount: number;
}

export interface DayCorteExportItem {
  dateKey: string;
  formattedDate: string; // e.g. "Viernes 12-09-2026"
  ingresos: number;
  ticketsCount: number;
  gastos: number;
  gastosCount: number;
  conceptosGastos: string[];
  expenseItems?: DayExpenseDetail[];
  ganancia: number;
  margen: number;
}

export interface CorteExportSummary {
  periodLabel: string;
  totalIngresos: number;
  totalGastos: number;
  totalGanancia: number;
  totalMargen: number;
  totalTickets: number;
  totalGastosCount: number;
  storeAddress?: string;
  storePhone?: string;
}

/**
 * Generates and downloads a compact, beautiful, official PDF in Letter format
 * for the Corte de Caja (Ingresos menos Gastos = Total Ganancias).
 */
export function exportCorteToPDF(
  dailyList: DayCorteExportItem[],
  summary: CorteExportSummary
) {
  // Letter size: 215.9 x 279.4 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = 215.9;
  const pageHeight = 279.4;
  const marginX = 12;
  const contentWidth = pageWidth - (marginX * 2); // 191.9 mm

  // ==========================================
  // 1. HEADER (Fondo blanco limpio y profesional)
  // ==========================================
  // Fondo blanco (el canvas ya es blanco, no dibujamos rectángulo morado)

  // Title & Brand
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('LA CASA DEL DISFRAZ', marginX, 11);

  // Subtitle
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(147, 51, 234); // purple-600
  doc.text('INFORME GENERAL', marginX, 17);

  // Address & Phone
  const addressAndPhone = 'Quintanar #189, Centro, Ciudad Guzmán, Tel: 341 146 0580';
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(addressAndPhone, marginX, 22.5);

  // Right Header: Period and Emission Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(`Período: ${summary.periodLabel}`, pageWidth - marginX, 13, { align: 'right' });

  const genDate = new Date().toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Emisión: ${genDate}`, pageWidth - marginX, 19, { align: 'right' });

  // Divider Line below header
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.line(marginX, 26, pageWidth - marginX, 26);

  // ==========================================
  // 2. RESUMEN EJECUTIVO (3 TARJETAS COMPACTAS)
  // ==========================================
  let currentY = 30;
  const cardWidth = (contentWidth - 8) / 3; // ~61.3 mm
  const cardHeight = 18;

  // Tarjeta 1: Ingresos Netos
  const card1X = marginX;
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(187, 247, 208); // emerald-200
  doc.roundedRect(card1X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

  doc.setTextColor(22, 101, 52); // emerald-800
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('INGRESO NETO (VENTAS POS)', card1X + 3.5, currentY + 4.5);

  doc.setFontSize(10.5);
  doc.setTextColor(21, 128, 61); // emerald-700
  doc.text(formatCurrency(summary.totalIngresos), card1X + 3.5, currentY + 11);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Total: ${summary.totalTickets} ventas`, card1X + 3.5, currentY + 15.5);

  // Tarjeta 2: Gastos Totales
  const card2X = card1X + cardWidth + 4;
  doc.setFillColor(255, 241, 242); // rose-50
  doc.setDrawColor(254, 205, 211); // rose-200
  doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

  doc.setTextColor(159, 18, 57); // rose-800
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('GASTOS TOTALES (EGRESOS)', card2X + 3.5, currentY + 4.5);

  doc.setFontSize(10.5);
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text(formatCurrency(summary.totalGastos), card2X + 3.5, currentY + 11);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Total: ${summary.totalGastosCount} egresos registrados`, card2X + 3.5, currentY + 15.5);

  // Tarjeta 3: Ganancia Neta
  const card3X = card2X + cardWidth + 4;
  const isPos = summary.totalGanancia >= 0;
  doc.setFillColor(isPos ? 245 : 255, isPos ? 243 : 241, isPos ? 255 : 242);
  doc.setDrawColor(isPos ? 216 : 254, isPos ? 180 : 205, isPos ? 254 : 211);
  doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

  doc.setTextColor(isPos ? 107 : 159, isPos ? 33 : 18, isPos ? 168 : 57);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL GANANCIA NETA', card3X + 3.5, currentY + 4.5);

  doc.setFontSize(11);
  doc.setTextColor(isPos ? 88 : 225, isPos ? 28 : 29, isPos ? 135 : 72);
  doc.text(formatCurrency(summary.totalGanancia), card3X + 3.5, currentY + 11);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isPos ? 126 : 225, isPos ? 34 : 29, isPos ? 206 : 72);
  doc.text(`Rentabilidad: ${summary.totalMargen.toFixed(1)}%`, card3X + 3.5, currentY + 15.5);

  // ==========================================
  // 3. TABLA DIARIA CON FORMATO "Viernes 12-09-2026"
  // ==========================================
  currentY += cardHeight + 4;

  const tableBody = dailyList.map(item => {
    const gananciaFormatted = formatCurrency(item.ganancia);
    let conceptosStr = 'Sin gastos';
    if (item.expenseItems && item.expenseItems.length > 0) {
      conceptosStr = item.expenseItems.map(e => `${e.concept}: ${formatCurrency(e.amount)}`).join(' | ');
    } else if (item.conceptosGastos.length > 0) {
      conceptosStr = item.conceptosGastos.join(', ');
    }

    return [
      item.formattedDate,
      formatCurrency(item.ingresos),
      String(item.ticketsCount),
      formatCurrency(item.gastos),
      String(item.gastosCount),
      gananciaFormatted,
      `${item.margen.toFixed(1)}%`,
      conceptosStr
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [[
      'Día y Fecha',
      'Ingresos ($)',
      'Tickets',
      'Gastos ($)',
      'Egresos',
      'Ganancia Neta ($)',
      'Margen',
      'Desglose de Gastos'
    ]],
    body: tableBody,
    theme: 'striped',
    styles: {
      fontSize: 6.8,
      cellPadding: { top: 1.6, bottom: 1.6, left: 1.8, right: 1.8 },
      overflow: 'linebreak',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'left'
    },
    bodyStyles: {
      textColor: [51, 65, 85]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    },
    columnStyles: {
      0: { cellWidth: 36, fontStyle: 'bold', textColor: [15, 23, 42] }, // Día y Fecha
      1: { cellWidth: 22, halign: 'right', fontStyle: 'bold', textColor: [21, 128, 61] }, // Ingresos
      2: { cellWidth: 12, halign: 'center' }, // Tickets
      3: { cellWidth: 22, halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72] }, // Gastos
      4: { cellWidth: 12, halign: 'center' }, // Egresos
      5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }, // Ganancia Neta
      6: { cellWidth: 14, halign: 'center' }, // Margen %
      7: { cellWidth: 'auto' } // Detalle
    },
    didDrawCell: (data) => {
      // Highlight positive vs negative gain
      if (data.section === 'body' && data.column.index === 5) {
        const text = String(data.cell.raw);
        if (text.startsWith('-')) {
          doc.setTextColor(225, 29, 72); // rose-600
        } else {
          doc.setTextColor(21, 128, 61); // emerald-700
        }
      }
    },
    foot: [[
      'TOTALES GENERALES',
      formatCurrency(summary.totalIngresos),
      String(summary.totalTickets),
      formatCurrency(summary.totalGastos),
      String(summary.totalGastosCount),
      formatCurrency(summary.totalGanancia),
      `${summary.totalMargen.toFixed(1)}%`,
      'Balance consolidado del corte'
    ]],
    footStyles: {
      fillColor: [88, 28, 135], // purple-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left'
    },
    margin: { left: marginX, right: marginX, top: 12, bottom: 20 },
    didDrawPage: (data) => {
      // Footer on every page
      const pageStr = `Página ${data.pageNumber} de ${doc.getNumberOfPages()}`;
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(
        'La Casa del Disfraz • Informe General de Corte',
        marginX,
        pageHeight - 8
      );
      doc.text(pageStr, pageWidth - marginX, pageHeight - 8, { align: 'right' });
    }
  });

  // File download trigger
  const cleanPeriod = summary.periodLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Corte_Informe_General_${cleanPeriod}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

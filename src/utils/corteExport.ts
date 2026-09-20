import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './expensesExport';
import { ExpenseItem } from '../types/expenses';

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
  logoUrl?: string;
  periodExpenses?: ExpenseItem[];
}

/**
 * Safely loads an image and converts it into a base64 Data URL
 * with automatic fallback to local origin assets (to prevent CORS issues).
 */
async function loadLogoImage(preferredUrl?: string): Promise<{ dataUrl: string; width: number; height: number; format: 'PNG' | 'JPEG' } | null> {
  const candidates: string[] = [];
  if (preferredUrl && preferredUrl.trim()) candidates.push(preferredUrl.trim());
  candidates.push(
    'https://lacasadeldisfraz.mx/images/logo-horizontal-web_one.png',
    '/apple-touch-icon.png',
    '/favicon.png',
    '/pwa-192x192.png'
  );

  for (const url of candidates) {
    try {
      const res = await new Promise<{ dataUrl: string; width: number; height: number; format: 'PNG' | 'JPEG' } | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width || 120;
            canvas.height = img.naturalHeight || img.height || 40;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            resolve({
              dataUrl,
              width: canvas.width,
              height: canvas.height,
              format: 'PNG'
            });
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = url;
        setTimeout(() => resolve(null), 2500);
      });

      if (res) return res;
    } catch {
      // Continue to next candidate
    }
  }
  return null;
}

/**
 * Generates and downloads a compact, beautiful, official PDF in Letter format
 * for the Corte de Caja (Ingresos menos Gastos = Total Ganancias).
 * Includes business logo and formatted vertical list for expenses.
 */
export async function exportCorteToPDF(
  dailyList: DayCorteExportItem[],
  summary: CorteExportSummary
): Promise<void> {
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
  // 1. HEADER (Con Logotipo Oficial del Negocio)
  // ==========================================
  const logoInfo = await loadLogoImage(summary.logoUrl);
  let textStartX = marginX;

  if (logoInfo) {
    const maxLogoH = 14; // mm
    const maxLogoW = 46; // mm
    const ratio = logoInfo.width / (logoInfo.height || 1);
    let logoW = maxLogoH * ratio;
    let logoH = maxLogoH;

    if (logoW > maxLogoW) {
      logoW = maxLogoW;
      logoH = maxLogoW / ratio;
    }

    const logoY = 7.5 + ((14 - logoH) / 2);
    try {
      doc.addImage(logoInfo.dataUrl, logoInfo.format, marginX, logoY, logoW, logoH);
      textStartX = marginX + logoW + 4.5;
    } catch (e) {
      console.warn('Notice adding logo to PDF:', e);
      textStartX = marginX;
    }
  }

  // Title & Brand Name
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('LA CASA DEL DISFRAZ', textStartX, 11.5);

  // Subtitle
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(147, 51, 234); // purple-600
  doc.text('INFORME GENERAL DE CORTE', textStartX, 16.8);

  // Address & Phone
  const addressAndPhone = summary.storeAddress || 'Quintanar #189, Centro, Ciudad Guzmán, Tel: 341 146 0580';
  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(addressAndPhone, textStartX, 21.8);

  // Right Header: Period and Emission Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(`Período: ${summary.periodLabel}`, pageWidth - marginX, 12, { align: 'right' });

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
  doc.text(`Emisión: ${genDate}`, pageWidth - marginX, 17.5, { align: 'right' });

  doc.setFontSize(6.8);
  doc.setTextColor(22, 101, 52); // emerald-800
  doc.setFont('helvetica', 'bold');
  doc.text('• Balance Financiero Auditado', pageWidth - marginX, 22.5, { align: 'right' });

  // Divider Line below header
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.line(marginX, 26, pageWidth - marginX, 26);

  // ==========================================
  // 2. RESUMEN EJECUTIVO (3 TARJETAS COMPACTAS)
  // ==========================================
  let currentY = 29.5;
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

  doc.setFontSize(11);
  doc.setTextColor(21, 128, 61); // emerald-700
  doc.text(formatCurrency(summary.totalIngresos), card1X + 3.5, currentY + 11);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(22, 101, 52);
  doc.text(`Ventas: ${summary.totalTickets} tickets`, card1X + 3.5, currentY + 15.5);

  // Tarjeta 2: Gastos Operativos
  const card2X = card1X + cardWidth + 4;
  doc.setFillColor(255, 241, 242); // rose-50
  doc.setDrawColor(254, 205, 211); // rose-200
  doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

  doc.setTextColor(159, 18, 57); // rose-800
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('GASTOS Y EGRESOS OPERATIVOS', card2X + 3.5, currentY + 4.5);

  doc.setFontSize(11);
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text(formatCurrency(summary.totalGastos), card2X + 3.5, currentY + 11);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(159, 18, 57);
  doc.text(`Egresos: ${summary.totalGastosCount} registros`, card2X + 3.5, currentY + 15.5);

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

  // =========================================================================
  // 3. TABLA DIARIA CON GASTOS FORMATEADOS EN LISTADO VERTICAL
  // =========================================================================
  currentY += cardHeight + 4.5;

  const tableBody = dailyList.map(item => {
    const gananciaFormatted = formatCurrency(item.ganancia);
    let conceptosStr = 'Sin egresos';
    
    // Formato listado vertical de gastos con viñetas y montos
    if (item.expenseItems && item.expenseItems.length > 0) {
      conceptosStr = item.expenseItems
        .map(e => `• ${e.concept}: ${formatCurrency(e.amount)}`)
        .join('\n');
    } else if (item.conceptosGastos && item.conceptosGastos.length > 0) {
      conceptosStr = item.conceptosGastos.map(c => `• ${c}`).join('\n');
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
      'Listado de Gastos del Día'
    ]],
    body: tableBody,
    theme: 'striped',
    styles: {
      fontSize: 6.8,
      cellPadding: { top: 2, bottom: 2, left: 1.8, right: 1.8 },
      overflow: 'linebreak',
      valign: 'top', // Alineación superior para que los listados de gastos comiencen prolijos
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'left',
      valign: 'middle'
    },
    bodyStyles: {
      textColor: [51, 65, 85]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    },
    columnStyles: {
      0: { cellWidth: 33, fontStyle: 'bold', textColor: [15, 23, 42] }, // Día y Fecha
      1: { cellWidth: 20, halign: 'right', fontStyle: 'bold', textColor: [21, 128, 61] }, // Ingresos
      2: { cellWidth: 11, halign: 'center' }, // Tickets
      3: { cellWidth: 20, halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72] }, // Gastos
      4: { cellWidth: 11, halign: 'center' }, // Egresos
      5: { cellWidth: 24, halign: 'right', fontStyle: 'bold' }, // Ganancia Neta
      6: { cellWidth: 13, halign: 'center' }, // Margen %
      7: { cellWidth: 'auto', fontStyle: 'normal', textColor: [71, 85, 105] } // Listado de Gastos
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
      fontSize: 7.4,
      halign: 'left',
      valign: 'middle'
    },
    margin: { left: marginX, right: marginX, top: 12, bottom: 20 },
    didDrawPage: (data) => {
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

  // =========================================================================
  // 4. LISTADO CONSOLIDADO Y DETALLADO DE GASTOS DEL PERÍODO
  // Si existen egresos registrados, se anexa una tabla tipo listado completa
  // para facilitar auditoría contable y revisión de cada concepto y monto.
  // =========================================================================
  if (summary.periodExpenses && summary.periodExpenses.length > 0) {
    let afterTableY = (doc as any).lastAutoTable?.finalY || currentY + 50;

    // Si queda poco espacio al final de la página (menos de 55mm), agregar nueva página
    if (afterTableY > pageHeight - 55) {
      doc.addPage();
      afterTableY = 16;
    } else {
      afterTableY += 8;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('LISTADO DETALLADO DE GASTOS Y SALIDAS DE DINERO', marginX, afterTableY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(
      `Detalle cronológico de ${summary.totalGastosCount} egresos registrados en el período (Total: ${formatCurrency(summary.totalGastos)}):`,
      marginX,
      afterTableY + 4.5
    );

    const expenseRows = summary.periodExpenses.map((exp, idx) => {
      let dateFormatted = exp.date || '-';
      try {
        const d = new Date(exp.date);
        dateFormatted = d.toLocaleString('es-MX', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {}

      return [
        String(idx + 1),
        dateFormatted,
        exp.concept || 'Gasto no especificado',
        exp.notes || '-',
        formatCurrency(Number(exp.amount || 0))
      ];
    });

    autoTable(doc, {
      startY: afterTableY + 6.5,
      head: [[
        '#',
        'Fecha y Hora',
        'Concepto del Gasto',
        'Notas / Detalle',
        'Monto ($ MXN)'
      ]],
      body: expenseRows,
      theme: 'striped',
      styles: {
        fontSize: 6.8,
        cellPadding: { top: 1.6, bottom: 1.6, left: 1.8, right: 1.8 },
        overflow: 'linebreak',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [190, 24, 93], // rose-700
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.2
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 32 },
        2: { cellWidth: 'auto', fontStyle: 'bold', textColor: [15, 23, 42] },
        3: { cellWidth: 50, textColor: [100, 116, 139] },
        4: { cellWidth: 26, halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72] }
      },
      foot: [[
        '',
        '',
        'TOTAL EGRESOS DEL PERÍODO',
        `${summary.totalGastosCount} gastos registrados`,
        formatCurrency(summary.totalGastos)
      ]],
      footStyles: {
        fillColor: [159, 18, 57], // rose-900
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.4
      },
      margin: { left: marginX, right: marginX, top: 12, bottom: 20 },
      didDrawPage: (data) => {
        const pageStr = `Página ${data.pageNumber} de ${doc.getNumberOfPages()}`;
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text('La Casa del Disfraz • Informe General de Corte', marginX, pageHeight - 8);
        doc.text(pageStr, pageWidth - marginX, pageHeight - 8, { align: 'right' });
      }
    });
  }

  // File download trigger
  const cleanPeriod = summary.periodLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Corte_Informe_General_${cleanPeriod}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

import * as XLSX from 'xlsx';
import { LoyverseReceipt } from '../types/incomes';
import { ExpenseItem } from '../types/expenses';
import { getReceiptMonthKey } from './sanitizeFirestore';

export interface FullBackupMetadata {
  lastSyncTime?: string | null;
  lastVerifiedAt?: string | null;
  oldestReceiptDate?: string | null;
  latestReceiptDate?: string | null;
}

function getFileDateStamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatIsoToReadable(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMonthLabel(monthKey: string): string {
  if (!monthKey || monthKey === 'unknown') return 'Sin fecha';
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey;
  const d = new Date(y, m - 1, 1);
  const raw = d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/**
 * Downloads a complete structured JSON backup of ALL historical Loyverse receipts and store expenses.
 */
export function exportFullBackupToJSON(
  receipts: LoyverseReceipt[],
  expenses: ExpenseItem[],
  metadata?: FullBackupMetadata
): { fileName: string; sizeKB: number } {
  const sortedReceipts = [...receipts].sort(
    (a, b) =>
      new Date(b.created_at || b.receipt_date || 0).getTime() -
      new Date(a.created_at || a.receipt_date || 0).getTime()
  );

  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime()
  );

  let totalGross = 0;
  let totalRefunds = 0;
  sortedReceipts.forEach((r) => {
    const val = Math.abs(r.total_money || 0);
    if (r.receipt_type === 'REFUND') totalRefunds += val;
    else totalGross += val;
  });

  const totalExpensesAmount = sortedExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  const payload = {
    app: 'La Casa del Disfraz — Respaldo Completo de Base de Datos',
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    summary: {
      totalReceipts: sortedReceipts.length,
      totalExpenses: sortedExpenses.length,
      oldestReceiptDate: metadata?.oldestReceiptDate || null,
      latestReceiptDate: metadata?.latestReceiptDate || null,
      lastSyncTime: metadata?.lastSyncTime || null,
      lastVerifiedAt: metadata?.lastVerifiedAt || null,
      totalGrossSalesMXN: Number(totalGross.toFixed(2)),
      totalRefundsMXN: Number(totalRefunds.toFixed(2)),
      totalNetSalesMXN: Number((totalGross - totalRefunds).toFixed(2)),
      totalExpensesMXN: Number(totalExpensesAmount.toFixed(2)),
      netBalanceMXN: Number((totalGross - totalRefunds - totalExpensesAmount).toFixed(2)),
    },
    receipts: sortedReceipts,
    expenses: sortedExpenses,
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const fileName = `Respaldo_Completo_LaCasaDelDisfraz_${getFileDateStamp()}.json`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return {
    fileName,
    sizeKB: Math.max(1, Math.round(blob.size / 1024)),
  };
}

/**
 * Downloads a complete multi-sheet Excel (.xlsx) workbook with:
 * 1) Resumen Mensual (all months: sales, refunds, net income, expenses, profit)
 * 2) Todos los Recibos (complete Loyverse historical ledger)
 * 3) Todos los Gastos (complete operational expenses ledger)
 */
export function exportFullBackupToExcel(
  receipts: LoyverseReceipt[],
  expenses: ExpenseItem[]
): { fileName: string; monthsCount: number } {
  const wb = XLSX.utils.book_new();

  // Build monthly aggregation map
  const monthlyMap: Record<
    string,
    {
      salesCount: number;
      refundsCount: number;
      gross: number;
      refunds: number;
      expensesCount: number;
      expensesTotal: number;
    }
  > = {};

  const ensureMonth = (key: string) => {
    if (!monthlyMap[key]) {
      monthlyMap[key] = {
        salesCount: 0,
        refundsCount: 0,
        gross: 0,
        refunds: 0,
        expensesCount: 0,
        expensesTotal: 0,
      };
    }
    return monthlyMap[key];
  };

  const sortedReceipts = [...receipts].sort(
    (a, b) =>
      new Date(b.created_at || b.receipt_date || 0).getTime() -
      new Date(a.created_at || a.receipt_date || 0).getTime()
  );

  sortedReceipts.forEach((r) => {
    const mKey = getReceiptMonthKey(r);
    const bucket = ensureMonth(mKey);
    const amount = Math.abs(Number(r.total_money) || 0);
    if (r.receipt_type === 'REFUND') {
      bucket.refundsCount++;
      bucket.refunds += amount;
    } else {
      bucket.salesCount++;
      bucket.gross += amount;
    }
  });

  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime()
  );

  sortedExpenses.forEach((e) => {
    const d = new Date(e.date || e.createdAt || 0);
    const mKey = !isNaN(d.getTime())
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      : 'unknown';
    const bucket = ensureMonth(mKey);
    bucket.expensesCount++;
    bucket.expensesTotal += Number(e.amount) || 0;
  });

  const sortedMonthKeys = Object.keys(monthlyMap).sort((a, b) => b.localeCompare(a));

  // --- SHEET 1: Resumen Mensual ---
  let grandSalesCount = 0;
  let grandRefundsCount = 0;
  let grandGross = 0;
  let grandRefunds = 0;
  let grandExpensesCount = 0;
  let grandExpenses = 0;

  const monthlyRows: Record<string, any>[] = sortedMonthKeys.map((mKey) => {
    const m = monthlyMap[mKey];
    const netIncome = m.gross - m.refunds;
    const netProfit = netIncome - m.expensesTotal;

    grandSalesCount += m.salesCount;
    grandRefundsCount += m.refundsCount;
    grandGross += m.gross;
    grandRefunds += m.refunds;
    grandExpensesCount += m.expensesCount;
    grandExpenses += m.expensesTotal;

    return {
      Mes: mKey,
      Período: formatMonthLabel(mKey),
      'Tickets Venta': m.salesCount,
      Devoluciones: m.refundsCount,
      'Ventas Brutas ($)': Number(m.gross.toFixed(2)),
      'Devoluciones ($)': Number(m.refunds.toFixed(2)),
      'Ingresos Netos ($)': Number(netIncome.toFixed(2)),
      'Cant. Gastos': m.expensesCount,
      'Total Gastos ($)': Number(m.expensesTotal.toFixed(2)),
      'Utilidad Neta ($)': Number(netProfit.toFixed(2)),
    };
  });

  monthlyRows.push({
    Mes: 'TOTAL',
    Período: 'ACUMULADO HISTÓRICO',
    'Tickets Venta': grandSalesCount,
    Devoluciones: grandRefundsCount,
    'Ventas Brutas ($)': Number(grandGross.toFixed(2)),
    'Devoluciones ($)': Number(grandRefunds.toFixed(2)),
    'Ingresos Netos ($)': Number((grandGross - grandRefunds).toFixed(2)),
    'Cant. Gastos': grandExpensesCount,
    'Total Gastos ($)': Number(grandExpenses.toFixed(2)),
    'Utilidad Neta ($)': Number((grandGross - grandRefunds - grandExpenses).toFixed(2)),
  });

  const wsSummary = XLSX.utils.json_to_sheet(monthlyRows);
  wsSummary['!cols'] = [
    { wch: 11 },
    { wch: 22 },
    { wch: 14 },
    { wch: 13 },
    { wch: 18 },
    { wch: 17 },
    { wch: 18 },
    { wch: 13 },
    { wch: 17 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Mensual');

  // --- SHEET 2: Todos los Recibos ---
  const receiptRows = sortedReceipts.map((r, idx) => {
    const isRefund = r.receipt_type === 'REFUND';
    const paymentsText = (r.payments || [])
      .map((p) => `${p.name || p.type || 'Pago'}: $${Number(p.money_amount || 0).toFixed(2)}`)
      .join(' | ');
    const itemsText = (r.line_items || [])
      .map((li) => `${li.quantity || 1}x ${li.item_name}${li.variant_name ? ` (${li.variant_name})` : ''}`)
      .join(', ');
    const signedTotal = isRefund ? -Math.abs(Number(r.total_money) || 0) : Math.abs(Number(r.total_money) || 0);

    return {
      '#': idx + 1,
      Mes: getReceiptMonthKey(r),
      'Fecha y Hora': formatIsoToReadable(r.created_at || r.receipt_date),
      'No. Ticket': r.receipt_number || '',
      Tipo: isRefund ? 'Devolución' : 'Venta',
      Estado: r.cancelled_at ? 'Cancelado' : 'Activo',
      'Métodos de Pago': paymentsText || 'N/A',
      'Descuento ($)': Number((r.total_discount || 0).toFixed(2)),
      'Total ($)': Number(signedTotal.toFixed(2)),
      Artículos: itemsText,
      Notas: r.note || '',
    };
  });

  const wsReceipts = XLSX.utils.json_to_sheet(
    receiptRows.length > 0
      ? receiptRows
      : [{ '#': '', Mes: '', 'Fecha y Hora': 'Sin recibos registrados', 'No. Ticket': '', Tipo: '', Estado: '', 'Métodos de Pago': '', 'Descuento ($)': 0, 'Total ($)': 0, Artículos: '', Notas: '' }]
  );
  wsReceipts['!cols'] = [
    { wch: 7 },
    { wch: 10 },
    { wch: 19 },
    { wch: 14 },
    { wch: 12 },
    { wch: 11 },
    { wch: 28 },
    { wch: 13 },
    { wch: 14 },
    { wch: 48 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, wsReceipts, 'Todos los Recibos');

  // --- SHEET 3: Todos los Gastos ---
  const expenseRows = sortedExpenses.map((e, idx) => {
    const d = new Date(e.date || e.createdAt || 0);
    const mKey = !isNaN(d.getTime())
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      : 'unknown';
    return {
      '#': idx + 1,
      Mes: mKey,
      'Fecha y Hora': formatIsoToReadable(e.date || e.createdAt),
      Concepto: e.concept || '',
      'Monto ($)': Number((Number(e.amount) || 0).toFixed(2)),
      'Registrado Por': e.registeredBy || 'Admin',
      Notas: e.notes || '',
    };
  });

  const wsExpenses = XLSX.utils.json_to_sheet(
    expenseRows.length > 0
      ? expenseRows
      : [{ '#': '', Mes: '', 'Fecha y Hora': 'Sin gastos registrados', Concepto: '', 'Monto ($)': 0, 'Registrado Por': '', Notas: '' }]
  );
  wsExpenses['!cols'] = [
    { wch: 7 },
    { wch: 10 },
    { wch: 19 },
    { wch: 36 },
    { wch: 15 },
    { wch: 20 },
    { wch: 32 },
  ];
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Todos los Gastos');

  const fileName = `Respaldo_Completo_LaCasaDelDisfraz_${getFileDateStamp()}.xlsx`;
  XLSX.writeFile(wb, fileName);

  return {
    fileName,
    monthsCount: sortedMonthKeys.length,
  };
}

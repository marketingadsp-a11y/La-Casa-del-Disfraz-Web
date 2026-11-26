import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  TrendingUp, 
  Receipt, 
  Calendar, 
  Filter, 
  Printer, 
  FileSpreadsheet, 
  FileDown,
  RefreshCw, 
  RotateCcw,
  Database,
  ArrowUpRight, 
  ArrowDownRight, 
  Percent, 
  DollarSign, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Eye, 
  Layers, 
  Store,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  CalendarRange,
  HardDriveDownload,
  ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useIncomes, SyncFromLoyverseOptions } from '../../context/IncomesContext';
import { useExpenses } from '../../context/ExpensesContext';
import { useSiteContent } from '../../context/SiteContentContext';
import { IncomeDateFilter } from '../../types/incomes';
import { ExpenseItem } from '../../types/expenses';
import { formatCurrency } from '../../utils/expensesExport';
import { exportCorteToPDF } from '../../utils/corteExport';
import {
  LoyverseLiveProgressBar,
  LoyverseRangeSyncModal,
  FullBackupModal,
  formatShortDateWithYear,
  formatDayMonthYear,
} from './LoyverseSyncModals';

interface AdminCorteTabProps {
  onNavigateToSettings: () => void;
}

interface DayExpenseItem {
  id: string;
  concept: string;
  amount: number;
}

interface DayCorteData {
  dateKey: string; // YYYY-MM-DD
  formattedDate: string; // "Viernes 12-09-2026"
  rawDate: Date;
  ingresos: number;
  ticketsCount: number;
  gastos: number;
  gastosCount: number;
  conceptosGastos: string[];
  expenseItems: DayExpenseItem[];
  ganancia: number;
  margen: number; // Porcentaje de ganancia del día
  status: 'ganancia' | 'deficit' | 'equilibrio';
}

/**
 * Formats a date into the exact requested format:
 * "Viernes 12-09-2026" (Capitalized day name + DD-MM-YYYY)
 */
export function formatDayDate(dateInput: Date | string): string {
  let d: Date;
  if (typeof dateInput === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [y, m, day] = dateInput.split('-').map(Number);
      d = new Date(y, m - 1, day, 12, 0, 0);
    } else {
      d = new Date(dateInput);
    }
  } else {
    d = dateInput;
  }

  if (isNaN(d.getTime())) return 'Fecha no válida';

  // Capitalize day of week in Spanish
  const dayNameRaw = d.toLocaleDateString('es-MX', { weekday: 'long' });
  const dayName = dayNameRaw.charAt(0).toUpperCase() + dayNameRaw.slice(1);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${dayName} ${day}-${month}-${year}`;
}

export const AdminCorteTab: React.FC<AdminCorteTabProps> = ({ onNavigateToSettings }) => {
  const { 
    receipts, 
    isLoading: isIncomesLoading, 
    isSyncing, 
    syncingMode,
    syncProgress,
    dbStats,
    syncFromLoyverse, 
    cancelSync,
    lastSyncTime 
  } = useIncomes();
  const { expenses, isLoading: isExpensesLoading } = useExpenses();
  const { content } = useSiteContent();

  const [filterType, setFilterType] = useState<IncomeDateFilter>('current_month');
  const [sortAsc, setSortAsc] = useState<boolean>(false); // default most recent first
  const [viewMode, setViewMode] = useState<'sheet' | 'expanded'>('sheet');
  const [expandedDayKey, setExpandedDayKey] = useState<string | null>(null);
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Custom date range
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [syncFeedback, setSyncFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // 1. Sincronización incremental (actualizaciones y tickets nuevos desde el último ticket guardado)
  const handleSyncIncremental = async () => {
    setSyncFeedback(null);
    const res = await syncFromLoyverse({ mode: 'incremental' });
    if (res.success) {
      setSyncFeedback({
        text:
          res.message ||
          `Sincronización verificada en Firebase (Total: ${(res.totalCount ?? receipts.length).toLocaleString('es-MX')} recibos).`,
        type: 'success',
      });
    } else if (!res.aborted) {
      setSyncFeedback({ text: res.error || 'Error en la sincronización incremental con Loyverse', type: 'error' });
    }
    setTimeout(() => setSyncFeedback(null), 8000);
  };

  // 2. Sincronización completa (descarga todo el historial disponible en Loyverse sin límite de páginas)
  const handleSyncFull = async () => {
    setSyncFeedback(null);
    const res = await syncFromLoyverse({ mode: 'full' });
    if (res.success) {
      setSyncFeedback({
        text:
          res.message ||
          `Historial completo respaldado y verificado: ${(res.totalCount ?? res.count).toLocaleString('es-MX')} recibos.`,
        type: 'success',
      });
    } else if (!res.aborted) {
      setSyncFeedback({ text: res.error || 'Error al sincronizar el historial completo desde Loyverse', type: 'error' });
    }
    setTimeout(() => setSyncFeedback(null), 8000);
  };

  // 3. Sincronización por rango de fechas específico
  const handleRunRangeSync = async (options: SyncFromLoyverseOptions) => {
    setSyncFeedback(null);
    const res = await syncFromLoyverse(options);
    if (res.success) {
      setSyncFeedback({
        text:
          res.message ||
          `Rango sincronizado y verificado (Total BD: ${(res.totalCount ?? receipts.length).toLocaleString('es-MX')} recibos).`,
        type: 'success',
      });
    } else if (!res.aborted) {
      setSyncFeedback({ text: res.error || 'Error al sincronizar el rango seleccionado', type: 'error' });
    }
    setTimeout(() => setSyncFeedback(null), 8000);
    return res;
  };

  // Formatted status for sync time and receipt date range (with year included)
  const formattedLastSync = useMemo(() => {
    return formatShortDateWithYear(dbStats.lastVerifiedAt || lastSyncTime) || 'Sin verificar';
  }, [dbStats.lastVerifiedAt, lastSyncTime]);

  const latestTicketDate = useMemo(() => {
    return formatShortDateWithYear(dbStats.latestReceiptDate);
  }, [dbStats.latestReceiptDate]);

  const oldestTicketDate = useMemo(() => {
    return formatDayMonthYear(dbStats.oldestReceiptDate);
  }, [dbStats.oldestReceiptDate]);

  // 1. Calculate Start and End timestamps for the selected period
  const { periodStart, periodEnd, periodLabel } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let start = new Date(currentYear, currentMonth, 1).getTime();
    let end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999).getTime();
    let label = 'Mes en curso';

    switch (filterType) {
      case 'today': {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
        start = startOfDay;
        end = startOfDay + 24 * 60 * 60 * 1000 - 1;
        label = `Hoy (${now.toLocaleDateString('es-MX')})`;
        break;
      }
      case 'yesterday': {
        const yest = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
        start = yest.getTime();
        end = yest.getTime() + 24 * 60 * 60 * 1000 - 1;
        label = `Ayer (${yest.toLocaleDateString('es-MX')})`;
        break;
      }
      case 'this_week': {
        const dayOfWeek = now.getDay();
        const distanceToMonday = (dayOfWeek + 6) % 7;
        const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday, 0, 0, 0, 0);
        start = monday.getTime();
        end = now.getTime();
        label = 'Esta semana';
        break;
      }
      case 'last_7_days': {
        start = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        end = now.getTime();
        label = 'Últimos 7 días';
        break;
      }
      case 'current_month': {
        const monthName = now.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
        label = `Mes en curso (${monthName})`;
        start = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0).getTime();
        end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999).getTime();
        break;
      }
      case 'last_month': {
        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
        const lYear = lastMonthDate.getFullYear();
        const lMonth = lastMonthDate.getMonth();
        const monthName = lastMonthDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
        label = `Mes pasado (${monthName})`;
        start = new Date(lYear, lMonth, 1, 0, 0, 0, 0).getTime();
        end = new Date(lYear, lMonth + 1, 0, 23, 59, 59, 999).getTime();
        break;
      }
      case 'current_year': {
        label = `Año en curso (${currentYear})`;
        start = new Date(currentYear, 0, 1, 0, 0, 0, 0).getTime();
        end = new Date(currentYear, 11, 31, 23, 59, 59, 999).getTime();
        break;
      }
      case 'custom': {
        const [sy, sm, sd] = (customStartDate || '').split('-').map(Number);
        const [ey, em, ed] = (customEndDate || '').split('-').map(Number);
        const sTime = sy ? new Date(sy, sm - 1, sd, 0, 0, 0, 0).getTime() : 0;
        const eTime = ey ? new Date(ey, em - 1, ed, 23, 59, 59, 999).getTime() : Date.now();
        start = sTime;
        end = eTime;
        label = `Personalizado: ${customStartDate} al ${customEndDate}`;
        break;
      }
    }

    return { periodStart: start, periodEnd: end, periodLabel: label };
  }, [filterType, customStartDate, customEndDate]);

  // 2. Filter receipts and expenses within this period
  const filteredData = useMemo(() => {
    // Incomes
    const periodReceipts = receipts.filter(r => {
      const dateStr = r.created_at || r.receipt_date;
      if (!dateStr) return false;
      const t = new Date(dateStr).getTime();
      return t >= periodStart && t <= periodEnd;
    });

    // Expenses
    const periodExpenses = expenses.filter(e => {
      if (!e.date) return false;
      const t = new Date(e.date).getTime();
      return t >= periodStart && t <= periodEnd;
    });

    // Daily breakdown map (key: YYYY-MM-DD)
    const dayMap = new Map<string, {
      ingresos: number;
      ticketsCount: number;
      gastos: number;
      gastosCount: number;
      conceptos: string[];
      expenseList: DayExpenseItem[];
      rawDate: Date;
    }>();

    // Populate receipts into daily map
    periodReceipts.forEach(r => {
      const dateStr = r.created_at || r.receipt_date;
      if (!dateStr) return;
      const d = new Date(dateStr);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;

      const entry = dayMap.get(key) || {
        ingresos: 0,
        ticketsCount: 0,
        gastos: 0,
        gastosCount: 0,
        conceptos: [] as string[],
        expenseList: [] as DayExpenseItem[],
        rawDate: new Date(yyyy, d.getMonth(), d.getDate(), 12, 0, 0)
      };

      const isRefund = r.receipt_type === 'REFUND';
      const amount = isRefund ? -Math.abs(r.total_money || 0) : (r.total_money || 0);

      entry.ingresos += amount;
      if (!isRefund) {
        entry.ticketsCount += 1;
      }
      dayMap.set(key, entry);
    });

    // Populate expenses into daily map
    periodExpenses.forEach(e => {
      if (!e.date) return;
      const d = new Date(e.date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;

      const entry = dayMap.get(key) || {
        ingresos: 0,
        ticketsCount: 0,
        gastos: 0,
        gastosCount: 0,
        conceptos: [] as string[],
        expenseList: [] as DayExpenseItem[],
        rawDate: new Date(yyyy, d.getMonth(), d.getDate(), 12, 0, 0)
      };

      const amt = Number(e.amount || 0);
      entry.gastos += amt;
      entry.gastosCount += 1;
      entry.expenseList.push({
        id: e.id,
        concept: e.concept || 'Gasto no especificado',
        amount: amt
      });
      if (e.concept && !entry.conceptos.includes(e.concept)) {
        entry.conceptos.push(e.concept);
      }
      dayMap.set(key, entry);
    });

    // Transform into DayCorteData array
    const dailyList: DayCorteData[] = Array.from(dayMap.entries()).map(([key, data]) => {
      const ganancia = data.ingresos - data.gastos;
      const margen = data.ingresos > 0 ? (ganancia / data.ingresos) * 100 : (ganancia < 0 ? -100 : 0);
      let status: 'ganancia' | 'deficit' | 'equilibrio' = 'equilibrio';
      if (ganancia > 0.01) status = 'ganancia';
      else if (ganancia < -0.01) status = 'deficit';

      return {
        dateKey: key,
        formattedDate: formatDayDate(key),
        rawDate: data.rawDate,
        ingresos: data.ingresos,
        ticketsCount: data.ticketsCount,
        gastos: data.gastos,
        gastosCount: data.gastosCount,
        conceptosGastos: data.conceptos,
        expenseItems: (data as any).expenseList || [],
        ganancia,
        margen,
        status
      };
    });

    // Sort by date
    dailyList.sort((a, b) => {
      const timeA = a.rawDate.getTime();
      const timeB = b.rawDate.getTime();
      return sortAsc ? timeA - timeB : timeB - timeA;
    });

    // Compute Totals
    const totalIngresos = periodReceipts.reduce((sum, r) => {
      const isRefund = r.receipt_type === 'REFUND';
      return sum + (isRefund ? -Math.abs(r.total_money || 0) : (r.total_money || 0));
    }, 0);

    const totalGastos = periodExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalGanancia = totalIngresos - totalGastos;
    const totalMargen = totalIngresos > 0 ? (totalGanancia / totalIngresos) * 100 : 0;
    const totalTickets = periodReceipts.filter(r => r.receipt_type !== 'REFUND').length;
    const totalGastosCount = periodExpenses.length;

    return {
      dailyList,
      periodExpenses,
      totalIngresos,
      totalGastos,
      totalGanancia,
      totalMargen,
      totalTickets,
      totalGastosCount
    };
  }, [receipts, expenses, periodStart, periodEnd, sortAsc]);

  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [showExpensesList, setShowExpensesList] = useState(false);

  // Export Corte to PDF (Letter Format with Logo and Expenses List)
  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      await exportCorteToPDF(filteredData.dailyList, {
        periodLabel,
        totalIngresos: filteredData.totalIngresos,
        totalGastos: filteredData.totalGastos,
        totalGanancia: filteredData.totalGanancia,
        totalMargen: filteredData.totalMargen,
        totalTickets: filteredData.totalTickets,
        totalGastosCount: filteredData.totalGastosCount,
        storeAddress: 'Quintanar #189, Centro, Ciudad Guzmán, Tel: 341 146 0580',
        storePhone: '341 146 0580',
        logoUrl: content.branding?.webLogoUrl || 'https://lacasadeldisfraz.mx/images/logo-horizontal-web_one.png',
        periodExpenses: filteredData.periodExpenses
      });
      setSyncFeedback({
        text: '¡PDF descargado con éxito! Se generó el corte oficial con logotipo y desglose de gastos.',
        type: 'success'
      });
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setSyncFeedback({
        text: 'Ocurrió un error al generar el PDF: ' + (err.message || 'Error desconocido'),
        type: 'error'
      });
    } finally {
      setIsExportingPDF(false);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  // Export Corte to Excel
  const handleExportExcel = () => {
    const sheetData: (string | number)[][] = [
      ['LA CASA DEL DISFRAZ - CORTE DE CAJA Y BALANCE FINANCIERO'],
      [`Período: ${periodLabel}`],
      [`Fecha de emisión: ${new Date().toLocaleString('es-MX')}`],
      [''],
      ['RESUMEN EJECUTIVO:'],
      ['Ingreso Neto (Ventas):', filteredData.totalIngresos],
      ['Gastos Totales:', filteredData.totalGastos],
      ['Ganancia Neta (Total):', filteredData.totalGanancia],
      ['Margen de Rentabilidad:', `${filteredData.totalMargen.toFixed(1)}%`],
      ['Total Tickets de Venta:', filteredData.totalTickets],
      ['Total Registros de Gasto:', filteredData.totalGastosCount],
      [''],
      ['DESGLOSE DIARIO DE CORTE:'],
      ['Fecha', 'Ingresos ($ MXN)', 'Tickets', 'Gastos ($ MXN)', 'Cant. Gastos', 'Ganancia Neta ($ MXN)', 'Margen (%)', 'Conceptos de Gasto']
    ];

    filteredData.dailyList.forEach(day => {
      const breakdownStr = day.expenseItems && day.expenseItems.length > 0
        ? day.expenseItems.map(e => `${e.concept}: ${formatCurrency(e.amount)}`).join(' | ')
        : (day.conceptosGastos.join(', ') || 'Sin gastos');

      sheetData.push([
        day.formattedDate,
        day.ingresos,
        day.ticketsCount,
        day.gastos,
        day.gastosCount,
        day.ganancia,
        `${day.margen.toFixed(1)}%`,
        breakdownStr
      ]);
    });

    sheetData.push(['']);
    sheetData.push([
      'TOTALES GENERALES',
      filteredData.totalIngresos,
      filteredData.totalTickets,
      filteredData.totalGastos,
      filteredData.totalGastosCount,
      filteredData.totalGanancia,
      `${filteredData.totalMargen.toFixed(1)}%`,
      ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Corte de Caja');
    XLSX.writeFile(wb, `Corte_LaCasaDelDisfraz_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const hasToken = Boolean(content.loyverse?.apiToken?.trim());

  return (
    <div className="space-y-6">
      {/* Print-specific stylesheet injected cleanly */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            font-size: 8pt !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, aside, .no-print, nav, button {
            display: none !important;
          }
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .letter-sheet {
            box-shadow: none !important;
            border: none !important;
            padding: 4mm !important;
            margin: 0 !important;
            width: 100% !important;
            background: white !important;
            zoom: 0.8 !important;
          }
          @page {
            size: letter portrait;
            margin: 8mm 10mm;
          }
        }
      `}</style>

      {/* Header Banner */}
      <div className="no-print bg-gradient-to-br from-slate-900 via-purple-950 to-fuchsia-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-fun font-bold text-white">
              Corte
            </h2>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="px-3.5 py-2.5 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              title="Descargar reporte oficial del período en formato PDF tamaño carta"
            >
              <FileDown className={`w-4 h-4 text-fuchsia-700 ${isExportingPDF ? 'animate-bounce' : ''}`} />
              <span>{isExportingPDF ? 'Generando PDF...' : 'PDF (Carta)'}</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
              title="Descargar tabla del período en formato Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel Período</span>
            </button>

            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer whitespace-nowrap"
              title="Descargar respaldo completo de toda la base de datos en Excel y JSON"
            >
              <HardDriveDownload className="w-4 h-4 text-emerald-300" />
              <span>Respaldo Completo</span>
            </button>

            {/* Botón 1: Sincronización incremental verificada */}
            <button
              onClick={handleSyncIncremental}
              disabled={isSyncing || !hasToken}
              className="px-3.5 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
              title="Sincronizar ventas nuevas y actualizadas desde el último ticket guardado"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing && syncingMode === 'incremental' ? 'animate-spin' : ''}`} />
              <span>{isSyncing && syncingMode === 'incremental' ? 'Sincronizando...' : 'Sincronizar Recientes'}</span>
            </button>

            {/* Botón 2: Sincronizar por rango específico */}
            <button
              onClick={() => setIsRangeModalOpen(true)}
              disabled={isSyncing || !hasToken}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-white/15 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer whitespace-nowrap"
              title="Elegir fecha de inicio y fin para recuperar cualquier período en Loyverse"
            >
              <CalendarRange className="w-4 h-4 text-fuchsia-300" />
              <span>Por Rango</span>
            </button>

            {/* Botón 3: Sincronizar todo el historial disponible en Loyverse */}
            <button
              onClick={handleSyncFull}
              disabled={isSyncing || !hasToken}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-white/15 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer whitespace-nowrap"
              title="Descargar todo el historial disponible en Loyverse sin límite de páginas y guardar por meses"
            >
              <RotateCcw className={`w-4 h-4 ${isSyncing && syncingMode === 'full' ? 'animate-spin' : ''}`} />
              <span>{isSyncing && syncingMode === 'full' ? 'Descargando Todo...' : 'Todo el Historial'}</span>
            </button>
          </div>
        </div>

        {/* Clean unboxed Database & Verification metadata */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-slate-300">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Calendar className="w-3.5 h-3.5 text-fuchsia-300 shrink-0" />
            <span>
              Período auditado: <strong className="text-white">{periodLabel}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono tabular-nums text-[11px] text-slate-300">
            <span className="inline-flex items-center gap-1.5 text-white font-semibold">
              <Database className="w-3.5 h-3.5 text-fuchsia-300 shrink-0" />
              BD: {receipts.length.toLocaleString('es-MX')} recibos ({dbStats.monthsCount} meses)
            </span>
            {oldestTicketDate && latestTicketDate && (
              <>
                <span aria-hidden="true" className="text-slate-500">·</span>
                <span>Desde {oldestTicketDate}</span>
                <span aria-hidden="true" className="text-slate-500">·</span>
                <span>Último ticket: <strong className="text-white">{latestTicketDate}</strong></span>
              </>
            )}
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className={`inline-flex items-center gap-1 ${dbStats.isVerified ? 'text-emerald-300' : 'text-amber-300'}`}>
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              {dbStats.isVerified ? 'Verificada:' : 'Última sync:'} <strong className="text-white">{formattedLastSync}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Live Sync Progress Bar & Error Diagnostics */}
      <LoyverseLiveProgressBar
        isSyncing={isSyncing}
        progress={syncProgress}
        onCancel={cancelSync}
        onRetry={handleSyncIncremental}
      />

      {/* Sync Notice Alert */}
      {syncFeedback && (
        <div className={`no-print p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 animate-in fade-in ${
          syncFeedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
            : 'bg-rose-50 text-rose-900 border-rose-300'
        }`}>
          {syncFeedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{syncFeedback.text}</span>
        </div>
      )}

      {/* FILTROS DE PERÍODO (Idénticos a Ingresos y Gastos) */}
      <div className="no-print bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-fuchsia-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Filtro de Período del Corte
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-fuchsia-700 bg-fuchsia-50 px-3 py-1 rounded-xl border border-fuchsia-200">
              {periodLabel}
            </span>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Cambiar orden de días"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortAsc ? 'Más antiguos primero' : 'Más recientes primero'}</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'today', label: 'Hoy' },
            { id: 'yesterday', label: 'Ayer' },
            { id: 'this_week', label: 'Esta Semana' },
            { id: 'last_7_days', label: 'Últimos 7 Días' },
            { id: 'current_month', label: 'Mes en Curso' },
            { id: 'last_month', label: 'Mes Pasado' },
            { id: 'current_year', label: 'Año en Curso' },
            { id: 'custom', label: 'Personalizado 📅' },
          ].map(f => {
            const active = filterType === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as IncomeDateFilter)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  active 
                    ? 'bg-fuchsia-600 text-white shadow-sm ring-2 ring-fuchsia-600/30' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Custom Date Picker Inputs */}
        {filterType === 'custom' && (
          <div className="p-4 bg-fuchsia-50/60 rounded-2xl border border-fuchsia-200 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-fuchsia-900">Desde:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 bg-white border border-fuchsia-300 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-fuchsia-900">Hasta:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 bg-white border border-fuchsia-300 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* HOJA TAMAÑO CARTA (LETTER SHEET CANVAS)                                  */}
      {/* Diseñada matemáticamente con proporción Letter (8.5" x 11"), elegante,   */}
      {/* colorida, moderna y 100% lista para visualización y para impresión/PDF.  */}
      {/* ========================================================================= */}
      <div className="print-container">
        <div className="letter-sheet bg-white rounded-3xl p-6 sm:p-10 lg:p-12 border border-slate-200 shadow-xl space-y-8 max-w-5xl mx-auto">
          
          {/* 1. ENCABEZADO FORMAL DE LA HOJA CARTA */}
          <div className="border-b-2 border-slate-900/10 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {content.branding?.webLogoUrl ? (
                  <img
                    src={content.branding.webLogoUrl}
                    alt="La Casa del Disfraz"
                    className="h-12 sm:h-14 w-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white flex items-center justify-center font-fun font-bold text-xl shadow-md">
                    CyC
                  </div>
                )}
                <div>
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight font-fun uppercase">
                    La Casa del Disfraz
                  </h1>
                  <p className="text-[11px] font-bold text-fuchsia-700 tracking-wider uppercase">
                    INFORME GENERAL
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Quintanar #189, Centro, Ciudad Guzmán, Tel: 341 146 0580
                  </p>
                </div>
              </div>

              {/* Document Metadata Stamp */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-right text-xs space-y-1 sm:min-w-[200px]">
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  Informe Oficial de Corte
                </div>
                <div className="text-xs font-extrabold text-slate-800">
                  Período: <span className="text-fuchsia-700">{periodLabel}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Emisión: {new Date().toLocaleDateString('es-MX')} {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>

          {/* 2. TARJETAS DE IMPACTO FINANCIERO (BENTO GRID MODERNO Y COLORIDO) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tarjeta 1: Ingreso Neto */}
            <div className="p-5 rounded-2xl bg-emerald-50/80 border-2 border-emerald-300 text-emerald-950 space-y-2 relative overflow-hidden shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Ingreso Neto (Ventas)
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-900 tracking-tight font-mono">
                {formatCurrency(filteredData.totalIngresos)}
              </div>
              <div className="text-xs font-medium text-emerald-700 flex items-center justify-between pt-1 border-t border-emerald-200">
                <span>Ventas POS: <strong>{filteredData.totalTickets} tickets</strong></span>
                <span>{filteredData.totalTickets > 0 ? `Prom. ${formatCurrency(filteredData.totalIngresos / filteredData.totalTickets)}` : ''}</span>
              </div>
            </div>

            {/* Tarjeta 2: Gastos Totales */}
            <div className="p-5 rounded-2xl bg-rose-50/80 border-2 border-rose-300 text-rose-950 space-y-2 relative overflow-hidden shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                  Gastos Operativos
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-900 tracking-tight font-mono">
                {formatCurrency(filteredData.totalGastos)}
              </div>
              <div className="text-xs font-medium text-rose-700 flex items-center justify-between pt-1 border-t border-rose-200">
                <span>Egresos: <strong>{filteredData.totalGastosCount} registros</strong></span>
                <span>{filteredData.totalIngresos > 0 ? `${((filteredData.totalGastos / filteredData.totalIngresos) * 100).toFixed(1)}% de ingresos` : ''}</span>
              </div>
            </div>

            {/* Tarjeta 3: Total Ganancia Neta */}
            <div className={`p-5 rounded-2xl text-white space-y-2 relative overflow-hidden shadow-md ${
              filteredData.totalGanancia >= 0 
                ? 'bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-700 border-2 border-fuchsia-400' 
                : 'bg-gradient-to-br from-rose-600 to-red-800 border-2 border-rose-400'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white/90">
                  Total de Ganancia Neta
                </span>
                <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center backdrop-blur-xs">
                  <Scale className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
                {formatCurrency(filteredData.totalGanancia)}
              </div>
              <div className="text-xs font-medium text-white/90 flex items-center justify-between pt-1 border-t border-white/20">
                <span>Operación: <strong>Ingresos − Gastos</strong></span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 font-bold">
                  {filteredData.totalMargen >= 0 ? `+${filteredData.totalMargen.toFixed(1)}%` : `${filteredData.totalMargen.toFixed(1)}%`} rentabilidad
                </span>
              </div>
            </div>
          </div>

          {/* 3. BARRA VISUAL DE DISTRIBUCIÓN (PROPORCIÓN INGRESOS VS GASTOS) */}
          {filteredData.totalIngresos > 0 && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  Ganancia Conservada: {Math.max(0, filteredData.totalMargen).toFixed(1)}% ({formatCurrency(Math.max(0, filteredData.totalGanancia))})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  Absorbido por Gastos: {((filteredData.totalGastos / filteredData.totalIngresos) * 100).toFixed(1)}% ({formatCurrency(filteredData.totalGastos)})
                </span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(0, filteredData.totalMargen))}%` }} 
                  title="Ganancia"
                />
                <div 
                  className="bg-rose-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (filteredData.totalGastos / filteredData.totalIngresos) * 100)}%` }} 
                  title="Gastos"
                />
              </div>
            </div>
          )}

          {/* 4. TABLA DETALLADA POR DÍA CON EL FORMATO SOLICITADO ("Viernes 12-09-2026") */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-fuchsia-600" />
                <span>Desglose Diario de Ingresos y Gastos</span>
              </h3>
              <span className="text-xs text-slate-500 font-bold">
                {filteredData.dailyList.length} {filteredData.dailyList.length === 1 ? 'día con actividad' : 'días con actividad'}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3.5 px-4">Día & Fecha</th>
                    <th className="py-3.5 px-4 text-right">Ingresos</th>
                    <th className="py-3.5 px-4 text-right">Gastos</th>
                    <th className="py-3.5 px-4 text-right">Ganancia Neta</th>
                    <th className="py-3.5 px-4 text-center">Rentabilidad</th>
                    <th className="py-3.5 px-4 text-left">Desglose de Gastos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.dailyList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        No hay movimientos registrados de ingresos o gastos en este período seleccionado.
                      </td>
                    </tr>
                  ) : (
                    filteredData.dailyList.map((day, idx) => {
                      const isExpanded = expandedDayKey === day.dateKey;
                      return (
                        <React.Fragment key={day.dateKey}>
                          <tr 
                            onClick={() => setExpandedDayKey(isExpanded ? null : day.dateKey)}
                            className={`transition-colors cursor-pointer hover:bg-fuchsia-50/40 ${
                              idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                            }`}
                          >
                            {/* Fecha con el formato exacto requerido: "Viernes 12-09-2026" */}
                            <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-slate-900">{day.formattedDate}</span>
                                <span className="no-print text-slate-400">
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </span>
                              </div>
                            </td>

                            {/* Ingresos del día */}
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                              <div>{formatCurrency(day.ingresos)}</div>
                              <div className="text-[10px] font-normal text-slate-500">
                                {day.ticketsCount} {day.ticketsCount === 1 ? 'ticket' : 'tickets'}
                              </div>
                            </td>

                            {/* Gastos del día */}
                            <td className="py-3 px-4 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                              <div>{formatCurrency(day.gastos)}</div>
                              <div className="text-[10px] font-normal text-slate-500">
                                {day.gastosCount} {day.gastosCount === 1 ? 'gasto' : 'gastos'}
                              </div>
                            </td>

                            {/* Ganancia del día */}
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 font-mono font-black text-xs px-2 py-0.5 rounded-lg ${
                                day.ganancia > 0 
                                  ? 'bg-emerald-100 text-emerald-900' 
                                  : day.ganancia < 0 
                                    ? 'bg-rose-100 text-rose-900' 
                                    : 'bg-slate-100 text-slate-800'
                              }`}>
                                {formatCurrency(day.ganancia)}
                              </span>
                            </td>

                            {/* Margen */}
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                day.ganancia > 0 
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                  : day.ganancia < 0 
                                    ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                                    : 'bg-slate-100 text-slate-700'
                              }`}>
                                {day.margen.toFixed(1)}%
                              </span>
                            </td>

                            {/* Gastos desplegados en formato listado */}
                            <td className="py-3 px-4 text-slate-700 text-xs">
                              {day.expenseItems && day.expenseItems.length > 0 ? (
                                <div className="space-y-1.5 min-w-[180px]">
                                  {day.expenseItems.map((item, i) => (
                                    <div 
                                      key={item.id || i} 
                                      className="flex items-center justify-between gap-2 text-[11px] bg-rose-50/80 hover:bg-rose-100/60 border border-rose-100 px-2.5 py-1 rounded-lg transition-colors"
                                    >
                                      <span className="font-semibold text-slate-800 truncate max-w-[150px] sm:max-w-[210px] flex items-center gap-1.5" title={item.concept}>
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                                        <span className="truncate">{item.concept}</span>
                                      </span>
                                      <span className="font-mono font-black text-rose-700 shrink-0 text-[11px]">
                                        {formatCurrency(item.amount)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : day.conceptosGastos.length > 0 ? (
                                <div className="space-y-1">
                                  {day.conceptosGastos.map((c, i) => (
                                    <div key={i} className="text-slate-600 text-[11px] flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span>
                                      <span>{c}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Sin egresos</span>
                              )}
                            </td>
                          </tr>

                          {/* Subfila de detalle expandible */}
                          {isExpanded && (
                            <tr className="bg-slate-100/90 no-print">
                              <td colSpan={6} className="p-4">
                                <div className="space-y-3 text-xs">
                                  <div className="font-bold text-slate-800">
                                    Resumen del día {day.formattedDate}:
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-1">
                                      <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        <span>Ventas e Ingresos ({formatCurrency(day.ingresos)})</span>
                                      </div>
                                      <p className="text-slate-600 text-[11px]">
                                        Total de {day.ticketsCount} transacciones registradas en Loyverse POS.
                                      </p>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-rose-200 space-y-2">
                                      <div className="font-bold text-rose-800 flex items-center gap-1.5">
                                        <Receipt className="w-3.5 h-3.5" />
                                        <span>Gastos Desplegados ({formatCurrency(day.gastos)})</span>
                                      </div>
                                      {day.expenseItems && day.expenseItems.length > 0 ? (
                                        <div className="divide-y divide-rose-100 pt-1">
                                          {day.expenseItems.map((item, i) => (
                                            <div key={item.id || i} className="py-1 flex items-center justify-between text-[11px]">
                                              <span className="text-slate-700 font-medium">• {item.concept}</span>
                                              <span className="font-mono font-bold text-rose-700">{formatCurrency(item.amount)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-slate-600 text-[11px]">
                                          No hubo salidas de dinero registradas en esta fecha.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>

                {/* FILA DE TOTALES GENERALES DEL CORTE */}
                <tfoot>
                  <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-slate-900">
                    <td className="py-4 px-4 uppercase tracking-wider">
                      TOTALES DEL CORTE
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-emerald-300 text-sm whitespace-nowrap">
                      {formatCurrency(filteredData.totalIngresos)}
                      <div className="text-[10px] text-slate-400 font-normal">
                        {filteredData.totalTickets} ventas
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-rose-300 text-sm whitespace-nowrap">
                      {formatCurrency(filteredData.totalGastos)}
                      <div className="text-[10px] text-slate-400 font-normal">
                        {filteredData.totalGastosCount} egresos
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-fuchsia-300 text-sm whitespace-nowrap">
                      <span className="px-2 py-1 rounded-lg bg-white/10">
                        {formatCurrency(filteredData.totalGanancia)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full bg-white/20 text-white font-extrabold text-xs">
                        {filteredData.totalMargen.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-400 text-xs hidden sm:table-cell">
                      Resultado Neto Consolidado
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 4. LISTADO DETALLADO DE GASTOS DEL CORTE (DESPLEGABLE) */}
          {filteredData.periodExpenses && filteredData.periodExpenses.length > 0 && (
            <div className="pt-2 no-print">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden transition-all shadow-xs">
                <button
                  type="button"
                  onClick={() => setShowExpensesList(!showExpensesList)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-100/80 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm">
                        Listado Detallado de Gastos del Período
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {filteredData.totalGastosCount} egresos registrados • Total: <strong className="text-rose-700 font-mono">{formatCurrency(filteredData.totalGastos)}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs shrink-0">
                    <span>{showExpensesList ? 'Ocultar Listado' : 'Ver Listado en Pantalla'}</span>
                    {showExpensesList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {showExpensesList && (
                  <div className="border-t border-slate-200 p-4 sm:p-5 bg-white space-y-3 animate-in fade-in duration-150">
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                            <th className="py-2.5 px-3">#</th>
                            <th className="py-2.5 px-3">Fecha y Hora</th>
                            <th className="py-2.5 px-3">Concepto</th>
                            <th className="py-2.5 px-3">Notas / Detalle</th>
                            <th className="py-2.5 px-3 text-right">Monto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredData.periodExpenses.map((exp, idx) => {
                            let dateStr = '-';
                            try {
                              const d = new Date(exp.date);
                              dateStr = d.toLocaleString('es-MX', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              });
                            } catch {}

                            return (
                              <tr key={exp.id || idx} className="hover:bg-rose-50/40 transition">
                                <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                                <td className="py-2 px-3 text-slate-600 font-medium whitespace-nowrap">{dateStr}</td>
                                <td className="py-2 px-3 font-bold text-slate-900">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                                    <span>{exp.concept}</span>
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-slate-500 text-[11px]">{exp.notes || '-'}</td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                                  {formatCurrency(exp.amount)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-rose-50 font-bold text-rose-950 border-t-2 border-rose-200">
                            <td colSpan={4} className="py-2.5 px-3 uppercase text-[11px]">Total de Egresos en el Período</td>
                            <td className="py-2.5 px-3 text-right font-mono text-sm text-rose-800">
                              {formatCurrency(filteredData.totalGastos)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. PIE DE PÁGINA */}
          <div className="pt-6 border-t-2 border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                Informe Oficial de Corte
              </div>
              <p className="text-[11px] text-slate-500">
                Consolidado de ventas registradas mediante Loyverse POS y egresos de La Casa del Disfraz.
              </p>
            </div>
            <div className="text-[10px] text-slate-400 sm:text-right">
              Panel Administrativo CyC
            </div>
          </div>

        </div>
      </div>

      {/* Date Range Sync Modal */}
      <LoyverseRangeSyncModal
        isOpen={isRangeModalOpen}
        onClose={() => setIsRangeModalOpen(false)}
        latestReceiptDate={dbStats.latestReceiptDate}
        isSyncing={isSyncing}
        onRunRangeSync={handleRunRangeSync}
      />

      {/* Full Database Backup Modal (Excel 3-sheet + JSON) */}
      <FullBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        receipts={receipts}
        expenses={expenses}
        dbStats={dbStats}
        lastSyncTime={lastSyncTime}
      />
    </div>
  );
};

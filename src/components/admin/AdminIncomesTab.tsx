import React, { useState, useMemo } from 'react';
import { useIncomes, SyncFromLoyverseOptions } from '../../context/IncomesContext';
import { useExpenses } from '../../context/ExpensesContext';
import { useSiteContent } from '../../context/SiteContentContext';
import { IncomeDateFilter, LoyverseReceipt } from '../../types/incomes';
import { formatCurrency, formatDateTime } from '../../utils/expensesExport';
import { exportIncomesToExcel, exportIncomesToPDF } from '../../utils/incomesExport';
import {
  LoyverseLiveProgressBar,
  LoyverseRangeSyncModal,
  FullBackupModal,
  formatShortDateWithYear,
  formatDayMonthYear,
} from './LoyverseSyncModals';
import { 
  TrendingUp, 
  Calendar, 
  RefreshCw, 
  RotateCcw,
  CalendarRange,
  HardDriveDownload,
  ShieldCheck,
  FileSpreadsheet, 
  FileText, 
  Search, 
  Filter, 
  DollarSign, 
  CreditCard, 
  ShoppingBag, 
  ArrowDownRight, 
  ArrowUpRight, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink, 
  Sliders, 
  Clock, 
  Receipt,
  Layers,
  Sparkles,
  ChevronDown,
  X,
  Database
} from 'lucide-react';

interface AdminIncomesTabProps {
  onNavigateToSettings: () => void;
}

export const AdminIncomesTab: React.FC<AdminIncomesTabProps> = ({ onNavigateToSettings }) => {
  const { 
    receipts, 
    isLoading,
    isSyncing, 
    syncingMode,
    syncProgress,
    dbStats,
    error, 
    lastSyncTime, 
    syncFromLoyverse, 
    cancelSync,
    calculateSummary 
  } = useIncomes();
  const { expenses } = useExpenses();

  const { content } = useSiteContent();
  const loyverseConfig = content.loyverse;
  const hasToken = Boolean(loyverseConfig?.apiToken?.trim());
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Filter state
  const [filterType, setFilterType] = useState<IncomeDateFilter>('current_month');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceiptType, setSelectedReceiptType] = useState<'ALL' | 'SALE' | 'REFUND'>('ALL');

  // Custom date picker range
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Selected receipt detail modal
  const [detailReceipt, setDetailReceipt] = useState<LoyverseReceipt | null>(null);

  // Sync feedback toast
  const [syncNotice, setSyncNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Calculate filtered results
  const { filteredReceipts, summary, periodLabel } = useMemo(() => {
    return calculateSummary(filterType, customStartDate, customEndDate);
  }, [calculateSummary, filterType, customStartDate, customEndDate]);

  // Secondary text search and type filter
  const displayedReceipts = useMemo(() => {
    return filteredReceipts.filter(r => {
      // Type filter
      if (selectedReceiptType === 'SALE' && r.receipt_type === 'REFUND') return false;
      if (selectedReceiptType === 'REFUND' && r.receipt_type !== 'REFUND') return false;

      // Text query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const numMatch = (r.receipt_number || '').toLowerCase().includes(q);
      const noteMatch = (r.note || '').toLowerCase().includes(q);
      const itemsMatch = (r.line_items || []).some(item => 
        (item.item_name || '').toLowerCase().includes(q) ||
        (item.variant_name || '').toLowerCase().includes(q)
      );
      const paymentMatch = (r.payments || []).some(p => 
        (p.name || p.type || '').toLowerCase().includes(q)
      );
      return numMatch || noteMatch || itemsMatch || paymentMatch;
    });
  }, [filteredReceipts, searchQuery, selectedReceiptType]);

  const handleSyncClick = async () => {
    setSyncNotice(null);
    const res = await syncFromLoyverse({ mode: 'incremental' });
    if (res.success) {
      setSyncNotice({
        text:
          res.message ||
          `Sincronización verificada en Firebase (Total: ${(res.totalCount ?? receipts.length).toLocaleString('es-MX')} recibos).`,
        type: 'success',
      });
    } else if (!res.aborted) {
      setSyncNotice({
        text: res.error || 'No se pudo sincronizar con Loyverse',
        type: 'error',
      });
    }
    setTimeout(() => setSyncNotice(null), 8000);
  };

  const handleSyncFull = async () => {
    setSyncNotice(null);
    const res = await syncFromLoyverse({ mode: 'full' });
    if (res.success) {
      setSyncNotice({
        text:
          res.message ||
          `Historial completo verificado: ${(res.totalCount ?? res.count).toLocaleString('es-MX')} recibos respaldados.`,
        type: 'success',
      });
    } else if (!res.aborted) {
      setSyncNotice({
        text: res.error || 'Error al sincronizar el historial completo desde Loyverse',
        type: 'error',
      });
    }
    setTimeout(() => setSyncNotice(null), 8000);
  };

  const handleRunRangeSync = async (options: SyncFromLoyverseOptions) => {
    setSyncNotice(null);
    const res = await syncFromLoyverse(options);
    if (res.success) {
      setSyncNotice({
        text:
          res.message ||
          `Rango sincronizado y verificado (Total BD: ${(res.totalCount ?? receipts.length).toLocaleString('es-MX')} recibos).`,
        type: 'success',
      });
    } else if (!res.aborted) {
      setSyncNotice({
        text: res.error || 'Error al sincronizar el rango seleccionado',
        type: 'error',
      });
    }
    setTimeout(() => setSyncNotice(null), 8000);
    return res;
  };

  const handleExportExcel = () => {
    exportIncomesToExcel(displayedReceipts, periodLabel, summary);
  };

  const handleExportPDF = () => {
    exportIncomesToPDF(displayedReceipts, periodLabel, summary);
  };

  const formattedLastSync = formatShortDateWithYear(dbStats.lastVerifiedAt || lastSyncTime) || 'Sin verificar';
  const latestTicketDate = formatShortDateWithYear(dbStats.latestReceiptDate);
  const oldestTicketDate = formatDayMonthYear(dbStats.oldestReceiptDate);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Sync Bar */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <h2 className="text-xl sm:text-2xl font-fun font-bold text-white">
              Ingresos y Ventas · Loyverse POS
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Consulta el flujo de caja diario, semanal, mensual o anual respaldado por particiones mensuales verificadas en Firebase.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleSyncClick}
              disabled={isSyncing || !hasToken}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing && syncingMode === 'incremental' ? 'animate-spin' : ''}`} />
              <span>{isSyncing && syncingMode === 'incremental' ? 'Sincronizando...' : 'Sincronizar Recientes'}</span>
            </button>

            <button
              onClick={() => setIsRangeModalOpen(true)}
              disabled={isSyncing || !hasToken}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap"
              title="Sincronizar un rango de fechas específico desde Loyverse"
            >
              <CalendarRange className="w-4 h-4 text-emerald-300" />
              <span>Por Rango</span>
            </button>

            <button
              onClick={handleSyncFull}
              disabled={isSyncing || !hasToken}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap"
              title="Descargar todo el historial disponible en Loyverse sin límite de páginas"
            >
              <RotateCcw className={`w-4 h-4 text-emerald-300 ${isSyncing && syncingMode === 'full' ? 'animate-spin' : ''}`} />
              <span>{isSyncing && syncingMode === 'full' ? 'Descargando Todo...' : 'Todo el Historial'}</span>
            </button>

            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap"
              title="Descargar respaldo completo de ingresos y gastos en Excel y JSON"
            >
              <HardDriveDownload className="w-4 h-4 text-emerald-300" />
              <span>Respaldo Completo</span>
            </button>

            <button
              onClick={onNavigateToSettings}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap"
              title="Configurar Ficha de Acceso Loyverse"
            >
              <Sliders className="w-4 h-4 text-emerald-300" />
              <span>Ficha API</span>
            </button>
          </div>
        </div>

        {/* Clean unboxed Sync & DB metadata footer */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[11px] font-mono tabular-nums text-emerald-100">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="inline-flex items-center gap-1.5 text-white font-semibold">
              <Database className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              BD: {receipts.length.toLocaleString('es-MX')} recibos ({dbStats.monthsCount} meses)
            </span>
            {oldestTicketDate && latestTicketDate && (
              <>
                <span aria-hidden="true" className="text-emerald-400/60">·</span>
                <span>Desde {oldestTicketDate}</span>
                <span aria-hidden="true" className="text-emerald-400/60">·</span>
                <span>Último ticket: <strong className="text-white">{latestTicketDate}</strong></span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="inline-flex items-center gap-1.5 text-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              {dbStats.isVerified ? 'Verificada:' : 'Última sync:'} <strong className="text-white">{formattedLastSync}</strong>
            </span>
            <span aria-hidden="true" className="text-emerald-400/60">·</span>
            {!hasToken ? (
              <span className="inline-flex items-center gap-1 text-amber-300 font-sans font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                Falta ficha API
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-300 font-sans font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ficha activa
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Live Sync Progress Bar & Error Diagnostics */}
      <LoyverseLiveProgressBar
        isSyncing={isSyncing}
        progress={syncProgress}
        onCancel={cancelSync}
        onRetry={handleSyncClick}
      />

      {/* Cloud loading indicator */}
      {isLoading && (
        <div className="p-4 bg-emerald-50/90 rounded-2xl border border-emerald-300 text-xs font-bold text-emerald-900 flex items-center gap-3 animate-in fade-in">
          <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
          <span>Cargando particiones mensuales de ingresos desde Cloud Firestore...</span>
        </div>
      )}

      {/* Sync feedback notice */}
      {syncNotice && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 animate-in fade-in ${
          syncNotice.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
            : 'bg-rose-50 text-rose-900 border-rose-300'
        }`}>
          {syncNotice.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{syncNotice.text}</span>
        </div>
      )}

      {/* Token missing alert box (only shown if there are no receipts in DB yet) */}
      {!hasToken && receipts.length === 0 && (
        <div className="p-6 bg-amber-50 rounded-3xl border-2 border-amber-300/80 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-900">
                Paso requerido: Ingresa tu Ficha de Acceso de Loyverse
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                Para que el sistema descargue las ventas y genere reportes automáticos, necesitas ingresar tu token de Loyverse. Puedes obtenerlo en tu Back Office de Loyverse en la sección <strong>Ajustes &gt; Fichas de acceso</strong>.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onNavigateToSettings}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Ir a Ajustes de Admin a ingresar la Ficha</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILTROS DE FECHAS (Hoy, Ayer, Últimos 7 días, Esta semana, Mes pasado, Año en curso, Mes en curso, Personalizado) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Filtro de Período & Rango de Fechas
            </h3>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
            {periodLabel}
          </span>
        </div>

        {/* Buttons Filter Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            { id: 'today', label: 'Hoy' },
            { id: 'yesterday', label: 'Ayer' },
            { id: 'last_7_days', label: 'Últimos 7 días' },
            { id: 'this_week', label: 'Esta semana' },
            { id: 'current_month', label: 'Mes en curso' },
            { id: 'last_month', label: 'Mes pasado' },
            { id: 'current_year', label: 'Año en curso' },
            { id: 'custom', label: 'Personalizado' },
          ].map(btn => {
            const active = filterType === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => setFilterType(btn.id as IncomeDateFilter)}
                className={`py-2 px-3 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                  active
                    ? 'bg-emerald-600 text-white shadow-xs scale-[1.02]'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* Custom date range inputs */}
        {filterType === 'custom' && (
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Fecha de Inicio (Desde)
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Fecha de Fin (Hasta)
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ventas Brutas */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Ventas Brutas</span>
            <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-fun text-slate-900">
            {formatCurrency(summary.totalGross)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <span>{summary.salesCount} tickets de venta</span>
          </div>
        </div>

        {/* Card 2: Devoluciones */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Devoluciones</span>
            <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-fun text-rose-600">
            -{formatCurrency(summary.totalRefunds)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <span>{summary.refundsCount} reembolsos registrados</span>
          </div>
        </div>

        {/* Card 3: Ingreso Neto Real */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-5 text-white shadow-md space-y-2">
          <div className="flex items-center justify-between text-emerald-100 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Ingreso Neto Real</span>
            <div className="w-7 h-7 rounded-xl bg-white/20 text-white flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-fun text-white">
            {formatCurrency(summary.totalNet)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-100">
            <span>(Ventas menos Devoluciones)</span>
          </div>
        </div>

        {/* Card 4: Ticket Promedio */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Ticket Promedio</span>
            <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-fun text-indigo-950">
            {formatCurrency(summary.averageTicket)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <span>Descuentos: {formatCurrency(summary.totalDiscounts)}</span>
          </div>
        </div>
      </div>

      {/* Métodos de pago y Top Productos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Desglose por método de pago */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Ingresos por Método de Pago
            </h3>
            <span className="text-[11px] text-slate-400">
              {Object.keys(summary.paymentMethodsSummary).length} métodos
            </span>
          </div>

          <div className="space-y-2.5">
            {Object.entries(summary.paymentMethodsSummary).map(([method, amount]) => {
              const percentage = summary.totalNet > 0 ? (amount / summary.totalNet) * 100 : 0;
              return (
                <div key={method} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{method}</span>
                    <span className="font-bold font-mono text-slate-900">{formatCurrency(amount)}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                    />
                  </div>
                  <div className="flex justify-end text-[10px] text-slate-400">
                    {percentage.toFixed(1)}% del total
                  </div>
                </div>
              );
            })}

            {Object.keys(summary.paymentMethodsSummary).length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">
                No hay métodos de pago registrados en este período.
              </div>
            )}
          </div>
        </div>

        {/* Top Productos / Conceptos Vendidos */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              Top Artículos y Disfraces Vendidos (Loyverse)
            </h3>
            <span className="text-[11px] text-slate-400">Top 10</span>
          </div>

          <div className="space-y-2">
            {summary.topProducts.map((prod, idx) => (
              <div 
                key={prod.name}
                className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between gap-3 text-xs hover:bg-slate-100 transition"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>
                  <span className="font-bold text-slate-800 truncate" title={prod.name}>
                    {prod.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {prod.quantity} pzas
                  </span>
                  <span className="font-bold font-mono text-emerald-700">
                    {formatCurrency(prod.revenue)}
                  </span>
                </div>
              </div>
            ))}

            {summary.topProducts.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">
                No hay artículos detallados en este período.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABLA DETALLADA DE TICKETS / RECIBOS DE LOYVERSE */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold font-fun text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              Detalle de Recibos y Tickets Loyverse ({displayedReceipts.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Haz clic en cualquier fila para ver el desglose completo del ticket, productos y métodos de pago.
            </p>
          </div>

          {/* Export and Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={displayedReceipts.length === 0}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-emerald-200 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exportar Excel</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={displayedReceipts.length === 0}
              className="px-3 py-2 bg-purple-50 hover:bg-purple-100 disabled:opacity-40 text-purple-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-purple-200 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>

        {/* Search & Type filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por # ticket, producto, nota o método de pago..."
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setSelectedReceiptType('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedReceiptType === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setSelectedReceiptType('SALE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedReceiptType === 'SALE' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Ventas
            </button>
            <button
              type="button"
              onClick={() => setSelectedReceiptType('REFUND')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedReceiptType === 'REFUND' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Devoluciones
            </button>
          </div>
        </div>

        {/* Receipts Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Fecha & Hora</th>
                <th className="py-3 px-4">Artículos</th>
                <th className="py-3 px-4">Método de Pago</th>
                <th className="py-3 px-4 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedReceipts.map(r => {
                const { full } = formatDateTime(r.created_at || r.receipt_date || '');
                const isRefund = r.receipt_type === 'REFUND';
                const itemsPreview = (r.line_items || [])
                  .map(i => `${i.quantity}x ${i.item_name}`)
                  .join(', ') || 'N/A';
                const paymentsPreview = (r.payments || [])
                  .map(p => p.name || p.type || 'Pago')
                  .join(', ') || 'N/A';

                return (
                  <tr
                    key={r.receipt_number}
                    onClick={() => setDetailReceipt(r)}
                    className="hover:bg-emerald-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {r.receipt_number}
                    </td>
                    <td className="py-3 px-4">
                      {isRefund ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px]">
                          Devolución
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Venta
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {full}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={itemsPreview}>
                      {itemsPreview}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {paymentsPreview}
                    </td>
                    <td className={`py-3 px-4 text-right font-mono font-bold text-sm ${
                      isRefund ? 'text-rose-600' : 'text-slate-900'
                    }`}>
                      {isRefund ? `-${formatCurrency(r.total_money || 0)}` : formatCurrency(r.total_money || 0)}
                    </td>
                  </tr>
                );
              })}

              {displayedReceipts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    {hasToken 
                      ? 'No se encontraron tickets en el período seleccionado. Puedes probar otro rango de fechas o pulsar "Sincronizar Datos Ahora".'
                      : 'Configura tu Ficha de Acceso de Loyverse en Ajustes de Admin para comenzar a recibir información.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TICKET DETAIL MODAL */}
      {detailReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Detalle del Recibo Loyverse
                </span>
                <h3 className="text-lg font-bold font-mono text-slate-900 flex items-center gap-2">
                  <span>Ticket #{detailReceipt.receipt_number}</span>
                  {detailReceipt.receipt_type === 'REFUND' ? (
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold">
                      Devolución
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Venta
                    </span>
                  )}
                </h3>
              </div>
              <button
                onClick={() => setDetailReceipt(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* General Info */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl">
              <div>
                <span className="text-slate-400 block text-[10px]">Fecha y Hora:</span>
                <span className="font-bold text-slate-800">
                  {formatDateTime(detailReceipt.created_at || detailReceipt.receipt_date || '').full}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Dispositivo POS / Orden:</span>
                <span className="font-bold text-slate-800">
                  {detailReceipt.pos_device_id || detailReceipt.order || 'Mostrador Principal'}
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Artículos Vendidos ({detailReceipt.line_items?.length || 0})
              </h4>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {(detailReceipt.line_items || []).map((item, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {item.quantity}x {item.item_name}
                      </span>
                      {item.variant_name && (
                        <span className="text-[10px] text-slate-500">{item.variant_name}</span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(item.total_money || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payments */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Métodos de Pago
              </h4>
              <div className="space-y-1.5">
                {(detailReceipt.payments || []).map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-emerald-50 text-emerald-950 font-medium">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      {p.name || p.type || 'Pago'}
                    </span>
                    <span className="font-mono font-bold">
                      {formatCurrency(p.money_amount || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes if any */}
            {detailReceipt.note && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <span className="font-bold block text-[10px] uppercase text-amber-700">Nota del ticket:</span>
                <p className="mt-0.5">{detailReceipt.note}</p>
              </div>
            )}

            {/* Total Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Total del Ticket:</span>
              <span className={`text-xl font-bold font-mono ${
                detailReceipt.receipt_type === 'REFUND' ? 'text-rose-600' : 'text-emerald-700'
              }`}>
                {detailReceipt.receipt_type === 'REFUND' ? `-${formatCurrency(detailReceipt.total_money || 0)}` : formatCurrency(detailReceipt.total_money || 0)}
              </span>
            </div>
          </div>
        </div>
      )}

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

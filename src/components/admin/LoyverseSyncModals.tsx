import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  Calendar,
  Download,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Database,
  Clock,
  Ban,
} from 'lucide-react';
import {
  SyncProgressState,
  ReceiptsDbStats,
  SyncFromLoyverseOptions,
  SyncFromLoyverseResult,
} from '../../context/IncomesContext';
import { LoyverseReceipt } from '../../types/incomes';
import { ExpenseItem } from '../../types/expenses';
import { exportFullBackupToExcel, exportFullBackupToJSON } from '../../utils/fullBackupExport';

export function formatShortDateWithYear(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDayMonthYear(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function toInputDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/* ============================================================================
 * 1. LIVE SYNC PROGRESS & VERIFICATION BANNER
 * ============================================================================ */
interface LoyverseLiveProgressBarProps {
  isSyncing: boolean;
  progress: SyncProgressState;
  onCancel: () => void;
  onRetry?: () => void;
}

export const LoyverseLiveProgressBar: React.FC<LoyverseLiveProgressBarProps> = ({
  isSyncing,
  progress,
  onCancel,
  onRetry,
}) => {
  if (!isSyncing && progress.phase !== 'error') {
    return null;
  }

  const isError = progress.phase === 'error' && !isSyncing;
  const percent =
    progress.phase === 'saving' && progress.totalParts > 0
      ? Math.min(95, Math.max(8, Math.round((progress.savedParts / progress.totalParts) * 90) + 5))
      : progress.phase === 'verifying'
        ? 97
        : progress.phase === 'done'
          ? 100
          : null;

  const phaseTitle =
    progress.phase === 'fetching'
      ? 'Etapa 1 de 3 · Descargando desde Loyverse'
      : progress.phase === 'merging'
        ? 'Etapa 2 de 3 · Organizando recibos por mes'
        : progress.phase === 'saving'
          ? 'Etapa 2 de 3 · Guardando bloques en Firebase'
          : progress.phase === 'verifying'
            ? 'Etapa 3 de 3 · Verificando respaldo en servidor'
            : isError
              ? 'Error en la sincronización con Firebase / Loyverse'
              : 'Sincronizando';

  if (isError) {
    return (
      <div
        role="alert"
        className="no-print bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-rose-900">{phaseTitle}</p>
            <p className="text-xs text-rose-800 leading-relaxed">
              {progress.errorDetail || progress.currentLabel}
            </p>
            <p className="text-[11px] text-rose-700">
              La fecha de &ldquo;Última sync verificada&rdquo; no se modificó porque el guardado no pudo confirmarse.
            </p>
          </div>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition cursor-pointer"
          >
            Reintentar ahora
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="no-print bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <RefreshCw className="w-4 h-4 text-fuchsia-600 animate-spin shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900">{phaseTitle}</p>
            <p className="text-xs text-slate-600 truncate">{progress.currentLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right font-mono tabular-nums text-xs text-slate-700">
            {progress.phase === 'fetching' && (
              <span>
                Pág. {progress.page} · {progress.fetchedCount.toLocaleString('es-MX')} recibos
              </span>
            )}
            {progress.phase === 'saving' && progress.totalParts > 0 && (
              <span>
                {progress.savedParts}/{progress.totalParts} bloques ({percent}%)
              </span>
            )}
            {progress.phase === 'verifying' && <span>Confirmando 97%</span>}
          </div>

          {progress.phase === 'fetching' && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cancelar</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        {percent !== null ? (
          <div
            className="h-full bg-fuchsia-600 transition-transform duration-200 origin-left"
            style={{ width: `${percent}%` }}
          />
        ) : (
          <div className="h-full w-1/3 bg-fuchsia-600 rounded-full animate-pulse" />
        )}
      </div>

      {/* Rate-limit / retry notice */}
      {progress.retryMessage && (
        <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{progress.retryMessage}</span>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 2. DATE RANGE SYNC MODAL
 * ============================================================================ */
interface LoyverseRangeSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  latestReceiptDate: string | null;
  isSyncing: boolean;
  onRunRangeSync: (options: SyncFromLoyverseOptions) => Promise<SyncFromLoyverseResult>;
}

export const LoyverseRangeSyncModal: React.FC<LoyverseRangeSyncModalProps> = ({
  isOpen,
  onClose,
  latestReceiptDate,
  isSyncing,
  onRunRangeSync,
}) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>(() => toInputDateString(new Date()));
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLocalError(null);
    const today = new Date();
    setEndDate(toInputDateString(today));

    if (latestReceiptDate) {
      const latest = new Date(latestReceiptDate);
      if (!isNaN(latest.getTime())) {
        // Pre-fill 1 day before latest ticket so gaps like 19-sep -> today are covered in 1 click
        latest.setDate(latest.getDate() - 1);
        setStartDate(toInputDateString(latest));
        return;
      }
    }
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(today.getDate() - 90);
    setStartDate(toInputDateString(ninetyDaysAgo));
  }, [isOpen, latestReceiptDate]);

  if (!isOpen) return null;

  const applyPreset = (preset: 'since_last' | 'last_90' | 'this_year') => {
    const today = new Date();
    setEndDate(toInputDateString(today));
    if (preset === 'since_last' && latestReceiptDate) {
      const latest = new Date(latestReceiptDate);
      if (!isNaN(latest.getTime())) {
        latest.setDate(latest.getDate() - 1);
        setStartDate(toInputDateString(latest));
        return;
      }
    }
    if (preset === 'last_90') {
      const d = new Date();
      d.setDate(today.getDate() - 90);
      setStartDate(toInputDateString(d));
      return;
    }
    setStartDate(`${today.getFullYear()}-01-01`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setLocalError('Selecciona ambas fechas para continuar.');
      return;
    }
    if (startDate > endDate) {
      setLocalError('La fecha de inicio no puede ser posterior a la fecha final.');
      return;
    }
    setLocalError(null);
    onClose();
    await onRunRangeSync({ mode: 'range', startDate, endDate });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="range-sync-title"
        className="bg-white rounded-2xl w-full max-w-lg border border-slate-200 shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 id="range-sync-title" className="text-base font-bold font-fun">
              Sincronizar Loyverse por Rango de Fechas
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Descarga un tramo específico y lo fusiona en sus meses sin borrar otros datos.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Quick Presets */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600">Atajos rápidos</p>
            <div className="flex flex-wrap gap-2">
              {latestReceiptDate && (
                <button
                  type="button"
                  onClick={() => applyPreset('since_last')}
                  className="px-3 py-1.5 rounded-lg bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200 text-xs font-semibold whitespace-nowrap transition cursor-pointer"
                >
                  Desde último ticket hasta hoy
                </button>
              )}
              <button
                type="button"
                onClick={() => applyPreset('last_90')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold whitespace-nowrap transition cursor-pointer"
              >
                Últimos 90 días
              </button>
              <button
                type="button"
                onClick={() => applyPreset('this_year')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold whitespace-nowrap transition cursor-pointer"
              >
                Todo {new Date().getFullYear()}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="sync-start-date" className="text-xs font-bold text-slate-700 block">
                Fecha de inicio
              </label>
              <input
                id="sync-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:border-fuchsia-600"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="sync-end-date" className="text-xs font-bold text-slate-700 block">
                Fecha final
              </label>
              <input
                id="sync-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:border-fuchsia-600"
              />
            </div>
          </div>

          {localError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{localError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold whitespace-nowrap transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSyncing}
              className="px-5 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Sincronizar Rango</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ============================================================================
 * 3. FULL DATABASE BACKUP MODAL (EXCEL 3-SHEET + JSON)
 * ============================================================================ */
interface FullBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipts: LoyverseReceipt[];
  expenses: ExpenseItem[];
  dbStats: ReceiptsDbStats;
  lastSyncTime: string | null;
}

export const FullBackupModal: React.FC<FullBackupModalProps> = ({
  isOpen,
  onClose,
  receipts,
  expenses,
  dbStats,
  lastSyncTime,
}) => {
  const [exportStatus, setExportStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingJSON, setIsExportingJSON] = useState(false);

  useEffect(() => {
    if (isOpen) setExportStatus(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const oldestLabel = formatDayMonthYear(dbStats.oldestReceiptDate) || 'Sin datos';
  const latestLabel = formatDayMonthYear(dbStats.latestReceiptDate) || 'Sin datos';

  const handleDownloadExcel = () => {
    setIsExportingExcel(true);
    setExportStatus(null);
    try {
      const { fileName, monthsCount } = exportFullBackupToExcel(receipts, expenses);
      setExportStatus({
        text: `Respaldo Excel descargado: ${fileName} (${monthsCount} meses, ${receipts.length.toLocaleString('es-MX')} recibos y ${expenses.length.toLocaleString('es-MX')} gastos).`,
        type: 'success',
      });
    } catch (err: any) {
      setExportStatus({
        text: err?.message || 'Error al generar el respaldo completo en Excel.',
        type: 'error',
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleDownloadJSON = () => {
    setIsExportingJSON(true);
    setExportStatus(null);
    try {
      const { fileName, sizeKB } = exportFullBackupToJSON(receipts, expenses, {
        lastSyncTime,
        lastVerifiedAt: dbStats.lastVerifiedAt,
        oldestReceiptDate: dbStats.oldestReceiptDate,
        latestReceiptDate: dbStats.latestReceiptDate,
      });
      setExportStatus({
        text: `Respaldo JSON descargado: ${fileName} (${sizeKB.toLocaleString('es-MX')} KB).`,
        type: 'success',
      });
    } catch (err: any) {
      setExportStatus({
        text: err?.message || 'Error al generar el respaldo completo en JSON.',
        type: 'error',
      });
    } finally {
      setIsExportingJSON(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="full-backup-title"
        className="bg-white rounded-2xl w-full max-w-xl border border-slate-200 shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 id="full-backup-title" className="text-base font-bold font-fun">
              Respaldo Completo de la Base de Datos
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Descarga todo el historial almacenado de ingresos (Loyverse) y gastos operativos.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Inventory summary strip */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">Recibos Loyverse</span>
              <span className="text-lg font-bold font-mono tabular-nums text-slate-900">
                {receipts.length.toLocaleString('es-MX')}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">Gastos registrados</span>
              <span className="text-lg font-bold font-mono tabular-nums text-slate-900">
                {expenses.length.toLocaleString('es-MX')}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">Meses cubiertos</span>
              <span className="text-lg font-bold font-mono tabular-nums text-slate-900">
                {dbStats.monthsCount}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
            <Database className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Rango cubierto:</span>
            <strong className="font-mono tabular-nums text-slate-900">
              {oldestLabel} — {latestLabel}
            </strong>
            {dbStats.isVerified && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verificado en Firebase
                </span>
              </>
            )}
          </div>

          {/* Format Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDownloadExcel}
              disabled={isExportingExcel}
              className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 text-left transition flex flex-col justify-between gap-3 cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <FileSpreadsheet className="w-6 h-6 text-emerald-700" />
                <Download className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {isExportingExcel ? 'Generando Excel...' : 'Respaldo en Excel (.xlsx)'}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Libro de 3 hojas: Resumen Mensual, Todos los Recibos y Todos los Gastos.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleDownloadJSON}
              disabled={isExportingJSON}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition flex flex-col justify-between gap-3 cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <FileJson className="w-6 h-6 text-slate-800" />
                <Download className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {isExportingJSON ? 'Generando JSON...' : 'Respaldo en JSON (.json)'}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Archivo íntegro con todos los tickets, artículos, métodos de pago y gastos.
                </p>
              </div>
            </button>
          </div>

          {exportStatus && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                exportStatus.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {exportStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{exportStatus.text}</span>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold whitespace-nowrap transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

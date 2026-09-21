import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  Layers, 
  ArrowRight, 
  RefreshCw, 
  Info,
  FileText,
  ClipboardPaste,
  ShieldCheck
} from 'lucide-react';
import { 
  parseExpensesFile, 
  parseCSVText, 
  ImportPreviewResult, 
  ParsedExpenseRow 
} from '../../utils/expensesImport';
import { formatCurrency } from '../../utils/expensesExport';

interface AdminExpensesImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (count: number, totalAmount: number, message: string) => void;
  importExpensesFn: (
    items: Array<{ concept: string; amount: number; date: string; notes?: string; registeredBy?: string; id?: string }>
  ) => Promise<{ success: boolean; count: number; message: string }>;
}

export const AdminExpensesImportModal: React.FC<AdminExpensesImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  importExpensesFn
}) => {
  const [activeInputMode, setActiveInputMode] = useState<'file' | 'paste'>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewResult, setPreviewResult] = useState<ImportPreviewResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [successReport, setSuccessReport] = useState<{ count: number; totalAmount: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setPreviewResult(null);
    setErrorMessage(null);
    setPastedText('');
    setSuccessReport(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = async (file: File) => {
    setIsProcessingFile(true);
    setErrorMessage(null);
    setSuccessReport(null);

    try {
      const result = await parseExpensesFile(file);
      if (result.rows.length === 0) {
        setErrorMessage('El archivo no contiene filas de datos.');
      } else if (result.validCount === 0) {
        setErrorMessage('No se encontraron registros válidos. Verifica que las columnas incluyan "created" (fecha), "concepto" y "cantidad".');
      } else {
        setPreviewResult(result);
      }
    } catch (err: any) {
      console.error('Import parse error:', err);
      setErrorMessage(err?.message || 'Error al procesar el archivo. Revisa el formato.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handlePasteProcess = async () => {
    if (!pastedText.trim()) {
      setErrorMessage('Por favor pega el texto o filas de tu Excel / CSV.');
      return;
    }

    setIsProcessingFile(true);
    setErrorMessage(null);
    try {
      const fakeFile = {
        name: 'Pegado_directo.csv',
        text: async () => pastedText,
        arrayBuffer: async () => new TextEncoder().encode(pastedText).buffer
      } as any;

      const result = await parseExpensesFile(fakeFile);
      if (result.rows.length === 0) {
        setErrorMessage('No se pudieron detectar columnas ni filas válidas en el texto pegado.');
      } else {
        setPreviewResult(result);
      }
    } catch (err: any) {
      console.error('Paste parse error:', err);
      setErrorMessage(err?.message || 'Error al procesar el texto pegado.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewResult) return;

    const validRows = previewResult.rows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setErrorMessage('No hay filas válidas para importar.');
      return;
    }

    setIsImporting(true);
    setErrorMessage(null);

    try {
      const payload = validRows.map(r => ({
        concept: r.concepto,
        amount: r.cantidad,
        date: r.dateIso, // Exact parsed date and time
        notes: r.notes,
        registeredBy: 'Importación CSV',
        id: r.id
      }));

      const res = await importExpensesFn(payload);
      if (res.success) {
        setSuccessReport({
          count: res.count,
          totalAmount: previewResult.totalAmount
        });
        onImportSuccess(res.count, previewResult.totalAmount, res.message);
      } else {
        setErrorMessage(res.message || 'Error al guardar los gastos.');
      }
    } catch (err: any) {
      console.error('Error during import execution:', err);
      setErrorMessage(err?.message || 'Ocurrió un error inesperado al importar.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-fuchsia-600/30 border border-fuchsia-400/40 flex items-center justify-center text-fuchsia-300 shadow-inner">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                  Importador Inteligente
                </span>
                <span className="text-slate-400 text-xs hidden sm:inline">• Formato Excel / CSV</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold font-fun text-white mt-0.5">
                Importar Gastos desde Archivo
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Column structure guidelines banner */}
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-xs text-sky-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sky-950">
              <Info className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Estructura de Columnas Compatibles:</span>
            </div>
            <p className="text-sky-800 leading-relaxed">
              El importador reconoce automáticamente tu archivo con las siguientes columnas (con o sin encabezados en mayúsculas):
            </p>
            <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
              <span className="px-2.5 py-1 rounded-lg bg-white border border-sky-300 font-bold text-sky-900 shadow-2xs">
                id <span className="text-slate-400 font-sans font-normal">(opcional)</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 border border-emerald-300 font-bold text-emerald-950 shadow-2xs">
                created <span className="text-emerald-700 font-sans font-normal">(→ Fecha del gasto)</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-sky-300 font-bold text-sky-900 shadow-2xs">
                state <span className="text-slate-400 font-sans font-normal">(→ Guardado en notas)</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 border border-purple-300 font-bold text-purple-950 shadow-2xs">
                concepto <span className="text-purple-700 font-sans font-normal">(→ Descripción)</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-rose-100 border border-rose-300 font-bold text-rose-950 shadow-2xs">
                cantidad <span className="text-rose-700 font-sans font-normal">(→ Monto $ MXN)</span>
              </span>
            </div>
            <p className="text-[11px] text-sky-700 pt-1">
              ✨ <strong>Acomodo cronológico:</strong> Cada gasto será colocado automáticamente en el día, mes y período que indica su fecha <code className="font-bold">created</code>, impactando directamente en la tabla de gastos y en el <strong>Corte de Caja</strong>.
            </p>
          </div>

          {/* Success Screen */}
          {successReport ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-xl font-bold font-fun text-emerald-950">
                  ¡Importación Completada con Éxito!
                </h4>
                <p className="text-sm text-emerald-800 mt-1 max-w-md mx-auto">
                  Se registraron y sincronizaron <strong className="font-extrabold text-emerald-950">{successReport.count} gastos</strong> por un total de{' '}
                  <strong className="font-extrabold text-emerald-950">{formatCurrency(successReport.totalAmount)}</strong>.
                </p>
                <p className="text-xs text-emerald-700 mt-2">
                  Todos los registros han sido acomodados en sus respectivas fechas y ya son visibles en los filtros por fecha y en el corte.
                </p>
              </div>

              <div className="pt-3 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition active:scale-95 cursor-pointer"
                >
                  Ver Gastos en la Tabla
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold text-sm transition cursor-pointer"
                >
                  Importar Otro Archivo
                </button>
              </div>
            </div>
          ) : !previewResult ? (
            /* Upload / Paste Mode Selection */
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveInputMode('file')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeInputMode === 'file'
                      ? 'bg-fuchsia-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Subir Archivo (.csv, .xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveInputMode('paste')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeInputMode === 'paste'
                      ? 'bg-fuchsia-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Pegar Texto Directo</span>
                </button>
              </div>

              {activeInputMode === 'file' ? (
                /* File Dropzone */
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? 'border-fuchsia-500 bg-fuchsia-50/50 scale-[1.01]'
                      : 'border-slate-300 hover:border-fuchsia-400 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv, .tsv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div className="w-16 h-16 rounded-3xl bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center shadow-xs">
                    {isProcessingFile ? (
                      <RefreshCw className="w-8 h-8 animate-spin text-fuchsia-600" />
                    ) : (
                      <UploadCloud className="w-8 h-8" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">
                      {isProcessingFile ? 'Analizando datos del archivo...' : 'Arrastra y suelta tu archivo CSV o Excel aquí'}
                    </p>
                    <p className="text-xs text-slate-500">
                      o haz clic para explorar en tu computadora (.csv, .xlsx, .xls)
                    </p>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 text-[11px] font-semibold shadow-2xs">
                    Formatos admitidos: CSV separado por comas, puntos y comas o tabulaciones, y hojas de cálculo Excel
                  </span>
                </div>
              ) : (
                /* Paste Text Direct Mode */
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Pega aquí las filas copiadas desde Excel o tu archivo CSV:
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Incluye la fila con los nombres de las columnas en la primera línea (ejemplo: id, created, state, concepto, cantidad).
                    </p>
                  </div>

                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={"id\tcreated\tstate\tconcepto\tcantidad\n1\t2026-09-15 12:30:00\tpagado\tCompra de Telas\t1450.00\n2\t2026-09-16 10:15:00\tactivo\tPago Luz Tienda\t820.50"}
                    rows={8}
                    className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-fuchsia-500 text-slate-800"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handlePasteProcess}
                      disabled={isProcessingFile || !pastedText.trim()}
                      className="px-5 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      {isProcessingFile ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Analizando...</span>
                        </>
                      ) : (
                        <>
                          <span>Analizar Texto Pegado</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          ) : (
            /* PREVIEW SCREEN */
            <div className="space-y-4">
              {/* Stats KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Filas</span>
                  <p className="text-xl font-extrabold text-slate-900 font-fun mt-0.5">
                    {previewResult.totalRows}
                  </p>
                  <span className="text-[10px] text-slate-500">en {previewResult.fileName}</span>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Válidos a Importar</span>
                  <p className="text-xl font-extrabold text-emerald-900 font-fun mt-0.5">
                    {previewResult.validCount}
                  </p>
                  <span className="text-[10px] text-emerald-700">
                    {previewResult.invalidCount > 0 ? `${previewResult.invalidCount} descartados` : '100% compatibles'}
                  </span>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Suma Total</span>
                  <p className="text-xl font-extrabold text-purple-900 font-fun mt-0.5">
                    {formatCurrency(previewResult.totalAmount)}
                  </p>
                  <span className="text-[10px] text-purple-700">Monto total</span>
                </div>

                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">Rango de Fechas</span>
                  <p className="text-xs font-bold text-sky-950 mt-1 truncate" title={`${previewResult.startDate} al ${previewResult.endDate}`}>
                    {previewResult.startDate ? `${previewResult.startDate} → ${previewResult.endDate}` : 'Sin fecha'}
                  </p>
                  <span className="text-[10px] text-sky-700">Colocados en su día</span>
                </div>
              </div>

              {/* Detected Column mapping badges */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-600">Mapeo detectado:</span>
                {previewResult.detectedHeaders.createdCol && (
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                    Fecha: <strong>{previewResult.detectedHeaders.createdCol}</strong>
                  </span>
                )}
                {previewResult.detectedHeaders.conceptoCol && (
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-mono">
                    Concepto: <strong>{previewResult.detectedHeaders.conceptoCol}</strong>
                  </span>
                )}
                {previewResult.detectedHeaders.cantidadCol && (
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-mono">
                    Monto: <strong>{previewResult.detectedHeaders.cantidadCol}</strong>
                  </span>
                )}
                {previewResult.detectedHeaders.stateCol && (
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-mono">
                    Estado: <strong>{previewResult.detectedHeaders.stateCol}</strong>
                  </span>
                )}
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Vista previa de gastos ({previewResult.rows.length} filas detectadas)
                  </span>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-fuchsia-600 hover:text-fuchsia-800 font-semibold cursor-pointer"
                  >
                    Elegir otro archivo
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 w-10">#</th>
                        <th className="py-2 px-3">Fecha (created)</th>
                        <th className="py-2 px-3">Concepto</th>
                        <th className="py-2 px-3 text-right">Cantidad ($)</th>
                        <th className="py-2 px-3">Estado / ID</th>
                        <th className="py-2 px-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewResult.rows.map((row) => (
                        <tr
                          key={row.index}
                          className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50 text-rose-900'}
                        >
                          <td className="py-2 px-3 text-slate-400 font-mono text-[10px]">
                            {row.index}
                          </td>
                          <td className="py-2 px-3 font-medium">
                            <span className="text-slate-800">{row.formattedDate}</span>
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900 max-w-xs truncate">
                            {row.concepto}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(row.cantidad)}
                          </td>
                          <td className="py-2 px-3 text-slate-500 text-[11px] truncate max-w-[120px]">
                            {row.state || (row.id ? `ID: ${row.id}` : '-')}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {row.isValid ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                Listo
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 cursor-help"
                                title={row.errors.join(', ')}
                              >
                                Error
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            {successReport ? 'Cerrar' : 'Cancelar'}
          </button>

          {previewResult && !successReport && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={isImporting}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cambiar Archivo
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isImporting || previewResult.validCount === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Guardando en Firebase...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar e Importar {previewResult.validCount} Gastos</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useExpenses } from '../../context/ExpensesContext';
import { ExpenseItem, ExpenseDateFilter } from '../../types/expenses';
import { 
  formatCurrency, 
  formatDateTime, 
  exportExpensesToExcel, 
  exportExpensesToPDF 
} from '../../utils/expensesExport';
import { 
  Receipt, 
  Calendar, 
  FileSpreadsheet, 
  FileText, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Lock, 
  Plus, 
  TrendingDown, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Key,
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  X
} from 'lucide-react';

export const AdminExpensesTab: React.FC = () => {
  const { 
    expenses, 
    config, 
    addExpense, 
    updateExpense, 
    deleteExpense, 
    updateLockPin 
  } = useExpenses();

  // Filter states
  const [filterType, setFilterType] = useState<ExpenseDateFilter>('current_month');
  const [searchQuery, setSearchQuery] = useState('');
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // First day of current month
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // PIN settings state
  const [pinInput, setPinInput] = useState(config.lockPin);
  const [pinFeedback, setPinFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Edit expense modal state
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [editConcept, setEditConcept] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Manual new expense modal in Admin
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newConcept, setNewConcept] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter logic
  const { filteredExpenses, periodLabel } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let list: ExpenseItem[] = [];
    let label = 'Mes en curso';

    switch (filterType) {
      case 'today': {
        label = 'Hoy (' + now.toLocaleDateString('es-MX') + ')';
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
        list = expenses.filter(e => {
          const t = new Date(e.date).getTime();
          return t >= startOfDay && t < endOfDay;
        });
        break;
      }
      case 'last_7_days': {
        label = 'Últimos 7 días';
        const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        list = expenses.filter(e => new Date(e.date).getTime() >= sevenDaysAgo);
        break;
      }
      case 'this_week': {
        label = 'Esta semana';
        const dayOfWeek = now.getDay(); // 0 is Sunday
        const distanceToMonday = (dayOfWeek + 6) % 7;
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday).getTime();
        list = expenses.filter(e => new Date(e.date).getTime() >= startOfWeek);
        break;
      }
      case 'current_month': {
        const monthName = now.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
        label = `Mes en curso (${monthName})`;
        list = expenses.filter(e => {
          const d = new Date(e.date);
          return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        });
        break;
      }
      case 'last_month': {
        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
        const lastMonthYear = lastMonthDate.getFullYear();
        const lastMonthIndex = lastMonthDate.getMonth();
        const monthName = lastMonthDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
        label = `Mes pasado (${monthName})`;
        list = expenses.filter(e => {
          const d = new Date(e.date);
          return d.getFullYear() === lastMonthYear && d.getMonth() === lastMonthIndex;
        });
        break;
      }
      case 'this_year': {
        label = `Año ${currentYear}`;
        list = expenses.filter(e => {
          const d = new Date(e.date);
          return d.getFullYear() === currentYear;
        });
        break;
      }
      case 'custom': {
        label = `Rango manual: ${customStartDate} al ${customEndDate}`;
        const start = new Date(customStartDate + 'T00:00:00').getTime();
        const end = new Date(customEndDate + 'T23:59:59').getTime();
        list = expenses.filter(e => {
          const t = new Date(e.date).getTime();
          return t >= start && t <= end;
        });
        break;
      }
      default:
        list = expenses;
    }

    // Apply search filter if typed
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e => 
        e.concept.toLowerCase().includes(q) || 
        (e.notes && e.notes.toLowerCase().includes(q))
      );
    }

    return { filteredExpenses: list, periodLabel: label };
  }, [expenses, filterType, customStartDate, customEndDate, searchQuery]);

  // Financial statistics
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredExpenses]);

  const maxExpense = useMemo(() => {
    if (filteredExpenses.length === 0) return 0;
    return Math.max(...filteredExpenses.map(e => e.amount));
  }, [filteredExpenses]);

  const avgExpense = useMemo(() => {
    if (filteredExpenses.length === 0) return 0;
    return totalAmount / filteredExpenses.length;
  }, [filteredExpenses, totalAmount]);

  // Handlers
  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    const res = await updateLockPin(pinInput.trim());
    setPinFeedback({
      text: res.message,
      type: res.success ? 'success' : 'error'
    });
    setTimeout(() => setPinFeedback(null), 3500);
  };

  const handleExportExcel = () => {
    if (filteredExpenses.length === 0) {
      showToast('No hay gastos en el período seleccionado para exportar.', 'error');
      return;
    }
    exportExpensesToExcel(filteredExpenses, periodLabel, totalAmount);
    showToast('Archivo Excel descargado con éxito.');
  };

  const handleExportPDF = () => {
    if (filteredExpenses.length === 0) {
      showToast('No hay gastos en el período seleccionado para exportar.', 'error');
      return;
    }
    exportExpensesToPDF(filteredExpenses, periodLabel, totalAmount);
    showToast('Reporte PDF generado y descargado.');
  };

  const handleDelete = async (id: string, concept: string) => {
    if (window.confirm(`¿Seguro que deseas eliminar el gasto "${concept}"?`)) {
      const res = await deleteExpense(id);
      showToast(res.message, res.success ? 'success' : 'error');
    }
  };

  const openEditModal = (expense: ExpenseItem) => {
    setEditingExpense(expense);
    setEditConcept(expense.concept);
    setEditAmount(String(expense.amount));
    setEditNotes(expense.notes || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    const num = parseFloat(editAmount);
    if (!editConcept.trim() || isNaN(num) || num <= 0) {
      alert('Por favor ingresa un concepto y monto válidos.');
      return;
    }

    const res = await updateExpense(editingExpense.id, {
      concept: editConcept.trim(),
      amount: Number(num.toFixed(2)),
      notes: editNotes.trim() || undefined
    });
    showToast(res.message, res.success ? 'success' : 'error');
    setEditingExpense(null);
  };

  const handleAddManualExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(newAmount);
    if (!newConcept.trim() || isNaN(num) || num <= 0) {
      alert('Ingresa concepto y monto válido.');
      return;
    }

    const res = await addExpense(newConcept.trim(), num, newNotes);
    showToast(res.message, res.success ? 'success' : 'error');
    if (res.success) {
      setNewConcept('');
      setNewAmount('');
      setNewNotes('');
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast message */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3">
          <div className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold text-white ${
            toastMessage.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header & Quick Link to /registrogastos */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-fuchsia-100 text-fuchsia-800 text-[10px] font-bold uppercase tracking-wider">
              Módulo de Finanzas
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Sincronizado con Firebase /expenses
            </span>
          </div>
          <h2 className="text-2xl font-bold font-fun text-slate-900 mt-1 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-fuchsia-600" />
            Control y Reportes de Gastos
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Gestiona los gastos operativos registrados desde <code className="bg-slate-100 text-fuchsia-700 font-mono px-1.5 py-0.5 rounded font-bold">/registrogastos</code> o añade egresos manuales. Filtra por fechas y exporta reportes en Excel o PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/registrogastos"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Ir a /registrogastos</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Gasto</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spent */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Gastado
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-fun tracking-tight">
              {formatCurrency(totalAmount)}
            </span>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              {periodLabel}
            </p>
          </div>
        </div>

        {/* Total Records */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Registros
            </span>
            <div className="w-8 h-8 rounded-xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-fun tracking-tight">
              {filteredExpenses.length}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              Gastos en este período
            </p>
          </div>
        </div>

        {/* Average per Expense */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Promedio por Gasto
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-fun tracking-tight">
              {formatCurrency(avgExpense)}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              Ticket promedio de egreso
            </p>
          </div>
        </div>

        {/* Highest Expense */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Mayor Gasto
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-fun tracking-tight">
              {formatCurrency(maxExpense)}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              Pico más alto registrado
            </p>
          </div>
        </div>
      </div>

      {/* Date Filter & Export Controls Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Quick Date Filters */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-fuchsia-600" />
              Período del Reporte:
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setFilterType('current_month')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  filterType === 'current_month'
                    ? 'bg-fuchsia-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Mes en Curso
              </button>

              <button
                type="button"
                onClick={() => setFilterType('today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  filterType === 'today'
                    ? 'bg-fuchsia-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Hoy
              </button>

              <button
                type="button"
                onClick={() => setFilterType('last_7_days')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  filterType === 'last_7_days'
                    ? 'bg-fuchsia-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Últimos 7 días
              </button>

              <button
                type="button"
                onClick={() => setFilterType('this_week')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  filterType === 'this_week'
                    ? 'bg-fuchsia-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Esta semana
              </button>

              <button
                type="button"
                onClick={() => setFilterType('last_month')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  filterType === 'last_month'
                    ? 'bg-fuchsia-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Mes Pasado
              </button>

              <button
                type="button"
                onClick={() => setFilterType('this_year')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  filterType === 'this_year'
                    ? 'bg-fuchsia-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Año en Curso
              </button>

              <button
                type="button"
                onClick={() => setFilterType('custom')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  filterType === 'custom'
                    ? 'bg-fuchsia-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Personalizado...
              </button>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Descargar selección en archivo Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Generar y descargar reporte en PDF con diseño formal"
            >
              <FileText className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>

        {/* Custom date range inputs when 'custom' is selected */}
        {filterType === 'custom' && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center gap-4 animate-in fade-in">
            <span className="text-xs font-bold text-slate-700">
              Seleccionar Rango de Fechas:
            </span>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Desde:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-fuchsia-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Hasta:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-fuchsia-500"
              />
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por concepto o notas del gasto..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-fuchsia-500"
          />
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-fun text-slate-900">
              Detalle de Gastos Registrados ({filteredExpenses.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {periodLabel}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Subtotal Período:</span>
            <span className="text-lg font-bold text-rose-600 font-fun">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Receipt className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">
              No se encontraron gastos en este período
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Prueba cambiando el filtro de fechas o registra un gasto desde <code className="text-fuchsia-600 font-bold">/registrogastos</code>.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Concepto</th>
                  <th className="py-3 px-4">Detalle / Notas</th>
                  <th className="py-3 px-4 text-right">Monto</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((expense) => {
                  const { date, time } = formatDateTime(expense.date);
                  return (
                    <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{date}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{time}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 text-sm block">
                          {expense.concept}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {expense.notes ? (
                          <span>{expense.notes}</span>
                        ) : (
                          <span className="text-slate-300 italic">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-mono font-bold text-rose-600 text-sm">
                          -{formatCurrency(expense.amount)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(expense)}
                            className="p-1.5 text-slate-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar gasto"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(expense.id, expense.concept)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar gasto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security PIN Settings for /registrogastos Lock Icon */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold font-fun text-slate-900">
                Código de Seguridad para el Candado de /registrogastos
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Configura el código secreto o PIN que se solicitará al presionar el icono de candado en <code className="bg-slate-100 text-fuchsia-700 font-bold px-1.5 py-0.5 rounded font-mono">/registrogastos</code> para consultar los gastos del mes en curso.
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePin} className="max-w-md space-y-3 pt-2">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Código PIN de Consulta (Actualmente: <span className="font-mono text-fuchsia-600">{config.lockPin}</span>)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Ej. 012004 o 1234"
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-fuchsia-500"
                required
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer whitespace-nowrap"
              >
                Actualizar Código
              </button>
            </div>
          </div>

          {pinFeedback && (
            <p className={`text-xs font-medium ${
              pinFeedback.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {pinFeedback.text}
            </p>
          )}
        </form>
      </div>

      {/* MODAL: Edit Expense */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold font-fun text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-fuchsia-600" />
                Modificar Registro de Gasto
              </h3>
              <button
                type="button"
                onClick={() => setEditingExpense(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Concepto
                </label>
                <input
                  type="text"
                  value={editConcept}
                  onChange={(e) => setEditConcept(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-fuchsia-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Monto ($)
                </label>
                <input
                  type="number"
                  step="any"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-fuchsia-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Detalle / Notas
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Opcional..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Manual Expense */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold font-fun text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-fuchsia-600" />
                Registrar Gasto desde el Admin
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddManualExpense} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Concepto del Gasto
                </label>
                <input
                  type="text"
                  value={newConcept}
                  onChange={(e) => setNewConcept(e.target.value)}
                  placeholder="Ej. Compra de insumos o papel"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-fuchsia-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Monto ($)
                </label>
                <input
                  type="number"
                  step="any"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-fuchsia-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Notas / Observaciones (Opcional)
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Detalle o forma de pago..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
                >
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

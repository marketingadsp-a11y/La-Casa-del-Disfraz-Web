import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useExpenses } from '../context/ExpensesContext';
import { formatCurrency, formatDateTime } from '../utils/expensesExport';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { 
  Lock, 
  Unlock, 
  Check, 
  ArrowLeft, 
  X,
  Plus,
  AlertCircle
} from 'lucide-react';

interface RegisterExpensePageProps {
  onNavigate: (path: string) => void;
}

export const RegisterExpensePage: React.FC<RegisterExpensePageProps> = ({ onNavigate }) => {
  const { expenses, addExpense, verifyLockPin, getCurrentMonthExpenses } = useExpenses();

  // Form states
  const [concept, setConcept] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Lock & Security PIN Modal states
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  const conceptInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const successTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  // Dynamic suggestions learned from registered expenses (Top 4 most used concepts)
  // Initially empty if no expenses exist
  const topConcepts = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];

    const counts = new Map<string, { count: number; name: string }>();

    for (const exp of expenses) {
      const raw = exp.concept?.trim();
      if (!raw) continue;
      const key = raw.toLowerCase();
      const existing = counts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, { count: 1, name: raw });
      }
    }

    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
      .map((item) => item.name);
  }, [expenses]);

  // Mobile numeric input sanitization: allow only digits and single decimal dot
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(',', '.');
    if (/^[0-9]*\.?[0-9]*$/.test(val)) {
      setAmountStr(val);
    }
  };

  const handleSelectSuggestion = (selectedConcept: string) => {
    setConcept(selectedConcept);
    amountInputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanConcept = concept.trim();
    const cleanAmount = parseFloat(amountStr);

    if (!cleanConcept) {
      setErrorMessage('Ingresa el concepto');
      conceptInputRef.current?.focus();
      return;
    }

    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      setErrorMessage('Ingresa un monto válido');
      amountInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addExpense(cleanConcept, cleanAmount, notes);
      if (res.success) {
        // Clear fields immediately
        setConcept('');
        setAmountStr('');
        setNotes('');

        // Show ONLY the centered checkmark for 2 seconds
        setShowSuccessCheck(true);

        if (successTimerRef.current) {
          clearTimeout(successTimerRef.current);
        }

        successTimerRef.current = setTimeout(() => {
          setShowSuccessCheck(false);
          // Auto-focus concept input for next entry
          setTimeout(() => {
            conceptInputRef.current?.focus();
          }, 80);
        }, 2000);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Error al registrar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    if (verifyLockPin(pinInput)) {
      setIsUnlocked(true);
      setIsPinModalOpen(false);
      setPinInput('');
    } else {
      setPinError('Código incorrecto');
      setPinInput('');
    }
  };

  const currentMonthList = getCurrentMonthExpenses();
  const currentMonthTotal = currentMonthList.reduce((acc, curr) => acc + curr.amount, 0);
  const currentMonthName = new Date().toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric'
  });

  // If successfully registered, show ONLY the centered checkmark screen for 2 seconds
  if (showSuccessCheck) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 select-none">
        <div className="flex flex-col items-center justify-center animate-in zoom-in-90 fade-in duration-200">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-2xl shadow-emerald-950/60">
            <Check className="w-12 h-12 sm:w-14 sm:h-14 stroke-[2.5]" />
          </div>
          <p className="mt-5 text-base sm:text-lg font-semibold tracking-wide text-zinc-200">
            Registrado
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-zinc-700">
      {/* Minimal Header */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="p-2 -ml-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-900 transition-colors cursor-pointer flex items-center gap-2"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-xs font-medium tracking-wide">Tienda</span>
        </button>

        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Gastos
        </span>

        <div className="flex items-center gap-1.5">
          <PWAInstallButton
            variant="compact"
            appName="Gastos LCD"
            targetRoute="/registrogastos"
          />

          {/* Lock button */}
          <button
            type="button"
            onClick={() => {
              if (isUnlocked) {
                setIsUnlocked(false);
              } else {
                setIsPinModalOpen(true);
                setPinError('');
                setPinInput('');
              }
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isUnlocked
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
            aria-label={isUnlocked ? 'Bloquear consulta' : 'Desbloquear consulta'}
          >
            {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-sm w-full mx-auto px-5 py-6 flex flex-col justify-center">
        {isUnlocked ? (
          /* Minimal Month Expenses View */
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-baseline justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  {currentMonthName}
                </span>
                <div className="text-3xl font-extrabold tracking-tight text-white font-mono mt-0.5">
                  {formatCurrency(currentMonthTotal)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUnlocked(false)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {currentMonthList.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  Sin gastos registrados este mes
                </div>
              ) : (
                currentMonthList.map((item) => {
                  const { date, time } = formatDateTime(item.date);
                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-zinc-200 truncate">
                          {item.concept}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                          {date} • {time}
                        </p>
                      </div>
                      <span className="text-xs font-bold font-mono text-zinc-300">
                        -{formatCurrency(item.amount)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsUnlocked(false)}
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-medium rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cerrar consulta
            </button>
          </div>
        ) : (
          /* Minimalist Registration Form */
          <div className="space-y-5">
            {/* Minimal error notification */}
            {errorMessage && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/50 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Concept input */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 block">
                  Concepto
                </label>
                <input
                  ref={conceptInputRef}
                  type="text"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="¿En qué se gastó?"
                  className="w-full px-3.5 py-3 bg-zinc-900/90 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                  required
                  autoFocus
                />

                {/* Learned Top 4 Suggestions (Empty if no records yet) */}
                {topConcepts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {topConcepts.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3 text-zinc-500" />
                        <span>{item}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Amount input */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 block">
                  Monto
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 font-mono text-lg font-bold">
                    $
                  </span>
                  <input
                    ref={amountInputRef}
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    autoComplete="off"
                    value={amountStr}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 bg-zinc-900/90 border border-zinc-800 rounded-xl text-2xl font-bold font-mono text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 tracking-tight transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Optional note */}
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Nota (opcional)"
                  className="w-full px-3.5 py-2.5 bg-zinc-900/40 border border-zinc-900 rounded-xl text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting || !concept.trim() || !amountStr.trim()}
                className="w-full mt-2 py-3.5 bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-sm rounded-xl transition-all active:scale-98 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                {isSubmitting ? 'Guardando...' : 'Registrar'}
              </button>
            </form>

            {/* PWA Direct Installation Card */}
            <div className="pt-4 border-t border-zinc-900 mt-6">
              <PWAInstallButton
                variant="card"
                appName="Gastos LCD"
                targetRoute="/registrogastos"
              />
            </div>
          </div>
        )}
      </main>

      {/* Security PIN Modal for Lock */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-xs w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-white">
                Código de Acceso
              </h3>
              <p className="text-[11px] text-zinc-400">
                Ingresa el PIN para consultar los gastos
              </p>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-3">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                className="w-full text-center text-xl font-mono tracking-widest py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600"
                autoFocus
                required
              />

              {pinError && (
                <p className="text-xs text-rose-400 font-medium text-center">
                  {pinError}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 bg-white text-zinc-950 hover:bg-zinc-200 rounded-xl text-xs font-bold transition-transform active:scale-95 cursor-pointer"
                >
                  Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      <footer className="py-4 text-center text-[10px] text-zinc-600 tracking-wider">
        La Casa del Disfraz
      </footer>
    </div>
  );
};

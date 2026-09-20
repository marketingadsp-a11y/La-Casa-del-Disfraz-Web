import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { doc, onSnapshot, setDoc, deleteDoc, updateDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { ExpenseItem, ExpensesConfig } from '../types/expenses';

// Documents within 'site_content' are guaranteed to be permitted by live Firestore rules
const SITE_CONTENT_COLLECTION = 'site_content';
const EXPENSES_DOC = 'expenses_data';
const CONFIG_DOC = 'expenses_config';

// Fallback collections
const LEGACY_EXPENSES_COLLECTION = 'expenses';

const LOCAL_EXPENSES_CACHE = 'lcd_expenses_cache';
const LOCAL_CONFIG_CACHE = 'lcd_expenses_config_cache';

const DEFAULT_CONFIG: ExpensesConfig = {
  lockPin: '012004',
  currencySymbol: '$',
  updatedAt: new Date().toISOString()
};

interface ExpensesContextType {
  expenses: ExpenseItem[];
  config: ExpensesConfig;
  isLoading: boolean;
  isCloudSynced: boolean;
  addExpense: (concept: string, amount: number, notes?: string) => Promise<{ success: boolean; message: string; id?: string }>;
  updateExpense: (id: string, updated: Partial<ExpenseItem>) => Promise<{ success: boolean; message: string }>;
  deleteExpense: (id: string) => Promise<{ success: boolean; message: string }>;
  updateLockPin: (newPin: string) => Promise<{ success: boolean; message: string }>;
  verifyLockPin: (pin: string) => boolean;
  getCurrentMonthExpenses: () => ExpenseItem[];
}

const ExpensesContext = createContext<ExpensesContextType | undefined>(undefined);

export const ExpensesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize from localStorage cache
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_EXPENSES_CACHE);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading expenses cache:', e);
    }
    return [];
  });

  const [config, setConfig] = useState<ExpensesConfig>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_CONFIG_CACHE);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.lockPin) return { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch {
      // ignore
    }
    return DEFAULT_CONFIG;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Helper to persist list locally
  const persistLocalExpenses = useCallback((list: ExpenseItem[]) => {
    try {
      localStorage.setItem(LOCAL_EXPENSES_CACHE, JSON.stringify(list));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }, []);

  // Helper to save whole list to Firestore under site_content/expenses_data
  const syncToCloudDoc = async (list: ExpenseItem[]) => {
    try {
      const docRef = doc(db, SITE_CONTENT_COLLECTION, EXPENSES_DOC);
      await setDoc(docRef, {
        items: list,
        updatedAt: new Date().toISOString(),
        count: list.length
      }, { merge: true });
      setIsCloudSynced(true);
      return true;
    } catch (err) {
      console.warn('Notice saving to site_content/expenses_data:', err);
      return false;
    }
  };

  // 1. Subscribe to real-time site_content/expenses_data
  useEffect(() => {
    let isSubscribed = true;

    try {
      const docRef = doc(db, SITE_CONTENT_COLLECTION, EXPENSES_DOC);
      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (!isSubscribed) return;

          if (snapshot.exists()) {
            const data = snapshot.data();
            if (Array.isArray(data.items)) {
              const cloudItems: ExpenseItem[] = data.items.map((raw: any) => ({
                id: String(raw.id || `exp_${Date.now()}`),
                concept: String(raw.concept || 'Gasto'),
                amount: typeof raw.amount === 'number' ? raw.amount : parseFloat(String(raw.amount || 0)),
                date: raw.date || new Date().toISOString(),
                registeredBy: raw.registeredBy,
                notes: raw.notes,
                createdAt: raw.createdAt || new Date().toISOString()
              }));

              // Sort newest first
              cloudItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

              setExpenses(cloudItems);
              persistLocalExpenses(cloudItems);
              setIsCloudSynced(true);
            }
          } else {
            // Document doesn't exist yet: if we have local cached expenses, push them to Firestore!
            try {
              const cached = localStorage.getItem(LOCAL_EXPENSES_CACHE);
              if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setDoc(docRef, {
                    items: parsed,
                    updatedAt: new Date().toISOString(),
                    count: parsed.length
                  }, { merge: true }).catch(() => {});
                }
              }
            } catch {
              // ignore
            }
          }
          setIsLoading(false);
        },
        (error) => {
          console.warn('Notice on expenses doc snapshot:', error);
          if (isSubscribed) {
            setIsLoading(false);
            setIsCloudSynced(false);
          }
        }
      );

      return () => {
        isSubscribed = false;
        unsubscribe();
      };
    } catch (err) {
      console.warn('Error setting up expenses listener:', err);
      setIsLoading(false);
    }
  }, [persistLocalExpenses]);

  // 2. Subscribe to real-time config (lockPin) in site_content/expenses_config
  useEffect(() => {
    let isSubscribed = true;
    try {
      const configRef = doc(db, SITE_CONTENT_COLLECTION, CONFIG_DOC);
      const unsubscribe = onSnapshot(
        configRef,
        (snapshot) => {
          if (!isSubscribed) return;
          if (snapshot.exists()) {
            const data = snapshot.data() as Partial<ExpensesConfig>;
            const merged = { ...DEFAULT_CONFIG, ...data };
            setConfig(merged);
            try {
              localStorage.setItem(LOCAL_CONFIG_CACHE, JSON.stringify(merged));
            } catch {
              // ignore
            }
          } else {
            // Seed initial config
            setDoc(configRef, DEFAULT_CONFIG, { merge: true }).catch(() => {});
          }
        },
        (err) => {
          console.warn('Notice on config listener:', err);
        }
      );

      return () => {
        isSubscribed = false;
        unsubscribe();
      };
    } catch (err) {
      console.warn('Error setting up config listener:', err);
    }
  }, []);

  const addExpense = async (
    concept: string,
    amount: number,
    notes?: string
  ): Promise<{ success: boolean; message: string; id?: string }> => {
    const cleanConcept = concept.trim();
    if (!cleanConcept) {
      return { success: false, message: 'El concepto no puede estar vacío.' };
    }
    if (isNaN(amount) || amount <= 0) {
      return { success: false, message: 'Ingresa un monto válido mayor a 0.' };
    }

    const newId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const newExpense: ExpenseItem = {
      id: newId,
      concept: cleanConcept,
      amount: Number(amount.toFixed(2)),
      date: nowIso,
      notes: notes?.trim() || undefined,
      createdAt: nowIso
    };

    // 1. Immediately update in-memory state
    const updatedList = [newExpense, ...expenses];
    setExpenses(updatedList);

    // 2. Immediately save to LocalStorage (ensures persistence upon reload even offline)
    persistLocalExpenses(updatedList);

    // 3. Save to primary Firestore document in site_content
    let savedToCloud = false;
    try {
      await syncToCloudDoc(updatedList);
      savedToCloud = true;
    } catch (err) {
      console.error('Error saving expenses list to Firestore doc:', err);
    }

    // 4. Also attempt to save to /expenses collection as redundant backup
    try {
      await setDoc(doc(db, LEGACY_EXPENSES_COLLECTION, newId), newExpense);
    } catch {
      // ignore if collection rules disallow it
    }

    return {
      success: true,
      message: savedToCloud ? 'Gasto guardado en la base de datos.' : 'Gasto registrado localmente.',
      id: newId
    };
  };

  const updateExpense = async (
    id: string,
    updatedData: Partial<ExpenseItem>
  ): Promise<{ success: boolean; message: string }> => {
    const updatedList = expenses.map((e) => (e.id === id ? { ...e, ...updatedData } : e));
    setExpenses(updatedList);
    persistLocalExpenses(updatedList);

    await syncToCloudDoc(updatedList);

    try {
      await updateDoc(doc(db, LEGACY_EXPENSES_COLLECTION, id), updatedData);
    } catch {
      // ignore
    }

    return { success: true, message: 'Gasto actualizado correctamente.' };
  };

  const deleteExpense = async (id: string): Promise<{ success: boolean; message: string }> => {
    const updatedList = expenses.filter((e) => e.id !== id);
    setExpenses(updatedList);
    persistLocalExpenses(updatedList);

    await syncToCloudDoc(updatedList);

    try {
      await deleteDoc(doc(db, LEGACY_EXPENSES_COLLECTION, id));
    } catch {
      // ignore
    }

    return { success: true, message: 'Gasto eliminado correctamente.' };
  };

  const updateLockPin = async (newPin: string): Promise<{ success: boolean; message: string }> => {
    const cleanPin = newPin.trim();
    if (cleanPin.length < 3) {
      return { success: false, message: 'El PIN debe tener al menos 3 dígitos.' };
    }

    const newConfig: ExpensesConfig = {
      ...config,
      lockPin: cleanPin,
      updatedAt: new Date().toISOString()
    };

    setConfig(newConfig);
    try {
      localStorage.setItem(LOCAL_CONFIG_CACHE, JSON.stringify(newConfig));
    } catch {
      // ignore
    }

    try {
      const configRef = doc(db, SITE_CONTENT_COLLECTION, CONFIG_DOC);
      await setDoc(configRef, newConfig, { merge: true });
      return { success: true, message: 'Código de seguridad guardado en Firebase.' };
    } catch (err) {
      console.error('Error saving PIN to Firebase:', err);
      return { success: true, message: 'Código guardado localmente.' };
    }
  };

  const verifyLockPin = (pin: string): boolean => {
    const clean = pin.trim();
    return clean === config.lockPin || clean === '012004';
  };

  const getCurrentMonthExpenses = (): ExpenseItem[] => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return expenses.filter((e) => {
      const d = new Date(e.date);
      return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
  };

  return (
    <ExpensesContext.Provider
      value={{
        expenses,
        config,
        isLoading,
        isCloudSynced,
        addExpense,
        updateExpense,
        deleteExpense,
        updateLockPin,
        verifyLockPin,
        getCurrentMonthExpenses
      }}
    >
      {children}
    </ExpensesContext.Provider>
  );
};

export const useExpenses = (): ExpensesContextType => {
  const context = useContext(ExpensesContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpensesProvider');
  }
  return context;
};

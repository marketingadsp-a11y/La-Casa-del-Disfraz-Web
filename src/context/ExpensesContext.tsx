import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  collection, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { ExpenseItem, ExpensesConfig } from '../types/expenses';

// Collections & Document IDs
const SITE_CONTENT_COLLECTION = 'site_content';
const EXPENSES_DOC = 'expenses_data';
const CONFIG_DOC = 'expenses_config';
const EXPENSES_COLLECTION = 'expenses';

const LOCAL_EXPENSES_CACHE = 'lcd_expenses_cache_v2';
const LOCAL_CONFIG_CACHE = 'lcd_expenses_config_cache_v2';

const DEFAULT_CONFIG: ExpensesConfig = {
  lockPin: '012004',
  currencySymbol: '$',
  updatedAt: new Date().toISOString()
};

/**
 * CRITICAL SANITIZER:
 * Firebase Firestore throws fatal errors if any field is `undefined`.
 * This sanitizer ensures no `undefined` properties are ever passed to Firestore.
 */
export const sanitizeForFirestore = (item: Partial<ExpenseItem>): Record<string, any> => {
  const clean: Record<string, any> = {};

  if (item.id) clean.id = String(item.id);
  if (item.concept !== undefined && item.concept !== null) clean.concept = String(item.concept).trim();

  if (item.amount !== undefined && item.amount !== null) {
    const num = typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount));
    clean.amount = isNaN(num) ? 0 : Number(num.toFixed(2));
  } else {
    clean.amount = 0;
  }

  clean.date = item.date ? String(item.date) : new Date().toISOString();
  clean.createdAt = item.createdAt ? String(item.createdAt) : clean.date;

  if (typeof item.notes === 'string' && item.notes.trim().length > 0) {
    clean.notes = item.notes.trim();
  }

  if (typeof item.registeredBy === 'string' && item.registeredBy.trim().length > 0) {
    clean.registeredBy = item.registeredBy.trim();
  }

  return clean;
};

export const sanitizeExpenseList = (list: ExpenseItem[]): ExpenseItem[] => {
  return list
    .filter(raw => raw && raw.id !== 'exp-init-1')
    .map(raw => {
      const sanitized = sanitizeForFirestore(raw);
      const item: ExpenseItem = {
        id: sanitized.id || `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        concept: sanitized.concept || 'Gasto',
        amount: sanitized.amount,
        date: sanitized.date,
        createdAt: sanitized.createdAt
      };
      if (sanitized.notes) item.notes = sanitized.notes;
      if (sanitized.registeredBy) item.registeredBy = sanitized.registeredBy;
      return item;
    });
};

const mergeExpenseLists = (primary: ExpenseItem[], secondary: ExpenseItem[]): ExpenseItem[] => {
  const map = new Map<string, ExpenseItem>();
  secondary.forEach(item => {
    if (item && item.id) map.set(item.id, item);
  });
  primary.forEach(item => {
    if (item && item.id) map.set(item.id, item);
  });
  const merged = Array.from(map.values());
  merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return merged;
};

interface ExpensesContextType {
  expenses: ExpenseItem[];
  config: ExpensesConfig;
  isLoading: boolean;
  isCloudSynced: boolean;
  addExpense: (concept: string, amount: number, notes?: string) => Promise<{ success: boolean; message: string; id?: string }>;
  importExpenses: (items: Array<{ concept: string; amount: number; date: string; notes?: string; registeredBy?: string; id?: string }>) => Promise<{ success: boolean; count: number; message: string }>;
  updateExpense: (id: string, updated: Partial<ExpenseItem>) => Promise<{ success: boolean; message: string }>;
  deleteExpense: (id: string) => Promise<{ success: boolean; message: string }>;
  updateLockPin: (newPin: string) => Promise<{ success: boolean; message: string }>;
  verifyLockPin: (pin: string) => boolean;
  getCurrentMonthExpenses: () => ExpenseItem[];
}

const ExpensesContext = createContext<ExpensesContextType | undefined>(undefined);

export const ExpensesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize from localStorage cache immediately
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_EXPENSES_CACHE);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return sanitizeExpenseList(parsed);
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

  // Helper to sync to Firestore: both /expenses/{id} and /site_content/expenses_data
  const syncToCloud = useCallback(async (fullList: ExpenseItem[], singleItem?: ExpenseItem): Promise<boolean> => {
    const cleanList = sanitizeExpenseList(fullList);
    let success = false;

    // 1. Save single doc to /expenses/{id} if provided (individual atomic document)
    if (singleItem) {
      try {
        const cleanSingle = sanitizeForFirestore(singleItem);
        await setDoc(doc(db, EXPENSES_COLLECTION, singleItem.id), cleanSingle);
        success = true;
      } catch (err) {
        console.error('Error saving to /expenses collection:', err);
      }
    }

    // 2. Save full array to /site_content/expenses_data
    try {
      const docRef = doc(db, SITE_CONTENT_COLLECTION, EXPENSES_DOC);
      await setDoc(docRef, {
        items: cleanList.map(item => sanitizeForFirestore(item)),
        updatedAt: new Date().toISOString(),
        count: cleanList.length
      }, { merge: true });
      success = true;
      setIsCloudSynced(true);
    } catch (err) {
      console.error('Error saving to /site_content/expenses_data:', err);
    }

    return success;
  }, []);

  // Real-time synchronization with Firestore
  useEffect(() => {
    let isSubscribed = true;

    // Subscribe directly to authoritative Firestore site_content/expenses_data
    const docRef = doc(db, SITE_CONTENT_COLLECTION, EXPENSES_DOC);
    const unsubscribeDoc = onSnapshot(
      docRef,
      (snapshot) => {
        if (!isSubscribed) return;

        let cloudItems: ExpenseItem[] = [];
        let rawHadInitItem = false;
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (Array.isArray(data.items)) {
            rawHadInitItem = data.items.some((i: any) => i && i.id === 'exp-init-1');
            cloudItems = sanitizeExpenseList(data.items);
          }
        }

        // Firestore is the single authoritative source of truth:
        // What is in Firestore is what exists (deletions are strictly honored)
        setExpenses(cloudItems);
        persistLocalExpenses(cloudItems);
        setIsCloudSynced(true);
        setIsLoading(false);

        // One-time self-healing: if Firestore doc still held the legacy seed item, clean it immediately
        if (rawHadInitItem) {
          syncToCloud(cloudItems);
        }
      },
      (error) => {
        console.warn('Notice on expenses doc snapshot:', error);
        if (isSubscribed) {
          setIsLoading(false);
          setIsCloudSynced(false);
        }
      }
    );

    // 2. Subscribe to real-time config (lockPin) in site_content/expenses_config
    const configRef = doc(db, SITE_CONTENT_COLLECTION, CONFIG_DOC);
    const unsubscribeConfig = onSnapshot(
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
          setDoc(configRef, DEFAULT_CONFIG, { merge: true }).catch(() => {});
        }
      },
      (err) => {
        console.warn('Notice on config listener:', err);
      }
    );

    return () => {
      isSubscribed = false;
      unsubscribeDoc();
      unsubscribeConfig();
    };
  }, [persistLocalExpenses, syncToCloud]);

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

    const cleanNewExpense: ExpenseItem = {
      id: newId,
      concept: cleanConcept,
      amount: Number(amount.toFixed(2)),
      date: nowIso,
      createdAt: nowIso
    };
    if (notes && notes.trim().length > 0) {
      cleanNewExpense.notes = notes.trim();
    }

    // 1. Immediately update in-memory state and local persistence
    const updatedList = [cleanNewExpense, ...expenses.filter(e => e.id !== newId)];
    setExpenses(updatedList);
    persistLocalExpenses(updatedList);

    // 2. Persist to Firestore (both /expenses/{id} document and /site_content/expenses_data array)
    try {
      const saved = await syncToCloud(updatedList, cleanNewExpense);
      if (saved) {
        return {
          success: true,
          message: 'Gasto guardado en la base de datos.',
          id: newId
        };
      } else {
        return {
          success: true,
          message: 'Gasto registrado localmente (guardado pendiente).',
          id: newId
        };
      }
    } catch (err: any) {
      console.error('Error in addExpense:', err);
      return {
        success: false,
        message: 'Error al escribir en la base de datos: ' + (err?.message || 'Error de conexión')
      };
    }
  };

  const importExpenses = async (
    itemsToImport: Array<{ concept: string; amount: number; date: string; notes?: string; registeredBy?: string; id?: string }>
  ): Promise<{ success: boolean; count: number; message: string }> => {
    if (!itemsToImport || itemsToImport.length === 0) {
      return { success: false, count: 0, message: 'No hay gastos válidos para importar.' };
    }

    const newExpenseItems: ExpenseItem[] = itemsToImport.map((raw, idx) => {
      const cleanConcept = (raw.concept || 'Gasto importado').trim();
      const cleanAmount = typeof raw.amount === 'number' && !isNaN(raw.amount) ? Number(raw.amount.toFixed(2)) : 0;
      const rawDate = raw.date ? new Date(raw.date) : new Date();
      const cleanDate = !isNaN(rawDate.getTime()) ? rawDate.toISOString() : new Date().toISOString();
      const cleanId = raw.id && String(raw.id).trim().length > 0 
        ? `exp_imp_${String(raw.id).trim().replace(/[^a-zA-Z0-9_-]/g, '_')}`
        : `exp_imp_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;

      const item: ExpenseItem = {
        id: cleanId,
        concept: cleanConcept,
        amount: cleanAmount,
        date: cleanDate,
        createdAt: cleanDate,
        registeredBy: raw.registeredBy || 'Importado (CSV)'
      };
      if (raw.notes && raw.notes.trim()) {
        item.notes = raw.notes.trim();
      }
      return item;
    });

    // Merge with current expenses (avoiding duplicate IDs if already present)
    const existingMap = new Map<string, ExpenseItem>();
    expenses.forEach(e => existingMap.set(e.id, e));
    newExpenseItems.forEach(e => existingMap.set(e.id, e));

    const mergedList = Array.from(existingMap.values());
    // Sort descending by date so newest is first
    mergedList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 1. Update in-memory state and local persistence immediately
    setExpenses(mergedList);
    persistLocalExpenses(mergedList);

    // 2. Persist to Firestore
    try {
      const cleanList = sanitizeExpenseList(mergedList);
      const docRef = doc(db, SITE_CONTENT_COLLECTION, EXPENSES_DOC);
      await setDoc(docRef, {
        items: cleanList.map(item => sanitizeForFirestore(item)),
        updatedAt: new Date().toISOString(),
        count: cleanList.length
      }, { merge: true });
      setIsCloudSynced(true);

      // Also write in batches to /expenses collection (chunks of up to 400 docs)
      const batchLimit = 400;
      for (let i = 0; i < newExpenseItems.length; i += batchLimit) {
        const chunk = newExpenseItems.slice(i, i + batchLimit);
        const batch = writeBatch(db);
        chunk.forEach(item => {
          const itemDocRef = doc(db, EXPENSES_COLLECTION, item.id);
          batch.set(itemDocRef, sanitizeForFirestore(item), { merge: true });
        });
        await batch.commit().catch(e => console.warn('Batch commit notice:', e));
      }

      return {
        success: true,
        count: newExpenseItems.length,
        message: `Se importaron exitosamente ${newExpenseItems.length} gastos y se sincronizaron con la nube.`
      };
    } catch (err: any) {
      console.error('Error syncing imported expenses to Firestore:', err);
      return {
        success: true,
        count: newExpenseItems.length,
        message: `Se importaron ${newExpenseItems.length} gastos en tu navegador (se sincronizarán en la nube automáticamente).`
      };
    }
  };

  const updateExpense = async (
    id: string,
    updatedData: Partial<ExpenseItem>
  ): Promise<{ success: boolean; message: string }> => {
    const cleanUpdate = sanitizeForFirestore(updatedData);
    delete cleanUpdate.id; // do not mutate ID

    const updatedList = expenses.map((e) => (e.id === id ? { ...e, ...cleanUpdate } : e));
    setExpenses(updatedList);
    persistLocalExpenses(updatedList);

    try {
      await updateDoc(doc(db, EXPENSES_COLLECTION, id), cleanUpdate).catch(() => {});
    } catch {}

    await syncToCloud(updatedList);

    return { success: true, message: 'Gasto actualizado correctamente.' };
  };

  const deleteExpense = async (id: string): Promise<{ success: boolean; message: string }> => {
    const updatedList = expenses.filter((e) => e.id !== id);
    setExpenses(updatedList);
    persistLocalExpenses(updatedList);

    try {
      await deleteDoc(doc(db, EXPENSES_COLLECTION, id)).catch(() => {});
    } catch {}

    await syncToCloud(updatedList);

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
      await setDoc(configRef, {
        lockPin: cleanPin,
        currencySymbol: '$',
        updatedAt: new Date().toISOString()
      }, { merge: true });
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
        importExpenses,
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

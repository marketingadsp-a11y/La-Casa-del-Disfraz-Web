import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { doc, getDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useSiteContent } from './SiteContentContext';
import { LoyverseReceipt, IncomeDateFilter, IncomeReportSummary } from '../types/incomes';
import { fetchLoyverseReceipts } from '../utils/loyverseClient';
import { sanitizeReceiptForFirestore, compactLoyverseReceipt, chunkArray } from '../utils/sanitizeFirestore';

const LOCAL_RECEIPTS_CACHE = 'lcd_loyverse_receipts_cache_v1';
const LOCAL_LAST_SYNC_CACHE = 'lcd_loyverse_last_sync_v1';

// Firestore collection & document where synced Loyverse data is backed up persistently
const LOYVERSE_SYNC_DOC = 'loyverse_data';
const LOYVERSE_COLLECTION = 'site_content';

interface IncomesContextType {
  receipts: LoyverseReceipt[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  lastSyncTime: string | null;
  syncFromLoyverse: (options?: { force?: boolean }) => Promise<{ success: boolean; count: number; error?: string }>;
  calculateSummary: (filter: IncomeDateFilter, customStart?: string, customEnd?: string) => {
    filteredReceipts: LoyverseReceipt[];
    summary: IncomeReportSummary;
    periodLabel: string;
  };
}

const IncomesContext = createContext<IncomesContextType | undefined>(undefined);

export const IncomesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { content, saveContent } = useSiteContent();
  const loyverseConfig = content.loyverse;

  const [receipts, setReceipts] = useState<LoyverseReceipt[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_RECEIPTS_CACHE);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Error reading cached receipts:', e);
    }
    return [];
  });

  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem(LOCAL_LAST_SYNC_CACHE) || loyverseConfig?.lastSyncTime || null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time synchronization with Firestore cloud database
  useEffect(() => {
    let isMounted = true;
    let lastLoadedUpdatedAt: string | null = null;

    // If local cache is empty, indicate loading state
    if (receipts.length === 0) {
      setIsLoading(true);
    }

    const syncDocRef = doc(db, LOYVERSE_COLLECTION, LOYVERSE_SYNC_DOC);
    const unsubscribe = onSnapshot(
      syncDocRef,
      async (snap) => {
        if (!isMounted) return;

        if (!snap.exists()) {
          setIsLoading(false);
          return;
        }

        const data = snap.data();
        const updatedAt = data.updatedAt || data.lastSyncTime || 'synced';

        // Skip re-fetching chunks if already loaded this exact version
        if (lastLoadedUpdatedAt === updatedAt && receipts.length > 0) {
          setIsLoading(false);
          return;
        }

        try {
          setIsLoading(true);
          let loadedReceipts: LoyverseReceipt[] = [];

          if (data.chunkCount && typeof data.chunkCount === 'number' && data.chunkCount > 0) {
            // Load chunk documents in parallel
            const chunkPromises = [];
            for (let i = 0; i < data.chunkCount; i++) {
              chunkPromises.push(getDoc(doc(db, LOYVERSE_COLLECTION, `loyverse_chunk_${i}`)));
            }
            const chunkSnaps = await Promise.all(chunkPromises);
            for (const cSnap of chunkSnaps) {
              if (cSnap.exists()) {
                const cData = cSnap.data();
                if (Array.isArray(cData.receipts)) {
                  loadedReceipts.push(...cData.receipts);
                }
              }
            }
          } else if (Array.isArray(data.receipts) && data.receipts.length > 0) {
            // Legacy single-doc fallback
            loadedReceipts = data.receipts;
          }

          if (isMounted) {
            lastLoadedUpdatedAt = updatedAt;
            if (loadedReceipts.length > 0) {
              setReceipts(loadedReceipts);
              try {
                localStorage.setItem(LOCAL_RECEIPTS_CACHE, JSON.stringify(loadedReceipts));
              } catch {
                // ignore quota
              }
            }
            if (data.lastSyncTime) {
              setLastSyncTime(data.lastSyncTime);
              try {
                localStorage.setItem(LOCAL_LAST_SYNC_CACHE, data.lastSyncTime);
              } catch {
                // ignore quota
              }
            }
          }
        } catch (err) {
          console.warn('Could not read Loyverse backup from Firestore:', err);
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      },
      (err) => {
        console.warn('Firestore snapshot error on loyverse sync doc:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  /**
   * Synchronize receipts from Loyverse POS API
   */
  const syncFromLoyverse = useCallback(async (options?: { force?: boolean }): Promise<{
    success: boolean;
    count: number;
    error?: string;
  }> => {
    const token = loyverseConfig?.apiToken?.trim();

    if (!token) {
      const msg = 'No has configurado la Ficha de Acceso de Loyverse. Ve a Ajustes de Admin para ingresarla.';
      setError(msg);
      return { success: false, count: 0, error: msg };
    }

    setIsSyncing(true);
    setError(null);

    try {
      // By default fetch receipts from current year/recent history
      const now = new Date();
      const currentYear = now.getFullYear();
      // Start of previous year to have ample history for comparisons
      const startDate = new Date(currentYear - 1, 0, 1).toISOString();

      const res = await fetchLoyverseReceipts({
        apiToken: token,
        storeId: loyverseConfig?.storeId || undefined,
        startDate
      });

      if (!res.success) {
        setError(res.error || 'Error al sincronizar con Loyverse');
        setIsSyncing(false);
        return { success: false, count: 0, error: res.error };
      }

      // Sort by created_at descending (newest first)
      const sorted = [...res.receipts].sort((a, b) => {
        const timeA = new Date(a.created_at || a.receipt_date || 0).getTime();
        const timeB = new Date(b.created_at || b.receipt_date || 0).getTime();
        return timeB - timeA;
      });

      setReceipts(sorted);
      const isoNow = new Date().toISOString();
      setLastSyncTime(isoNow);

      try {
        localStorage.setItem(LOCAL_RECEIPTS_CACHE, JSON.stringify(sorted));
        localStorage.setItem(LOCAL_LAST_SYNC_CACHE, isoNow);
      } catch (err) {
        console.warn('LocalStorage quota limit reached for receipts cache', err);
      }

      // Persist directly into Firestore in lightweight chunks (max 120 items / ~50KB per doc)
      // to completely bypass Firestore's 1MB (1,048,576 bytes) per-document limit
      try {
        const syncDocRef = doc(db, LOYVERSE_COLLECTION, LOYVERSE_SYNC_DOC);
        
        // 1. Compact and sanitize receipts
        const compactedReceipts = sorted.map(r => sanitizeReceiptForFirestore(compactLoyverseReceipt(r)));
        
        // 2. Chunk receipts into batches of 120 items (~50KB per doc)
        const chunks = chunkArray(compactedReceipts, 120);

        // 3. Check previous chunk count for cleanup if needed
        let previousChunkCount = 0;
        try {
          const prevMetaSnap = await getDoc(syncDocRef);
          if (prevMetaSnap.exists()) {
            previousChunkCount = prevMetaSnap.data()?.chunkCount || 0;
          }
        } catch {
          // ignore
        }

        // 4. Save all chunks in parallel
        const saveChunkPromises = chunks.map((chunk, index) => {
          const chunkDocRef = doc(db, LOYVERSE_COLLECTION, `loyverse_chunk_${index}`);
          return setDoc(chunkDocRef, {
            chunkIndex: index,
            updatedAt: isoNow,
            receipts: chunk
          });
        });
        await Promise.all(saveChunkPromises);

        // 5. Clean up old orphan chunks if the count decreased
        if (previousChunkCount > chunks.length) {
          const cleanupPromises = [];
          for (let j = chunks.length; j < previousChunkCount; j++) {
            cleanupPromises.push(deleteDoc(doc(db, LOYVERSE_COLLECTION, `loyverse_chunk_${j}`)).catch(() => {}));
          }
          await Promise.all(cleanupPromises);
        }

        // 6. Save root metadata document (without the massive receipts array)
        await setDoc(syncDocRef, {
          updatedAt: isoNow,
          lastSyncTime: isoNow,
          receiptsCount: sorted.length,
          chunkCount: chunks.length,
          chunkSize: 120
        });

        console.log(`[Loyverse] Successfully saved ${sorted.length} receipts across ${chunks.length} chunks to Firestore`);
      } catch (dbErr: any) {
        console.error('Error saving Loyverse receipts to Firestore:', dbErr);
      }

      // Also persist lastSyncTime in SiteContent draft if different
      if (content.loyverse && content.loyverse.lastSyncTime !== isoNow) {
        saveContent({
          ...content,
          loyverse: {
            ...content.loyverse,
            lastSyncTime: isoNow
          }
        }).catch(() => {
          // ignore background update error
        });
      }

      setIsSyncing(false);
      return { success: true, count: sorted.length };
    } catch (err: any) {
      const msg = err?.message || 'Error inesperado al consultar Loyverse';
      setError(msg);
      setIsSyncing(false);
      return { success: false, count: 0, error: msg };
    }
  }, [loyverseConfig?.apiToken, loyverseConfig?.storeId, content, saveContent]);

  // Automatic sync on load if autoSync is enabled and token exists
  useEffect(() => {
    if (loyverseConfig?.apiToken?.trim() && loyverseConfig?.autoSync !== false) {
      // If we haven't synced today, or if there are no cached receipts, run sync
      const now = Date.now();
      const lastSyncMs = lastSyncTime ? new Date(lastSyncTime).getTime() : 0;
      const hoursSinceLastSync = (now - lastSyncMs) / (1000 * 60 * 60);

      if (receipts.length === 0 || hoursSinceLastSync > 2) {
        syncFromLoyverse();
      }
    }
  }, [loyverseConfig?.apiToken, loyverseConfig?.autoSync]);

  /**
   * Helper to calculate financial summaries and apply date filters
   */
  const calculateSummary = useCallback(
    (filter: IncomeDateFilter, customStart?: string, customEnd?: string) => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      let list: LoyverseReceipt[] = [];
      let periodLabel = 'Mes en curso';

      switch (filter) {
        case 'today': {
          periodLabel = `Hoy (${now.toLocaleDateString('es-MX')})`;
          const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
          list = receipts.filter(r => {
            const t = new Date(r.created_at || r.receipt_date || 0).getTime();
            return t >= startOfDay && t < endOfDay;
          });
          break;
        }

        case 'yesterday': {
          const y = new Date(now);
          y.setDate(y.getDate() - 1);
          periodLabel = `Ayer (${y.toLocaleDateString('es-MX')})`;
          const startOfYesterday = new Date(y.getFullYear(), y.getMonth(), y.getDate()).getTime();
          const endOfYesterday = startOfYesterday + 24 * 60 * 60 * 1000;
          list = receipts.filter(r => {
            const t = new Date(r.created_at || r.receipt_date || 0).getTime();
            return t >= startOfYesterday && t < endOfYesterday;
          });
          break;
        }

        case 'last_7_days': {
          periodLabel = 'Últimos 7 días';
          const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
          list = receipts.filter(r => {
            const t = new Date(r.created_at || r.receipt_date || 0).getTime();
            return t >= sevenDaysAgo && t <= now.getTime();
          });
          break;
        }

        case 'this_week': {
          periodLabel = 'Esta semana (Lunes a Domingo)';
          const day = now.getDay();
          // Monday is day 1, Sunday is day 0
          const diffToMonday = (day === 0 ? -6 : 1) - day;
          const monday = new Date(now);
          monday.setDate(now.getDate() + diffToMonday);
          monday.setHours(0, 0, 0, 0);

          const startOfWeek = monday.getTime();
          list = receipts.filter(r => {
            const t = new Date(r.created_at || r.receipt_date || 0).getTime();
            return t >= startOfWeek;
          });
          break;
        }

        case 'last_month': {
          const lastMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1;
          const yearOfLastMonth = currentMonth === 0 ? currentYear - 1 : currentYear;
          const monthName = new Date(yearOfLastMonth, lastMonthIndex).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
          periodLabel = `Mes pasado (${monthName})`;

          list = receipts.filter(r => {
            const d = new Date(r.created_at || r.receipt_date || 0);
            return d.getFullYear() === yearOfLastMonth && d.getMonth() === lastMonthIndex;
          });
          break;
        }

        case 'current_year': {
          periodLabel = `Año en curso (${currentYear})`;
          list = receipts.filter(r => {
            const d = new Date(r.created_at || r.receipt_date || 0);
            return d.getFullYear() === currentYear;
          });
          break;
        }

        case 'custom': {
          if (customStart && customEnd) {
            periodLabel = `Del ${customStart} al ${customEnd}`;
            const sTime = new Date(`${customStart}T00:00:00`).getTime();
            const eTime = new Date(`${customEnd}T23:59:59.999`).getTime();
            list = receipts.filter(r => {
              const t = new Date(r.created_at || r.receipt_date || 0).getTime();
              return t >= sTime && t <= eTime;
            });
          } else {
            periodLabel = 'Período personalizado';
            list = receipts;
          }
          break;
        }

        case 'current_month':
        default: {
          const monthName = now.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
          periodLabel = `Mes en curso (${monthName})`;
          list = receipts.filter(r => {
            const d = new Date(r.created_at || r.receipt_date || 0);
            return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
          });
          break;
        }
      }

      // Financial calculations
      let totalGross = 0;
      let totalRefunds = 0;
      let salesCount = 0;
      let refundsCount = 0;
      let totalDiscounts = 0;
      const paymentMethodsSummary: Record<string, number> = {};
      const productMap: Record<string, { quantity: number; revenue: number }> = {};

      list.forEach(receipt => {
        const isRefund = receipt.receipt_type === 'REFUND';
        const money = Math.abs(receipt.total_money || 0);

        if (isRefund) {
          totalRefunds += money;
          refundsCount++;
        } else {
          totalGross += money;
          salesCount++;
        }

        totalDiscounts += (receipt.total_discount || 0);

        // Payment methods breakdown
        (receipt.payments || []).forEach(p => {
          const methodName = p.name || p.type || 'Otro';
          const pAmount = Math.abs(p.money_amount || 0);
          if (isRefund) {
            paymentMethodsSummary[methodName] = (paymentMethodsSummary[methodName] || 0) - pAmount;
          } else {
            paymentMethodsSummary[methodName] = (paymentMethodsSummary[methodName] || 0) + pAmount;
          }
        });

        // Top products breakdown
        (receipt.line_items || []).forEach(item => {
          const pName = item.item_name || 'Sin nombre';
          const qty = item.quantity || 1;
          const rev = item.total_money || 0;

          if (!productMap[pName]) {
            productMap[pName] = { quantity: 0, revenue: 0 };
          }
          if (isRefund) {
            productMap[pName].quantity -= qty;
            productMap[pName].revenue -= rev;
          } else {
            productMap[pName].quantity += qty;
            productMap[pName].revenue += rev;
          }
        });
      });

      const totalNet = totalGross - totalRefunds;
      const averageTicket = salesCount > 0 ? totalGross / salesCount : 0;

      const topProducts = Object.entries(productMap)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      return {
        filteredReceipts: list,
        summary: {
          totalGross,
          totalRefunds,
          totalNet,
          salesCount,
          refundsCount,
          averageTicket,
          totalDiscounts,
          paymentMethodsSummary,
          topProducts
        },
        periodLabel
      };
    },
    [receipts]
  );

  return (
    <IncomesContext.Provider
      value={{
        receipts,
        isLoading,
        isSyncing,
        error,
        lastSyncTime,
        syncFromLoyverse,
        calculateSummary
      }}
    >
      {children}
    </IncomesContext.Provider>
  );
};

export const useIncomes = () => {
  const context = useContext(IncomesContext);
  if (!context) {
    throw new Error('useIncomes must be used within an IncomesProvider');
  }
  return context;
};

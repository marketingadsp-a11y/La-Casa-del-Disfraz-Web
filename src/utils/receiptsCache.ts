import { LoyverseReceipt } from '../types/incomes';

const DB_NAME = 'lcd_loyverse_storage_v2';
const DB_VERSION = 1;
const STORE_NAME = 'receipts_store';
const RECEIPTS_KEY = 'all_receipts';
const META_KEY = 'cache_meta';

// Legacy localStorage key that caused 5MB QuotaExceededError around ~3,200 receipts
const LEGACY_LOCAL_RECEIPTS_KEY = 'lcd_loyverse_receipts_cache_v1';

export interface LocalReceiptsCacheMeta {
  updatedAt: string;
  lastSyncTime: string | null;
  lastVerifiedAt: string | null;
  receiptsCount: number;
  schemaVersion: number;
}

function openCacheDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      resolve(null);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('IndexedDB unavailable for receipts cache:', request.error);
        resolve(null);
      };
    } catch (err) {
      console.warn('IndexedDB open failed:', err);
      resolve(null);
    }
  });
}

/**
 * Reads all locally cached Loyverse receipts from IndexedDB.
 * Automatically migrates legacy localStorage cache if present, then clears the bloated localStorage key.
 */
export async function readCachedReceipts(): Promise<{
  receipts: LoyverseReceipt[];
  meta: LocalReceiptsCacheMeta | null;
}> {
  const idb = await openCacheDB();

  if (idb) {
    try {
      const result = await new Promise<{
        receipts: LoyverseReceipt[] | null;
        meta: LocalReceiptsCacheMeta | null;
      }>((resolve) => {
        const tx = idb.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const rReq = store.get(RECEIPTS_KEY);
        const mReq = store.get(META_KEY);

        let receiptsVal: LoyverseReceipt[] | null = null;
        let metaVal: LocalReceiptsCacheMeta | null = null;

        rReq.onsuccess = () => {
          if (Array.isArray(rReq.result)) receiptsVal = rReq.result;
        };
        mReq.onsuccess = () => {
          if (mReq.result && typeof mReq.result === 'object') metaVal = mReq.result;
        };

        tx.oncomplete = () => resolve({ receipts: receiptsVal, meta: metaVal });
        tx.onerror = () => resolve({ receipts: null, meta: null });
      });

      idb.close();

      if (result.receipts && result.receipts.length > 0) {
        // Ensure bloated legacy key is cleaned up once IndexedDB has data
        try {
          localStorage.removeItem(LEGACY_LOCAL_RECEIPTS_KEY);
        } catch {
          // ignore
        }
        return { receipts: result.receipts, meta: result.meta };
      }
    } catch (err) {
      console.warn('Error reading IndexedDB receipts cache:', err);
      try {
        idb.close();
      } catch {
        // ignore
      }
    }
  }

  // Fallback & one-time migration from legacy localStorage cache
  try {
    const legacyRaw = localStorage.getItem(LEGACY_LOCAL_RECEIPTS_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        await writeCachedReceipts(parsed, null);
        try {
          localStorage.removeItem(LEGACY_LOCAL_RECEIPTS_KEY);
        } catch {
          // ignore
        }
        return { receipts: parsed, meta: null };
      }
    }
  } catch (err) {
    console.warn('Error migrating legacy localStorage receipts:', err);
  }

  return { receipts: [], meta: null };
}

/**
 * Persists the full receipts array into IndexedDB (supports tens of thousands of receipts without 5MB cap).
 */
export async function writeCachedReceipts(
  receipts: LoyverseReceipt[],
  meta: LocalReceiptsCacheMeta | null
): Promise<boolean> {
  // Always clear legacy bloated localStorage key so it never triggers quota errors for other app data
  try {
    localStorage.removeItem(LEGACY_LOCAL_RECEIPTS_KEY);
  } catch {
    // ignore
  }

  const idb = await openCacheDB();
  if (!idb) return false;

  try {
    const ok = await new Promise<boolean>((resolve) => {
      const tx = idb.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(receipts, RECEIPTS_KEY);
      if (meta) {
        store.put(meta, META_KEY);
      }
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => {
        console.warn('IndexedDB write transaction error:', tx.error);
        resolve(false);
      };
    });
    idb.close();
    return ok;
  } catch (err) {
    console.warn('IndexedDB write error:', err);
    try {
      idb.close();
    } catch {
      // ignore
    }
    return false;
  }
}

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { doc, getDoc, getDocFromServer, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useSiteContent } from './SiteContentContext';
import { LoyverseReceipt, IncomeDateFilter, IncomeReportSummary } from '../types/incomes';
import { fetchLoyverseReceipts } from '../utils/loyverseClient';
import {
  sanitizeReceiptForFirestore,
  compactLoyverseReceipt,
  getReceiptUniqueKey,
  getReceiptMonthKey,
  splitReceiptsByByteSize,
} from '../utils/sanitizeFirestore';
import { readCachedReceipts, writeCachedReceipts } from '../utils/receiptsCache';
import {
  OperationType,
  logFirestoreError,
  formatFirestoreUserError,
  testFirestoreConnection,
} from '../utils/firestoreErrors';

const LOCAL_LAST_SYNC_CACHE = 'lcd_loyverse_last_sync_v1';
const LOCAL_LAST_VERIFIED_CACHE = 'lcd_loyverse_last_verified_v2';

// Firestore collection & manifest document (reuses already-authorized site_content collection)
const LOYVERSE_COLLECTION = 'site_content';
const LOYVERSE_SYNC_DOC = 'loyverse_data';
const CURRENT_SCHEMA_VERSION = 2;

export interface LoyverseMonthMeta {
  partCount: number;
  receiptCount: number;
  updatedAt: string;
  minDate?: string;
  maxDate?: string;
}

export interface LoyverseManifestV2 {
  schemaVersion: 2;
  updatedAt: string;
  lastSyncTime: string;
  lastVerifiedAt: string;
  receiptsCount: number;
  oldestReceiptDate?: string;
  latestReceiptDate?: string;
  months: Record<string, LoyverseMonthMeta>;
}

export type SyncMode = 'incremental' | 'range' | 'full';

export interface SyncFromLoyverseOptions {
  mode?: SyncMode;
  startDate?: string; // YYYY-MM-DD or ISO string (for 'range' mode)
  endDate?: string;   // YYYY-MM-DD or ISO string (for 'range' mode)
  force?: boolean;
}

export interface SyncProgressState {
  phase: 'idle' | 'fetching' | 'merging' | 'saving' | 'verifying' | 'done' | 'error';
  mode: SyncMode | null;
  page: number;
  fetchedCount: number;
  savedParts: number;
  totalParts: number;
  dirtyMonthsCount: number;
  currentLabel: string;
  retryMessage?: string | null;
  errorDetail?: string | null;
}

export interface ReceiptsDbStats {
  totalReceipts: number;
  monthsCount: number;
  oldestReceiptDate: string | null;
  latestReceiptDate: string | null;
  schemaVersion: number;
  isVerified: boolean;
  lastVerifiedAt: string | null;
}

export interface SyncFromLoyverseResult {
  success: boolean;
  verified?: boolean;
  aborted?: boolean;
  count: number;
  newCount?: number;
  updatedCount?: number;
  totalCount?: number;
  dirtyMonthsCount?: number;
  mode: SyncMode;
  error?: string;
  message?: string;
}

interface IncomesContextType {
  receipts: LoyverseReceipt[];
  isLoading: boolean;
  isInitialCloudLoaded: boolean;
  isSyncing: boolean;
  syncingMode: SyncMode | null;
  syncProgress: SyncProgressState;
  error: string | null;
  lastSyncTime: string | null;
  lastVerifiedAt: string | null;
  dbStats: ReceiptsDbStats;
  syncFromLoyverse: (options?: SyncFromLoyverseOptions) => Promise<SyncFromLoyverseResult>;
  cancelSync: () => void;
  calculateSummary: (filter: IncomeDateFilter, customStart?: string, customEnd?: string) => {
    filteredReceipts: LoyverseReceipt[];
    summary: IncomeReportSummary;
    periodLabel: string;
  };
}

const INITIAL_PROGRESS: SyncProgressState = {
  phase: 'idle',
  mode: null,
  page: 0,
  fetchedCount: 0,
  savedParts: 0,
  totalParts: 0,
  dirtyMonthsCount: 0,
  currentLabel: '',
  retryMessage: null,
  errorDetail: null,
};

function getReceiptTimestampMs(r: Partial<LoyverseReceipt>): number {
  const str = r.created_at || r.receipt_date;
  if (!str) return 0;
  const ms = new Date(str).getTime();
  return isNaN(ms) ? 0 : ms;
}

function sortReceiptsDesc(list: LoyverseReceipt[]): LoyverseReceipt[] {
  return [...list].sort((a, b) => getReceiptTimestampMs(b) - getReceiptTimestampMs(a));
}

function getMonthDocId(monthKey: string, partIndex: number): string {
  return `loyverse_m_${monthKey}_p${partIndex}`;
}

function formatMonthDisplay(monthKey: string): string {
  if (!monthKey || monthKey === 'unknown') return 'sin fecha';
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey;
  return new Date(y, m - 1, 1).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
}

/**
 * Executes async tasks with bounded concurrency so Firestore isn't flooded with 30+ parallel writes/reads
 */
async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>
): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      await worker(items[idx], idx);
    }
  });
  await Promise.all(runners);
}

const IncomesContext = createContext<IncomesContextType | undefined>(undefined);

export const IncomesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { content, saveContent } = useSiteContent();
  const loyverseConfig = content.loyverse;

  const [receipts, setReceipts] = useState<LoyverseReceipt[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem(LOCAL_LAST_SYNC_CACHE) || loyverseConfig?.lastSyncTime || null;
  });
  const [lastVerifiedAt, setLastVerifiedAt] = useState<string | null>(() => {
    return localStorage.getItem(LOCAL_LAST_VERIFIED_CACHE) || null;
  });
  const [schemaVersion, setSchemaVersion] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialCloudLoaded, setIsInitialCloudLoaded] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncingMode, setSyncingMode] = useState<SyncMode | null>(null);
  const [syncProgress, setSyncProgress] = useState<SyncProgressState>(INITIAL_PROGRESS);
  const [error, setError] = useState<string | null>(null);

  const receiptsRef = useRef<LoyverseReceipt[]>(receipts);
  receiptsRef.current = receipts;

  const isSyncingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastLoadedUpdatedAtRef = useRef<string | null>(null);
  const cloudManifestRef = useRef<any>(null);
  const initialCloudPromiseResolveRef = useRef<(() => void) | null>(null);
  const initialCloudPromiseRef = useRef<Promise<void>>(
    new Promise<void>((resolve) => {
      initialCloudPromiseResolveRef.current = resolve;
    })
  );
  const isInitialCloudLoadedRef = useRef<boolean>(false);

  const markInitialCloudLoaded = useCallback(() => {
    if (!isInitialCloudLoadedRef.current) {
      isInitialCloudLoadedRef.current = true;
      setIsInitialCloudLoaded(true);
      initialCloudPromiseResolveRef.current?.();
    }
  }, []);

  // 1. Instant local hydration from IndexedDB (migrates & clears bloated localStorage automatically)
  useEffect(() => {
    let active = true;
    readCachedReceipts().then(({ receipts: cached, meta }) => {
      if (!active) return;
      if (cached.length > 0 && receiptsRef.current.length === 0) {
        const sorted = sortReceiptsDesc(cached);
        setReceipts(sorted);
        receiptsRef.current = sorted;
      }
      if (meta?.lastSyncTime && !lastSyncTime) {
        setLastSyncTime(meta.lastSyncTime);
      }
      if (meta?.lastVerifiedAt && !lastVerifiedAt) {
        setLastVerifiedAt(meta.lastVerifiedAt);
      }
      if (meta?.schemaVersion) {
        setSchemaVersion(meta.schemaVersion);
      }
    });
    testFirestoreConnection();
    return () => {
      active = false;
    };
  }, []);

  /**
   * Loads all receipt documents referenced by a Firestore manifest (supports both v2 monthly parts and v1 legacy chunks)
   */
  const loadReceiptsFromManifest = useCallback(async (manifestData: any): Promise<LoyverseReceipt[]> => {
    const map = new Map<string, LoyverseReceipt>();

    if (
      manifestData.schemaVersion === CURRENT_SCHEMA_VERSION &&
      manifestData.months &&
      typeof manifestData.months === 'object'
    ) {
      const docIds: string[] = [];
      for (const [monthKey, meta] of Object.entries(manifestData.months as Record<string, LoyverseMonthMeta>)) {
        const count = Number(meta?.partCount || 0);
        for (let p = 0; p < count; p++) {
          docIds.push(getMonthDocId(monthKey, p));
        }
      }

      await runWithConcurrency(docIds, 6, async (docId) => {
        try {
          const snap = await getDoc(doc(db, LOYVERSE_COLLECTION, docId));
          if (snap.exists()) {
            const cData = snap.data();
            if (Array.isArray(cData.receipts)) {
              for (const r of cData.receipts) {
                map.set(getReceiptUniqueKey(r), r);
              }
            }
          }
        } catch (err) {
          logFirestoreError(err, OperationType.GET, `${LOYVERSE_COLLECTION}/${docId}`);
        }
      });
    } else if (manifestData.chunkCount && typeof manifestData.chunkCount === 'number' && manifestData.chunkCount > 0) {
      // Legacy v1 chunked format: loyverse_chunk_0..N
      const chunkIds = Array.from({ length: manifestData.chunkCount }, (_, i) => `loyverse_chunk_${i}`);
      await runWithConcurrency(chunkIds, 6, async (chunkId) => {
        try {
          const snap = await getDoc(doc(db, LOYVERSE_COLLECTION, chunkId));
          if (snap.exists()) {
            const cData = snap.data();
            if (Array.isArray(cData.receipts)) {
              for (const r of cData.receipts) {
                map.set(getReceiptUniqueKey(r), r);
              }
            }
          }
        } catch (err) {
          logFirestoreError(err, OperationType.GET, `${LOYVERSE_COLLECTION}/${chunkId}`);
        }
      });
    } else if (Array.isArray(manifestData.receipts) && manifestData.receipts.length > 0) {
      // Legacy v0 single-document fallback
      for (const r of manifestData.receipts) {
        map.set(getReceiptUniqueKey(r), r);
      }
    }

    return sortReceiptsDesc(Array.from(map.values()));
  }, []);

  // 2. Real-time Firestore listener on master manifest (site_content/loyverse_data)
  useEffect(() => {
    let isMounted = true;
    const syncDocRef = doc(db, LOYVERSE_COLLECTION, LOYVERSE_SYNC_DOC);

    const unsubscribe = onSnapshot(
      syncDocRef,
      async (snap) => {
        if (!isMounted) return;

        if (!snap.exists()) {
          cloudManifestRef.current = null;
          setIsLoading(false);
          markInitialCloudLoaded();
          return;
        }

        const data = snap.data();
        cloudManifestRef.current = data;
        const versionStamp = `${data.schemaVersion || 1}_${data.updatedAt || data.lastSyncTime || 'synced'}_${data.receiptsCount || 0}`;

        if (data.schemaVersion) {
          setSchemaVersion(Number(data.schemaVersion));
        }

        if (data.lastSyncTime) {
          setLastSyncTime(data.lastSyncTime);
          try {
            localStorage.setItem(LOCAL_LAST_SYNC_CACHE, data.lastSyncTime);
          } catch {
            // ignore
          }
        }

        if (data.lastVerifiedAt) {
          setLastVerifiedAt(data.lastVerifiedAt);
          try {
            localStorage.setItem(LOCAL_LAST_VERIFIED_CACHE, data.lastVerifiedAt);
          } catch {
            // ignore
          }
        }

        // Skip re-downloading all parts if we just wrote this exact version locally
        if (lastLoadedUpdatedAtRef.current === versionStamp && receiptsRef.current.length > 0) {
          setIsLoading(false);
          markInitialCloudLoaded();
          return;
        }

        try {
          if (receiptsRef.current.length === 0) {
            setIsLoading(true);
          }

          const loadedReceipts = await loadReceiptsFromManifest(data);

          if (!isMounted) return;

          lastLoadedUpdatedAtRef.current = versionStamp;

          if (loadedReceipts.length > 0 || (data.receiptsCount === 0 && data.schemaVersion === CURRENT_SCHEMA_VERSION)) {
            setReceipts(loadedReceipts);
            receiptsRef.current = loadedReceipts;
            await writeCachedReceipts(loadedReceipts, {
              updatedAt: data.updatedAt || new Date().toISOString(),
              lastSyncTime: data.lastSyncTime || null,
              lastVerifiedAt: data.lastVerifiedAt || null,
              receiptsCount: loadedReceipts.length,
              schemaVersion: Number(data.schemaVersion || 1),
            });
          }
        } catch (err) {
          logFirestoreError(err, OperationType.GET, `${LOYVERSE_COLLECTION}/${LOYVERSE_SYNC_DOC}`);
        } finally {
          if (isMounted) {
            setIsLoading(false);
            markInitialCloudLoaded();
          }
        }
      },
      (err) => {
        logFirestoreError(err, OperationType.GET, `${LOYVERSE_COLLECTION}/${LOYVERSE_SYNC_DOC}`);
        if (isMounted) {
          setError(formatFirestoreUserError(err, 'leer los datos de Loyverse'));
          setIsLoading(false);
          markInitialCloudLoaded();
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [loadReceiptsFromManifest, markInitialCloudLoaded]);

  const cancelSync = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  /**
   * Resilient, verified Loyverse synchronization engine:
   * - 'incremental': fetches new & updated receipts (updated_at_min = latest - 5m) and writes ONLY dirty months
   * - 'range': fetches explicit created_at_min..created_at_max range and merges into existing monthly partitions
   * - 'full': fetches ENTIRE Loyverse history without page cap or date cutoff, partitions by month, verifies on server
   */
  const syncFromLoyverse = useCallback(
    async (options?: SyncFromLoyverseOptions): Promise<SyncFromLoyverseResult> => {
      const token = loyverseConfig?.apiToken?.trim();
      const requestedMode: SyncMode = options?.mode || 'incremental';

      if (!token) {
        const msg = 'No has configurado la Ficha de Acceso de Loyverse. Ve a Ajustes de Admin para ingresarla.';
        setError(msg);
        return {
          success: false,
          count: 0,
          totalCount: receiptsRef.current.length,
          mode: requestedMode,
          error: msg,
        };
      }

      if (isSyncingRef.current) {
        return {
          success: false,
          count: 0,
          totalCount: receiptsRef.current.length,
          mode: requestedMode,
          error: 'Ya hay una sincronización en curso. Espera a que termine o cancélala primero.',
        };
      }

      // Wait for initial cloud hydration (up to 6s) so fast logins never merge against empty state
      if (!isInitialCloudLoadedRef.current) {
        await Promise.race([
          initialCloudPromiseRef.current,
          new Promise<void>((resolve) => setTimeout(resolve, 6000)),
        ]);
      }

      const currentReceipts = receiptsRef.current;

      // Determine true latest receipt timestamp in DB
      let latestReceiptDateMs: number | null = null;
      for (const r of currentReceipts) {
        const ms = getReceiptTimestampMs(r);
        if (ms > 0 && (latestReceiptDateMs === null || ms > latestReceiptDateMs)) {
          latestReceiptDateMs = ms;
        }
      }

      // If incremental requested on an empty DB, automatically run full historical sync
      const effectiveMode: SyncMode =
        requestedMode === 'incremental' && latestReceiptDateMs === null ? 'full' : requestedMode;

      // Validate range parameters if 'range' mode
      let rangeStartIso: string | undefined;
      let rangeEndIso: string | undefined;
      if (effectiveMode === 'range') {
        if (!options?.startDate || !options?.endDate) {
          const msg = 'Debes seleccionar fecha de inicio y fecha de fin para sincronizar por rango.';
          setError(msg);
          return {
            success: false,
            count: 0,
            totalCount: currentReceipts.length,
            mode: 'range',
            error: msg,
          };
        }
        const sDate = options.startDate.includes('T')
          ? new Date(options.startDate)
          : new Date(`${options.startDate}T00:00:00`);
        const eDate = options.endDate.includes('T')
          ? new Date(options.endDate)
          : new Date(`${options.endDate}T23:59:59.999`);

        if (isNaN(sDate.getTime()) || isNaN(eDate.getTime()) || sDate.getTime() > eDate.getTime()) {
          const msg = 'El rango de fechas seleccionado no es válido.';
          setError(msg);
          return {
            success: false,
            count: 0,
            totalCount: currentReceipts.length,
            mode: 'range',
            error: msg,
          };
        }
        rangeStartIso = sDate.toISOString();
        rangeEndIso = eDate.toISOString();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      isSyncingRef.current = true;
      setIsSyncing(true);
      setSyncingMode(effectiveMode);
      setError(null);
      setSyncProgress({
        phase: 'fetching',
        mode: effectiveMode,
        page: 0,
        fetchedCount: 0,
        savedParts: 0,
        totalParts: 0,
        dirtyMonthsCount: 0,
        currentLabel:
          effectiveMode === 'full'
            ? 'Iniciando descarga de todo el historial desde Loyverse...'
            : effectiveMode === 'range'
              ? `Consultando Loyverse del ${options?.startDate} al ${options?.endDate}...`
              : 'Consultando ventas nuevas y actualizadas en Loyverse...',
        retryMessage: null,
        errorDetail: null,
      });

      try {
        // 1. Fetch receipts from Loyverse (unlimited pagination + 429 retry)
        const fetchOptions: Parameters<typeof fetchLoyverseReceipts>[0] = {
          apiToken: token,
          storeId: loyverseConfig?.storeId || undefined,
          limit: 250,
          signal: controller.signal,
        };

        if (effectiveMode === 'incremental' && latestReceiptDateMs !== null) {
          // 5-minute overlap margin using updated_at_min to capture new tickets, offline POS uploads & refunds
          fetchOptions.updatedAtMin = new Date(latestReceiptDateMs - 5 * 60 * 1000).toISOString();
        } else if (effectiveMode === 'range') {
          fetchOptions.startDate = rangeStartIso;
          fetchOptions.endDate = rangeEndIso;
        }
        // For 'full' mode: NO startDate / endDate -> fetches 100% of historical receipts available in Loyverse!

        const res = await fetchLoyverseReceipts(fetchOptions, (prog) => {
          setSyncProgress((prev) => ({
            ...prev,
            phase: 'fetching',
            page: prog.page,
            fetchedCount: prog.fetchedCount,
            retryMessage: prog.retryMessage || null,
            currentLabel: `Descargando de Loyverse · Página ${prog.page} · ${prog.fetchedCount.toLocaleString('es-MX')} recibos`,
          }));
        });

        if (!res.success) {
          const errMsg = res.error || 'Error al sincronizar con Loyverse';
          setError(errMsg);
          setSyncProgress((prev) => ({
            ...prev,
            phase: res.aborted ? 'idle' : 'error',
            currentLabel: res.aborted ? 'Sincronización cancelada' : 'Falló la descarga desde Loyverse',
            errorDetail: res.aborted ? null : errMsg,
          }));
          return {
            success: false,
            aborted: res.aborted,
            count: 0,
            totalCount: currentReceipts.length,
            mode: effectiveMode,
            error: errMsg,
          };
        }

        // Read fresh manifest from server before persisting so we know exact schemaVersion & existing months
        const syncDocRef = doc(db, LOYVERSE_COLLECTION, LOYVERSE_SYNC_DOC);
        let serverManifest: any = cloudManifestRef.current;
        try {
          const freshSnap = await getDocFromServer(syncDocRef);
          serverManifest = freshSnap.exists() ? freshSnap.data() : null;
          cloudManifestRef.current = serverManifest;
        } catch (readErr) {
          logFirestoreError(readErr, OperationType.GET, `${LOYVERSE_COLLECTION}/${LOYVERSE_SYNC_DOC}`);
          const userMsg = formatFirestoreUserError(readErr, 'verificar la base de datos en Firebase');
          setError(userMsg);
          setSyncProgress((prev) => ({
            ...prev,
            phase: 'error',
            currentLabel: 'Sin conexión verificada con Firebase',
            errorDetail: userMsg,
          }));
          return {
            success: false,
            verified: false,
            count: 0,
            totalCount: currentReceipts.length,
            mode: effectiveMode,
            error: userMsg,
          };
        }

        const isAlreadyV2 =
          serverManifest?.schemaVersion === CURRENT_SCHEMA_VERSION &&
          serverManifest?.months &&
          typeof serverManifest.months === 'object';

        const isoNow = new Date().toISOString();

        // Fast path: incremental or range returned 0 items AND database is already migrated to v2
        if (res.receipts.length === 0 && effectiveMode !== 'full' && isAlreadyV2) {
          setSyncProgress((prev) => ({
            ...prev,
            phase: 'verifying',
            currentLabel: 'Sin cambios nuevos · Verificando estado en servidor...',
          }));

          try {
            const versionStamp = `${CURRENT_SCHEMA_VERSION}_${isoNow}_${currentReceipts.length}`;
            lastLoadedUpdatedAtRef.current = versionStamp;

            await setDoc(
              syncDocRef,
              {
                updatedAt: isoNow,
                lastSyncTime: isoNow,
                lastVerifiedAt: isoNow,
                receiptsCount: currentReceipts.length,
              },
              { merge: true }
            );

            // Confirm write directly on server
            await getDocFromServer(syncDocRef);

            setLastSyncTime(isoNow);
            setLastVerifiedAt(isoNow);
            try {
              localStorage.setItem(LOCAL_LAST_SYNC_CACHE, isoNow);
              localStorage.setItem(LOCAL_LAST_VERIFIED_CACHE, isoNow);
            } catch {
              // ignore
            }

            setSyncProgress((prev) => ({
              ...prev,
              phase: 'done',
              currentLabel: 'Base de datos verificada y al día (0 recibos nuevos).',
            }));

            return {
              success: true,
              verified: true,
              count: 0,
              newCount: 0,
              updatedCount: 0,
              totalCount: currentReceipts.length,
              dirtyMonthsCount: 0,
              mode: effectiveMode,
              message:
                effectiveMode === 'range'
                  ? `No se encontraron recibos en Loyverse para el rango del ${options?.startDate} al ${options?.endDate}.`
                  : 'La base de datos está al día y verificada. Loyverse no reportó ventas nuevas desde el último ticket.',
            };
          } catch (verifyErr) {
            logFirestoreError(verifyErr, OperationType.WRITE, `${LOYVERSE_COLLECTION}/${LOYVERSE_SYNC_DOC}`);
            const userMsg = formatFirestoreUserError(verifyErr, 'actualizar estado de sincronización');
            setError(userMsg);
            setSyncProgress((prev) => ({
              ...prev,
              phase: 'error',
              currentLabel: 'Error al confirmar en Firebase',
              errorDetail: userMsg,
            }));
            return {
              success: false,
              verified: false,
              count: 0,
              totalCount: currentReceipts.length,
              mode: effectiveMode,
              error: userMsg,
            };
          }
        }

        // 2. Merge & Deduplicate
        setSyncProgress((prev) => ({
          ...prev,
          phase: 'merging',
          currentLabel: `Fusionando y organizando ${res.receipts.length.toLocaleString('es-MX')} recibos por mes...`,
        }));

        const mergedMap = new Map<string, LoyverseReceipt>();
        const dirtyMonths = new Set<string>();
        let newlyAddedCount = 0;
        let updatedCount = 0;

        // Seed existing receipts (in all modes so we NEVER accidentally drop receipts during incremental/range;
        // even in full mode we preserve any existing unique records and update matching ones with fresh Loyverse data)
        for (const existing of currentReceipts) {
          const compacted = sanitizeReceiptForFirestore(compactLoyverseReceipt(existing));
          mergedMap.set(getReceiptUniqueKey(compacted), compacted);
        }

        // Upsert newly fetched receipts and mark their calendar months dirty
        for (const fetchedRaw of res.receipts) {
          const compacted = sanitizeReceiptForFirestore(compactLoyverseReceipt(fetchedRaw));
          const key = getReceiptUniqueKey(compacted);
          const prev = mergedMap.get(key);
          if (!prev) {
            newlyAddedCount++;
          } else {
            updatedCount++;
            // If receipt date changed months, also mark previous month dirty
            const prevMonth = getReceiptMonthKey(prev);
            dirtyMonths.add(prevMonth);
          }
          mergedMap.set(key, compacted);
          dirtyMonths.add(getReceiptMonthKey(compacted));
        }

        const finalSorted = sortReceiptsDesc(Array.from(mergedMap.values()));

        // Group ALL merged receipts by YYYY-MM
        const receiptsByMonth = new Map<string, LoyverseReceipt[]>();
        for (const r of finalSorted) {
          const mKey = getReceiptMonthKey(r);
          const arr = receiptsByMonth.get(mKey);
          if (arr) {
            arr.push(r);
          } else {
            receiptsByMonth.set(mKey, [r]);
          }
        }

        // Decide which months must be written to Firestore:
        // - If NOT yet migrated to v2 OR mode === 'full': write ALL months cleanly
        // - If already v2 AND incremental/range: write ONLY dirtyMonths! (super fast & low quota)
        const monthsToWrite =
          !isAlreadyV2 || effectiveMode === 'full'
            ? Array.from(receiptsByMonth.keys()).sort((a, b) => b.localeCompare(a))
            : Array.from(dirtyMonths).sort((a, b) => b.localeCompare(a));

        const existingMonthsMeta: Record<string, LoyverseMonthMeta> = isAlreadyV2
          ? { ...(serverManifest.months as Record<string, LoyverseMonthMeta>) }
          : {};

        // Build exact write plan (byte-bounded parts <= 420 KB each)
        interface WriteTask {
          monthKey: string;
          partIndex: number;
          docId: string;
          receipts: LoyverseReceipt[];
        }
        const writeTasks: WriteTask[] = [];
        const orphanMonthPartDeletes: string[] = [];
        const updatedMonthsMeta: Record<string, LoyverseMonthMeta> = { ...existingMonthsMeta };

        for (const monthKey of monthsToWrite) {
          const monthReceipts = receiptsByMonth.get(monthKey) || [];
          const prevPartCount = Number(existingMonthsMeta[monthKey]?.partCount || 0);

          if (monthReceipts.length === 0) {
            delete updatedMonthsMeta[monthKey];
            for (let p = 0; p < prevPartCount; p++) {
              orphanMonthPartDeletes.push(getMonthDocId(monthKey, p));
            }
            continue;
          }

          const parts = splitReceiptsByByteSize(monthReceipts, 420_000, 250);
          parts.forEach((partReceipts, partIdx) => {
            writeTasks.push({
              monthKey,
              partIndex: partIdx,
              docId: getMonthDocId(monthKey, partIdx),
              receipts: partReceipts,
            });
          });

          // Track shrunk orphan parts within this month
          for (let p = parts.length; p < prevPartCount; p++) {
            orphanMonthPartDeletes.push(getMonthDocId(monthKey, p));
          }

          // Min & max dates in this month (monthReceipts are already sorted descending)
          const newestInMonth = monthReceipts[0]?.created_at || monthReceipts[0]?.receipt_date;
          const oldestInMonth =
            monthReceipts[monthReceipts.length - 1]?.created_at ||
            monthReceipts[monthReceipts.length - 1]?.receipt_date;

          updatedMonthsMeta[monthKey] = {
            partCount: parts.length,
            receiptCount: monthReceipts.length,
            updatedAt: isoNow,
            ...(oldestInMonth ? { minDate: oldestInMonth } : {}),
            ...(newestInMonth ? { maxDate: newestInMonth } : {}),
          };
        }

        // 3. Persist monthly partition parts in controlled batches (concurrency = 3)
        // NEVER swallow errors — fail loudly without updating lastSyncTime!
        const totalParts = writeTasks.length;
        let savedParts = 0;

        setSyncProgress({
          phase: 'saving',
          mode: effectiveMode,
          page: res.pagesFetched,
          fetchedCount: res.receipts.length,
          savedParts: 0,
          totalParts,
          dirtyMonthsCount: monthsToWrite.length,
          currentLabel: `Guardando ${monthsToWrite.length} ${monthsToWrite.length === 1 ? 'mes' : 'meses'} en Firebase (0/${totalParts} bloques)...`,
          retryMessage: null,
          errorDetail: null,
        });

        try {
          await runWithConcurrency(writeTasks, 3, async (task) => {
            const partDocRef = doc(db, LOYVERSE_COLLECTION, task.docId);
            try {
              await setDoc(partDocRef, {
                schemaVersion: CURRENT_SCHEMA_VERSION,
                monthKey: task.monthKey,
                partIndex: task.partIndex,
                updatedAt: isoNow,
                receiptCount: task.receipts.length,
                receipts: task.receipts,
              });
            } catch (partErr) {
              logFirestoreError(partErr, OperationType.WRITE, `${LOYVERSE_COLLECTION}/${task.docId}`);
              throw partErr;
            }
            savedParts++;
            setSyncProgress((prev) => ({
              ...prev,
              phase: 'saving',
              savedParts,
              totalParts,
              currentLabel: `Guardando en Firebase · ${formatMonthDisplay(task.monthKey)} (${savedParts}/${totalParts} bloques)`,
            }));
          });

          // 4. Write master v2 manifest
          const newestReceipt = finalSorted[0];
          const oldestReceipt = finalSorted[finalSorted.length - 1];
          const latestDate = newestReceipt?.created_at || newestReceipt?.receipt_date || undefined;
          const oldestDate = oldestReceipt?.created_at || oldestReceipt?.receipt_date || undefined;

          const newManifest: LoyverseManifestV2 = {
            schemaVersion: CURRENT_SCHEMA_VERSION,
            updatedAt: isoNow,
            lastSyncTime: isoNow,
            lastVerifiedAt: isoNow,
            receiptsCount: finalSorted.length,
            ...(oldestDate ? { oldestReceiptDate: oldestDate } : {}),
            ...(latestDate ? { latestReceiptDate: latestDate } : {}),
            months: updatedMonthsMeta,
          };

          const versionStamp = `${CURRENT_SCHEMA_VERSION}_${isoNow}_${finalSorted.length}`;
          lastLoadedUpdatedAtRef.current = versionStamp;

          setSyncProgress((prev) => ({
            ...prev,
            phase: 'verifying',
            currentLabel: 'Confirmando y verificando respaldo directo en servidor Firebase...',
          }));

          await setDoc(syncDocRef, sanitizeReceiptForFirestore(newManifest));

          // 5. Strict server read-back verification (proves the manifest actually landed on Firestore server!)
          const verifiedSnap = await getDocFromServer(syncDocRef);
          const verifiedData = verifiedSnap.exists() ? verifiedSnap.data() : null;
          if (
            !verifiedData ||
            verifiedData.schemaVersion !== CURRENT_SCHEMA_VERSION ||
            Number(verifiedData.receiptsCount) !== finalSorted.length ||
            verifiedData.updatedAt !== isoNow
          ) {
            throw new Error(
              'La verificación en servidor no coincidió con los datos recién enviados. Reintenta la sincronización.'
            );
          }

          cloudManifestRef.current = verifiedData;

          // 6. Clean up shrunk month parts and legacy v1 chunks ONLY AFTER server verification succeeded
          const legacyChunkCount =
            !isAlreadyV2 && typeof serverManifest?.chunkCount === 'number' ? serverManifest.chunkCount : 0;
          const legacyDeletes = Array.from({ length: legacyChunkCount }, (_, i) => `loyverse_chunk_${i}`);
          const allDeletes = [...orphanMonthPartDeletes, ...legacyDeletes];
          if (allDeletes.length > 0) {
            await runWithConcurrency(allDeletes, 4, async (docId) => {
              await deleteDoc(doc(db, LOYVERSE_COLLECTION, docId)).catch(() => {});
            });
          }
        } catch (dbErr) {
          // Reset versionStamp so listener stays truthful
          lastLoadedUpdatedAtRef.current = null;
          logFirestoreError(dbErr, OperationType.WRITE, `${LOYVERSE_COLLECTION}/${LOYVERSE_SYNC_DOC}`);
          const userMsg = formatFirestoreUserError(dbErr, 'guardar los recibos en Firebase');
          setError(userMsg);
          setSyncProgress((prev) => ({
            ...prev,
            phase: 'error',
            currentLabel: 'No se pudo confirmar el guardado en Firebase',
            errorDetail: userMsg,
          }));
          // DO NOT update lastSyncTime or lastVerifiedAt when cloud save fails!
          return {
            success: false,
            verified: false,
            count: res.receipts.length,
            totalCount: currentReceipts.length,
            mode: effectiveMode,
            error: userMsg,
          };
        }

        // 7. Cloud persistence is 100% VERIFIED — now update UI state, IndexedDB cache, and metadata!
        setReceipts(finalSorted);
        receiptsRef.current = finalSorted;
        setSchemaVersion(CURRENT_SCHEMA_VERSION);
        setLastSyncTime(isoNow);
        setLastVerifiedAt(isoNow);

        await writeCachedReceipts(finalSorted, {
          updatedAt: isoNow,
          lastSyncTime: isoNow,
          lastVerifiedAt: isoNow,
          receiptsCount: finalSorted.length,
          schemaVersion: CURRENT_SCHEMA_VERSION,
        });

        try {
          localStorage.setItem(LOCAL_LAST_SYNC_CACHE, isoNow);
          localStorage.setItem(LOCAL_LAST_VERIFIED_CACHE, isoNow);
        } catch {
          // ignore
        }

        // Sync timestamp into SiteContent silently only AFTER verified write
        if (content.loyverse && content.loyverse.lastSyncTime !== isoNow) {
          saveContent({
            ...content,
            loyverse: {
              ...content.loyverse,
              lastSyncTime: isoNow,
            },
          }).catch(() => {});
        }

        const successSummary =
          effectiveMode === 'full'
            ? `Historial completo verificado: ${finalSorted.length.toLocaleString('es-MX')} recibos respaldados en ${Object.keys(updatedMonthsMeta).length} meses.`
            : effectiveMode === 'range'
              ? `Rango sincronizado y verificado: ${newlyAddedCount.toLocaleString('es-MX')} nuevos y ${updatedCount.toLocaleString('es-MX')} actualizados (Total BD: ${finalSorted.length.toLocaleString('es-MX')}).`
              : newlyAddedCount > 0
                ? `Sincronización verificada: ${newlyAddedCount.toLocaleString('es-MX')} ventas nuevas guardadas en ${monthsToWrite.length} ${monthsToWrite.length === 1 ? 'mes' : 'meses'} (Total BD: ${finalSorted.length.toLocaleString('es-MX')}).`
                : `Verificado en servidor: ${updatedCount} recibos revisados, base de datos al día (${finalSorted.length.toLocaleString('es-MX')} recibos).`;

        setSyncProgress({
          phase: 'done',
          mode: effectiveMode,
          page: res.pagesFetched,
          fetchedCount: res.receipts.length,
          savedParts: totalParts,
          totalParts,
          dirtyMonthsCount: monthsToWrite.length,
          currentLabel: successSummary,
          retryMessage: null,
          errorDetail: null,
        });

        return {
          success: true,
          verified: true,
          count: res.receipts.length,
          newCount: newlyAddedCount,
          updatedCount,
          totalCount: finalSorted.length,
          dirtyMonthsCount: monthsToWrite.length,
          mode: effectiveMode,
          message: successSummary,
        };
      } catch (err: any) {
        const msg = err?.message || 'Error inesperado al sincronizar con Loyverse';
        setError(msg);
        setSyncProgress((prev) => ({
          ...prev,
          phase: 'error',
          currentLabel: 'Error inesperado durante la sincronización',
          errorDetail: msg,
        }));
        return {
          success: false,
          verified: false,
          count: 0,
          totalCount: currentReceipts.length,
          mode: effectiveMode,
          error: msg,
        };
      } finally {
        isSyncingRef.current = false;
        abortControllerRef.current = null;
        setIsSyncing(false);
        setSyncingMode(null);
      }
    },
    [loyverseConfig?.apiToken, loyverseConfig?.storeId, content, saveContent]
  );

  // 3. Safe automatic incremental sync ONLY AFTER initial Firestore hydration completes
  const autoSyncTriggeredRef = useRef(false);
  useEffect(() => {
    if (!isInitialCloudLoaded || autoSyncTriggeredRef.current) return;
    if (loyverseConfig?.apiToken?.trim() && loyverseConfig?.autoSync !== false) {
      const now = Date.now();
      const lastVerifiedMs = lastVerifiedAt ? new Date(lastVerifiedAt).getTime() : 0;
      const hoursSinceVerified = (now - lastVerifiedMs) / (1000 * 60 * 60);

      if (receiptsRef.current.length === 0 || hoursSinceVerified > 2) {
        autoSyncTriggeredRef.current = true;
        syncFromLoyverse({ mode: 'incremental' });
      }
    }
  }, [isInitialCloudLoaded, loyverseConfig?.apiToken, loyverseConfig?.autoSync, lastVerifiedAt, syncFromLoyverse]);

  // 4. Real-time verified database statistics (exact min/max dates across all loaded receipts)
  const dbStats: ReceiptsDbStats = useMemo(() => {
    if (receipts.length === 0) {
      return {
        totalReceipts: 0,
        monthsCount: 0,
        oldestReceiptDate: null,
        latestReceiptDate: null,
        schemaVersion,
        isVerified: Boolean(lastVerifiedAt && schemaVersion === CURRENT_SCHEMA_VERSION),
        lastVerifiedAt,
      };
    }

    let minMs = Infinity;
    let maxMs = -Infinity;
    let minIso: string | null = null;
    let maxIso: string | null = null;
    const months = new Set<string>();

    for (const r of receipts) {
      const dStr = r.created_at || r.receipt_date;
      if (dStr) {
        const ms = new Date(dStr).getTime();
        if (!isNaN(ms)) {
          if (ms < minMs) {
            minMs = ms;
            minIso = dStr;
          }
          if (ms > maxMs) {
            maxMs = ms;
            maxIso = dStr;
          }
        }
      }
      months.add(getReceiptMonthKey(r));
    }

    return {
      totalReceipts: receipts.length,
      monthsCount: months.size,
      oldestReceiptDate: minIso,
      latestReceiptDate: maxIso,
      schemaVersion,
      isVerified: Boolean(lastVerifiedAt && schemaVersion === CURRENT_SCHEMA_VERSION),
      lastVerifiedAt,
    };
  }, [receipts, schemaVersion, lastVerifiedAt]);

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
          list = receipts.filter((r) => {
            const t = getReceiptTimestampMs(r);
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
          list = receipts.filter((r) => {
            const t = getReceiptTimestampMs(r);
            return t >= startOfYesterday && t < endOfYesterday;
          });
          break;
        }

        case 'last_7_days': {
          periodLabel = 'Últimos 7 días';
          const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
          list = receipts.filter((r) => {
            const t = getReceiptTimestampMs(r);
            return t >= sevenDaysAgo && t <= now.getTime();
          });
          break;
        }

        case 'this_week': {
          periodLabel = 'Esta semana (Lunes a Domingo)';
          const day = now.getDay();
          const diffToMonday = (day === 0 ? -6 : 1) - day;
          const monday = new Date(now);
          monday.setDate(now.getDate() + diffToMonday);
          monday.setHours(0, 0, 0, 0);

          const startOfWeek = monday.getTime();
          list = receipts.filter((r) => {
            const t = getReceiptTimestampMs(r);
            return t >= startOfWeek;
          });
          break;
        }

        case 'last_month': {
          const lastMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1;
          const yearOfLastMonth = currentMonth === 0 ? currentYear - 1 : currentYear;
          const monthName = new Date(yearOfLastMonth, lastMonthIndex).toLocaleDateString('es-MX', {
            month: 'long',
            year: 'numeric',
          });
          periodLabel = `Mes pasado (${monthName})`;

          list = receipts.filter((r) => {
            const d = new Date(r.created_at || r.receipt_date || 0);
            return d.getFullYear() === yearOfLastMonth && d.getMonth() === lastMonthIndex;
          });
          break;
        }

        case 'current_year': {
          periodLabel = `Año en curso (${currentYear})`;
          list = receipts.filter((r) => {
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
            list = receipts.filter((r) => {
              const t = getReceiptTimestampMs(r);
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
          list = receipts.filter((r) => {
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

      list.forEach((receipt) => {
        const isRefund = receipt.receipt_type === 'REFUND';
        const money = Math.abs(receipt.total_money || 0);

        if (isRefund) {
          totalRefunds += money;
          refundsCount++;
        } else {
          totalGross += money;
          salesCount++;
        }

        totalDiscounts += receipt.total_discount || 0;

        (receipt.payments || []).forEach((p) => {
          const methodName = p.name || p.type || 'Otro';
          const pAmount = Math.abs(p.money_amount || 0);
          if (isRefund) {
            paymentMethodsSummary[methodName] = (paymentMethodsSummary[methodName] || 0) - pAmount;
          } else {
            paymentMethodsSummary[methodName] = (paymentMethodsSummary[methodName] || 0) + pAmount;
          }
        });

        (receipt.line_items || []).forEach((item) => {
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
          topProducts,
        },
        periodLabel,
      };
    },
    [receipts]
  );

  return (
    <IncomesContext.Provider
      value={{
        receipts,
        isLoading,
        isInitialCloudLoaded,
        isSyncing,
        syncingMode,
        syncProgress,
        error,
        lastSyncTime,
        lastVerifiedAt,
        dbStats,
        syncFromLoyverse,
        cancelSync,
        calculateSummary,
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

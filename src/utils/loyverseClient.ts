import { LoyverseReceipt } from '../types/incomes';

// We route through '/api/loyverse' which is proxied by the local development server (or Vercel Serverless)
// This avoids browser CORS (Cross-Origin Resource Sharing) blocks when calling api.loyverse.com directly from the client.
const PROXY_API_BASE = '/api/loyverse';
const DIRECT_API_BASE = 'https://api.loyverse.com/v1.0';

export interface FetchReceiptsOptions {
  apiToken: string;
  startDate?: string;    // created_at_min ISO String (e.g. 2026-09-01T00:00:00.000Z)
  endDate?: string;      // created_at_max ISO String (e.g. 2026-09-20T23:59:59.999Z)
  updatedAtMin?: string; // updated_at_min ISO String (captures offline uploads, edits, cancellations)
  updatedAtMax?: string; // updated_at_max ISO String
  limit?: number;        // Max per request (Loyverse max is 250)
  storeId?: string;
  signal?: AbortSignal;
}

export interface FetchReceiptsProgress {
  page: number;
  fetchedCount: number;
  retryMessage?: string;
}

export interface LoyverseApiResponse {
  receipts: LoyverseReceipt[];
  cursor?: string;
  errors?: Array<{ code: string; message: string; details?: string }>;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Sincronización cancelada por el usuario.', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, ms);
    if (signal) {
      const onAbort = () => {
        clearTimeout(timer);
        reject(new DOMException('Sincronización cancelada por el usuario.', 'AbortError'));
      };
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

/**
 * Execute a fetch trying the proxy endpoint first, and falling back if needed
 */
async function doFetch(
  pathAndQuery: string,
  token: string,
  signal?: AbortSignal
): Promise<Response> {
  // First attempt via internal proxy to avoid CORS
  try {
    const proxyUrl = `${PROXY_API_BASE}${pathAndQuery}`;
    const res = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal,
    });

    const contentType = res.headers.get('content-type') || '';
    // If the server responded with HTML (e.g. index.html SPA rewrite on static hosts),
    // this is NOT a valid API response. Ignore this proxy and attempt fallback!
    if (contentType.includes('text/html')) {
      console.warn('Proxy returned text/html (SPA fallback detected). Falling back to direct Loyverse endpoint...');
    } else if (res.status !== 404 && res.status !== 502) {
      return res;
    }
  } catch (proxyErr: any) {
    if (proxyErr?.name === 'AbortError') throw proxyErr;
    console.warn('Proxy request failed, trying direct endpoint:', proxyErr);
  }

  // Fallback to direct Loyverse API (in case running without proxy or if CORS is permitted)
  const directUrl = `${DIRECT_API_BASE}${pathAndQuery}`;
  return await fetch(directUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    signal,
  });
}

/**
 * Utility to test whether a Loyverse API access token is valid
 */
export async function testLoyverseToken(token: string): Promise<{
  success: boolean;
  message: string;
  storeName?: string;
}> {
  const clean = token.trim();
  if (!clean) {
    return { success: false, message: 'La ficha de acceso no puede estar vacía.' };
  }

  try {
    const response = await doFetch('/receipts?limit=1', clean);

    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        message: 'Ficha de acceso inválida o sin permisos en Loyverse (401/403). Verifica que sea una Ficha Personal creada en Back Office.',
      };
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      return {
        success: false,
        message: 'El servidor de alojamiento respondió con HTML (página estática) en lugar de la API. Verifica que los endpoints /api/loyverse estén configurados.',
      };
    }

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `Error al conectar con Loyverse (HTTP ${response.status}): ${errorText.slice(0, 120)}`,
      };
    }

    return {
      success: true,
      message: '¡Conexión con Loyverse exitosa! Ficha de acceso verificada y activa.',
    };
  } catch (error: any) {
    console.error('Loyverse token test error:', error);
    return {
      success: false,
      message: `Error de conexión: ${error?.message || 'No se pudo contactar a api.loyverse.com.'}`,
    };
  }
}

/**
 * Fetch receipts from Loyverse with UNLIMITED cursor pagination, 429 rate-limit backoff,
 * transient network retries, and live progress reporting.
 */
export async function fetchLoyverseReceipts(
  options: FetchReceiptsOptions,
  onProgress?: (progress: FetchReceiptsProgress) => void
): Promise<{
  success: boolean;
  receipts: LoyverseReceipt[];
  pagesFetched: number;
  aborted?: boolean;
  error?: string;
}> {
  const {
    apiToken,
    startDate,
    endDate,
    updatedAtMin,
    updatedAtMax,
    limit = 250,
    storeId,
    signal,
  } = options;
  const cleanToken = apiToken?.trim();

  if (!cleanToken) {
    return {
      success: false,
      receipts: [],
      pagesFetched: 0,
      error: 'No se ha configurado la Ficha de Acceso de Loyverse en Ajustes de Admin.',
    };
  }

  const allReceipts: LoyverseReceipt[] = [];
  let cursor: string | undefined = undefined;
  const seenCursors = new Set<string>();
  let pageCount = 0;
  // Safety guard only against runaway API bugs (2,000 pages * 250 = 500,000 receipts)
  const MAX_SAFETY_PAGES = 2000;
  const MAX_RETRIES_PER_PAGE = 4;

  try {
    do {
      if (signal?.aborted) {
        return {
          success: false,
          receipts: allReceipts,
          pagesFetched: pageCount,
          aborted: true,
          error: 'Sincronización cancelada por el usuario.',
        };
      }

      const queryParams = new URLSearchParams();
      queryParams.set('limit', String(Math.min(Math.max(limit, 1), 250)));

      if (cursor) {
        queryParams.set('cursor', cursor);
      }
      if (startDate) {
        queryParams.set('created_at_min', startDate);
      }
      if (endDate) {
        queryParams.set('created_at_max', endDate);
      }
      if (updatedAtMin) {
        queryParams.set('updated_at_min', updatedAtMin);
      }
      if (updatedAtMax) {
        queryParams.set('updated_at_max', updatedAtMax);
      }
      if (storeId && storeId.trim()) {
        queryParams.set('store_id', storeId.trim());
      }

      const pathAndQuery = `/receipts?${queryParams.toString()}`;

      let response: Response | null = null;
      let attempt = 0;

      while (attempt <= MAX_RETRIES_PER_PAGE) {
        try {
          response = await doFetch(pathAndQuery, cleanToken, signal);

          // Handle Loyverse 429 rate limit (300 req / 300s) or transient 5xx
          if (response.status === 429 || (response.status >= 500 && response.status <= 504)) {
            if (attempt >= MAX_RETRIES_PER_PAGE) {
              break;
            }
            const retryAfterHeader = response.headers.get('retry-after');
            const parsedRetrySec = retryAfterHeader ? Number(retryAfterHeader) : NaN;
            const waitMs = !isNaN(parsedRetrySec) && parsedRetrySec > 0
              ? Math.min(parsedRetrySec * 1000, 30_000)
              : Math.min(2000 * Math.pow(2, attempt), 20_000);

            const waitSec = Math.ceil(waitMs / 1000);
            if (onProgress) {
              onProgress({
                page: pageCount + 1,
                fetchedCount: allReceipts.length,
                retryMessage:
                  response.status === 429
                    ? `Loyverse pidió una pausa breve por límite de velocidad (reintentando en ${waitSec}s)...`
                    : `Error temporal de Loyverse (HTTP ${response.status}), reintentando en ${waitSec}s...`,
              });
            }

            await sleep(waitMs, signal);
            attempt++;
            continue;
          }

          break;
        } catch (netErr: any) {
          if (netErr?.name === 'AbortError' || signal?.aborted) {
            return {
              success: false,
              receipts: allReceipts,
              pagesFetched: pageCount,
              aborted: true,
              error: 'Sincronización cancelada por el usuario.',
            };
          }
          if (attempt >= MAX_RETRIES_PER_PAGE) {
            throw netErr;
          }
          const waitMs = 1500 * Math.pow(2, attempt);
          if (onProgress) {
            onProgress({
              page: pageCount + 1,
              fetchedCount: allReceipts.length,
              retryMessage: `Reintentando conexión con Loyverse (${attempt + 1}/${MAX_RETRIES_PER_PAGE})...`,
            });
          }
          await sleep(waitMs, signal);
          attempt++;
        }
      }

      if (!response) {
        return {
          success: false,
          receipts: allReceipts,
          pagesFetched: pageCount,
          error: 'No se recibió respuesta del servidor de Loyverse.',
        };
      }

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          receipts: allReceipts,
          pagesFetched: pageCount,
          error: 'Ficha de acceso inválida o expirada. Por favor actualízala en Ajustes de Admin.',
        };
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        return {
          success: false,
          receipts: allReceipts,
          pagesFetched: pageCount,
          error: 'El servidor de alojamiento devolvió HTML en lugar de JSON. Verifica la configuración de la función /api/loyverse.',
        };
      }

      const responseText = await response.text();
      let data: LoyverseApiResponse;
      try {
        data = JSON.parse(responseText);
      } catch {
        if (responseText.trim().startsWith('<')) {
          return {
            success: false,
            receipts: allReceipts,
            pagesFetched: pageCount,
            error: 'La ruta de la API devolvió HTML en lugar de datos JSON. Asegúrate de que las funciones de Vercel estén desplegadas.',
          };
        }
        return {
          success: false,
          receipts: allReceipts,
          pagesFetched: pageCount,
          error: `Respuesta de Loyverse no es JSON válido: ${responseText.slice(0, 120)}`,
        };
      }

      if (!response.ok) {
        const apiErrMsg = data?.errors?.[0]?.message || responseText.slice(0, 160);
        return {
          success: false,
          receipts: allReceipts,
          pagesFetched: pageCount,
          error: `Error de Loyverse API (HTTP ${response.status}): ${apiErrMsg}`,
        };
      }

      const pageReceipts = Array.isArray(data.receipts) ? data.receipts : [];
      allReceipts.push(...pageReceipts);
      pageCount++;

      if (onProgress) {
        onProgress({
          page: pageCount,
          fetchedCount: allReceipts.length,
        });
      }

      const nextCursor = data.cursor;
      if (!nextCursor || pageReceipts.length === 0) {
        cursor = undefined;
        break;
      }

      if (seenCursors.has(nextCursor)) {
        console.warn('[Loyverse] Cursor repetido detectado, finalizando paginación de forma segura.');
        cursor = undefined;
        break;
      }
      seenCursors.add(nextCursor);
      cursor = nextCursor;

      if (pageCount >= MAX_SAFETY_PAGES) {
        console.warn('[Loyverse] Se alcanzó el límite de seguridad de páginas.');
        break;
      }

      // Gentle 120ms pacing after page 10 so very large historical syncs stay smoothly under 300 req / 300s
      if (pageCount >= 10) {
        await sleep(120, signal);
      }
    } while (cursor);

    return {
      success: true,
      receipts: allReceipts,
      pagesFetched: pageCount,
    };
  } catch (error: any) {
    if (error?.name === 'AbortError' || signal?.aborted) {
      return {
        success: false,
        receipts: allReceipts,
        pagesFetched: pageCount,
        aborted: true,
        error: 'Sincronización cancelada por el usuario.',
      };
    }
    console.error('Error fetching Loyverse receipts:', error);
    return {
      success: false,
      receipts: allReceipts,
      pagesFetched: pageCount,
      error: error?.message || 'Error de conexión con Loyverse API',
    };
  }
}

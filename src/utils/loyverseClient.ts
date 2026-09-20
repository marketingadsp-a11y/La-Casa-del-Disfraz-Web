import { LoyverseReceipt, LoyverseSettings } from '../types/incomes';

// We route through '/api/loyverse' which is proxied by the local development server (or backend)
// This avoids browser CORS (Cross-Origin Resource Sharing) blocks when calling api.loyverse.com directly from the client.
const PROXY_API_BASE = '/api/loyverse';
const DIRECT_API_BASE = 'https://api.loyverse.com/v1.0';

export interface FetchReceiptsOptions {
  apiToken: string;
  startDate?: string; // ISO String (e.g. 2026-09-01T00:00:00.000Z)
  endDate?: string;   // ISO String (e.g. 2026-09-20T23:59:59.999Z)
  limit?: number;     // Max per request (Loyverse max is 250)
  storeId?: string;
}

export interface LoyverseApiResponse {
  receipts: LoyverseReceipt[];
  cursor?: string;
  errors?: Array<{ code: string; message: string; details?: string }>;
}

/**
 * Execute a fetch trying the proxy endpoint first, and falling back if needed
 */
async function doFetch(pathAndQuery: string, token: string): Promise<Response> {
  // First attempt via internal proxy to avoid CORS
  try {
    const proxyUrl = `${PROXY_API_BASE}${pathAndQuery}`;
    const res = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // If proxy responded (even with 401 or other HTTP status from Loyverse), return it
    if (res.status !== 404 && res.status !== 502) {
      return res;
    }
  } catch (proxyErr) {
    console.warn('Proxy request failed, trying direct endpoint:', proxyErr);
  }

  // Fallback to direct Loyverse API (in case running without proxy or if CORS is permitted)
  const directUrl = `${DIRECT_API_BASE}${pathAndQuery}`;
  return await fetch(directUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
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
        message: 'Ficha de acceso inválida o sin permisos en Loyverse (401/403). Verifica que sea una Ficha Personal creada en Back Office.'
      };
    }

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `Error al conectar con Loyverse (HTTP ${response.status}): ${errorText.slice(0, 120)}`
      };
    }

    return {
      success: true,
      message: '¡Conexión con Loyverse exitosa! Ficha de acceso verificada y activa.'
    };
  } catch (error: any) {
    console.error('Loyverse token test error:', error);
    return {
      success: false,
      message: `Error de conexión: ${error?.message || 'No se pudo contactar a api.loyverse.com. Puede ser debido a restricciones de CORS del navegador.'}`
    };
  }
}

/**
 * Fetch receipts from Loyverse with pagination support
 * Automatically iterates through cursor if needed to get all receipts for the requested range.
 */
export async function fetchLoyverseReceipts(
  options: FetchReceiptsOptions,
  onProgress?: (count: number) => void
): Promise<{
  success: boolean;
  receipts: LoyverseReceipt[];
  error?: string;
}> {
  const { apiToken, startDate, endDate, limit = 250, storeId } = options;
  const cleanToken = apiToken?.trim();

  if (!cleanToken) {
    return {
      success: false,
      receipts: [],
      error: 'No se ha configurado la Ficha de Acceso de Loyverse en Ajustes de Admin.'
    };
  }

  const allReceipts: LoyverseReceipt[] = [];
  let cursor: string | undefined = undefined;
  let pageCount = 0;
  const maxPages = 15; // safety limit (up to 3,750 receipts)

  try {
    do {
      const queryParams = new URLSearchParams();
      queryParams.set('limit', String(limit));

      if (cursor) {
        queryParams.set('cursor', cursor);
      }
      if (startDate) {
        queryParams.set('created_at_min', startDate);
      }
      if (endDate) {
        queryParams.set('created_at_max', endDate);
      }
      if (storeId && storeId.trim()) {
        queryParams.set('store_id', storeId.trim());
      }

      const pathAndQuery = `/receipts?${queryParams.toString()}`;
      const response = await doFetch(pathAndQuery, cleanToken);

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          receipts: allReceipts,
          error: 'Ficha de acceso inválida o expirada. Por favor actualízala en Ajustes de Admin.'
        };
      }

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          receipts: allReceipts,
          error: `Error de Loyverse API (HTTP ${response.status}): ${errorText.slice(0, 150)}`
        };
      }

      const data: LoyverseApiResponse = await response.json();
      const pageReceipts = data.receipts || [];

      allReceipts.push(...pageReceipts);

      if (onProgress) {
        onProgress(allReceipts.length);
      }

      cursor = data.cursor;
      pageCount++;

      // Break if no cursor or reached limit
      if (!cursor || pageReceipts.length === 0 || pageCount >= maxPages) {
        break;
      }
    } while (cursor);

    return {
      success: true,
      receipts: allReceipts
    };
  } catch (error: any) {
    console.error('Error fetching Loyverse receipts:', error);
    return {
      success: false,
      receipts: allReceipts,
      error: error?.message || 'Error de conexión con Loyverse API'
    };
  }
}

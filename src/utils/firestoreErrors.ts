import { doc, getDocFromServer } from 'firebase/firestore';
import { auth, db } from '../firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Builds structured diagnostic metadata for any Firestore failure
 */
export function buildFirestoreErrorInfo(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const currentUser = auth?.currentUser;
  return {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid ?? null,
      email: currentUser?.email ?? null,
      emailVerified: currentUser?.emailVerified ?? null,
      isAnonymous: currentUser?.isAnonymous ?? null,
      tenantId: currentUser?.tenantId ?? null,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
}

/**
 * Logs structured Firestore error telemetry and throws serialized FirestoreErrorInfo
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo = buildFirestoreErrorInfo(error, operationType, path);
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Logs structured Firestore error without throwing (for non-fatal callbacks)
 */
export function logFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo = buildFirestoreErrorInfo(error, operationType, path);
  console.error('Firestore Error:', JSON.stringify(errInfo));
  return errInfo;
}

/**
 * Translates raw Firebase / Firestore errors into clear, actionable Spanish messages for admins
 */
export function formatFirestoreUserError(error: unknown, contextLabel = 'guardar en Firebase'): string {
  const raw = error instanceof Error ? error.message : String(error || '');
  const lower = raw.toLowerCase();

  if (lower.includes('quota exceeded') || lower.includes('resource-exhausted')) {
    return `Se excedió la cuota diaria de Firebase al ${contextLabel}. La cuota gratuita se restablece al día siguiente; verifica tu plan en Firebase Console.`;
  }
  if (lower.includes('permission-denied') || lower.includes('missing or insufficient permissions')) {
    return `Permisos insuficientes en Firestore al ${contextLabel}. Revisa las reglas de seguridad en Firebase Console.`;
  }
  if (lower.includes('client is offline') || lower.includes('unavailable') || lower.includes('network')) {
    return `Sin conexión con el servidor de Firebase al ${contextLabel}. Verifica tu conexión a internet e intenta de nuevo.`;
  }
  if (lower.includes('exceeds the maximum allowed size') || lower.includes('too large')) {
    return `Un bloque de datos excedió el tamaño máximo de Firestore al ${contextLabel}. Intenta sincronizar nuevamente para dividirlo automáticamente.`;
  }
  if (lower.includes('deadline-exceeded') || lower.includes('timeout')) {
    return `Tiempo de espera agotado al ${contextLabel}. Intenta sincronizar por un rango de fechas más corto o reintenta en unos segundos.`;
  }

  // Extract concise message if JSON-encoded FirestoreErrorInfo
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.error === 'string') {
      return `Error de Firebase al ${contextLabel}: ${parsed.error}`;
    }
  } catch {
    // not JSON
  }

  return `Error al ${contextLabel}: ${raw || 'Error desconocido de base de datos'}`;
}

/**
 * Startup connectivity check against Firestore server
 */
let hasTestedConnection = false;
export async function testFirestoreConnection(): Promise<{ online: boolean; error?: string }> {
  if (hasTestedConnection) {
    return { online: true };
  }
  hasTestedConnection = true;
  try {
    await getDocFromServer(doc(db, 'site_content', 'loyverse_data'));
    return { online: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.toLowerCase().includes('client is offline')) {
      console.error('Firebase connectivity warning: the client is offline. Verify Firebase configuration.');
      return { online: false, error: msg };
    }
    return { online: true };
  }
}

import { LoyverseReceipt } from '../types/incomes';

/**
 * Strips all undefined fields recursively so Firestore never rejects the payload
 */
export function sanitizeReceiptForFirestore(receipt: any): any {
  if (receipt === null || receipt === undefined) {
    return null;
  }
  if (Array.isArray(receipt)) {
    return receipt.map(sanitizeReceiptForFirestore).filter(v => v !== undefined);
  }
  if (typeof receipt === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(receipt)) {
      if (val !== undefined) {
        clean[key] = sanitizeReceiptForFirestore(val);
      }
    }
    return clean;
  }
  return receipt;
}

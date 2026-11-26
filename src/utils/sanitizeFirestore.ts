import { LoyverseReceipt } from '../types/incomes';

/**
 * Strips all undefined fields recursively so Firestore never rejects the payload
 */
export function sanitizeReceiptForFirestore(receipt: any): any {
  if (receipt === null || receipt === undefined) {
    return null;
  }
  if (Array.isArray(receipt)) {
    return receipt.map(sanitizeReceiptForFirestore).filter((v) => v !== undefined);
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

/**
 * Consistent unique key for deduplicating Loyverse receipts across syncs
 */
export function getReceiptUniqueKey(r: Partial<LoyverseReceipt>): string {
  if (r.receipt_number && String(r.receipt_number).trim()) {
    return `num:${String(r.receipt_number).trim()}`;
  }
  if (r.id && String(r.id).trim()) {
    return `id:${String(r.id).trim()}`;
  }
  return `fallback:${r.created_at || r.receipt_date || '0'}_${r.total_money || 0}_${r.receipt_type || 'SALE'}`;
}

/**
 * Extracts calendar month partition key (YYYY-MM) from a receipt's timestamp.
 * Uses local year/month consistently with how reports filter receipts.
 */
export function getReceiptMonthKey(r: Partial<LoyverseReceipt>): string {
  const dateStr = r.created_at || r.receipt_date;
  if (!dateStr) return 'unknown';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'unknown';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Retains only the necessary fields for the application, stripping bloated or unused Loyverse metadata
 * to drastically reduce byte size before storing in cloud databases.
 */
export function compactLoyverseReceipt(r: any): LoyverseReceipt {
  return {
    ...(r.id ? { id: String(r.id) } : {}),
    receipt_number: String(r.receipt_number || ''),
    receipt_type: r.receipt_type === 'REFUND' ? 'REFUND' : 'SALE',
    created_at: r.created_at || r.receipt_date || new Date().toISOString(),
    ...(r.updated_at ? { updated_at: String(r.updated_at) } : {}),
    ...(r.receipt_date ? { receipt_date: String(r.receipt_date) } : {}),
    ...(r.cancelled_at ? { cancelled_at: String(r.cancelled_at) } : {}),
    total_money: Number(r.total_money || 0),
    ...(r.total_tax !== undefined && r.total_tax !== null ? { total_tax: Number(r.total_tax) } : {}),
    ...(r.total_discount !== undefined && r.total_discount !== null ? { total_discount: Number(r.total_discount) } : {}),
    ...(r.tip !== undefined && r.tip !== null ? { tip: Number(r.tip) } : {}),
    ...(r.note ? { note: String(r.note) } : {}),
    ...(r.order ? { order: String(r.order) } : {}),
    ...(r.employee_id ? { employee_id: String(r.employee_id) } : {}),
    ...(r.customer_id ? { customer_id: String(r.customer_id) } : {}),
    ...(r.store_id ? { store_id: String(r.store_id) } : {}),
    payments: Array.isArray(r.payments)
      ? r.payments.map((p: any) => ({
          ...(p.name ? { name: String(p.name) } : {}),
          ...(p.type ? { type: String(p.type) } : {}),
          money_amount: Number(p.money_amount || 0),
          ...(p.paid_at ? { paid_at: String(p.paid_at) } : {}),
        }))
      : [],
    line_items: Array.isArray(r.line_items)
      ? r.line_items.map((li: any) => ({
          item_name: String(li.item_name || 'Artículo'),
          ...(li.variant_name ? { variant_name: String(li.variant_name) } : {}),
          quantity: Number(li.quantity || 1),
          price: Number(li.price || 0),
          total_money: Number(
            li.total_money !== undefined ? li.total_money : (li.price || 0) * (li.quantity || 1)
          ),
          ...(li.total_discount !== undefined && li.total_discount !== null
            ? { total_discount: Number(li.total_discount) }
            : {}),
          ...(li.cost !== undefined && li.cost !== null ? { cost: Number(li.cost) } : {}),
          ...(li.line_note ? { line_note: String(li.line_note) } : {}),
        }))
      : [],
  };
}

/**
 * Estimates UTF-8 byte length of a JSON-serializable object
 */
const textEncoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

export function estimateUtf8Bytes(value: unknown): number {
  const json = JSON.stringify(value);
  if (!json) return 0;
  if (textEncoder) {
    return textEncoder.encode(json).length;
  }
  return json.length * 2;
}

/**
 * Splits receipts into byte-bounded parts so NO Firestore document ever approaches
 * the 1 MiB (1,048,576 bytes) hard limit. Default cap: 420 KB (~40% of 1 MiB),
 * leaving huge safety margin for Firestore field-name & protobuf encoding overhead.
 */
export function splitReceiptsByByteSize(
  receipts: LoyverseReceipt[],
  maxBytesPerPart = 420_000,
  maxItemsPerPart = 250
): LoyverseReceipt[][] {
  if (receipts.length === 0) return [];

  const parts: LoyverseReceipt[][] = [];
  let currentPart: LoyverseReceipt[] = [];
  let currentBytes = 0;

  for (const receipt of receipts) {
    // Factor 1.35x accounts for Firestore map/array protobuf overhead on top of JSON size
    const itemBytes = Math.ceil(estimateUtf8Bytes(receipt) * 1.35);

    if (
      currentPart.length > 0 &&
      (currentBytes + itemBytes > maxBytesPerPart || currentPart.length >= maxItemsPerPart)
    ) {
      parts.push(currentPart);
      currentPart = [];
      currentBytes = 0;
    }

    currentPart.push(receipt);
    currentBytes += itemBytes;
  }

  if (currentPart.length > 0) {
    parts.push(currentPart);
  }

  return parts;
}

/**
 * Splits an array into fixed-size chunks
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

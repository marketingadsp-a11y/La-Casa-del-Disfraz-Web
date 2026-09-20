export interface LoyverseSettings {
  apiToken: string; // Token de acceso personal de Loyverse
  storeId?: string; // Opcional: ID de tienda específica
  autoSync: boolean; // Sincronización automática al abrir la pestaña
  lastSyncTime?: string; // ISO string de la última sincronización exitosa
}

export interface LoyversePayment {
  payment_type_id?: string;
  name?: string;
  type?: string;
  money_amount: number;
  paid_at?: string;
}

export interface LoyverseLineItem {
  id?: string;
  item_id?: string;
  variant_id?: string;
  item_name: string;
  variant_name?: string;
  quantity: number;
  price: number;
  total_discount?: number;
  gross_total_money?: number;
  total_money: number;
  cost?: number;
  line_note?: string;
}

export interface LoyverseReceipt {
  receipt_number: string;
  receipt_type: 'SALE' | 'REFUND' | string;
  created_at: string;
  updated_at?: string;
  receipt_date?: string;
  cancelled_at?: string;
  total_money: number;
  total_tax?: number;
  total_discount?: number;
  tip?: number;
  surcharge?: number;
  points_deducted?: number;
  points_earned?: number;
  employee_id?: string;
  customer_id?: string;
  order?: string;
  note?: string;
  payments?: LoyversePayment[];
  line_items?: LoyverseLineItem[];
  store_id?: string;
  pos_device_id?: string;
}

export type IncomeDateFilter =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'this_week'
  | 'last_month'
  | 'current_year'
  | 'current_month'
  | 'custom';

export interface IncomeReportSummary {
  totalGross: number; // Ventas brutas (SALE)
  totalRefunds: number; // Devoluciones (REFUND)
  totalNet: number; // Ingreso neto (Ventas - Devoluciones)
  salesCount: number; // Número de tickets de venta
  refundsCount: number; // Número de tickets de reembolso
  averageTicket: number; // Ticket promedio de venta
  totalDiscounts: number; // Total descuentos aplicados
  paymentMethodsSummary: Record<string, number>; // Desglose por método de pago (Efectivo, Tarjeta, etc.)
  topProducts: { name: string; quantity: number; revenue: number }[]; // Top productos vendidos
}

export interface ExpenseItem {
  id: string;
  concept: string;
  amount: number;
  date: string; // ISO format: 2026-09-19T22:30:00.000Z
  registeredBy?: string;
  notes?: string;
  createdAt: string;
}

export type ExpenseDateFilter = 
  | 'current_month' 
  | 'today' 
  | 'last_7_days' 
  | 'this_week' 
  | 'last_month' 
  | 'this_year' 
  | 'custom';

export interface ExpensesConfig {
  lockPin: string;
  currencySymbol: string;
  updatedAt: string;
}

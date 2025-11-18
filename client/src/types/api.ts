// Types for the frontend API client — mirror of @shared/schema types
export type ID = string;

export type AmountString = string; // e.g., "100.00"

export interface User {
  id: ID;
  username: string;
}

export interface Transaction {
  id: ID;
  userId: ID;
  amount: AmountString;
  description: string;
  categoryId: ID;
  category?: string;
  date: string; // ISO string
  type: 'income' | 'expense';
}

export interface Budget {
  id: ID;
  userId: ID;
  categoryId: ID;
  amount: AmountString;
  period: string;
  month?: number | null;
  year?: number | null;
}

export interface Summary {
  totalIncome: AmountString;
  totalExpenses: AmountString;
  netBalance: AmountString;
  category_breakdown: Array<{ categoryId: ID; category: string; amount: AmountString; transaction_count: number }>;
  transaction_count: number;
}

export interface Health {
  status: 'healthy' | 'unhealthy';
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: number;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'cash' | 'investment';
  balance: number;
  currency: string;
  user_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  type: 'income' | 'expense';
  user_id?: number;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  account_id: number;
  category_id?: number;
  to_account_id?: number;
  date: string;
  user_id: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  account_name?: string;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  to_account_name?: string;
}

export interface UserProfile extends User {
  total_accounts: number;
  total_transactions: number;
  net_worth: number;
  score_details: {
    score: number;
    savings_rate: number;
    expense_ratio: number;
    consistency_score: number;
    monthly_income: number;
    monthly_expenses: number;
    active_days: number;
    total_transactions: number;
  };
}

export interface RankingUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  score: number;
  rank_position: number;
  is_current_user: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total?: number;
    pages?: number;
  };
}

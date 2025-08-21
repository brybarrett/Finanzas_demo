const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  ME: `${API_BASE_URL}/auth/me`,
  
  // Accounts
  ACCOUNTS: `${API_BASE_URL}/accounts`,
  ACCOUNTS_SUMMARY: `${API_BASE_URL}/accounts/summary`,
  CURRENCIES: `${API_BASE_URL}/accounts/currencies`,
  
  // Transactions
  TRANSACTIONS: `${API_BASE_URL}/transactions`,
  TRANSACTIONS_SUMMARY: `${API_BASE_URL}/transactions/summary`,
  
  // Categories
  CATEGORIES: `${API_BASE_URL}/categories`,
  CATEGORIES_STATS: `${API_BASE_URL}/categories/stats`,
  
  // Users
  PROFILE: `${API_BASE_URL}/users/profile`,
  RANKING: `${API_BASE_URL}/users/ranking`,
  COMPARE: `${API_BASE_URL}/users/compare`,
  RECALCULATE_SCORE: `${API_BASE_URL}/users/recalculate-score`,
};

export { API_BASE_URL };

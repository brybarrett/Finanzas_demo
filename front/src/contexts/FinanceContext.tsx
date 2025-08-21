'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '@/config/api';
import type { Account, Transaction, Category } from '@/types';

interface FinanceState {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  isLoading: boolean;
  accountsSummary: {
    total_accounts: number;
    total_assets: number;
    total_liabilities: number;
    net_worth: number;
  } | null;
  transactionsSummary: {
    total_income: number;
    total_expenses: number;
    total_transactions: number;
    net_income: number;
  } | null;
}

interface FinanceContextType extends FinanceState {
  // Accounts
  fetchAccounts: () => Promise<void>;
  createAccount: (accountData: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Account>;
  updateAccount: (id: number, accountData: Partial<Account>) => Promise<Account>;
  deleteAccount: (id: number) => Promise<void>;
  fetchAccountsSummary: () => Promise<void>;
  
  // Transactions
  fetchTransactions: (params?: TransactionFilters) => Promise<void>;
  createTransaction: (transactionData: CreateTransactionData) => Promise<Transaction>;
  deleteTransaction: (id: number) => Promise<void>;
  fetchTransactionsSummary: (period?: string) => Promise<void>;
  
  // Categories
  fetchCategories: (type?: 'income' | 'expense') => Promise<void>;
  createCategory: (categoryData: Omit<Category, 'id' | 'user_id' | 'created_at'>) => Promise<Category>;
  updateCategory: (id: number, categoryData: Partial<Category>) => Promise<Category>;
  deleteCategory: (id: number) => Promise<void>;
}

interface TransactionFilters {
  page?: number;
  limit?: number;
  account_id?: number;
  category_id?: number;
  type?: 'income' | 'expense' | 'transfer';
  start_date?: string;
  end_date?: string;
}

interface CreateTransactionData {
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  account_id: number;
  category_id?: number;
  category_name?: string;
  to_account_id?: number;
  date: string;
  notes?: string;
}

type FinanceAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ACCOUNTS'; payload: Account[] }
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'UPDATE_ACCOUNT'; payload: Account }
  | { type: 'REMOVE_ACCOUNT'; payload: number }
  | { type: 'SET_ACCOUNTS_SUMMARY'; payload: FinanceState['accountsSummary'] }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'REMOVE_TRANSACTION'; payload: number }
  | { type: 'SET_TRANSACTIONS_SUMMARY'; payload: FinanceState['transactionsSummary'] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'REMOVE_CATEGORY'; payload: number };

const initialState: FinanceState = {
  accounts: [],
  transactions: [],
  categories: [],
  isLoading: false,
  accountsSummary: null,
  transactionsSummary: null,
};

const financeReducer = (state: FinanceState, action: FinanceAction): FinanceState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload };
    case 'ADD_ACCOUNT':
      return { ...state, accounts: [action.payload, ...state.accounts] };
    case 'UPDATE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.map(account =>
          account.id === action.payload.id ? action.payload : account
        ),
      };
    case 'REMOVE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.filter(account => account.id !== action.payload),
      };
    case 'SET_ACCOUNTS_SUMMARY':
      return { ...state, accountsSummary: action.payload };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case 'REMOVE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(transaction => transaction.id !== action.payload),
      };
    case 'SET_TRANSACTIONS_SUMMARY':
      return { ...state, transactionsSummary: action.payload };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'ADD_CATEGORY':
      return { ...state, categories: [action.payload, ...state.categories] };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(category =>
          category.id === action.payload.id ? action.payload : category
        ),
      };
    case 'REMOVE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(category => category.id !== action.payload),
      };
    default:
      return state;
  }
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(financeReducer, initialState);

  // Accounts
  const fetchAccounts = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await axios.get(API_ENDPOINTS.ACCOUNTS);
      dispatch({ type: 'SET_ACCOUNTS', payload: response.data });
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const createAccount = useCallback(async (accountData: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const response = await axios.post(API_ENDPOINTS.ACCOUNTS, accountData);
    const newAccount = response.data;
    dispatch({ type: 'ADD_ACCOUNT', payload: newAccount });
    return newAccount;
  }, []);

  const updateAccount = useCallback(async (id: number, accountData: Partial<Account>) => {
    const response = await axios.put(`${API_ENDPOINTS.ACCOUNTS}/${id}`, accountData);
    const updatedAccount = response.data;
    dispatch({ type: 'UPDATE_ACCOUNT', payload: updatedAccount });
    return updatedAccount;
  }, []);

  const deleteAccount = useCallback(async (id: number) => {
    await axios.delete(`${API_ENDPOINTS.ACCOUNTS}/${id}`);
    dispatch({ type: 'REMOVE_ACCOUNT', payload: id });
  }, []);

  const fetchAccountsSummary = useCallback(async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.ACCOUNTS_SUMMARY);
      dispatch({ type: 'SET_ACCOUNTS_SUMMARY', payload: response.data });
    } catch (error) {
      console.error('Error fetching accounts summary:', error);
    }
  }, []);

  // Transactions
  const fetchTransactions = useCallback(async (params: TransactionFilters = {}) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await axios.get(API_ENDPOINTS.TRANSACTIONS, { params });
      dispatch({ type: 'SET_TRANSACTIONS', payload: response.data.transactions || response.data });
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const createTransaction = useCallback(async (transactionData: CreateTransactionData) => {
    console.log('Enviando transacción:', transactionData);
    const response = await axios.post(API_ENDPOINTS.TRANSACTIONS, transactionData);
    const newTransaction = response.data;
    dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
    return newTransaction;
  }, []);

  const deleteTransaction = useCallback(async (id: number) => {
    await axios.delete(`${API_ENDPOINTS.TRANSACTIONS}/${id}`);
    dispatch({ type: 'REMOVE_TRANSACTION', payload: id });
  }, []);

  const fetchTransactionsSummary = useCallback(async (period = 'month') => {
    try {
      const response = await axios.get(API_ENDPOINTS.TRANSACTIONS_SUMMARY, {
        params: { period },
      });
      dispatch({ type: 'SET_TRANSACTIONS_SUMMARY', payload: response.data });
    } catch (error) {
      console.error('Error fetching transactions summary:', error);
    }
  }, []);

  // Categories
  const fetchCategories = useCallback(async (type?: 'income' | 'expense') => {
    try {
      const response = await axios.get(API_ENDPOINTS.CATEGORIES, {
        params: type ? { type } : {},
      });
      dispatch({ type: 'SET_CATEGORIES', payload: response.data });
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const createCategory = useCallback(async (categoryData: Omit<Category, 'id' | 'user_id' | 'created_at'>) => {
    const response = await axios.post(API_ENDPOINTS.CATEGORIES, categoryData);
    const newCategory = response.data;
    dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
    return newCategory;
  }, []);

  const updateCategory = useCallback(async (id: number, categoryData: Partial<Category>) => {
    const response = await axios.put(`${API_ENDPOINTS.CATEGORIES}/${id}`, categoryData);
    const updatedCategory = response.data;
    dispatch({ type: 'UPDATE_CATEGORY', payload: updatedCategory });
    return updatedCategory;
  }, []);

  const deleteCategory = useCallback(async (id: number) => {
    await axios.delete(`${API_ENDPOINTS.CATEGORIES}/${id}`);
    dispatch({ type: 'REMOVE_CATEGORY', payload: id });
  }, []);

  const value: FinanceContextType = {
    ...state,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    fetchAccountsSummary,
    fetchTransactions,
    createTransaction,
    deleteTransaction,
    fetchTransactionsSummary,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

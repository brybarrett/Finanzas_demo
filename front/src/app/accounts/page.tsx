'use client';

import { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Navbar from '@/components/layout/Navbar';
import { formatCurrency, CURRENCIES, DEFAULT_CURRENCY } from '@/utils/currencies';
import axios from 'axios';
import { API_ENDPOINTS } from '@/config/api';
import {
  PlusIcon,
  CreditCardIcon,
  PencilIcon,
  TrashIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

interface AccountFormData {
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'cash' | 'investment';
  balance: number;
  currency: string;
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
  locale: string;
}

export default function AccountsPage() {
  const {
    accounts,
    accountsSummary,
    fetchAccounts,
    fetchAccountsSummary,
    createAccount,
    updateAccount,
    deleteAccount,
    isLoading,
  } = useFinance();

  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [currencies, setCurrencies] = useState<Currency[]>(CURRENCIES);
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    type: 'checking',
    balance: 0,
    currency: DEFAULT_CURRENCY,
  });

  useEffect(() => {
    fetchAccounts();
    fetchAccountsSummary();
    loadCurrencies();
  }, [fetchAccounts, fetchAccountsSummary]);

  const loadCurrencies = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.CURRENCIES);
      if (response.data.currencies) {
        setCurrencies(response.data.currencies);
      }
    } catch (error) {
      console.error('Error loading currencies:', error);
      // Usar currencies por defecto si falla la carga
    }
  };

  const formatCurrencyAmount = (amount: number, currencyCode?: string) => {
    return formatCurrency(amount, currencyCode || DEFAULT_CURRENCY);
  };

  const getAccountTypeLabel = (type: string) => {
    const types = {
      checking: 'Cuenta Corriente',
      savings: 'Cuenta de Ahorros',
      credit: 'Tarjeta de Crédito',
      cash: 'Efectivo',
      investment: 'Inversión',
    };
    return types[type as keyof typeof types] || type;
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return '🏦';
      case 'savings':
        return '💰';
      case 'credit':
        return '💳';
      case 'cash':
        return '💵';
      case 'investment':
        return '📈';
      default:
        return '💳';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, formData);
      } else {
        await createAccount({
          ...formData,
          is_active: true,
        });
      }
      setShowModal(false);
      setEditingAccount(null);
      setFormData({ name: '', type: 'checking', balance: 0, currency: DEFAULT_CURRENCY });
      fetchAccounts();
      fetchAccountsSummary();
    } catch (error) {
      console.error('Error al guardar cuenta:', error);
    }
  };

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta cuenta?')) {
      try {
        await deleteAccount(id);
        fetchAccounts();
        fetchAccountsSummary();
      } catch (error) {
        console.error('Error al eliminar cuenta:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', type: 'checking', balance: 0, currency: DEFAULT_CURRENCY });
    setEditingAccount(null);
    setShowModal(false);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Cuentas</h1>
                <p className="mt-2 text-gray-600">
                  Administra tus cuentas bancarias, tarjetas y efectivo
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nueva Cuenta
              </button>
            </div>

            {/* Summary Cards */}
            {accountsSummary && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CreditCardIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Cuentas
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {accountsSummary.total_accounts}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <BanknotesIcon className="h-6 w-6 text-green-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Activos
                          </dt>
                          <dd className="text-lg font-medium text-green-600">
                            {formatCurrencyAmount(accountsSummary.total_assets || 0)}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CreditCardIcon className="h-6 w-6 text-red-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Pasivos
                          </dt>
                          <dd className="text-lg font-medium text-red-600">
                            {formatCurrencyAmount(accountsSummary.total_liabilities || 0)}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-500 to-purple-600 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">💎</span>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-blue-100 truncate">
                            Patrimonio Neto
                          </dt>
                          <dd className="text-lg font-medium text-white">
                            {formatCurrencyAmount(accountsSummary.net_worth || 0)}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Accounts List */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Tus Cuentas
                </h3>

                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : accounts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {accounts.map((account) => (
                      <div
                        key={account.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">
                              {getAccountIcon(account.type)}
                            </span>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                {account.name}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {getAccountTypeLabel(account.type)}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(account)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(account.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg font-semibold ${
                              account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {formatCurrencyAmount(account.balance, account.currency)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No hay cuentas
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Comienza agregando tu primera cuenta bancaria.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Nueva Cuenta
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nombre de la cuenta
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Banco Nacional - Ahorros"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tipo de cuenta
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="checking" className="text-gray-900 bg-white">Cuenta Corriente</option>
                      <option value="savings" className="text-gray-900 bg-white">Cuenta de Ahorros</option>
                      <option value="credit" className="text-gray-900 bg-white">Tarjeta de Crédito</option>
                      <option value="cash" className="text-gray-900 bg-white">Efectivo</option>
                      <option value="investment" className="text-gray-900 bg-white">Inversión</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Balance inicial
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.balance}
                      onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Moneda
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {currencies.map((currency) => (
                        <option 
                          key={currency.code} 
                          value={currency.code}
                          className="text-gray-900 bg-white"
                        >
                          {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      {editingAccount ? 'Actualizar' : 'Crear'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

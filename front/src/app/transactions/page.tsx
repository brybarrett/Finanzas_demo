'use client';

import { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Navbar from '@/components/layout/Navbar';
import {
  PlusIcon,
  BanknotesIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsUpDownIcon,
  TrashIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface TransactionFormData {
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

export default function TransactionsPage() {
  const {
    transactions,
    accounts,
    categories,
    transactionsSummary,
    fetchTransactions,
    fetchAccounts,
    fetchCategories,
    fetchTransactionsSummary,
    createTransaction,
    deleteTransaction,
    isLoading,
  } = useFinance();

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<TransactionFormData>({
    description: '',
    amount: 0,
    type: 'expense',
    account_id: 0,
    category_name: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [filters, setFilters] = useState({
    account_id: '',
    category_id: '',
    type: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
    fetchCategories();
    fetchTransactionsSummary();
  }, [fetchTransactions, fetchAccounts, fetchCategories, fetchTransactionsSummary]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowUpIcon className="h-5 w-5 text-green-600" />;
      case 'expense':
        return <ArrowDownIcon className="h-5 w-5 text-red-600" />;
      case 'transfer':
        return <ArrowsUpDownIcon className="h-5 w-5 text-blue-600" />;
      default:
        return <BanknotesIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validar campos requeridos
      if (!formData.description || !formData.amount || !formData.account_id) {
        alert('Por favor completa todos los campos requeridos');
        return;
      }

      // Preparar los datos de la transacción
      const transactionData = {
        ...formData,
        amount: Number(formData.amount), // Asegurar que sea número
        account_id: Number(formData.account_id), // Asegurar que sea número
        category_id: formData.category_id ? Number(formData.category_id) : undefined,
        to_account_id: formData.to_account_id ? Number(formData.to_account_id) : undefined,
        // Si no hay category_id pero sí category_name, enviar el nombre para crear nueva categoría
        category_name: formData.category_name && !formData.category_id ? formData.category_name : undefined,
      };
      
      console.log('Datos a enviar:', transactionData);
      
      await createTransaction(transactionData);
      setShowModal(false);
      resetForm();
      fetchTransactions();
      fetchTransactionsSummary();
      fetchCategories(); // Refrescar categorías para incluir la nueva
    } catch (error: any) {
      console.error('Error al crear transacción:', error);
      alert('Error al crear la transacción: ' + (error.response?.data?.message || error.message));
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: 0,
      type: 'expense',
      account_id: 0,
      category_name: '',
      date: new Date().toISOString().split('T')[0],
    });
    setShowModal(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
      try {
        await deleteTransaction(id);
        fetchTransactions();
        fetchTransactionsSummary();
      } catch (error) {
        console.error('Error al eliminar transacción:', error);
      }
    }
  };

  const applyFilters = () => {
    const filterParams: any = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value) filterParams[key] = value;
    });
    fetchTransactions(filterParams);
  };

  const clearFilters = () => {
    setFilters({
      account_id: '',
      category_id: '',
      type: '',
      start_date: '',
      end_date: '',
    });
    fetchTransactions();
  };

  const filteredCategories = categories.filter(
    (cat) => formData.type === 'transfer' || cat.type === formData.type
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Transacciones</h1>
                <p className="mt-2 text-gray-600">
                  Registra y gestiona tus ingresos, gastos y transferencias
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nueva Transacción
              </button>
            </div>

            {/* Summary Cards */}
            {transactionsSummary && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <ArrowUpIcon className="h-6 w-6 text-green-400 mr-3" />
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Ingresos del Mes
                        </dt>
                        <dd className="text-lg font-medium text-green-600">
                          {formatCurrency(transactionsSummary.total_income || 0)}
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <ArrowDownIcon className="h-6 w-6 text-red-400 mr-3" />
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Gastos del Mes
                        </dt>
                        <dd className="text-lg font-medium text-red-600">
                          {formatCurrency(transactionsSummary.total_expenses || 0)}
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <BanknotesIcon className="h-6 w-6 text-blue-400 mr-3" />
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Balance del Mes
                        </dt>
                        <dd className={`text-lg font-medium ${
                          (transactionsSummary.net_income || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(transactionsSummary.net_income || 0)}
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📊</span>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Total Transacciones
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {transactionsSummary.total_transactions || 0}
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
                  <div className="flex space-x-3">
                    <button
                      onClick={applyFilters}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <FunnelIcon className="h-4 w-4 mr-2" />
                      Aplicar
                    </button>
                    <button
                      onClick={clearFilters}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cuenta</label>
                    <select
                      value={filters.account_id}
                      onChange={(e) => setFilters({ ...filters, account_id: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 text-sm"
                    >
                      <option value="" className="text-gray-900 bg-white">Todas las cuentas</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id} className="text-gray-900 bg-white">
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Categoría</label>
                    <select
                      value={filters.category_id}
                      onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 text-sm"
                    >
                      <option value="" className="text-gray-900 bg-white">Todas las categorías</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id} className="text-gray-900 bg-white">
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 text-sm"
                    >
                      <option value="" className="text-gray-900 bg-white">Todos los tipos</option>
                      <option value="income" className="text-gray-900 bg-white">Ingresos</option>
                      <option value="expense" className="text-gray-900 bg-white">Gastos</option>
                      <option value="transfer" className="text-gray-900 bg-white">Transferencias</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha desde</label>
                    <input
                      type="date"
                      value={filters.start_date}
                      onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha hasta</label>
                    <input
                      type="date"
                      value={filters.end_date}
                      onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Lista de Transacciones
                </h3>

                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between py-3 px-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center flex-1">
                          <div className="mr-4">
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-gray-900">
                                {transaction.description}
                              </h4>
                              <p className={`text-lg font-semibold ${
                                transaction.type === 'income' 
                                  ? 'text-green-600' 
                                  : transaction.type === 'expense'
                                  ? 'text-red-600'
                                  : 'text-blue-600'
                              }`}>
                                {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                                {formatCurrency(transaction.amount)}
                              </p>
                            </div>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <span>{transaction.account_name}</span>
                              {transaction.category_name && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span 
                                    className="px-2 py-1 rounded-full text-white"
                                    style={{ backgroundColor: transaction.category_color }}
                                  >
                                    {transaction.category_name}
                                  </span>
                                </>
                              )}
                              <span className="mx-2">•</span>
                              <span>{new Date(transaction.date).toLocaleDateString()}</span>
                              {transaction.to_account_name && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span>→ {transaction.to_account_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="ml-4 text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No hay transacciones
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Comienza registrando tu primera transacción.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Nueva Transacción
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
                  Nueva Transacción
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Descripción
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Compra de almuerzo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tipo
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="income" className="text-gray-900 bg-white">Ingreso</option>
                      <option value="expense" className="text-gray-900 bg-white">Gasto</option>
                      <option value="transfer" className="text-gray-900 bg-white">Transferencia</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Monto
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.amount || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({ ...formData, amount: value === '' ? 0 : parseFloat(value) });
                      }}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Cuenta
                    </label>
                    <select
                      required
                      value={formData.account_id}
                      onChange={(e) => setFormData({ ...formData, account_id: parseInt(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="" className="text-gray-900 bg-white">Selecciona una cuenta</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id} className="text-gray-900 bg-white">
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.type !== 'transfer' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Categoría
                      </label>
                      <input
                        type="text"
                        list="categories-list"
                        value={formData.category_name || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Buscar si la categoría existe
                          const existingCategory = filteredCategories.find(cat => cat.name === value);
                          setFormData({ 
                            ...formData, 
                            category_name: value,
                            category_id: existingCategory ? existingCategory.id : undefined 
                          });
                        }}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Selecciona o escribe una categoría"
                      />
                      <datalist id="categories-list">
                        {filteredCategories.map((category) => (
                          <option key={category.id} value={category.name} />
                        ))}
                      </datalist>
                      <p className="mt-1 text-xs text-gray-500">
                        Puedes seleccionar una categoría existente o escribir una nueva
                      </p>
                    </div>
                  )}

                  {formData.type === 'transfer' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Cuenta destino
                      </label>
                      <select
                        value={formData.to_account_id || ''}
                        onChange={(e) => setFormData({ ...formData, to_account_id: parseInt(e.target.value) || undefined })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="" className="text-gray-900 bg-white">Selecciona cuenta destino</option>
                        {accounts.filter(acc => acc.id !== formData.account_id).map((account) => (
                          <option key={account.id} value={account.id} className="text-gray-900 bg-white">
                            {account.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Fecha
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Notas (opcional)
                    </label>
                    <textarea
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Notas adicionales..."
                    />
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
                      Crear Transacción
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

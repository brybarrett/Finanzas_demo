'use client';

import { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Navbar from '@/components/layout/Navbar';
import {
  ChartBarIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function StatsPage() {
  const {
    transactions,
    categories,
    transactionsSummary,
    fetchTransactions,
    fetchCategories,
    fetchTransactionsSummary,
    isLoading,
  } = useFinance();

  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [statsData, setStatsData] = useState<any>(null);

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
    fetchTransactionsSummary();
  }, [fetchTransactions, fetchCategories, fetchTransactionsSummary]);

  useEffect(() => {
    if (transactions.length > 0) {
      generateStatsData();
    }
  }, [transactions, categories, selectedPeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
    }).format(amount);
  };

  const generateStatsData = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filtrar transacciones según el período
    let filteredTransactions = transactions;
    
    if (selectedPeriod === 'monthly') {
      filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      });
    } else if (selectedPeriod === 'yearly') {
      filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getFullYear() === currentYear;
      });
    }

    // Datos para gráfico de líneas (ingresos vs gastos por día)
    const dailyData = generateDailyData(filteredTransactions);

    // Datos para gráfico de barras (categorías)
    const categoryData = generateCategoryData(filteredTransactions);

    // Datos para gráfico circular (distribución de gastos)
    const expenseDistribution = generateExpenseDistribution(filteredTransactions);

    // Tendencias
    const trends = calculateTrends(filteredTransactions);

    setStatsData({
      dailyData,
      categoryData,
      expenseDistribution,
      trends,
    });
  };

  const generateDailyData = (transactionList: any[]) => {
    const dailyStats: { [key: string]: { income: number; expense: number } } = {};

    // Inicializar los últimos 30 días
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dailyStats[dateKey] = { income: 0, expense: 0 };
    }

    // Agrupar transacciones por día
    transactionList.forEach(transaction => {
      const dateKey = transaction.date.split('T')[0];
      if (dailyStats[dateKey]) {
        if (transaction.type === 'income') {
          dailyStats[dateKey].income += transaction.amount;
        } else if (transaction.type === 'expense') {
          dailyStats[dateKey].expense += transaction.amount;
        }
      }
    });

    const labels = Object.keys(dailyStats).map(date => 
      new Date(date).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })
    );

    return {
      labels,
      datasets: [
        {
          label: 'Ingresos',
          data: Object.values(dailyStats).map(day => day.income),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.1,
        },
        {
          label: 'Gastos',
          data: Object.values(dailyStats).map(day => day.expense),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.1,
        },
      ],
    };
  };

  const generateCategoryData = (transactionList: any[]) => {
    const categoryStats: { [key: string]: { income: number; expense: number; color: string } } = {};

    // Inicializar categorías
    categories.forEach(category => {
      categoryStats[category.name] = {
        income: 0,
        expense: 0,
        color: category.color || '#6B7280',
      };
    });

    // Agrupar por categoría
    transactionList.forEach(transaction => {
      if (transaction.category_name && categoryStats[transaction.category_name]) {
        if (transaction.type === 'income') {
          categoryStats[transaction.category_name].income += transaction.amount;
        } else if (transaction.type === 'expense') {
          categoryStats[transaction.category_name].expense += transaction.amount;
        }
      }
    });

    const labels = Object.keys(categoryStats).filter(category => 
      categoryStats[category].income > 0 || categoryStats[category].expense > 0
    );

    return {
      labels,
      datasets: [
        {
          label: 'Ingresos',
          data: labels.map(category => categoryStats[category].income),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
        },
        {
          label: 'Gastos',
          data: labels.map(category => categoryStats[category].expense),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
        },
      ],
    };
  };

  const generateExpenseDistribution = (transactionList: any[]) => {
    const expensesByCategory: { [key: string]: { amount: number; color: string } } = {};

    // Agrupar gastos por categoría
    transactionList
      .filter(t => t.type === 'expense' && t.category_name)
      .forEach(transaction => {
        if (!expensesByCategory[transaction.category_name]) {
          expensesByCategory[transaction.category_name] = {
            amount: 0,
            color: transaction.category_color || '#6B7280',
          };
        }
        expensesByCategory[transaction.category_name].amount += transaction.amount;
      });

    const labels = Object.keys(expensesByCategory);
    const data = labels.map(category => expensesByCategory[category].amount);
    const backgroundColor = labels.map(category => expensesByCategory[category].color);

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    };
  };

  const calculateTrends = (transactionList: any[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const currentYear = now.getFullYear();
    const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthTransactions = transactionList.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const previousMonthTransactions = transactionList.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === previousMonth && date.getFullYear() === previousMonthYear;
    });

    const currentIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const previousIncome = previousMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const previousExpenses = previousMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const incomeChange = previousIncome > 0 ? ((currentIncome - previousIncome) / previousIncome) * 100 : 0;
    const expenseChange = previousExpenses > 0 ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 : 0;

    return {
      incomeChange,
      expenseChange,
      currentIncome,
      currentExpenses,
      previousIncome,
      previousExpenses,
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          },
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${formatCurrency(context.raw)}`;
          },
        },
      },
    },
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
                <h1 className="text-3xl font-bold text-gray-900">Estadísticas</h1>
                <p className="mt-2 text-gray-600">
                  Analiza tus patrones financieros y tendencias
                </p>
              </div>
              <div>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="monthly">Este mes</option>
                  <option value="yearly">Este año</option>
                  <option value="all">Todo el tiempo</option>
                </select>
              </div>
            </div>

            {/* Summary Cards */}
            {transactionsSummary && statsData?.trends && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <ArrowTrendingUpIcon className="h-6 w-6 text-green-400 mr-3" />
                      <div className="flex-1">
                        <dt className="text-sm font-medium text-gray-500">
                          Ingresos del Mes
                        </dt>
                        <dd className="text-lg font-medium text-green-600">
                          {formatCurrency(statsData.trends.currentIncome)}
                        </dd>
                        <div className={`text-xs ${
                          statsData.trends.incomeChange >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {statsData.trends.incomeChange >= 0 ? '↗' : '↘'} 
                          {Math.abs(statsData.trends.incomeChange).toFixed(1)}% vs mes anterior
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <ArrowTrendingDownIcon className="h-6 w-6 text-red-400 mr-3" />
                      <div className="flex-1">
                        <dt className="text-sm font-medium text-gray-500">
                          Gastos del Mes
                        </dt>
                        <dd className="text-lg font-medium text-red-600">
                          {formatCurrency(statsData.trends.currentExpenses)}
                        </dd>
                        <div className={`text-xs ${
                          statsData.trends.expenseChange <= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {statsData.trends.expenseChange >= 0 ? '↗' : '↘'} 
                          {Math.abs(statsData.trends.expenseChange).toFixed(1)}% vs mes anterior
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-6 w-6 text-blue-400 mr-3" />
                      <div className="flex-1">
                        <dt className="text-sm font-medium text-gray-500">
                          Balance del Mes
                        </dt>
                        <dd className={`text-lg font-medium ${
                          (statsData.trends.currentIncome - statsData.trends.currentExpenses) >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {formatCurrency(statsData.trends.currentIncome - statsData.trends.currentExpenses)}
                        </dd>
                        <div className="text-xs text-gray-500">
                          Ahorro estimado
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <CalendarIcon className="h-6 w-6 text-purple-400 mr-3" />
                      <div className="flex-1">
                        <dt className="text-sm font-medium text-gray-500">
                          Promedio Diario
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {formatCurrency(statsData.trends.currentExpenses / new Date().getDate())}
                        </dd>
                        <div className="text-xs text-gray-500">
                          Gasto promedio por día
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
              </div>
            ) : statsData ? (
              <div className="space-y-8">
                {/* Gráfico de líneas */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Tendencia Diaria (Últimos 30 días)
                    </h3>
                    <div style={{ height: '400px' }}>
                      <Line data={statsData.dailyData} options={chartOptions} />
                    </div>
                  </div>
                </div>

                {/* Gráficos lado a lado */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Gráfico de barras */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Ingresos y Gastos por Categoría
                      </h3>
                      <div style={{ height: '300px' }}>
                        <Bar data={statsData.categoryData} options={chartOptions} />
                      </div>
                    </div>
                  </div>

                  {/* Gráfico circular */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Distribución de Gastos
                      </h3>
                      <div style={{ height: '300px' }}>
                        {statsData.expenseDistribution.labels.length > 0 ? (
                          <Doughnut data={statsData.expenseDistribution} options={pieOptions} />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            No hay datos de gastos para mostrar
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabla de resumen por categorías */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Resumen por Categorías
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Categoría
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ingresos
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Gastos
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Balance
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {categories.map((category) => {
                            const categoryTransactions = transactions.filter(
                              t => t.category_name === category.name
                            );
                            const income = categoryTransactions
                              .filter(t => t.type === 'income')
                              .reduce((sum, t) => sum + t.amount, 0);
                            const expenses = categoryTransactions
                              .filter(t => t.type === 'expense')
                              .reduce((sum, t) => sum + t.amount, 0);
                            const balance = income - expenses;

                            if (income === 0 && expenses === 0) return null;

                            return (
                              <tr key={category.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div 
                                      className="w-4 h-4 rounded mr-3"
                                      style={{ backgroundColor: category.color }}
                                    ></div>
                                    <span className="text-sm font-medium text-gray-900">
                                      {category.name}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                  {income > 0 ? formatCurrency(income) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                  {expenses > 0 ? formatCurrency(expenses) : '-'}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                                  balance >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {formatCurrency(balance)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No hay datos suficientes
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Agrega algunas transacciones para ver estadísticas.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

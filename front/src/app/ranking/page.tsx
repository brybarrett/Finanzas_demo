'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Navbar from '@/components/layout/Navbar';
import {
  TrophyIcon,
  StarIcon,
  UserIcon,
  ChartBarIcon,
  FireIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import {
  TrophyIcon as TrophyIconSolid,
  StarIcon as StarIconSolid,
} from '@heroicons/react/24/solid';

interface UserRanking {
  id: number;
  username: string;
  email: string;
  score: number;
  rank: number;
  badge_level: string;
}

export default function RankingPage() {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<UserRanking[]>([]);
  const [userRanking, setUserRanking] = useState<UserRanking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  useEffect(() => {
    fetchRankings();
  }, [selectedPeriod]);

  const fetchRankings = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:3001/api/users/ranking?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRankings(data.rankings || []);
        setUserRanking(data.userRanking);
      }
    } catch (error) {
      console.error('Error al obtener rankings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgeInfo = (badgeLevel: string) => {
    switch (badgeLevel) {
      case 'bronze':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', name: 'Bronce', icon: AcademicCapIcon };
      case 'silver':
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', name: 'Plata', icon: StarIcon };
      case 'gold':
        return { color: 'text-yellow-500', bgColor: 'bg-yellow-50', name: 'Oro', icon: TrophyIcon };
      case 'platinum':
        return { color: 'text-purple-600', bgColor: 'bg-purple-100', name: 'Platino', icon: FireIcon };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', name: 'Sin nivel', icon: UserIcon };
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <TrophyIconSolid className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <TrophyIconSolid className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <TrophyIconSolid className="h-6 w-6 text-yellow-600" />;
    return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
  };

  const getScoreDescription = (score: number) => {
    if (score >= 900) return "¡Excelente gestión financiera!";
    if (score >= 750) return "Muy buena administración";
    if (score >= 600) return "Buen manejo financiero";
    if (score >= 400) return "Gestión promedio";
    if (score >= 200) return "Necesitas mejorar";
    return "Comienza tu camino financiero";
  };

  const getMotivationalMessage = (rank: number, total: number) => {
    const percentage = (rank / total) * 100;
    
    if (percentage <= 10) return "¡Estás en el top 10%! ¡Increíble!";
    if (percentage <= 25) return "¡Excelente! Estás en el top 25%";
    if (percentage <= 50) return "¡Bien! Estás en la mitad superior";
    if (percentage <= 75) return "Vas por buen camino, ¡sigue así!";
    return "¡Cada paso cuenta! Sigue mejorando";
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
                <h1 className="text-3xl font-bold text-gray-900">Ranking Financiero</h1>
                <p className="mt-2 text-gray-600">
                  Compite con otros usuarios y mejora tus hábitos financieros
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
                  <option value="all-time">Histórico</option>
                </select>
              </div>
            </div>

            {/* User Stats Card */}
            {userRanking && (
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg mb-8">
                <div className="px-6 py-8 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-white bg-opacity-20 rounded-full p-3">
                        <UserIcon className="h-8 w-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{user?.username}</h2>
                        <p className="text-blue-100">Tu posición actual</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end space-x-2 mb-2">
                        {getRankIcon(userRanking.rank)}
                        <span className="text-3xl font-bold">#{userRanking.rank}</span>
                      </div>
                      <div className="text-blue-100">de {rankings.length} usuarios</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white bg-opacity-10 rounded-lg p-4">
                      <div className="flex items-center">
                        <StarIconSolid className="h-6 w-6 mr-2" />
                        <div>
                          <div className="text-2xl font-bold">{userRanking.score}</div>
                          <div className="text-blue-100 text-sm">Puntuación</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white bg-opacity-10 rounded-lg p-4">
                      <div className="flex items-center">
                        {(() => {
                          const badgeInfo = getBadgeInfo(userRanking.badge_level);
                          const BadgeIcon = badgeInfo.icon;
                          return <BadgeIcon className="h-6 w-6 mr-2" />;
                        })()}
                        <div>
                          <div className="text-lg font-bold">{getBadgeInfo(userRanking.badge_level).name}</div>
                          <div className="text-blue-100 text-sm">Nivel actual</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white bg-opacity-10 rounded-lg p-4">
                      <div className="flex items-center">
                        <ChartBarIcon className="h-6 w-6 mr-2" />
                        <div>
                          <div className="text-sm font-medium">{getMotivationalMessage(userRanking.rank, rankings.length)}</div>
                          <div className="text-blue-100 text-sm">{getScoreDescription(userRanking.score)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Score Guide */}
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  ¿Cómo se calcula tu puntuación?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-blue-600 font-semibold mb-2">Balance Positivo</div>
                    <div className="text-sm text-gray-600">
                      +50 puntos por mantener balance positivo mensual
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-green-600 font-semibold mb-2">Ahorro Regular</div>
                    <div className="text-sm text-gray-600">
                      +30 puntos por ahorrar más del 20% de ingresos
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-purple-600 font-semibold mb-2">Consistencia</div>
                    <div className="text-sm text-gray-600">
                      +25 puntos por registrar transacciones diariamente
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-yellow-600 font-semibold mb-2">Control de Gastos</div>
                    <div className="text-sm text-gray-600">
                      +20 puntos por mantener gastos bajo presupuesto
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rankings */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                  Tabla de Posiciones
                </h3>

                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Cargando rankings...</p>
                  </div>
                ) : rankings.length > 0 ? (
                  <div className="space-y-3">
                    {rankings.slice(0, 20).map((ranking, index) => {
                      const badgeInfo = getBadgeInfo(ranking.badge_level);
                      const BadgeIcon = badgeInfo.icon;
                      const isCurrentUser = ranking.id === user?.id;
                      
                      return (
                        <div
                          key={ranking.id}
                          className={`flex items-center justify-between py-4 px-6 rounded-lg border-2 transition-all ${
                            isCurrentUser 
                              ? 'border-blue-300 bg-blue-50 shadow-md' 
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0 w-12 text-center">
                              {getRankIcon(ranking.rank)}
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-full ${badgeInfo.bgColor}`}>
                                <BadgeIcon className={`h-5 w-5 ${badgeInfo.color}`} />
                              </div>
                              <div>
                                <div className={`font-medium ${
                                  isCurrentUser ? 'text-blue-900' : 'text-gray-900'
                                }`}>
                                  {ranking.username}
                                  {isCurrentUser && (
                                    <span className="ml-2 text-blue-600 text-sm">(Tú)</span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Nivel {badgeInfo.name}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className={`text-xl font-bold ${
                              isCurrentUser ? 'text-blue-600' : 'text-gray-900'
                            }`}>
                              {ranking.score}
                            </div>
                            <div className="text-sm text-gray-500">puntos</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No hay rankings disponibles
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Sé el primero en aparecer en el ranking registrando transacciones.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tips Section */}
            <div className="mt-8 bg-gradient-to-r from-green-400 to-green-600 rounded-lg shadow-lg">
              <div className="px-6 py-8 text-white">
                <h3 className="text-xl font-bold mb-4">💡 Consejos para Mejorar tu Puntuación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <span className="text-green-200">✓</span>
                      <span className="text-sm">Registra todas tus transacciones diariamente</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-green-200">✓</span>
                      <span className="text-sm">Mantén un balance positivo cada mes</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-green-200">✓</span>
                      <span className="text-sm">Ahorra al menos el 20% de tus ingresos</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <span className="text-green-200">✓</span>
                      <span className="text-sm">Categoriza correctamente tus gastos</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-green-200">✓</span>
                      <span className="text-sm">Evita gastos innecesarios</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-green-200">✓</span>
                      <span className="text-sm">Revisa tus estadísticas regularmente</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

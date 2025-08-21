'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Navbar from '@/components/layout/Navbar';
import {
  UserIcon,
  EnvelopeIcon,
  KeyIcon,
  StarIcon,
  TrophyIcon,
  ChartBarIcon,
  CogIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  score: number;
  rank: number;
  badge_level: string;
  created_at: string;
}

interface ProfileFormData {
  username: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3001/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          username: data.username,
          email: data.email,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      console.error('Error al obtener perfil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3001/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
        }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        updateUser(updatedProfile);
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Error al actualizar perfil' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar perfil' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3001/api/users/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      if (response.ok) {
        setShowPasswordForm(false);
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setMessage({ type: 'success', text: 'Contraseña cambiada correctamente' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Error al cambiar contraseña' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al cambiar contraseña' });
    }
  };

  const getBadgeInfo = (badgeLevel: string) => {
    switch (badgeLevel) {
      case 'bronze':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', name: 'Bronce' };
      case 'silver':
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', name: 'Plata' };
      case 'gold':
        return { color: 'text-yellow-500', bgColor: 'bg-yellow-50', name: 'Oro' };
      case 'platinum':
        return { color: 'text-purple-600', bgColor: 'bg-purple-100', name: 'Platino' };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', name: 'Sin nivel' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
              <p className="mt-2 text-gray-600">
                Gestiona tu información personal y configuración de cuenta
              </p>
            </div>

            {/* Message Alert */}
            {message.text && (
              <div className={`mb-6 p-4 rounded-md ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando perfil...</p>
              </div>
            ) : profile ? (
              <div className="space-y-8">
                {/* Profile Stats */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg">
                  <div className="px-6 py-8 text-white">
                    <div className="flex items-center space-x-6">
                      <div className="bg-white bg-opacity-20 rounded-full p-6">
                        <UserIcon className="h-12 w-12" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-3xl font-bold">{profile.username}</h2>
                        <p className="text-blue-100">{profile.email}</p>
                        <p className="text-blue-100 text-sm mt-1">
                          Miembro desde {formatDate(profile.created_at)}
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold">{profile.score}</div>
                        <div className="text-blue-100">Puntos</div>
                      </div>
                    </div>
                    
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white bg-opacity-10 rounded-lg p-4">
                        <div className="flex items-center">
                          <TrophyIcon className="h-6 w-6 mr-3" />
                          <div>
                            <div className="text-2xl font-bold">#{profile.rank}</div>
                            <div className="text-blue-100 text-sm">Posición Global</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white bg-opacity-10 rounded-lg p-4">
                        <div className="flex items-center">
                          <StarIcon className="h-6 w-6 mr-3" />
                          <div>
                            <div className="text-lg font-bold">{getBadgeInfo(profile.badge_level).name}</div>
                            <div className="text-blue-100 text-sm">Nivel Actual</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white bg-opacity-10 rounded-lg p-4">
                        <div className="flex items-center">
                          <ChartBarIcon className="h-6 w-6 mr-3" />
                          <div>
                            <div className="text-lg font-bold">Activo</div>
                            <div className="text-blue-100 text-sm">Estado</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Information */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Información Personal
                      </h3>
                      <button
                        onClick={() => {
                          setIsEditing(!isEditing);
                          if (isEditing) {
                            setFormData({
                              username: profile.username,
                              email: profile.email,
                              currentPassword: '',
                              newPassword: '',
                              confirmPassword: '',
                            });
                          }
                        }}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <CogIcon className="h-4 w-4 mr-2" />
                        {isEditing ? 'Cancelar' : 'Editar'}
                      </button>
                    </div>

                    {isEditing ? (
                      <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Nombre de usuario
                          </label>
                          <div className="mt-1 relative">
                            <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              required
                              value={formData.username}
                              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                              className="pl-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <div className="mt-1 relative">
                            <EnvelopeIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                              type="email"
                              required
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className="pl-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                          >
                            Guardar Cambios
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Nombre de usuario</dt>
                            <dd className="text-sm text-gray-900">{profile.username}</dd>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                            <dd className="text-sm text-gray-900">{profile.email}</dd>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Security Settings */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Configuración de Seguridad
                      </h3>
                      <button
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <KeyIcon className="h-4 w-4 mr-2" />
                        Cambiar Contraseña
                      </button>
                    </div>

                    {showPasswordForm && (
                      <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Contraseña actual
                          </label>
                          <div className="mt-1 relative">
                            <KeyIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                              type={showCurrentPassword ? 'text' : 'password'}
                              required
                              value={formData.currentPassword}
                              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                              className="pl-10 pr-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                              {showCurrentPassword ? (
                                <EyeSlashIcon className="h-4 w-4" />
                              ) : (
                                <EyeIcon className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Nueva contraseña
                          </label>
                          <div className="mt-1 relative">
                            <KeyIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              required
                              minLength={6}
                              value={formData.newPassword}
                              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                              className="pl-10 pr-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                              {showNewPassword ? (
                                <EyeSlashIcon className="h-4 w-4" />
                              ) : (
                                <EyeIcon className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Confirmar nueva contraseña
                          </label>
                          <div className="mt-1 relative">
                            <KeyIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                              type="password"
                              required
                              value={formData.confirmPassword}
                              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                              className="pl-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setShowPasswordForm(false);
                              setFormData({
                                ...formData,
                                currentPassword: '',
                                newPassword: '',
                                confirmPassword: '',
                              });
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                          >
                            Cambiar Contraseña
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                {/* Badge Progress */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Progreso de Insignias
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="bg-yellow-100 p-2 rounded-full mr-3">
                            <span className="text-yellow-600">🥉</span>
                          </div>
                          <div>
                            <div className="font-medium">Bronce</div>
                            <div className="text-sm text-gray-500">0 - 200 puntos</div>
                          </div>
                        </div>
                        <div className={profile.score >= 200 ? 'text-green-600' : 'text-gray-400'}>
                          {profile.score >= 200 ? '✓' : '○'}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="bg-gray-100 p-2 rounded-full mr-3">
                            <span className="text-gray-600">🥈</span>
                          </div>
                          <div>
                            <div className="font-medium">Plata</div>
                            <div className="text-sm text-gray-500">200 - 500 puntos</div>
                          </div>
                        </div>
                        <div className={profile.score >= 500 ? 'text-green-600' : 'text-gray-400'}>
                          {profile.score >= 500 ? '✓' : '○'}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="bg-yellow-50 p-2 rounded-full mr-3">
                            <span className="text-yellow-500">🥇</span>
                          </div>
                          <div>
                            <div className="font-medium">Oro</div>
                            <div className="text-sm text-gray-500">500 - 800 puntos</div>
                          </div>
                        </div>
                        <div className={profile.score >= 800 ? 'text-green-600' : 'text-gray-400'}>
                          {profile.score >= 800 ? '✓' : '○'}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="bg-purple-100 p-2 rounded-full mr-3">
                            <span className="text-purple-600">💎</span>
                          </div>
                          <div>
                            <div className="font-medium">Platino</div>
                            <div className="text-sm text-gray-500">800+ puntos</div>
                          </div>
                        </div>
                        <div className={profile.score >= 800 ? 'text-green-600' : 'text-gray-400'}>
                          {profile.score >= 800 ? '✓' : '○'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Error al cargar perfil
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  No se pudo cargar la información del perfil.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

import { useState, useEffect } from 'react';
import { Smartphone, Tablet, Monitor, Users, Download, Bell, TrendingUp, MapPin, Globe } from 'lucide-react';
import axios from '../services/axiosConfig';
import toast from 'react-hot-toast';

export default function AdminPWA() {
  const [stats, setStats] = useState(null);
  const [installations, setInstallations] = useState([]);
  const [pushStats, setPushStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      
      const [statsRes, installRes, pushRes] = await Promise.all([
        axios.get('/pwa/admin/statistiques'),
        axios.get('/pwa/admin/installations'),
        axios.get('/pwa/admin/push-stats')
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }

      if (installRes.data.success) {
        setInstallations(installRes.data.installations);
      }

      if (pushRes.data.success) {
        setPushStats(pushRes.data.stats);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'mobile':
        return <Smartphone size={20} className="text-blue-600" />;
      case 'tablet':
        return <Tablet size={20} className="text-green-600" />;
      case 'desktop':
        return <Monitor size={20} className="text-purple-600" />;
      default:
        return <Globe size={20} className="text-gray-600" />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Download className="text-blue-600" size={32} />
          Analytics PWA & Push Notifications
        </h1>
        <p className="mt-2 text-gray-600">
          Suivi des installations PWA et des abonnements aux notifications push
        </p>
      </div>

      {/* Statistiques principales */}
      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total installations</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Download className="text-blue-600" size={40} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avec utilisateurs</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.avecUtilisateurs}</p>
                </div>
                <Users className="text-green-600" size={40} />
              </div>
            </div>

            {pushStats && (
              <>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Push subscribers</p>
                      <p className="text-3xl font-bold text-gray-900">{pushStats.total}</p>
                    </div>
                    <Bell className="text-purple-600" size={40} />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Utilisateurs push</p>
                      <p className="text-3xl font-bold text-gray-900">{pushStats.utilisateurs_uniques}</p>
                    </div>
                    <TrendingUp className="text-orange-600" size={40} />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Par type d'appareil */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Smartphone size={20} />
                Installations par appareil
              </h2>
              <div className="space-y-3">
                {stats.parDevice && stats.parDevice.length > 0 ? (
                  stats.parDevice.map((item) => (
                    <div key={item.device_type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(item.device_type)}
                        <span className="capitalize">{item.device_type || 'Inconnu'}</span>
                      </div>
                      <span className="font-semibold">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">Aucune donnée</p>
                )}
              </div>
            </div>

            {pushStats && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Bell size={20} />
                  Abonnements push par appareil
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone size={20} className="text-blue-600" />
                      <span>Mobile</span>
                    </div>
                    <span className="font-semibold">{pushStats.mobile}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tablet size={20} className="text-green-600" />
                      <span>Tablette</span>
                    </div>
                    <span className="font-semibold">{pushStats.tablet}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor size={20} className="text-purple-600" />
                      <span>Desktop</span>
                    </div>
                    <span className="font-semibold">{pushStats.desktop}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Top OS et Navigateurs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Top Systèmes d'exploitation</h2>
              <div className="space-y-2">
                {stats.parOS && stats.parOS.length > 0 ? (
                  stats.parOS.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span>{item.os}</span>
                      <span className="font-semibold">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">Aucune donnée</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Top Navigateurs</h2>
              <div className="space-y-2">
                {stats.parBrowser && stats.parBrowser.length > 0 ? (
                  stats.parBrowser.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span>{item.browser}</span>
                      <span className="font-semibold">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">Aucune donnée</p>
                )}
              </div>
            </div>
          </div>

          {/* Graphique installations récentes */}
          {stats.recentes && stats.recentes.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">Installations des 7 derniers jours</h2>
              <div className="space-y-2">
                {stats.recentes.map((item) => (
                  <div key={item.date} className="flex items-center justify-between">
                    <span>{new Date(item.date).toLocaleDateString('fr-FR')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(item.count / stats.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="font-semibold w-8 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Liste des installations */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Dernières installations (100)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Navigateur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {installations.map((install) => (
                <tr key={install.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(install.device_type)}
                      <span className="text-sm capitalize">{install.device_type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {install.email ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {install.prenom} {install.nom}
                        </div>
                        <div className="text-sm text-gray-500">{install.email}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Anonyme</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{install.os || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{install.browser || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      {install.ip_address || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(install.installation_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {install.is_active ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        Actif
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        Inactif
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

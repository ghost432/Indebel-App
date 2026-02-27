import { useState, useEffect } from 'react';
import { Eye, TrendingUp, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from './Card';
import { profileViewService } from '../services/profileViewService';

const ProfileViewsCard = () => {
  const [stats, setStats] = useState({
    totalViews: 0,
    periodViews: 0,
    dailyViews: [],
    recentViewers: []
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await profileViewService.getProfileViewStats(period);
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement stats vues:', error);
    } finally {
      setLoading(false);
    }
  };

  // Formater les données pour le graphe
  const chartData = stats.dailyViews.map(item => ({
    date: new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    vues: item.views
  }));

  if (loading) {
    return (
      <Card title="Vues du profil">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <div className="flex items-center justify-between w-full">
          <span>Vues du profil</span>
          <select 
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value={7}>7 jours</option>
            <option value={30}>30 jours</option>
            <option value={90}>90 jours</option>
          </select>
        </div>
      }
    >
      {/* Statistiques principales */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Vues totales</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalViews}</p>
            </div>
            <Eye className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{period} derniers jours</p>
              <p className="text-2xl font-bold text-green-600">{stats.periodViews}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Graphe des vues */}
      {chartData.length > 0 ? (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Évolution des vues</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '0.5rem'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="vues" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 mb-6">
          <Eye className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm">Aucune vue sur cette période</p>
        </div>
      )}

      {/* Derniers visiteurs */}
      {stats.recentViewers && stats.recentViewers.length > 0 && (
        <div>
          <div className="flex items-center mb-3">
            <Users className="h-4 w-4 text-gray-600 mr-2" />
            <h4 className="text-sm font-medium text-gray-700">Derniers visiteurs</h4>
          </div>
          <div className="space-y-2">
            {stats.recentViewers.map((viewer, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium mr-3">
                    {viewer.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{viewer.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{viewer.type}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(viewer.viewedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.recentViewers && stats.recentViewers.length === 0 && stats.totalViews === 0 && (
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">Votre profil n'a pas encore été consulté</p>
        </div>
      )}
    </Card>
  );
};

export default ProfileViewsCard;

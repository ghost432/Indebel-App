import { useState, useEffect } from 'react';
import { BarChart3, Eye, TrendingUp, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from './Card';
import PageLoader from './PageLoader';
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
        <PageLoader compact />
      </Card>
    );
  }

  return (
    <Card 
      className="overflow-hidden border border-[#2A4DEF]/10 bg-gradient-to-br from-white via-white to-[#082151]/5 shadow-xl shadow-[#082151]/5"
      title={
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#082151] text-white shadow-lg shadow-[#082151]/20">
              <BarChart3 className="h-5 w-5" />
            </span>
            <div>
              <span className="text-xl font-black text-[#082151]">Vues du profil</span>
              <p className="text-xs font-semibold text-slate-400">Performance de votre visibilité</p>
            </div>
          </div>
          <select 
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-[#2A4DEF]/30"
          >
            <option value={7}>7 jours</option>
            <option value={30}>30 jours</option>
            <option value={90}>90 jours</option>
          </select>
        </div>
      }
    >
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2">
        <div className="rounded-[22px] border border-[#2A4DEF]/10 bg-[#2A4DEF]/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Vues totales</p>
              <p className="mt-2 text-3xl font-black text-[#082151]">{stats.totalViews}</p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#2A4DEF] shadow-sm">
              <Eye className="h-6 w-6" />
            </span>
          </div>
        </div>
        <div className="rounded-[22px] border border-[#c02525]/10 bg-[#c02525]/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{period} derniers jours</p>
              <p className="mt-2 text-3xl font-black text-[#c02525]">{stats.periodViews}</p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#c02525] shadow-sm">
              <TrendingUp className="h-6 w-6" />
            </span>
          </div>
        </div>
      </div>

      {/* Graphe des vues */}
      {chartData.length > 0 ? (
        <div className="mb-6">
          <h4 className="text-sm font-black text-[#082151] mb-3">Évolution des vues</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
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
                  borderRadius: '1rem',
                  padding: '0.5rem'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="vues" 
                stroke="#2A4DEF" 
                strokeWidth={3}
                dot={{ fill: '#2A4DEF', r: 4 }}
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
            <Users className="h-4 w-4 text-[#2A4DEF] mr-2" />
            <h4 className="text-sm font-black text-[#082151]">Derniers visiteurs</h4>
          </div>
          <div className="space-y-2">
            {stats.recentViewers.map((viewer, index) => (
              <div 
                key={index}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 text-sm shadow-sm"
              >
                <div className="flex items-center">
                  <div className="h-9 w-9 rounded-full border-2 border-[#2A4DEF] bg-primary-100 flex items-center justify-center text-primary-600 font-bold mr-3 ring-2 ring-white">
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

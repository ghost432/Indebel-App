import { useState, useEffect } from 'react'
import PageLoader from '../components/PageLoader'
import { Users, Briefcase, FileText, TrendingUp, Calendar, Euro, CheckCircle, X } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import { userService } from '../services/userService'
import { jobService } from '../services/jobService'
import { applicationService } from '../services/applicationService'
import { adminStatsService } from '../services/adminStatsService'
import toast from 'react-hot-toast'

const AdminStats = () => {
  const [stats, setStats] = useState({
    users: { total_users: 0, total_freelancers: 0, total_employers: 0, total_admins: 0 },
    jobs: { total_jobs: 0, jobs_ouverts: 0, jobs_fermes: 0 },
    applications: { total_applications: 0, en_attente: 0, accepte: 0, refuse: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [applicationsByPeriod, setApplicationsByPeriod] = useState([])
  const [period, setPeriod] = useState('month')
  const [usersByCity, setUsersByCity] = useState([])
  const [extraStats, setExtraStats] = useState({
    devis: { total_devis: 0, devis_en_attente: 0, devis_valides: 0, devis_refuses: 0 },
    devisByCity: [],
    topPages: []
  })

  useEffect(() => {
    document.title = 'Statistiques - Admin - Indebel'
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const catchErr = (err) => { console.warn('Requête échouée:', err); return { data: {} }; };

      const [userStatsRes, jobStatsRes, appStatsRes] = await Promise.all([
        userService.getUserStats().catch(catchErr),
        jobService.getJobStats().catch(catchErr),
        applicationService.getApplicationStats().catch(catchErr)
      ]);

      const [appsByPeriodRes, usersByCityRes, extraStatsRes] = await Promise.all([
        applicationService.getApplicationsByPeriod(period).catch(catchErr),
        userService.getUserStatsByCity().catch(catchErr),
        adminStatsService.getExtraStats().catch(catchErr)
      ]);

      setStats({
        users: (userStatsRes.data?.data || userStatsRes.data),
        jobs: (jobStatsRes.data?.data || jobStatsRes.data),
        applications: (appStatsRes.data?.data || appStatsRes.data)
      })
      setApplicationsByPeriod((appsByPeriodRes.data?.data || appsByPeriodRes.data) || [])
      setUsersByCity((usersByCityRes.data?.data || usersByCityRes.data) || [])
      if ((extraStatsRes.data?.data || extraStatsRes.data)) {
        setExtraStats((extraStatsRes.data?.data || extraStatsRes.data))
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des statistiques')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!loading) {
      fetchApplicationsByPeriod()
    }
  }, [period])

  const fetchApplicationsByPeriod = async () => {
    try {
      const res = await applicationService.getApplicationsByPeriod(period)
      setApplicationsByPeriod((res.data?.data || res.data) || [])
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  // Données pour les graphiques
  const userChartData = usersByCity.map((city, index) => ({
    ville: city.ville,
    freelancers: city.freelancers,
    employers: city.employers,
    total: city.total
  }))

  const jobStatusData = [
    { name: 'Ouverts', count: stats.jobs.jobs_ouverts, color: '#10b981' },
    { name: 'Fermés', count: stats.jobs.jobs_fermes, color: '#ef4444' },
    { name: 'En cours', count: stats.jobs.jobs_en_cours || 0, color: '#f59e0b' }
  ]

  const devisStatusData = [
    { name: 'En attente', count: extraStats.devis.devis_en_attente, color: '#f59e0b' },
    { name: 'Validés', count: extraStats.devis.devis_valides, color: '#10b981' },
    { name: 'Refusés', count: extraStats.devis.devis_refuses, color: '#ef4444' }
  ]

  const devisByCityData = extraStats.devisByCity.map(city => ({
    ville: city.ville,
    total: city.total
  }))

  const applicationsByPeriodData = applicationsByPeriod.map(item => ({
    periode: item.periode,
    total: item.total
  }))

  const getPeriodLabel = () => {
    switch(period) {
      case 'day': return 'Jour'
      case 'week': return 'Semaine'
      case 'month': return 'Mois'
      default: return 'Mois'
    }
  }

  const monthlyData = [
    { mois: 'Jan', utilisateurs: 12, missions: 8, candidatures: 15 },
    { mois: 'Fév', utilisateurs: 19, missions: 12, candidatures: 22 },
    { mois: 'Mar', utilisateurs: 25, missions: 18, candidatures: 35 },
    { mois: 'Avr', utilisateurs: 32, missions: 24, candidatures: 48 },
    { mois: 'Mai', utilisateurs: 41, missions: 30, candidatures: 62 },
    { mois: 'Juin', utilisateurs: 48, missions: 35, candidatures: 75 }
  ]

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

  if (loading) {
    return <PageLoader fullScreen />
  }

  return (
    <div className="py-8">
      <div className="bg-[#082151] rounded-[24px] shadow-md p-6 md:p-8 mb-8 flex justify-between items-center relative overflow-hidden text-white border-0">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Statistiques</h1>
          <p className="text-slate-200 mt-1 text-sm md:text-base">Consultez l'activité et l'utilisation globale de la plateforme.</p>
        </div>
        <TrendingUp className="h-8 w-8 text-white relative z-10 hidden sm:block" />
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#2b4eef]/20 to-[#df6422]/20 rounded-full blur-3xl -mr-16 -mt-16 z-0 pointer-events-none"></div>
      </div>

      {/* Cards statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Utilisateurs"
          value={stats.users.total_users}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Missions"
          value={stats.jobs.total_jobs}
          icon={Briefcase}
          color="green"
        />
        <StatCard
          title="Candidatures"
          value={stats.applications.total_applications}
          icon={FileText}
          color="purple"
        />
        <StatCard
          title="Missions Ouvertes"
          value={stats.jobs.jobs_ouverts}
          icon={TrendingUp}
          color="yellow"
        />
      </div>
      
      {/* Cards statistiques supplémentaires (Devis) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Devis (Demandes)"
          value={extraStats.devis.total_devis}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Devis en attente"
          value={extraStats.devis.devis_en_attente}
          icon={TrendingUp}
          color="yellow"
        />
        <StatCard
          title="Devis Validés"
          value={extraStats.devis.devis_valides}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Devis Refusés"
          value={extraStats.devis.devis_refuses}
          icon={X}
          color="red"
        />
      </div>

      {/* Graphiques en ligne */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Répartition des utilisateurs par ville */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des utilisateurs par ville</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ville" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="freelancers" fill="#10b981" name="Indépendants" />
              <Bar dataKey="employers" fill="#3b82f6" name="Entreprises" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Statut des missions */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statut des missions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={jobStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Répartition des devis par ville */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des devis par ville</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={devisByCityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ville" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#f59e0b" name="Devis" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top 10 Pages les plus vues */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Pages les plus vues</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page / URL</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Vues</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {extraStats.topPages.length > 0 ? extraStats.topPages.map((page, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900 break-all">{page.page}</td>
                    <td className="px-4 py-2 text-sm font-semibold text-gray-900 text-right">{page.vues}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="2" className="px-4 py-4 text-sm text-gray-500 text-center">Aucune donnée disponible</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Graphiques supplémentaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Candidatures par période */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Candidatures reçues par {getPeriodLabel()}</h3>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="day">Par jour</option>
              <option value="week">Par semaine</option>
              <option value="month">Par mois</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={applicationsByPeriodData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periode" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Candidatures" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Évolution mensuelle */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution mensuelle</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="utilisateurs" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="missions" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="candidatures" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Utilisateurs</h3>
            <Users className="h-6 w-6 text-primary-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Indépendants</span>
              <span className="font-semibold text-gray-900">{stats.users.total_freelancers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Entreprises</span>
              <span className="font-semibold text-gray-900">{stats.users.total_employers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Administrateurs</span>
              <span className="font-semibold text-gray-900">{stats.users.total_admins || 0}</span>
            </div>
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-primary-600 text-xl">{stats.users.total_users}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Missions</h3>
            <Briefcase className="h-6 w-6 text-green-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Ouvertes</span>
              <span className="font-semibold text-green-600">{stats.jobs.jobs_ouverts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Fermées</span>
              <span className="font-semibold text-red-600">{stats.jobs.jobs_fermes}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">En cours</span>
              <span className="font-semibold text-yellow-600">{stats.jobs.jobs_en_cours || 0}</span>
            </div>
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-green-600 text-xl">{stats.jobs.total_jobs}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Candidatures</h3>
            <FileText className="h-6 w-6 text-purple-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">En attente</span>
              <span className="font-semibold text-yellow-600">{stats.applications.en_attente}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Acceptées</span>
              <span className="font-semibold text-green-600">{stats.applications.accepte}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Refusées</span>
              <span className="font-semibold text-red-600">{stats.applications.refuse}</span>
            </div>
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-purple-600 text-xl">{stats.applications.total_applications}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AdminStats

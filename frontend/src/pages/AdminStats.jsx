import { useState, useEffect } from 'react'
import { Users, Briefcase, FileText, TrendingUp, Calendar, Euro } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import { userService } from '../services/userService'
import { jobService } from '../services/jobService'
import { missionService } from '../services/missionService'
import { applicationService } from '../services/applicationService'
import toast from 'react-hot-toast'

const AdminStats = () => {
  const [stats, setStats] = useState({
    users: { total_users: 0, total_freelancers: 0, total_employers: 0, total_admins: 0 },
    jobs: { total_jobs: 0, jobs_ouverts: 0, jobs_fermes: 0 },
    missions: { total: 0, ouverts: 0, en_cours: 0, terminees: 0 },
    applications: { total_applications: 0, en_attente: 0, accepte: 0, refuse: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [applicationsByPeriod, setApplicationsByPeriod] = useState([])
  const [period, setPeriod] = useState('month')
  const [usersByCity, setUsersByCity] = useState([])

  useEffect(() => {
    document.title = 'Statistiques - Admin - Indebel'
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [userStatsRes, jobStatsRes, missionStatsRes, appStatsRes, appsByPeriodRes, usersByCityRes] = await Promise.all([
        userService.getUserStats(),
        jobService.getJobStats(),
        missionService.getMissionStats(),
        applicationService.getApplicationStats(),
        applicationService.getApplicationsByPeriod(period),
        userService.getUserStatsByCity()
      ])

      setStats({
        users: userStatsRes.data.data,
        jobs: jobStatsRes.data.data,
        missions: missionStatsRes.data.data,
        applications: appStatsRes.data.data
      })
      setApplicationsByPeriod(appsByPeriodRes.data.data || [])
      setUsersByCity(usersByCityRes.data.data || [])
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
      setApplicationsByPeriod(res.data.data || [])
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
    { name: 'Ouverts', count: stats.missions.ouverts, color: '#10b981' },
    { name: 'En cours', count: stats.missions.en_cours || 0, color: '#f59e0b' },
    { name: 'Terminés', count: stats.missions.terminees || 0, color: '#ef4444' }
  ]

  const applicationsByPeriodData = applicationsByPeriod.map(item => ({
    periode: item.periode,
    total: item.total
  }))

  const getPeriodLabel = () => {
    switch (period) {
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
        <TrendingUp className="h-8 w-8 text-primary-600" />
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
          value={stats.missions.total}
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
          value={stats.missions.ouverts}
          icon={TrendingUp}
          color="yellow"
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
              <Bar dataKey="freelancers" fill="#10b981" name="Prestataires" />
              <Bar dataKey="employers" fill="#3b82f6" name="Recruteurs" />
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
              <span className="text-gray-600">Prestataires</span>
              <span className="font-semibold text-gray-900">{stats.users.total_freelancers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Recruteurs</span>
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
              <span className="font-semibold text-green-600">{stats.missions.ouverts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">En cours</span>
              <span className="font-semibold text-yellow-600">{stats.missions.en_cours || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Terminées</span>
              <span className="font-semibold text-red-600">{stats.missions.terminees}</span>
            </div>
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-green-600 text-xl">{stats.missions.total}</span>
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

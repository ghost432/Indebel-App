import { useState, useEffect } from 'react'
import { Users, Briefcase, FileText, TrendingUp, Trash2, Edit } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import StatCard from '../components/StatCard'
import Card from '../components/Card'
import Table from '../components/Table'
import Button from '../components/Button'
import Modal from '../components/Modal'
import NotificationPermissionAlert from '../components/NotificationPermissionAlert'
import { userService } from '../services/userService'
import { jobService } from '../services/jobService'
import { missionService } from '../services/missionService'
import { applicationService } from '../services/applicationService'
import { devisService } from '../services/devisService'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: { total_users: 0, total_freelancers: 0, total_employers: 0 },
    jobs: { total_jobs: 0, jobs_ouverts: 0, jobs_fermes: 0 },
    missions: { total: 0, hourly: { total: 0, ouverts: 0 }, fixed: { total: 0, ouverts: 0 } },
    applications: { total_applications: 0, en_attente: 0, accepte: 0, refuse: 0 },
    devis: { total: 0, en_attente: 0, valide: 0, refuse: 0, traite: 0, devis_complet: 0 }
  })
  const { user, loading: authLoading } = useAuth()
  const [users, setUsers] = useState([])
  const [jobs, setJobs] = useState([])
  const [missions, setMissions] = useState([])
  const [cityStats, setCityStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState({ open: false, type: null, id: null })

  useEffect(() => {
    document.title = 'Dashboard Admin - Indebel'

    // Attendre que l'utilisateur soit authentifié avant de charger les données
    if (user && !authLoading) {
      console.log('🚀 Dashboard: Chargement des données pour', user.email)
      fetchData()
    } else {
      console.log('⏳ Dashboard: En attente de l\'authentification...', { user: !!user, authLoading })
    }
  }, [user, authLoading])

  const fetchData = async () => {
    try {
      const [userStatsRes, jobStatsRes, missionStatsRes, appStatsRes, devisStatsRes, devisListRes, usersRes, jobsRes, missionsRes, cityStatsRes] = await Promise.all([
        userService.getUserStats(),
        jobService.getJobStats(),
        missionService.getMissionStats(),
        applicationService.getApplicationStats(),
        devisService.getDevisStats(),
        devisService.getAllDemandes({ statut: 'all', page: 1, limit: 1 }),
        userService.getAllUsers(),
        jobService.getAllJobs(),
        missionService.getAllMissions(),
        userService.getUserStatsByCity()
      ])

      const devisStatsComputed = (devisStatsRes && devisStatsRes.data)
        ? devisStatsRes.data
        : ((devisListRes && devisListRes.data && devisListRes.data.stats) ? devisListRes.data.stats : { total: 0, en_attente: 0, valide: 0, refuse: 0, traite: 0, devis_complet: 0 })

      setStats({
        users: userStatsRes.data.data,
        jobs: jobStatsRes.data.data,
        missions: missionStatsRes.data.data,
        applications: appStatsRes.data.data,
        devis: devisStatsComputed
      })

      // Trier les utilisateurs par date d'inscription (plus récents en premier)
      const sortedUsers = (usersRes.data.data || []).sort((a, b) =>
        new Date(b.date_creation) - new Date(a.date_creation)
      )
      setUsers(sortedUsers.slice(0, 20)) // Limiter à 20 utilisateurs récents

      setJobs(jobsRes.data.data)

      // Trier les missions par date de création (plus récentes en premier)
      const sortedMissions = (missionsRes.data.data || []).sort((a, b) =>
        new Date(b.date_creation) - new Date(a.date_creation)
      )
      setMissions(sortedMissions.slice(0, 20)) // Limiter à 20 missions récentes

      setCityStats(cityStatsRes.data.data || [])
    } catch (error) {
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      if (deleteModal.type === 'user') {
        await userService.deleteUser(deleteModal.id)
        toast.success('Utilisateur supprimé')
      } else if (deleteModal.type === 'job') {
        await jobService.deleteJob(deleteModal.id)
        toast.success('Offre supprimée')
      }
      setDeleteModal({ open: false, type: null, id: null })
      fetchData()
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const userChartData = cityStats.map(city => ({
    name: city.ville,
    value: city.count
  }))

  const missionChartData = [
    { name: 'Missions Ouvertes', count: (stats.missions.hourly?.ouverts || 0) + (stats.missions.fixed?.ouverts || 0) },
    { name: 'Missions En cours', count: (stats.missions.hourly?.en_cours || 0) + (stats.missions.fixed?.en_cours || 0) },
    { name: 'Missions Terminées', count: (stats.missions.hourly?.terminees || 0) + (stats.missions.fixed?.terminees || 0) }
  ]

  const demandesChartData = [
    { name: 'En attente', count: stats.applications.en_attente || 0 },
    { name: 'Acceptées', count: stats.applications.accepte || 0 },
    { name: 'Refusées', count: stats.applications.refuse || 0 }
  ]

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b']

  const userColumns = [
    {
      header: 'Nom',
      render: (row) => (
        <div>
          <div className="font-medium">{row.denomination || `${row.prenom} ${row.nom}`}</div>
          <div className="text-xs text-gray-500">{row.email}</div>
        </div>
      )
    },
    {
      header: 'Rôle',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${row.role === 'admin' ? 'bg-purple-100 text-purple-800' :
            row.role === 'employer' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
          }`}>
          {row.role === 'admin' ? 'Admin' : row.role === 'employer' ? 'Recruteur' : 'Freelancer'}
        </span>
      )
    },
    {
      header: 'Inscrit le',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {new Date(row.date_creation).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => row.role !== 'admin' && (
        <Button
          size="sm"
          variant="danger"
          onClick={() => setDeleteModal({ open: true, type: 'user', id: row.id })}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )
    }
  ]

  const missionColumns = [
    {
      header: 'Mission',
      render: (row) => (
        <div>
          <div className="font-medium">{row.titre}</div>
          <div className="text-xs text-gray-500">
            {row.denomination || row.employer_nom || 'Employeur'}
          </div>
        </div>
      )
    },
    {
      header: 'Type',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.mission_type === 'hourly' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
          }`}>
          {row.mission_type === 'hourly' ? 'Horaire' : 'Fixe'}
        </span>
      )
    },
    {
      header: 'Statut',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${row.statut === 'ouvert' ? 'bg-green-100 text-green-800' :
            row.statut === 'ferme' ? 'bg-red-100 text-red-800' :
              row.statut === 'en_cours' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
          }`}>
          {row.statut === 'en_cours' ? 'En cours' : row.statut}
        </span>
      )
    },
    {
      header: 'Publié le',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {new Date(row.date_creation).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
        </span>
      )
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Admin</h1>

      {/* Notification Permission Alert */}
      <NotificationPermissionAlert />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Utilisateurs"
          value={stats.users.total_users}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Missions"
          value={stats.missions.total || 0}
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
          value={stats.missions.ouverts || 0}
          icon={TrendingUp}
          color="yellow"
        />
        <StatCard
          title="Devis Disponibles"
          value={stats.devis?.valide || 0}
          icon={FileText}
          color="green"
        />
        <StatCard
          title="Devis en Attente"
          value={stats.devis?.en_attente || 0}
          icon={FileText}
          color="blue"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card title="Répartition des utilisateurs par ville">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" name="Utilisateurs" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Statut des missions">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={missionChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-15} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#10b981" name="Missions" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Users Table */}
      <Card title="Gestion des utilisateurs - Récemment inscrits" className="mb-8">
        {users.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucun utilisateur</p>
        ) : (
          <Table columns={userColumns} data={users} />
        )}
      </Card>

      {/* Missions Table */}
      <Card title="Gestion des missions - Récemment publiées" className="mb-8">
        {missions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune mission</p>
        ) : (
          <Table columns={missionColumns} data={missions} />
        )}
      </Card>

      {/* Demandes Stats */}
      <Card title="Statistiques des candidatures" className="mb-8">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={demandesChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8b5cf6" name="Candidatures" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, type: null, id: null })}
        title="Confirmer la suppression"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.
        </p>
        <div className="flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={() => setDeleteModal({ open: false, type: null, id: null })}
          >
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default AdminDashboard

import { useState, useEffect } from 'react'
import PageLoader from '../components/PageLoader'
import { ArrowRight, Bell, Briefcase, Building2, FileText, TrendingUp, Trash2, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    users: { total_users: 0, total_freelancers: 0, total_employers: 0 },
    jobs: { total_jobs: 0, jobs_ouverts: 0, jobs_fermes: 0 },
    missions: { total: 0, hourly: { total: 0, ouverts: 0 }, fixed: { total: 0, ouverts: 0 } },
    applications: { total_applications: 0, en_attente: 0, accepte: 0, refuse: 0 },
    devis: { total: 0, en_attente: 0, traite: 0, rejete: 0 }
  })
  const [users, setUsers] = useState([])
  const [jobs, setJobs] = useState([])
  const [missions, setMissions] = useState([])
  const [devisList, setDevisList] = useState([])
  const [allMissions, setAllMissions] = useState([])
  const [allDevis, setAllDevis] = useState([])
  const [cityStats, setCityStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState({ open: false, type: null, id: null })

  useEffect(() => {
    document.title = 'Tableau de bord admin - Indebel'
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Exécuter en lots pour éviter de surcharger la connexion HTTP/2 (qui cause ERR_HTTP2_PING_FAILED)
      const catchErr = (err) => { console.warn('Requête échouée:', err); return { data: {} }; };

      const [userStatsRes, jobStatsRes, missionStatsRes, appStatsRes] = await Promise.all([
        userService.getUserStats().catch(catchErr),
        jobService.getJobStats().catch(catchErr),
        missionService.getMissionStats().catch(catchErr),
        applicationService.getApplicationStats().catch(catchErr)
      ]);

      const [usersRes, jobsRes, missionsRes] = await Promise.all([
        userService.getAllUsers().catch(catchErr),
        jobService.getAllJobs().catch(catchErr),
        missionService.getAllMissions().catch(catchErr)
      ]);

      const [devisRes, allDevisRes, cityStatsRes] = await Promise.all([
        devisService.getAdminDemandes({ limit: 10 }).catch(catchErr),
        devisService.getAdminDemandes({ limit: 1000 }).catch(catchErr),
        userService.getUserStatsByCity().catch(catchErr)
      ]);

      setStats({
        users: (userStatsRes.data?.data || userStatsRes.data) || userStatsRes.data || { total_users: 0, total_freelancers: 0, total_employers: 0 },
        jobs: (jobStatsRes.data?.data || jobStatsRes.data) || jobStatsRes.data || { total_jobs: 0, jobs_ouverts: 0, jobs_fermes: 0 },
        missions: (missionStatsRes.data?.data || missionStatsRes.data) || missionStatsRes.data || { total: 0, hourly: { total: 0, ouverts: 0 }, fixed: { total: 0, ouverts: 0 } },
        applications: (appStatsRes.data?.data || appStatsRes.data) || appStatsRes.data || { total_applications: 0, en_attente: 0, accepte: 0, refuse: 0 },
        devis: devisRes.data?.data?.stats || devisRes.data?.stats || { total: 0, en_attente: 0, traite: 0, refuse: 0 }
      })
      
      // Trier les utilisateurs par date d'inscription (plus récents en premier)
      const usersArray = Array.isArray(usersRes.data?.data) ? (usersRes.data?.data || usersRes.data) : (Array.isArray(usersRes.data) ? usersRes.data : []);
      const sortedUsers = usersArray.sort((a, b) => 
        new Date(b.date_creation) - new Date(a.date_creation)
      )
      setUsers(sortedUsers.slice(0, 10)) // Limiter à 10 utilisateurs récents
      
      setJobs(Array.isArray(jobsRes.data?.data) ? (jobsRes.data?.data || jobsRes.data) : (Array.isArray(jobsRes.data) ? jobsRes.data : []))
      
      const allM = Array.isArray(missionsRes.data?.data) ? (missionsRes.data?.data || missionsRes.data) : (Array.isArray(missionsRes.data) ? missionsRes.data : [])
      setAllMissions(allM)

      // Trier les missions par date de création (plus récentes en premier)
      const sortedMissions = [...allM].sort((a, b) => 
        new Date(b.date_creation) - new Date(a.date_creation)
      )
      setMissions(sortedMissions.slice(0, 10)) // Limiter à 10 missions récentes

      setDevisList(Array.isArray(devisRes.data?.data?.demandes) ? (devisRes.data?.data || devisRes.data).demandes : (Array.isArray(devisRes.data?.demandes) ? devisRes.data.demandes : []))
      setAllDevis(Array.isArray(allDevisRes.data?.data?.demandes) ? (allDevisRes.data?.data || allDevisRes.data).demandes : (Array.isArray(allDevisRes.data?.demandes) ? allDevisRes.data.demandes : []))
      
      setCityStats(Array.isArray(cityStatsRes.data?.data) ? (cityStatsRes.data?.data || cityStatsRes.data) : (Array.isArray(cityStatsRes.data) ? cityStatsRes.data : []))
    } catch (error) {
      console.error(error)
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

  const normalizeCity = (city) => {
    if (!city) return 'Autres'
    const c = city.toLowerCase()
    if (c.includes('bruxelles') || c.includes('brussels') || c.includes('brux')) return 'Bruxelles'
    if (c.includes('anvers') || c.includes('antwerpen')) return 'Anvers'
    if (c.includes('gand') || c.includes('gent')) return 'Gand'
    if (c.includes('charleroi')) return 'Charleroi'
    if (c.includes('liège') || c.includes('liege')) return 'Liège'
    if (c.includes('bruges') || c.includes('brugge')) return 'Bruges'
    if (c.includes('namur') || c.includes('namen')) return 'Namur'
    if (c.includes('louvain') || c.includes('leuven')) return 'Louvain'
    if (c.includes('mons') || c.includes('bergen')) return 'Mons'
    if (c.includes('tournai')) return 'Tournai'
    return 'Autres'
  }

  const combinedCityData = cityStats.map(city => {
    const cityName = city.ville
    let missionsCount = 0
    let devisCount = 0
    
    allMissions.forEach(m => {
      const c = normalizeCity(m.ville_mission || m.adresse_mission || m.localisation || '')
      if (c === cityName) missionsCount++
    })
    
    allDevis.forEach(d => {
      const c = normalizeCity(d.ville || d.adresse || '')
      if (c === cityName) devisCount++
    })
    
    return {
      name: cityName,
      utilisateurs: city.count,
      missions: missionsCount,
      devis: devisCount
    }
  })

  const missionChartData = [
    { name: 'Missions Ouvertes', count: (stats.missions.hourly?.ouverts || 0) + (stats.missions.fixed?.ouverts || 0) + (stats.missions.freelancer?.ouverts || 0) },
    { name: 'Missions En cours', count: (stats.missions.hourly?.en_cours || 0) + (stats.missions.fixed?.en_cours || 0) + (stats.missions.freelancer?.en_cours || 0) },
    { name: 'Missions Terminées', count: (stats.missions.hourly?.terminees || 0) + (stats.missions.fixed?.terminees || 0) + (stats.missions.freelancer?.terminees || 0) }
  ]

  const devisChartData = [
    { name: 'En attente', count: stats.devis.en_attente || 0 },
    { name: 'Traités', count: stats.devis.traite || 0 },
    { name: 'Refusés', count: stats.devis.refuse || 0 }
  ]

  const demandesChartData = [
    { name: 'En attente', count: stats.applications.en_attente || 0 },
    { name: 'Acceptées', count: stats.applications.accepte || 0 },
    { name: 'Refusées', count: stats.applications.refuse || 0 }
  ]

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b']

  const quickActions = [
    {
      title: 'Devis',
      description: 'Gérez les demandes, les devis IA et les factures Falco.',
      value: stats.devis.total || 0,
      icon: FileText,
      path: '/admin/devis',
      tone: 'from-[#2A4DEF] to-[#082151]'
    },
    {
      title: 'Missions',
      description: 'Publiez, contrôlez et organisez les missions.',
      value: stats.missions.total || 0,
      icon: Briefcase,
      path: '/admin/jobs',
      tone: 'from-[#c02525] to-[#7f1d1d]'
    },
    {
      title: 'Entreprises',
      description: 'Accédez aux comptes recruteurs et entreprises.',
      value: stats.users.total_employers || 0,
      icon: Building2,
      path: '/admin/users?role=employer',
      tone: 'from-slate-800 to-[#082151]'
    },
    {
      title: 'Messages',
      description: 'Envoyez des notifications aux utilisateurs.',
      value: 'Centre',
      icon: Bell,
      path: '/admin/send-notification',
      tone: 'from-[#082151] to-[#2A4DEF]'
    }
  ]

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
        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
          row.role === 'admin' ? 'bg-purple-100 text-purple-800' :
          row.role === 'employer' ? 'bg-blue-100 text-blue-800' :
          'bg-green-100 text-green-800'
        }`}>
          {row.role === 'admin' ? 'Admin' : row.role === 'employer' ? 'Employeur/Client' : 'Prestataire'}
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
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.mission_type === 'hourly' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
        }`}>
          {row.mission_type === 'hourly' ? 'Horaire' : 'Fixe'}
        </span>
      )
    },
    { 
      header: 'Statut', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
          row.statut === 'ouvert' ? 'bg-green-100 text-green-800' :
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

  const devisColumns = [
    { 
      header: 'Client / Email', 
      render: (row) => (
        <div>
          <div className="font-medium">{row.prenom} {row.nom}</div>
          <div className="text-xs text-gray-500">{row.email}</div>
        </div>
      )
    },
    { 
      header: 'Titre de la demande', 
      render: (row) => <div className="text-sm">{row.type_travaux || row.categorie || 'Demande de devis'}</div>
    },
    { 
      header: 'Statut', 
      render: (row) => {
        let statusStyle = 'bg-gray-100 text-gray-800';
        let statusText = row.statut;
        
        switch(row.statut) {
          case 'en_attente':
            statusStyle = 'bg-yellow-100 text-yellow-800';
            statusText = 'En attente';
            break;
          case 'valide':
            statusStyle = 'bg-blue-100 text-blue-800';
            statusText = 'Validé';
            break;
          case 'traite':
            statusStyle = 'bg-green-100 text-green-800';
            statusText = 'Traité';
            break;
          case 'devis_complet':
            statusStyle = 'bg-emerald-100 text-emerald-800';
            statusText = 'Devis complet';
            break;
          case 'refuse':
            statusStyle = 'bg-red-100 text-red-800';
            statusText = 'Refusé';
            break;
          case 'retire_liste':
            statusStyle = 'bg-gray-200 text-gray-700';
            statusText = 'Retiré';
            break;
          default:
            statusStyle = 'bg-gray-100 text-gray-800';
            statusText = row.statut || 'Inconnu';
        }

        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle}`}>
            {statusText}
          </span>
        )
      }
    },
    {
      header: 'Date',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {new Date(row.created_at || row.date_creation).toLocaleDateString('fr-FR')}
        </span>
      )
    }
  ]

  if (loading) {
    return <PageLoader fullScreen />
  }

  return (
    <div className="container-custom py-8">
      <div className="bg-[#082151] rounded-[24px] shadow-md p-6 md:p-8 mb-8 relative overflow-hidden text-white border-0">
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-white/10 text-white rounded-2xl hidden sm:block">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Tableau de bord admin</h1>
            <p className="text-slate-200 mt-1 max-w-2xl text-sm md:text-base">Gérez les utilisateurs, les missions et analysez les statistiques clés de la plateforme.</p>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#2b4eef]/20 to-[#df6422]/20 rounded-full blur-3xl -mr-16 -mt-16 z-0 pointer-events-none"></div>
      </div>

      {/* Notification Permission Alert */}
      <NotificationPermissionAlert />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.title}
              type="button"
              onClick={() => navigate(action.path)}
              className="group relative overflow-hidden text-left rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#082151]/10"
            >
              {/* Background watermark icon */}
              <Icon className="absolute -right-6 -bottom-6 h-32 w-32 text-slate-100 opacity-50 transform -rotate-12 transition-transform duration-500 group-hover:rotate-0 group-hover:scale-110 pointer-events-none" />
              
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${action.tone} text-white shadow-lg shadow-slate-900/10 relative z-10`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex items-start justify-between gap-3 relative z-10">
                <div>
                  <p className={`text-xs font-black uppercase tracking-[0.18em] bg-gradient-to-r ${action.tone} bg-clip-text text-transparent`}>{action.title}</p>
                  <p className="mt-2 text-2xl font-black text-[#082151]">{action.value}</p>
                </div>
                <span className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${action.tone} text-white shadow-md transition-transform group-hover:scale-110`}>
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-500 relative z-10">{action.description}</p>
            </button>
          )
        })}
      </div>

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
          title="Total Devis"
          value={stats.devis.total || 0}
          icon={FileText}
          color="purple"
        />
        <StatCard
          title="Devis en attente"
          value={stats.devis.en_attente || 0}
          icon={FileText}
          color="yellow"
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
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card title="Répartition par ville (Utilisateurs, Missions, Devis)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={combinedCityData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Legend wrapperStyle={{paddingTop: '20px'}} />
              <Bar dataKey="utilisateurs" fill="#3b82f6" name="Utilisateurs" radius={[4, 4, 0, 0]} />
              <Bar dataKey="missions" fill="#10b981" name="Missions" radius={[4, 4, 0, 0]} />
              <Bar dataKey="devis" fill="#f59e0b" name="Devis" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Statut des missions">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={missionChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" angle={-15} textAnchor="end" height={60} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Legend />
              <Bar dataKey="count" fill="#10b981" name="Missions" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        
        <Card title="Statut des devis">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={devisChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" angle={-15} textAnchor="end" height={60} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Legend />
              <Bar dataKey="count" fill="#f59e0b" name="Devis" radius={[4, 4, 0, 0]} />
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

      {/* Devis Table */}
      <Card title="Gestion des devis - Récemment publiés" className="mb-8">
        {devisList.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucun devis</p>
        ) : (
          <Table columns={devisColumns} data={devisList} />
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

import { useState, useEffect } from 'react'
import PageLoader from '../components/PageLoader'
import { ArrowRight, Building2, Plus, Eye, Edit, Trash2, Briefcase, Users, Clock, ChevronDown, Inbox, CheckCircle, PlayCircle, UserCheck, Bell, MessageSquare, TrendingUp, AlertCircle, AlertTriangle, XCircle, Ban, CheckCheck, UserRound, CheckCircle2, Info, Shield, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../components/StatCard'
import Card from '../components/Card'
import Table from '../components/Table'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Input from '../components/Input'
import ProfileCompletionCard from '../components/ProfileCompletionCard'
import NotificationPermissionAlert from '../components/NotificationPermissionAlert'
import ProfileViewsCard from '../components/ProfileViewsCard'
import { missionService } from '../services/missionService'
import { demandeService } from '../services/demandeService'
import { messageService } from '../services/messageService'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const EmployerDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [selectedJobApplications, setSelectedJobApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalApplications, setTotalApplications] = useState(0)
  const [acceptedApplications, setAcceptedApplications] = useState(0)
  const [pendingApplications, setPendingApplications] = useState(0)
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [currentJobId, setCurrentJobId] = useState(null)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [notifications, setNotifications] = useState([])
  const [recentApplications, setRecentApplications] = useState([])
  const [refusedApplications, setRefusedApplications] = useState(0)
  const [recentMessages, setRecentMessages] = useState([])
  const [modalState, setModalState] = useState({
    create: false,
    edit: false,
    applications: false
  })
  const [formData, setFormData] = useState({
    id: null,
    titre: '',
    description: '',
    statut: 'ouvert'
  })

  useEffect(() => {
    document.title = 'Tableau de bord - Indebel'
    
    // Flag pour éviter les mises à jour après unmount
    let isMounted = true
    
    const loadDashboardData = async () => {
      try {
        if (isMounted) {
          await fetchJobs()
        }
        if (isMounted) {
          await fetchAcceptedApplications()
        }
        if (isMounted) {
          await fetchNotifications()
        }
        if (isMounted) {
          await fetchRecentApplications()
        }
        if (isMounted) {
          await fetchRecentMessages()
        }
      } catch (error) {
        // Ignorer toutes les erreurs d'abort au niveau global
        if (error.code !== 'ECONNABORTED' && error.code !== 'ERR_CANCELED' && error.name !== 'CanceledError') {
          console.error('Erreur chargement dashboard:', error)
        }
      }
    }
    
    loadDashboardData()
    
    return () => {
      isMounted = false
    }
  }, [])

  const getIconColorClasses = (type, lu) => {
    if (lu) return 'bg-slate-100 text-slate-500'
    switch(type) {
      case 'success': return 'bg-green-500 text-white shadow-md shadow-green-500/30'
      case 'error': return 'bg-red-500 text-white shadow-md shadow-red-500/30'
      case 'warning': return 'bg-yellow-500 text-white shadow-md shadow-yellow-500/30'
      case 'demande': return 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
      case 'mission': return 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
      case 'verification': return 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
      case 'info': return 'bg-[#082151] text-white shadow-md shadow-[#082151]/30'
      default: return 'bg-primary-600 text-white shadow-md shadow-primary-500/30'
    }
  }

  const getNotificationIcon = (type) => {
    const icons = {
      demande: UserRound,
      success: CheckCircle2,
      info: Info,
      mission: Briefcase,
      warning: AlertCircle,
      error: XCircle,
      verification: Shield
    }
    const Icon = icons[type] || Info
    return <Icon className="h-5 w-5" />
  }

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const seconds = Math.floor((new Date() - date) / 1000)
    if (seconds < 60) return "À l'instant"
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`
    if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)}j`
    return date.toLocaleDateString('fr-FR')
  }

  const fetchJobs = async () => {
    try {
      const response = await missionService.getEmployerMissions()
      console.log('Missions récupérées:', (response.data?.data || response.data))
      const missionsData = (response.data?.data || response.data) || []
      setJobs(missionsData)
    } catch (error) {
      // Ne rien logger pour les erreurs d'abort (React Strict Mode)
      if (error.code !== 'ECONNABORTED' && error.code !== 'ERR_CANCELED' && error.name !== 'CanceledError') {
        console.error('Erreur chargement missions:', error)
        toast.error('Erreur lors du chargement des missions')
      }
      // Sinon, ignorer silencieusement
    } finally {
      setLoading(false)
    }
  }

  const fetchAcceptedApplications = async () => {
    try {
      // Récupérer toutes les demandes de missions de l'employeur
      const response = await demandeService.getEmployerDemandes()
      const demandes = (response.data?.data || response.data) || []
      
      console.log('Demandes récupérées:', demandes)
      
      // Compter les demandes par statut
      const acceptedCount = demandes.filter(d => d.statut === 'accepte').length
      const pendingCount = demandes.filter(d => d.statut === 'en_attente').length
      const refusedCount = demandes.filter(d => d.statut === 'refuse').length
      const termineeCount = demandes.filter(d => d.statut === 'terminee').length
      
      console.log(`Stats demandes: ${demandes.length} total, ${acceptedCount} acceptées, ${pendingCount} en attente, ${refusedCount} refusées, ${termineeCount} terminées`)
      
      setAcceptedApplications(acceptedCount)
      setPendingApplications(pendingCount)
      setRefusedApplications(refusedCount)
      
      // Mettre à jour le total des demandes
      setTotalApplications(demandes.length)
    } catch (error) {
      // Ne rien logger pour les erreurs d'abort
      if (error.code !== 'ECONNABORTED' && error.code !== 'ERR_CANCELED' && error.name !== 'CanceledError') {
        console.error('Erreur chargement demandes:', error)
      }
      // Sinon, ignorer silencieusement
    }
  }

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const notificationsData = (response.data?.data || response.data) || []
      // Garder seulement les 5 dernières
      setNotifications(notificationsData.slice(0, 5))
    } catch (error) {
      // Ne rien logger pour les erreurs d'abort
      if (error.code !== 'ECONNABORTED' && error.code !== 'ERR_CANCELED' && error.name !== 'CanceledError') {
        console.error('Erreur chargement notifications:', error)
      }
      // Sinon, ignorer silencieusement
    }
  }

  const fetchRecentApplications = async () => {
    try {
      const response = await demandeService.getEmployerDemandes()
      const demandes = (response.data?.data || response.data) || []
      
      // Trier par date et garder les 5 plus récentes
      demandes.sort((a, b) => new Date(b.date_demande || 0) - new Date(a.date_demande || 0))
      setRecentApplications(demandes.slice(0, 5))
    } catch (error) {
      // Ne rien logger pour les erreurs d'abort
      if (error.code !== 'ECONNABORTED' && error.code !== 'ERR_CANCELED' && error.name !== 'CanceledError') {
        console.error('Erreur chargement candidatures récentes:', error)
      }
      // Sinon, ignorer silencieusement
    }
  }

  const fetchRecentMessages = async () => {
    try {
      const response = await messageService.getConversations()
      const conversations = response.data || []
      
      // Récupérer les 5 dernières conversations avec messages
      const conversationsWithMessages = conversations
        .filter(conv => conv.last_message)
        .sort((a, b) => new Date(b.last_message_date) - new Date(a.last_message_date))
        .slice(0, 5)
      
      setRecentMessages(conversationsWithMessages)
    } catch (error) {
      // Ne rien logger pour les erreurs d'abort et erreurs 401 (token expiré)
      if (error.code !== 'ECONNABORTED' && error.code !== 'ERR_CANCELED' && error.name !== 'CanceledError' && error.response?.status !== 401) {
        console.error('Erreur chargement messages récents:', error)
      }
      // Sinon, ignorer silencieusement
    }
  }

  const handleOpenCreate = () => {
    setFormData({ id: null, titre: '', description: '', statut: 'ouvert' })
    setModalState({ ...modalState, create: true })
  }

  const handleOpenEdit = (job) => {
    setFormData({
      id: job.id,
      titre: job.titre,
      description: job.description,
      statut: job.statut
    })
    setModalState({ ...modalState, edit: true })
  }

  const handleCreateJob = async (e) => {
    e.preventDefault()
    try {
      await jobService.createJob(formData)
      toast.success('Offre créée avec succès')
      setModalState({ ...modalState, create: false })
      fetchJobs()
    } catch (error) {
      toast.error('Erreur lors de la création')
    }
  }

  const handleUpdateJob = async (e) => {
    e.preventDefault()
    try {
      await jobService.updateJob(formData.id, formData)
      toast.success('Offre mise à jour')
      setModalState({ ...modalState, edit: false })
      fetchJobs()
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const handleDeleteJob = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) return
    
    try {
      await jobService.deleteJob(id)
      toast.success('Offre supprimée')
      fetchJobs()
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleViewApplications = async (jobId) => {
    setApplicationsLoading(true)
    setCurrentJobId(jobId)
    try {
      const response = await applicationService.getJobApplications(jobId)
      console.log('Candidatures récupérées:', response.data)
      const applications = (response.data?.data || response.data) || response.data || []
      setSelectedJobApplications(applications)
      setModalState({ ...modalState, applications: true })
      
      // Le modal affiche déjà le message "Aucune candidature"
      // Pas besoin de toast ici
    } catch (error) {
      console.error('Erreur chargement candidatures:', error)
      const errorMsg = error.response?.data?.message || 'Erreur lors du chargement des candidatures'
      toast.error(errorMsg)
      setSelectedJobApplications([])
    } finally {
      setApplicationsLoading(false)
    }
  }

  const handleAcceptApplication = async (application) => {
    try {
      await applicationService.updateApplicationStatus(application.id, 'accepte')
      toast.success(`Candidature de ${application.freelancer_nom} acceptée!`)
      
      // Rafraîchir la liste
      if (currentJobId) {
        await handleViewApplications(currentJobId)
        await fetchJobs() // Mettre à jour le statut de la mission
      }
    } catch (error) {
      console.error('Erreur acceptation:', error)
      toast.error('Erreur lors de l\'acceptation')
    }
  }

  const handleOpenRejectModal = (application) => {
    setSelectedApplication(application)
    setRejectReason('')
    setRejectModalOpen(true)
  }

  const handleRejectApplication = async () => {
    if (!rejectReason.trim()) {
      toast.error('Veuillez indiquer un motif de refus')
      return
    }

    try {
      await applicationService.rejectApplicationWithReason(
        selectedApplication.id, 
        rejectReason
      )
      toast.success('Candidature refusée et freelancer notifié')
      setRejectModalOpen(false)
      setSelectedApplication(null)
      setRejectReason('')
      
      // Rafraîchir la liste
      if (currentJobId) {
        await handleViewApplications(currentJobId)
      }
    } catch (error) {
      console.error('Erreur refus:', error)
      toast.error('Erreur lors du refus')
    }
  }

  const stats = {
    total: jobs.length,
    open: jobs.filter(j => j.statut === 'ouvert').length,
    closed: jobs.filter(j => j.statut === 'ferme').length
  }

  const quickActions = [
    {
      title: 'Devis',
      description: 'Créez une demande et suivez vos factures.',
      value: 'Demande',
      icon: FileText,
      path: '/demande-devis',
      tone: 'from-[#2A4DEF] to-[#082151]'
    },
    {
      title: 'Missions',
      description: 'Publiez une mission et suivez les candidatures.',
      value: stats.open,
      icon: Briefcase,
      path: '/employer/publish-mission',
      tone: 'from-[#c02525] to-[#7f1d1d]'
    },
    {
      title: 'Indépendants',
      description: 'Trouvez les profils disponibles pour vos besoins.',
      value: 'Annuaire',
      icon: Building2,
      path: '/employer/list-freelancers',
      tone: 'from-slate-800 to-[#082151]'
    },
    {
      title: 'Messages',
      description: 'Reprenez vos échanges avec les prestataires.',
      value: recentMessages.length,
      icon: MessageSquare,
      path: '/employer/mes-messages',
      tone: 'from-[#082151] to-[#2A4DEF]'
    }
  ]

  const jobColumns = [
    { header: 'Titre', accessor: 'titre' },
    { 
      header: 'Type', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.mission_type === 'hourly' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
        }`}>
          {row.mission_type === 'hourly' ? 'Forfait Horaire' : 'Forfait Fixe'}
        </span>
      )
    },
    { 
      header: 'Tarif', 
      render: (row) => (
        <div className="text-sm">
          {row.mission_type === 'hourly' ? (
            <span className="font-medium text-blue-600">
              {row.forfait_heure}€/h × {row.heures_travail_max}h
            </span>
          ) : (
            <span className="font-medium text-purple-600">
              {row.forfait_mission}€
            </span>
          )}
        </div>
      )
    },
    { 
      header: 'Secteur', 
      render: (row) => (
        <span className="text-sm text-gray-600">{row.categorie || 'Non spécifié'}</span>
      )
    },
    { 
      header: 'Statut', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
          row.statut === 'ouvert' ? 'bg-green-100 text-green-800' :
          row.statut === 'ferme' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {row.statut || 'ouvert'}
        </span>
      )
    },
    { 
      header: 'Date', 
      render: (row) => (
        <span className="text-sm text-gray-600">
          {row.date_creation ? new Date(row.date_creation).toLocaleDateString('fr-FR') : '-'}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={() => handleViewApplications(row.id)} title="Voir les demandes">
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDeleteJob(row.id)} title="Supprimer">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  const applicationColumns = [
    { header: 'Indépendant', accessor: 'freelancer_nom' },
    { header: 'Email', accessor: 'freelancer_email' },
    { 
      header: 'Statut', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.statut === 'accepte' ? 'bg-green-100 text-green-800' :
          row.statut === 'refuse' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {row.statut === 'en_attente' ? 'En attente' : row.statut === 'accepte' ? 'Accepté' : 'Refusé'}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => row.statut === 'en_attente' && (
        <div className="flex space-x-2">
          <Button size="sm" variant="success" onClick={() => handleUpdateApplicationStatus(row.id, 'accepte')}>
            Accepter
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleUpdateApplicationStatus(row.id, 'refuse')}>
            Refuser
          </Button>
        </div>
      )
    }
  ]

  if (loading) {
    return <PageLoader />
  }

  return (
    <div>
      <div className="bg-[#082151] rounded-[24px] shadow-md p-6 md:p-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden text-white border-0">
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-white/10 text-white rounded-2xl hidden sm:block">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Tableau de bord</h1>
            <p className="text-slate-200 mt-1 text-sm md:text-base">Vue d'ensemble de votre activité et statistiques récentes.</p>
          </div>
        </div>
        <div className="relative z-10">
          <Button 
            onClick={() => navigate('/employer/publish-mission')} 
            variant="white"
            className="rounded-full shadow-sm hover:-translate-y-0.5 transition-transform"
          >
            <Plus className="h-5 w-5 mr-2" />
            Publier une mission
          </Button>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#2b4eef]/20 to-[#df6422]/20 rounded-full blur-3xl -mr-16 -mt-16 z-0 pointer-events-none"></div>
      </div>

      {/* Banner Vérification BCE */}
      {user?.numero_bce && !user?.bce_verifie && (
        <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-[24px] p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black text-[#082151] text-base">Numéro BCE non vérifié</h4>
              <p className="text-sm text-slate-600 mt-1">
                Votre numéro d'entreprise BCE n'a pas encore été vérifié officiellement. 
                Veuillez procéder à la vérification dans votre profil.
              </p>
            </div>
          </div>
          <Button
            variant="warning"
            onClick={() => navigate('/employer/profile')}
            className="whitespace-nowrap"
          >
            Vérifier maintenant
          </Button>
        </div>
      )}

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

      {/* Profile Completion Card */}
      <div className="mb-8">
        <ProfileCompletionCard user={user} />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Missions" value={stats.total} icon={Briefcase} color="blue" />
        <StatCard title="Missions Ouvertes" value={stats.open} icon={CheckCircle} color="green" />
        <StatCard title="Missions en Cours" value={jobs.filter(j => j.statut === 'en_cours').length} icon={PlayCircle} color="orange" />
        <StatCard title="Missions Terminées" value={jobs.filter(j => j.statut === 'termine' || j.statut === 'complete').length} icon={CheckCheck} color="teal" />
        <StatCard title="Missions Fermées" value={stats.closed} icon={Trash2} color="red" />
        <StatCard title="Missions Annulées" value={jobs.filter(j => j.statut === 'annule').length} icon={Ban} color="gray" />
        <StatCard title="Total Demandes" value={totalApplications} icon={Inbox} color="purple" />
        <StatCard title="Demandes en Attente" value={pendingApplications} icon={Clock} color="yellow" />
        <StatCard title="Candidatures Acceptées" value={acceptedApplications} icon={UserCheck} color="emerald" />
        <StatCard title="Candidatures Refusées" value={refusedApplications} icon={XCircle} color="rose" />
        <StatCard title="Taux d'acceptation" value={totalApplications > 0 ? `${Math.round((acceptedApplications / totalApplications) * 100)}%` : '0%'} icon={TrendingUp} color="indigo" />
        <StatCard title="Taux de refus" value={totalApplications > 0 ? `${Math.round((refusedApplications / totalApplications) * 100)}%` : '0%'} icon={XCircle} color="red" />
      </div>

      {/* Grid à deux colonnes pour les sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Vues du profil */}
        <ProfileViewsCard />

        {/* Dernières notifications */}
        <Card title="Dernières notifications">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>Aucune notification récente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(notif => (
                <div key={notif.id} className={`p-4 rounded-[20px] border transition-all duration-200 cursor-pointer ${
                  notif.lu ? 'bg-white border-slate-100 hover:shadow-sm' : 'bg-primary-50/50 border-primary-100 hover:shadow-md'
                }`} onClick={() => navigate(`/${user?.role}/notifications`)}>
                  <div className="flex items-start space-x-4">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${getIconColorClasses(notif.type, notif.lu)}`}>
                      {getNotificationIcon(notif.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-0.5 gap-2">
                        <p className={`text-sm truncate flex-1 ${!notif.lu ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                          {notif.titre}
                        </p>
                        {!notif.lu && (
                          <span className="h-2 w-2 bg-primary-600 rounded-full flex-shrink-0 mt-1.5"></span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-1.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{getTimeAgo(notif.date_creation)}</p>
                    </div>
                  </div>
                </div>
              ))}
              <Button 
                variant="outline" 
                className="w-full mt-3"
                onClick={() => navigate('/employer/notifications')}
              >
                Voir toutes les notifications
              </Button>
            </div>
          )}
        </Card>

        {/* Dernières demandes reçues */}
        <Card title="Dernières demandes reçues">
          {recentApplications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Inbox className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>Aucune demande récente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentApplications.map(app => (
                <div key={app.id} className="p-3 rounded-lg border bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {app.freelancer_prenom} {app.freelancer_nom}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Mission: {app.mission_titre}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          app.statut === 'accepte' ? 'bg-green-100 text-green-800' :
                          app.statut === 'refuse' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {app.statut === 'en_attente' ? 'En attente' : 
                           app.statut === 'accepte' ? 'Accepté' : 'Refusé'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {app.date_demande ? new Date(app.date_demande).toLocaleDateString('fr-FR') : 'Date inconnue'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Derniers messages reçus */}
        <Card title="Derniers messages reçus">
          {recentMessages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>Aucun message récent</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMessages.map(msg => {
                const isUser1 = msg.user1_id === user?.id
                const otherUserName = isUser1 
                  ? (msg.user2_denomination || `${msg.user2_prenom || ''} ${msg.user2_nom || ''}`.trim())
                  : (msg.user1_denomination || `${msg.user1_prenom || ''} ${msg.user1_nom || ''}`.trim())
                
                return (
                  <div 
                    key={msg.id} 
                    className="p-3 rounded-lg border bg-white hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/employer/mes-messages?conversation_id=${msg.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{otherUserName || 'Utilisateur'}</p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{msg.last_message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(msg.last_message_date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
              <Button 
                variant="outline" 
                className="w-full mt-3"
                onClick={() => navigate('/employer/mes-messages')}
              >
                Voir tous les messages
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Actions à faire */}
      <Card title="Actions à faire" className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingApplications > 0 && (
            <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-900">
                    {pendingApplications} demande{pendingApplications > 1 ? 's' : ''} en attente
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Examinez les candidatures reçues
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {stats.open === 0 && (
            <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <Briefcase className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-900">Aucune mission active</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Publiez une nouvelle mission
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-2"
                    onClick={() => navigate('/employer/publish-mission')}
                  >
                    Publier
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {user && (!user.denomination || !user.secteur_id) && (
            <div className="p-4 border-l-4 border-purple-500 bg-purple-50 rounded-lg">
              <div className="flex items-start">
                <Users className="h-5 w-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-purple-900">Complétez votre profil</p>
                  <p className="text-sm text-purple-700 mt-1">
                    Améliorez votre visibilité
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-2"
                    onClick={() => navigate('/employer/profile')}
                  >
                    Compléter
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Jobs Table */}
      <Card title="Mes missions">
        {jobs.length > 0 && (
          <div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center text-sm text-blue-900">
              <ChevronDown className="h-5 w-5 mr-2 transform -rotate-90" />
              <span className="font-medium">
                Faites défiler horizontalement pour voir toutes les colonnes et actions
              </span>
            </div>
            <div className="text-xs text-blue-700 font-medium">
              Cliquez sur l'œil pour voir les demandes
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <Table columns={jobColumns} data={jobs} />
        </div>
      </Card>

      {/* Create Job Modal */}
      <Modal
        isOpen={modalState.create}
        onClose={() => setModalState({ ...modalState, create: false })}
        title="Créer une nouvelle offre"
      >
        <form onSubmit={handleCreateJob} className="space-y-4">
          <Input
            label="Titre"
            value={formData.titre}
            onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
            required
          />
          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[120px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Statut</label>
            <select
              className="input"
              value={formData.statut}
              onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
            >
              <option value="ouvert">Ouvert</option>
              <option value="ferme">Fermé</option>
              <option value="en_cours">En cours</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setModalState({ ...modalState, create: false })}>
              Annuler
            </Button>
            <Button type="submit">Créer</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Job Modal */}
      <Modal
        isOpen={modalState.edit}
        onClose={() => setModalState({ ...modalState, edit: false })}
        title="Modifier l'offre"
      >
        <form onSubmit={handleUpdateJob} className="space-y-4">
          <Input
            label="Titre"
            value={formData.titre}
            onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
            required
          />
          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[120px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Statut</label>
            <select
              className="input"
              value={formData.statut}
              onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
            >
              <option value="ouvert">Ouvert</option>
              <option value="ferme">Fermé</option>
              <option value="en_cours">En cours</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setModalState({ ...modalState, edit: false })}>
              Annuler
            </Button>
            <Button type="submit">Mettre à jour</Button>
          </div>
        </form>
      </Modal>

      {/* Applications Modal */}
      <Modal
        isOpen={modalState.applications}
        onClose={() => setModalState({ ...modalState, applications: false })}
        title="Candidatures reçues"
        size="lg"
      >
        {applicationsLoading ? (
          <PageLoader compact />
        ) : selectedJobApplications.length === 0 ? (
          <div className="text-center py-12">
            <Inbox className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">Aucune candidature pour cette mission</p>
            <p className="text-gray-400 text-sm mt-2">Les candidatures apparaîtront ici lorsque les indépendants postuleront</p>
          </div>
        ) : (
          <div>
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-900">
                <span className="font-medium">{selectedJobApplications.length}</span> candidature(s) reçue(s) pour cette mission
              </p>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {selectedJobApplications.map(application => (
                <div 
                  key={application.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Nom de l'indépendant - Lien vers profil */}
                      <div 
                        onClick={() => {
                          const slug = `${application.freelancer_prenom || ''}-${application.freelancer_nom_famille || ''}`
                            .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                          navigate(`/employer/list-freelancer/${slug}`);
                          setModalState({ ...modalState, applications: false });
                        }}
                        className="font-medium text-lg text-primary-600 hover:text-primary-700 cursor-pointer hover:underline"
                      >
                        {application.freelancer_nom || 'Indépendant'}
                      </div>
                      
                      {/* Email */}
                      <p className="text-sm text-gray-600 mt-1">
                        📧 {application.freelancer_email}
                      </p>
                      
                      {/* Date de candidature */}
                      <p className="text-xs text-gray-500 mt-1">
                        Postulé le: {new Date(application.created_at).toLocaleDateString('fr-FR')}
                      </p>
                      
                      {/* Statut */}
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          application.statut === 'accepte' ? 'bg-green-100 text-green-800' :
                          application.statut === 'refuse' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {application.statut === 'en_attente' ? '⏳ En attente' : 
                           application.statut === 'accepte' ? '✅ Accepté' : 
                           '❌ Refusé'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Boutons d'action */}
                    {application.statut === 'en_attente' && (
                      <div className="flex gap-2 ml-4">
                        <Button 
                          size="sm" 
                          variant="success" 
                          onClick={() => handleAcceptApplication(application)}
                          className="whitespace-nowrap"
                        >
                          ✓ Accepter
                        </Button>
                        <Button 
                          size="sm" 
                          variant="danger" 
                          onClick={() => handleOpenRejectModal(application)}
                          className="whitespace-nowrap"
                        >
                          ✗ Refuser
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de refus avec motif */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Refuser la candidature"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Vous êtes sur le point de refuser la candidature de <strong>{selectedApplication?.freelancer_nom}</strong>.
          </p>
          <p className="text-sm text-gray-600">
            Un motif de refus est requis. Le freelancer sera notifié par email et notification.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motif du refus *
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Expliquez pourquoi vous refusez cette candidature..."
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => setRejectModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleRejectApplication}
              disabled={!rejectReason.trim()}
            >
              Confirmer le refus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default EmployerDashboard

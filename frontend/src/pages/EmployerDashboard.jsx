import { useState, useEffect } from 'react'
import { Plus, Eye, Edit, Trash2, Briefcase, Users, Clock, ChevronDown, Inbox, CheckCircle, PlayCircle, UserCheck, Bell, MessageSquare, TrendingUp, AlertCircle, Calendar, Euro, XCircle, Ban, CheckCheck } from 'lucide-react'
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
    
    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await missionService.getEmployerMissions()
      console.log('Missions récupérées:', response.data.data)
      const missionsData = response.data.data || []
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
      const demandes = response.data.data || []
      
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
      const notificationsData = response.data.data || []
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
      const demandes = response.data.data || []
      
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
      const applications = response.data.data || response.data || []
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
    { header: 'Prestataire', accessor: 'freelancer_nom' },
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600 mt-1">Vue d'ensemble de votre activité</p>
        </div>
        <Button onClick={() => navigate('/employer/publish-mission')}>
          <Plus className="h-5 w-5 mr-2" />
          Publier une mission
        </Button>
      </div>

      {/* Notification Permission Alert */}
      <NotificationPermissionAlert />

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
                <div key={notif.id} className={`p-3 rounded-lg border ${
                  notif.lu ? 'bg-white' : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{notif.titre}</p>
                      <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notif.date_creation).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {!notif.lu && (
                      <span className="h-2 w-2 bg-blue-500 rounded-full mt-1"></span>
                    )}
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
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : selectedJobApplications.length === 0 ? (
          <div className="text-center py-12">
            <Inbox className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">Aucune candidature pour cette mission</p>
            <p className="text-gray-400 text-sm mt-2">Les candidatures apparaîtront ici lorsque les prestataires postuleront</p>
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
                      {/* Nom de le prestataire - Lien vers profil */}
                      <div 
                        onClick={() => {
                          const slug = `${application.freelancer_prenom || ''}-${application.freelancer_nom_famille || ''}`
                            .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                          navigate(`/employer/list-freelancer/${slug}`);
                          setModalState({ ...modalState, applications: false });
                        }}
                        className="font-medium text-lg text-primary-600 hover:text-primary-700 cursor-pointer hover:underline"
                      >
                        {application.freelancer_nom || 'Prestataire'}
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

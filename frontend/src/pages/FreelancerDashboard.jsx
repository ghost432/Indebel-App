import { useState, useEffect } from 'react'
import PageLoader from '../components/PageLoader'
import { ArrowRight, Briefcase, Building2, CheckCircle, XCircle, Clock, Bell, TrendingUp, AlertCircle, AlertTriangle, Users, Shield, Package, Eye, MessageSquare, PlayCircle, CheckCheck, UserRound, CheckCircle2, Info, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../components/StatCard'
import Card from '../components/Card'
import Table from '../components/Table'
import Button from '../components/Button'
import ProfileCompletionCard from '../components/ProfileCompletionCard'
import NotificationPermissionAlert from '../components/NotificationPermissionAlert'
import ProfileViewsCard from '../components/ProfileViewsCard'
import { demandeService } from '../services/demandeService'
import { missionService } from '../services/missionService'
import { messageService } from '../services/messageService'
import { devisService } from '../services/devisService'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const FreelancerDashboard = () => {
  const { user, checkAuth } = useAuth()
  const [applications, setApplications] = useState([])
  const [devisList, setDevisList] = useState([])
  const [listTab, setListTab] = useState('devis')
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [availableMissions, setAvailableMissions] = useState(0)
  const [recentMessages, setRecentMessages] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Tableau de bord - Indebel'

    // Vérifier les paramètres de retour de paiement Stripe
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get('payment_success') === 'true') {
      const addedCredits = searchParams.get('credits')
      toast.success(`🎉 Paiement réussi ! ${addedCredits ? `${addedCredits} crédits ont été ajoutés à votre solde.` : 'Vos crédits ont été ajoutés.'}`, { duration: 6000 })
      if (checkAuth) checkAuth()
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    fetchApplications()
    fetchNotifications()
    fetchAvailableMissions()
    fetchRecentMessages()
    fetchDevis()
  }, [])

  const fetchDevis = async () => {
    try {
      const response = await devisService.getMesDevis({ page: 1, limit: 100 })
      const devisData = response.data?.data || []
      setDevisList(devisData)
    } catch (error) {
      console.error('Erreur chargement devis:', error)
    }
  }

  const fetchApplications = async () => {
    try {
      const response = await demandeService.getFreelancerDemandes()
      const applicationsData = (response.data?.data || response.data) || []
      console.log('Demandes freelancer récupérées:', applicationsData)
      // Trier par date décroissante
      applicationsData.sort((a, b) => new Date(b.date_demande) - new Date(a.date_demande))
      setApplications(applicationsData)
    } catch (error) {
      console.error('Erreur chargement demandes:', error)
      toast.error('Erreur lors du chargement des candidatures')
    } finally {
      setLoading(false)
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
      console.error('Erreur chargement notifications:', error)
    }
  }

  const fetchAvailableMissions = async () => {
    try {
      const response = await missionService.getAllMissions()
      const missions = (response.data?.data || response.data) || []
      // Compter les missions ouvertes
      const openMissions = missions.filter(m => m.statut === 'ouvert')
      setAvailableMissions(openMissions.length)
    } catch (error) {
      console.error('Erreur chargement missions:', error)
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
      console.error('Erreur chargement messages récents:', error)
    }
  }

  const stats = {
    total: applications.length + devisList.length,
    pending: applications.filter(a => a.statut === 'en_attente').length + devisList.filter(d => d.statut === 'en_attente').length,
    accepted: applications.filter(a => a.statut === 'accepte').length + devisList.filter(d => d.statut === 'accepte').length,
    refused: applications.filter(a => a.statut === 'refuse').length + devisList.filter(d => d.statut === 'refuse').length
  }

  const columns = [
    { 
      header: 'Mission', 
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.mission_titre || 'Mission'}</p>
          <p className="text-sm text-gray-500">{row.mission_type === 'hourly' ? 'Forfait horaire' : 'Forfait fixe'}</p>
        </div>
      )
    },
    { 
      header: 'Entreprise', 
      render: (row) => (
        <span className="text-gray-900">{row.employer_denomination || row.employer_nom || 'Employeur'}</span>
      )
    },
    { 
      header: 'Statut', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.statut === 'accepte' ? 'bg-green-100 text-green-800' :
          row.statut === 'refuse' ? 'bg-red-100 text-red-800' :
          row.statut === 'terminee' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {row.statut === 'en_attente' ? 'En attente' : 
           row.statut === 'accepte' ? 'Acceptée' : 
           row.statut === 'terminee' ? 'Terminée' : 
           'Refusée'}
        </span>
      )
    },
    { 
      header: 'Date', 
      render: (row) => new Date(row.date_demande).toLocaleDateString('fr-FR')
    }
  ]

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

  const quickActions = [
    {
      title: 'Devis',
      description: 'Consultez les demandes ouvertes et vos devis envoyés.',
      value: devisList.length > 0 ? `${devisList.length} envoyé(s)` : 'Disponible',
      icon: FileText,
      path: '/freelancer/devis-disponibles',
      tone: 'from-[#2A4DEF] to-[#082151]'
    },
    {
      title: 'Missions',
      description: 'Parcourez les nouvelles missions publiées.',
      value: availableMissions,
      icon: Briefcase,
      path: '/freelancer/list-missions',
      tone: 'from-[#df6422] to-[#c9571b]'
    },
    {
      title: 'Entreprises',
      description: 'Retrouvez les recruteurs et ouvrez une conversation.',
      value: 'Annuaire',
      icon: Building2,
      path: '/freelancer/list-employers',
      tone: 'from-slate-800 to-[#082151]'
    },
    {
      title: 'Messages',
      description: 'Suivez les derniers échanges importants.',
      value: recentMessages.length,
      icon: MessageSquare,
      path: '/freelancer/mes-messages',
      tone: 'from-[#082151] to-[#2A4DEF]'
    }
  ]

  const displayName = user?.prenom || user?.denomination || user?.nom || 'prestataire'

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
            <p className="text-slate-200 mt-1 text-sm md:text-base">
              Bonjour {displayName}, voici une vue d'ensemble de votre activité et de vos opportunités.
            </p>
          </div>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => navigate('/freelancer/devis-disponibles')} 
            variant="white"
            className="rounded-full shadow-sm hover:-translate-y-0.5 transition-transform"
          >
            <FileText className="h-5 w-5 mr-2" />
            Devis disponibles
          </Button>
          {availableMissions > 0 && (
            <Button onClick={() => navigate('/freelancer/list-missions')} className="rounded-full shadow-sm hover:-translate-y-0.5 transition-transform bg-[#df6422] hover:bg-[#c9571b] text-white border-0">
              <Briefcase className="h-5 w-5 mr-2" />
              Missions disponibles
            </Button>
          )}
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
            onClick={() => navigate('/freelancer/profile')}
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
        <StatCard
          title="Candidatures & Devis"
          value={stats.total}
          icon={Briefcase}
          color="blue"
        />
        <StatCard
          title="En attente"
          value={stats.pending}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Acceptées"
          value={stats.accepted}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Refusées"
          value={stats.refused}
          icon={XCircle}
          color="red"
        />
        <StatCard
          title="Missions disponibles"
          value={availableMissions}
          icon={Eye}
          color="purple"
        />
        <StatCard
          title="Missions en cours"
          value={stats.accepted}
          icon={PlayCircle}
          color="orange"
        />
        <StatCard
          title="Taux d'acceptation"
          value={stats.total > 0 ? `${Math.round((stats.accepted / stats.total) * 100)}%` : '0%'}
          icon={TrendingUp}
          color="indigo"
        />
        <StatCard
          title="Taux de refus"
          value={stats.total > 0 ? `${Math.round((stats.refused / stats.total) * 100)}%` : '0%'}
          icon={XCircle}
          color="rose"
        />
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
                onClick={() => navigate('/freelancer/notifications')}
              >
                Voir toutes les notifications
              </Button>
            </div>
          )}
        </Card>

        {/* Dernières candidatures et devis envoyés */}
        <Card 
          title={
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
              <span className="font-bold text-[#082151]">Mes propositions</span>
              <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
                <button 
                  type="button"
                  onClick={() => setListTab('devis')} 
                  className={`text-[11px] px-3 py-1 rounded-md font-bold transition-all ${listTab === 'devis' ? 'bg-[#082151] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Devis ({devisList.length})
                </button>
                <button 
                  type="button"
                  onClick={() => setListTab('candidatures')} 
                  className={`text-[11px] px-3 py-1 rounded-md font-bold transition-all ${listTab === 'candidatures' ? 'bg-[#082151] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Candidatures ({applications.length})
                </button>
              </div>
            </div>
          }
        >
          {listTab === 'devis' ? (
            devisList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Aucun devis envoyé</p>
              </div>
            ) : (
              <div className="space-y-3">
                {devisList.slice(0, 5).map(devis => (
                  <div key={devis.id} className="p-3 rounded-[20px] border border-slate-100 bg-white hover:shadow-md transition-all duration-200 cursor-pointer" onClick={() => navigate('/freelancer/devis-envoyes')}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{devis.type_travaux || 'Demande de devis'}</p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                          <FileText className="h-3 w-3 text-slate-400" />
                          Client: {[devis.client_prenom, devis.client_nom].filter(Boolean).join(' ') || 'Particulier'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            devis.statut === 'accepte' ? 'bg-green-50 text-green-700' :
                            devis.statut === 'refuse' ? 'bg-red-50 text-red-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {devis.statut === 'en_attente' ? 'En attente' : 
                             devis.statut === 'accepte' ? 'Accepté' : 'Refusé'}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {devis.date_soumission ? new Date(devis.date_soumission).toLocaleDateString('fr-FR') : 'Date inconnue'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end shrink-0 pl-2">
                        <span className="text-sm font-bold text-[#df6422]">
                          {devis.montant_ttc ? `${Number(devis.montant_ttc).toLocaleString('fr-FR')} €` : devis.montant ? `${Number(devis.montant).toLocaleString('fr-FR')} €` : 'Non précisé'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            applications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Aucune candidature envoyée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.slice(0, 5).map(app => (
                  <div key={app.id} className="p-3 rounded-[20px] border border-slate-100 bg-white hover:shadow-md transition-all duration-200 cursor-pointer" onClick={() => navigate('/freelancer/mes-candidatures')}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{app.job_titre}</p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                          <Briefcase className="h-3 w-3 text-slate-400" />
                          Entreprise: {app.employer_denomination || app.employer_nom || 'Entreprise'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            app.statut === 'accepte' ? 'bg-green-50 text-green-700' :
                            app.statut === 'refuse' ? 'bg-red-50 text-red-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {app.statut === 'en_attente' ? 'En attente' : 
                             app.statut === 'accepte' ? 'Accepté' : 'Refusé'}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {app.date_demande ? new Date(app.date_demande).toLocaleDateString('fr-FR') : 'Date inconnue'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
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
                    onClick={() => navigate(`/freelancer/mes-messages?conversation_id=${msg.id}`)}
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
                onClick={() => navigate('/freelancer/mes-messages')}
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
          {stats.pending > 0 && (
            <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 rounded-lg">
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-900">
                    {stats.pending} candidature{stats.pending > 1 ? 's' : ''} en attente
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    En attente de réponse
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {availableMissions > 0 && (
            <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <Briefcase className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-900">{availableMissions} missions disponibles</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Explorez les opportunités
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-2"
                    onClick={() => navigate('/freelancer/list-missions')}
                  >
                    Voir les missions
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {user && user.statut_verification !== 'verifie' && (
            <div className="p-4 border-l-4 border-purple-500 bg-purple-50 rounded-lg">
              <div className="flex items-start">
                <Shield className="h-5 w-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-purple-900">Vérifiez votre identité</p>
                  <p className="text-sm text-purple-700 mt-1">
                    Augmentez votre crédibilité
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-2"
                    onClick={() => navigate('/freelancer/verification')}
                  >
                    Vérifier
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {user && (!user.prenom || !user.nom || !user.secteur_id) && (
            <div className="p-4 border-l-4 border-orange-500 bg-orange-50 rounded-lg">
              <div className="flex items-start">
                <Users className="h-5 w-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-orange-900">Complétez votre profil</p>
                  <p className="text-sm text-orange-700 mt-1">
                    Améliorez votre visibilité
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-2"
                    onClick={() => navigate('/freelancer/profile')}
                  >
                    Compléter
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {(!user?.solde_credits || user.solde_credits <= 0) && (
            <div className="p-4 border-l-4 border-amber-500 bg-amber-50 rounded-lg">
              <div className="flex items-start">
                <Package className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-900">Rechargez vos crédits</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Accédez aux demandes et débloquez plus d'opportunités
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-2 bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => navigate('/freelancer/credits')}
                  >
                    Acheter des crédits
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Applications Table */}
      <Card title="Toutes mes candidatures">
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Vous n'avez pas encore postulé à des missions</p>
            <Button onClick={() => navigate('/freelancer/list-missions')}>
              Parcourir les missions
            </Button>
          </div>
        ) : (
          <Table columns={columns} data={applications} />
        )}
      </Card>

      {/* Tips Card */}
      <Card title="Conseils pour réussir" className="mt-6 bg-gradient-to-r from-primary-50 to-blue-50">
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>Personnalisez votre profil pour vous démarquer</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>Postulez rapidement aux nouvelles offres</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>Maintenez une communication professionnelle</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}

export default FreelancerDashboard

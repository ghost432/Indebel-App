import { useState, useEffect } from 'react'
import { Briefcase, CheckCircle, XCircle, Clock, Bell, TrendingUp, AlertCircle, Users, Shield, Package, Eye, MessageSquare, PlayCircle, CheckCheck, PlusCircle } from 'lucide-react'
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
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const FreelancerDashboard = () => {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [availableMissions, setAvailableMissions] = useState(0)
  const [recentMessages, setRecentMessages] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Tableau de bord - Indebel'
    fetchApplications()
    fetchNotifications()
    fetchAvailableMissions()
    fetchRecentMessages()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await demandeService.getFreelancerDemandes()
      const applicationsData = response.data.data || []
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
      const notificationsData = response.data.data || []
      // Garder seulement les 5 dernières
      setNotifications(notificationsData.slice(0, 5))
    } catch (error) {
      console.error('Erreur chargement notifications:', error)
    }
  }

  const fetchAvailableMissions = async () => {
    try {
      const response = await missionService.getAllMissions()
      const missions = response.data.data || []
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
    total: applications.length,
    pending: applications.filter(a => a.statut === 'en_attente').length,
    accepted: applications.filter(a => a.statut === 'accepte').length,
    refused: applications.filter(a => a.statut === 'refuse').length
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
      header: 'Recruteur',
      render: (row) => (
        <span className="text-gray-900">{row.employer_denomination || row.employer_nom || 'Employeur'}</span>
      )
    },
    {
      header: 'Statut',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.statut === 'accepte' ? 'bg-green-100 text-green-800' :
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
        <div className="flex gap-3">
          {user?.peut_publier_missions && (
            <Button variant="outline" onClick={() => navigate('/employer/publish-mission')}>
              <PlusCircle className="h-5 w-5 mr-2 text-primary-600" />
              Publier une mission
            </Button>
          )}
          <Button onClick={() => navigate('/freelancer/list-missions')}>
            <Briefcase className="h-5 w-5 mr-2" />
            Missions disponibles
          </Button>
        </div>
      </div>

      {/* Notification Permission Alert */}
      <NotificationPermissionAlert />

      {/* Profile Completion Card */}
      <div className="mb-8">
        <ProfileCompletionCard user={user} />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Candidatures"
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
                <div key={notif.id} className={`p-3 rounded-lg border ${notif.lu ? 'bg-white' : 'bg-blue-50 border-blue-200'
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
                onClick={() => navigate('/freelancer/notifications')}
              >
                Voir toutes les notifications
              </Button>
            </div>
          )}
        </Card>

        {/* Dernières candidatures envoyées */}
        <Card title="Dernières candidatures envoyées">
          {applications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>Aucune candidature envoyée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 5).map(app => (
                <div key={app.id} className="p-3 rounded-lg border bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{app.job_titre}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Recruteur: {app.employer_denomination || app.employer_nom || 'Recruteur'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${app.statut === 'accepte' ? 'bg-green-100 text-green-800' :
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

          {user && !user.forfait_nom && (
            <div className="p-4 border-l-4 border-green-500 bg-green-50 rounded-lg">
              <div className="flex items-start">
                <Package className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-900">Choisissez un forfait</p>
                  <p className="text-sm text-green-700 mt-1">
                    Accédez à plus d'opportunités
                  </p>
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => navigate('/freelancer/forfaits')}
                  >
                    Voir les forfaits
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

import { useState, useEffect } from 'react'
import PageLoader from '../components/PageLoader'
import { Bell, Check, Trash2, Filter, User, Briefcase, UserRound, CheckCircle2, Info, AlertCircle, XCircle, Shield } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import { API_BASE_URL } from '../config'

const Notifications = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all') // all, unread, read
  const [loading, setLoading] = useState(true)

  // Pagination avec filtrage
  const { currentItems, currentPage, totalPages, goToPage, totalItems } = usePagination(
    notifications.filter(notif => {
      if (filter === 'all') return true
      if (filter === 'unread') return !notif.lu
      if (filter === 'read') return notif.lu
      return true
    }), 
    12
  )

  useEffect(() => {
    document.title = 'Notifications - Indebel'
    fetchNotifications()
  }, [isAdmin])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      const endpoint = isAdmin 
        ? '/notifications/platform'  // Toutes les notifications de la plateforme
        : '/notifications'            // Notifications de l'utilisateur
      
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      console.log('📬 Notifications récupérées:', response.data)
      
      const notificationsData = (response.data?.data || response.data) || []
      setNotifications(notificationsData)
    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error)
      toast.error('Erreur lors du chargement des notifications')
    } finally {
      setLoading(false)
    }
  }

  const fetchNotificationsOld = () => {
    // Simuler des notifications (à remplacer par API)
    const mockNotifications = [
      {
        id: 1,
        title: 'Nouvelle candidature',
        message: 'Jean Dupont a postulé à votre offre "Développeur React"',
        type: 'application',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 5)
      },
      {
        id: 2,
        title: 'Candidature acceptée',
        message: 'Votre candidature pour "Designer UI/UX" a été acceptée',
        type: 'success',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30)
      },
      {
        id: 3,
        title: 'Nouvelle offre disponible',
        message: 'Une nouvelle offre "Développeur Full Stack" correspond à votre profil',
        type: 'info',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
      },
      {
        id: 4,
        title: 'Message reçu',
        message: 'ABC Company vous a envoyé un message concernant votre candidature',
        type: 'message',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5)
      },
      {
        id: 5,
        title: 'Profil consulté',
        message: 'Votre profil a été consulté 5 fois cette semaine',
        type: 'info',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
      },
      {
        id: 6,
        title: 'Offre expirée',
        message: 'Votre offre "Chef de Projet" arrive à expiration dans 3 jours',
        type: 'warning',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
      },
      {
        id: 7,
        title: 'Candidature refusée',
        message: 'Votre candidature pour "Product Manager" n\'a pas été retenue',
        type: 'error',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)
      },
      {
        id: 8,
        title: 'Nouveau message',
        message: 'XYZ Corp a répondu à votre candidature',
        type: 'message',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5)
      }
    ]

    setTimeout(() => {
      setNotifications(mockNotifications)
      setLoading(false)
    }, 500)
  }

  const getFilteredNotifications = () => {
    if (filter === 'unread') return notifications.filter(n => !n.lu)
    if (filter === 'read') return notifications.filter(n => n.lu)
    return notifications
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token')
      await axios.put(`${API_BASE_URL}/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, lu: true } : notif
        )
      )
      toast.success('Notification marquée comme lue')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token')
      await axios.put(`${API_BASE_URL}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setNotifications(prev => prev.map(notif => ({ ...notif, lu: true })))
      toast.success('Toutes les notifications marquées comme lues')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const handleDelete = async (notificationId) => {
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
      toast.success('Notification supprimée')
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleDeleteAll = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer toutes les notifications ?')) {
      try {
        const token = localStorage.getItem('token')
        // Supprimer toutes les notifications une par une
        for (const notif of notifications) {
          await axios.delete(`${API_BASE_URL}/notifications/${notif.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        }
        
        setNotifications([])
        toast.success('Toutes les notifications supprimées')
      } catch (error) {
        toast.error('Erreur lors de la suppression')
      }
    }
  }

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const seconds = Math.floor((new Date() - date) / 1000)
    
    if (seconds < 60) return 'À l\'instant'
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`
    if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)}j`
    return date.toLocaleDateString('fr-FR')
  }

  const getNotificationStyle = (type, lu) => {
    const baseStyle = 'p-6 rounded-[24px] transition-all duration-300 hover:-translate-y-1'
    const readStyle = lu 
      ? 'bg-white border border-slate-100 shadow-sm' 
      : 'bg-primary-50/50 border border-primary-100 shadow-md ring-1 ring-primary-500/20'
    return `${baseStyle} ${readStyle}`
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
    return <Icon className="h-6 w-6" />
  }

  const getIconColorClasses = (type, lu) => {
    if (lu) return 'bg-slate-100 text-slate-500'
    switch(type) {
      case 'success': return 'bg-green-500 text-white shadow-lg shadow-green-500/30'
      case 'error': return 'bg-red-500 text-white shadow-lg shadow-red-500/30'
      case 'warning': return 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30'
      case 'demande': return 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
      case 'mission': return 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
      case 'verification': return 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
      case 'info': return 'bg-[#082151] text-white shadow-lg shadow-[#082151]/30'
      default: return 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
    }
  }

  const getUserDisplay = (notification) => {
    if (!isAdmin) return null
    
    const { prenom, nom, email, role, denomination } = notification
    if (role === 'employer') {
      return denomination || `${prenom} ${nom}`
    }
    return `${prenom} ${nom}`
  }

  const getRoleIcon = (role) => {
    if (role === 'employer') return <Briefcase className="h-4 w-4" />
    if (role === 'freelancer') return <User className="h-4 w-4" />
    return null
  }

  const unreadCount = notifications.filter(n => !n.lu).length

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-[#082151] rounded-[24px] shadow-md p-6 md:p-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden text-white border-0">
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-white/10 text-white rounded-2xl hidden sm:block">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {isAdmin ? 'Notifications de la plateforme' : 'Mes notifications'}
            </h1>
            <p className="text-slate-200 mt-1 text-sm md:text-base">
              {isAdmin ? (
                <>Total : <span className="font-semibold text-white">{notifications.length}</span> notification{notifications.length > 1 ? 's' : ''} sur la plateforme</>
              ) : unreadCount > 0 ? (
                <>Vous avez <span className="font-semibold text-white">{unreadCount}</span> notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}</>
              ) : (
                'Toutes vos notifications ont été lues'
              )}
            </p>
          </div>
        </div>
        <div className="relative z-10 flex items-center space-x-3">
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs py-2 px-3">
              <Check className="h-4 w-4 mr-2" />
              Tout marquer comme lu
            </Button>
          )}
          {notifications.length > 0 && (
            <Button onClick={handleDeleteAll} variant="danger" className="text-xs py-2 px-3">
              <Trash2 className="h-4 w-4 mr-2" />
              Tout supprimer
            </Button>
          )}
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#2b4eef]/20 to-[#df6422]/20 rounded-full blur-3xl -mr-16 -mt-16 z-0 pointer-events-none"></div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2 mb-6">
        <Filter className="h-5 w-5 text-gray-400" />
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Toutes ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Non lues ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'read'
              ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Lues ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3 mb-6">
        {currentItems.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Aucune notification</p>
              <p className="text-sm text-gray-500">
                {filter === 'unread' && 'Vous n\'avez aucune notification non lue'}
                {filter === 'read' && 'Vous n\'avez aucune notification lue'}
                {filter === 'all' && 'Vous n\'avez reçu aucune notification'}
              </p>
            </div>
          </Card>
        ) : 
          currentItems.map((notification) => (
            <div
              key={notification.id}
              className={getNotificationStyle(notification.type, notification.lu)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-full shrink-0 ${!notification.lu ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20 shadow-lg shadow-primary-500/30' : 'bg-slate-100 text-slate-500'}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-base font-semibold text-gray-900">
                        {notification.titre}
                      </h3>
                      {!notification.lu && (
                        <Badge variant="primary" size="sm">Nouveau</Badge>
                      )}
                    </div>
                    
                    {/* Afficher l'utilisateur pour l'admin */}
                    {isAdmin && notification.role && (
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {getRoleIcon(notification.role)}
                          <span className="font-medium">
                            {getUserDisplay(notification)}
                          </span>
                          <span>({notification.email})</span>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <p className="text-xs text-gray-400">{getTimeAgo(notification.date_creation)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {!isAdmin && !notification.lu && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Marquer comme lu"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                  )}
                  {!isAdmin && (
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        }
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            itemsPerPage={12}
            totalItems={totalItems}
          />
        </div>
      )}
    </div>
  )
}

export default Notifications

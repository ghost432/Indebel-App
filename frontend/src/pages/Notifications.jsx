import { useState, useEffect } from 'react'
import { Bell, Check, Trash2, Filter, User, Briefcase } from 'lucide-react'
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
      
      const notificationsData = response.data.data || []
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
    const baseStyle = 'p-4 rounded-lg border transition-all duration-200 hover:shadow-md'
    const readStyle = lu ? 'bg-white' : 'bg-blue-50 border-blue-200'
    
    const typeColors = {
      demande: 'border-l-4 border-l-blue-500',
      success: 'border-l-4 border-l-green-500',
      info: 'border-l-4 border-l-gray-400',
      mission: 'border-l-4 border-l-purple-500',
      warning: 'border-l-4 border-l-yellow-500',
      error: 'border-l-4 border-l-red-500',
      verification: 'border-l-4 border-l-indigo-500'
    }

    return `${baseStyle} ${readStyle} ${typeColors[type] || 'border-l-4 border-l-gray-400'}`
  }

  const getNotificationIcon = (type) => {
    const icons = {
      demande: '👤',
      success: '✅',
      info: 'ℹ️',
      mission: '💼',
      warning: '⚠️',
      error: '❌',
      verification: '🔐'
    }
    return icons[type] || 'ℹ️'
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isAdmin ? 'Notifications de la plateforme' : 'Mes notifications'}
          </h1>
          <p className="text-gray-600">
            {isAdmin ? (
              <>Total : <span className="font-semibold text-primary-600">{notifications.length}</span> notification{notifications.length > 1 ? 's' : ''} sur la plateforme</>
            ) : unreadCount > 0 ? (
              <>Vous avez <span className="font-semibold text-primary-600">{unreadCount}</span> notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}</>
            ) : (
              'Toutes vos notifications ont été lues'
            )}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
              <Check className="h-4 w-4 mr-2" />
              Tout marquer comme lu
            </Button>
          )}
          {notifications.length > 0 && (
            <Button onClick={handleDeleteAll} variant="danger" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Tout supprimer
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2 mb-6">
        <Filter className="h-5 w-5 text-gray-400" />
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Toutes ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Non lues ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'read'
              ? 'bg-primary-600 text-white'
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
                  <span className="text-3xl">{getNotificationIcon(notification.type)}</span>
                  
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

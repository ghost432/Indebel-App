import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'


const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState('default')

  // Vérifier si les notifications sont supportées
  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  // Demander la permission pour les notifications
  const requestPermission = async () => {
    if (!isSupported) {
      toast.error('Les notifications ne sont pas supportées par votre navigateur')
      return false
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === 'granted') {
        toast.success('Notifications activées !')
        return true
      } else if (result === 'denied') {
        toast.error('Notifications refusées')
        return false
      }
    } catch (error) {
      console.error('Erreur permission notifications:', error)
      return false
    }
  }

  // Afficher une notification du navigateur
  const showBrowserNotification = useCallback((titre, message, icon = '/images/favicon.png') => {
    if (permission !== 'granted') return

    try {
      const notification = new Notification(titre, {
        body: message,
        icon: icon || '/images/favicon.png',
        badge: '/images/favicon.png',
        tag: 'indebel-notification',
        requireInteraction: true, // Reste affiché jusqu'à interaction
        vibrate: [200, 100, 200], // Pattern de vibration pour mobile
      })

      // Événement au clic
      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      // Auto-fermeture après 10 secondes (optionnel)
      setTimeout(() => notification.close(), 10000)
    } catch (error) {
      console.error('Erreur affichage notification:', error)
    }
  }, [permission])

  // Récupérer les notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return

    try {
      const response = await api.get('/notifications', {
        timeout: 8000 // 8 secondes de timeout
      })

      const data = response.data.data || []
      setNotifications(data)
      setUnreadCount(response.data.non_lues || 0)
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        console.warn('Timeout lors du chargement des notifications')
      } else if (error.response?.status === 401) {
        // Laisser l'intercepteur axios gérer les 401
        console.log('🔐 Authentification requise pour les notifications')
      } else {
        console.warn('Erreur chargement notifications:', error.message)
      }
    }
  }, [user])

  // Polling pour vérifier les nouvelles notifications
  useEffect(() => {
    if (!user) return

    // Délai pour laisser l'authentification se stabiliser
    const timeoutId = setTimeout(() => {
      fetchNotifications()
    }, 1000)

    // Vérifier toutes les 30 secondes (au lieu de 10)
    const interval = setInterval(() => {
      fetchNotifications()
    }, 30000)

    return () => {
      clearTimeout(timeoutId)
      clearInterval(interval)
    }
  }, [user, fetchNotifications])

  // Détecter les nouvelles notifications et afficher popup
  useEffect(() => {
    const checkNewNotifications = async () => {
      const prevCount = parseInt(localStorage.getItem('notif_count') || '0')
      const currentCount = unreadCount

      if (currentCount > prevCount && currentCount > 0) {
        // Nouvelle notification détectée
        const newNotifs = notifications.filter(n => !n.lu).slice(0, currentCount - prevCount)

        for (const notif of newNotifs) {
          // Toast notification
          toast((t) => (
            <div className="flex items-start space-x-3">
              <div className="flex-1">
                <p className="font-semibold text-sm">{notif.titre}</p>
                <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
              </div>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          ), {
            duration: 6000,
            style: {
              maxWidth: '500px',
            },
          })

          // Notification navigateur
          showBrowserNotification(notif.titre, notif.message)
        }
      }

      localStorage.setItem('notif_count', currentCount.toString())
    }

    checkNewNotifications()
  }, [unreadCount, notifications, showBrowserNotification])

  // Marquer comme lue
  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, lu: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Erreur marquage:', error)
    }
  }

  // Tout marquer comme lu
  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all')

      setNotifications(prev => prev.map(n => ({ ...n, lu: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Erreur marquage:', error)
    }
  }

  // Supprimer notification
  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`)

      setNotifications(prev => prev.filter(n => n.id !== id))
      setUnreadCount(prev => {
        const notif = notifications.find(n => n.id === id)
        return notif && !notif.lu ? Math.max(0, prev - 1) : prev
      })
    } catch (error) {
      console.error('Erreur suppression:', error)
    }
  }

  const value = {
    notifications,
    unreadCount,
    isSupported,
    permission,
    requestPermission,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    showBrowserNotification
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

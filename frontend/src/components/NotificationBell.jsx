import { useState, useEffect, useRef } from 'react'
import { Bell, Check, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'

const NotificationBell = () => {
  const { user } = useAuth()
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead
  } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Fermer dropdown quand on clique dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = (notificationId) => {
    markAsRead(notificationId)
  }

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const seconds = Math.floor((new Date() - date) / 1000)
    
    if (seconds < 60) return 'À l\'instant'
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`
    return `Il y a ${Math.floor(seconds / 86400)}j`
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

  const notificationPath = user?.role === 'admin'
    ? '/admin/notifications'
    : user?.role === 'employer' 
    ? '/employer/notifications' 
    : '/freelancer/notifications'

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-6 w-6 text-gray-600" />
        
        {/* Badge compteur */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="fixed md:absolute right-2 md:right-0 left-2 md:left-auto top-16 md:top-auto md:mt-2 w-auto md:w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Aucune notification</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id)}
                  className={`
                    p-4 border-b hover:bg-gray-50 transition-colors cursor-pointer
                    ${!notification.lu ? 'bg-blue-50' : ''}
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate flex-1">
                          {notification.titre}
                        </p>
                        {!notification.lu && (
                          <span className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-gray-400">{getTimeAgo(notification.date_creation)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t bg-gray-50 rounded-b-lg">
            <Link
              to={notificationPath}
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Voir toutes les notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell

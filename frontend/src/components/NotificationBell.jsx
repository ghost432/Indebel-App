import { useState, useEffect, useRef } from 'react'
import { AlertCircle, Bell, Briefcase, CheckCircle2, Info, Shield, UserRound, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'

const NotificationBell = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
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

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id)
    setIsOpen(false)
    if (notification.lien) {
      navigate(notification.lien)
    }
  }

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const seconds = Math.floor((new Date() - date) / 1000)
    
    if (seconds < 60) return 'À l\'instant'
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`
    return `Il y a ${Math.floor(seconds / 86400)}j`
  }

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
    return icons[type] || Info
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
        className="dashboard-icon-button relative"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        
        {/* Badge compteur */}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#c02525] text-xs font-black text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="fixed md:absolute right-2 md:right-0 left-2 md:left-auto top-16 md:top-auto md:mt-2 w-auto md:w-96 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl z-50 max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <h3 className="font-black text-[#082151]">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-bold text-[#c02525] hover:text-[#9c1d1d]"
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
                <Bell className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                <p>Aucune notification</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((notification) => {
                const NotificationIcon = getNotificationIcon(notification.type)
                return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer
                    ${!notification.lu ? 'bg-primary-50/50' : 'bg-white'}
                  `}
                >
                  <div className="flex items-start space-x-4">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${getIconColorClasses(notification.type, notification.lu)}`}>
                      <NotificationIcon className="h-5 w-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-0.5 gap-2">
                        <p className={`text-sm truncate flex-1 ${!notification.lu ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                          {notification.titre}
                        </p>
                        {!notification.lu && (
                          <span className="h-2 w-2 bg-primary-600 rounded-full flex-shrink-0 mt-1.5"></span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-1.5 line-clamp-2">{notification.message}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{getTimeAgo(notification.date_creation)}</p>
                    </div>
                  </div>
                </div>
              )})
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50">
            <Link
              to={notificationPath}
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm font-black text-[#082151] hover:text-[#c02525]"
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

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'

const NotificationPermissionAlert = () => {
  const { isSupported, permission, requestPermission } = useNotifications()
  const [dismissed, setDismissed] = useState(false)

  // Vérifier si l'utilisateur a déjà refusé l'alerte
  useEffect(() => {
    const isDismissed = localStorage.getItem('notificationAlertDismissed')
    if (isDismissed === 'true') {
      setDismissed(true)
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('notificationAlertDismissed', 'true')
  }

  const handleActivate = async () => {
    await requestPermission()
    setDismissed(true)
  }

  // Ne pas afficher si :
  // - Les notifications ne sont pas supportées
  // - La permission est déjà accordée
  // - L'utilisateur a déjà refusé l'alerte
  if (!isSupported || permission === 'granted' || dismissed) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-4 shadow-sm mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
            <Bell className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            Activez les notifications en temps réel
          </h3>
          <p className="text-sm text-gray-700 mb-3">
            Recevez des alertes instantanées pour les nouvelles missions, demandes et messages importants, 
            même lorsque vous n'êtes pas sur la plateforme.
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleActivate}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Activer les notifications
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Plus tard
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          title="Fermer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

export default NotificationPermissionAlert

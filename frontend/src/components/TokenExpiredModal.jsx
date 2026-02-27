import { useState, useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

const TokenExpiredModal = ({ isOpen, onReconnect }) => {
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    if (!isOpen) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          onReconnect()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, onReconnect])

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Pas de fermeture possible
      title="Session expirée"
      size="sm"
    >
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Votre session a expiré
          </h3>
          <p className="text-gray-600 mb-4">
            Pour des raisons de sécurité, votre session d'authentification a expiré. 
            Vous allez être redirigé vers la page de connexion.
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <RefreshCw className="h-4 w-4 inline mr-2" />
            Redirection automatique dans <strong>{countdown}</strong> secondes...
          </p>
        </div>

        <Button 
          onClick={onReconnect}
          className="w-full"
        >
          Se reconnecter maintenant
        </Button>
      </div>
    </Modal>
  )
}

export default TokenExpiredModal

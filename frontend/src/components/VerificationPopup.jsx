import { useState, useEffect } from 'react'
import { X, Shield, CheckCircle, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from './Button'

const VerificationPopup = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Vérifier si l'utilisateur est un freelancer et n'est pas vérifié
    if (user && user.role === 'freelancer' && user.statut_verification === 'non_verifie') {
      // Vérifier si l'utilisateur a déjà fermé le popup (dans cette session)
      const popupClosed = sessionStorage.getItem('verification_popup_closed')
      
      if (!popupClosed) {
        // Afficher le popup après un petit délai pour une meilleure UX
        const timer = setTimeout(() => {
          setIsVisible(true)
        }, 1500)

        return () => clearTimeout(timer)
      }
    }
  }, [user])

  const handleClose = () => {
    setIsVisible(false)
    // Stocker dans sessionStorage pour ne plus afficher dans cette session
    sessionStorage.setItem('verification_popup_closed', 'true')
  }

  const handleVerify = () => {
    setIsVisible(false)
    sessionStorage.setItem('verification_popup_closed', 'true')
    navigate('/freelancer/verification')
  }

  if (!isVisible) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Popup */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-lg shadow-2xl max-w-md w-full animate-fade-in-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 rounded-t-lg relative">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-4 text-white">
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <Shield className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Vérification d'identité</h2>
                <p className="text-white text-opacity-90 text-sm">Confirmez votre compte</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-700 font-medium">
                  Votre identité n'est pas encore vérifiée
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Pour accéder à toutes les fonctionnalités de la plateforme et rassurer les employeurs, vérifiez votre identité dès maintenant.
                </p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-green-900 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Avantages de la vérification :
              </p>
              <ul className="text-sm text-green-800 space-y-1 ml-6">
                <li>✓ Badge vérifié sur votre profil</li>
                <li>✓ Confiance accrue des employeurs</li>
                <li>✓ Accès prioritaire aux missions</li>
                <li>✓ Augmentation de vos chances d'embauche</li>
              </ul>
            </div>

            <p className="text-xs text-gray-500 text-center">
              ⏱️ La vérification prend 5 minutes et est validée sous 24-48h
            </p>
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 rounded-b-lg flex gap-3">
            <Button
              variant="secondary"
              onClick={handleClose}
              className="flex-1"
            >
              Plus tard
            </Button>
            <Button
              variant="primary"
              onClick={handleVerify}
              className="flex-1"
            >
              Vérifier maintenant
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
      `}</style>
    </>
  )
}

export default VerificationPopup

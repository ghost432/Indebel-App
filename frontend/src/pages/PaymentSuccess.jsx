import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, TestTube } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Card from '../components/Card'
import Button from '../components/Button'
import toast from 'react-hot-toast'

const PaymentSuccess = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [countdown, setCountdown] = useState(3)

  const sessionId = searchParams.get('session_id')
  const isSimulation = searchParams.get('simulation') === 'true'
  const isFallback = searchParams.get('fallback') === 'true'

  useEffect(() => {
    document.title = 'Paiement réussi - Indebel'

    // Afficher le toast approprié
    if (isFallback) {
      toast.success('✅ Forfait activé ! Un administrateur vous contactera pour finaliser le paiement.', {
        duration: 5000,
        icon: '⚠️'
      })
    } else if (isSimulation) {
      toast.success('🧪 Forfait activé en mode test (aucun paiement réel).', {
        duration: 5000,
        icon: '✅'
      })
    } else {
      toast.success('🎉 Paiement réussi ! Votre forfait a été activé.', {
        duration: 5000,
        icon: '✅'
      })
    }

    // Redirection automatique après 3 secondes
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          const rolePath = user?.role === 'admin' ? '/admin' : `/${user?.role}`
          navigate(`${rolePath}/dashboard`)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [navigate, user, isSimulation, isFallback])

  const getIcon = () => {
    if (isFallback) return <AlertCircle className="h-12 w-12 text-yellow-600" />
    if (isSimulation) return <TestTube className="h-12 w-12 text-blue-600" />
    return <CheckCircle className="h-12 w-12 text-green-600" />
  }

  const getTitle = () => {
    if (isFallback) return "Forfait activé (Attente paiement)"
    if (isSimulation) return "Mode Simulation : Forfait activé"
    return "Paiement réussi !"
  }

  const getBannerColor = () => {
    if (isFallback) return "bg-yellow-50 border-yellow-200 text-yellow-800"
    if (isSimulation) return "bg-blue-50 border-blue-200 text-blue-800"
    return "bg-green-50 border-green-200 text-green-800"
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 p-4">
      <Card className="max-w-md w-full text-center shadow-2xl">
        <div className="mb-6">
          <div className={`mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-4 ${isFallback ? 'bg-yellow-100' : isSimulation ? 'bg-blue-100' : 'bg-green-100'}`}>
            {getIcon()}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {getTitle()}
          </h1>
          <p className="text-gray-600">
            Votre forfait a été activé avec succès
          </p>
        </div>

        <div className={`border rounded-lg p-4 mb-6 ${getBannerColor()}`}>
          <p className="text-sm">
            {isFallback ? (
              <>✅ Forfait activé temporairement<br />⚠️ Un admin vous contactera pour le règlement</>
            ) : isSimulation ? (
              <>✅ Forfait activé (Mode Test)<br />🧪 Aucun prélèvement réel effectué</>
            ) : (
              <>✅ Un email de confirmation vous a été envoyé<br />✅ Votre forfait est maintenant actif</>
            )}
          </p>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-500">
            Redirection vers votre tableau de bord dans <span className="font-bold text-indigo-600">{countdown}s</span>...
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => navigate(user?.role === 'admin' ? '/admin/dashboard' : `/${user?.role}/dashboard`)}
            className="w-full"
          >
            Aller au dashboard maintenant
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default PaymentSuccess

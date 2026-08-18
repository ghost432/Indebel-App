import { useEffect } from 'react'
import { CheckCircle } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'

const PaymentSuccess = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    document.title = 'Paiement réussi - Indebel'
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <Card className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Paiement réussi !
          </h1>
          <p className="text-gray-600">
            Votre forfait a été activé avec succès
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800">
            ✅ Un email de confirmation vous a été envoyé<br />
            ✅ Votre forfait est maintenant actif<br />
            ✅ Vous pouvez profiter de toutes les fonctionnalités
          </p>
        </div>

        {sessionId && (
          <p className="text-xs text-gray-500 mb-6">
            ID de session : {sessionId}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => navigate('/employer/dashboard')}
            className="w-full"
          >
            Retour au dashboard
          </Button>
          <Button 
            onClick={() => navigate('/employer/forfaits')}
            variant="secondary"
            className="w-full"
          >
            Voir mon forfait
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default PaymentSuccess

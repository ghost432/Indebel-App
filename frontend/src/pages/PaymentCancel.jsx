import { useEffect } from 'react'
import { XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'

const PaymentCancel = () => {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Paiement annulé - Indebel'
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="mx-auto h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <XCircle className="h-12 w-12 text-gray-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Paiement annulé
          </h1>
          <p className="text-gray-600">
            Votre paiement n'a pas été effectué
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700">
            Aucun montant n'a été débité de votre compte.<br />
            Vous pouvez réessayer quand vous le souhaitez.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => navigate('/freelancer/forfaits')}
            className="w-full"
          >
            Voir les forfaits
          </Button>
          <Button 
            onClick={() => navigate('/freelancer/dashboard')}
            variant="secondary"
            className="w-full"
          >
            Retour au dashboard
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default PaymentCancel

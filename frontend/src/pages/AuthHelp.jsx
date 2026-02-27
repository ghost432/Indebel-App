import { useEffect } from 'react'
import { RefreshCw, AlertTriangle, CheckCircle, LogIn } from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'

const AuthHelp = () => {
  useEffect(() => {
    document.title = 'Aide - Problème d\'authentification'
  }, [])

  const handleClearData = () => {
    // Nettoyer toutes les données d'authentification
    localStorage.clear()
    sessionStorage.clear()
    
    // Rediriger vers la page de connexion
    window.location.href = '/login'
  }

  const handleReload = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Problème d'authentification
          </h1>
          <p className="text-gray-600">
            Il semble y avoir un problème avec votre session. Suivez les étapes ci-dessous pour résoudre le problème.
          </p>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <RefreshCw className="h-5 w-5 mr-2 text-blue-500" />
            Solutions recommandées
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                1
              </div>
              <div>
                <h3 className="font-medium text-blue-900">Effacer les données de navigation</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Supprimez les données de session corrompues et reconnectez-vous.
                </p>
                <Button 
                  onClick={handleClearData}
                  className="mt-2 bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Effacer et se reconnecter
                </Button>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">
                2
              </div>
              <div>
                <h3 className="font-medium text-green-900">Recharger la page</h3>
                <p className="text-green-700 text-sm mt-1">
                  Actualisez la page pour recharger les composants d'authentification.
                </p>
                <Button 
                  onClick={handleReload}
                  variant="outline"
                  className="mt-2 border-green-600 text-green-600 hover:bg-green-50"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recharger la page
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            Pourquoi ce problème ?
          </h2>
          
          <div className="space-y-3 text-gray-600">
            <p>
              Ce problème peut survenir dans les situations suivantes :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Mise à jour de sécurité du système</li>
              <li>Session expirée après une longue période d'inactivité</li>
              <li>Données de navigation corrompues</li>
              <li>Changement des paramètres de sécurité</li>
            </ul>
            
            <p className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">
              <strong>Note :</strong> Vos données de compte sont sécurisées. Seule une nouvelle connexion est requise.
            </p>
          </div>
        </Card>

        <div className="text-center">
          <p className="text-gray-500 text-sm">
            Si le problème persiste, contactez le support technique.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthHelp

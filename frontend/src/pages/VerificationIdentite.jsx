import { useState, useEffect } from 'react'
import PageLoader from '../components/PageLoader'
import { Shield, AlertTriangle, CheckCircle, Clock, FileText, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import { verificationService } from '../services/verificationService'
import toast from 'react-hot-toast'

const VerificationIdentite = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [statut, setStatut] = useState(null)
  const [derniereDemande, setDerniereDemande] = useState(null)

  useEffect(() => {
    document.title = 'Vérification d\'identité - Indebel'
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await verificationService.getStatus()
      setStatut((response.data?.data || response.data).statut || 'non_verifie')
      setDerniereDemande((response.data?.data || response.data).derniere_demande)
    } catch (error) {
      console.error('Erreur lors du chargement du statut:', error)
      // Par défaut, considérer comme non vérifié si erreur
      setStatut('non_verifie')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <PageLoader fullScreen />
  }

  // Profil NON VÉRIFIÉ
  if (statut === 'non_verifie' || !statut) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Vérification d'identité
        </h1>

        <Card className="text-center p-12 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
          {/* Placeholder pour 1.png - Ajouter l'image ici */}
          <div className="mb-6 flex justify-center">
            <div className="w-48 h-48 bg-gradient-to-br from-amber-50 to-orange-100 rounded-full shadow-inner ring-4 ring-orange-50 flex items-center justify-center">
              <Shield className="h-24 w-24 text-orange-500" />
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl shadow-sm mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-orange-500 mr-3 flex-shrink-0 mt-1" />
              <div className="text-left">
                <h3 className="text-lg font-semibold text-orange-900 mb-2">
                  Profil non vérifié
                </h3>
                <p className="text-orange-800 mb-3">
                  Votre profil n'est pas encore vérifié. Pour postuler aux missions, vous devez d'abord faire vérifier votre identité.
                </p>
                <ul className="text-sm text-orange-700 space-y-2">
                  <li>✓ Accédez à davantage de missions</li>
                  <li>✓ Renforcez votre crédibilité auprès des employeurs</li>
                  <li>✓ Augmentez vos chances d'être sélectionné</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600 mb-6">
              Pour vérifier votre identité, vous devrez fournir une pièce d'identité valide et un selfie.
            </p>

            <Button
              onClick={() => navigate('/freelancer/verification/formulaire')}
              className="w-full bg-orange-500 text-white hover:bg-orange-600 rounded-xl shadow-md hover:shadow-lg transition-all"
              size="lg"
            >
              <FileText className="h-5 w-5 mr-2" />
              Commencer la vérification
            </Button>

            <p className="text-xs text-gray-500 mt-4">
              La vérification prend généralement 24 à 48 heures
            </p>
          </div>
        </Card>
      </div>
    )
  }

  // Profil EN COURS DE VÉRIFICATION
  if (statut === 'en_cours') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Vérification d'identité
        </h1>

        <Card className="text-center p-12 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
          <div className="mb-6 flex justify-center">
            <div className="w-48 h-48 bg-gradient-to-br from-blue-50 to-indigo-100 shadow-inner ring-4 ring-blue-50 rounded-full flex items-center justify-center animate-pulse">
              <Clock className="h-24 w-24 text-blue-600" />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl shadow-sm mb-6">
            <div className="flex items-start">
              <Clock className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
              <div className="text-left">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Profil en cours de vérification
                </h3>
                <p className="text-blue-800 mb-3">
                  Votre demande de vérification a bien été reçue. Notre équipe examine vos documents.
                </p>
                <p className="text-sm text-blue-700">
                  ⏱️ Temps de traitement estimé : 24-48 heures
                </p>
              </div>
            </div>
          </div>

          {derniereDemande && (
            <div className="text-left space-y-3 mb-6">
              <h4 className="font-semibold text-gray-900">Informations soumises :</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Date de soumission</p>
                  <p className="font-medium">{new Date(derniereDemande.date_soumission).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-gray-600">Type de document</p>
                  <p className="font-medium capitalize">{derniereDemande.type_document?.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          )}

          <p className="text-gray-600">
            Nous vous notifierons par email dès que votre identité sera vérifiée.
          </p>
        </Card>
      </div>
    )
  }

  // Profil VÉRIFIÉ
  if (statut === 'verifie') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Vérification d'identité
        </h1>

        <Card className="text-center p-12 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
          {/* Placeholder pour 2.png - Ajouter l'image ici */}
          <div className="mb-6 flex justify-center">
            <div className="w-48 h-48 bg-gradient-to-br from-green-50 to-emerald-100 shadow-inner ring-4 ring-green-50 rounded-full flex items-center justify-center">
              <CheckCircle className="h-24 w-24 text-green-600" />
            </div>
          </div>

          <div className="bg-green-50 border border-green-100 p-6 rounded-2xl shadow-sm mb-6">
            <div className="flex items-start">
              <CheckCircle className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
              <div className="text-left">
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  🎉 Profil vérifié avec succès !
                </h3>
                <p className="text-green-800 mb-3">
                  Félicitations ! Votre identité a été vérifiée. Vous pouvez maintenant postuler à toutes les missions disponibles.
                </p>
                <p className="text-sm text-green-700">
                  ✅ Votre profil affiche maintenant le badge "Vérifié"
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => navigate('/freelancer/jobs')}
              className="w-full bg-gradient-to-r from-green-500 to-green-700"
              size="lg"
            >
              Voir les missions disponibles
            </Button>

            <Button
              onClick={() => navigate('/freelancer/profile')}
              variant="outline"
              className="w-full"
            >
              Voir mon profil
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Profil REFUSÉ
  if (statut === 'refuse') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Vérification d'identité
        </h1>

        <Card className="text-center p-12 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
          <div className="mb-6 flex justify-center">
            <div className="w-48 h-48 bg-gradient-to-br from-red-50 to-rose-100 shadow-inner ring-4 ring-red-50 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-24 w-24 text-red-600" />
            </div>
          </div>

          <div className="bg-red-50 border border-red-100 p-6 rounded-2xl shadow-sm mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-1" />
              <div className="text-left">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Vérification refusée
                </h3>
                <p className="text-red-800 mb-3">
                  Votre demande de vérification n'a pas pu être validée.
                </p>
                {derniereDemande?.motif_refus && (
                  <div className="bg-white/50 p-4 rounded-lg mt-3">
                    <p className="text-sm font-medium text-red-900 mb-1">Raison du refus :</p>
                    <p className="text-sm text-red-800">{derniereDemande.motif_refus}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="text-gray-600 mb-6">
            Veuillez soumettre à nouveau vos documents en tenant compte des remarques ci-dessus.
          </p>

          <Button
            onClick={() => navigate('/freelancer/verification/formulaire')}
            className="w-full bg-red-500 text-white hover:bg-red-600 rounded-xl shadow-md hover:shadow-lg transition-all"
            size="lg"
          >
            <Upload className="h-5 w-5 mr-2" />
            Soumettre à nouveau
          </Button>
        </Card>
      </div>
    )
  }

  return null
}

export default VerificationIdentite

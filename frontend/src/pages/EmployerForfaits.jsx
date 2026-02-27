import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Package, Check, Star, CreditCard } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import { forfaitService } from '../services/forfaitService'
import { paiementService } from '../services/paiementService'
import toast from 'react-hot-toast'
import { getCleanForfaitName, getForfaitNameWithoutSuffix } from '../utils/forfaitUtils'

const EmployerForfaits = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [forfaits, setForfaits] = useState([])
  const [forfaitActuel, setForfaitActuel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  // Helper function pour vérifier si une fonctionnalité est active
  const isFeatureActive = (value) => {
    return value && value !== 0 && value !== '0' && value !== false && value !== 'false' && value !== null && value !== undefined
  }

  // Helper function pour formater le type de facturation
  const getTypeFacturationLabel = (type) => {
    const labels = {
      'unique': 'Facturation unique',
      'mensuel': 'Facturation mensuelle',
      'trimestriel': 'Facturation trimestrielle (3 mois)',
      'semestriel': 'Facturation semestrielle (6 mois)',
      'annuel': 'Facturation annuelle (12 mois)'
    }
    return labels[type] || 'Facturation unique'
  }

  // Helper function pour nettoyer les données d'affichage
  const getFeaturesForDisplay = (forfait) => {
    const features = []

    // Afficher le type de facturation
    if (forfait.type_facturation) {
      features.push({
        id: 'facturation',
        text: getTypeFacturationLabel(forfait.type_facturation),
        active: true
      })
    }

    // Durée du forfait en mois
    if (forfait.duree_abonnement_mois && forfait.duree_abonnement_mois > 0) {
      features.push({
        id: 'duree_abonnement',
        text: `Durée: ${forfait.duree_abonnement_mois} mois`,
        active: true
      })
    }

    // Missions
    if (forfait.max_missions && forfait.max_missions > 0) {
      features.push({
        id: 'missions',
        text: `${forfait.max_missions} ${forfait.max_missions > 1 ? 'missions maximales' : 'mission maximale'}`,
        active: true
      })
    } else {
      features.push({
        id: 'missions',
        text: 'Missions illimitées',
        active: true
      })
    }

    // Durée de l'offre (jours d'accès à une offre)
    if (forfait.duree_offre_jours && forfait.duree_offre_jours > 0) {
      features.push({
        id: 'duree_offre',
        text: `${forfait.duree_offre_jours} jours d'accès par offre`,
        active: true
      })
    }

    // Logo page d'accueil
    if (isFeatureActive(forfait.logo_page_accueil)) {
      features.push({
        id: 'logo',
        text: 'Logo en page d\'accueil',
        active: true
      })
    }

    // Gestion candidatures
    if (isFeatureActive(forfait.gestion_candidatures)) {
      features.push({
        id: 'candidatures',
        text: 'Gestion des candidatures',
        active: true
      })
    }

    // Badge premium
    if (isFeatureActive(forfait.badge_premium)) {
      features.push({
        id: 'badge',
        text: 'Badge premium sur votre profil',
        active: true
      })
    }

    // Mise en avant
    if (isFeatureActive(forfait.mise_en_avant)) {
      features.push({
        id: 'mise_en_avant',
        text: 'Profil mis en avant',
        active: true
      })
    }

    // Statistiques avancées
    if (isFeatureActive(forfait.statistiques_avancees)) {
      features.push({
        id: 'stats',
        text: 'Statistiques avancées',
        active: true
      })
    }

    // Accès aux prestataires
    if (isFeatureActive(forfait.api_access)) {
      features.push({
        id: 'api',
        text: 'Liste des Prestataires',
        active: true
      })
    }

    // Support (toujours affiché)
    const supportText = forfait.priorite_support === 'premium' ? 'prioritaire 24h' :
      forfait.priorite_support === 'prioritaire' ? 'prioritaire 24h' :
        'standard 48h'
    features.push({
      id: 'support',
      text: `Support ${supportText}`,
      active: true
    })

    // Label Indebel
    if (isFeatureActive(forfait.label_indebel)) {
      features.push({
        id: 'label',
        text: 'Accès au Label Indebel',
        active: true
      })
    }

    return features.filter(f => f.active)
  }

  useEffect(() => {
    document.title = 'Mes Forfaits - Indebel'
    fetchData()
  }, [])

  useEffect(() => {
    // Vérifier si on revient d'un paiement réussi
    const cancelled = searchParams.get('cancelled')

    // Recharger les données après 1 seconde pour laisser le webhook s'exécuter
    setTimeout(() => {
      fetchData()
    }, 1000)

    if (cancelled === 'true') {
      toast.error('Paiement annulé. Votre forfait n\'a pas été modifié.', {
        duration: 4000
      })
      // Nettoyer l'URL
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [forfaitsRes, monForfaitRes] = await Promise.all([
        forfaitService.getAllForfaits('employer'),
        forfaitService.getMyForfait()
      ])

      setForfaits(forfaitsRes.data.data)
      setForfaitActuel(monForfaitRes.data.data)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des forfaits')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectForfait = async (forfait) => {
    if (forfaitActuel && forfaitActuel.forfait_id === forfait.id) {
      toast('Vous utilisez déjà ce forfait', { icon: 'ℹ️' })
      return
    }

    if (!confirm(`Voulez-vous passer au forfait "${getForfaitNameWithoutSuffix(forfait.nom)}" ?`)) {
      return
    }

    try {
      setProcessing(true)

      const response = await paiementService.createCheckoutSession(forfait.id)

      if (response.data.is_free) {
        // Forfait gratuit - activation directe
        toast.success(response.data.message)
        fetchData() // Recharger les données
      } else if (response.data.simulation_mode) {
        // Mode simulation - activation sans paiement réel
        toast.success(response.data.message, { duration: 4000 })
        setTimeout(() => {
          fetchData() // Recharger les données
        }, 1000)
      } else if (response.data.session_url) {
        // Forfait payant - redirection vers Stripe
        toast.loading('Redirection vers le paiement...', { duration: 2000 })
        window.location.href = response.data.session_url
      } else {
        toast.error('Erreur: Réponse invalide du serveur')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error.response?.data?.message || 'Erreur lors du changement de forfait')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="container-custom py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choisissez votre forfait
        </h1>
        <p className="text-xl text-gray-600">
          Trouvez le forfait qui correspond à vos besoins
        </p>
      </div>

      {/* Forfait actuel */}
      {forfaitActuel && forfaitActuel.nom && (
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Forfait actuel</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{getForfaitNameWithoutSuffix(forfaitActuel.nom)}</h3>
              <div className="mt-2 space-y-1">
                {forfaitActuel.forfait_date_souscription && (
                  <p className="text-sm text-gray-600">
                    📅 Souscrit le {new Date(forfaitActuel.forfait_date_souscription).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                )}
                {forfaitActuel.forfait_date_expiration && (
                  <p className="text-sm font-semibold text-blue-700">
                    ⏰ Expire le {new Date(forfaitActuel.forfait_date_expiration).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                )}
              </div>
            </div>
            <div className="bg-white rounded-full p-3">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>
      )}

      {/* Liste des forfaits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {forfaits.map((forfait) => {
          const estActuel = forfaitActuel && forfaitActuel.forfait_id === forfait.id
          const estRecommande = !!forfait.recommande

          return (
            <Card
              key={forfait.id}
              className={`relative ${estRecommande ? 'border-2 border-yellow-400 shadow-xl' : ''} ${estActuel ? 'ring-2 ring-green-500' : ''}`}
            >
              {/* Badge actuel */}
              {estActuel && (
                <div className="absolute top-4 right-4">
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Actuel
                  </span>
                </div>
              )}

              <div>
                {/* Header */}
                <div className="text-center mb-6">
                  {/* Badge recommandé au-dessus de l'icône */}
                  {estRecommande && (
                    <div className="flex justify-center mb-2">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                        <Star className="h-3 w-3 fill-current" />
                        Recommandé
                      </div>
                    </div>
                  )}

                  <div
                    className="mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: forfait.couleur_badge + '20' }}
                  >
                    <Package className="h-8 w-8" style={{ color: forfait.couleur_badge }} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{getForfaitNameWithoutSuffix(forfait.nom)}</h3>
                  <p className="text-gray-600 mt-2">{forfait.description}</p>
                </div>

                {/* Prix */}
                <div className="text-center mb-6">
                  {!forfait.prix_mensuel || forfait.prix_mensuel === 0 || forfait.prix_mensuel === '0.00' || parseFloat(forfait.prix_mensuel) === 0 ? (
                    <div className="text-4xl font-bold text-gray-900">Gratuit</div>
                  ) : (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">À partir de</div>
                      <div className="text-4xl font-bold text-gray-900">
                        {forfait.prix_mensuel}€ <span className="text-lg font-normal text-gray-500">HT</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {(parseFloat(forfait.prix_mensuel) + (parseFloat(forfait.prix_mensuel) * 0.21)).toFixed(2)}€ TTC (TVA 21%)
                      </div>
                    </div>
                  )}
                </div>

                {/* Fonctionnalités */}
                <div className="space-y-3 mb-6">
                  {getFeaturesForDisplay(forfait).map((feature) => (
                    <div key={feature.id} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* Bouton */}
                <Button
                  className="w-full"
                  disabled={estActuel || processing}
                  onClick={() => handleSelectForfait(forfait)}
                  variant={estRecommande ? 'primary' : 'secondary'}
                >
                  {processing ? (
                    'Traitement...'
                  ) : estActuel ? (
                    'Forfait actuel'
                  ) : forfait.prix_mensuel === 0 || forfait.prix_mensuel === '0.00' ? (
                    'Passer au gratuit'
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Choisir ce forfait
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Notes informatives */}
      <div className="mt-12 text-center space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
          <p className="text-sm text-blue-800">
            ℹ️ <strong>Information TVA :</strong> La TVA de 21% sera automatiquement ajoutée lors du paiement selon votre localisation.
          </p>
        </div>
        <p className="text-sm text-gray-600">
          🔒 Paiement sécurisé par <strong>Stripe</strong>. Vos données bancaires sont protégées.
        </p>
      </div>
    </div>
  )
}

export default EmployerForfaits

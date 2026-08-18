import { useState, useEffect } from 'react'
import PageLoader from '../components/PageLoader'
import { useSearchParams } from 'react-router-dom'
import { Package, Check, Star, CreditCard, Info } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import { forfaitService } from '../services/forfaitService'
import { paiementService } from '../services/paiementService'
import toast from 'react-hot-toast'

const FreelancerForfaits = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [forfaits, setForfaits] = useState([])
  const [forfaitActuel, setForfaitActuel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    document.title = 'Mes Forfaits - Indebel'
    fetchData()
  }, [])

  useEffect(() => {
    // Vérifier si on revient d'un paiement réussi
    const success = searchParams.get('success')
    const cancelled = searchParams.get('cancelled')
    const fallback = searchParams.get('fallback')
    const simulation = searchParams.get('simulation')

    if (success === 'true') {
      if (fallback === 'true') {
        // Mode fallback - paiement activé sans Stripe
        toast.success('✅ Forfait activé ! Un administrateur vous contactera pour finaliser le paiement.', {
          duration: 6000,
          icon: '⚠️'
        })
      } else if (simulation === 'true') {
        // Mode simulation
        toast.success('🧪 Forfait activé en mode test (aucun paiement réel).', {
          duration: 5000,
          icon: '✅'
        })
      } else {
        // Paiement Stripe réussi
        toast.success('🎉 Paiement réussi ! Votre forfait a été mis à jour.', {
          duration: 5000,
          icon: '✅'
        })
      }
      // Nettoyer l'URL
      setSearchParams({})
      // Recharger les données après 1 seconde pour laisser le webhook s'exécuter
      setTimeout(() => {
        fetchData()
      }, 1000)
    }

    if (cancelled === 'true') {
      toast.error('Paiement annulé. Votre forfait n\'a pas été modifié.', {
        duration: 4000
      })
      // Nettoyer l'URL
      setSearchParams({})
    }
  }, [searchParams])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [forfaitsRes, monForfaitRes] = await Promise.all([
        forfaitService.getAllForfaits('freelancer'),
        forfaitService.getMyForfait()
      ])
      
      setForfaits((forfaitsRes.data?.data || forfaitsRes.data))
      setForfaitActuel((monForfaitRes.data?.data || monForfaitRes.data))
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

    if (!confirm(`Voulez-vous passer au forfait "${forfait.nom}" ?`)) {
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

  const getPeriodeLabel = (duree, dureeMois) => {
    if (dureeMois === 0 || dureeMois === '0') return ' à vie';
    if (dureeMois > 0) return `/${dureeMois} mois`;
    if (duree === 'annuel') return '/an';
    if (duree === 'semestriel') return '/semestre';
    if (duree === 'trimestriel') return '/trimestre';
    return '/mois';
  };

  const getFacturationLabel = (duree, dureeMois) => {
    if (dureeMois === 0 || dureeMois === '0') return 'unique (à vie)';
    if (dureeMois > 0) return `tous les ${dureeMois} mois`;
    if (duree === 'annuel') return 'annuelle';
    if (duree === 'semestriel') return 'semestrielle';
    if (duree === 'trimestriel') return 'trimestrielle';
    return 'mensuelle';
  };

  const getLimitLabel = (val, unit = '') => val == null ? `Illimité${unit ? ' ' + unit : ''}` : `${val}${unit ? ' ' + unit : ''}`;

  const ForfaitFeatureRow = ({ check = true, label }) => (
    <div className="flex items-center gap-3">
      <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${check ? 'bg-green-50' : 'bg-slate-100'}`}>
        <Check className={`h-4 w-4 ${check ? 'text-green-600' : 'text-slate-400'}`} />
      </div>
      <span className="text-slate-700 font-medium">{label}</span>
    </div>
  );

  if (loading) {
    return <PageLoader fullScreen />
  }

  return (
    <div className="container-custom py-8">
      <section className="mb-10 rounded-[28px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-500">ABONNEMENTS</p>
        <h1 className="mt-3 text-3xl md:text-4xl font-black text-[#082151]">Nos forfaits prestataires</h1>
        <p className="mt-2 text-slate-500 max-w-3xl text-lg">Accédez aux meilleures missions et profils selon vos besoins. Choisissez le plan qui vous correspond le mieux pour développer votre activité.</p>
      </section>

      {/* Forfait actuel */}
      {forfaitActuel && forfaitActuel.nom && (
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Forfait actuel</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{forfaitActuel.nom}</h3>
              <div className="mt-3 space-y-2">
                {(parseFloat(forfaitActuel.prix_mensuel) === 0) ? (
                  <div className="flex items-center text-sm text-green-700 font-medium mb-3">
                    <span className="mr-2">✨</span>
                    <span>Forfait gratuit — accès de base inclus</span>
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-indigo-700 font-medium mb-3">
                    <span className="mr-2">🔄</span>
                    <span>Facturation {getFacturationLabel(forfaitActuel.duree, forfaitActuel.duree_abonnement_mois)}</span>
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">📅</span>
                  <span>Souscrit le : <span className="font-medium text-slate-900">{forfaitActuel.forfait_date_souscription ? new Date(forfaitActuel.forfait_date_souscription).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Dès l\'inscription'}</span></span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="mr-2">⏰</span>
                  <span className="text-gray-600">Expiration : </span>
                  <span className="ml-1 font-bold text-primary-700">{forfaitActuel.forfait_date_expiration ? new Date(forfaitActuel.forfait_date_expiration).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Non spécifiée / Illimitée'}</span>
                </div>

                {/* Limites du forfait actuel */}
                <div className="mt-4 pt-3 border-t border-blue-200 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600">
                  <span>📝 Documents&nbsp;: <strong>{forfaitActuel.max_documents ?? 'Illimité'}</strong></span>
                  {forfaitActuel.max_postulations != null && <span>✍️ Candidatures/mois&nbsp;: <strong>{forfaitActuel.max_postulations ?? 'Illimité'}</strong></span>}
                  {forfaitActuel.max_devis != null && <span>📬 Devis/mois&nbsp;: <strong>{forfaitActuel.max_devis ?? 'Illimité'}</strong></span>}
                  {forfaitActuel.max_vues_missions != null && <span>👁️ Vues missions/mois&nbsp;: <strong>{forfaitActuel.max_vues_missions ?? 'Illimité'}</strong></span>}
                  {forfaitActuel.max_vues_devis != null && <span>👀 Vues devis/mois&nbsp;: <strong>{forfaitActuel.max_vues_devis ?? 'Illimité'}</strong></span>}
                  {forfaitActuel.limite_candidature_ia != null && <span>🎯 Candidatures IA&nbsp;: <strong>{forfaitActuel.limite_candidature_ia === 0 ? 'N/A' : forfaitActuel.limite_candidature_ia ?? 'Illimité'}</strong></span>}
                  {forfaitActuel.limite_devis_ia != null && <span>🤖 Devis IA/mois&nbsp;: <strong>{forfaitActuel.limite_devis_ia === 0 ? 'N/A' : forfaitActuel.limite_devis_ia ?? 'Illimité'}</strong></span>}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-full p-3 shrink-0">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>
      )}

      {/* Liste des forfaits */}
      {/* TVA Information Card */}
      <div className="max-w-4xl mx-auto mb-10 bg-blue-50 border border-blue-200 rounded-2xl p-6 flex items-start space-x-4 shadow-sm">
        <Info className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-blue-900 font-bold mb-1">Information TVA</h3>
          <p className="text-blue-800 text-sm leading-relaxed">
            La TVA de 21% sera automatiquement ajoutée lors du paiement selon votre localisation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {forfaits.map((forfait) => {
          const estActuel = forfaitActuel && (forfaitActuel.forfait_id == forfait.id || forfaitActuel.id == forfait.id || forfaitActuel.nom === forfait.nom)
          const estRecommande = forfait.recommande == 1 || forfait.recommande === true

          return (
            <div 
              key={forfait.id} 
              className={`relative bg-white rounded-[32px] p-8 flex flex-col transition-all duration-300 ${
                estRecommande 
                  ? 'border-2 border-primary-500 shadow-xl shadow-primary-500/10 scale-105 z-10' 
                  : 'border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1'
              } ${estActuel ? 'ring-4 ring-green-500/20 border-green-500' : ''}`}
            >
              {/* Badge recommandé */}
              {estRecommande && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-primary-600 to-primary-500 text-white px-5 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-lg shadow-primary-500/30">
                    <Star className="h-4 w-4 fill-current" />
                    Recommandé
                  </div>
                </div>
              )}

              {/* Badge actuel */}
              {estActuel && (
                <div className="absolute top-6 right-6">
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    Actuel
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-8 pt-4">
                <div 
                  className="mx-auto h-20 w-20 rounded-[24px] flex items-center justify-center mb-6 shadow-inner"
                  style={{ backgroundColor: forfait.couleur_badge ? forfait.couleur_badge + '15' : '#EFF6FF' }}
                >
                  <Package className="h-10 w-10" style={{ color: forfait.couleur_badge || '#3B82F6' }} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{forfait.nom}</h3>
                <p className="text-slate-500 text-sm font-medium px-4">{forfait.description}</p>
              </div>

              {/* Prix */}
              <div className="text-center mb-8 pb-8 border-b border-slate-100">
                {forfait.prix_mensuel === 0 || forfait.prix_mensuel === '0.00' ? (
                  <div className="text-5xl font-black text-slate-900 tracking-tight">Gratuit</div>
                ) : (
                  <>
                    <div className="flex items-end justify-center gap-1">
                      <span className="text-5xl font-black text-slate-900 tracking-tight">{parseFloat(forfait.prix_mensuel).toFixed(2)}€</span>
                      <span className="text-slate-500 font-medium mb-2">{getPeriodeLabel(forfait.duree, forfait.duree_abonnement_mois)}</span>
                    </div>
                    {forfait.prix_annuel > 0 && (
                      <div className="text-sm font-bold text-green-600 bg-green-50 inline-block px-3 py-1 rounded-full mt-3">
                        ou {forfait.prix_annuel}€/an (-{Math.round((parseFloat(forfait.prix_mensuel) * (forfait.duree === 'annuel' ? 12 : forfait.duree === 'semestriel' ? 6 : forfait.duree === 'trimestriel' ? 3 : 1) - parseFloat(forfait.prix_annuel)) / (parseFloat(forfait.prix_mensuel) * (forfait.duree === 'annuel' ? 12 : forfait.duree === 'semestriel' ? 6 : forfait.duree === 'trimestriel' ? 3 : 1)) * 100)}%)
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Fonctionnalités */}
              <div className="space-y-3 mb-10 flex-1">
                {/* Cycle de facturation */}
                <ForfaitFeatureRow label={`Facturation ${getFacturationLabel(forfait.duree, forfait.duree_abonnement_mois)}`} />

                {/* Devis */}
                {forfait.max_devis != null ? (
                  <ForfaitFeatureRow label={`${forfait.max_devis} devis/mois`} />
                ) : (
                  <ForfaitFeatureRow label="Devis illimités" />
                )}

                {/* Candidatures */}
                {forfait.max_postulations != null && (
                  <ForfaitFeatureRow label={`${forfait.max_postulations} candidature(s)/mois`} />
                )}
                {forfait.max_postulations == null && (
                  <ForfaitFeatureRow label="Candidatures illimitées" />
                )}

                {/* Documents */}
                <ForfaitFeatureRow label={`${forfait.max_documents != null ? forfait.max_documents + ' document(s)' : 'Documents illimités'}`} />

                {/* Devis via IA */}
                {forfait.limite_devis_ia != null ? (
                  <ForfaitFeatureRow label={forfait.limite_devis_ia === 0 ? 'Devis via IA : Non inclus' : `${forfait.limite_devis_ia} devis IA/mois`} check={forfait.limite_devis_ia > 0} />
                ) : (
                  <ForfaitFeatureRow label="Devis via IA illimités" />
                )}

                {/* Candidatures IA */}
                {forfait.limite_candidature_ia != null ? (
                  <ForfaitFeatureRow label={forfait.limite_candidature_ia === 0 ? 'Candidatures IA : Non inclus' : `${forfait.limite_candidature_ia} candidature(s) IA/mois`} check={forfait.limite_candidature_ia > 0} />
                ) : (
                  <ForfaitFeatureRow label="Candidatures IA illimitées" />
                )}

                {/* Vues missions */}
                {forfait.max_vues_missions != null ? (
                  <ForfaitFeatureRow label={`${forfait.max_vues_missions} vue(s) missions/mois`} />
                ) : (
                  <ForfaitFeatureRow label="Vues missions illimitées" />
                )}

                {/* Vues devis */}
                {forfait.max_vues_devis != null ? (
                  <ForfaitFeatureRow label={`${forfait.max_vues_devis} vue(s) devis/mois`} />
                ) : (
                  <ForfaitFeatureRow label="Vues devis illimitées" />
                )}

                {/* Badge premium */}
                {forfait.badge_premium ? <ForfaitFeatureRow label="Badge premium sur le profil" /> : null}

                {/* Mise en avant */}
                {forfait.mise_en_avant ? <ForfaitFeatureRow label="Profil mis en avant" /> : null}

                {/* Stats */}
                {forfait.statistiques_avancees ? <ForfaitFeatureRow label="Statistiques avancées" /> : null}

                {/* API */}
                {forfait.api_access ? <ForfaitFeatureRow label="Accès API complet" /> : null}

                {/* Support */}
                <ForfaitFeatureRow label={`Support ${
                  forfait.priorite_support === 'premium' ? 'premium (12h)' :
                  forfait.priorite_support === 'prioritaire' ? 'prioritaire (24h)' :
                  'standard (48h)'}`} />
              </div>

              {/* Bouton */}
              <button
                disabled={estActuel || processing}
                onClick={() => handleSelectForfait(forfait)}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center transition-all ${
                  processing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' :
                  estActuel ? 'bg-green-50 text-green-700 cursor-default' :
                  estRecommande 
                    ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg' 
                    : 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm hover:shadow-md'
                }`}
              >
                {processing ? 'Traitement...' :
                 estActuel ? 'Forfait actuel' :
                 forfait.prix_mensuel === 0 || forfait.prix_mensuel === '0.00' ? 'Passer au gratuit' :
                 <><CreditCard className="h-5 w-5 mr-2" /> Choisir ce forfait</>}
              </button>
            </div>
          )
        })}
      </div>

      {/* Note sécurité */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-600">
          🔒 Paiement sécurisé par <strong>Stripe</strong>. Vos données bancaires sont protégées.
        </p>
      </div>
    </div>
  )
}

export default FreelancerForfaits

import { useState, useEffect } from 'react'
import PageLoader from '../components/PageLoader'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X, Eye, User, Mail, Phone, Calendar, FileText, CheckCircle, Sparkles } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { demandeService } from '../services/demandeService'
import { missionService } from '../services/missionService'
import { evaluationService } from '../services/evaluationService'
import { useAuth } from '../context/AuthContext'
import EvaluationModal from '../components/EvaluationModal'
import toast from 'react-hot-toast'

const MissionDemandes = () => {
  const { missionSlug, entreprisenom } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [mission, setMission] = useState(null)
  const [demandes, setDemandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDemande, setSelectedDemande] = useState(null)
  const [modalType, setModalType] = useState(null) // 'accept' ou 'reject'
  const [rejectReason, setRejectReason] = useState('')
  const [evaluationModal, setEvaluationModal] = useState({ open: false, demande: null })

  useEffect(() => {
    // Extraire l'ID de la mission depuis le slug
    const missionId = missionSlug.split('-').pop()
    fetchMissionAndDemandes(missionId)
  }, [missionSlug])

  const fetchMissionAndDemandes = async (missionId) => {
    try {
      // Récupérer les missions de l'employeur pour trouver celle-ci
      const missionsResponse = await missionService.getEmployerMissions()
      const allMissions = (missionsResponse.data?.data || missionsResponse.data) || []
      const currentMission = allMissions.find(m => m.id === parseInt(missionId))
      
      console.log('Mission trouvée:', currentMission)
      
      if (currentMission) {
        setMission(currentMission)
      }
      
      // Récupérer toutes les demandes de l'employer
      const response = await demandeService.getEmployerDemandes()
      const allDemandes = (response.data?.data || response.data) || []
      
      console.log('Toutes les demandes:', allDemandes)
      console.log('Mission ID recherché:', missionId, 'Type:', currentMission?.mission_type)
      
      // Filtrer pour cette mission spécifique (par ID ET type)
      const missionDemandes = allDemandes.filter(d => {
        const matchId = d.mission_id === parseInt(missionId)
        const matchType = d.mission_type === currentMission?.mission_type
        console.log(`Demande ${d.id}: mission_id=${d.mission_id} (${matchId}), mission_type=${d.mission_type} (${matchType})`)
        return matchId && matchType
      })
      
      console.log('Demandes filtrées pour cette mission:', missionDemandes)
      setDemandes(missionDemandes)
    } catch (error) {
      console.error('Erreur chargement:', error)
      toast.error('Erreur lors du chargement des demandes')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    try {
      console.log('Acceptation demande:', selectedDemande.id)
      await demandeService.accepterDemande(selectedDemande.id)
      toast.success('Demande acceptée ! Mission passée en cours.')
      setModalType(null)
      setSelectedDemande(null)
      // Recharger les données après un court délai pour laisser le temps à la BD de se mettre à jour
      setTimeout(() => {
        fetchMissionAndDemandes(mission.id)
      }, 500)
    } catch (error) {
      console.error('Erreur acceptation:', error)
      toast.error('Erreur lors de l\'acceptation')
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      return toast.error('Veuillez indiquer une raison')
    }

    try {
      console.log('Refus demande:', selectedDemande.id)
      await demandeService.refuserDemande(selectedDemande.id, rejectReason)
      toast.success('Demande refusée')
      setModalType(null)
      setSelectedDemande(null)
      setRejectReason('')
      // Recharger les données après un court délai
      setTimeout(() => {
        fetchMissionAndDemandes(mission.id)
      }, 500)
    } catch (error) {
      console.error('Erreur refus:', error)
      toast.error('Erreur lors du refus')
    }
  }

  const openAcceptModal = (demande) => {
    setSelectedDemande(demande)
    setModalType('accept')
  }

  const openRejectModal = (demande) => {
    setSelectedDemande(demande)
    setModalType('reject')
  }

  const closeModal = () => {
    setModalType(null)
    setSelectedDemande(null)
    setRejectReason('')
  }

  const handleOpenEvaluationModal = (demande) => {
    setEvaluationModal({ open: true, demande })
  }

  const handleSubmitEvaluation = async (data) => {
    try {
      await evaluationService.terminerMissionFreelancer({
        demande_id: evaluationModal.demande.id,
        avec_evaluation: data.avec_evaluation,
        evaluation: data.evaluation
      })
      
      const message = data.avec_evaluation 
        ? 'Mission terminée et évaluation envoyée !'
        : 'Mission terminée pour ce freelancer'
      
      toast.success(message)
      setEvaluationModal({ open: false, demande: null })
      
      // Recharger les demandes
      const missionId = missionSlug.split('-').pop()
      fetchMissionAndDemandes(missionId)
    } catch (error) {
      toast.error('Érreur lors de l\'opération')
      console.error(error)
    }
  }

  const handleTerminerMission = async () => {
    if (!window.confirm('Voulez-vous vraiment terminer cette mission complète ? Cela changera son statut à "terminé".'))
      return

    try {
      await demandeService.terminerMission({
        mission_id: mission.id,
        mission_type: mission.type
      })
      toast.success('Mission terminée avec succès !')
      // Recharger
      const missionId = missionSlug.split('-').pop()
      fetchMissionAndDemandes(missionId)
    } catch (error) {
      console.error('Erreur terminer mission:', error)
      toast.error('Erreur lors de la clôture de la mission')
    }
  }

  const getStatusBadge = (statut) => {
    const badges = {
      en_attente: { text: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      accepte: { text: 'Acceptée', className: 'bg-green-100 text-green-800' },
      refuse: { text: 'Refusée', className: 'bg-red-100 text-red-800' },
      terminee: { text: 'Terminée', className: 'bg-blue-100 text-blue-800' },
      annulee: { text: 'Annulée', className: 'bg-gray-100 text-gray-800' }
    }
    return badges[statut] || badges.en_attente
  }

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'À l\'instant'
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`
    return `Il y a ${Math.floor(seconds / 86400)}j`
  }

  if (loading) {
    return <PageLoader fullScreen />
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={() => navigate(`/employer/${entreprisenom}/myjob`)} 
          className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux missions
        </button>

        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-4 mb-3">
          <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <FileText className="h-6 w-6 text-indigo-600" />
          </div>
          Demandes : <span className="text-indigo-600">{mission?.titre || 'Mission'}</span>
        </h1>
        <p className="text-lg text-slate-500 sm:ml-16">
          {demandes.length} candidature{demandes.length > 1 ? 's' : ''} reçue{demandes.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Détails de la mission */}
      {mission && (
        <Card className="mb-8 border-2 border-indigo-50 shadow-sm bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-2">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Type de forfait</p>
              <p className="font-medium text-slate-900">
                {mission.mission_type === 'hourly' ? '⏱️ Forfait Horaire' : '💰 Forfait Fixe'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Rémunération proposée</p>
              <p className="font-bold text-indigo-700">
                {mission.mission_type === 'hourly' 
                  ? `${mission.forfait_heure}€/h × ${mission.heures_travail_max}h max`
                  : `${mission.forfait_mission}€ (budget total)`}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Statut actuel</p>
              <p className="font-medium">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  mission.statut === 'ouvert' ? 'bg-green-100 text-green-700' :
                  mission.statut === 'en_cours' ? 'bg-blue-100 text-blue-700' :
                  mission.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-700' :
                  mission.statut === 'termine' ? 'bg-gray-100 text-gray-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {mission.statut === 'ouvert' ? '✓ Ouvert' :
                   mission.statut === 'en_cours' ? '⏳ En cours' :
                   mission.statut === 'en_attente' ? '⏳ En attente' :
                   mission.statut === 'termine' ? '✅ Terminé' :
                   '🔒 Fermé'}
                </span>
              </p>
            </div>
            {mission.competences && (
              <div className="md:col-span-3 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Compétences recherchées</p>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(mission.competences) ? mission.competences : (
                    typeof mission.competences === 'string' && mission.competences.startsWith('[') ? JSON.parse(mission.competences) : []
                  )).map((comp, idx) => (
                    <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                      {comp}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Card terminer la mission */}
      {mission?.statut === 'en_cours' && (
        <Card className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-blue-900 mb-1">
                <CheckCircle className="inline h-5 w-5 mr-2" />
                Mission en cours
              </h3>
              <p className="text-sm text-blue-700">
                Cliquez sur le bouton pour marquer cette mission comme terminée
              </p>
            </div>
            <Button
              onClick={handleTerminerMission}
              className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Terminer la mission
            </Button>
          </div>
        </Card>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div>
            <p className="text-sm text-yellow-600 font-medium">En attente</p>
            <p className="text-3xl font-bold text-yellow-700">
              {demandes.filter(d => d.statut === 'en_attente').length}
            </p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <div>
            <p className="text-sm text-green-600 font-medium">Acceptées</p>
            <p className="text-3xl font-bold text-green-700">
              {demandes.filter(d => d.statut === 'accepte').length}
            </p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <div>
            <p className="text-sm text-red-600 font-medium">Refusées</p>
            <p className="text-3xl font-bold text-red-700">
              {demandes.filter(d => d.statut === 'refuse').length}
            </p>
          </div>
        </Card>
      </div>

      {/* Liste des demandes */}
      {demandes.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Aucune demande reçue pour cette mission</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {demandes.map((demande) => (
            <Card key={demande.id} className="hover:shadow-lg transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Avatar */}
                  <div className="h-16 w-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {demande.freelancer_prenom?.charAt(0)}{demande.freelancer_nom?.charAt(0)}
                  </div>

                  {/* Infos freelancer */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {demande.freelancer_prenom} {demande.freelancer_nom}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(demande.statut).className}`}>
                        {getStatusBadge(demande.statut).text}
                      </span>
                    </div>

                    {/* Contact */}
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {demande.freelancer_email}
                      </div>
                      {demande.freelancer_telephone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          {demande.freelancer_telephone}
                        </div>
                      )}
                    </div>

                    {/* Message de motivation */}
                    {demande.message_freelancer && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-700">Message de motivation :</p>
                          {demande.est_genere_par_ia ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-800">
                              <Sparkles className="h-3 w-3 mr-1" />
                              IA
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-800">
                              <User className="h-3 w-3 mr-1" />
                              Manuel
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{demande.message_freelancer}</p>
                      </div>
                    )}

                    {/* Date */}
                    <div className="flex items-center text-xs text-gray-400">
                      <Calendar className="h-3 w-3 mr-1" />
                      Posté {getTimeAgo(demande.date_demande)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 mt-4 sm:mt-0 sm:ml-4 w-full sm:w-auto">
                  <Button
                    onClick={() => {
                      const freelancerName = `${demande.freelancer_prenom}-${demande.freelancer_nom}`.toLowerCase().replace(/\s+/g, '-')
                      navigate(`/employer/list-freelancer/${freelancerName}`)
                    }}
                    variant="outline"
                    size="sm"
                    className="whitespace-nowrap flex-1 sm:flex-initial"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir profil
                  </Button>

                  {demande.statut === 'accepte' && (
                    <Button
                      onClick={() => handleOpenEvaluationModal(demande)}
                      variant="secondary"
                      size="sm"
                      className="whitespace-nowrap flex-1 sm:flex-initial"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Marquer terminé
                    </Button>
                  )}

                  {demande.statut === 'en_attente' && (
                    <>
                      <Button
                        onClick={() => openAcceptModal(demande)}
                        variant="success"
                        size="sm"
                        className="whitespace-nowrap flex-1 sm:flex-initial"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Accepter
                      </Button>
                      <Button
                        onClick={() => openRejectModal(demande)}
                        variant="danger"
                        size="sm"
                        className="whitespace-nowrap flex-1 sm:flex-initial"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Refuser
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Acceptation */}
      <Modal
        isOpen={modalType === 'accept'}
        onClose={closeModal}
        title="Accepter la demande"
      >
        <div className="space-y-4">
          <div className="bg-green-50 border-l-4 border-green-500 p-4">
            <p className="text-green-900">
              Vous êtes sur le point d'accepter la demande de{' '}
              <strong>{selectedDemande?.freelancer_prenom} {selectedDemande?.freelancer_nom}</strong>
            </p>
          </div>
          <p className="text-gray-700">
            Un email de confirmation sera envoyé à l'indépendant.
          </p>
          <div className="flex space-x-3 pt-4">
            <Button onClick={handleAccept} variant="success" className="flex-1">
              <Check className="h-4 w-4 mr-2" />
              Confirmer l'acceptation
            </Button>
            <Button onClick={closeModal} variant="outline" className="flex-1">
              Annuler
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Refus */}
      <Modal
        isOpen={modalType === 'reject'}
        onClose={closeModal}
        title="Refuser la demande"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-900">
              Vous êtes sur le point de refuser la demande de{' '}
              <strong>{selectedDemande?.freelancer_prenom} {selectedDemande?.freelancer_nom}</strong>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raison du refus *
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Expliquez brièvement pourquoi vous refusez cette candidature..."
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <Button onClick={handleReject} variant="danger" className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Confirmer le refus
            </Button>
            <Button onClick={closeModal} variant="outline" className="flex-1">
              Annuler
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Évaluation */}
      <EvaluationModal
        isOpen={evaluationModal.open}
        onClose={() => setEvaluationModal({ open: false, demande: null })}
        freelancer={evaluationModal.demande ? {
          prenom: evaluationModal.demande.freelancer_prenom,
          nom: evaluationModal.demande.freelancer_nom
        } : null}
        onSubmit={handleSubmitEvaluation}
      />
    </div>
  )
}

export default MissionDemandes

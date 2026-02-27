import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X, Eye, User, Mail, Phone, Calendar, FileText, CheckCircle } from 'lucide-react'
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
  const { missionSlug, recruteurnom } = useParams()
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
      const allMissions = missionsResponse.data.data || []
      const currentMission = allMissions.find(m => m.id === parseInt(missionId))

      console.log('Mission trouvée:', currentMission)

      if (currentMission) {
        setMission({
          id: currentMission.id,
          titre: currentMission.titre,
          type: currentMission.mission_type,
          statut: currentMission.statut
        })
      }

      // Récupérer toutes les demandes de l'employer
      const response = await demandeService.getEmployerDemandes()
      const allDemandes = response.data.data || []

      console.log('Toutes les demandes:', allDemandes)
      console.log('Mission ID recherché:', missionId, 'Type:', currentMission?.mission_type)

      // Filtrer pour cette mission spécifique (par ID, type et source)
      const missionDemandes = allDemandes.filter(d => {
        const matchId = d.mission_id === parseInt(missionId)
        const matchType = d.mission_type === currentMission?.mission_type
        const matchSource = !!d.is_freelancer_job === !!currentMission?.is_freelancer_job

        console.log(`Demande ${d.id}: mission_id=${d.mission_id} (${matchId}), mission_type=${d.mission_type} (${matchType}), is_freelancer=${d.is_freelancer_job} (${matchSource})`)
        return matchId && matchType && matchSource
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="py-8">
      {/* Header */}
      <Button
        onClick={() => {
          if (user?.role === 'freelancer') {
            navigate('/freelancer/my-published-jobs')
          } else {
            navigate(`/employer/${recruteurnom}/myjob`)
          }
        }}
        variant="outline"
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour aux missions
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Demandes pour : {mission?.titre || 'Mission'}
        </h1>
        <p className="text-gray-600">
          {demandes.length} demande{demandes.length > 1 ? 's' : ''} reçue{demandes.length > 1 ? 's' : ''}
        </p>
      </div>

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
                        <p className="text-sm font-medium text-gray-700 mb-1">Message de motivation :</p>
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
            Un email de confirmation sera envoyé à le prestataire.
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

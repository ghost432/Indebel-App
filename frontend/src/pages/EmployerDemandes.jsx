import { useState, useEffect } from 'react'
import PageLoader from '../components/PageLoader'
import { Check, X, Clock, Mail, Phone, Briefcase, Calendar, User, Sparkles } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import { demandeService } from '../services/demandeService'
import toast from 'react-hot-toast'

const EmployerDemandes = () => {
  const [demandes, setDemandes] = useState([])
  const [filteredDemandes, setFilteredDemandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDemande, setSelectedDemande] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [actionModal, setActionModal] = useState({ open: false, type: null, demandeId: null })

  useEffect(() => {
    document.title = 'Demandes Reçues - Indebel'
    fetchDemandes()
  }, [])

  useEffect(() => {
    filterDemandes()
  }, [statusFilter, demandes])

  const fetchDemandes = async () => {
    try {
      const response = await demandeService.getEmployerDemandes()
      setDemandes((response.data?.data || response.data))
      setFilteredDemandes((response.data?.data || response.data))
    } catch (error) {
      toast.error('Erreur lors du chargement des demandes')
    } finally {
      setLoading(false)
    }
  }

  const filterDemandes = () => {
    let filtered = demandes
    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.statut === statusFilter)
    }
    setFilteredDemandes(filtered)
  }

  const handleViewDetails = (demande) => {
    setSelectedDemande(demande)
    setModalOpen(true)
  }

  const handleAccepter = async (demandeId) => {
    try {
      await demandeService.accepterDemande(demandeId)
      toast.success('Candidature acceptée ! Le freelancer a été notifié.')
      setActionModal({ open: false, type: null, demandeId: null })
      fetchDemandes()
    } catch (error) {
      toast.error('Erreur lors de l\'acceptation')
    }
  }

  const handleRefuser = async (demandeId) => {
    try {
      await demandeService.refuserDemande(demandeId)
      toast.success('Candidature refusée. Le freelancer a été notifié.')
      setActionModal({ open: false, type: null, demandeId: null })
      fetchDemandes()
    } catch (error) {
      toast.error('Erreur lors du refus')
    }
  }

  const getStatusBadge = (statut) => {
    const variants = {
      en_attente: 'warning',
      accepte: 'success',
      refuse: 'danger'
    }
    const labels = {
      en_attente: 'En attente',
      accepte: 'Accepté',
      refuse: 'Refusé'
    }
    return <Badge variant={variants[statut]}>{labels[statut]}</Badge>
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) return 'Date invalide'
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return <PageLoader fullScreen />
  }

  return (
    <div className="py-8">
      <div className="bg-[#082151] rounded-[24px] shadow-md p-6 md:p-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden text-white border-0">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Demandes Reçues</h1>
          <p className="text-slate-200 mt-1 text-sm md:text-base">Gérez les demandes de candidatures des freelancers</p>
        </div>
        <div className="relative z-10 flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-xl text-white">
          <span className="text-lg font-bold">{filteredDemandes.length}</span>
          <span className="text-sm font-medium">demande(s)</span>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#2b4eef]/20 to-[#df6422]/20 rounded-full blur-3xl -mr-16 -mt-16 z-0 pointer-events-none"></div>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <div className="flex items-center space-x-4">
          <label className="font-medium text-gray-700">Filtrer par statut :</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Tous</option>
            <option value="en_attente">En attente</option>
            <option value="accepte">Acceptées</option>
            <option value="refuse">Refusées</option>
          </select>
        </div>
      </Card>

      {/* Liste des demandes */}
      <div className="grid grid-cols-1 gap-4">
        {filteredDemandes.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune demande trouvée</p>
            </div>
          </Card>
        ) : (
          filteredDemandes.map((demande) => (
            <Card key={demande.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {demande.mission_titre}
                      </h3>
                      <div className="flex items-center text-gray-600 text-sm">
                        <User className="h-4 w-4 mr-2" />
                        <span className="font-medium">
                          {demande.freelancer_prenom} {demande.freelancer_nom}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(demande.statut)}
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
                  </div>

                  {demande.message_freelancer && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-3">
                      <p className="text-sm text-blue-900 italic">"{demande.message_freelancer}"</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="break-all">{demande.freelancer_email}</span>
                    </div>
                    {demande.freelancer_telephone && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{demande.freelancer_telephone}</span>
                      </div>
                    )}
                    {demande.freelancer_secteur && (
                      <div className="flex items-center text-gray-600">
                        <Briefcase className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{demande.freelancer_secteur}</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>Posté le {formatDate(demande.date_demande)}</span>
                    </div>
                    {demande.date_reponse && (
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>Répondu le {formatDate(demande.date_reponse)}</span>
                      </div>
                    )}
                  </div>

                  {demande.statut === 'en_attente' && (
                    <div className="flex items-center space-x-3 mt-4 pt-4 border-t">
                      <Button
                        onClick={() => setActionModal({ open: true, type: 'accepter', demandeId: demande.id })}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Accepter
                      </Button>
                      <Button
                        onClick={() => setActionModal({ open: true, type: 'refuser', demandeId: demande.id })}
                        variant="danger"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Refuser
                      </Button>
                      <Button
                        onClick={() => handleViewDetails(demande)}
                        variant="outline"
                      >
                        Voir le profil
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal de confirmation d'action */}
      <Modal
        isOpen={actionModal.open}
        onClose={() => setActionModal({ open: false, type: null, demandeId: null })}
        title={actionModal.type === 'accepter' ? 'Accepter la candidature' : 'Refuser la candidature'}
      >
        <div className="space-y-4">
          {actionModal.type === 'accepter' ? (
            <>
              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <p className="text-green-900">
                  En acceptant cette candidature, la mission passera en statut <strong>"en cours"</strong> et le freelancer sera notifié par email.
                </p>
              </div>
              <p className="text-gray-700">Êtes-vous sûr de vouloir accepter cette candidature ?</p>
            </>
          ) : (
            <>
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <p className="text-red-900">
                  Le freelancer sera notifié par email du refus de sa candidature.
                </p>
              </div>
              <p className="text-gray-700">Êtes-vous sûr de vouloir refuser cette candidature ?</p>
            </>
          )}

          <div className="flex items-center space-x-3 pt-4">
            <Button
              onClick={() => actionModal.type === 'accepter' 
                ? handleAccepter(actionModal.demandeId)
                : handleRefuser(actionModal.demandeId)
              }
              className={actionModal.type === 'accepter' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={actionModal.type === 'refuser' ? 'danger' : 'primary'}
            >
              Confirmer
            </Button>
            <Button
              onClick={() => setActionModal({ open: false, type: null, demandeId: null })}
              variant="outline"
            >
              Annuler
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal détails freelancer */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Profil du candidat"
        size="lg"
      >
        {selectedDemande && (
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedDemande.freelancer_prenom} {selectedDemande.freelancer_nom}
              </h3>
              {selectedDemande.freelancer_secteur && (
                <p className="text-gray-600">{selectedDemande.freelancer_secteur}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-gray-700">
                <Mail className="h-5 w-5 mr-3 text-primary-600" />
                <a href={`mailto:${selectedDemande.freelancer_email}`} className="hover:text-primary-600">
                  {selectedDemande.freelancer_email}
                </a>
              </div>
              {selectedDemande.freelancer_telephone && (
                <div className="flex items-center text-gray-700">
                  <Phone className="h-5 w-5 mr-3 text-primary-600" />
                  <a href={`tel:${selectedDemande.freelancer_telephone}`} className="hover:text-primary-600">
                    {selectedDemande.freelancer_telephone}
                  </a>
                </div>
              )}
              <div className="flex items-center text-gray-700">
                <Calendar className="h-5 w-5 mr-3 text-primary-600" />
                <span>Postulé le {formatDate(selectedDemande.date_demande)}</span>
              </div>
            </div>

            {selectedDemande.message_freelancer && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Message de motivation</h4>
                  {selectedDemande.est_genere_par_ia ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Généré par IA
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <User className="h-3 w-3 mr-1" />
                      Rédigé manuellement
                    </span>
                  )}
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{selectedDemande.message_freelancer}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default EmployerDemandes

import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, Calendar, Briefcase, Building2 } from 'lucide-react'
import Card from '../components/Card'
import Badge from '../components/Badge'
import { demandeService } from '../services/demandeService'
import toast from 'react-hot-toast'

const FreelancerMesDemandes = () => {
  const [demandes, setDemandes] = useState([])
  const [filteredDemandes, setFilteredDemandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    document.title = 'Mes Candidatures - Indebel'
    fetchDemandes()
  }, [])

  useEffect(() => {
    filterDemandes()
  }, [statusFilter, demandes])

  const fetchDemandes = async () => {
    try {
      const response = await demandeService.getFreelancerDemandes()
      setDemandes(response.data.data)
      setFilteredDemandes(response.data.data)
    } catch (error) {
      toast.error('Erreur lors du chargement des candidatures')
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

  const getStatusBadge = (statut) => {
    const config = {
      en_attente: { 
        variant: 'warning', 
        label: 'En attente', 
        icon: Clock,
        color: 'text-yellow-600'
      },
      accepte: { 
        variant: 'success', 
        label: 'Accepté', 
        icon: CheckCircle,
        color: 'text-green-600'
      },
      refuse: { 
        variant: 'danger', 
        label: 'Refusé', 
        icon: XCircle,
        color: 'text-red-600'
      }
    }
    const { variant, label, icon: Icon, color } = config[statut] || config.en_attente
    return (
      <div className="flex items-center space-x-2">
        <Icon className={`h-5 w-5 ${color}`} />
        <Badge variant={variant}>{label}</Badge>
      </div>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatsForStatus = (status) => {
    return demandes.filter(d => d.statut === status).length
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Candidatures</h1>
        <p className="text-gray-600">Suivez l'état de vos candidatures aux missions</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total</p>
              <p className="text-3xl font-bold text-blue-700">{demandes.length}</p>
            </div>
            <Briefcase className="h-12 w-12 text-blue-600 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">En attente</p>
              <p className="text-3xl font-bold text-yellow-700">{getStatsForStatus('en_attente')}</p>
            </div>
            <Clock className="h-12 w-12 text-yellow-600 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Acceptées</p>
              <p className="text-3xl font-bold text-green-700">{getStatsForStatus('accepte')}</p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-600 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Refusées</p>
              <p className="text-3xl font-bold text-red-700">{getStatsForStatus('refuse')}</p>
            </div>
            <XCircle className="h-12 w-12 text-red-600 opacity-50" />
          </div>
        </Card>
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
              <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Aucune candidature trouvée</p>
              <p className="text-gray-500 text-sm mt-2">
                {statusFilter !== 'all' 
                  ? 'Essayez de modifier le filtre'
                  : 'Commencez par postuler à des missions'}
              </p>
            </div>
          </Card>
        ) : (
          filteredDemandes.map((demande) => (
            <Card key={demande.id} className="hover:shadow-lg transition-shadow">
              <div className="flex flex-col space-y-4">
                {/* En-tête */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {demande.mission_titre}
                    </h3>
                    <div className="flex items-center text-gray-600 text-sm mb-2">
                      <Building2 className="h-4 w-4 mr-2" />
                      <span>
                        {demande.denomination || 'Recruteur'}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(demande.statut)}
                </div>

                {/* Message de motivation */}
                {demande.message_freelancer && (
                  <div className="bg-gray-50 border-l-4 border-primary-500 p-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Votre message :</p>
                    <p className="text-sm text-gray-600 italic">"{demande.message_freelancer}"</p>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                    <span>Candidature envoyée le {formatDate(demande.date_demande)}</span>
                  </div>
                  {demande.date_reponse && (
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                      <span>Réponse reçue le {formatDate(demande.date_reponse)}</span>
                    </div>
                  )}
                </div>

                {/* Statut de la mission */}
                {demande.mission_statut && (
                  <div className="flex items-center space-x-2 pt-3 border-t">
                    <span className="text-sm text-gray-600">Statut de la mission :</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      demande.mission_statut === 'ouvert' ? 'bg-green-100 text-green-700' :
                      demande.mission_statut === 'en_cours' ? 'bg-yellow-100 text-yellow-700' :
                      demande.mission_statut === 'termine' ? 'bg-gray-100 text-gray-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {demande.mission_statut === 'ouvert' && '✓ Ouvert'}
                      {demande.mission_statut === 'en_cours' && '⏳ En cours'}
                      {demande.mission_statut === 'termine' && '✅ Terminé'}
                      {demande.mission_statut === 'ferme' && '🔒 Fermé'}
                    </span>
                  </div>
                )}

                {/* Message de feedback selon le statut */}
                {demande.statut === 'accepte' && (
                  <div className="bg-green-50 border-l-4 border-green-500 p-3">
                    <p className="text-sm text-green-900 font-medium">
                      🎉 Félicitations ! Votre candidature a été acceptée. L'employeur devrait vous contacter prochainement.
                    </p>
                  </div>
                )}
                {demande.statut === 'refuse' && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-3">
                    <p className="text-sm text-red-900">
                      Votre candidature n'a pas été retenue pour cette mission. Ne vous découragez pas, d'autres opportunités vous attendent !
                    </p>
                  </div>
                )}
                {demande.statut === 'en_attente' && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3">
                    <p className="text-sm text-yellow-900">
                      ⏳ Votre candidature est en attente de réponse. L'employeur examine votre profil.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default FreelancerMesDemandes

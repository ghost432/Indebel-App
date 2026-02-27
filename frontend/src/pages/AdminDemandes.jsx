import { useState, useEffect } from 'react'
import { Users, CheckCircle, XCircle, Clock, Eye, Filter, Search } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import { demandeService } from '../services/demandeService'
import toast from 'react-hot-toast'

const AdminDemandes = () => {
  const [demandes, setDemandes] = useState([])
  const [filteredDemandes, setFilteredDemandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [detailModal, setDetailModal] = useState({ open: false, demande: null })

  useEffect(() => {
    document.title = 'Gestion des Demandes - Admin - Indebel'
    fetchDemandes()
  }, [])

  useEffect(() => {
    filterDemandes()
  }, [searchTerm, statusFilter, demandes])

  const fetchDemandes = async () => {
    try {
      const response = await demandeService.getAllDemandes()
      const demandesData = response.data.data || []
      setDemandes(demandesData)
      setFilteredDemandes(demandesData)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des demandes')
    } finally {
      setLoading(false)
    }
  }

  const filterDemandes = () => {
    let filtered = demandes

    if (searchTerm) {
      filtered = filtered.filter(d =>
        d.mission_titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.freelancer_prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.freelancer_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.employer_denomination?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.statut === statusFilter)
    }

    setFilteredDemandes(filtered)
  }

  const handleAccepter = async (id) => {
    try {
      await demandeService.accepterDemande(id)
      toast.success('Demande acceptée')
      fetchDemandes()
    } catch (error) {
      toast.error('Erreur lors de l\'acceptation')
    }
  }

  const handleRefuser = async (id) => {
    try {
      await demandeService.refuserDemande(id)
      toast.success('Demande refusée')
      fetchDemandes()
    } catch (error) {
      toast.error('Erreur lors du refus')
    }
  }

  const getStatutBadge = (statut) => {
    switch(statut) {
      case 'en_attente':
        return <Badge variant="warning" icon={Clock}>En attente</Badge>
      case 'accepte':
        return <Badge variant="success" icon={CheckCircle}>Acceptée</Badge>
      case 'refuse':
        return <Badge variant="danger" icon={XCircle}>Refusée</Badge>
      default:
        return <Badge>{statut}</Badge>
    }
  }

  const getStatsByStatus = (status) => {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Demandes de Missions</h1>
        <p className="text-gray-600">Gérez toutes les demandes de missions de la plateforme</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total</p>
              <p className="text-3xl font-bold text-blue-700">{demandes.length}</p>
            </div>
            <Users className="h-12 w-12 text-blue-300" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">En attente</p>
              <p className="text-3xl font-bold text-yellow-700">{getStatsByStatus('en_attente')}</p>
            </div>
            <Clock className="h-12 w-12 text-yellow-300" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Acceptées</p>
              <p className="text-3xl font-bold text-green-700">{getStatsByStatus('accepte')}</p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-300" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Refusées</p>
              <p className="text-3xl font-bold text-red-700">{getStatsByStatus('refuse')}</p>
            </div>
            <XCircle className="h-12 w-12 text-red-300" />
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par mission, freelancer ou employeur..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-gray-400 mr-2" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="accepte">Acceptées</option>
                <option value="refuse">Refusées</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Liste des demandes */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Freelancer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employeur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDemandes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    Aucune demande trouvée
                  </td>
                </tr>
              ) : (
                filteredDemandes.map((demande) => (
                  <tr key={demande.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">
                          {demande.freelancer_prenom} {demande.freelancer_nom}
                        </div>
                        <div className="text-sm text-gray-500">{demande.freelancer_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {demande.employer_denomination || `${demande.employer_prenom} ${demande.employer_nom}`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {demande.mission_titre}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        demande.mission_type === 'hourly' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {demande.mission_type === 'hourly' ? 'Horaire' : 'Fixe'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(demande.date_demande).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatutBadge(demande.statut)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => setDetailModal({ open: true, demande })}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {demande.statut === 'en_attente' && (
                          <>
                            <Button
                              onClick={() => handleAccepter(demande.id)}
                              variant="success"
                              size="sm"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleRefuser(demande.id)}
                              variant="danger"
                              size="sm"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal détails */}
      <Modal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, demande: null })}
        title="Détails de la demande"
      >
        {detailModal.demande && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Mission</h3>
              <p className="text-gray-700">{detailModal.demande.mission_titre}</p>
              <p className="text-sm text-gray-500">
                Type: {detailModal.demande.mission_type === 'hourly' ? 'Forfait Horaire' : 'Forfait Fixe'}
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Freelancer</h3>
              <p className="text-gray-700">
                {detailModal.demande.freelancer_prenom} {detailModal.demande.freelancer_nom}
              </p>
              <p className="text-sm text-gray-500">{detailModal.demande.freelancer_email}</p>
              {detailModal.demande.freelancer_telephone && (
                <p className="text-sm text-gray-500">{detailModal.demande.freelancer_telephone}</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Employeur</h3>
              <p className="text-gray-700">
                {detailModal.demande.employer_denomination || 
                 `${detailModal.demande.employer_prenom} ${detailModal.demande.employer_nom}`}
              </p>
            </div>

            {detailModal.demande.message_freelancer && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Message du freelancer</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{detailModal.demande.message_freelancer}</p>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Dates</h3>
              <p className="text-sm text-gray-600">
                Demande: {new Date(detailModal.demande.date_demande).toLocaleString('fr-FR')}
              </p>
              {detailModal.demande.date_reponse && (
                <p className="text-sm text-gray-600">
                  Réponse: {new Date(detailModal.demande.date_reponse).toLocaleString('fr-FR')}
                </p>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Statut actuel</h3>
              {getStatutBadge(detailModal.demande.statut)}
            </div>

            {detailModal.demande.statut === 'en_attente' && (
              <div className="flex space-x-3 pt-4 border-t">
                <Button
                  onClick={() => {
                    handleAccepter(detailModal.demande.id)
                    setDetailModal({ open: false, demande: null })
                  }}
                  variant="success"
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accepter
                </Button>
                <Button
                  onClick={() => {
                    handleRefuser(detailModal.demande.id)
                    setDetailModal({ open: false, demande: null })
                  }}
                  variant="danger"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Refuser
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AdminDemandes

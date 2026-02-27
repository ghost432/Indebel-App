import { useState, useEffect } from 'react'
import { FileText, CheckCircle, XCircle, Clock, Award, User, Mail, Eye, Download, MessageSquare } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import axiosInstance from '../services/axiosConfig'
import VerificationBadge from '../components/VerificationBadge'
import { profileService } from '../services/profileService'

const AdminLabelExceptionalRequests = () => {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  })
  const [filter, setFilter] = useState('pending') // pending, approved, rejected, all
  const { user } = useAuth()

  useEffect(() => {
    document.title = 'Demandes Exceptionnelles - Labels Indebel'
    // Nettoyer les données corrompues du cache au chargement
    profileService.cleanupCorruptedCache()
    fetchExceptionalRequests()
  }, [filter])

  const fetchExceptionalRequests = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get(`/label/exceptional-requests?status=${filter}`)
      
      if (response.data.success) {
        setRequests(response.data.data.requests)
        setStats(response.data.data.stats)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error)
      toast.error('Erreur lors du chargement des demandes')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestAction = async (requestId, action, reason = '') => {
    try {
      const response = await axiosInstance.post(`/label/exceptional-requests/${requestId}/${action}`, {
        reason
      })
      
      if (response.data.success) {
        toast.success(`Demande ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès`)
        setShowModal(false)
        setSelectedRequest(null)
        fetchExceptionalRequests() // Refresh data
      }
    } catch (error) {
      console.error(`Erreur lors de l'${action} de la demande:`, error)
      toast.error(`Erreur lors de l'${action} de la demande`)
    }
  }

  const openRequestModal = (request) => {
    setSelectedRequest(request)
    setShowModal(true)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approuvée
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejetée
          </span>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Demandes Exceptionnelles - Labels Indebel
        </h1>
        <p className="text-gray-600">
          Gérez les demandes exceptionnelles pour l'obtention du label de qualité Indebel
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approuvées</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejetées</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex flex-wrap gap-3">
            <Button
              variant={filter === 'pending' ? 'primary' : 'outline'}
              onClick={() => setFilter('pending')}
            >
              <Clock className="h-4 w-4 mr-2" />
              En attente ({stats.pending})
            </Button>
            <Button
              variant={filter === 'approved' ? 'primary' : 'outline'}
              onClick={() => setFilter('approved')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approuvées ({stats.approved})
            </Button>
            <Button
              variant={filter === 'rejected' ? 'primary' : 'outline'}
              onClick={() => setFilter('rejected')}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rejetées ({stats.rejected})
            </Button>
            <Button
              variant={filter === 'all' ? 'primary' : 'outline'}
              onClick={() => setFilter('all')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Toutes ({stats.total})
            </Button>
          </div>
        </div>
      </Card>

      {/* Liste des demandes */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Demandes Exceptionnelles
          </h2>

          {requests.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune demande trouvée pour ce filtre</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden">
                        {profileService.getProfileImage(request.user) ? (
                          <img 
                            src={profileService.getProfileImage(request.user)} 
                            alt="Profile" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span>{profileService.getInitials(request.user, 'freelancer')}</span>
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.user.prenom} {request.user.nom}
                          </h3>
                          {getStatusBadge(request.status)}
                          <VerificationBadge status={request.user.status_verification} size="sm" showText={false} />
                        </div>
                        <p className="text-gray-600 capitalize">{request.user.role}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {request.user.email}
                          </span>
                          <span>
                            Demandé le {new Date(request.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRequestModal(request)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir détails
                      </Button>
                      
                      {request.status === 'pending' && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleRequestAction(request.id, 'approve')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approuver
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRequestAction(request.id, 'reject')}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Rejeter
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Aperçu de la demande */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Raison de la demande:</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{request.reason}</p>
                    
                    {request.files && request.files.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm text-gray-500">
                          {request.files.length} fichier(s) joint(s)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Modal pour les détails de la demande */}
      <Modal
        isOpen={showModal}
        onClose={() => {setShowModal(false); setSelectedRequest(null)}}
        title="Détails de la demande exceptionnelle"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-6">
            {/* Informations utilisateur */}
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="h-16 w-16 bg-gradient-to-br from-primary-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden">
                {profileService.getProfileImage(selectedRequest.user) ? (
                  <img 
                    src={profileService.getProfileImage(selectedRequest.user)} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-xl">{profileService.getInitials(selectedRequest.user, 'freelancer')}</span>
                )}
              </div>
              
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedRequest.user.prenom} {selectedRequest.user.nom}
                  </h3>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <p className="text-gray-600 capitalize">{selectedRequest.user.role}</p>
                <p className="text-gray-500">{selectedRequest.user.email}</p>
              </div>
            </div>

            {/* Détails de la demande */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Raison de la demande</label>
                <p className="text-gray-900 bg-white p-3 border rounded-lg">{selectedRequest.reason}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description détaillée</label>
                <p className="text-gray-900 bg-white p-3 border rounded-lg whitespace-pre-wrap">{selectedRequest.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Années d'expérience</label>
                  <p className="text-gray-900 bg-white p-3 border rounded-lg">{selectedRequest.experience_years || 'Non spécifié'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Compétences spéciales</label>
                  <p className="text-gray-900 bg-white p-3 border rounded-lg">{selectedRequest.special_skills || 'Non spécifié'}</p>
                </div>
              </div>

              {selectedRequest.portfolio_links && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Liens portfolio</label>
                  <p className="text-gray-900 bg-white p-3 border rounded-lg">{selectedRequest.portfolio_links}</p>
                </div>
              )}

              {selectedRequest.user_references && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Références</label>
                  <p className="text-gray-900 bg-white p-3 border rounded-lg">{selectedRequest.user_references}</p>
                </div>
              )}

              {selectedRequest.additional_info && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Informations supplémentaires</label>
                  <p className="text-gray-900 bg-white p-3 border rounded-lg whitespace-pre-wrap">{selectedRequest.additional_info}</p>
                </div>
              )}

              {selectedRequest.files && selectedRequest.files.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fichiers joints</label>
                  <div className="space-y-2">
                    {selectedRequest.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                        <span className="text-gray-900">{file.name}</span>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {selectedRequest.status === 'pending' && (
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button
                  variant="danger"
                  onClick={() => handleRequestAction(selectedRequest.id, 'reject')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeter
                </Button>
                <Button
                  variant="success"
                  onClick={() => handleRequestAction(selectedRequest.id, 'approve')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approuver
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AdminLabelExceptionalRequests

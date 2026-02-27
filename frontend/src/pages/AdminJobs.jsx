import { useState, useEffect } from 'react'
import { Search, Briefcase, Eye, Trash2, Calendar, MapPin, Euro } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import { jobService } from '../services/jobService'
import { missionService } from '../services/missionService'
import toast from 'react-hot-toast'

const AdminJobs = () => {
  const [jobs, setJobs] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedJob, setSelectedJob] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ open: false, jobId: null, jobType: null })

  useEffect(() => {
    document.title = 'Missions - Admin - Indebel'
    fetchJobs()
  }, [])

  useEffect(() => {
    filterJobs()
  }, [searchTerm, statusFilter, jobs])

  const fetchJobs = async () => {
    try {
      const response = await missionService.getAllMissions()
      setJobs(response.data.data)
      setFilteredJobs(response.data.data)
    } catch (error) {
      toast.error('Erreur lors du chargement des missions')
    } finally {
      setLoading(false)
    }
  }

  const filterJobs = () => {
    let filtered = jobs

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(job => {
        const employerName = job.denomination || `${job.prenom || ''} ${job.nom || ''}`.trim()
        return (
          job.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.categorie?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.statut === statusFilter)
    }

    setFilteredJobs(filtered)
  }

  const handleView = (job) => {
    setSelectedJob(job)
    setModalOpen(true)
  }

  const handleDelete = async () => {
    try {
      await missionService.deleteMission(deleteModal.jobId, deleteModal.jobType)
      toast.success('Mission supprimée avec succès')
      setDeleteModal({ open: false, jobId: null, jobType: null })
      fetchJobs()
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const getStatusBadge = (statut) => {
    const variants = {
      ouvert: 'success',
      ferme: 'danger',
      en_cours: 'warning'
    }
    const labels = {
      ouvert: 'Ouvert',
      ferme: 'Fermé',
      en_cours: 'En cours'
    }
    return <Badge variant={variants[statut] || 'secondary'}>{labels[statut] || statut}</Badge>
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Non défini'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Non spécifié'
    if (min && max) return `${min}€ - ${max}€`
    if (min) return `À partir de ${min}€`
    if (max) return `Jusqu'à ${max}€`
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Missions</h1>
        <div className="flex items-center space-x-2">
          <Briefcase className="h-6 w-6 text-gray-600" />
          <span className="text-lg font-semibold text-gray-900">{filteredJobs.length}</span>
        </div>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par titre, description, employeur..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="ouvert">Ouverts</option>
              <option value="ferme">Fermés</option>
              <option value="en_cours">En cours</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Liste des missions */}
      <div className="grid grid-cols-1 gap-4">
        {filteredJobs.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune mission trouvée</p>
            </div>
          </Card>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{job.titre}</h3>
                    {getStatusBadge(job.statut)}
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Briefcase className="h-4 w-4 mr-2" />
                      {job.denomination || `${job.prenom || ''} ${job.nom || ''}`.trim() || 'Employeur non spécifié'}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        job.mission_type === 'hourly' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {job.mission_type === 'hourly' ? 'Forfait Horaire' : 'Forfait Fixe'}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Euro className="h-4 w-4 mr-2" />
                      {job.mission_type === 'hourly' 
                        ? `${job.forfait_heure}€/h × ${job.heures_travail_max}h`
                        : `${job.forfait_mission}€`
                      }
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {job.categorie || job.adresse_mission || 'Non spécifié'}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Publié le {formatDate(job.date_creation)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleView(job)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setDeleteModal({ open: true, jobId: job.id, jobType: job.mission_type })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal détails mission */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Détails de la mission"
        size="lg"
      >
        {selectedJob && (
          <div className="space-y-6">
            <div className="flex justify-between items-start pb-4 border-b">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedJob.titre}</h3>
                {getStatusBadge(selectedJob.statut)}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{selectedJob.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Employeur</label>
                <p className="text-gray-900">{selectedJob.denomination || `${selectedJob.prenom || ''} ${selectedJob.nom || ''}`.trim() || 'Non spécifié'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Localisation</label>
                <p className="text-gray-900">{selectedJob.adresse_mission || selectedJob.lieu_mission || 'Non spécifié'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Type de mission</label>
                <p className="text-gray-900">{selectedJob.type_mission || selectedJob.type_facturation || 'Non spécifié'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Période</label>
                <p className="text-gray-900">
                  {selectedJob.disponibilite_debut && selectedJob.disponibilite_fin 
                    ? `Du ${new Date(selectedJob.disponibilite_debut).toLocaleDateString()} au ${new Date(selectedJob.disponibilite_fin).toLocaleDateString()}`
                    : selectedJob.disponibilite_debut
                    ? `À partir du ${new Date(selectedJob.disponibilite_debut).toLocaleDateString()}`
                    : 'Non spécifiée'
                  }
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Rémunération</label>
                <p className="text-gray-900">
                  {selectedJob.taux_horaire 
                    ? `${selectedJob.taux_horaire}€/h` 
                    : selectedJob.budget_total 
                    ? `${selectedJob.budget_total}€ (forfait)`
                    : formatSalary(selectedJob.salaire_min, selectedJob.salaire_max)
                  }
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Date de publication</label>
                <p className="text-gray-900">{formatDate(selectedJob.date_creation)}</p>
              </div>
            </div>

            {selectedJob.competences_requises && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Compétences requises</h4>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(selectedJob.competences_requises) 
                    ? selectedJob.competences_requises 
                    : JSON.parse(selectedJob.competences_requises || '[]')
                  ).map((comp, index) => (
                    <Badge key={index} variant="info">{comp}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal confirmation suppression */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, jobId: null })}
        title="Confirmer la suppression"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Êtes-vous sûr de vouloir supprimer cette mission ? Cette action est irréversible.
        </p>
        <div className="flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={() => setDeleteModal({ open: false, jobId: null })}
          >
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default AdminJobs

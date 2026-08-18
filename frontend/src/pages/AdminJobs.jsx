import { useState, useEffect } from 'react'
import PageLoader from '../components/PageLoader'
import { Search, Briefcase, Eye, Trash2, Calendar, MapPin, Euro } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
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

  // Pagination
  const { currentItems, currentPage, totalPages, goToPage, totalItems } = usePagination(filteredJobs, 10)

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
      setJobs((response.data?.data || response.data))
      setFilteredJobs((response.data?.data || response.data))
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
    return <PageLoader fullScreen />
  }

  return (
    <div className="py-8">
      <div className="bg-[#082151] rounded-[24px] shadow-md p-6 md:p-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden text-white border-0">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Gestion des Missions</h1>
          <p className="text-slate-200 mt-1 text-sm md:text-base">Gérez toutes les missions publiées sur la plateforme</p>
        </div>
        <div className="relative z-10 flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-lg">
          <Briefcase className="h-5 w-5 text-white" />
          <span className="text-lg font-semibold text-white">{filteredJobs.length}</span>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#2b4eef]/20 to-[#df6422]/20 rounded-full blur-3xl -mr-16 -mt-16 z-0 pointer-events-none"></div>
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
          currentItems.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-all duration-200 group relative overflow-hidden border-transparent hover:border-primary-100">
              {/* Indicateur de statut latéral */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${
                job.statut === 'ouvert' ? 'bg-emerald-500' : 
                job.statut === 'en_cours' ? 'bg-amber-500' : 
                'bg-slate-300'
              }`} />
              
              <div className="pl-3 sm:pl-4 flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
                    <h3 className="text-lg font-bold text-[#082151] group-hover:text-[#2A4DEF] transition-colors break-words">
                      {job.titre}
                    </h3>
                    <div className="shrink-0 flex self-start sm:self-auto">
                      {getStatusBadge(job.statut)}
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed max-w-4xl">{job.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="inline-flex items-center bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-lg border border-blue-100/50">
                      <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                      <span className="truncate max-w-[160px]">
                        {job.denomination || `${job.prenom || ''} ${job.nom || ''}`.trim() || 'Employeur inconnu'}
                      </span>
                    </span>
                    
                    <span className={`inline-flex items-center px-2.5 py-1.5 rounded-lg border ${
                        job.mission_type === 'hourly' 
                          ? 'bg-purple-50 text-purple-700 border-purple-100/50' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-100/50'
                    }`}>
                      <span className="truncate">
                        {job.mission_type === 'hourly' ? 'Forfait Horaire' : 'Forfait Fixe'}
                      </span>
                    </span>
                    
                    <span className="inline-flex items-center bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-lg border border-emerald-100/50">
                      <Euro className="h-3.5 w-3.5 mr-1.5" />
                      {job.mission_type === 'hourly' 
                        ? `${job.forfait_heure}€/h × ${job.heures_travail_max}h`
                        : `${job.forfait_mission}€`
                      }
                    </span>
                    
                    <span className="inline-flex items-center bg-orange-50 text-orange-700 px-2.5 py-1.5 rounded-lg border border-orange-100/50">
                      <MapPin className="h-3.5 w-3.5 mr-1.5" />
                      <span className="truncate max-w-[150px]">
                        {job.categorie || job.adresse_mission || 'Non défini'}
                      </span>
                    </span>
                    
                    <span className="inline-flex items-center text-slate-400 px-1 ml-1">
                      <Calendar className="h-3.5 w-3.5 mr-1.5" />
                      {formatDate(job.date_creation)}
                    </span>
                  </div>
                </div>
                
                <div className="flex sm:flex-col items-center space-x-2 sm:space-x-0 sm:space-y-2 shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100 mt-2 sm:mt-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleView(job)}
                    className="flex-1 sm:flex-none w-full justify-center bg-white border-slate-200 text-[#082151] hover:text-[#2A4DEF] hover:bg-blue-50 hover:border-blue-200 shadow-sm"
                  >
                    <Eye className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Détails</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteModal({ open: true, jobId: job.id, jobType: job.mission_type })}
                    className="flex-1 sm:flex-none w-full justify-center bg-white border-slate-200 text-slate-600 hover:text-[#c02525] hover:bg-red-50 hover:border-red-200 shadow-sm"
                  >
                    <Trash2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Supprimer</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            itemsPerPage={10}
            totalItems={totalItems}
          />
        </div>
      )}

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
                <p className="text-gray-900">{selectedJob.employer_nom || 'Non spécifié'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Localisation</label>
                <p className="text-gray-900">{selectedJob.localisation || 'Non spécifié'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Type de contrat</label>
                <p className="text-gray-900">{selectedJob.type_contrat || 'Non spécifié'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Durée</label>
                <p className="text-gray-900">{selectedJob.duree || 'Non spécifiée'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Salaire</label>
                <p className="text-gray-900">{formatSalary(selectedJob.salaire_min, selectedJob.salaire_max)}</p>
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
        onClose={() => setDeleteModal({ open: false, jobId: null, jobType: null })}
        title="Confirmer la suppression"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Êtes-vous sûr de vouloir supprimer cette mission ? Cette action est irréversible.
        </p>
        <div className="flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={() => setDeleteModal({ open: false, jobId: null, jobType: null })}
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

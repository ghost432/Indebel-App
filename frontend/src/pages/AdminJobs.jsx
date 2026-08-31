import { useState, useEffect } from 'react'
import PageLoader from '../components/PageLoader'
import { Search, Briefcase, Eye, Trash2, Calendar, MapPin, Euro, CheckCircle2, XCircle, FileText, BarChart, RefreshCw } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
import { missionService } from '../services/missionService'
import toast from 'react-hot-toast'

const filterTabs = [
  ['all', 'Toutes'],
  ['ouvert', 'Ouvertes / Visibles'],
  ['en_attente', 'En attente'],
  ['en_cours', 'En cours'],
  ['termine', 'Terminées'],
  ['traite', 'Traitées'],
  ['refuse', 'Refusées'],
  ['ferme', 'Fermées']
]

const AdminJobs = () => {
  const [jobs, setJobs] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedJob, setSelectedJob] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ open: false, jobId: null, jobType: null })
  
  // Modale de visibilité
  const [visibilityModal, setVisibilityModal] = useState(null)
  const [visibilityLoading, setVisibilityLoading] = useState(false)
  const [visibilityData, setVisibilityData] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

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
      setLoading(true)
      const response = await missionService.getAllMissions()
      const data = response.data?.data || response.data || []
      setJobs(data)
      setFilteredJobs(data)
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

  const openVisibility = async (job) => {
    try {
      setVisibilityModal(job)
      setVisibilityLoading(true)
      const res = await missionService.getVisibility(job.id)
      setVisibilityData(res.data?.data || null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement de la visibilité')
      setVisibilityModal(null)
    } finally {
      setVisibilityLoading(false)
    }
  }

  const handleAction = async (jobId, jobType, statut, successMsg) => {
    try {
      setActionLoading(true)
      await missionService.updateMissionStatus(jobId, jobType, statut)
      toast.success(successMsg)
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob(prev => prev ? { ...prev, statut } : null)
      }
      fetchJobs()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action impossible')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await missionService.deleteMission(deleteModal.jobId, deleteModal.jobType)
      toast.success('Mission supprimée avec succès')
      setDeleteModal({ open: false, jobId: null, jobType: null })
      if (selectedJob && selectedJob.id === deleteModal.jobId) {
        setSelectedJob(null)
        setModalOpen(false)
      }
      fetchJobs()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression')
    }
  }

  const getStatusBadge = (statut) => {
    const map = {
      ouvert: { label: 'Ouvert / Visible', variant: 'success' },
      en_attente: { label: 'En attente', variant: 'warning' },
      traite: { label: 'Traité', variant: 'info' },
      refuse: { label: 'Refusé', variant: 'danger' },
      ferme: { label: 'Fermé', variant: 'secondary' },
      retire_liste: { label: 'Retiré', variant: 'secondary' }
    }
    const info = map[statut] || { label: statut || 'Inconnu', variant: 'secondary' }
    return <Badge variant={info.variant}>{info.label}</Badge>
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
    <div className="py-8 space-y-8">
      {/* Header */}
      <div className="bg-[#082151] rounded-[24px] shadow-md p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden text-white border-0">
        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-white/55">Pilotage Administrateur</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">Gestion des Missions</h1>
          <p className="text-slate-200 mt-1 text-sm md:text-base">Validez, modérez, suivez la visibilité et gérez toutes les missions publiées</p>
        </div>
        <div className="relative z-10 flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
            <Briefcase className="h-5 w-5 text-white" />
            <span className="text-lg font-semibold text-white">{filteredJobs.length}</span>
          </div>
          <Button variant="outline" onClick={fetchJobs} className="border-white/30 bg-white/10 text-white hover:bg-white/20">
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualiser
          </Button>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#2b4eef]/20 to-[#df6422]/20 rounded-full blur-3xl -mr-16 -mt-16 z-0 pointer-events-none"></div>
      </div>

      {/* Onglets Filtres & Barre de Recherche */}
      <Card className="p-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par titre, description, employeur, catégorie..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#082151]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {filterTabs.map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setStatusFilter(val)}
              className={`rounded-full px-4 py-2 text-xs font-black transition ${
                statusFilter === val
                  ? 'bg-[#c02525] text-white shadow-lg shadow-red-900/10'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      {/* Liste des missions */}
      <div className="grid grid-cols-1 gap-4">
        {filteredJobs.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Briefcase className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 font-bold">Aucune mission trouvée</p>
            </div>
          </Card>
        ) : (
          currentItems.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-all duration-200 group relative overflow-hidden border-slate-200">
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${
                job.statut === 'ouvert' ? 'bg-emerald-500' : 
                job.statut === 'en_attente' ? 'bg-amber-500' : 
                job.statut === 'traite' ? 'bg-blue-500' : 
                job.statut === 'refuse' ? 'bg-red-500' : 'bg-slate-300'
              }`} />
              
              <div className="pl-3 sm:pl-4 flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <h3 className="text-lg font-black text-[#082151] group-hover:text-[#2A4DEF] transition-colors break-words">
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
                        ? `${job.forfait_heure || 0}€/h × ${job.heures_travail_max || 0}h`
                        : `${job.forfait_mission || job.budget_projet || 0}€`
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
                
                <div className="flex sm:flex-col items-center gap-2 shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100 mt-2 sm:mt-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openVisibility(job)}
                    className="flex-1 sm:flex-none w-full justify-center bg-blue-50 text-[#082151] hover:bg-blue-100 border border-blue-100"
                  >
                    <BarChart className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Visibilité</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleView(job)}
                    className="flex-1 sm:flex-none w-full justify-center bg-white border-slate-200 text-[#082151] hover:text-[#2A4DEF] hover:bg-blue-50"
                  >
                    <Eye className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Gérer</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteModal({ open: true, jobId: job.id, jobType: job.mission_type })}
                    className="flex-1 sm:flex-none w-full justify-center bg-white border-slate-200 text-slate-600 hover:text-[#c02525] hover:bg-red-50 hover:border-red-200"
                  >
                    <Trash2 className="h-4 w-4 sm:mr-1.5" />
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
        <div className="mt-6 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            itemsPerPage={10}
            totalItems={totalItems}
          />
        </div>
      )}

      {/* Modale visibilité */}
      <Modal
        isOpen={!!visibilityModal}
        onClose={() => setVisibilityModal(null)}
        title={`Statistiques de Visibilité #${visibilityModal?.id || ''}`}
        size="md"
      >
        {visibilityLoading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        ) : visibilityData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                <p className="text-xs font-bold uppercase text-slate-400">Vues Totales</p>
                <p className="text-3xl font-black text-[#082151] mt-1">{visibilityData.summary?.total_views || 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                <p className="text-xs font-bold uppercase text-slate-400">Prestataires Uniques</p>
                <p className="text-3xl font-black text-[#082151] mt-1">{visibilityData.summary?.unique_viewers || 0}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-[#082151] border-b border-slate-100 pb-2 mb-3">Prestataires ayant consulté</h3>
              {visibilityData.viewers?.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {visibilityData.viewers.map((v, i) => (
                    <div key={i} className="flex justify-between items-center bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                      <div>
                        <p className="font-bold text-sm text-[#082151]">{v.denomination || `${v.prenom || ''} ${v.nom || ''}`.trim() || 'Utilisateur'}</p>
                        <p className="text-xs text-slate-500">{v.email}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-md">{v.views_count} vues</span>
                        <p className="text-[10px] text-slate-400 mt-1">Dernière: {new Date(v.last_viewed_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-slate-500 py-4">Aucun prestataire n'a encore consulté cette mission.</p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Modal détails & Actions Administrateur */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Mission #${selectedJob?.id || ''}`}
        size="lg"
      >
        {selectedJob && (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <section className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-[#c02525]">
                      {selectedJob.categorie || 'Mission'}
                    </span>
                    <h2 className="text-2xl font-black text-[#082151] mt-0.5">{selectedJob.titre}</h2>
                  </div>
                  <div>{getStatusBadge(selectedJob.statut)}</div>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6">
                  <h3 className="text-sm font-bold text-[#082151] mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" /> Description de la mission
                  </h3>
                  <p className="whitespace-pre-wrap leading-relaxed text-slate-700 text-sm">{selectedJob.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Tarification</p>
                    <p className="font-bold text-[#082151] mt-1">
                      {selectedJob.mission_type === 'hourly'
                        ? `${selectedJob.forfait_heure || 0}€/h (${selectedJob.heures_travail_max || 0}h max)`
                        : `${selectedJob.forfait_mission || selectedJob.budget_projet || 0}€ (Fixe)`}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Localisation</p>
                    <p className="font-bold text-[#082151] mt-1">{selectedJob.adresse_mission || selectedJob.ville_mission || selectedJob.localisation || 'Non spécifié'}</p>
                  </div>
                </div>

                {selectedJob.competences && (
                  <div className="mt-5">
                    <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Compétences requises</h4>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(selectedJob.competences)
                        ? selectedJob.competences
                        : JSON.parse(typeof selectedJob.competences === 'string' ? selectedJob.competences : '[]')
                      ).map((comp, idx) => (
                        <Badge key={idx} variant="info">{comp}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Pane d'actions administrateur */}
            <aside className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-[#082151] border-b border-slate-100 pb-3 mb-1">Employeur / Client</h3>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Nom / Dénomination</p>
                  <p className="font-bold text-sm text-[#082151]">
                    {selectedJob.denomination || `${selectedJob.prenom || ''} ${selectedJob.nom || ''}`.trim() || 'Inconnu'}
                  </p>
                </div>
                {selectedJob.email && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Email</p>
                    <p className="font-bold text-sm text-slate-700 break-all">{selectedJob.email}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Date de création</p>
                  <p className="font-bold text-sm text-slate-700">{formatDate(selectedJob.date_creation)}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-[#082151] border-b border-slate-100 pb-3 mb-4">Actions Administrateur</h3>
                <div className="grid gap-2.5">
                  {selectedJob.statut !== 'ouvert' && (
                    <Button
                      onClick={() => handleAction(selectedJob.id, selectedJob.mission_type, 'ouvert', 'Mission acceptée et rendue publique dans la liste')}
                      disabled={actionLoading}
                      className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Accepter / Publier
                    </Button>
                  )}

                  {selectedJob.statut !== 'refuse' && (
                    <Button
                      onClick={() => handleAction(selectedJob.id, selectedJob.mission_type, 'refuse', 'Mission refusée')}
                      disabled={actionLoading}
                      variant="danger"
                      className="w-full justify-center"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Refuser
                    </Button>
                  )}

                  <Button
                    onClick={() => handleAction(selectedJob.id, selectedJob.mission_type, 'traite', 'Mission marquée traitée')}
                    disabled={actionLoading}
                    className="w-full justify-center bg-[#082151] hover:bg-[#0d2f6f] text-white shadow-sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Marquer traité
                  </Button>

                  <Button
                    onClick={() => handleAction(selectedJob.id, selectedJob.mission_type, 'termine', 'Mission marquée terminée')}
                    disabled={actionLoading}
                    className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marquer terminée
                  </Button>

                  <Button
                    onClick={() => handleAction(selectedJob.id, selectedJob.mission_type, 'retire_liste', 'Mission retirée des listes')}
                    disabled={actionLoading}
                    variant="outline"
                    className="w-full justify-center bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                  >
                    Retirer de la liste
                  </Button>

                  <Button
                    onClick={() => setDeleteModal({ open: true, jobId: selectedJob.id, jobType: selectedJob.mission_type })}
                    disabled={actionLoading}
                    variant="danger"
                    className="w-full justify-center bg-red-100 text-red-700 hover:bg-red-200 border-transparent"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </aside>
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
        <p className="text-slate-600 mb-6 text-sm">
          Êtes-vous sûr de vouloir supprimer cette mission ? Cette action enverra une notification d'avertissement au propriétaire et aux candidats, et supprimera définitivement la mission.
        </p>
        <div className="flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={() => setDeleteModal({ open: false, jobId: null, jobType: null })}
          >
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Supprimer définitivement
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default AdminJobs

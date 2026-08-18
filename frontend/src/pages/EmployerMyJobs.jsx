import { useState, useEffect } from 'react'
import PageLoader from '../components/PageLoader'
import { Plus, Search, Filter, Trash2, Eye, Calendar, ArrowLeft, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import MissionCard from '../components/MissionCard'
import Modal from '../components/Modal'
import { missionService } from '../services/missionService'
import { demandeService } from '../services/demandeService'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const EmployerMyJobs = () => {
  const navigate = useNavigate()
  const { entreprisenom } = useParams()
  const { user } = useAuth()
  const [missions, setMissions] = useState([])
  const [filteredMissions, setFilteredMissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [deleteModal, setDeleteModal] = useState({ open: false, missionId: null, missionType: null })
  const [demandesCounts, setDemandesCounts] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    // Vérifier que l'utilisateur est bien un employer
    if (user?.role !== 'employer') {
      toast.error('Accès non autorisé')
      navigate('/')
      return
    }
    
    // Vérifier que le nom de l'entreprise correspond
    const expectedSlug = (user?.denomination || user?.nom || '')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    document.title = `Mes Missions - ${user?.denomination || 'Entreprise'} - Indebel`
    fetchMissions()
  }, [user, entreprisenom, navigate])

  // Recharger les missions quand on revient sur cette page
  useEffect(() => {
    const handleFocus = () => {
      console.log('👁️ Page en focus, rechargement des données...')
      fetchMissions()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  useEffect(() => {
    filterMissions()
  }, [searchTerm, statusFilter, typeFilter, missions])

  const fetchMissions = async () => {
    try {
      console.log('🔄 Rechargement des missions et demandes...')
      const [missionsResponse, countsResponse] = await Promise.all([
        missionService.getEmployerMissions(),
        demandeService.getDemandesCount()
      ])
      
      const missionsData = (missionsResponse.data?.data || missionsResponse.data) || []
      const counts = (countsResponse.data?.data || countsResponse.data) || {}
      
      console.log('📋 Missions récupérées:', missionsData.length)
      console.log('📊 Comptes demandes:', counts)
      
      // Pour chaque mission en_cours, récupérer le freelancer assigné
      const missionsWithFreelancer = await Promise.all(
        missionsData.map(async (mission) => {
          if (mission.statut === 'en_cours') {
            try {
              const demandesResp = await demandeService.getEmployerDemandes()
              const demandes = (demandesResp.data?.data || demandesResp.data) || []
              const acceptedDemande = demandes.find(
                d => d.mission_id === mission.id && 
                     d.mission_type === mission.mission_type && 
                     d.statut === 'accepte'
              )
              if (acceptedDemande) {
                mission.freelancer_assigne = {
                  id: acceptedDemande.freelancer_id,
                  nom: acceptedDemande.freelancer_nom,
                  prenom: acceptedDemande.freelancer_prenom,
                  email: acceptedDemande.freelancer_email
                }
              }
            } catch (err) {
              console.error('Erreur récupération freelancer:', err)
            }
          }
          return mission
        })
      )
      
      setMissions(missionsWithFreelancer)
      setFilteredMissions(missionsWithFreelancer)
      setDemandesCounts(counts)
      
      console.log('✅ Données chargées:', {
        missions: missionsWithFreelancer.length,
        counts: Object.keys(counts).length
      })
      
      if (missionsData.length === 0) {
        toast('Aucune mission publiée pour le moment', { icon: 'ℹ️' })
      }
    } catch (error) {
      console.error('❌ Erreur:', error)
      console.error('Details:', error.response?.data)
      toast.error(error.response?.data?.message || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const filterMissions = () => {
    let filtered = missions

    if (searchTerm) {
      filtered = filtered.filter(mission =>
        mission.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mission.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mission.categorie?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(mission => mission.statut === statusFilter)
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(mission => mission.mission_type === typeFilter)
    }

    setFilteredMissions(filtered)
    setCurrentPage(1)
  }

  const handleDelete = async () => {
    try {
      await missionService.deleteMission(deleteModal.missionId, deleteModal.missionType)
      toast.success('Mission supprimée avec succès')
      setDeleteModal({ open: false, missionId: null, missionType: null })
      fetchMissions()
    } catch (error) {
      toast.error('Erreur lors de la suppression de la mission')
    }
  }

  const handleStatusChange = async (mission, newStatus) => {
    try {
      await missionService.updateMissionStatus(mission.id, mission.mission_type, newStatus)
      toast.success('Statut de la mission mis à jour')
      fetchMissions()
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut')
    }
  }

  const handleTerminer = async (mission) => {
    try {
      await demandeService.terminerMission({
        mission_id: mission.id,
        mission_type: mission.mission_type
      })
      toast.success('Mission terminée')
      fetchMissions()
    } catch (error) {
      toast.error('Erreur')
    }
  }

  const getStatsByStatus = (status) => {
    return missions.filter(m => m.statut === status).length
  }

  const createMissionSlug = (mission) => {
    // Créer un slug: titre-kebab-case-id
    const titleSlug = mission.titre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    return `${titleSlug}-${mission.id}`
  }

  const handleViewDemandes = (mission) => {
    // Créer le slug de l'entreprise
    const entrepriseSlug = (user?.denomination || user?.nom || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    
    // Créer le slug de la mission
    const missionSlug = createMissionSlug(mission)
    
    // Naviguer vers la page de demandes de cette mission
    navigate(`/employer/${entrepriseSlug}/myjob/${missionSlug}/demandes`)
  }

  if (loading) {
    return <PageLoader fullScreen />
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 space-y-6 sm:space-y-0">
        <div>
          <button 
            onClick={() => navigate(-1)} 
            className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </button>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-4">
            <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-indigo-600" />
            </div>
            Mes Missions - {user?.denomination || 'Entreprise'}
          </h1>
          <p className="text-lg text-slate-500 mt-2 sm:ml-16">Gérez l'ensemble de vos missions publiées et suivez leur statut.</p>
        </div>
        <Button onClick={() => navigate('/employer/publish-mission')} className="whitespace-nowrap shadow-lg shadow-indigo-200">
          <Plus className="h-5 w-5 mr-2" />
          Publier une mission
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div>
            <p className="text-sm text-blue-600 font-medium">Total</p>
            <p className="text-3xl font-bold text-blue-700">{missions.length}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <div>
            <p className="text-sm text-green-600 font-medium">Ouvertes</p>
            <p className="text-3xl font-bold text-green-700">{getStatsByStatus('ouvert')}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div>
            <p className="text-sm text-yellow-600 font-medium">En cours</p>
            <p className="text-3xl font-bold text-yellow-700">{getStatsByStatus('en_cours')}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
          <div>
            <p className="text-sm text-gray-600 font-medium">Terminées</p>
            <p className="text-3xl font-bold text-gray-700">{getStatsByStatus('termine')}</p>
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="h-4 w-4 inline mr-1" />
              Statut
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tous</option>
              <option value="ouvert">Ouvertes</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminées</option>
              <option value="ferme">Fermées</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="h-4 w-4 inline mr-1" />
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tous</option>
              <option value="hourly">Forfait Horaire</option>
              <option value="fixed">Forfait Fixe</option>
            </select>
          </div>
          <div className="flex items-center">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-lg text-gray-900">{filteredMissions.length}</span> mission(s)
            </div>
          </div>
        </div>
      </Card>

      {/* Liste missions */}
      <div className="flex flex-col space-y-6">
        {filteredMissions.length === 0 ? (
          <div className="w-full">
            <Card>
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">
                  {missions.length === 0 
                    ? 'Aucune mission publiée'
                    : 'Aucune mission ne correspond'
                  }
                </p>
                {missions.length === 0 && (
                  <Button 
                    onClick={() => navigate('/employer/publish-mission')} 
                    className="mt-4"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Publier ma première mission
                  </Button>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <>
            {filteredMissions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((mission) => {
              const missionKey = `${mission.mission_type}-${mission.id}`
              const counts = demandesCounts[missionKey] || { total: 0, en_attente: 0, accepte: 0 }
              
              return (
                <div key={missionKey} className="relative transition-transform duration-200">
                  <MissionCard 
                    mission={mission} 
                    showActions={false}
                    demandesCount={counts.total}
                    onViewDemandes={handleViewDemandes}
                    showDetails={true}
                  />
                  <div className="flex flex-wrap gap-3 items-center justify-end bg-slate-50 p-4 rounded-b-xl border border-slate-200 shadow-sm mt-[-8px] relative z-0">
                    <div className="flex-1 min-w-[200px]">
                      <select
                        value={mission.statut}
                        onChange={(e) => handleStatusChange(mission, e.target.value)}
                        className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-700 bg-white"
                      >
                        <option value="en_attente">⏳ En attente</option>
                        <option value="ouvert">✓ Ouvert</option>
                        <option value="en_cours">⏳ En cours</option>
                        <option value="termine">✅ Terminé</option>
                        <option value="ferme">🔒 Fermé</option>
                      </select>
                    </div>
                    {mission.statut === 'en_cours' && (
                      <Button
                        onClick={() => handleTerminer(mission)}
                        variant="secondary"
                        size="sm"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Terminer
                      </Button>
                    )}
                    <Button
                      onClick={() => handleViewDemandes(mission)}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Détails
                    </Button>
                    <Button
                      onClick={() => setDeleteModal({ 
                        open: true, 
                        missionId: mission.id, 
                        missionType: mission.mission_type 
                      })}
                      variant="danger"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              )
            })}
            
            {/* Pagination Controls */}
            {filteredMissions.length > itemsPerPage && (
              <div className="flex justify-center items-center space-x-6 mt-8 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Précédent
                </Button>
                <span className="text-sm font-medium text-slate-600 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                  Page {currentPage} sur {Math.ceil(filteredMissions.length / itemsPerPage)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredMissions.length / itemsPerPage)))}
                  disabled={currentPage === Math.ceil(filteredMissions.length / itemsPerPage)}
                  className="disabled:opacity-50"
                >
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal suppression */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, missionId: null, missionType: null })}
        title="Supprimer la mission"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-900">
              ⚠️ Action irréversible. Les candidatures seront supprimées.
            </p>
          </div>
          <p className="text-gray-700">Confirmer la suppression ?</p>
          <div className="flex space-x-3 pt-4">
            <Button onClick={handleDelete} variant="danger" className="flex-1">
              Supprimer
            </Button>
            <Button
              onClick={() => setDeleteModal({ open: false, missionId: null, missionType: null })}
              variant="outline"
              className="flex-1"
            >
              Annuler
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default EmployerMyJobs

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Trash2, Eye, Calendar, ArrowLeft } from 'lucide-react'
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
  const { recruteurnom } = useParams()
  const { user } = useAuth()
  const [missions, setMissions] = useState([])
  const [filteredMissions, setFilteredMissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [deleteModal, setDeleteModal] = useState({ open: false, missionId: null, missionType: null })
  const [demandesCounts, setDemandesCounts] = useState({})

  useEffect(() => {
    // Vérifier que l'utilisateur est bien un employer
    if (user?.role !== 'employer') {
      toast.error('Accès non autorisé')
      navigate('/')
      return
    }

    // Vérifier que le nom de le recruteur correspond
    const expectedSlug = (user?.denomination || user?.nom || '')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    document.title = `Mes Missions - ${user?.denomination || 'Recruteur'} - Indebel`
    fetchMissions()
  }, [user, recruteurnom, navigate])

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

      const missionsData = missionsResponse.data.data || []
      const counts = countsResponse.data.data || {}

      console.log('📋 Missions récupérées:', missionsData.length)
      console.log('📊 Comptes demandes:', counts)

      // Pour chaque mission en_cours, récupérer le freelancer assigné
      const missionsWithFreelancer = await Promise.all(
        missionsData.map(async (mission) => {
          if (mission.statut === 'en_cours') {
            try {
              const demandesResp = await demandeService.getEmployerDemandes()
              const demandes = demandesResp.data.data || []
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
        toast('Aucune mission publiée pour le moment')
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
  }

  const handleDelete = async () => {
    toast('Suppression non implémentée')
    setDeleteModal({ open: false, missionId: null, missionType: null })
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
    // Créer le slug de le recruteur
    const recruteurSlug = (user?.denomination || user?.nom || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Créer le slug de la mission
    const missionSlug = createMissionSlug(mission)

    // Naviguer vers la page de demandes de cette mission
    navigate(`/employer/${recruteurSlug}/myjob/${missionSlug}/demandes`)
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
        <div>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            size="sm"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mes Missions - {user?.denomination || 'Recruteur'}
          </h1>
          <p className="text-gray-600">Gérez vos missions publiées</p>
        </div>
        <Button onClick={() => navigate('/employer/publish-mission')} className="whitespace-nowrap">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMissions.length === 0 ? (
          <div className="col-span-2">
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
          filteredMissions.map((mission) => {
            const missionKey = `${mission.mission_type}-${mission.id}`
            const counts = demandesCounts[missionKey] || { total: 0, en_attente: 0, accepte: 0 }

            console.log(`Mission ${mission.titre} (${missionKey}):`, {
              statut: mission.statut,
              counts: counts
            })

            return (
              <div key={missionKey}>
                <MissionCard
                  mission={mission}
                  showActions={false}
                  demandesCount={counts.total}
                  onViewDemandes={handleViewDemandes}
                  showDetails={true}
                />
                <div className="mt-4 flex space-x-2">
                  {mission.statut === 'en_cours' && (
                    <Button
                      onClick={() => handleTerminer(mission)}
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Terminer
                    </Button>
                  )}
                  <Button
                    onClick={() => handleViewDemandes(mission)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
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
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })
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

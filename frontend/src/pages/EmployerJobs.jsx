import { useState, useEffect } from 'react'
import PageLoader from '../components/PageLoader'
import { Plus, Search, Filter, Edit, Trash2, Eye, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import MissionCard from '../components/MissionCard'
import Modal from '../components/Modal'
import { missionService } from '../services/missionService'
import { demandeService } from '../services/demandeService'
import toast from 'react-hot-toast'

const EmployerJobs = () => {
  const navigate = useNavigate()
  const [missions, setMissions] = useState([])
  const [filteredMissions, setFilteredMissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [deleteModal, setDeleteModal] = useState({ open: false, missionId: null, missionType: null })
  const [demandesCounts, setDemandesCounts] = useState({})

  useEffect(() => {
    document.title = 'Mes Missions - Indebel'
    fetchMissions()
  }, [])

  useEffect(() => {
    filterMissions()
  }, [searchTerm, statusFilter, typeFilter, missions])

  const fetchMissions = async () => {
    try {
      const response = await missionService.getEmployerMissions()
      console.log('📊 Missions récupérées:', response.data)
      console.log('📋 Nombre de missions:', (response.data?.data || response.data)?.length || 0)
      
      const missionsData = (response.data?.data || response.data) || []
      setMissions(missionsData)
      setFilteredMissions(missionsData)
      
      if (missionsData.length === 0) {
        console.log('⚠️ Aucune mission trouvée pour cet employeur')
      }
    } catch (error) {
      console.error('❌ Erreur chargement missions:', error)
      console.error('Details:', error.response?.data)
      toast.error(error.response?.data?.message || 'Erreur lors du chargement des missions')
    } finally {
      setLoading(false)
    }
  }

  const filterMissions = () => {
    let filtered = missions

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(mission =>
        mission.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mission.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mission.categorie?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(mission => mission.statut === statusFilter)
    }

    // Filtre par type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(mission => mission.mission_type === typeFilter)
    }

    setFilteredMissions(filtered)
  }

  const handleDelete = async () => {
    // TODO: Implémenter la suppression
    toast.info('Suppression non implémentée pour le moment')
    setDeleteModal({ open: false, missionId: null, missionType: null })
  }

  const handleTerminer = async (mission) => {
    try {
      await demandeService.terminerMission({
        mission_id: mission.id,
        mission_type: mission.mission_type
      })
      toast.success('Mission marquée comme terminée')
      fetchMissions()
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const getStatsByStatus = (status) => {
    return missions.filter(m => m.statut === status).length
  }

  const handleViewDemandes = (mission) => {
    navigate(`/employer/demandes?mission_id=${mission.id}&mission_type=${mission.mission_type}`)
  }

  if (loading) {
    return <PageLoader fullScreen />
  }

  return (
    <div className="py-8">
      {/* Header */}
      <div className="bg-[#082151] rounded-[24px] shadow-md p-6 md:p-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden text-white border-0">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Mes Missions</h1>
          <p className="text-slate-200 mt-1 text-sm md:text-base">Gérez vos missions publiées</p>
        </div>
        <div className="relative z-10">
          <Button onClick={() => navigate('/employer/publish-mission')} className="bg-[#df6422] hover:bg-[#c9571b] text-white border-0 font-bold rounded-xl shadow-sm">
            <Plus className="h-5 w-5 mr-2" />
            Publier une mission
          </Button>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#2b4eef]/20 to-[#df6422]/20 rounded-full blur-3xl -mr-16 -mt-16 z-0 pointer-events-none"></div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total</p>
              <p className="text-3xl font-bold text-blue-700">{missions.length}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Ouvertes</p>
              <p className="text-3xl font-bold text-green-700">{getStatsByStatus('ouvert')}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">En cours</p>
              <p className="text-3xl font-bold text-yellow-700">{getStatsByStatus('en_cours')}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Terminées</p>
              <p className="text-3xl font-bold text-gray-700">{getStatsByStatus('termine')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recherche */}
          <div className="md:col-span-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par titre, description, secteur..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filtre statut */}
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
              <option value="all">Tous les statuts</option>
              <option value="ouvert">Ouvertes</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminées</option>
              <option value="ferme">Fermées</option>
            </select>
          </div>

          {/* Filtre type */}
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
              <option value="all">Tous les types</option>
              <option value="hourly">Forfait Horaire</option>
              <option value="fixed">Forfait Fixe</option>
            </select>
          </div>

          {/* Résultats */}
          <div className="flex items-center">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-lg text-gray-900">{filteredMissions.length}</span> mission(s) trouvée(s)
            </div>
          </div>
        </div>
      </Card>

      {/* Liste des missions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMissions.length === 0 ? (
          <div className="col-span-2">
            <Card>
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">
                  {missions.length === 0 
                    ? 'Aucune mission publiée'
                    : 'Aucune mission ne correspond à vos critères'
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
          filteredMissions.map((mission) => (
            <div key={`${mission.mission_type}-${mission.id}`} className="relative">
              <MissionCard
                mission={mission}
                showActions={false}
                demandesCount={demandesCounts[`${mission.mission_type}-${mission.id}`] || 0}
                onViewDemandes={handleViewDemandes}
              />
              
              {/* Actions overlay */}
              <div className="mt-4 flex items-center space-x-2">
                <Button
                  onClick={() => navigate(`/employer/demandes`)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Voir candidatures
                </Button>
                
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
          ))
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
              ⚠️ Cette action est irréversible. Toutes les candidatures associées seront également supprimées.
            </p>
          </div>
          <p className="text-gray-700">Êtes-vous sûr de vouloir supprimer cette mission ?</p>
          
          <div className="flex items-center space-x-3 pt-4">
            <Button
              onClick={handleDelete}
              variant="danger"
              className="flex-1"
            >
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

export default EmployerJobs

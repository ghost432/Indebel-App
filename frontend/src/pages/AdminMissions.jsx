import { useState, useEffect } from 'react'
import { Search, Briefcase, Eye, Trash2, Check, X, Calendar, MapPin, Euro, Play } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import { missionService } from '../services/missionService'
import toast from 'react-hot-toast'

const AdminMissions = () => {
    const [missions, setMissions] = useState([])
    const [filteredMissions, setFilteredMissions] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('en_attente')
    const [selectedMission, setSelectedMission] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [deleteModal, setDeleteModal] = useState({ open: false, missionId: null, missionType: null })
    const [actionModal, setActionModal] = useState({ open: false, type: null, mission: null })

    useEffect(() => {
        document.title = 'Modération Missions - Admin - Indebel'
        fetchMissions()
    }, [])

    useEffect(() => {
        filterMissions()
    }, [searchTerm, statusFilter, missions])

    const fetchMissions = async () => {
        try {
            const response = await missionService.getAllMissions()
            setMissions(response.data.data)
            setFilteredMissions(response.data.data)
        } catch (error) {
            toast.error('Erreur lors du chargement des missions')
        } finally {
            setLoading(false)
        }
    }

    const filterMissions = () => {
        let filtered = missions

        // Filtre par recherche
        if (searchTerm) {
            filtered = filtered.filter(mission => {
                const employerName = mission.denomination || `${mission.prenom || ''} ${mission.nom || ''}`.trim()
                return (
                    mission.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    mission.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    employerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    mission.categorie?.toLowerCase().includes(searchTerm.toLowerCase())
                )
            })
        }

        // Filtre par statut
        if (statusFilter !== 'all') {
            filtered = filtered.filter(mission => mission.statut === statusFilter)
        }

        setFilteredMissions(filtered)
    }

    const handleView = (mission) => {
        setSelectedMission(mission)
        setModalOpen(true)
    }

    const handleDelete = async () => {
        try {
            await missionService.deleteMission(deleteModal.missionId, deleteModal.missionType)
            toast.success('Mission supprimée avec succès')
            setDeleteModal({ open: false, missionId: null, missionType: null })
            fetchMissions()
        } catch (error) {
            toast.error('Erreur lors de la suppression')
        }
    }

    const handleStatusChange = async (mission, newStatus) => {
        try {
            await missionService.updateStatus(mission.id, newStatus, mission.mission_type)
            toast.success(`Mission ${newStatus === 'ouvert' ? 'approuvée' : newStatus === 'refuse' ? 'refusée' : 'mise à jour'} avec succès`)
            setActionModal({ open: false, type: null, mission: null })
            fetchMissions()
        } catch (error) {
            toast.error('Erreur lors de la mise à jour du statut')
        }
    }

    const getStatusBadge = (statut) => {
        const variants = {
            ouvert: 'success',
            ferme: 'danger',
            en_cours: 'warning',
            en_attente: 'info',
            refuse: 'danger'
        }
        const labels = {
            ouvert: 'Ouvert',
            ferme: 'Fermé',
            en_cours: 'En cours',
            en_attente: 'En attente',
            refuse: 'Refusé'
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
                <h1 className="text-3xl font-bold text-gray-900">Modération des Missions</h1>
                <div className="flex items-center space-x-2">
                    <Briefcase className="h-6 w-6 text-gray-600" />
                    <span className="text-lg font-semibold text-gray-900">{filteredMissions.length}</span>
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
                            <option value="en_attente">En attente (À modérer)</option>
                            <option value="ouvert">Ouverts</option>
                            <option value="refuse">Refusés</option>
                            <option value="en_cours">En cours</option>
                            <option value="ferme">Fermés</option>
                            <option value="all">Tous les statuts</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Liste des missions */}
            <div className="grid grid-cols-1 gap-4">
                {filteredMissions.length === 0 ? (
                    <Card>
                        <div className="text-center py-12">
                            <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">Aucune mission trouvée pour ce filtre</p>
                        </div>
                    </Card>
                ) : (
                    filteredMissions.map((mission) => (
                        <Card key={mission.id} className="hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="text-xl font-semibold text-gray-900">{mission.titre}</h3>
                                        {getStatusBadge(mission.statut)}
                                    </div>

                                    <p className="text-gray-600 mb-4 line-clamp-2">{mission.description}</p>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div className="flex items-center text-gray-600">
                                            <Briefcase className="h-4 w-4 mr-2" />
                                            {mission.denomination || `${mission.prenom || ''} ${mission.nom || ''}`.trim() || 'Employeur non spécifié'}
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                            <span className={`px-2 py-1 rounded-full text-xs ${mission.mission_type === 'hourly' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                                }`}>
                                                {mission.mission_type === 'hourly' ? 'Forfait Horaire' : 'Forfait Fixe'}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                            <Euro className="h-4 w-4 mr-2" />
                                            {mission.mission_type === 'hourly'
                                                ? `${mission.forfait_heure}€/h × ${mission.heures_travail_max}h`
                                                : `${mission.forfait_mission}€`
                                            }
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                            <MapPin className="h-4 w-4 mr-2" />
                                            {mission.categorie || mission.adresse_mission || 'Non spécifié'}
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            Publié le {formatDate(mission.date_creation)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 ml-4 flex-col gap-2">
                                    <div className="flex space-x-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleView(mission)}
                                            title="Voir détails"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            onClick={() => setDeleteModal({ open: true, missionId: mission.id, missionType: mission.mission_type })}
                                            title="Supprimer"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {mission.statut === 'en_attente' && (
                                        <div className="flex space-x-2 mt-2">
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => handleStatusChange(mission, 'ouvert')}
                                                title="Approuver"
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                                onClick={() => handleStatusChange(mission, 'refuse')}
                                                title="Refuser"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                    {mission.statut === 'ouvert' && (
                                        <Button
                                            size="sm"
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white mt-2 w-full"
                                            onClick={() => handleStatusChange(mission, 'ferme')}
                                            title="Fermer"
                                        >
                                            Fermer
                                        </Button>
                                    )}
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
                {selectedMission && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-start pb-4 border-b">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedMission.titre}</h3>
                                {getStatusBadge(selectedMission.statut)}
                            </div>
                            {selectedMission.statut === 'en_attente' && (
                                <div className="flex space-x-2">
                                    <Button
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => {
                                            handleStatusChange(selectedMission, 'ouvert');
                                            setModalOpen(false);
                                        }}
                                    >
                                        <Check className="h-4 w-4 mr-2" /> Approuver
                                    </Button>
                                    <Button
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                        onClick={() => {
                                            handleStatusChange(selectedMission, 'refuse');
                                            setModalOpen(false);
                                        }}
                                    >
                                        <X className="h-4 w-4 mr-2" /> Refuser
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{selectedMission.description}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600">Employeur</label>
                                <p className="text-gray-900">{selectedMission.denomination || `${selectedMission.prenom || ''} ${selectedMission.nom || ''}`.trim() || 'Non spécifié'}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600">Localisation</label>
                                <p className="text-gray-900">{selectedMission.adresse_mission || selectedMission.lieu_mission || 'Non spécifié'}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600">Type de mission</label>
                                <p className="text-gray-900">{selectedMission.type_mission || selectedMission.type_facturation || 'Non spécifié'}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600">Statut actuel</label>
                                <p className="text-gray-900 font-medium capitalize">{selectedMission.statut}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600">Rémunération</label>
                                <p className="text-gray-900">
                                    {selectedMission.forfait_heure
                                        ? `${selectedMission.forfait_heure}€/h`
                                        : selectedMission.forfait_mission
                                            ? `${selectedMission.forfait_mission}€ (forfait)`
                                            : 'Non spécifié'
                                    }
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600">Date de publication</label>
                                <p className="text-gray-900">{formatDate(selectedMission.date_creation)}</p>
                            </div>
                        </div>

                        {selectedMission.competences && (
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Compétences requises</h4>
                                <div className="flex flex-wrap gap-2">
                                    {(Array.isArray(selectedMission.competences)
                                        ? selectedMission.competences
                                        : JSON.parse(selectedMission.competences || '[]')
                                    ).map((comp, index) => (
                                        <Badge key={index} variant="info">{comp}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedMission.statut === 'en_attente' && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                                <p className="text-blue-800 text-sm">
                                    Cette mission est en attente de modération. Elle n'est pas encore visible pour les freelances.
                                    Veuillez vérifier le contenu avant de l'approuver.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Modal confirmation suppression */}
            <Modal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, missionId: null })}
                title="Confirmer la suppression"
                size="sm"
            >
                <p className="text-gray-600 mb-6">
                    Êtes-vous sûr de vouloir supprimer cette mission ? Cette action est irréversible.
                </p>
                <div className="flex justify-end space-x-3">
                    <Button
                        variant="secondary"
                        onClick={() => setDeleteModal({ open: false, missionId: null })}
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

export default AdminMissions

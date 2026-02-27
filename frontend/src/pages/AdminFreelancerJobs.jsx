import { useState, useEffect } from 'react'
import { Search, Briefcase, Eye, CheckCircle, XCircle, Calendar, MapPin, Euro, User } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import { missionService } from '../services/missionService'
import { jobService } from '../services/jobService'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const AdminFreelancerJobs = () => {
    const [jobs, setJobs] = useState([])
    const [filteredJobs, setFilteredJobs] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('en_attente_validation')
    const [selectedJob, setSelectedJob] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        document.title = 'Validation Missions Prestataires - Admin - Indebel'
        fetchJobs()
    }, [statusFilter])

    useEffect(() => {
        filterJobs()
    }, [searchTerm, jobs])

    const fetchJobs = async () => {
        try {
            setLoading(true)
            const response = await jobService.getAllFreelancerJobs()
            if (response.data.success) {
                // Filtrer par statut localement car l'API retourne tout
                const filteredByStatus = response.data.data.filter(j => j.statut === statusFilter)
                setJobs(response.data.data)
                setFilteredJobs(filteredByStatus)
            }
        } catch (error) {
            toast.error('Erreur lors du chargement des missions')
        } finally {
            setLoading(false)
        }
    }

    const filterJobs = () => {
        let filtered = jobs.filter(j => j.statut === statusFilter)
        if (searchTerm) {
            filtered = filtered.filter(job =>
                job.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                `${job.prenom} ${job.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.email?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }
        setFilteredJobs(filtered)
    }

    const handleApprove = async (jobId) => {
        try {
            setProcessing(true)
            const response = await jobService.updateFreelancerJobStatus(jobId, 'ouvert')
            if (response.data.success) {
                toast.success('Mission approuvée avec succès')
                setModalOpen(false)
                fetchJobs()
            }
        } catch (error) {
            toast.error('Erreur lors de l\'approbation')
        } finally {
            setProcessing(false)
        }
    }

    const handleReject = async (jobId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir refuser cette mission ?')) return
        try {
            setProcessing(true)
            const response = await jobService.updateFreelancerJobStatus(jobId, 'refuse')
            if (response.data.success) {
                toast.success('Mission refusée avec succès')
                setModalOpen(false)
                fetchJobs()
            }
        } catch (error) {
            toast.error('Erreur lors du refus')
        } finally {
            setProcessing(false)
        }
    }

    const getStatusBadge = (statut) => {
        const variants = {
            ouvert: 'success',
            en_attente_validation: 'warning',
            refuse: 'danger'
        }
        const labels = {
            ouvert: 'Approuvé',
            en_attente_validation: 'En attente',
            refuse: 'Refusé'
        }
        return <Badge variant={variants[statut] || 'secondary'}>{labels[statut] || statut}</Badge>
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric', month: 'long', day: 'numeric'
        })
    }

    if (loading && jobs.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Validation Missions Prestataires</h1>
                <div className="flex items-center space-x-2">
                    <Briefcase className="h-6 w-6 text-primary-600" />
                    <span className="text-lg font-semibold text-gray-900">{filteredJobs.length} en attente</span>
                </div>
            </div>

            <Card className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher par titre, prestataire..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <select
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="en_attente_validation">En attente de validation</option>
                            <option value="ouvert">Déjà approuvées</option>
                            <option value="refuse">Refusées</option>
                        </select>
                    </div>
                </div>
            </Card>

            <div className="space-y-4">
                {filteredJobs.length === 0 ? (
                    <Card className="text-center py-12">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <p className="text-gray-600">Aucune mission en attente de validation</p>
                    </Card>
                ) : (
                    filteredJobs.map((job) => (
                        <Card key={job.id} className="hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-xl font-bold text-gray-900">{job.titre}</h3>
                                        {getStatusBadge(job.statut)}
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                                        <div className="flex items-center">
                                            <User className="h-4 w-4 mr-1 text-primary-500" />
                                            {job.prenom} {job.nom}
                                        </div>
                                        <div className="flex items-center">
                                            <MapPin className="h-4 w-4 mr-1 text-primary-500" />
                                            {job.localisation}
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 mr-1 text-primary-500" />
                                            Soumis le {formatDate(job.date_creation)}
                                        </div>
                                    </div>
                                    <p className="text-gray-600 line-clamp-2 text-sm">{job.description}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => { setSelectedJob(job); setModalOpen(true); }}>
                                        <Eye className="h-4 w-4 mr-1" /> Voir
                                    </Button>
                                    {job.statut === 'en_attente_validation' && (
                                        <div className="flex items-center gap-2">
                                            <Button variant="danger" size="sm" onClick={() => handleReject(job.id)} disabled={processing}>
                                                <XCircle className="h-4 w-4 mr-1" /> Refuser
                                            </Button>
                                            <Button variant="primary" size="sm" onClick={() => handleApprove(job.id)} disabled={processing}>
                                                <CheckCircle className="h-4 w-4 mr-1" /> Approuver
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Détails de la mission à valider"
                size="lg"
            >
                {selectedJob && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-start pb-4 border-b">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{selectedJob.titre}</h3>
                                <p className="text-primary-600 font-medium">{selectedJob.secteur}</p>
                            </div>
                            {getStatusBadge(selectedJob.statut)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg text-sm">
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Prestataire</h4>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                                        {selectedJob.prenom[0]}{selectedJob.nom[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{selectedJob.prenom} {selectedJob.nom}</p>
                                        <p className="text-gray-500">{selectedJob.email}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Détails Financiers</h4>
                                <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
                                    <Euro className="h-5 w-5 text-green-600" />
                                    {selectedJob.type_forfait === 'hourly'
                                        ? `${selectedJob.taux_horaire}€/h (${selectedJob.heures_estimees}h est.)`
                                        : `${selectedJob.budget_fixe}€ (Forfait fixe)`
                                    }
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Description de la mission</h4>
                            <div className="prose prose-sm max-w-none text-gray-700 bg-white border p-4 rounded-lg h-48 overflow-y-auto">
                                {selectedJob.description}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-1">Localisation</h4>
                                <p className="text-gray-600 flex items-center"><MapPin className="h-4 w-4 mr-1" /> {selectedJob.localisation}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-1">Date de début</h4>
                                <p className="text-gray-600 flex items-center"><Calendar className="h-4 w-4 mr-1" /> {selectedJob.date_debut ? formatDate(selectedJob.date_debut) : 'Dès que possible'}</p>
                            </div>
                        </div>

                        {selectedJob.statut === 'en_attente_validation' && (
                            <div className="flex justify-end gap-3 pt-6 border-t">
                                <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
                                <Button variant="danger" onClick={() => handleReject(selectedJob.id)} disabled={processing}>
                                    <XCircle className="h-4 w-4 mr-1" /> Refuser
                                </Button>
                                <Button variant="primary" onClick={() => handleApprove(selectedJob.id)} disabled={processing}>
                                    <CheckCircle className="h-4 w-4 mr-1" /> Valider et publier la mission
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default AdminFreelancerJobs

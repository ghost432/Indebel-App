import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Briefcase, Plus, Eye, Clock, CheckCircle, MapPin, Calendar, Building2, Euro, XCircle, Users } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import { jobService } from '../services/jobService'
import toast from 'react-hot-toast'

const FreelancerMyPublishedJobs = () => {
    const navigate = useNavigate()
    const [jobs, setJobs] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        document.title = 'Mes Missions Publiées - Indebel'
        fetchMyJobs()
    }, [])

    const fetchMyJobs = async () => {
        try {
            setLoading(true)
            const response = await jobService.getFreelancerMyJobs()
            if (response.data.success) {
                setJobs(response.data.data)
            }
        } catch (error) {
            toast.error('Erreur lors du chargement de vos missions')
        } finally {
            setLoading(false)
        }
    }

    const handleCloseJob = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir fermer cette mission ? Elle ne sera plus visible par les autres prestataires.')) {
            return
        }
        try {
            const response = await jobService.closeFreelancerJob(id)
            if (response.data.success) {
                toast.success('Mission fermée avec succès')
                fetchMyJobs()
            }
        } catch (error) {
            toast.error('Erreur lors de la fermeture de la mission')
        }
    }

    const getStatusBadge = (statut) => {
        const variants = {
            ouvert: 'success',
            en_attente_validation: 'warning',
            ferme: 'secondary',
            annule: 'danger'
        }
        const labels = {
            ouvert: 'Publiée',
            en_attente_validation: 'En attente de validation',
            ferme: 'Clôturée',
            annule: 'Annulée'
        }
        return <Badge variant={variants[statut] || 'secondary'}>{labels[statut] || statut}</Badge>
    }

    const filteredJobs = jobs.filter(job =>
        job.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Mes Missions Publiées</h1>
                    <p className="text-gray-600">Gérez les missions que vous avez créées en tant que recruteur.</p>
                </div>
            </div>

            <Card className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher une mission..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </Card>

            <div className="space-y-4">
                {filteredJobs.length === 0 ? (
                    <Card className="text-center py-16">
                        <Briefcase className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune mission trouvée</h3>
                        <p className="text-gray-500 mb-6">Vous n'avez pas encore publié de mission ou aucune ne correspond à votre recherche.</p>
                    </Card>
                ) : (
                    filteredJobs.map((job) => (
                        <Card key={job.id} className="hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-gray-900">{job.titre}</h3>
                                            {getStatusBadge(job.statut)}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6 text-sm text-gray-600 mb-4">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-primary-500" /> {job.localisation}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-primary-500" /> Publié le {new Date(job.date_creation).toLocaleDateString('fr-FR')}
                                            </div>
                                            <div className="flex items-center gap-2 font-semibold text-gray-900">
                                                <Euro className="h-4 w-4 text-emerald-500" />
                                                {job.type_forfait === 'hourly'
                                                    ? `${job.taux_horaire}€/h`
                                                    : `${job.budget_fixe}€ (Total)`
                                                }
                                            </div>
                                        </div>

                                        <p className="text-gray-600 line-clamp-2 text-sm italic">"{job.description}"</p>
                                    </div>

                                    <div className="flex md:flex-col justify-end gap-2 shrink-0">
                                        <Button variant="outline" size="sm" onClick={() => navigate(`/freelancer/jobs/${job.id}`)}>
                                            <Eye className="h-4 w-4 mr-1" /> Détails
                                        </Button>
                                        {job.statut === 'ouvert' && (
                                            <>
                                                <Button variant="primary" size="sm" onClick={() => {
                                                    const slug = job.titre.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '')
                                                    navigate(`/freelancer/my-published-jobs/${slug}-${job.id}/applications`)
                                                }}>
                                                    <Users className="h-4 w-4 mr-1" /> Candidatures
                                                </Button>
                                                <Button variant="danger" size="sm" onClick={() => handleCloseJob(job.id)}>
                                                    <XCircle className="h-4 w-4 mr-1" /> Fermer
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}

export default FreelancerMyPublishedJobs

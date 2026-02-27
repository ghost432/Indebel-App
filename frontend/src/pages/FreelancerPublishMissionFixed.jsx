import { useState, useEffect } from 'react'
import { Euro, MapPin, Briefcase, Calendar, Users, Clock } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import SecteurCompetenceSelector from '../components/SecteurCompetenceSelector'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { API_BASE_URL } from '../config'
import { jobService } from '../services/jobService'

const LANGUES = ['Français', 'Néerlandais', 'Anglais', 'Allemand', 'Espagnol', 'Italien', 'Portugais', 'Arabe', 'Chinois', 'Japonais']

const FreelancerPublishMissionFixed = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [lieux, setLieux] = useState([])
    const [formData, setFormData] = useState({
        titre: '',
        type_mission: 'jour',
        categorie: '',
        competences: [],
        langues_parlees: ['Français'],
        description: '',
        forfait_mission: '',
        temps_max_estime: '',
        type_facturation: 'projet',
        lieu_mission: 'site_entreprise',
        autre_lieu: '',
        date_debut: '',
        nombre_independants: 1,
        urgente: false
    })

    useEffect(() => {
        fetchLieux()
    }, [])

    const fetchLieux = () => {
        const lieuxStatiques = [
            { id: 1, value: 'site_entreprise', nom: 'Sur site', actif: 1 },
            { id: 2, value: 'autre_site', nom: 'Sur un autre site', actif: 1 }
        ]
        setLieux(lieuxStatiques)
    }

    const toggleLangue = (langue) => {
        setFormData(prev => ({
            ...prev,
            langues_parlees: prev.langues_parlees.includes(langue)
                ? prev.langues_parlees.filter(l => l !== langue)
                : [...prev.langues_parlees, langue]
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (formData.langues_parlees.length === 0) return toast.error('Sélectionnez au moins une langue')
        if (formData.competences.length === 0) return toast.error('Sélectionnez au moins une compétence')
        if (!formData.autre_lieu) return toast.error('Veuillez préciser la ville de la mission')

        setLoading(true)
        try {
            await jobService.createFreelancerJobFixed({
                ...formData,
                adresse_mission: formData.autre_lieu,
                forfait_mission: parseFloat(formData.forfait_mission),
                nombre_independants: parseInt(formData.nombre_independants)
            })

            toast.success('Demande de recrutement soumise pour validation')
            navigate('/freelancer/my-published-jobs')
        } catch (error) {
            console.error('Erreur publication fixed:', error)
            toast.error(error.response?.data?.message || 'Erreur lors de la publication')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="py-8">
            <Button onClick={() => navigate('/freelancer/publish-mission')} variant="outline" className="mb-4">← Retour</Button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Recrutement au Forfait Fixe</h1>
            <p className="text-gray-600 mb-8">Trouvez un sous-traitant avec un budget global défini</p>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card title="Informations générales">
                            <div className="space-y-4">
                                <Input label="Titre du poste *" name="titre" value={formData.titre}
                                    onChange={(e) => setFormData({ ...formData, titre: e.target.value })} required icon={Briefcase} />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Type de mission *</label>
                                        <select name="type_mission" value={formData.type_mission} onChange={(e) => setFormData({ ...formData, type_mission: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" required>
                                            <option value="jour">De jour</option>
                                            <option value="nuit">De nuit</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Type de facturation *</label>
                                        <select name="type_facturation" value={formData.type_facturation} onChange={(e) => setFormData({ ...formData, type_facturation: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" required>
                                            <option value="projet">Par projet</option>
                                            <option value="etape">Par étape</option>
                                        </select>
                                    </div>
                                </div>

                                <SecteurCompetenceSelector
                                    selectedSecteur={formData.categorie}
                                    setSelectedSecteur={(val) => setFormData(prev => ({ ...prev, categorie: val }))}
                                    selectedCompetences={formData.competences}
                                    setSelectedCompetences={(val) => setFormData(prev => ({ ...prev, competences: val }))}
                                    competencesLabel="Compétences recherchées"
                                />

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Langues requises *</label>
                                    <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {LANGUES.map(langue => (
                                                <label key={langue} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                                    <input type="checkbox" checked={formData.langues_parlees.includes(langue)} onChange={() => toggleLangue(langue)}
                                                        className="rounded border-gray-300 text-primary-600" />
                                                    <span className="text-sm">{langue}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description du poste *</label>
                                    <textarea name="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows="6" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Décrivez les tâches à effectuer..." required />
                                </div>
                            </div>
                        </Card>

                        <Card title="Budget et Délai">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Budget total (€) *" name="forfait_mission" type="number" value={formData.forfait_mission}
                                        onChange={(e) => setFormData({ ...formData, forfait_mission: e.target.value })} required min="0" step="0.01" icon={Euro} />
                                    <Input label="Délai estimé *" name="temps_max_estime" value={formData.temps_max_estime}
                                        onChange={(e) => setFormData({ ...formData, temps_max_estime: e.target.value })} required placeholder="Ex: 2 semaines" icon={Clock} />
                                </div>
                            </div>
                        </Card>

                        <Card title="Lieu et date">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Lieu de travail *</label>
                                    <select name="lieu_mission" value={formData.lieu_mission} onChange={(e) => setFormData({ ...formData, lieu_mission: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" required>
                                        {lieux.map(lieu => (
                                            <option key={lieu.id} value={lieu.value}>{lieu.nom}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Ville *</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={formData.autre_lieu}
                                            onChange={(e) => setFormData({ ...formData, autre_lieu: e.target.value })}
                                            placeholder="Ex: Bruxelles, Liège..."
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Date de début *" name="date_debut" type="date" value={formData.date_debut}
                                        onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })} required icon={Calendar} />
                                    <Input label="Nombre de personnes *" name="nombre_independants" type="number" value={formData.nombre_independants}
                                        onChange={(e) => setFormData({ ...formData, nombre_independants: e.target.value })} required min="1" icon={Users} />
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="sticky top-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Résumé</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-gray-600">Type</span>
                                    <span className="font-medium">Forfait Fixe</span>
                                </div>
                                {formData.forfait_mission && (
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-600">Budget Global</span>
                                        <span className="font-bold text-gray-900">{formData.forfait_mission} €</span>
                                    </div>
                                )}
                                {formData.temps_max_estime && (
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-600">Délai</span>
                                        <span className="font-medium">{formData.temps_max_estime}</span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-6 space-y-3">
                                <Button type="submit" loading={loading} className="w-full">Soumettre pour validation</Button>
                                <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/freelancer/publish-mission')}>Annuler</Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    )
}

export default FreelancerPublishMissionFixed

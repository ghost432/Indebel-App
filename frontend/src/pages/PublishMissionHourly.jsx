import { useState, useEffect } from 'react'
import { Clock, MapPin, Briefcase, Calendar, Users, Euro, Coins, AlertCircle } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import SecteurCompetenceSelector from '../components/SecteurCompetenceSelector'
import MapboxAutocomplete from '../components/MapboxAutocomplete'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const LANGUES = ['Français', 'Néerlandais', 'Anglais', 'Allemand', 'Espagnol', 'Italien', 'Portugais', 'Arabe', 'Chinois', 'Japonais']

const PublishMissionHourly = () => {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [searchParams] = useSearchParams()
  const initialSecteur = searchParams.get('secteur') || ''
  const initialCompetences = searchParams.get('competences') ? searchParams.get('competences').split(',') : []
  const [loading, setLoading] = useState(false)
  const isAdmin = user?.role === 'admin'
  const employerId = searchParams.get('employer_id')
  const [lieux, setLieux] = useState([])
  const [creditCost, setCreditCost] = useState(1)
  const [showInsufficientModal, setShowInsufficientModal] = useState(false)
  const [formData, setFormData] = useState({
    titre: '', type_mission: 'jour', categorie: initialSecteur, langues_parlees: [], description: '',
    competences: initialCompetences, forfait_heure: '', heures_travail_max: '', type_facturation: 'jour',
    ville_mission: '', lieu_mission: '', autre_lieu: '', date_debut: '', nombre_independants: '1',
    urgente: false
  })

  useEffect(() => {
    fetchLieux()
    fetchCreditCost()
  }, [])

  const fetchCreditCost = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`${API_BASE_URL}/credits/price`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data && res.data.cout_missions_employer !== undefined) {
        setCreditCost(parseInt(res.data.cout_missions_employer, 10))
      }
    } catch (err) {
      console.error('Erreur chargement prix crédits:', err)
    }
  }

  const fetchLieux = () => {
    const lieuxStatiques = [
      { id: 1, value: 'site_entreprise', nom: 'Sur le site de l\'entreprise', comportement: 'conditionnel', actif: 1 },
      { id: 2, value: 'autre_site', nom: 'Sur un autre site', comportement: 'conditionnel', actif: 1 }
    ]
    setLieux(lieuxStatiques)
    if (lieuxStatiques.length > 0) {
      setFormData(prev => ({ ...prev, lieu_mission: lieuxStatiques[0].value }))
    }
  }

  const toggleLangue = (langue) => {
    setFormData(prev => ({
      ...prev,
      langues_parlees: prev.langues_parlees.includes(langue)
        ? prev.langues_parlees.filter(l => l !== langue)
        : [...prev.langues_parlees, langue]
    }))
  }

  const userBalance = user?.solde_credits !== undefined ? user.solde_credits : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.langues_parlees.length === 0) return toast.error('Sélectionnez au moins une langue')
    if (formData.competences.length === 0) return toast.error('Sélectionnez au moins une compétence')
    if (!formData.autre_lieu) return toast.error('Veuillez préciser le lieu de la mission')
    
    if (!isAdmin && userBalance < creditCost) {
      setShowInsufficientModal(true)
      return
    }

    const finalEmployerId = isAdmin && employerId ? parseInt(employerId) : user?.id
    if (!finalEmployerId) return toast.error('Employer ID manquant')
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post(`${API_BASE_URL}/missions/hourly`, {
        ...formData,
        employer_id: finalEmployerId,
        adresse_mission: formData.autre_lieu,
        forfait_heure: parseFloat(formData.forfait_heure),
        heures_travail_max: parseInt(formData.heures_travail_max),
        nombre_independants: parseInt(formData.nombre_independants)
      }, { headers: { Authorization: `Bearer ${token}` }})
      
      if (refreshUser) await refreshUser()
      toast.success('Mission publiée avec succès !')
      navigate(isAdmin ? '/admin/jobs' : '/employer/dashboard')
    } catch (error) {
      if (error.response?.data?.code === 'INSUFFICIENT_CREDITS') {
        setShowInsufficientModal(true)
      } else {
        toast.error(error.response?.data?.message || 'Erreur lors de la publication')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <button onClick={() => navigate(isAdmin ? '/admin/publish-mission' : '/employer/publish-mission')} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center mb-4 transition-colors">
          <span className="mr-2">←</span> Retour
        </button>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Clock className="h-7 w-7 text-blue-600" />
          </div>
          Mission Forfait Horaire
        </h1>
        <p className="text-lg text-slate-500 mt-3">Détaillez vos besoins pour trouver le profil idéal au taux horaire.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title="Informations générales">
              <div className="space-y-4">
                <Input label="Titre de la mission *" name="titre" value={formData.titre}
                  onChange={(e) => setFormData({...formData, titre: e.target.value})} required icon={Briefcase} />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type de mission *</label>
                    <select name="type_mission" value={formData.type_mission} onChange={(e) => setFormData({...formData, type_mission: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" required>
                      <option value="jour">De jour</option>
                      <option value="nuit">De nuit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type de facturation *</label>
                    <select name="type_facturation" value={formData.type_facturation} onChange={(e) => setFormData({...formData, type_facturation: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" required>
                      <option value="jour">Par jour</option>
                      <option value="semaine">Par semaine</option>
                      <option value="mois">Par mois</option>
                    </select>
                  </div>
                </div>

                <SecteurCompetenceSelector
                  selectedSecteur={formData.categorie}
                  setSelectedSecteur={(val) => setFormData(prev => ({...prev, categorie: val}))}
                  selectedCompetences={formData.competences}
                  setSelectedCompetences={(val) => setFormData(prev => ({...prev, competences: val}))}
                  competencesLabel="Compétences requises pour cette mission"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Langues parlées *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea name="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="6" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Décrivez la mission en détail..." required />
                </div>
              </div>
            </Card>

            <Card title="Tarification">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Forfait par heure (€) *" name="forfait_heure" type="number" value={formData.forfait_heure}
                    onChange={(e) => setFormData({...formData, forfait_heure: e.target.value})} required min="0" step="0.01" icon={Euro} />
                  <Input label="Nombre d'heures estimé *" name="heures_travail_max" type="number" value={formData.heures_travail_max}
                    onChange={(e) => setFormData({...formData, heures_travail_max: e.target.value})} required min="1" placeholder="Ex: 40" icon={Clock} />
                </div>
                {formData.forfait_heure && formData.heures_travail_max && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900"><strong>Budget total estimé :</strong> {(parseFloat(formData.forfait_heure) * parseInt(formData.heures_travail_max)).toFixed(2)} €</p>
                  </div>
                )}
              </div>
            </Card>

            <Card title="Lieu et date">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lieu de la mission *</label>
                  <select name="lieu_mission" value={formData.lieu_mission} onChange={(e) => setFormData({...formData, lieu_mission: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" required>
                    {lieux.filter(l => l.actif === 1).map(lieu => (
                      <option key={lieu.id} value={lieu.value}>{lieu.nom}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Précisez la ville *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.autre_lieu}
                      onChange={(e) => {
                        const ville = e.target.value
                        setFormData({
                          ...formData,
                          autre_lieu: ville,
                          ville_mission: ville
                        })
                      }}
                      placeholder="Ex: Bruxelles, Liège, Anvers..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Saisissez la ville où se déroulera la mission (utilisé pour le matching avec les prestataires)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input label="Date de début souhaitée *" name="date_debut" type="date" value={formData.date_debut}
                    onChange={(e) => setFormData({...formData, date_debut: e.target.value})} required icon={Calendar} />
                  <Input label="Nombre d'indépendants *" name="nombre_independants" type="number" value={formData.nombre_independants}
                    onChange={(e) => setFormData({...formData, nombre_independants: e.target.value})} required min="1" icon={Users} />
                </div>

                {/* Mission urgente - Seulement pour forfaits payants */}
                {user?.forfait_nom && user?.forfait_nom !== 'Gratuit' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.urgente}
                        onChange={(e) => setFormData({...formData, urgente: e.target.checked})}
                        className="h-5 w-5 text-yellow-600 rounded border-gray-300 focus:ring-yellow-500"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900">🔥 Marquer comme urgente</span>
                        <p className="text-xs text-gray-600 mt-1">Les missions urgentes apparaissent en premier dans la liste</p>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">Résumé</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Type</span>
                  <span className="font-medium">Forfait Horaire</span>
                </div>
                {formData.forfait_heure && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Tarif/h</span>
                    <span className="font-medium">{formData.forfait_heure} €</span>
                  </div>
                )}
                {formData.heures_travail_max && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Durée estimée</span>
                    <span className="font-medium">{formData.heures_travail_max} heures</span>
                  </div>
                )}
                {formData.forfait_heure && formData.heures_travail_max && (
                  <div className="flex justify-between py-2 bg-blue-50 px-3 rounded">
                    <span className="text-blue-900 font-medium">Budget</span>
                    <span className="font-bold text-blue-900">{(parseFloat(formData.forfait_heure) * parseInt(formData.heures_travail_max)).toFixed(2)} €</span>
                  </div>
                )}
                {!isAdmin && (
                  <div className="flex justify-between py-2.5 px-3 bg-amber-50 rounded-xl border border-amber-200/60 mt-2">
                    <span className="text-amber-900 font-bold flex items-center gap-1.5 text-xs">
                      <Coins className="h-4 w-4 text-amber-500" /> Coût publication :
                    </span>
                    <span className="font-black text-amber-900 text-xs">{creditCost} crédit(s)</span>
                  </div>
                )}
              </div>
              <div className="mt-6 space-y-3">
                <Button type="submit" loading={loading} className="w-full bg-[#2b4eef] hover:bg-[#1f3bbd]">Publier la mission</Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/employer/publish-mission')}>Annuler</Button>
              </div>
            </Card>
          </div>
        </div>
      </form>

      {/* Modal solde insuffisant */}
      {showInsufficientModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-slate-100 text-center relative overflow-hidden">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 mb-4 ring-8 ring-amber-50/50">
              <AlertCircle className="h-8 w-8" />
            </div>
            
            <h3 className="text-xl font-black text-[#082151]">Solde de crédits insuffisant</h3>
            
            <p className="mt-3 text-sm font-medium text-slate-600 leading-relaxed">
              Pour publier cette mission, votre compte doit disposer d'au moins <span className="font-bold text-[#082151]">{creditCost} crédit(s)</span>.
            </p>

            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Votre solde actuel :</span>
                <span className="font-black text-rose-600">{userBalance} crédit(s)</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Coût de la publication :</span>
                <span className="font-black text-[#082151]">{creditCost} crédit(s)</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setShowInsufficientModal(false)}
                className="w-full rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </Button>
              <Button
                onClick={() => navigate('/employer/credits')}
                className="w-full rounded-xl font-bold bg-[#df6422] hover:bg-[#c5551c] text-white shadow-md"
              >
                Recharger mes crédits
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PublishMissionHourly

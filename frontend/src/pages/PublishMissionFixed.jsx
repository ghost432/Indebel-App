import { useState, useEffect } from 'react'
import { Clock, MapPin, Briefcase, Calendar, Users, Euro } from 'lucide-react'
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

const PublishMissionFixed = () => {
  const isFreeFreelancer = user?.role === 'freelancer' && (!user?.forfait_id || user?.forfait_id === 1);

  useEffect(() => {
    if (isFreeFreelancer) {
      navigate('/employer/publish-mission');
    }
    fetchLieux();
  }, [isFreeFreelancer])

  const fetchLieux = () => {
    // Lieux de mission statiques (peuvent être chargés depuis l'API plus tard)
    const lieuxStatiques = [
      { id: 1, value: 'site_entreprise', nom: 'Sur site', comportement: 'conditionnel', actif: 1 },
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.langues_parlees.length === 0) return toast.error('Sélectionnez au moins une langue')
    if (formData.competences.length === 0) return toast.error('Sélectionnez au moins une compétence')
    if (!formData.autre_lieu) return toast.error('Veuillez préciser le lieu de la mission')

    // Déterminer l'employer_id (admin publie pour un employer ou employer publie pour lui-même)
    const finalEmployerId = isAdmin && employerId ? parseInt(employerId) : user?.id
    if (!finalEmployerId) return toast.error('Employer ID manquant')

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      // Utiliser autre_lieu (ville) comme adresse_mission
      await axios.post(`${API_BASE_URL}/missions/fixed`, {
        ...formData,
        employer_id: finalEmployerId,
        adresse_mission: formData.autre_lieu, // Utiliser la ville comme adresse
        forfait_mission: parseFloat(formData.forfait_mission),
        temps_max_estime: parseInt(formData.temps_max_estime),
        nombre_independants: parseInt(formData.nombre_independants)
      }, { headers: { Authorization: `Bearer ${token}` } })

      toast.success('Mission publiée et en attente d\'approbation')
      navigate(isAdmin ? '/admin/jobs' : '/employer/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la publication')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-8">
      <Button onClick={() => navigate(isAdmin ? '/admin/publish-mission' : '/employer/publish-mission')} variant="outline" className="mb-4">← Retour</Button>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Mission Forfait Fixe</h1>
      <p className="text-gray-600 mb-8">Remplissez les détails de votre mission</p>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title="Informations générales">
              <div className="space-y-4">
                <Input label="Titre de la mission *" name="titre" value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })} required icon={Briefcase} />

                <div className="grid grid-cols-2 gap-4">
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
                      <option value="jour">Par jour</option>
                      <option value="semaine">Par semaine</option>
                      <option value="mois">Par mois</option>
                    </select>
                  </div>
                </div>

                <SecteurCompetenceSelector
                  selectedSecteur={formData.categorie}
                  setSelectedSecteur={(val) => setFormData(prev => ({ ...prev, categorie: val }))}
                  selectedCompetences={formData.competences}
                  setSelectedCompetences={(val) => setFormData(prev => ({ ...prev, competences: val }))}
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
                  <textarea name="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="6" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Décrivez la mission en détail..." required />
                </div>
              </div>
            </Card>

            <Card title="Tarification">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Forfait de la mission (€) *" name="forfait_mission" type="number" value={formData.forfait_mission}
                    onChange={(e) => setFormData({ ...formData, forfait_mission: e.target.value })} required min="0" step="0.01" icon={Euro} />
                  <Input label="Temps maximal estimé (heures) *" name="temps_max_estime" type="number" value={formData.temps_max_estime}
                    onChange={(e) => setFormData({ ...formData, temps_max_estime: e.target.value })} placeholder="Ex: 160" required min="1" icon={Clock} />
                </div>
              </div>
            </Card>

            <Card title="Lieu et date">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lieu de la mission *</label>
                  <select name="lieu_mission" value={formData.lieu_mission} onChange={(e) => setFormData({ ...formData, lieu_mission: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })} required icon={Calendar} />
                  <Input label="Nombre d'prestataires *" name="nombre_independants" type="number" value={formData.nombre_independants}
                    onChange={(e) => setFormData({ ...formData, nombre_independants: e.target.value })} required min="1" icon={Users} />
                </div>

                {/* Mission urgente - Seulement pour forfaits payants */}
                {user?.forfait_nom && user?.forfait_nom !== 'Gratuit' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.urgente}
                        onChange={(e) => setFormData({ ...formData, urgente: e.target.checked })}
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
                  <span className="font-medium">Forfait Fixe</span>
                </div>
                {formData.forfait_mission && (
                  <div className="flex justify-between py-2 bg-green-50 px-3 rounded">
                    <span className="text-green-900 font-medium">Budget</span>
                    <span className="font-bold text-green-900">{parseFloat(formData.forfait_mission).toFixed(2)} €</span>
                  </div>
                )}
                {formData.temps_max_estime && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Durée estimée</span>
                    <span className="font-medium">{formData.temps_max_estime} heures</span>
                  </div>
                )}
              </div>
              <div className="mt-6 space-y-3">
                <Button type="submit" loading={loading} className="w-full">Publier la mission</Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/employer/publish-mission')}>Annuler</Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

export default PublishMissionFixed

import { useState, useEffect } from 'react'
import { Clock, Euro, FileText, MapPin, Briefcase, Calendar, Star } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { jobService } from '../services/jobService'
import { useAuth } from '../context/AuthContext'

const PublishMission = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [missionType, setMissionType] = useState(null) // 'hourly' or 'fixed'
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    // Commun
    titre: '',
    description: '',
    localisation: '',
    secteur: '',
    competences: '',
    date_debut: '',
    duree_estimee: '',

    // Forfait horaire
    taux_horaire: '',
    heures_estimees: '',

    // Forfait fixe
    budget_fixe: '',

    // Autres
    niveau_experience: 'intermediaire',
    statut: 'ouvert'
  })

  useEffect(() => {
    document.title = 'Publier une Mission - Indebel'
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleMissionTypeSelect = (type) => {
    if (type === 'hourly') {
      navigate('/employer/publish-mission-hourly')
    } else if (type === 'fixed') {
      navigate('/employer/publish-mission-fixed')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Préparer les données selon le type
      const missionData = {
        titre: formData.titre,
        description: formData.description,
        localisation: formData.localisation,
        secteur: formData.secteur,
        competences_requises: formData.competences.split(',').map(c => c.trim()),
        date_debut: formData.date_debut || null,
        duree: formData.duree_estimee || null,
        niveau_experience: formData.niveau_experience,
        type_forfait: missionType,
        statut: 'ouvert',
        employer_id: user?.id
      }

      // Ajouter les champs spécifiques selon le type
      if (missionType === 'hourly') {
        missionData.taux_horaire = parseFloat(formData.taux_horaire)
        missionData.heures_estimees = parseInt(formData.heures_estimees)
        missionData.salaire_min = missionData.taux_horaire * missionData.heures_estimees
        missionData.salaire_max = missionData.salaire_min
      } else if (missionType === 'fixed') {
        missionData.budget_fixe = parseFloat(formData.budget_fixe)
        missionData.salaire_min = missionData.budget_fixe
        missionData.salaire_max = missionData.budget_fixe
      }

      // Appel API
      await jobService.createJob(missionData)

      toast.success('Mission publiée avec succès !')
      navigate('/employer/jobs')
    } catch (error) {
      console.error('Erreur publication:', error)
      toast.error(error.response?.data?.message || 'Erreur lors de la publication de la mission')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setMissionType(null)
  }

  const isFreeFreelancer = user?.role === 'freelancer' && (!user?.forfait_id || user?.forfait_id === 1);

  // Page de sélection du type de mission
  if (!missionType) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Publier une Mission</h1>
        <p className="text-gray-600 mb-8">Choisissez le type de forfait pour votre mission</p>

        {isFreeFreelancer ? (
          <Card className="bg-gradient-to-br from-primary-50 to-white border-primary-200">
            <div className="text-center py-12 px-6">
              <div className="h-20 w-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="h-10 w-10 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Boostez votre activité avec Indebel Premium
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto mb-8 text-lg">
                La publication de missions est réservée à nos membres Premium et Business.
                Devenez recruteur, gérez vos sous-traitants et développez votre équipe en passant au niveau supérieur.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate('/freelancer/forfaits')}
                  className="bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-200"
                >
                  Découvrir les forfaits Premium
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/freelancer/dashboard')}
                >
                  Retour au tableau de bord
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {/* Mission à Forfait Horaire */}
            <Card
              className="hover:shadow-xl transition-all border-2 border-transparent hover:border-primary-500 cursor-pointer"
              onClick={() => setMissionType('hourly')}
            >
              <div className="text-center p-6">
                <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-10 w-10 text-white" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">Mission à Forfait Horaire</h3>

                <p className="text-gray-600 mb-6">
                  Paiement basé sur le nombre d'heures travaillées avec un taux horaire défini
                </p>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMissionType('hourly');
                  }}
                >
                  Utiliser ce type
                </Button>
              </div>
            </Card>

            {/* Mission à Forfait Fixe */}
            <Card
              className="hover:shadow-xl transition-all border-2 border-transparent hover:border-green-500 cursor-pointer"
              onClick={() => setMissionType('fixed')}
            >
              <div className="text-center p-6">
                <div className="h-20 w-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Euro className="h-10 w-10 text-white" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">Mission à Forfait Fixe</h3>

                <p className="text-gray-600 mb-6">
                  Budget global défini à l'avance pour l'ensemble du projet
                </p>

                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMissionType('fixed');
                  }}
                >
                  Utiliser ce type
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    )
  }

  // Formulaire de publication
  return (
    <div>
      <div className="mb-8">
        <Button onClick={handleBack} variant="outline" className="mb-4">
          ← Retour à la sélection
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Publier une Mission {missionType === 'hourly' ? 'à Forfait Horaire' : 'à Forfait Fixe'}
        </h1>
        <p className="text-gray-600">Remplissez les détails de votre mission</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations générales */}
            <Card title="Informations générales">
              <div className="space-y-4">
                <Input
                  label="Titre de la mission *"
                  name="titre"
                  value={formData.titre}
                  onChange={handleChange}
                  placeholder="Ex: Développeur React pour application web"
                  required
                  icon={Briefcase}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description de la mission *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="6"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Décrivez en détail la mission, les objectifs, les livrables attendus..."
                    required
                  />
                </div>

                <Input
                  label="Localisation *"
                  name="localisation"
                  value={formData.localisation}
                  onChange={handleChange}
                  placeholder="Ex: Bruxelles (ou Remote)"
                  required
                  icon={MapPin}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Secteur d'activité *"
                    name="secteur"
                    value={formData.secteur}
                    onChange={handleChange}
                    placeholder="Ex: Informatique"
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Niveau d'expérience requis *
                    </label>
                    <select
                      name="niveau_experience"
                      value={formData.niveau_experience}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="debutant">Débutant (0-2 ans)</option>
                      <option value="intermediaire">Intermédiaire (2-5 ans)</option>
                      <option value="expert">Expert (5+ ans)</option>
                    </select>
                  </div>
                </div>

                <Input
                  label="Compétences requises *"
                  name="competences"
                  value={formData.competences}
                  onChange={handleChange}
                  placeholder="Séparez par des virgules: React, Node.js, MongoDB"
                  required
                />
              </div>
            </Card>

            {/* Budget et durée */}
            <Card title={missionType === 'hourly' ? 'Taux horaire et estimation' : 'Budget et durée'}>
              <div className="space-y-4">
                {missionType === 'hourly' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Taux horaire (€) *"
                        name="taux_horaire"
                        type="number"
                        value={formData.taux_horaire}
                        onChange={handleChange}
                        placeholder="Ex: 45"
                        required
                        min="0"
                        step="0.01"
                        icon={Euro}
                      />

                      <Input
                        label="Heures estimées *"
                        name="heures_estimees"
                        type="number"
                        value={formData.heures_estimees}
                        onChange={handleChange}
                        placeholder="Ex: 160"
                        required
                        min="1"
                        icon={Clock}
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900">
                        <strong>Budget estimé :</strong> {
                          formData.taux_horaire && formData.heures_estimees
                            ? `${(parseFloat(formData.taux_horaire) * parseFloat(formData.heures_estimees)).toFixed(2)} €`
                            : '0.00 €'
                        }
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Input
                      label="Budget fixe (€) *"
                      name="budget_fixe"
                      type="number"
                      value={formData.budget_fixe}
                      onChange={handleChange}
                      placeholder="Ex: 5000"
                      required
                      min="0"
                      step="0.01"
                      icon={Euro}
                    />
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Date de début souhaitée"
                    name="date_debut"
                    type="date"
                    value={formData.date_debut}
                    onChange={handleChange}
                    icon={Calendar}
                  />

                  <Input
                    label="Durée estimée"
                    name="duree_estimee"
                    value={formData.duree_estimee}
                    onChange={handleChange}
                    placeholder="Ex: 2 mois"
                    icon={Clock}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Résumé */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">Résumé</h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">Type de forfait</span>
                  <span className="font-medium text-gray-900">
                    {missionType === 'hourly' ? 'Horaire' : 'Fixe'}
                  </span>
                </div>

                {missionType === 'hourly' && formData.taux_horaire && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-600">Taux horaire</span>
                    <span className="font-medium text-gray-900">{formData.taux_horaire} €/h</span>
                  </div>
                )}

                {missionType === 'hourly' && formData.heures_estimees && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-600">Heures estimées</span>
                    <span className="font-medium text-gray-900">{formData.heures_estimees}h</span>
                  </div>
                )}

                {missionType === 'hourly' && formData.taux_horaire && formData.heures_estimees && (
                  <div className="flex items-center justify-between py-2 border-b bg-blue-50 px-3 rounded">
                    <span className="text-blue-900 font-medium">Budget total estimé</span>
                    <span className="font-bold text-blue-900">
                      {(parseFloat(formData.taux_horaire) * parseFloat(formData.heures_estimees)).toFixed(2)} €
                    </span>
                  </div>
                )}

                {missionType === 'fixed' && formData.budget_fixe && (
                  <div className="flex items-center justify-between py-2 border-b bg-green-50 px-3 rounded">
                    <span className="text-green-900 font-medium">Budget fixe</span>
                    <span className="font-bold text-green-900">{formData.budget_fixe} €</span>
                  </div>
                )}

                {formData.duree_estimee && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-600">Durée</span>
                    <span className="font-medium text-gray-900">{formData.duree_estimee}</span>
                  </div>
                )}

                {formData.niveau_experience && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-600">Niveau</span>
                    <span className="font-medium text-gray-900 capitalize">{formData.niveau_experience}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                  disabled={!formData.titre || !formData.description}
                >
                  Publier la mission
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/employer/jobs')}
                >
                  Annuler
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

export default PublishMission

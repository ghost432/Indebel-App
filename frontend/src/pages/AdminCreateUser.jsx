import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Mail, Lock, User, Building2, Phone, MapPin, Briefcase, Globe } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import MultiSelect from '../components/MultiSelect'
import SecteurCompetenceSelector from '../components/SecteurCompetenceSelector'
import { pays } from '../data/secteurs'
import toast from 'react-hot-toast'
import axios from 'axios'

const AdminCreateUser = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState('freelancer')
  
  const [formData, setFormData] = useState({
    role: 'freelancer',
    // Commun
    email: '',
    mot_de_passe: '',
    nom: '',
    prenom: '',
    pays_code: 'BE',
    indicatif: '+32',
    telephone: '',
    // Freelancer
    numero_bce: '',
    denomination: '',
    adresse: '',
    poste: '',
    secteur: '',
    competences: [],
    experience: '',
    tarif_journalier: '',
    disponibilite: '',
    portfolio_url: '',
    // Employer
    description_recruteur: '',
    site_web: '',
    taille_recruteur: '',
    competences_recherchees: []
  })

  useEffect(() => {
    document.title = 'Créer un utilisateur - Admin - Indebel'
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePaysChange = (e) => {
    const selectedPays = pays.find(p => p.code === e.target.value)
    setFormData(prev => ({
      ...prev,
      pays_code: e.target.value,
      indicatif: selectedPays?.indicatif || ''
    }))
  }

  const handleRoleChange = (role) => {
    setSelectedRole(role)
    setFormData(prev => ({ ...prev, role }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.email || !formData.mot_de_passe) {
      return toast.error('Email et mot de passe requis')
    }

    if (selectedRole === 'admin' && (!formData.nom || !formData.prenom)) {
      return toast.error('Nom et prénom requis pour admin')
    }

    if (selectedRole === 'freelancer' && (!formData.nom || !formData.prenom)) {
      return toast.error('Nom et prénom requis pour prestataire')
    }

    if (selectedRole === 'employer' && !formData.denomination) {
      return toast.error('Dénomination requise pour recruteur')
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      
      // Préparer les données selon le rôle
      let userData = {
        email: formData.email,
        mot_de_passe: formData.mot_de_passe,
        role: formData.role,
        pays_code: formData.pays_code,
        indicatif: formData.indicatif,
        telephone: formData.telephone,
        email_verified: true // Auto-vérifier les comptes créés par admin
      }

      if (selectedRole === 'freelancer') {
        userData = {
          ...userData,
          nom: formData.nom,
          prenom: formData.prenom,
          numero_bce: formData.numero_bce,
          denomination: formData.denomination,
          adresse: formData.adresse,
          poste: formData.poste,
          secteur: formData.secteur,
          competences: Array.isArray(formData.competences) ? formData.competences.join(', ') : formData.competences,
          experience: formData.experience,
          tarif_journalier: formData.tarif_journalier,
          disponibilite: formData.disponibilite,
          portfolio_url: formData.portfolio_url
        }
      } else if (selectedRole === 'employer') {
        userData = {
          ...userData,
          denomination: formData.denomination,
          numero_bce: formData.numero_bce,
          adresse: formData.adresse,
          nom: formData.nom || '',
          prenom: formData.prenom || '',
          secteur: formData.secteur,
          competences_recherchees: Array.isArray(formData.competences_recherchees) 
            ? formData.competences_recherchees.join(', ') 
            : formData.competences_recherchees,
          description_recruteur: formData.description_recruteur,
          site_web: formData.site_web,
          taille_recruteur: formData.taille_recruteur
        }
      } else if (selectedRole === 'admin') {
        userData = {
          ...userData,
          nom: formData.nom,
          prenom: formData.prenom
        }
      }

      const response = await axios.post('/api/auth/register', userData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        toast.success(`Utilisateur ${selectedRole} créé avec succès !`)
        navigate('/admin/users')
      }
    } catch (error) {
      console.error('Erreur création utilisateur:', error)
      toast.error(error.response?.data?.message || 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-custom py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer un utilisateur</h1>
        <p className="text-gray-600">Créez un nouveau compte utilisateur sur la plateforme</p>
      </div>

      {/* Sélection du rôle */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Type de compte</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleRoleChange('freelancer')}
            className={`p-6 border-2 rounded-lg transition-all ${
              selectedRole === 'freelancer'
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <User className="h-8 w-8 mx-auto mb-3 text-primary-600" />
            <h3 className="font-semibold text-gray-900 mb-1">Prestataire</h3>
            <p className="text-sm text-gray-600">Freelancer / Travailleur prestataire</p>
          </button>

          <button
            onClick={() => handleRoleChange('employer')}
            className={`p-6 border-2 rounded-lg transition-all ${
              selectedRole === 'employer'
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Building2 className="h-8 w-8 mx-auto mb-3 text-primary-600" />
            <h3 className="font-semibold text-gray-900 mb-1">Recruteur</h3>
            <p className="text-sm text-gray-600">Recruteur / Employeur</p>
          </button>

          <button
            onClick={() => handleRoleChange('admin')}
            className={`p-6 border-2 rounded-lg transition-all ${
              selectedRole === 'admin'
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <UserPlus className="h-8 w-8 mx-auto mb-3 text-primary-600" />
            <h3 className="font-semibold text-gray-900 mb-1">Administrateur</h3>
            <p className="text-sm text-gray-600">Admin de la plateforme</p>
          </button>
        </div>
      </Card>

      {/* Formulaire selon le rôle */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de connexion */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de connexion</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                icon={Mail}
              />
              <Input
                label="Mot de passe *"
                name="mot_de_passe"
                type="password"
                value={formData.mot_de_passe}
                onChange={handleChange}
                required
                icon={Lock}
              />
            </div>
          </div>

          {/* Formulaire Prestataire */}
          {selectedRole === 'freelancer' && (
            <>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations personnelles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Input
                    label="Prénom *"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    required
                    icon={User}
                  />
                  <Input
                    label="Nom *"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                    icon={User}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                    <select
                      value={formData.pays_code}
                      onChange={handlePaysChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {pays.map(p => (
                        <option key={p.code} value={p.code}>{p.nom}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Indicatif"
                    name="indicatif"
                    value={formData.indicatif}
                    disabled
                    icon={Phone}
                  />
                  <Input
                    label="Téléphone"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleChange}
                    icon={Phone}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations professionnelles</h3>
                <div className="space-y-4">
                  <Input
                    label="Numéro BCE (Optionnel)"
                    name="numero_bce"
                    value={formData.numero_bce}
                    onChange={handleChange}
                    placeholder="0123.456.789"
                    icon={Building2}
                  />
                  
                  <Input
                    label="Dénomination (Optionnel)"
                    name="denomination"
                    value={formData.denomination}
                    onChange={handleChange}
                    placeholder="Nom de votre recruteur"
                    icon={Building2}
                  />

                  <Input
                    label="Adresse"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleChange}
                    icon={MapPin}
                  />

                  <Input
                    label="Poste / Métier"
                    name="poste"
                    value={formData.poste}
                    onChange={handleChange}
                    placeholder="Ex: Développeur Full-Stack"
                    icon={Briefcase}
                  />

                  <SecteurCompetenceSelector
                    selectedSecteur={formData.secteur}
                    setSelectedSecteur={(val) => setFormData(prev => ({...prev, secteur: val}))}
                    selectedCompetences={formData.competences}
                    setSelectedCompetences={(val) => setFormData(prev => ({...prev, competences: val}))}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Années d'expérience"
                      name="experience"
                      type="number"
                      value={formData.experience}
                      onChange={handleChange}
                      placeholder="Ex: 5"
                    />
                    <Input
                      label="Tarif journalier (€)"
                      name="tarif_journalier"
                      type="number"
                      value={formData.tarif_journalier}
                      onChange={handleChange}
                      placeholder="Ex: 450"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Disponibilité</label>
                    <select
                      name="disponibilite"
                      value={formData.disponibilite}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Sélectionnez...</option>
                      <option value="immediat">Immédiatement</option>
                      <option value="1-2-semaines">Dans 1-2 semaines</option>
                      <option value="1-mois">Dans 1 mois</option>
                      <option value="non-disponible">Non disponible</option>
                    </select>
                  </div>

                  <Input
                    label="Portfolio / Site web"
                    name="portfolio_url"
                    type="url"
                    value={formData.portfolio_url}
                    onChange={handleChange}
                    placeholder="https://www.votre-portfolio.com"
                    icon={Globe}
                  />
                </div>
              </div>
            </>
          )}

          {/* Formulaire Recruteur */}
          {selectedRole === 'employer' && (
            <>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations recruteur</h3>
                <div className="space-y-4">
                  <Input
                    label="Dénomination *"
                    name="denomination"
                    value={formData.denomination}
                    onChange={handleChange}
                    required
                    placeholder="Nom de le recruteur"
                    icon={Building2}
                  />

                  <Input
                    label="Numéro BCE"
                    name="numero_bce"
                    value={formData.numero_bce}
                    onChange={handleChange}
                    placeholder="0123.456.789"
                    icon={Building2}
                  />

                  <Input
                    label="Adresse"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleChange}
                    icon={MapPin}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                      <select
                        value={formData.pays_code}
                        onChange={handlePaysChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {pays.map(p => (
                          <option key={p.code} value={p.code}>{p.nom}</option>
                        ))}
                      </select>
                    </div>
                    <Input
                      label="Indicatif"
                      name="indicatif"
                      value={formData.indicatif}
                      disabled
                      icon={Phone}
                    />
                    <Input
                      label="Téléphone"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      icon={Phone}
                    />
                  </div>

                  <SecteurCompetenceSelector
                    selectedSecteur={formData.secteur}
                    setSelectedSecteur={(val) => setFormData(prev => ({...prev, secteur: val}))}
                    selectedCompetences={formData.competences_recherchees}
                    setSelectedCompetences={(val) => setFormData(prev => ({...prev, competences_recherchees: val}))}
                    competencesLabel="Compétences recherchées"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Taille de le recruteur</label>
                    <select
                      name="taille_recruteur"
                      value={formData.taille_recruteur}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Sélectionnez...</option>
                      <option value="1-10">1-10 employés</option>
                      <option value="11-50">11-50 employés</option>
                      <option value="51-200">51-200 employés</option>
                      <option value="201-500">201-500 employés</option>
                      <option value="500+">500+ employés</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description de le recruteur</label>
                    <textarea
                      name="description_recruteur"
                      value={formData.description_recruteur}
                      onChange={handleChange}
                      rows="4"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Décrivez votre recruteur et votre activité..."
                    />
                  </div>

                  <Input
                    label="Site web"
                    name="site_web"
                    type="url"
                    value={formData.site_web}
                    onChange={handleChange}
                    placeholder="https://www.votre-recruteur.com"
                    icon={Globe}
                  />
                </div>
              </div>
            </>
          )}

          {/* Formulaire Admin */}
          {selectedRole === 'admin' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations administrateur</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Prénom *"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                  icon={User}
                />
                <Input
                  label="Nom *"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  icon={User}
                />
              </div>
            </div>
          )}

          {/* Boutons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/users')}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              loading={loading}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Créer l'utilisateur
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default AdminCreateUser

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Mail, Lock, User, Building2, Phone, MapPin, Briefcase, Globe, FileText } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import MultiSelect from '../components/MultiSelect'
import SecteurCompetenceSelector from '../components/SecteurCompetenceSelector'
import { pays } from '../data/secteurs'
import toast from 'react-hot-toast'
import axios from 'axios'

const AdminCreateUser = () => {
  const { user: currentUser } = useAuth()
  
  let allowedRoles = ['freelancer', 'employer'];
  if (currentUser?.email !== 'noreply@indebel.be' && currentUser?.admin_permissions) {
    try {
      const perms = typeof currentUser.admin_permissions === 'string' ? JSON.parse(currentUser.admin_permissions) : currentUser.admin_permissions;
      allowedRoles = perms.roles || [];
    } catch(e) {}
  }

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
    description_entreprise: '',
    site_web: '',
    taille_entreprise: '',
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
    const selectedPays = pays.find(p => p.value === e.target.value)
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
      return toast.error('Nom et prénom requis pour indépendant')
    }

    if (selectedRole === 'employer' && !formData.denomination) {
      return toast.error('Dénomination requise pour entreprise')
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
          description_entreprise: formData.description_entreprise,
          site_web: formData.site_web,
          taille_entreprise: formData.taille_entreprise
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
    <div className="space-y-7 pb-10">
      <section className="rounded-[28px] bg-white border border-slate-100 p-7 text-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <UserPlus className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-primary-600">Administration</p>
          <h1 className="mt-3 text-3xl font-black text-gray-900">Créer un utilisateur</h1>
          <p className="mt-2 max-w-2xl text-slate-500 font-medium">Ajoutez manuellement un nouveau profil à la plateforme. Les identifiants seront créés instantanément.</p>
        </div>
      </section>

      {/* Sélection du rôle */}
      <div className="rounded-[28px] bg-white p-6 sm:p-8 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 mr-3 text-sm">1</span>
          Choisissez le type de compte
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {allowedRoles.includes('freelancer') && (<button
            type="button"
            onClick={() => handleRoleChange('freelancer')}
            className={`group relative p-6 rounded-2xl transition-all duration-200 border-2 text-left ${
              selectedRole === 'freelancer'
                ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-500/10'
                : 'border-slate-100 hover:border-primary-200 hover:bg-slate-50'
            }`}
          >
            <div className={`mb-4 inline-flex rounded-xl p-3 ${selectedRole === 'freelancer' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-slate-100 text-slate-500 group-hover:bg-primary-100 group-hover:text-primary-600'}`}>
              <User className="h-6 w-6" />
            </div>
            <h3 className={`font-bold text-lg mb-1 ${selectedRole === 'freelancer' ? 'text-primary-900' : 'text-slate-700'}`}>Prestataire</h3>
            <p className="text-sm font-medium text-slate-500">Freelance ou travailleur indépendant proposant ses services.</p>
            {selectedRole === 'freelancer' && <div className="absolute top-4 right-4 h-3 w-3 rounded-full bg-primary-500 ring-4 ring-primary-100"></div>}
          </button>)}

          {allowedRoles.includes('employer') && (<button
            type="button"
            onClick={() => handleRoleChange('employer')}
            className={`group relative p-6 rounded-2xl transition-all duration-200 border-2 text-left ${
              selectedRole === 'employer'
                ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-500/10'
                : 'border-slate-100 hover:border-primary-200 hover:bg-slate-50'
            }`}
          >
            <div className={`mb-4 inline-flex rounded-xl p-3 ${selectedRole === 'employer' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-slate-100 text-slate-500 group-hover:bg-primary-100 group-hover:text-primary-600'}`}>
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className={`font-bold text-lg mb-1 ${selectedRole === 'employer' ? 'text-primary-900' : 'text-slate-700'}`}>Recruteur</h3>
            <p className="text-sm font-medium text-slate-500">Entreprise ou particulier cherchant à embaucher.</p>
            {selectedRole === 'employer' && <div className="absolute top-4 right-4 h-3 w-3 rounded-full bg-primary-500 ring-4 ring-primary-100"></div>}
          </button>)}

          {currentUser?.email === 'noreply@indebel.be' && (<button
            type="button"
            onClick={() => handleRoleChange('admin')}
            className={`group relative p-6 rounded-2xl transition-all duration-200 border-2 text-left ${
              selectedRole === 'admin'
                ? 'border-red-500 bg-red-50 shadow-md shadow-red-500/10'
                : 'border-slate-100 hover:border-red-200 hover:bg-slate-50'
            }`}
          >
            <div className={`mb-4 inline-flex rounded-xl p-3 ${selectedRole === 'admin' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-slate-100 text-slate-500 group-hover:bg-red-100 group-hover:text-red-600'}`}>
              <UserPlus className="h-6 w-6" />
            </div>
            <h3 className={`font-bold text-lg mb-1 ${selectedRole === 'admin' ? 'text-red-900' : 'text-slate-700'}`}>Administrateur</h3>
            <p className="text-sm font-medium text-slate-500">Membre de l'équipe de gestion Indebel.</p>
            {selectedRole === 'admin' && <div className="absolute top-4 right-4 h-3 w-3 rounded-full bg-red-500 ring-4 ring-red-100"></div>}
          </button>)}
        </div>
      </div>

      {/* Formulaire selon le rôle */}
      <div className="rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* Informations de connexion */}
          <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-700 mr-3 text-sm">2</span>
              Identifiants de connexion
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 ml-0 sm:ml-11">
              <Input
                label="Adresse Email *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                icon={Mail}
                placeholder="email@exemple.com"
              />
              <Input
                label="Mot de passe provisoire *"
                name="mot_de_passe"
                type="text"
                value={formData.mot_de_passe}
                onChange={handleChange}
                required
                icon={Lock}
                placeholder="Ex: Secur1t3P@ss!"
              />
            </div>
          </div>

          {/* Formulaire Indépendant */}
          {selectedRole === 'freelancer' && (
            <div className="p-6 sm:p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 mr-3 text-sm">3</span>
                Profil Prestataire
              </h2>
              
              <div className="ml-0 sm:ml-11 space-y-8">
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Identité</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Pays</label>
                      <select
                        value={formData.pays_code}
                        onChange={handlePaysChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
                      >
                        {pays.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
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
                      placeholder="470 12 34 56"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Détails Professionnels</h3>
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input
                        label="Numéro BCE (Optionnel)"
                        name="numero_bce"
                        value={formData.numero_bce}
                        onChange={handleChange}
                        placeholder="0123.456.789"
                        icon={FileText}
                      />
                      <Input
                        label="Dénomination (Optionnel)"
                        name="denomination"
                        value={formData.denomination}
                        onChange={handleChange}
                        placeholder="Si en société"
                        icon={Building2}
                      />
                    </div>

                    <Input
                      label="Adresse"
                      name="adresse"
                      value={formData.adresse}
                      onChange={handleChange}
                      icon={MapPin}
                      placeholder="Rue, N°, Code Postal, Ville"
                    />

                    <Input
                      label="Poste / Métier principal"
                      name="poste"
                      value={formData.poste}
                      onChange={handleChange}
                      placeholder="Ex: Développeur Full-Stack, Designer UI..."
                      icon={Briefcase}
                    />

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <SecteurCompetenceSelector
                        selectedSecteur={formData.secteur}
                        setSelectedSecteur={(val) => setFormData(prev => ({...prev, secteur: val}))}
                        selectedCompetences={formData.competences}
                        setSelectedCompetences={(val) => setFormData(prev => ({...prev, competences: val}))}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Disponibilité</label>
                        <select
                          name="disponibilite"
                          value={formData.disponibilite}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
                        >
                          <option value="">Sélectionnez...</option>
                          <option value="immediat">Immédiatement</option>
                          <option value="1-2-semaines">Dans 1-2 semaines</option>
                          <option value="1-mois">Dans 1 mois</option>
                          <option value="non-disponible">Non disponible</option>
                        </select>
                      </div>

                      <Input
                        label="Lien Portfolio / Site web"
                        name="portfolio_url"
                        type="url"
                        value={formData.portfolio_url}
                        onChange={handleChange}
                        placeholder="https://..."
                        icon={Globe}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Formulaire Entreprise */}
          {selectedRole === 'employer' && (
            <div className="p-6 sm:p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 mr-3 text-sm">3</span>
                Profil Recruteur
              </h2>
              
              <div className="ml-0 sm:ml-11 space-y-8">
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Informations de la structure</h3>
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input
                        label="Dénomination *"
                        name="denomination"
                        value={formData.denomination}
                        onChange={handleChange}
                        required
                        placeholder="Nom de l'entreprise"
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
                    </div>

                    <Input
                      label="Adresse de l'entreprise"
                      name="adresse"
                      value={formData.adresse}
                      onChange={handleChange}
                      icon={MapPin}
                      placeholder="Rue, N°, Code Postal, Ville"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Pays</label>
                        <select
                          value={formData.pays_code}
                          onChange={handlePaysChange}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
                        >
                          {pays.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
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
                        label="Téléphone entreprise"
                        name="telephone"
                        value={formData.telephone}
                        onChange={handleChange}
                        icon={Phone}
                        placeholder="470 12 34 56"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Activité & Besoins</h3>
                  <div className="space-y-5">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <SecteurCompetenceSelector
                        selectedSecteur={formData.secteur}
                        setSelectedSecteur={(val) => setFormData(prev => ({...prev, secteur: val}))}
                        selectedCompetences={formData.competences_recherchees}
                        setSelectedCompetences={(val) => setFormData(prev => ({...prev, competences_recherchees: val}))}
                        competencesLabel="Compétences recherchées"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Taille de l'entreprise</label>
                        <select
                          name="taille_entreprise"
                          value={formData.taille_entreprise}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
                        >
                          <option value="">Sélectionnez...</option>
                          <option value="1-10">1-10 employés</option>
                          <option value="11-50">11-50 employés</option>
                          <option value="51-200">51-200 employés</option>
                          <option value="201-500">201-500 employés</option>
                          <option value="500+">500+ employés</option>
                        </select>
                      </div>

                      <Input
                        label="Site web"
                        name="site_web"
                        type="url"
                        value={formData.site_web}
                        onChange={handleChange}
                        placeholder="https://www.votre-entreprise.com"
                        icon={Globe}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Description de l'entreprise</label>
                      <textarea
                        name="description_entreprise"
                        value={formData.description_entreprise}
                        onChange={handleChange}
                        rows="4"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
                        placeholder="Décrivez votre entreprise et votre activité..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Formulaire Admin */}
          {selectedRole === 'admin' && (
            <div className="p-6 sm:p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-700 mr-3 text-sm">3</span>
                Profil Administrateur
              </h2>
              <div className="ml-0 sm:ml-11 grid grid-cols-1 md:grid-cols-2 gap-5">
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
          <div className="p-6 sm:p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-[28px]">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/users')}
              className="px-6"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="px-8"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Créer le profil
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminCreateUser

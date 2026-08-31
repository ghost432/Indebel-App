import { useState, useEffect, useRef } from 'react'
import { User, Mail, Briefcase, Calendar, Camera, Building2, Globe, Users as UsersIcon, FileText, Languages, AlertTriangle, Coins } from 'lucide-react'
import { Facebook, Instagram, X } from 'lucide-react'
import VerificationBadge from '../components/VerificationBadge'
import { useAuth } from '../context/AuthContext'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Badge from '../components/Badge'
import SecteurCompetenceSelector from '../components/SecteurCompetenceSelector'
import MultiSelectDropdown from '../components/MultiSelectDropdown'
import Modal from '../components/Modal'
import { userService } from '../services/userService'
import { languageService } from '../services/languageService'
import { profileService } from '../services/profileService'
import toast from 'react-hot-toast'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const Profile = () => {
  const { user, checkAuth } = useAuth()
  const [editingPro, setEditingPro] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profileImage, setProfileImage] = useState(null)
  const [coverImage, setCoverImage] = useState(null)
  const fileInputRef = useRef(null)
  const coverInputRef = useRef(null)

  const [bceModalOpen, setBceModalOpen] = useState(false)
  const [bceToVerify, setBceToVerify] = useState(user?.numero_bce || '')
  const [bceVerifying, setBceVerifying] = useState(false)

  const handleBceVerificationSubmit = async () => {
    if (bceToVerify.length !== 10) {
      toast.error('Le numéro BCE doit contenir exactement 10 chiffres')
      return
    }

    try {
      setBceVerifying(true)
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `${API_BASE_URL}/users/verify-and-update-bce`,
        { bceNumber: bceToVerify },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.data?.success) {
        toast.success('Votre numéro BCE a été vérifié et enregistré avec succès !')
        setBceModalOpen(false)
        await checkAuth()
        if ((response.data?.data || response.data)) {
          setProFormData(prev => ({
            ...prev,
            numero_bce: (response.data?.data || response.data).numero_bce,
            denomination: (response.data?.data || response.data).denomination,
            adresse: (response.data?.data || response.data).adresse
          }))
        }
      } else {
        toast.error(response.data?.message || 'Erreur lors de la vérification')
      }
    } catch (error) {
      console.error('Erreur lors de la verification BCE:', error)
      toast.error(error.response?.data?.message || 'Erreur lors de la vérification du numéro BCE')
    } finally {
      setBceVerifying(false)
    }
  }
  
  const [proFormData, setProFormData] = useState({
    // Employer
    numero_bce: user?.numero_bce || '',
    denomination: user?.denomination || '',
    adresse: user?.adresse || '',
    secteur: user?.secteur || '',
    competences_recherchees: user?.competences_recherchees || [],
    description_entreprise: user?.description_entreprise || '',
    site_web: user?.site_web || '',
    taille_entreprise: user?.taille_entreprise || '',
    telephone: user?.telephone || '',
    email_contact: user?.email_contact || user?.email || '',
    annee_creation: user?.annee_creation || '',
    reseaux_sociaux: {
      linkedin: user?.linkedin || '',
      twitter: user?.twitter || '',
      facebook: user?.facebook || '',
      instagram: user?.instagram || ''
    },
    // Freelancer (non utilisé pour employeur)
    poste: user?.poste || '',
    competences: user?.competences || [],
    experience: user?.experience || '',
    tarif_journalier: user?.tarif_journalier || '',
    portfolio_url: user?.portfolio_url || '',
    a_propos: user?.a_propos || '',
    genre: user?.genre || 'non_specifie',
    tranche_age: user?.tranche_age || '',
    langues_parlees: languageService.parseLanguages(user?.langues_parlees)
  })

  useEffect(() => {
    document.title = `${profileService.getDisplayName(user, user?.role)} - Profil - Indebel`
    // Charger les images via le service centralisé
    if (user?.id) {
      const image = profileService.getProfileImage(user)
      if (image) {
        setProfileImage(image)
      }
      const cover = profileService.getCoverImage(user)
      if (cover) {
        setCoverImage(cover)
      }
    }
  }, [user?.id])

  const handleProChange = (e) => {
    setProFormData({ ...proFormData, [e.target.name]: e.target.value })
  }

  const handleProSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Préparer les données à envoyer
      const formData = { ...proFormData }
      
      // Fonction pour formater les URLs de manière plus permissive
      const formatUrl = (url) => {
        if (!url || typeof url !== 'string') return url;
        
        let formattedUrl = url.trim();
        
        // Supprimer les espaces et les barres obliques en fin d'URL
        formattedUrl = formattedUrl.replace(/\s+$/, '').replace(/\/+$/, '');
        
        // Si vide après nettoyage, retourner null
        if (!formattedUrl) return null;
        
        // Ajouter https:// si manquant et que ce n'est pas une URL relative
        if (!/^https?:\/\//i.test(formattedUrl) && !formattedUrl.startsWith('/')) {
          // Vérifier si c'est une adresse IP locale ou localhost
          if (!/^(localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/.test(formattedUrl)) {
            formattedUrl = 'https://' + formattedUrl;
          } else {
            formattedUrl = 'http://' + formattedUrl;
          }
        }
        
        return formattedUrl;
      };
      
      // Traiter l'URL du site web
      if (formData.site_web) {
        formData.site_web = formatUrl(formData.site_web);
      }
      
      // Traiter l'URL du portfolio
      if (formData.portfolio_url) {
        formData.portfolio_url = formatUrl(formData.portfolio_url);
      }
      
      // Préparer les données pour l'envoi
      const dataToSend = { ...formData }
      
      // Convertir les tableaux en JSON pour l'envoi
      if (Array.isArray(dataToSend.langues_parlees) && dataToSend.langues_parlees.length > 0) {
        dataToSend.langues_parlees = JSON.stringify(dataToSend.langues_parlees)
      } else {
        dataToSend.langues_parlees = null
      }
      
      if (Array.isArray(dataToSend.competences_recherchees) && dataToSend.competences_recherchees.length > 0) {
        dataToSend.competences_recherchees = JSON.stringify(dataToSend.competences_recherchees)
      } else {
        dataToSend.competences_recherchees = null
      }
      
      if (Array.isArray(dataToSend.competences) && dataToSend.competences.length > 0) {
        dataToSend.competences = JSON.stringify(dataToSend.competences)
      } else {
        dataToSend.competences = null
      }
      
      console.log('Data to send:', dataToSend)
      
      // Convertir les valeurs numériques (null si vide)
      if (dataToSend.tarif_journalier && dataToSend.tarif_journalier !== '') {
        dataToSend.tarif_journalier = parseFloat(dataToSend.tarif_journalier)
      } else {
        dataToSend.tarif_journalier = null
      }
      
      if (dataToSend.experience && dataToSend.experience !== '') {
        dataToSend.experience = parseInt(dataToSend.experience, 10)
      } else {
        dataToSend.experience = null
      }
      
      if (dataToSend.annee_creation && dataToSend.annee_creation !== '') {
        dataToSend.annee_creation = parseInt(dataToSend.annee_creation, 10)
      } else {
        dataToSend.annee_creation = null
      }
      
      // Convertir les chaînes vides en null pour les champs optionnels
      const optionalFields = [
        'email_contact', 
        'site_web', 
        'description_entreprise', 
        'taille_entreprise', 
        'portfolio_url', 
        'a_propos',
        'tranche_age'
      ]
      optionalFields.forEach(field => {
        if (dataToSend[field] === '') {
          dataToSend[field] = null
        }
      })
      
      const response = await userService.updateUser(user.id, dataToSend)
      
      if (response && response.data) {
        if (response.data.success) {
          toast.success('Informations professionnelles mises à jour avec succès')
          await checkAuth()
          setEditingPro(false)
        } else if (response.data.errors) {
          // Afficher les erreurs de validation
          response.data.errors.forEach(error => {
            toast.error(error);
          });
          throw new Error('Veuillez corriger les erreurs dans le formulaire');
        } else {
          throw new Error(response.data.message || 'Erreur lors de la mise à jour');
        }
      } else {
        throw new Error('Réponse inattendue du serveur');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      
      // Vérifier si c'est une erreur de validation
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          toast.error(err);
        });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(error.message || 'Une erreur est survenue lors de la mise à jour');
      }
    } finally {
      setLoading(false);
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 5MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = async () => {
        const imageData = reader.result
        setProfileImage(imageData)
        // Sauvegarder via le service centralisé
        const dataToSend = profileService.saveProfileImage(imageData, user?.id)
        // Synchroniser avec le backend
        try {
          await userService.updateUser(user.id, dataToSend)
          toast.success('Photo de profil enregistrée avec succès!')
          checkAuth()
        } catch (error) {
          toast.error('Erreur lors de la sauvegarde')
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCoverChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 5MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = async () => {
        const imageData = reader.result
        setCoverImage(imageData)
        // Sauvegarder via le service centralisé
        const dataToSend = profileService.saveCoverImage(imageData, user?.id)
        // Synchroniser avec le backend
        try {
          await userService.updateUser(user.id, dataToSend)
          toast.success('Image de couverture enregistrée avec succès!')
          checkAuth()
        } catch (error) {
          toast.error('Erreur lors de la sauvegarde')
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrateur',
      employer: 'Recruteur',
      freelancer: 'Prestataire'
    }
    return labels[role] || role
  }

  const getRoleBadge = (role) => {
    const variants = {
      admin: 'primary',
      employer: 'info',
      freelancer: 'success'
    }
    return <Badge variant={variants[role]}>{getRoleLabel(role)}</Badge>
  }

  const formatDate = (dateString) => {
    if (!dateString) {
      // Utiliser la date actuelle si pas de date d'inscription
      const today = new Date()
      return today.toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        // Si date invalide, utiliser la date actuelle
        const today = new Date()
        return today.toLocaleDateString('fr-FR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      }
      return date.toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    } catch (error) {
      const today = new Date()
      return today.toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
  }

  return (
    <div className="container-custom py-8">
      {/* Image de couverture */}
      <div className="relative mb-6 overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-sm">
        <div className="relative h-40 max-h-64 overflow-hidden bg-gradient-to-br from-[#082151] via-[#12336f] to-[#c02525] sm:h-48 md:h-64">
          {coverImage ? (
            <img src={coverImage} alt="Couverture" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white/80">
                <Camera className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm">Ajoutez une image de couverture</p>
              </div>
            </div>
          )}
          <button
            onClick={() => coverInputRef.current?.click()}
            className="absolute bottom-3 right-3 max-w-[calc(100%-1.5rem)] rounded-xl bg-white px-3 py-2 shadow-lg transition-colors hover:bg-gray-100 sm:bottom-4 sm:right-4 sm:px-4 flex items-center space-x-2"
            title="Changer l'image de couverture"
          >
            <Camera className="h-4 w-4 text-primary-600" />
            <span className="text-sm font-medium text-gray-700">Modifier la couverture</span>
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            className="hidden"
          />
        </div>
      </div>

      

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-6 relative overflow-visible">
            <div className="text-center -mt-20">
              <div className="relative inline-block">
                <div className="h-32 w-32 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4 overflow-hidden">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2b4eef] to-[#df6422] text-white font-bold text-sm">
                      {profileService.getInitials(user, user?.role)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 right-1/2 translate-x-1/2 translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors border-2 border-primary-600"
                  title="Changer la photo de profil"
                >
                  <Camera className="h-4 w-4 text-primary-600" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              <div className="flex flex-col items-center space-y-2 mb-2">
                <div className="text-center mt-2">
                  <h2 className="text-2xl font-bold text-slate-900 mt-2">
                    {profileService.getDisplayName(user, user?.role)}
                  </h2>
                  <div className="flex items-center justify-center mt-1 space-x-1">
                    <VerificationBadge 
                      status={user?.statut_verification || 'non_verifie'} 
                      premium={user?.forfait_badge_premium}
                      size="sm"
                      showText={true}
                      className="text-xs"
                    />
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 shadow-sm flex items-center gap-1.5 mt-1">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  Solde : {user?.solde_credits || 0} Crédits
                </span>
              </div>
              <div className="flex justify-center mb-4">
                {getRoleBadge(user?.role)}
              </div>
              <p className="text-gray-600 text-sm">{user?.email}</p>
            </div>
          </div>

          {/* Stats Card */}
          <div className="mt-6 bg-white rounded-[24px] shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Informations du compte</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span>Membre depuis {formatDate(user?.date_creation)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-2 text-gray-400" />
                <span>{getRoleLabel(user?.role)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                <span>Email vérifié</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-6 relative overflow-visible">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Informations personnelles</h3>
            </div>

            <div className="text-center py-8">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Gérez vos informations personnelles, votre mot de passe et vos préférences dans les paramètres.
              </p>
              <Button 
                onClick={() => window.location.href = user?.role === 'employer' ? '/employer/settings' : '/freelancer/settings'}
                className="mx-auto"
              >
                Accéder aux paramètres
              </Button>
            </div>
          </div>

          {/* Banner Vérification BCE */}
          {user?.numero_bce && !user?.bce_verifie && (
            <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-[24px] p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-[#082151] text-base">Numéro BCE non vérifié</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Votre numéro d'entreprise BCE (<strong>{user.numero_bce}</strong>) n'a pas encore été vérifié officiellement. 
                    Veuillez procéder à la vérification pour valider votre compte.
                  </p>
                </div>
              </div>
              <Button
                variant="warning"
                onClick={() => {
                  setBceToVerify(user.numero_bce || '');
                  setBceModalOpen(true);
                }}
                className="font-bold sm:flex-shrink-0"
              >
                Vérifier maintenant
              </Button>
            </div>
          )}

          {/* Section Professionnelle - Employer uniquement */}
          {user?.role === 'employer' && (
            <div className="mt-6 bg-white rounded-[24px] shadow-sm border border-slate-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Informations Professionnelles</h3>
                {!editingPro ? (
                  <Button onClick={() => setEditingPro(true)} variant="outline">
                    Modifier
                  </Button>
                ) : (
                  <div className="space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setEditingPro(false);
                        // Réinitialiser les données du formulaire
                        setProFormData({
                          ...proFormData,
                          numero_bce: user?.numero_bce || '',
                          denomination: user?.denomination || '',
                          adresse: user?.adresse || '',
                          secteur: user?.secteur || '',
                          description_entreprise: user?.description_entreprise || '',
                          site_web: user?.site_web || '',
                          taille_entreprise: user?.taille_entreprise || ''
                        });
                      }}
                    >
                      Annuler
                    </Button>
                    <Button type="submit" loading={loading}>
                      Enregistrer
                    </Button>
                  </div>
                )}
              </div>
              
              {editingPro ? (
              <form onSubmit={handleProSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro BCE <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="numero_bce"
                      value={proFormData.numero_bce}
                      onChange={handleProChange}
                      placeholder="0123.456.789"
                      readOnly
                      className="bg-gray-50 cursor-not-allowed"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Le numéro d'entreprise (BCE) de votre société (non modifiable)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dénomination sociale <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="denomination"
                      value={proFormData.denomination}
                      onChange={handleProChange}
                      placeholder="Nom de l'entreprise"
                      readOnly
                      className="bg-gray-50 cursor-not-allowed"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Dénomination sociale (non modifiable)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse complète <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={proFormData.adresse}
                      placeholder="Rue, numéro, code postal, ville"
                      readOnly
                      className="bg-gray-50 cursor-not-allowed"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Adresse (non modifiable)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="telephone"
                      value={proFormData.telephone}
                      onChange={handleProChange}
                      placeholder="+32 123 45 67 89"
                      readOnly
                      className="bg-gray-50 cursor-not-allowed"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Téléphone (non modifiable)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email de contact <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      name="email_contact"
                      value={proFormData.email_contact}
                      onChange={handleProChange}
                      placeholder="contact@votre-entreprise.com"
                      disabled={!editingPro}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Année de création
                    </label>
                    <Input
                      type="number"
                      name="annee_creation"
                      value={proFormData.annee_creation}
                      onChange={handleProChange}
                      placeholder="Année de création (ex: 2010)"
                      min="1900"
                      max={new Date().getFullYear()}
                      disabled={!editingPro}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <SecteurCompetenceSelector
                      selectedSecteur={proFormData.secteur}
                      setSelectedSecteur={(val) => setProFormData(prev => ({...prev, secteur: val}))}
                      selectedCompetences={proFormData.competences_recherchees}
                      setSelectedCompetences={(val) => setProFormData(prev => ({...prev, competences_recherchees: val}))}
                      competencesLabel="Quelles sont les compétences que vous recherchez ?"
                      disabled={!editingPro}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description de l'entreprise <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description_entreprise"
                      value={proFormData.description_entreprise}
                      onChange={handleProChange}
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                      placeholder="Décrivez votre entreprise, ses activités, ses valeurs..."
                      disabled={!editingPro}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site web
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        https://
                      </span>
                      <Input
                        type="text"
                        name="site_web"
                        value={proFormData.site_web?.replace(/^https?:\/\//,  '')}
                        onChange={(e) => {
                          handleProChange({
                            target: {
                              name: 'site_web',
                              value: e.target.value
                            }
                          });
                        }}
                        placeholder="votre-entreprise.com"
                        disabled={!editingPro}
                        className="rounded-l-none"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Réseaux sociaux</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 flex items-center justify-center bg-[#0077B5] text-white rounded-l-md">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </div>
                        <Input
                          type="text"
                          name="linkedin"
                          value={proFormData.reseaux_sociaux?.linkedin || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^a-zA-Z0-9-]/g, '');
                            setProFormData(prev => ({
                              ...prev,
                              reseaux_sociaux: {
                                ...prev.reseaux_sociaux,
                                linkedin: value
                              }
                            }));
                          }}
                          placeholder="votrelinkedin"
                          disabled={!editingPro}
                          className="rounded-l-none"
                        />
                      </div>

                      <div className="flex items-center">
                        <div className="w-10 h-10 flex items-center justify-center bg-[#1DA1F2] text-white rounded-l-md">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                          </svg>
                        </div>
                        <Input
                          type="text"
                          name="twitter"
                          value={proFormData.reseaux_sociaux?.twitter || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                            setProFormData(prev => ({
                              ...prev,
                              reseaux_sociaux: {
                                ...prev.reseaux_sociaux,
                                twitter: value
                              }
                            }));
                          }}
                          placeholder="votrepseudo"
                          disabled={!editingPro}
                          className="rounded-l-none"
                        />
                      </div>

                      <div className="flex items-center">
                        <div className="w-10 h-10 flex items-center justify-center bg-[#4267B2] text-white rounded-l-md">
                          <Facebook size={16} />
                        </div>
                        <Input
                          type="text"
                          name="facebook"
                          value={proFormData.reseaux_sociaux?.facebook || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^a-zA-Z0-9-]/g, '');
                            setProFormData(prev => ({
                              ...prev,
                              reseaux_sociaux: {
                                ...prev.reseaux_sociaux,
                                facebook: value
                              }
                            }));
                          }}
                          placeholder="votrepseudo"
                          disabled={!editingPro}
                          className="rounded-l-none"
                        />
                      </div>

                      <div className="flex items-center">
                        <div className="w-10 h-10 flex items-center justify-center bg-[#FF69B4] text-white rounded-l-md">
                          <Instagram size={16} />
                        </div>
                        <Input
                          type="text"
                          name="instagram"
                          value={proFormData.reseaux_sociaux?.instagram || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^a-zA-Z0-9-]/g, '');
                            setProFormData(prev => ({
                              ...prev,
                              reseaux_sociaux: {
                                ...prev.reseaux_sociaux,
                                instagram: value
                              }
                            }));
                          }}
                          placeholder="votrepseudo"
                          disabled={!editingPro}
                          className="rounded-l-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <MultiSelectDropdown
                      label="Langues parlées dans l'entreprise"
                      options={languageService.getAvailableLanguages()}
                      value={proFormData.langues_parlees || []}
                      onChange={(selected) => setProFormData(prev => ({...prev, langues_parlees: selected}))}
                      placeholder="Sélectionnez les langues..."
                      disabled={!editingPro}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taille de l'entreprise
                    </label>
                    <select
                      name="taille_entreprise"
                      value={proFormData.taille_entreprise}
                      onChange={handleProChange}
                      className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={!editingPro}
                    >
                      <option value="">Sélectionnez...</option>
                      <option value="1-10">1-10 employés</option>
                      <option value="11-50">11-50 employés</option>
                      <option value="51-200">51-200 employés</option>
                      <option value="201-500">201-500 employés</option>
                      <option value="500+">500+ employés</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      <strong>Logo :</strong> L'image de profil que vous avez définie sera utilisée comme logo de votre entreprise.
                    </p>
                  </div>

                  <div className="md:col-span-2 flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setEditingPro(false)
                        setProFormData({
                          numero_bce: user?.numero_bce || '',
                          denomination: user?.denomination || '',
                          adresse: user?.adresse || '',
                          secteur: user?.secteur || '',
                          competences_recherchees: user?.competences_recherchees || [],
                          description_entreprise: user?.description_entreprise || '',
                          site_web: user?.site_web || '',
                          taille_entreprise: user?.taille_entreprise || '',
                          telephone: user?.telephone || '',
                          email_contact: user?.email_contact || user?.email || '',
                          annee_creation: user?.annee_creation || '',
                          reseaux_sociaux: {
                            linkedin: user?.linkedin || '',
                            twitter: user?.twitter || '',
                            facebook: user?.facebook || '',
                            instagram: user?.instagram || ''
                          },
                          poste: user?.poste || '',
                          competences: user?.competences || [],
                          experience: user?.experience || '',
                          tarif_journalier: user?.tarif_journalier || '',
                          portfolio_url: user?.portfolio_url || '',
                          a_propos: user?.a_propos || '',
                          genre: user?.genre || 'non_specifie',
                          tranche_age: user?.tranche_age || '',
                          langues_parlees: languageService.parseLanguages(user?.langues_parlees)
                        })
                      }}
                    >
                      Annuler
                    </Button>
                    <Button type="submit" loading={loading}>
                      Enregistrer
                    </Button>
                  </div>
                </div>
              </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
                      <Building2 className="h-4 w-4 mr-2" />
                      Numéro BCE
                    </label>
                    <p className="text-gray-900">{user?.numero_bce || 'Non renseigné'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
                      <Building2 className="h-4 w-4 mr-2" />
                      Adresse
                    </label>
                    <p className="text-gray-900">{user?.adresse || 'Non renseignée'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Secteur d'activité
                    </label>
                    <p className="text-gray-900">{user?.secteur || 'Non renseigné'}</p>
                  </div>

                  {user?.description_entreprise && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
                        <FileText className="h-4 w-4 mr-2" />
                        Au sujet de l'entreprise
                      </label>
                      <p className="text-gray-900">{user?.description_entreprise}</p>
                    </div>
                  )}

                  {user?.site_web && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
                        <Globe className="h-4 w-4 mr-2" />
                        Site web
                      </label>
                      <a href={user?.site_web} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                        {user?.site_web}
                      </a>
                    </div>
                  )}

                  {user?.taille_entreprise && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
                        <UsersIcon className="h-4 w-4 mr-2" />
                        Taille de l'entreprise
                      </label>
                      <p className="text-gray-900">{user?.taille_entreprise} employés</p>
                    </div>
                  )}

                  {user?.annee_creation && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
                        <Calendar className="h-4 w-4 mr-2" />
                        Année de création
                      </label>
                      <p className="text-gray-900">{user?.annee_creation}</p>
                    </div>
                  )}

                  {user?.langues_parlees && languageService.parseLanguages(user.langues_parlees).length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
                        <Languages className="h-4 w-4 mr-2" />
                        Langues parlées
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const langues = languageService.parseLanguages(user.langues_parlees);
                          return Array.isArray(langues) ? langues.map((langue, index) => (
                            <span key={index} className="px-4 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold border border-slate-200 shadow-sm capitalize">
                              {langue}
                            </span>
                          )) : null;
                        })()}
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
                    {profileImage && (
                      <img src={profileImage} alt="Logo" className="h-16 w-16 rounded-lg object-cover border-2 border-white shadow" />
                    )}
                    <div>
                      <p className="text-sm text-blue-900">
                        <strong>Logo :</strong> L'image de profil que vous avez définie sera utilisée comme logo de votre entreprise.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => {
                        const slug = user?.denomination 
                          ? user.denomination.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                          : user?.id;
                        const prefix = user?.role === 'employer' ? '/employer' : '/freelancer';
                        window.open(`${prefix}/profile/${slug}`, '_blank');
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Voir mon profil public
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section Professionnelle - Freelancer uniquement */}
          {user?.role === 'freelancer' && (
            <div className="mt-6 bg-white rounded-[24px] shadow-sm border border-slate-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Informations Professionnelles</h3>
                {!editingPro ? (
                  <Button onClick={() => setEditingPro(true)} variant="outline">
                    Modifier
                  </Button>
                ) : (
                  <div className="space-x-2">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => {
                        setEditingPro(false);
                        // Réinitialiser le formulaire si nécessaire
                      }}
                    >
                      Annuler
                    </Button>
                    <Button type="submit" form="freelancerForm" loading={loading}>
                      Enregistrer
                    </Button>
                  </div>
                )}
              </div>
              
              {editingPro ? (
                <form id="freelancerForm" onSubmit={handleProSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Numéro BCE"
                      name="numero_bce"
                      value={proFormData.numero_bce}
                      onChange={handleProChange}
                      required
                      icon={Building2}
                      disabled
                      readOnly
                    />

                    <Input
                      label="Dénomination"
                      name="denomination"
                      value={proFormData.denomination}
                      onChange={handleProChange}
                      placeholder="Nom de votre entreprise"
                      icon={Building2}
                      disabled
                      readOnly
                    />

                    <Input
                      label="Adresse"
                      name="adresse"
                      value={proFormData.adresse}
                      onChange={handleProChange}
                      placeholder="Rue, ville, code postal"
                      icon={Building2}
                      disabled
                      readOnly
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-900">
                      ℹ️ Les champs BCE, Dénomination et Adresse sont gérés par l'administrateur
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      À propos de vous
                    </label>
                    <textarea
                      name="a_propos"
                      value={proFormData.a_propos}
                      onChange={handleProChange}
                      className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                      rows="4"
                      placeholder="Décrivez-vous en quelques mots..."
                    />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Genre
                      </label>
                      <select
                        name="genre"
                        value={proFormData.genre}
                        onChange={handleProChange}
                        className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                      >
                        <option value="non_specifie">Non spécifié</option>
                        <option value="homme">Homme</option>
                        <option value="femme">Femme</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tranche d'âge
                      </label>
                      <select
                        name="tranche_age"
                        value={proFormData.tranche_age}
                        onChange={handleProChange}
                        className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                      >
                        <option value="">Sélectionnez...</option>
                        <option value="18-25">18-25 ans</option>
                        <option value="26-35">26-35 ans</option>
                        <option value="36-45">36-45 ans</option>
                        <option value="46-55">46-55 ans</option>
                        <option value="56+">56 ans et plus</option>
                      </select>
                    </div>

                  <SecteurCompetenceSelector
                  selectedSecteur={proFormData.secteur}
                  setSelectedSecteur={(val) => setProFormData(prev => ({...prev, secteur: val}))}
                  selectedCompetences={proFormData.competences}
                  setSelectedCompetences={(val) => setProFormData(prev => ({...prev, competences: val}))}
                  competencesLabel="Quelles sont vos compétences ?"
                />

                  <div>
                    <Input
                      label="Années d'expérience"
                      name="experience"
                      type="number"
                      value={proFormData.experience}
                      onChange={handleProChange}
                      placeholder="Ex: 5"
                      icon={Calendar}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Languages className="h-4 w-4 inline mr-2" />
                      Langues parlées
                    </label>
                    <select
                      multiple
                      value={Array.isArray(proFormData.langues_parlees) ? proFormData.langues_parlees : []}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setProFormData(prev => ({...prev, langues_parlees: selected}));
                      }}
                      className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                      size="5"
                    >
                      <option value="Français">Français</option>
                      <option value="Néerlandais">Néerlandais</option>
                      <option value="Anglais">Anglais</option>
                      <option value="Allemand">Allemand</option>
                      <option value="Espagnol">Espagnol</option>
                      <option value="Italien">Italien</option>
                      <option value="Portugais">Portugais</option>
                      <option value="Arabe">Arabe</option>
                      <option value="Russe">Russe</option>
                      <option value="Chinois">Chinois</option>
                      <option value="Autre">Autre</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Maintenez Ctrl (ou Cmd sur Mac) pour sélectionner plusieurs langues</p>
                  </div>



                  <div className="space-y-2">
                    <Input
                      label="Portfolio / Site web"
                      name="portfolio_url"
                      type="text"
                      value={proFormData.portfolio_url?.replace(/^https?:\/\//, '')}
                      onChange={(e) => {
                        handleProChange({
                          target: {
                            name: 'portfolio_url',
                            value: e.target.value
                          }
                        });
                      }}
                      placeholder="votre-portfolio.com"
                      icon={Globe}
                    />
                    <p className="text-xs text-gray-500">Exemple: exemple.com ou www.exemple.com</p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-900">
                      <strong>Photo de profil :</strong> L'image que vous avez définie sera visible sur votre profil public.
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setEditingPro(false)
                        setProFormData({
                          ...proFormData,
                          poste: user?.poste || '',
                          numero_bce: user?.numero_bce || '',
                          denomination: user?.denomination || '',
                          adresse: user?.adresse || '',
                          a_propos: user?.a_propos || '',
                          genre: user?.genre || 'non_specifie',
                          tranche_age: user?.tranche_age || '',
                          competences: user?.competences || '',
                          langues_parlees: user?.langues_parlees || [],
                          experience: user?.experience || '',
                          disponibilite_debut: user?.disponibilite_debut || '',
                          disponibilite_fin: user?.disponibilite_fin || '',
                          portfolio_url: user?.portfolio_url || ''
                        })
                      }}
                    >
                      Annuler
                    </Button>
                    <Button type="submit" loading={loading}>
                      Enregistrer
                    </Button>
                  </div>
                </form>
              ) : (
            <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {user?.numero_bce && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
                          <Building2 className="h-4 w-4 mr-2" />
                          Numéro BCE
                        </label>
                        <p className="text-gray-900">{user.numero_bce}</p>
                      </div>
                    )}
                    {user?.denomination && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
                          <Building2 className="h-4 w-4 mr-2" />
                          Dénomination
                        </label>
                        <p className="text-gray-900">{user.denomination}</p>
                      </div>
                    )}
                    {user?.adresse && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
                          <Building2 className="h-4 w-4 mr-2" />
                          Adresse
                        </label>
                        <p className="text-gray-900">{user.adresse}</p>
                      </div>
                    )}
                  </div>

                  {user?.a_propos && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
                        <FileText className="h-4 w-4 mr-2" />
                        À propos de moi
                      </label>
                      <p className="text-gray-900">{user.a_propos}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user?.genre && user.genre !== 'non_specifie' && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
                          <User className="h-4 w-4 mr-2" />
                          Genre
                        </label>
                        <p className="text-gray-900 capitalize">{user.genre}</p>
                      </div>
                    )}
                    {user?.tranche_age && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
                          <Calendar className="h-4 w-4 mr-2" />
                          Âge
                        </label>
                        <p className="text-gray-900">{user.tranche_age} ans</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Secteur d'activité
                    </label>
                    <p className="text-gray-900">{user?.secteur || 'Non renseigné'}</p>
                  </div>

                  {user?.competences && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
                        <FileText className="h-4 w-4 mr-2" />
                        Compétences principales
                      </label>
                      <ul className="list-disc pl-5 text-gray-900 space-y-1">
                        {(() => {
                          if (Array.isArray(user.competences)) {
                            return user.competences.map((competence, index) => (
                              <li key={index} className="text-gray-900">{competence}</li>
                            ));
                          } else if (typeof user.competences === 'string') {
                            return user.competences.split(',').map((competence, index) => (
                              <li key={index} className="text-gray-900">{competence.trim()}</li>
                            ));
                          }
                          return null;
                        })()}
                      </ul>
                    </div>
                  )}

                  {user?.experience && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
                        <Calendar className="h-4 w-4 mr-2" />
                        Expérience
                      </label>
                      <p className="text-gray-900">{user?.experience} ans</p>
                    </div>
                  )}

                  {user?.langues_parlees && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
                        <Languages className="h-4 w-4 mr-2" />
                        Langues parlées
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          try {
                            const langues = Array.isArray(user.langues_parlees) 
                              ? user.langues_parlees 
                              : (typeof user.langues_parlees === 'string' ? JSON.parse(user.langues_parlees) : []);
                            return Array.isArray(langues) ? langues.map((langue, index) => (
                              <span key={index} className="px-4 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold border border-slate-200 shadow-sm">
                                {langue}
                              </span>
                            )) : null;
                          } catch { return null; }
                        })()}
                      </div>
                    </div>
                  )}



                  {user?.portfolio_url && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
                        <Globe className="h-4 w-4 mr-2" />
                        Portfolio
                      </label>
                      <a href={user?.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                        {user?.portfolio_url}
                      </a>
                    </div>
                  )}

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
                    {profileImage && (
                      <img src={profileImage} alt="Photo" className="h-16 w-16 rounded-lg object-cover border-2 border-white shadow" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-green-900">Photo de profil</p>
                      <p className="text-xs text-green-700">Visible sur votre profil public</p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => {
                        const slug = user?.nom && user?.prenom
                          ? `${user.prenom}-${user.nom}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                          : user?.id;
                        window.open(`/freelancer/profile/${slug}`, '_blank');
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Voir mon profil public
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Additional Info Card */}
          <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 mt-6 bg-gradient-to-r from-primary-50 to-blue-50">
            <h3 className="font-semibold text-gray-900 mb-3">
              {user?.role === 'freelancer' && 'Conseils pour les Prestataires'}
              {user?.role === 'employer' && 'Conseils pour les Recruteurs'}
              {user?.role === 'admin' && 'Outils d\'administration'}
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              {user?.role === 'freelancer' && (
                <>
                  <li>• Gardez votre profil à jour pour attirer les meilleurs employeurs</li>
                  <li>• Postulez rapidement aux offres qui vous intéressent</li>
                  <li>• Communiquez professionnellement avec les employeurs</li>
                </>
              )}
              {user?.role === 'employer' && (
                <>
                  <li>• Créez des descriptions d'offres détaillées et attractives</li>
                  <li>• Répondez rapidement aux candidatures reçues</li>
                  <li>• Maintenez vos offres à jour</li>
                </>
              )}
              {user?.role === 'admin' && (
                <>
                  <li>• Surveillez les statistiques de la plateforme</li>
                  <li>• Gérez les utilisateurs et les offres d'emploi</li>
                  <li>• Assurez la qualité du contenu sur la plateforme</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Modal de vérification BCE */}
      <Modal
        isOpen={bceModalOpen}
        onClose={() => setBceModalOpen(false)}
        title="Vérifier le numéro BCE"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Nous allons interroger la Banque-Carrefour des Entreprises (BCE) pour récupérer la dénomination et l'adresse officielle de votre entreprise.
          </p>

          <div className="space-y-2">
            <label className="block text-sm font-black text-[#082151]">
              Numéro d'entreprise BCE (10 chiffres)
            </label>
            <input
              type="text"
              value={bceToVerify}
              onChange={(e) => setBceToVerify(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="ex: 0123456789"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-bold text-[#082151] font-mono"
            />
            <p className="text-xs text-slate-400">
              Saisissez uniquement les 10 chiffres de votre numéro d'entreprise.
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => setBceModalOpen(false)}
              disabled={bceVerifying}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleBceVerificationSubmit}
              loading={bceVerifying}
              disabled={bceToVerify.length !== 10}
            >
              Vérifier et enregistrer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Profile

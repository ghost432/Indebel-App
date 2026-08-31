import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { User, Mail, Briefcase, Calendar, Camera, Globe, FileText, Languages, Building2, AlertTriangle, Coins } from 'lucide-react';
import { Link } from 'react-router-dom';
import VerificationBadge from '../components/VerificationBadge';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { userService } from '../services/userService';
import { profileService } from '../services/profileService';
import toast from 'react-hot-toast';
import Badge from '../components/Badge';
import SecteurCompetenceSelector from '../components/SecteurCompetenceSelector';
import MapboxAutocomplete from '../components/MapboxAutocomplete';
import LanguesSelector from '../components/LanguesSelector';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const FreelancerProfile = () => {
  const { user, checkAuth } = useAuth();
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  const [editingPro, setEditingPro] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const [bceModalOpen, setBceModalOpen] = useState(false);
  const [bceToVerify, setBceToVerify] = useState(user?.numero_bce || '');
  const [bceVerifying, setBceVerifying] = useState(false);

  const handleBceVerificationSubmit = async () => {
    if (bceToVerify.length !== 10) {
      toast.error('Le numéro BCE doit contenir exactement 10 chiffres');
      return;
    }

    try {
      setBceVerifying(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/users/verify-and-update-bce`,
        { bceNumber: bceToVerify },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data?.success) {
        toast.success('Votre numéro BCE a été vérifié et enregistré avec succès !');
        setBceModalOpen(false);
        await checkAuth();
        if ((response.data?.data || response.data)) {
          setFormData(prev => ({
            ...prev,
            numero_bce: (response.data?.data || response.data).numero_bce,
            denomination: (response.data?.data || response.data).denomination,
            adresse: (response.data?.data || response.data).adresse
          }));
        }
      } else {
        toast.error(response.data?.message || 'Erreur lors de la vérification');
      }
    } catch (error) {
      console.error('Erreur lors de la verification BCE:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la vérification du numéro BCE');
    } finally {
      setBceVerifying(false);
    }
  };
  
  const [formData, setFormData] = useState({
    poste: user?.poste || '',
    competences: user?.competences || [],
    experience: user?.experience || '',
    tarif_journalier: user?.tarif_journalier || '',
    disponibilite_debut: user?.disponibilite_debut || '',
    disponibilite_fin: user?.disponibilite_fin || '',
    portfolio_url: user?.portfolio_url || '',
    a_propos: user?.a_propos || '',
    telephone: user?.telephone || '',
    numero_bce: user?.numero_bce || '',
    denomination: user?.denomination || '',
    adresse: user?.adresse || '',
    secteur: user?.secteur || '',
    description_entreprise: user?.description_entreprise || '',
    site_web: user?.site_web || '',
    taille_entreprise: user?.taille_entreprise || '',
    genre: user?.genre || 'non_specifie',
    tranche_age: user?.tranche_age || '',
    langues_parlees: user?.langues_parlees || [],
    email_contact: user?.email_contact || '',
    annee_creation: user?.annee_creation || '',
    reseaux_sociaux: user?.reseaux_sociaux || {}
  });


  useEffect(() => {
    document.title = `${profileService.getDisplayName(user, user?.role)} - Profil - Indebel`;
    // Charger les images via le service centralisé
    if (user?.id) {
      const image = profileService.getProfileImage(user);
      if (image) {
        setProfileImage(image);
      }
      const cover = profileService.getCoverImage(user);
      if (cover) {
        setCoverImage(cover);
      }
    }
  }, [user?.id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Préparer les données à envoyer
      const submitData = { ...formData };
      
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
      if (submitData.site_web) {
        submitData.site_web = formatUrl(submitData.site_web);
      }
      
      // Traiter l'URL du portfolio
      if (submitData.portfolio_url) {
        submitData.portfolio_url = formatUrl(submitData.portfolio_url);
      }
      
      // Préparer les données pour l'envoi
      const dataToSend = { ...submitData };
      
      // Convertir les tableaux en JSON pour l'envoi
      if (dataToSend.langues_parlees) {
        dataToSend.langues_parlees = JSON.stringify(dataToSend.langues_parlees);
      }
      if (dataToSend.competences) {
        dataToSend.competences = JSON.stringify(dataToSend.competences);
      }
      
      // Convertir les valeurs numériques (null si vide)
      if (dataToSend.tarif_journalier) {
        dataToSend.tarif_journalier = parseFloat(dataToSend.tarif_journalier) || null;
      } else {
        dataToSend.tarif_journalier = null;
      }
      
      if (dataToSend.experience) {
        dataToSend.experience = parseInt(dataToSend.experience, 10) || null;
      } else {
        dataToSend.experience = null;
      }
      
      if (dataToSend.annee_creation) {
        dataToSend.annee_creation = parseInt(dataToSend.annee_creation, 10) || null;
      } else {
        dataToSend.annee_creation = null;
      }
      
      const response = await userService.updateUser(user.id, dataToSend);
      
      if (response && response.data) {
        if (response.data.success) {
          toast.success('Informations professionnelles mises à jour avec succès');
          await checkAuth();
          setEditingPro(false);
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
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageData = reader.result;
        setProfileImage(imageData);
        // Sauvegarder via le service centralisé
        const dataToSend = profileService.saveProfileImage(imageData, user?.id);
        // Synchroniser avec le backend
        try {
          await userService.updateUser(user.id, dataToSend);
          toast.success('Photo de profil enregistrée avec succès!');
          checkAuth();
        } catch (error) {
          toast.error('Erreur lors de la sauvegarde');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageData = reader.result;
        setCoverImage(imageData);
        // Sauvegarder via le service centralisé
        const dataToSend = profileService.saveCoverImage(imageData, user?.id);
        // Synchroniser avec le backend
        try {
          await userService.updateUser(user.id, dataToSend);
          toast.success('Image de couverture enregistrée avec succès!');
          checkAuth();
        } catch (error) {
          toast.error('Erreur lors de la sauvegarde');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Fonction simplifiée pour freelancer uniquement
  const getRoleBadge = () => {
    return <Badge variant="success">Prestataire</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      // Utiliser la date actuelle si pas de date d'inscription
      const today = new Date();
      return today.toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Si date invalide, utiliser la date actuelle
        const today = new Date();
        return today.toLocaleDateString('fr-FR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      return date.toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      const today = new Date();
      return today.toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  return (
    <>
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
                      <div className="h-32 w-32 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full p-1 shadow-lg border-4 border-white flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4 overflow-hidden">
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
                      <div className="text-center">
                        <h2 className="text-2xl font-bold text-slate-900 mt-2">
                      {`${user?.prenom || ''} ${user?.nom || ''}`.trim() || 'Prestataire'}
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
                      {getRoleBadge()}
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
                      <span>Prestataire</span>
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
                      onClick={() => window.location.href = '/freelancer/settings'}
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
                              setFormData({
                                poste: user?.poste || '',
                                competences: user?.competences || [],
                                experience: user?.experience || '',
                                tarif_journalier: user?.tarif_journalier || '',
                                disponibilite_debut: user?.disponibilite_debut || '',
                                disponibilite_fin: user?.disponibilite_fin || '',
                                portfolio_url: user?.portfolio_url || '',
                                a_propos: user?.a_propos || '',
                                telephone: user?.telephone || '',
                                numero_bce: user?.numero_bce || '',
                                denomination: user?.denomination || '',
                                adresse: user?.adresse || '',
                                secteur: user?.secteur || '',
                                genre: user?.genre || 'non_specifie',
                                tranche_age: user?.tranche_age || '',
                                langues_parlees: user?.langues_parlees || []
                              });
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
                    
                    {!editingPro ? (
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

                        {user?.poste && (
                          <div>
                            <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
                              <Briefcase className="h-4 w-4 mr-2" />
                              Poste / Métier
                            </label>
                            <p className="text-gray-900">{user.poste}</p>
                          </div>
                        )}

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

                        {user?.competences && user.competences.length > 0 && (
                          <div>
                            <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
                              <FileText className="h-4 w-4 mr-2" />
                              Compétences principales
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {Array.isArray(user.competences) 
                                ? user.competences.map((competence, index) => (
                                    <span key={index} className="px-4 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold border border-slate-200 shadow-sm">
                                      {competence}
                                    </span>
                                  ))
                                : (
                                    typeof user.competences === 'string' &&
                                    user.competences.split(',').map((competence, index) => (
                                      <span key={index} className="px-4 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold border border-slate-200 shadow-sm">
                                        {competence.trim()}
                                      </span>
                                    ))
                                  )
                              }
                            </div>
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

                        {user?.langues_parlees && user.langues_parlees.length > 0 && (
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

                        {(user?.disponibilite_debut || user?.disponibilite_fin) && (
                          <div>
                            <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
                              <Calendar className="h-4 w-4 mr-2" />
                              Période de disponibilité
                            </label>
                            <p className="text-gray-900">
                              {user?.disponibilite_debut && new Date(user.disponibilite_debut).toLocaleDateString('fr-FR')}
                              {user?.disponibilite_debut && user?.disponibilite_fin && ' au '}
                              {user?.disponibilite_fin && new Date(user.disponibilite_fin).toLocaleDateString('fr-FR')}
                            </p>
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
                    ) : (
                      <form id="freelancerForm" onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Input
                            label="Numéro BCE"
                            name="numero_bce"
                            value={formData.numero_bce}
                            onChange={handleChange}
                            required
                            icon={Building2}
                            disabled
                            readOnly
                          />

                          <Input
                            label="Dénomination"
                            name="denomination"
                            value={formData.denomination}
                            onChange={handleChange}
                            placeholder="Nom de votre entreprise"
                            icon={Building2}
                            disabled
                            readOnly
                          />

                          <Input
                            label="Adresse"
                            name="adresse"
                            value={formData.adresse}
                            onChange={handleChange}
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

                        <Input
                          label="Votre poste ou métier"
                          name="poste"
                          value={formData.poste}
                          onChange={handleChange}
                          placeholder="Ex: Développeur, Designer, Consultant..."
                          icon={Briefcase}
                        />

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            À propos de vous
                          </label>
                          <textarea
                            name="a_propos"
                            value={formData.a_propos}
                            onChange={handleChange}
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
                            value={formData.genre}
                            onChange={handleChange}
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
                            value={formData.tranche_age}
                            onChange={handleChange}
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
                          selectedSecteur={formData.secteur}
                          setSelectedSecteur={(val) => setFormData(prev => ({...prev, secteur: val}))}
                          selectedCompetences={formData.competences}
                          setSelectedCompetences={(val) => setFormData(prev => ({...prev, competences: val}))}
                          competencesLabel="Quelles sont vos compétences ?"
                        />

                        <div>
                          <Input
                            label="Années d'expérience"
                            name="experience"
                            type="number"
                            value={formData.experience}
                            onChange={handleChange}
                            placeholder="Ex: 5"
                            icon={Calendar}
                          />
                        </div>

                        <LanguesSelector
                          selectedLangues={formData.langues_parlees}
                          setSelectedLangues={(langues) => setFormData(prev => ({...prev, langues_parlees: langues}))}
                        />

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="h-4 w-4 inline mr-2" />
                            Période de disponibilité
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                              label="Date de début"
                              name="disponibilite_debut"
                              type="date"
                              value={formData.disponibilite_debut}
                              onChange={handleChange}
                              placeholder="Date de début"
                            />
                            <Input
                              label="Date de fin"
                              name="disponibilite_fin"
                              type="date"
                              value={formData.disponibilite_fin}
                              onChange={handleChange}
                              placeholder="Date de fin"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Indiquez votre période de disponibilité pour de nouvelles missions</p>
                        </div>

                        <div className="space-y-2">
                          <Input
                            label="Portfolio / Site web"
                            name="portfolio_url"
                            type="text"
                            value={formData.portfolio_url?.replace(/^https?:\/\//, '')}
                            onChange={handleChange}
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
                              setEditingPro(false);
                              setFormData({
                                poste: user?.poste || '',
                                competences: user?.competences || [],
                                experience: user?.experience || '',
                                tarif_journalier: user?.tarif_journalier || '',
                                disponibilite_debut: user?.disponibilite_debut || '',
                                disponibilite_fin: user?.disponibilite_fin || '',
                                portfolio_url: user?.portfolio_url || '',
                                a_propos: user?.a_propos || '',
                                telephone: user?.telephone || '',
                                numero_bce: user?.numero_bce || '',
                                denomination: user?.denomination || '',
                                adresse: user?.adresse || '',
                                secteur: user?.secteur || '',
                                genre: user?.genre || 'non_specifie',
                                tranche_age: user?.tranche_age || '',
                                langues_parlees: user?.langues_parlees || []
                              });
                            }}
                          >
                            Annuler
                          </Button>
                          <Button type="submit" loading={loading}>
                            Enregistrer
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* Additional Info Card */}
                <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 mt-6 bg-gradient-to-r from-primary-50 to-blue-50">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Conseils pour les Prestataires
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Gardez votre profil à jour pour attirer les meilleurs employeurs</li>
                    <li>• Postulez rapidement aux offres qui vous intéressent</li>
                    <li>• Communiquez professionnellement avec les employeurs</li>
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
    </>
  );
}

export default FreelancerProfile;

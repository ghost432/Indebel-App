import { useState, useEffect } from 'react'
import PageLoader from '../components/PageLoader'
import { Package, Plus, Edit, Trash2, Check, X, CheckCircle, Settings } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import { forfaitService } from '../services/forfaitService'
import toast from 'react-hot-toast'

const AdminForfaits = () => {
  const [forfaits, setForfaits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [editingForfait, setEditingForfait] = useState(null)
  
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    prix_mensuel: 0,
    prix_annuel: null,
    duree: 'mensuel',
    max_missions: null,
    max_documents: null,
    limite_devis_ia: null,
    limite_candidature_ia: null,
    max_vues_missions: null,
    max_vues_devis: null,
    priorite_support: 'standard',
    badge_premium: false,
    mise_en_avant: false,
    statistiques_avancees: false,
    api_access: false,
    type_utilisateur: 'freelancer',
    actif: true,
    recommande: false,
    couleur_badge: '#4f46e5',
    max_postulations: null,
    max_devis: null,
    peut_voir_devis: false,
    logo_page_accueil: false,
    gestion_candidatures: false,
    peut_publier_missions: false,
    label_indebel: false,
    liste_freelancers: false,
    liste_employeurs: false
  })

  useEffect(() => {
    document.title = 'Gestion des Forfaits - Admin - Indebel'
    fetchForfaits()
  }, [])

  const fetchForfaits = async () => {
    try {
      setLoading(true)
      const response = await forfaitService.getAllForfaits()
      setForfaits((response.data?.data || response.data))
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des forfaits')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const payload = { ...formData }
      // Calculate duree for DB enum
      const m = parseInt(payload.duree_abonnement_mois) || 0
      payload.duree_abonnement_mois = m
      payload.duree = m >= 12 ? 'annuel' : m >= 6 ? 'semestriel' : m >= 3 ? 'trimestriel' : 'mensuel'
      payload.type_facturation = payload.duree === 'annuel' ? 'annuel' : 'mensuel'

      if (editingForfait) {
        await forfaitService.updateForfait(editingForfait.id, payload)
        toast.success('Forfait mis à jour avec succès')
      } else {
        await forfaitService.createForfait(payload)
        toast.success('Forfait créé avec succès')
      }
      
      setShowModal(false)
      setEditingForfait(null)
      resetForm()
      fetchForfaits()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement')
    }
  }

  const handleEdit = (forfait) => {
    setEditingForfait(forfait)

    setFormData({
      nom: forfait.nom,
      description: forfait.description || '',
      prix_mensuel: forfait.prix_mensuel,
      prix_annuel: forfait.prix_annuel,
      duree_abonnement_mois: forfait.duree_abonnement_mois !== undefined && forfait.duree_abonnement_mois !== null ? forfait.duree_abonnement_mois : 1,
      max_missions: forfait.max_missions,
      max_documents: forfait.max_documents,
      limite_devis_ia: forfait.limite_devis_ia,
      limite_candidature_ia: forfait.limite_candidature_ia,
      max_vues_missions: forfait.max_vues_missions,
      max_vues_devis: forfait.max_vues_devis,
      priorite_support: forfait.priorite_support,
      badge_premium: Boolean(forfait.badge_premium),
      mise_en_avant: Boolean(forfait.mise_en_avant),
      statistiques_avancees: Boolean(forfait.statistiques_avancees),
      api_access: Boolean(forfait.api_access),
      type_utilisateur: forfait.type_utilisateur,
      actif: Boolean(forfait.actif),
      recommande: Boolean(forfait.recommande),
      couleur_badge: forfait.couleur_badge,
      max_postulations: forfait.max_postulations,
      max_devis: forfait.max_devis,
      peut_voir_devis: Boolean(forfait.peut_voir_devis),
      logo_page_accueil: Boolean(forfait.logo_page_accueil),
      gestion_candidatures: Boolean(forfait.gestion_candidatures),
      peut_publier_missions: Boolean(forfait.peut_publier_missions),
      label_indebel: Boolean(forfait.label_indebel),
      liste_freelancers: Boolean(forfait.liste_freelancers),
      liste_employeurs: Boolean(forfait.liste_employeurs),
      max_demandes_devis: forfait.max_demandes_devis,
      max_devis_recus: forfait.max_devis_recus,
      max_candidatures_recues: forfait.max_candidatures_recues
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce forfait ?')) {
      return
    }
    
    try {
      await forfaitService.deleteForfait(id)
      toast.success('Forfait supprimé avec succès')
      fetchForfaits()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression')
    }
  }

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      prix_mensuel: 0,
      prix_annuel: null,
      duree_abonnement_mois: 1,
      max_missions: null,
      max_documents: null,
      limite_devis_ia: null,
      limite_candidature_ia: null,
      max_vues_missions: null,
      max_vues_devis: null,
      priorite_support: 'standard',
      badge_premium: false,
      mise_en_avant: false,
      statistiques_avancees: false,
      api_access: false,
      type_utilisateur: 'freelancer',
      actif: true,
      recommande: false,
      couleur_badge: '#4f46e5',
      max_postulations: null,
      max_devis: null,
      peut_voir_devis: false,
      logo_page_accueil: false,
      gestion_candidatures: false,
      peut_publier_missions: false,
      label_indebel: false,
      liste_freelancers: false,
      liste_employeurs: false,
      max_demandes_devis: null,
      max_devis_recus: null,
      max_candidatures_recues: null
    })
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  if (loading) {
    return <PageLoader fullScreen />
  }

  const filteredForfaits = forfaits.filter(f => {
    if (typeFilter === 'all') return true
    return f.type_utilisateur === typeFilter || f.type_utilisateur === 'les_deux'
  })

  const displayLimit = (val) => {
    if (val === 0 || val === '0' || val === null || val === undefined || val === '') return 'Illimité';
    return val;
  }

  const displayDuration = (val) => {
    if (val === 0 || val === '0') return 'À vie';
    return `${val} mois`;
  }

  const isFreelancer = ['freelancer', 'les_deux'].includes(formData.type_utilisateur);
  const isEmployer = ['employer', 'les_deux'].includes(formData.type_utilisateur);

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="bg-[#082151] rounded-[24px] shadow-md p-6 md:p-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden text-white border-0">
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-white/10 text-white rounded-2xl hidden sm:block">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Gestion des Forfaits</h1>
            <p className="text-slate-200 mt-1 text-sm md:text-base">Définissez les abonnements et les limites de la plateforme</p>
          </div>
        </div>
        <div className="relative z-10">
          <Button
            onClick={() => {
              resetForm()
              setEditingForfait(null)
              setShowModal(true)
            }}
            variant="white"
            className="flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Créer un forfait
          </Button>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#2b4eef]/20 to-[#df6422]/20 rounded-full blur-3xl -mr-16 -mt-16 z-0 pointer-events-none"></div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-8 gap-4">
        <div className="w-full sm:w-64">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Filtrer par type</label>
          <select 
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-700 font-medium"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">Tous les forfaits</option>
            <option value="freelancer">Prestataires uniquement</option>
            <option value="employer">Recruteurs uniquement</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredForfaits.map((forfait) => (
          <div key={forfait.id} className="relative group flex flex-col bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300">
            {forfait.recommande && (
              <div className="absolute top-0 inset-x-0 h-1" style={{ backgroundColor: forfait.couleur_badge || '#4f46e5' }}></div>
            )}
            
            <div className="p-6 sm:p-8 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div 
                  className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner"
                  style={{ backgroundColor: (forfait.couleur_badge || '#4f46e5') + '20' }}
                >
                  <Package className="h-7 w-7" style={{ color: forfait.couleur_badge || '#4f46e5' }} />
                </div>
                <div className="flex flex-col items-end gap-2">
                  {forfait.recommande && (
                     <span className="bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                       Recommandé
                     </span>
                  )}
                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm ${
                    forfait.type_utilisateur === 'freelancer' ? 'bg-blue-100 text-blue-700' :
                    forfait.type_utilisateur === 'employer' ? 'bg-purple-100 text-purple-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {forfait.type_utilisateur === 'les_deux' ? 'Les deux' : 
                     forfait.type_utilisateur === 'freelancer' ? 'Prestataire' : 'Recruteur'}
                  </span>
                </div>
              </div>

              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">{forfait.nom}</h3>
              <p className="text-slate-500 text-sm mb-6 min-h-[40px] line-clamp-2">
                {forfait.description}
              </p>

              <div className="mb-8">
                <div className="flex items-baseline text-slate-900">
                  <span className="text-4xl font-black tracking-tight">{forfait.prix_mensuel === 0 ? 'Gratuit' : `${forfait.prix_mensuel}€`}</span>
                  {forfait.prix_mensuel > 0 && <span className="text-slate-500 ml-1 font-medium">/mois</span>}
                </div>
                {forfait.prix_annuel > 0 && (
                  <div className="text-sm font-semibold text-indigo-600 mt-1">
                    ou {forfait.prix_annuel}€/an (Économisez !)
                  </div>
                )}
                <div className="text-xs font-semibold text-slate-500 mt-2 bg-slate-100 px-3 py-1 rounded-full inline-block">
                  Durée: {displayDuration(forfait.duree_abonnement_mois)}
                </div>
              </div>

              <div className="space-y-3 text-sm font-medium text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {(forfait.type_utilisateur === 'employer' || forfait.type_utilisateur === 'les_deux') && (
                  <div className="flex items-center justify-between">
                    <span>Missions</span>
                    <span className="font-bold text-indigo-600">{displayLimit(forfait.max_missions)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>Documents</span>
                  <span className="font-bold text-indigo-600">{displayLimit(forfait.max_documents)}</span>
                </div>
                {(forfait.type_utilisateur === 'freelancer' || forfait.type_utilisateur === 'les_deux') && (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Devis via IA</span>
                      <span className="font-bold text-indigo-600">{displayLimit(forfait.limite_devis_ia)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Candidatures IA</span>
                      <span className="font-bold text-indigo-600">{displayLimit(forfait.limite_candidature_ia)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Vues missions/mois</span>
                      <span className="font-bold text-indigo-600">{displayLimit(forfait.max_vues_missions)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Vues devis/mois</span>
                      <span className="font-bold text-indigo-600">{displayLimit(forfait.max_vues_devis)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Max Postulations</span>
                      <span className="font-bold text-indigo-600">{displayLimit(forfait.max_postulations)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Max Devis</span>
                      <span className="font-bold text-indigo-600">{displayLimit(forfait.max_devis)}</span>
                    </div>
                  </>
                )}
                {(forfait.type_utilisateur === 'employer' || forfait.type_utilisateur === 'les_deux') && (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Max Demandes Devis</span>
                      <span className="font-bold text-indigo-600">{displayLimit(forfait.max_demandes_devis)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Max Devis Reçus</span>
                      <span className="font-bold text-indigo-600">{displayLimit(forfait.max_devis_recus)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Max Candidatures Reçues</span>
                      <span className="font-bold text-indigo-600">{displayLimit(forfait.max_candidatures_recues)}</span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span>Support</span>
                  <span className={`font-bold capitalize ${
                    forfait.priorite_support === 'premium' ? 'text-amber-600' :
                    forfait.priorite_support === 'prioritaire' ? 'text-indigo-600' : 'text-slate-600'
                  }`}>
                    {forfait.priorite_support || 'Standard'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <Button
                variant="secondary"
                className="flex-1 shadow-sm"
                onClick={() => handleEdit(forfait)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button
                variant="danger"
                className="shadow-sm px-4"
                onClick={() => handleDelete(forfait.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {!forfait.actif && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                <span className="bg-red-500 text-white px-6 py-2 rounded-full font-bold shadow-xl flex items-center gap-2">
                  <X className="h-5 w-5" /> Inactif
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Création/Édition */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingForfait(null)
          resetForm()
        }}
        title={editingForfait ? 'Modifier le forfait' : 'Créer un forfait'}
      >
        <form onSubmit={handleSubmit} className="space-y-8 mt-4">
          
          {/* Informations générales */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-indigo-500" /> Informations générales
            </h3>
            <div className="space-y-4">
              <Input
                label="Nom du forfait *"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
              />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Type d'utilisateur *
                  </label>
                  <select
                    name="type_utilisateur"
                    value={formData.type_utilisateur}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                    required
                  >
                    <option value="freelancer">Prestataire</option>
                    <option value="employer">Recruteur</option>
                    <option value="les_deux">Les deux</option>
                  </select>
                </div>
                <Input
                  label="Couleur du badge (hex)"
                  name="couleur_badge"
                  type="color"
                  value={formData.couleur_badge}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Tarification */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-indigo-500 font-bold text-xl">€</span> Tarification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Prix mensuel (€) *"
                name="prix_mensuel"
                type="number"
                step="0.01"
                value={formData.prix_mensuel}
                onChange={handleChange}
                required
              />
              <Input
                label="Prix annuel (€)"
                name="prix_annuel"
                type="number"
                step="0.01"
                value={formData.prix_annuel || ''}
                onChange={handleChange}
              />
              <Input
                label="Durée (en mois, 0 = à vie) *"
                name="duree_abonnement_mois"
                type="number"
                min="0"
                value={formData.duree_abonnement_mois}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Limites d'utilisation */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-indigo-500" /> Limites & Quotas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isEmployer && (
                <>
                  <Input
                    label="Nombre max de missions publiées (vide = illimité)"
                    name="max_missions"
                    type="number"
                    value={formData.max_missions || ''}
                    onChange={handleChange}
                  />
                  <Input
                    label="Nombre max de demandes de devis (vide = illimité)"
                    name="max_demandes_devis"
                    type="number"
                    value={formData.max_demandes_devis || ''}
                    onChange={handleChange}
                  />
                  <Input
                    label="Nombre max de devis reçus par demande (vide = illimité)"
                    name="max_devis_recus"
                    type="number"
                    value={formData.max_devis_recus || ''}
                    onChange={handleChange}
                  />
                  <Input
                    label="Nombre max de candidatures reçues par mission (vide = illimité)"
                    name="max_candidatures_recues"
                    type="number"
                    value={formData.max_candidatures_recues || ''}
                    onChange={handleChange}
                  />
                </>
              )}
              
              <Input
                label="Nombre max de documents stockés (vide = illimité)"
                name="max_documents"
                type="number"
                value={formData.max_documents || ''}
                onChange={handleChange}
              />

              {isFreelancer && (
                <>
                  <Input
                    label="Générations de devis par IA (vide = illimité)"
                    name="limite_devis_ia"
                    type="number"
                    value={formData.limite_devis_ia || ''}
                    onChange={handleChange}
                  />
                  <Input
                    label="Générations de candidatures par IA (vide = illimité)"
                    name="limite_candidature_ia"
                    type="number"
                    value={formData.limite_candidature_ia || ''}
                    onChange={handleChange}
                  />
                  <Input
                    label="Nombre max de postulations aux offres (vide = illimité)"
                    name="max_postulations"
                    type="number"
                    value={formData.max_postulations || ''}
                    onChange={handleChange}
                  />
                  <Input
                    label="Nombre max de devis créés manuellement (vide = illimité)"
                    name="max_devis"
                    type="number"
                    value={formData.max_devis || ''}
                    onChange={handleChange}
                  />
                  <Input
                    label="Nombre max de consultations de missions (vide = illimité)"
                    name="max_vues_missions"
                    type="number"
                    value={formData.max_vues_missions || ''}
                    onChange={handleChange}
                  />
                  <Input
                    label="Nombre max de consultations de devis (vide = illimité)"
                    name="max_vues_devis"
                    type="number"
                    value={formData.max_vues_devis || ''}
                    onChange={handleChange}
                  />
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Niveau de priorité pour l'assistance client
                </label>
                <select
                  name="priorite_support"
                  value={formData.priorite_support}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                >
                  <option value="standard">Standard</option>
                  <option value="prioritaire">Prioritaire</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-indigo-500" /> Options supplémentaires
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: 'badge_premium', label: 'Badge premium', show: true },
                { name: 'mise_en_avant', label: 'Mise en avant', show: true },
                { name: 'statistiques_avancees', label: 'Statistiques avancées', show: true },
                { name: 'api_access', label: 'Accès API', show: true },
                { name: 'peut_voir_devis', label: 'Peut voir devis publics', show: isFreelancer },
                { name: 'logo_page_accueil', label: 'Logo page accueil', show: true },
                { name: 'gestion_candidatures', label: 'Gestion candidatures', show: isEmployer },
                { name: 'peut_publier_missions', label: 'Peut publier missions', show: isEmployer },
                { name: 'label_indebel', label: 'Label Indebel', show: true },
                { name: 'liste_freelancers', label: 'Voir liste prestataires', show: isEmployer },
                { name: 'liste_employeurs', label: 'Voir liste recruteurs', show: isFreelancer },
                { name: 'actif', label: 'Forfait Actif', show: true },
                { name: 'recommande', label: 'Forfait Recommandé', show: true },
              ].filter(opt => opt.show).map((option) => (
                <label key={option.name} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-300 transition-colors shadow-sm">
                  <span className="text-sm font-bold text-slate-700">{option.label}</span>
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData[option.name] ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                    <input
                      type="checkbox"
                      name={option.name}
                      checked={formData[option.name]}
                      onChange={(e) => handleChange({ target: { name: option.name, type: 'checkbox', checked: e.target.checked }})}
                      className="sr-only"
                    />
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData[option.name] ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false)
                setEditingForfait(null)
                resetForm()
              }}
              className="flex-1 py-3 text-base shadow-sm"
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1 py-3 text-base shadow-sm">
              {editingForfait ? 'Mettre à jour le forfait' : 'Créer le forfait'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default AdminForfaits

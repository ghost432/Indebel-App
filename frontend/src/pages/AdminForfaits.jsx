import { useState, useEffect } from 'react'
import { Package, Plus, Edit, Trash2, Check, X } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import { forfaitService } from '../services/forfaitService'
import toast from 'react-hot-toast'
import { getCleanForfaitName } from '../utils/forfaitUtils'

const AdminForfaits = () => {
  const [forfaits, setForfaits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingForfait, setEditingForfait] = useState(null)

  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    prix_mensuel: 0,
    prix_annuel: null,
    type_facturation: 'unique',
    duree_abonnement_mois: null,
    duree_offre_jours: null,
    logo_page_accueil: false,
    gestion_candidatures: false,
    max_missions: null,
    max_documents: null,
    max_postulations: null,
    max_devis: null,
    priorite_support: 'standard',
    badge_premium: false,
    mise_en_avant: false,
    statistiques_avancees: false,
    api_access: false,
    label_indebel: false,
    type_utilisateur: 'les_deux',
    actif: true,
    recommande: false,
    couleur_badge: '#6B7280',
    peut_publier_missions: false
  })

  useEffect(() => {
    document.title = 'Gestion des Forfaits - Admin - Indebel'
    fetchForfaits()
  }, [])

  const fetchForfaits = async () => {
    try {
      setLoading(true)
      const response = await forfaitService.getAllForfaits()
      setForfaits(response.data.data)
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
      if (editingForfait) {
        await forfaitService.updateForfait(editingForfait.id, formData)
        toast.success('Forfait mis à jour avec succès')
      } else {
        await forfaitService.createForfait(formData)
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
      type_facturation: forfait.type_facturation || 'unique',
      duree_abonnement_mois: forfait.duree_abonnement_mois,
      duree_offre_jours: forfait.duree_offre_jours,
      logo_page_accueil: forfait.logo_page_accueil,
      gestion_candidatures: forfait.gestion_candidatures,
      max_missions: forfait.max_missions,
      max_documents: forfait.max_documents,
      max_postulations: forfait.max_postulations,
      max_devis: forfait.max_devis,
      priorite_support: forfait.priorite_support,
      badge_premium: forfait.badge_premium,
      mise_en_avant: forfait.mise_en_avant,
      statistiques_avancees: forfait.statistiques_avancees,
      api_access: forfait.api_access,
      label_indebel: forfait.label_indebel,
      type_utilisateur: forfait.type_utilisateur,
      actif: forfait.actif,
      recommande: forfait.recommande,
      couleur_badge: forfait.couleur_badge,
      peut_publier_missions: forfait.peut_publier_missions
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
      type_facturation: 'unique',
      duree_abonnement_mois: null,
      duree_offre_jours: null,
      logo_page_accueil: false,
      gestion_candidatures: false,
      max_missions: null,
      max_documents: null,
      max_postulations: null,
      max_devis: null,
      priorite_support: 'standard',
      badge_premium: false,
      mise_en_avant: false,
      statistiques_avancees: false,
      api_access: false,
      label_indebel: false,
      type_utilisateur: 'les_deux',
      actif: true,
      recommande: false,
      couleur_badge: '#6B7280',
      peut_publier_missions: false
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="container-custom py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="h-8 w-8 text-primary-600" />
            Gestion des Forfaits
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez les forfaits d'abonnement de la plateforme
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setEditingForfait(null)
            setShowModal(true)
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Créer un forfait
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="text-sm font-medium text-gray-600">Total Forfaits</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{forfaits.length}</div>
        </Card>
        <Card>
          <div className="text-sm font-medium text-gray-600">Actifs</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {forfaits.filter(f => f.actif).length}
          </div>
        </Card>
        <Card>
          <div className="text-sm font-medium text-gray-600">Freelancer</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">
            {forfaits.filter(f => f.type_utilisateur === 'freelancer' || f.type_utilisateur === 'les_deux').length}
          </div>
        </Card>
        <Card>
          <div className="text-sm font-medium text-gray-600">Employer</div>
          <div className="text-3xl font-bold text-purple-600 mt-2">
            {forfaits.filter(f => f.type_utilisateur === 'employer' || f.type_utilisateur === 'les_deux').length}
          </div>
        </Card>
      </div>

      {/* Liste des forfaits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forfaits.map((forfait) => (
          <Card key={forfait.id} className="relative">
            {forfait.recommande && (
              <div className="absolute top-4 right-4">
                <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  Recommandé
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: forfait.couleur_badge + '20' }}
              >
                <Package className="h-5 w-5" style={{ color: forfait.couleur_badge }} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{getCleanForfaitName(forfait.nom)}</h3>
                <span className={`text-xs px-2 py-0.5 rounded ${forfait.type_utilisateur === 'freelancer' ? 'bg-blue-100 text-blue-700' :
                  forfait.type_utilisateur === 'employer' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                  {forfait.type_utilisateur === 'les_deux' ? 'Les deux' :
                    forfait.type_utilisateur === 'freelancer' ? 'Freelancer' : 'Employer'}
                </span>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {forfait.description}
            </p>

            <div className="mb-4">
              <div className="text-3xl font-bold text-gray-900">
                {forfait.prix_mensuel === 0 ? 'Gratuit' : `${forfait.prix_mensuel}€`}
              </div>
              {forfait.duree_abonnement_mois && forfait.duree_abonnement_mois > 0 && (
                <div className="text-sm text-gray-600 mt-1">
                  Durée : {forfait.duree_abonnement_mois} mois
                </div>
              )}
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex items-center gap-2">
                {forfait.peut_publier_missions ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <Check className="h-4 w-4" /> Peut publier ({forfait.max_missions || 'illimité'})
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1">
                    <X className="h-4 w-4" /> Ne peut pas publier
                  </span>
                )}
              </div>
              {forfait.badge_premium && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="h-4 w-4" /> Badge premium
                </div>
              )}
              {forfait.mise_en_avant && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="h-4 w-4" /> Mise en avant
                </div>
              )}
              {forfait.statistiques_avancees && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="h-4 w-4" /> Statistiques avancées
                </div>
              )}
              {forfait.api_access && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="h-4 w-4" /> Liste des Prestataires
                </div>
              )}
              {forfait.max_postulations !== null && (
                <div className="text-gray-700">
                  Max {forfait.max_postulations} candidatures / mois
                </div>
              )}
              {forfait.max_devis !== null && (
                <div className="text-gray-700">
                  Max {forfait.max_devis} devis / mois
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => handleEdit(forfait)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Modifier
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(forfait.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {!forfait.actif && (
              <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center rounded-lg">
                <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold">
                  Inactif
                </span>
              </div>
            )}
          </Card>
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom du forfait *"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <Input
            label="Prix (€) *"
            name="prix_mensuel"
            type="number"
            step="0.01"
            value={formData.prix_mensuel}
            onChange={handleChange}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de facturation *
              </label>
              <select
                name="type_facturation"
                value={formData.type_facturation}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="unique">Facturation unique</option>
                <option value="mensuel">Mensuel</option>
                <option value="trimestriel">Trimestriel (3 mois)</option>
                <option value="semestriel">Semestriel (6 mois)</option>
                <option value="annuel">Annuel (12 mois)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée du forfait
              </label>
              <select
                name="duree_abonnement_mois"
                value={formData.duree_abonnement_mois || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Aucune durée</option>
                <option value="1">1 mois</option>
                <option value="2">2 mois</option>
                <option value="3">3 mois</option>
                <option value="6">6 mois</option>
                <option value="12">12 mois</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Durée offre (jours)"
              name="duree_offre_jours"
              type="number"
              value={formData.duree_offre_jours || ''}
              onChange={handleChange}
              placeholder="Ex: 90"
            />
            <Input
              label="Max documents"
              name="max_documents"
              type="number"
              value={formData.max_documents || ''}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max candidatures / mois"
              name="max_postulations"
              type="number"
              value={formData.max_postulations || ''}
              onChange={handleChange}
              placeholder="Ex: 10"
            />
            <Input
              label="Max devis / mois"
              name="max_devis"
              type="number"
              value={formData.max_devis || ''}
              onChange={handleChange}
              placeholder="Ex: 5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type d'utilisateur *
            </label>
            <select
              name="type_utilisateur"
              value={formData.type_utilisateur}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="freelancer">Freelancer</option>
              <option value="employer">Employer</option>
              <option value="les_deux">Les deux</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priorité support
            </label>
            <select
              name="priorite_support"
              value={formData.priorite_support}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="standard">Standard (48h)</option>
              <option value="prioritaire">Prioritaire (24h)</option>
              <option value="premium">Premium (24h)</option>
            </select>
          </div>

          <Input
            label="Couleur du badge (hex)"
            name="couleur_badge"
            type="color"
            value={formData.couleur_badge}
            onChange={handleChange}
          />

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="badge_premium"
                checked={formData.badge_premium}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Badge premium</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="mise_en_avant"
                checked={formData.mise_en_avant}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Mise en avant</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="statistiques_avancees"
                checked={formData.statistiques_avancees}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Statistiques avancées</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="api_access"
                checked={formData.api_access}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Liste des Prestataires</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="label_indebel"
                checked={formData.label_indebel}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Accès Label Indebel</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="actif"
                checked={formData.actif}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Actif</span>
            </label>

            <div className="bg-primary-50 p-4 rounded-lg border border-primary-100 space-y-4">
              <label className="flex items-center gap-2 text-primary-600 font-bold">
                <input
                  type="checkbox"
                  name="peut_publier_missions"
                  checked={formData.peut_publier_missions}
                  onChange={handleChange}
                  className="rounded"
                />
                <span className="text-sm">Peut publier des missions</span>
              </label>

              {formData.peut_publier_missions && (
                <div className="pl-6 border-l-2 border-primary-200 animate-in fade-in slide-in-from-left-2 duration-200">
                  <Input
                    label="Nombre maximum de missions (vide = illimité)"
                    name="max_missions"
                    type="number"
                    value={formData.max_missions || ''}
                    onChange={handleChange}
                    placeholder="Ex: 5"
                  />
                </div>
              )}
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="recommande"
                checked={formData.recommande}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Recommandé</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="logo_page_accueil"
                checked={formData.logo_page_accueil}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Logo en page d'accueil</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="gestion_candidatures"
                checked={formData.gestion_candidatures}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Gestion des candidatures</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false)
                setEditingForfait(null)
                resetForm()
              }}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              {editingForfait ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default AdminForfaits

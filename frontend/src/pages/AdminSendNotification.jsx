import { useState, useEffect } from 'react'
import { Send, Users, Briefcase, User, Mail, ArrowLeft } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'

const AdminSendNotification = () => {
  const templates = [
    {
      label: 'Bienvenue',
      type: 'info',
      titre: 'Bienvenue sur Indebel !',
      message: 'Découvrez notre plateforme et complétez votre profil pour commencer.',
      bouton_type: 'mon_compte',
      bouton_texte: '',
      bouton_url: ''
    },
    {
      label: 'Documents (Freelancers)',
      type: 'warning',
      titre: 'Mettez à jour vos documents',
      message: 'Veuillez vérifier et mettre à jour vos documents pour continuer à utiliser la plateforme.',
      bouton_type: 'autre',
      bouton_texte: 'Mettre à jour',
      bouton_url: 'https://pro.indebel.be/freelancer/profil'
    },
    {
      label: 'Nouveauté',
      type: 'success',
      titre: 'Nouvelle fonctionnalité disponible',
      message: 'Nous avons ajouté de nouvelles fonctionnalités pour améliorer votre expérience sur Indebel.',
      bouton_type: 'mon_compte',
      bouton_texte: '',
      bouton_url: ''
    },
    {
      label: 'Alerte maintenance',
      type: 'error',
      titre: 'Maintenance programmée',
      message: 'La plateforme sera temporairement indisponible pour maintenance technique.',
      bouton_type: 'autre',
      bouton_texte: 'En savoir plus',
      bouton_url: 'https://pro.indebel.be'
    }
  ]
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [formData, setFormData] = useState({
    type: 'info',
    titre: '',
    message: '',
    destinataires: 'tous',
    user_ids: [],
    envoyer_email: false,
    bouton_type: 'mon_compte',
    bouton_texte: '',
    bouton_url: ''
  })

  useEffect(() => {
    document.title = 'Envoyer une notification - Admin'
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const usersList = ((response.data?.data || response.data) || []).filter(u => u.role !== 'admin')
      setUsers(usersList)
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.titre || !formData.message) {
      return toast.error('Titre et message requis')
    }

    if (formData.destinataires === 'specifiques' && formData.user_ids.length === 0) {
      return toast.error('Sélectionnez au moins un utilisateur')
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const endpoint = formData.destinataires === 'specifiques'
        ? '/api/notifications/send-to-users'
        : '/api/notifications/send-to-all'

      const payload = formData.destinataires === 'specifiques'
        ? {
            type: formData.type,
            titre: formData.titre,
            message: formData.message,
            user_ids: formData.user_ids,
            envoyer_email: formData.envoyer_email,
            bouton_type: formData.bouton_type,
            bouton_texte: formData.bouton_texte,
            bouton_url: formData.bouton_url
          }
        : {
            type: formData.type,
            titre: formData.titre,
            message: formData.message,
            destinataires: formData.destinataires,
            envoyer_email: formData.envoyer_email,
            bouton_type: formData.bouton_type,
            bouton_texte: formData.bouton_texte,
            bouton_url: formData.bouton_url
          }

      const response = await axios.post(`${API_BASE_URL}${endpoint.replace('/api', '')}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success(response.data.message || 'Notification envoyée avec succès')
      
      // Réinitialiser le formulaire
      setFormData({
        type: 'info',
        titre: '',
        message: '',
        destinataires: 'tous',
        user_ids: [],
        envoyer_email: false,
        bouton_type: 'mon_compte',
        bouton_texte: '',
        bouton_url: ''
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi')
    } finally {
      setLoading(false)
    }
  }

  const toggleUser = (userId) => {
    setFormData(prev => ({
      ...prev,
      user_ids: prev.user_ids.includes(userId)
        ? prev.user_ids.filter(id => id !== userId)
        : [...prev.user_ids, userId]
    }))
  }

  const applyTemplate = (tpl) => {
    setFormData(prev => ({
      ...prev,
      type: tpl.type,
      titre: tpl.titre,
      message: tpl.message,
      bouton_type: tpl.bouton_type,
      bouton_texte: tpl.bouton_texte,
      bouton_url: tpl.bouton_url
    }))
  }

  const filteredUsers = formData.destinataires === 'tous'
    ? users
    : formData.destinataires === 'employers'
    ? users.filter(u => u.role === 'employer')
    : formData.destinataires === 'freelancers'
    ? users.filter(u => u.role === 'freelancer')
    : users

  return (
    <div className="py-8">
      <Button 
        onClick={() => navigate('/admin/dashboard')} 
        variant="outline"
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>

      <div className="max-w-4xl mx-auto">
        <div className="bg-[#082151] rounded-[24px] shadow-md p-6 md:p-8 mb-8 flex justify-between items-center relative overflow-hidden text-white border-0">
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Envoyer une notification</h1>
            <p className="text-slate-200 mt-1 text-sm md:text-base">Envoyez des notifications aux utilisateurs de la plateforme</p>
          </div>
          <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#2b4eef]/20 to-[#df6422]/20 rounded-full blur-3xl -mr-16 -mt-16 z-0 pointer-events-none"></div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Type de notification */}
              <Card>
                <h3 className="text-lg font-semibold mb-4">Type de notification</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'info', label: 'Info', color: 'blue' },
                    { value: 'success', label: 'Succès', color: 'green' },
                    { value: 'warning', label: 'Attention', color: 'yellow' },
                    { value: 'error', label: 'Erreur', color: 'red' }
                  ].map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.type === type.value
                          ? `border-${type.color}-500 bg-${type.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Templates */}
              <Card>
                <h3 className="text-lg font-semibold mb-4">Modèles de messages rapides</h3>
                <div className="flex flex-wrap gap-2">
                  {templates.map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className="px-3 py-1.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors border border-gray-300"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Contenu */}
              <Card>
                <h3 className="text-lg font-semibold mb-4">Contenu</h3>
                <div className="space-y-4">
                  <Input
                    label="Titre *"
                    value={formData.titre}
                    onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                    placeholder="Ex: Nouvelle fonctionnalité disponible"
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows="6"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Écrivez votre message..."
                      required
                    />
                  </div>
                </div>
              </Card>

              {/* Options du bouton (Notification & Email) */}
              <Card>
                <h3 className="text-lg font-semibold mb-4">Action (Lien / Bouton)</h3>
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="bouton_type"
                        value="mon_compte"
                        checked={formData.bouton_type === 'mon_compte'}
                        onChange={(e) => setFormData({ ...formData, bouton_type: e.target.value })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Mon compte (Défaut)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="bouton_type"
                        value="autre"
                        checked={formData.bouton_type === 'autre'}
                        onChange={(e) => setFormData({ ...formData, bouton_type: e.target.value })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Lien personnalisé</span>
                    </label>
                  </div>

                  {formData.bouton_type === 'autre' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Texte de l'action</label>
                        <input
                          type="text"
                          value={formData.bouton_texte}
                          onChange={(e) => setFormData({ ...formData, bouton_texte: e.target.value })}
                          placeholder="Ex: Voir l'offre"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                          required={formData.bouton_type === 'autre'}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">URL (Lien complet)</label>
                        <input
                          type="url"
                          value={formData.bouton_url}
                          onChange={(e) => setFormData({ ...formData, bouton_url: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                          required={formData.bouton_type === 'autre'}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Destinataires */}
              <Card>
                <h3 className="text-lg font-semibold mb-4">Destinataires</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Envoyer à
                    </label>
                    <select
                      value={formData.destinataires}
                      onChange={(e) => setFormData({ ...formData, destinataires: e.target.value, user_ids: [] })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="tous">Tous les utilisateurs</option>
                      <option value="employers">Entreprises uniquement</option>
                      <option value="freelancers">Indépendants uniquement</option>
                      <option value="specifiques">Utilisateurs spécifiques</option>
                    </select>
                  </div>

                  {formData.destinataires === 'specifiques' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Sélectionnez les utilisateurs ({formData.user_ids.length} sélectionné{formData.user_ids.length > 1 ? 's' : ''})
                      </label>
                      <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                        {users.map(user => (
                          <label
                            key={user.id}
                            className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.user_ids.includes(user.id)}
                              onChange={() => toggleUser(user.id)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {user.role === 'employer' ? user.denomination || `${user.prenom} ${user.nom}` : `${user.prenom} ${user.nom}`}
                              </p>
                              <p className="text-xs text-gray-500">{user.email} - {user.role === 'employer' ? 'Entreprise' : 'Indépendant'}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Option email */}
                  <label className="flex items-center p-4 bg-blue-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.envoyer_email}
                      onChange={(e) => setFormData({ ...formData, envoyer_email: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <Mail className="h-5 w-5 text-blue-600 mx-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Envoyer aussi par email</p>
                      <p className="text-xs text-gray-600">Les utilisateurs recevront également un email</p>
                    </div>
                  </label>
                </div>
              </Card>
            </div>

            {/* Résumé */}
            <div>
              <Card className="sticky top-6">
                <h3 className="text-lg font-semibold mb-4">Résumé</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    {formData.destinataires === 'tous' && <Users className="h-5 w-5 text-gray-600" />}
                    {formData.destinataires === 'employers' && <Briefcase className="h-5 w-5 text-gray-600" />}
                    {formData.destinataires === 'freelancers' && <User className="h-5 w-5 text-gray-600" />}
                    {formData.destinataires === 'specifiques' && <Users className="h-5 w-5 text-gray-600" />}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formData.destinataires === 'tous' && 'Tous les utilisateurs'}
                        {formData.destinataires === 'employers' && 'Entreprises'}
                        {formData.destinataires === 'freelancers' && 'Indépendants'}
                        {formData.destinataires === 'specifiques' && `${formData.user_ids.length} utilisateur(s)`}
                      </p>
                      <p className="text-xs text-gray-600">
                        {filteredUsers.length} destinataire{filteredUsers.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {formData.envoyer_email && (
                    <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-900">+ Email</span>
                    </div>
                  )}

                  <div className="pt-4 border-t space-y-3">
                    <Button type="submit" loading={loading} className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer la notification
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate('/admin/dashboard')}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminSendNotification

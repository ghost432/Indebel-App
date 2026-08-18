import { useState, useEffect } from 'react'
import { Send, Users, Mail, ArrowLeft, Plus, Image as ImageIcon, Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import PageLoader from '../components/PageLoader'
import Badge from '../components/Badge'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'
import { userService } from '../services/userService'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

const AdminNewsletter = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [newsletters, setNewsletters] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sending, setSending] = useState(false)
  
  const [users, setUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  
  const [formData, setFormData] = useState({
    sujet: '',
    contenu: '',
    image_url: '',
    destinataires: 'tous', // 'tous', 'freelancers', 'employers', 'specific'
    user_id: ''
  })

  useEffect(() => {
    document.title = 'Newsletters - Admin'
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      const [newsRes, usersRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/notifications/newsletters`, { headers: { Authorization: `Bearer ${token}` } }),
        userService.getAllUsers()
      ])
      
      setNewsletters((newsRes.data?.data || newsRes.data))
      setUsers((usersRes.data?.data || usersRes.data))
    } catch (error) {
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("L'image ne doit pas dépasser 5MB")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({...prev, image_url: reader.result}))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.sujet || !formData.contenu) {
      return toast.error('Sujet et contenu requis')
    }
    
    if (formData.destinataires === 'specific' && !formData.user_id) {
      return toast.error('Veuillez sélectionner un utilisateur spécifique')
    }

    setSending(true)
    try {
      const token = localStorage.getItem('token')
      
      const response = await axios.post(`${API_BASE_URL}/notifications/send-newsletter`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success(response.data.message || 'Newsletter envoyée avec succès')
      
      setIsModalOpen(false)
      setFormData({
        sujet: '',
        contenu: '',
        image_url: '',
        destinataires: 'tous',
        user_id: ''
      })
      fetchData() // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi')
    } finally {
      setSending(false)
    }
  }

  const getDestinatairesBadge = (dest) => {
    switch (dest) {
      case 'tous': return <Badge variant="primary">Tous les utilisateurs</Badge>
      case 'freelancers': return <Badge variant="info">Prestataires</Badge>
      case 'employers': return <Badge variant="warning">Recruteurs</Badge>
      case 'specific': return <Badge variant="secondary">Utilisateur spécifique</Badge>
      default: return <Badge>{dest}</Badge>
    }
  }

  const filteredUsers = users.filter(u => 
    (u.prenom?.toLowerCase() || '').includes(userSearch.toLowerCase()) ||
    (u.nom?.toLowerCase() || '').includes(userSearch.toLowerCase()) ||
    (u.email?.toLowerCase() || '').includes(userSearch.toLowerCase())
  )

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  }

  const totalPages = Math.ceil(newsletters.length / itemsPerPage)
  const currentNewsletters = newsletters.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  if (loading) return <PageLoader fullScreen />

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-[#082151] rounded-[24px] shadow-md p-6 md:p-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden text-white border-0">
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-white/10 text-white rounded-2xl hidden sm:block">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Newsletters</h1>
            <p className="text-slate-200 mt-1 text-sm md:text-base">Gérez et envoyez des emails de masse à vos utilisateurs.</p>
          </div>
        </div>
        <div className="relative z-10 flex space-x-3">
          <Button className="bg-white/10 hover:bg-white/20 text-white border-white/20" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <Button className="bg-[#df6422] hover:bg-[#c9571b] text-white border-0" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Créer Newsletter
          </Button>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#2b4eef]/20 to-[#df6422]/20 rounded-full blur-3xl -mr-16 -mt-16 z-0 pointer-events-none"></div>
      </div>

      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Historique des newsletters</h3>
        {newsletters.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucune newsletter n'a encore été envoyée.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentNewsletters.map(nl => (
              <div key={nl.id} className="border border-gray-100 rounded-xl p-5 hover:border-primary-100 hover:shadow-sm transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg mb-1">{nl.sujet}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(nl.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit'
                        })}
                      </span>
                      <span>{getDestinatairesBadge(nl.destinataires)}</span>
                    </div>
                  </div>
                  {nl.image_url && (
                    <div className="shrink-0 ml-4">
                      <img src={nl.image_url} alt="Aperçu" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                    </div>
                  )}
                </div>
                <div className="mt-3 bg-gray-50 p-4 rounded-lg text-sm text-gray-700 line-clamp-3">
                  {nl.contenu}
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 pt-6 mt-6">
                <p className="text-sm text-gray-500">
                  Affichage de <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> à <span className="font-medium">{Math.min(currentPage * itemsPerPage, newsletters.length)}</span> sur <span className="font-medium">{newsletters.length}</span> résultats
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !sending && setIsModalOpen(false)}
        title="Créer et Envoyer une Newsletter"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Destinataires *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, destinataires: 'tous'}))}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                    formData.destinataires === 'tous' 
                      ? 'border-primary-500 bg-primary-50 text-primary-700' 
                      : 'border-gray-200 hover:border-primary-200'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  <span className="font-semibold text-xs">Tous</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, destinataires: 'freelancers'}))}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                    formData.destinataires === 'freelancers' 
                      ? 'border-primary-500 bg-primary-50 text-primary-700' 
                      : 'border-gray-200 hover:border-primary-200'
                  }`}
                >
                  <User className="h-5 w-5" />
                  <span className="font-semibold text-xs">Prestataires</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, destinataires: 'employers'}))}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                    formData.destinataires === 'employers' 
                      ? 'border-primary-500 bg-primary-50 text-primary-700' 
                      : 'border-gray-200 hover:border-primary-200'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  <span className="font-semibold text-xs">Recruteurs</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, destinataires: 'specific'}))}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                    formData.destinataires === 'specific' 
                      ? 'border-primary-500 bg-primary-50 text-primary-700' 
                      : 'border-gray-200 hover:border-primary-200'
                  }`}
                >
                  <Mail className="h-5 w-5" />
                  <span className="font-semibold text-xs">Spécifique</span>
                </button>
              </div>
            </div>

            {formData.destinataires === 'specific' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Sélectionner l'utilisateur *</label>
                <input
                  type="text"
                  placeholder="Rechercher par nom, email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData(prev => ({...prev, user_id: e.target.value}))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mt-2"
                  size={4}
                  required
                >
                  <option value="" disabled>Sélectionnez un utilisateur...</option>
                  {filteredUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.prenom} {u.nom} ({u.email}) - {u.role}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Input
              label="Sujet de l'email *"
              value={formData.sujet}
              onChange={(e) => setFormData(prev => ({...prev, sujet: e.target.value}))}
              placeholder="Ex: Nouveautés sur la plateforme..."
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image (Optionnel)</label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {formData.image_url && (
                  <Button variant="danger" size="sm" onClick={() => setFormData(prev => ({...prev, image_url: ''}))}>
                    Retirer l'image
                  </Button>
                )}
              </div>
              {formData.image_url && (
                <div className="mt-3">
                  <img src={formData.image_url} alt="Aperçu" className="h-32 object-contain rounded-lg border border-gray-200" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contenu de la newsletter (HTML supporté) *</label>
              <div className="bg-white rounded-xl">
                <ReactQuill 
                  theme="snow" 
                  value={formData.contenu} 
                  onChange={(val) => setFormData(prev => ({...prev, contenu: val}))} 
                  modules={modules}
                  className="h-48 mb-12"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={sending}>
              Annuler
            </Button>
            <Button type="submit" loading={sending}>
              <Send className="h-4 w-4 mr-2" />
              Envoyer la newsletter
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default AdminNewsletter

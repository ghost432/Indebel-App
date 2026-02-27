import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, Globe } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const AdminLangues = () => {
  const [langues, setLangues] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, data: null })

  useEffect(() => {
    document.title = 'Langues - Admin'
    fetchLangues()
  }, [])

  const fetchLangues = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/admin/langues`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setLangues(response.data.data || [])
    } catch (error) {
      // Si l'API n'existe pas encore, utiliser données par défaut
      setLangues([
        { id: 1, nom: 'Français', code: 'FR', actif: 1 },
        { id: 2, nom: 'Néerlandais', code: 'NL', actif: 1 },
        { id: 3, nom: 'Anglais', code: 'EN', actif: 1 },
        { id: 4, nom: 'Allemand', code: 'DE', actif: 1 },
        { id: 5, nom: 'Espagnol', code: 'ES', actif: 1 },
        { id: 6, nom: 'Italien', code: 'IT', actif: 1 },
        { id: 7, nom: 'Portugais', code: 'PT', actif: 1 },
        { id: 8, nom: 'Arabe', code: 'AR', actif: 1 },
        { id: 9, nom: 'Chinois', code: 'ZH', actif: 1 },
        { id: 10, nom: 'Japonais', code: 'JA', actif: 1 }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const data = {
      nom: fd.get('nom'),
      code: fd.get('code'),
      actif: fd.get('actif') ? 1 : 0
    }

    try {
      const token = localStorage.getItem('token')
      if (modal.data?.id) {
        await axios.put(`${API_BASE_URL}/admin/langues/${modal.data.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success('Langue modifiée')
      } else {
        await axios.post(`${API_BASE_URL}/admin/langues`, data, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success('Langue créée')
      }
      setModal({ open: false, data: null })
      fetchLangues()
    } catch (error) {
      toast.error('Erreur sauvegarde')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette langue ?')) return
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_BASE_URL}/admin/langues/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Langue supprimée')
      fetchLangues()
    } catch (error) {
      toast.error('Erreur suppression')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Langues</h1>
        <Button onClick={() => setModal({ open: true, data: null })}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle langue
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {langues.map((langue) => (
                <tr key={langue.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Globe className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{langue.nom}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{langue.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      langue.actif === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {langue.actif === 1 ? 'Active' : 'Désactivée'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setModal({ open: true, data: langue })}
                      className="mr-2"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(langue.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, data: null })}
        title={modal.data ? 'Modifier la langue' : 'Nouvelle langue'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nom de la langue *"
            name="nom"
            defaultValue={modal.data?.nom}
            placeholder="Ex: Français"
            required
          />

          <Input
            label="Code (ISO 639-1) *"
            name="code"
            defaultValue={modal.data?.code}
            placeholder="Ex: FR"
            maxLength="2"
            required
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              name="actif"
              id="actif"
              defaultChecked={modal.data?.actif !== 0}
              className="rounded border-gray-300 text-primary-600"
            />
            <label htmlFor="actif" className="ml-2 text-sm text-gray-700">Active</label>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setModal({ open: false, data: null })}>
              Annuler
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default AdminLangues

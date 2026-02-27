import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const AdminSecteurs = () => {
  const [secteurs, setSecteurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalSecteur, setModalSecteur] = useState({ open: false, data: null })
  const [modalCompetence, setModalCompetence] = useState({ open: false, data: null, secteurId: null })
  const [expandedSecteur, setExpandedSecteur] = useState(null)

  useEffect(() => {
    document.title = 'Secteurs & Compétences - Admin'
    fetchSecteurs()
  }, [])

  const fetchSecteurs = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/secteurs/with-competences`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSecteurs(response.data.data)
    } catch (error) {
      toast.error('Erreur chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSecteur = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const data = {
      nom: fd.get('nom'),
      description: fd.get('description'),
      ordre: parseInt(fd.get('ordre')) || 0,
      actif: fd.get('actif') ? 1 : 0
    }

    try {
      const token = localStorage.getItem('token')
      if (modalSecteur.data?.id) {
        await axios.put(`${API_BASE_URL}/secteurs/${modalSecteur.data.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success('Secteur modifié')
      } else {
        await axios.post(`${API_BASE_URL}/secteurs`, data, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success('Secteur créé')
      }
      setModalSecteur({ open: false, data: null })
      fetchSecteurs()
    } catch (error) {
      toast.error('Erreur sauvegarde')
    }
  }

  const handleDeleteSecteur = async (id) => {
    if (!confirm('Supprimer ce secteur et ses compétences ?')) return
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_BASE_URL}/secteurs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Secteur supprimé')
      fetchSecteurs()
    } catch (error) {
      toast.error('Erreur suppression')
    }
  }

  const handleSaveCompetence = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const data = {
      secteur_id: modalCompetence.secteurId,
      nom: fd.get('nom'),
      ordre: parseInt(fd.get('ordre')) || 0,
      actif: fd.get('actif') ? 1 : 0
    }

    try {
      const token = localStorage.getItem('token')
      if (modalCompetence.data?.id) {
        await axios.put(`${API_BASE_URL}/secteurs/competences/${modalCompetence.data.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success('Compétence modifiée')
      } else {
        await axios.post(`${API_BASE_URL}/secteurs/competences`, data, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success('Compétence créée')
      }
      setModalCompetence({ open: false, data: null, secteurId: null })
      fetchSecteurs()
    } catch (error) {
      toast.error('Erreur sauvegarde')
    }
  }

  const handleDeleteCompetence = async (id) => {
    if (!confirm('Supprimer cette compétence ?')) return
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_BASE_URL}/secteurs/competences/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Compétence supprimée')
      fetchSecteurs()
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
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Secteurs & Compétences</h1>
        <Button onClick={() => setModalSecteur({ open: true, data: null })}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau secteur
        </Button>
      </div>

      <div className="space-y-4">
        {secteurs.map((secteur) => (
          <Card key={secteur.id}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <button
                  onClick={() => setExpandedSecteur(expandedSecteur === secteur.id ? null : secteur.id)}
                  className="text-2xl font-bold text-gray-900 hover:text-primary-600"
                >
                  {expandedSecteur === secteur.id ? '▼' : '▶'} {secteur.nom}
                </button>
                {secteur.actif === 0 && (
                  <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Désactivé</span>
                )}
                {secteur.description && (
                  <p className="text-gray-600 mt-1 text-sm">{secteur.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Ordre: {secteur.ordre} | {secteur.competences?.length || 0} compétences
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setModalSecteur({ open: true, data: secteur })}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDeleteSecteur(secteur.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {expandedSecteur === secteur.id && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-900">Compétences</h3>
                  <Button
                    size="sm"
                    onClick={() => setModalCompetence({ open: true, data: null, secteurId: secteur.id })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {secteur.competences?.map((comp) => (
                    <div key={comp.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                      <span>
                        {comp.ordre}. {comp.nom}
                        {comp.actif === 0 && <span className="ml-1 text-xs text-red-600">(désactivé)</span>}
                      </span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setModalCompetence({ open: true, data: comp, secteurId: secteur.id })}
                          className="p-1 hover:bg-white rounded"
                        >
                          <Edit className="h-3 w-3 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteCompetence(comp.id)}
                          className="p-1 hover:bg-white rounded"
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Modal Secteur */}
      <Modal
        isOpen={modalSecteur.open}
        onClose={() => setModalSecteur({ open: false, data: null })}
        title={modalSecteur.data ? 'Modifier le secteur' : 'Nouveau secteur'}
      >
        <form onSubmit={handleSaveSecteur} className="space-y-4">
          <Input
            label="Nom du secteur *"
            name="nom"
            defaultValue={modalSecteur.data?.nom}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              defaultValue={modalSecteur.data?.description}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Input
            label="Ordre"
            name="ordre"
            type="number"
            defaultValue={modalSecteur.data?.ordre || 0}
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              name="actif"
              id="actif"
              defaultChecked={modalSecteur.data?.actif !== 0}
              className="rounded border-gray-300 text-primary-600"
            />
            <label htmlFor="actif" className="ml-2 text-sm text-gray-700">Actif</label>
          </div>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setModalSecteur({ open: false, data: null })}>
              Annuler
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Compétence */}
      <Modal
        isOpen={modalCompetence.open}
        onClose={() => setModalCompetence({ open: false, data: null, secteurId: null })}
        title={modalCompetence.data ? 'Modifier la compétence' : 'Nouvelle compétence'}
      >
        <form onSubmit={handleSaveCompetence} className="space-y-4">
          <Input
            label="Nom de la compétence *"
            name="nom"
            defaultValue={modalCompetence.data?.nom}
            required
          />
          <Input
            label="Ordre"
            name="ordre"
            type="number"
            defaultValue={modalCompetence.data?.ordre || 0}
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              name="actif"
              id="comp-actif"
              defaultChecked={modalCompetence.data?.actif !== 0}
              className="rounded border-gray-300 text-primary-600"
            />
            <label htmlFor="comp-actif" className="ml-2 text-sm text-gray-700">Actif</label>
          </div>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setModalCompetence({ open: false, data: null, secteurId: null })}>
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

export default AdminSecteurs

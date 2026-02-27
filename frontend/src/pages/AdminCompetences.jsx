import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, Filter } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const AdminCompetences = () => {
  const [competences, setCompetences] = useState([])
  const [secteurs, setSecteurs] = useState([])
  const [filteredCompetences, setFilteredCompetences] = useState([])
  const [selectedSecteur, setSelectedSecteur] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, data: null })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    document.title = 'Compétences - Admin'
    fetchData()
  }, [])

  useEffect(() => {
    filterCompetences()
  }, [selectedSecteur, searchTerm, competences])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/secteurs/with-competences`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const secteursData = response.data.data
      setSecteurs(secteursData)

      // Flatten all competences with secteur info
      const allComp = []
      secteursData.forEach(secteur => {
        secteur.competences?.forEach(comp => {
          allComp.push({
            ...comp,
            secteur_nom: secteur.nom,
            secteur_id: secteur.id
          })
        })
      })
      setCompetences(allComp)
      setFilteredCompetences(allComp)
    } catch (error) {
      toast.error('Erreur chargement')
    } finally {
      setLoading(false)
    }
  }

  const filterCompetences = () => {
    let filtered = competences

    if (selectedSecteur) {
      filtered = filtered.filter(c => c.secteur_id === parseInt(selectedSecteur))
    }

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.nom.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredCompetences(filtered)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const data = {
      secteur_id: parseInt(fd.get('secteur_id')),
      nom: fd.get('nom'),
      ordre: parseInt(fd.get('ordre')) || 0,
      actif: fd.get('actif') ? 1 : 0
    }

    try {
      const token = localStorage.getItem('token')
      if (modal.data?.id) {
        await axios.put(`${API_BASE_URL}/secteurs/competences/${modal.data.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success('Compétence modifiée')
      } else {
        await axios.post(`${API_BASE_URL}/secteurs/competences`, data, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success('Compétence créée')
      }
      setModal({ open: false, data: null })
      fetchData()
    } catch (error) {
      toast.error('Erreur sauvegarde')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette compétence ?')) return
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_BASE_URL}/secteurs/competences/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Compétence supprimée')
      fetchData()
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
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Compétences</h1>
        <Button onClick={() => setModal({ open: true, data: null })}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle compétence
        </Button>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="h-4 w-4 inline mr-1" />
              Filtrer par secteur
            </label>
            <select
              value={selectedSecteur}
              onChange={(e) => setSelectedSecteur(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tous les secteurs</option>
              {secteurs.map(s => (
                <option key={s.id} value={s.id}>{s.nom} ({s.competences?.length || 0})</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
            <input
              type="text"
              placeholder="Rechercher une compétence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-600">{competences.length}</p>
            <p className="text-sm text-gray-600">Total compétences</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{competences.filter(c => c.actif === 1).length}</p>
            <p className="text-sm text-gray-600">Actives</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600">{competences.filter(c => c.actif === 0).length}</p>
            <p className="text-sm text-gray-600">Désactivées</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{filteredCompetences.length}</p>
            <p className="text-sm text-gray-600">Affichées</p>
          </div>
        </Card>
      </div>

      {/* Liste des compétences */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ordre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compétence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Secteur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCompetences.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    Aucune compétence trouvée
                  </td>
                </tr>
              ) : (
                filteredCompetences
                  .sort((a, b) => a.secteur_nom.localeCompare(b.secteur_nom) || a.ordre - b.ordre)
                  .map((comp) => (
                    <tr key={comp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{comp.ordre}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{comp.nom}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {comp.secteur_nom}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${comp.actif === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {comp.actif === 1 ? 'Active' : 'Désactivée'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setModal({ open: true, data: comp })}
                          className="mr-2"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(comp.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, data: null })}
        title={modal.data ? 'Modifier la compétence' : 'Nouvelle compétence'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Secteur *</label>
            <select
              name="secteur_id"
              defaultValue={modal.data?.secteur_id || ''}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Sélectionner un secteur</option>
              {secteurs.map(s => (
                <option key={s.id} value={s.id}>{s.nom}</option>
              ))}
            </select>
          </div>

          <Input
            label="Nom de la compétence *"
            name="nom"
            defaultValue={modal.data?.nom}
            required
          />

          <Input
            label="Ordre"
            name="ordre"
            type="number"
            defaultValue={modal.data?.ordre || 0}
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

export default AdminCompetences

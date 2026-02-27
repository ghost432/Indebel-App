import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, FileText } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const AdminTypeMission = () => {
  const [types, setTypes] = useState([
    { id: 1, nom: 'Forfait Horaire', description: 'Mission facturée à l\'heure', actif: 1 },
    { id: 2, nom: 'Forfait Fixe', description: 'Mission avec un prix fixe global', actif: 1 }
  ])
  const [modal, setModal] = useState({ open: false, data: null })

  useEffect(() => {
    document.title = 'Types de Mission - Admin'
  }, [])

  const handleSave = (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const data = {
      id: modal.data?.id || Date.now(),
      nom: fd.get('nom'),
      description: fd.get('description'),
      actif: fd.get('actif') ? 1 : 0
    }

    if (modal.data?.id) {
      setTypes(types.map(t => t.id === modal.data.id ? data : t))
      toast.success('Type de mission modifié')
    } else {
      setTypes([...types, data])
      toast.success('Type de mission créé')
    }
    setModal({ open: false, data: null })
  }

  const handleDelete = (id) => {
    if (!confirm('Supprimer ce type de mission ?')) return
    setTypes(types.filter(t => t.id !== id))
    toast.success('Type de mission supprimé')
  }

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Types de Mission</h1>
        <Button onClick={() => setModal({ open: true, data: null })}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau type
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {types.map((type) => (
                <tr key={type.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-purple-500 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{type.nom}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{type.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      type.actif === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {type.actif === 1 ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setModal({ open: true, data: type })}
                      className="mr-2"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(type.id)}
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
        title={modal.data ? 'Modifier le type de mission' : 'Nouveau type de mission'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nom *"
            name="nom"
            defaultValue={modal.data?.nom}
            placeholder="Ex: Forfait Horaire"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              defaultValue={modal.data?.description}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Description du type de mission..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="actif"
              id="actif"
              defaultChecked={modal.data?.actif !== 0}
              className="rounded border-gray-300 text-primary-600"
            />
            <label htmlFor="actif" className="ml-2 text-sm text-gray-700">Actif</label>
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

export default AdminTypeMission

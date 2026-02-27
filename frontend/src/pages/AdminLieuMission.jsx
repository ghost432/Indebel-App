import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, MapPin } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const AdminLieuMission = () => {
  const [lieux, setLieux] = useState([
    { id: 1, value: 'site_entreprise', nom: 'Sur site', description: 'La mission se déroule sur le site de l\'entreprise cliente', comportement: 'simple', actif: 1 },
    { id: 2, value: 'autre_site', nom: 'Sur un autre site', description: 'La mission se déroule sur un autre site (lieu à préciser)', comportement: 'conditionnel', actif: 1 }
  ])
  const [modal, setModal] = useState({ open: false, data: null })
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null })

  useEffect(() => {
    document.title = 'Lieux de Mission - Admin'
  }, [])

  const handleSave = (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)

    // Générer une valeur unique à partir du nom
    const nom = fd.get('nom')
    const value = modal.data?.value || nom.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Retirer accents
      .replace(/[^a-z0-9]+/g, '_') // Remplacer caractères spéciaux par _
      .replace(/^_+|_+$/g, '') // Retirer _ au début/fin

    const data = {
      id: modal.data?.id || Date.now(),
      value: value,
      nom: nom,
      description: fd.get('description'),
      comportement: fd.get('comportement'),
      actif: fd.get('actif') ? 1 : 0
    }

    if (modal.data?.id) {
      setLieux(lieux.map(l => l.id === modal.data.id ? data : l))
      toast.success('Lieu de mission modifié')
    } else {
      setLieux([...lieux, data])
      toast.success('Lieu de mission créé')
    }
    setModal({ open: false, data: null })
  }

  const handleDelete = () => {
    setLieux(lieux.filter(l => l.id !== deleteModal.id))
    toast.success('Lieu de mission supprimé')
    setDeleteModal({ open: false, id: null })
  }

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Lieux de Mission</h1>
          <p className="text-gray-600 text-sm">Ces options sont utilisées dans les formulaires de publication de mission.</p>
        </div>
        <Button onClick={() => setModal({ open: true, data: null })}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau lieu
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valeur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom affiché</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comportement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lieux.map((lieu) => (
                <tr key={lieu.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">{lieu.value}</code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{lieu.nom}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lieu.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {lieu.comportement === 'simple' && (
                      <span className="text-blue-600">✓ Sélection simple</span>
                    )}
                    {lieu.comportement === 'conditionnel' && (
                      <span className="text-orange-600">🔽 Champ conditionnel</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${lieu.actif === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {lieu.actif === 1 ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setModal({ open: true, data: lieu })}
                      className="mr-2"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteModal({ open: true, id: lieu.id })}
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

      <Card className="mt-8">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Types de comportement</h3>
          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex items-start">
              <span className="text-2xl mr-3">✓</span>
              <div>
                <p className="font-medium text-gray-900">Sélection simple</p>
                <p>L'utilisateur sélectionne cette option et c'est terminé. Aucun champ supplémentaire n'apparaît.</p>
                <p className="text-xs text-gray-500 mt-1">Exemple: "Sur site"</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">🔽</span>
              <div>
                <p className="font-medium text-gray-900">Champ conditionnel</p>
                <p>Quand l'utilisateur sélectionne cette option, un champ supplémentaire apparaît pour qu'il précise des informations (avec autocomplétion Mapbox pour les adresses).</p>
                <p className="text-xs text-gray-500 mt-1">Exemple: "Sur un autre site" → Affiche "Précisez le lieu"</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal ajout/modification */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, data: null })}
        title={modal.data ? 'Modifier le lieu de mission' : 'Nouveau lieu de mission'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nom du lieu *"
            name="nom"
            defaultValue={modal.data?.nom}
            placeholder="Ex: Sur site"
            required
          />

          {modal.data?.value && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valeur technique</label>
              <code className="block px-4 py-3 bg-gray-100 text-gray-800 rounded-lg text-sm">
                {modal.data.value}
              </code>
              <p className="text-xs text-gray-500 mt-1">Cette valeur est utilisée dans le code</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              defaultValue={modal.data?.description}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Description du lieu de mission..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Comportement *</label>
            <select
              name="comportement"
              defaultValue={modal.data?.comportement || 'simple'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="simple">✓ Sélection simple (pas de champ supplémentaire)</option>
              <option value="conditionnel">🔽 Champ conditionnel (affiche un champ pour préciser)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Définit si un champ supplémentaire doit apparaître quand cette option est sélectionnée
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="actif"
              id="actif"
              defaultChecked={modal.data?.actif !== 0}
              className="rounded border-gray-300 text-primary-600"
            />
            <label htmlFor="actif" className="ml-2 text-sm text-gray-700">Actif (visible dans les formulaires)</label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
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

      {/* Modal confirmation suppression */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        title="Confirmer la suppression"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Êtes-vous sûr de vouloir supprimer ce lieu de mission ? Cette action est irréversible.
        </p>
        <div className="flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={() => setDeleteModal({ open: false, id: null })}
          >
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default AdminLieuMission

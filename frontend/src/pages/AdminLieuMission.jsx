import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, MapPin, CheckCircle2, ChevronDownCircle } from 'lucide-react'
import Card from '../components/Card'
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const AdminLieuMission = () => {
  const [lieux, setLieux] = useState([
    { id: 1, value: 'site_entreprise', nom: 'Sur le site de l\'entreprise', description: 'La mission se déroule sur le site de l\'entreprise cliente', comportement: 'simple', actif: 1 },
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

  const { currentItems, currentPage, totalPages, goToPage, totalItems } = usePagination(lieux, 12)

  return (
    <div className="py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#082151] mb-2">Lieux de Mission</h1>
          <p className="text-slate-500 text-sm">Ces options sont utilisées dans les formulaires de publication de mission.</p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-slate-200/60 shadow-sm">
            <MapPin className="h-5 w-5 text-indigo-500" />
            <span className="text-lg font-bold text-[#082151]">{lieux.length}</span>
          </div>
          <Button onClick={() => setModal({ open: true, data: null })} className="flex-1 sm:flex-none justify-center bg-[#2A4DEF] hover:bg-[#1a38c2] shadow-md hover:shadow-lg transition-all rounded-xl py-2">
            <Plus className="h-5 w-5 mr-2" />
            Nouveau lieu
          </Button>
        </div>
      </div>

      {lieux.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <MapPin className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#082151] mb-2">Aucun lieu trouvé</h3>
          <p className="text-slate-500">Commencez par ajouter un lieu de mission.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentItems.map((lieu) => (
            <Card key={lieu.id} className="hover:shadow-lg transition-all duration-200 border-transparent hover:border-indigo-100 p-0 overflow-hidden flex flex-col group relative">
              <div className="absolute top-4 right-4">
                <code className="px-2 py-1 bg-slate-100 text-slate-600 font-mono text-[10px] font-bold rounded-md border border-slate-200">
                  {lieu.value}
                </code>
              </div>
              <div className="p-5 sm:p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 text-indigo-600 h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#082151] text-lg leading-tight group-hover:text-indigo-600 transition-colors pr-16">{lieu.nom}</h3>
                      {lieu.actif === 1 ? (
                        <span className="inline-flex mt-1 items-center shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">Actif</span>
                      ) : (
                        <span className="inline-flex mt-1 items-center shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">Désactivé</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 mb-3 bg-slate-50 rounded-lg p-2.5 border border-slate-100 flex items-center gap-2">
                  {lieu.comportement === 'simple' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-semibold text-slate-600">Sélection simple</span>
                    </>
                  ) : (
                    <>
                      <ChevronDownCircle className="h-4 w-4 text-orange-500" />
                      <span className="text-xs font-semibold text-slate-600">Champ conditionnel</span>
                    </>
                  )}
                </div>

                <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                  {lieu.description || 'Aucune description fournie.'}
                </p>
              </div>
              <div className="bg-slate-50/50 border-t border-slate-100 p-3 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setModal({ open: true, data: lieu })}
                  className="bg-white border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm px-3"
                >
                  <Edit className="h-4 w-4 mr-1.5" />
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteModal({ open: true, id: lieu.id })}
                  className="bg-white border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 shadow-sm px-3"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Supprimer
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            itemsPerPage={12}
            totalItems={totalItems}
          />
        </div>
      )}

      <Card className="mt-8 border-indigo-100 bg-indigo-50/30">
        <div className="p-4 sm:p-6">
          <h3 className="text-lg font-bold text-[#082151] mb-4 flex items-center">
            <span className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg mr-2">📋</span>
            Types de comportement
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <CheckCircle2 className="h-6 w-6 text-blue-500 mr-3 shrink-0" />
              <div>
                <p className="font-bold text-[#082151] mb-1">Sélection simple</p>
                <p className="text-slate-500 leading-relaxed mb-2">L'utilisateur sélectionne cette option et c'est terminé. Aucun champ supplémentaire n'apparaît.</p>
                <p className="text-xs font-medium text-indigo-600 bg-indigo-50 inline-block px-2 py-1 rounded">Exemple: "Sur le site de l'entreprise"</p>
              </div>
            </div>
            <div className="flex items-start bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <ChevronDownCircle className="h-6 w-6 text-orange-500 mr-3 shrink-0" />
              <div>
                <p className="font-bold text-[#082151] mb-1">Champ conditionnel</p>
                <p className="text-slate-500 leading-relaxed mb-2">Quand l'utilisateur sélectionne cette option, un champ supplémentaire apparaît pour qu'il précise des informations.</p>
                <p className="text-xs font-medium text-indigo-600 bg-indigo-50 inline-block px-2 py-1 rounded break-words w-full">Exemple: "Sur un autre site" → Affiche "Précisez le lieu"</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal ajout/modification */}
      {/* Modal ajout/modification */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, data: null })}
        title={
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <MapPin className="h-5 w-5" />
            </div>
            <span>{modal.data ? 'Modifier le lieu' : 'Nouveau lieu de mission'}</span>
          </div>
        }
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-5 pt-2">
          <Input
            label="Nom du lieu *"
            name="nom"
            defaultValue={modal.data?.nom}
            placeholder="Ex: Sur le site de l'entreprise"
            className="bg-slate-50 focus:bg-white transition-colors"
            required
          />

          {modal.data?.value && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Valeur technique</label>
              <code className="block text-[#082151] font-mono font-bold text-sm">
                {modal.data.value}
              </code>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#082151] mb-2">Description</label>
            <textarea
              name="description"
              defaultValue={modal.data?.description}
              rows="2"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#2A4DEF] focus:ring-4 focus:ring-[#2A4DEF]/10 transition-all resize-none text-sm"
              placeholder="Description du lieu de mission..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-[#082151] mb-2">Comportement *</label>
              <div className="relative">
                <select
                  name="comportement"
                  defaultValue={modal.data?.comportement || 'simple'}
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#2A4DEF] focus:ring-4 focus:ring-[#2A4DEF]/10 transition-all text-sm font-medium text-[#082151] appearance-none"
                  required
                >
                  <option value="simple">Sélection simple (Check)</option>
                  <option value="conditionnel">Champ conditionnel (Déroulant)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                  <ChevronDownCircle className="h-5 w-5" />
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-end min-w-[140px]">
              <label className="flex items-center cursor-pointer p-3 rounded-xl border border-slate-200 hover:border-[#2A4DEF] bg-slate-50 hover:bg-white transition-all w-full h-[46px]">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="actif"
                    id="actif"
                    defaultChecked={modal.data?.actif !== 0}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </div>
                <span className="ml-3 text-sm font-semibold text-[#082151]">Actif</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setModal({ open: false, data: null })} className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50">
              Annuler
            </Button>
            <Button type="submit" className="bg-[#2A4DEF] hover:bg-[#1a38c2] shadow-md hover:shadow-lg transition-all">
              <Save className="h-4 w-4 mr-2" />
              {modal.data ? 'Mettre à jour' : 'Ajouter'}
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

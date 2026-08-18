import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, FileText } from 'lucide-react'
import Card from '../components/Card'
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
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

  const { currentItems, currentPage, totalPages, goToPage, totalItems } = usePagination(types, 12)

  return (
    <div className="py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#082151]">Types de Mission</h1>
          <p className="text-slate-500 mt-1">Gérez les modalités de contrat (Forfait, Taux horaire, etc.)</p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-slate-200/60 shadow-sm">
            <FileText className="h-5 w-5 text-indigo-500" />
            <span className="text-lg font-bold text-[#082151]">{types.length}</span>
          </div>
          <Button onClick={() => setModal({ open: true, data: null })} className="flex-1 sm:flex-none justify-center bg-[#2A4DEF] hover:bg-[#1a38c2] shadow-md hover:shadow-lg transition-all rounded-xl py-2">
            <Plus className="h-5 w-5 mr-2" />
            Nouveau type
          </Button>
        </div>
      </div>

      {types.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#082151] mb-2">Aucun type de mission trouvé</h3>
          <p className="text-slate-500">Commencez par ajouter un type de mission.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentItems.map((type) => (
            <Card key={type.id} className="hover:shadow-lg transition-all duration-200 border-transparent hover:border-indigo-100 p-0 overflow-hidden flex flex-col group">
              <div className="p-5 sm:p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 text-indigo-600 h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#082151] text-lg leading-tight group-hover:text-indigo-600 transition-colors">{type.nom}</h3>
                      {type.actif === 1 ? (
                        <span className="inline-flex mt-1 items-center shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">Actif</span>
                      ) : (
                        <span className="inline-flex mt-1 items-center shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">Désactivé</span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  {type.description || 'Aucune description fournie.'}
                </p>
              </div>
              <div className="bg-slate-50/50 border-t border-slate-100 p-3 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setModal({ open: true, data: type })}
                  className="bg-white border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm px-3"
                >
                  <Edit className="h-4 w-4 mr-1.5" />
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(type.id)}
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

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, data: null })}
        title={
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            <span>{modal.data ? 'Modifier le type' : 'Nouveau type de mission'}</span>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-5 pt-2">
          <Input
            label="Nom *"
            name="nom"
            defaultValue={modal.data?.nom}
            placeholder="Ex: Forfait Horaire"
            className="bg-slate-50 focus:bg-white transition-colors"
            required
          />

          <div>
            <label className="block text-sm font-semibold text-[#082151] mb-2">Description</label>
            <textarea
              name="description"
              defaultValue={modal.data?.description}
              rows="3"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#2A4DEF] focus:ring-4 focus:ring-[#2A4DEF]/10 transition-all resize-none text-sm"
              placeholder="Description du type de mission..."
            />
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center cursor-pointer p-3 rounded-xl border border-slate-200 hover:border-[#2A4DEF] bg-slate-50 hover:bg-white transition-all w-full">
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
    </div>
  )
}

export default AdminTypeMission

import { useState, useEffect } from 'react'
import PageLoader from '../components/PageLoader'
import { Plus, Edit, Trash2, Save, Globe } from 'lucide-react'
import Card from '../components/Card'
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
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
      setLangues((response.data?.data || response.data) || [])
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

  const { currentItems, currentPage, totalPages, goToPage, totalItems } = usePagination(langues, 12)

  if (loading) {
    return <PageLoader fullScreen />
  }

  return (
    <div className="py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#082151]">Langues</h1>
          <p className="text-slate-500 mt-1">Gérez les langues disponibles sur la plateforme</p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-slate-200/60 shadow-sm">
            <Globe className="h-5 w-5 text-indigo-500" />
            <span className="text-lg font-bold text-[#082151]">{langues.length}</span>
          </div>
          <Button onClick={() => setModal({ open: true, data: null })} className="flex-1 sm:flex-none justify-center bg-[#2A4DEF] hover:bg-[#1a38c2] shadow-md hover:shadow-lg transition-all rounded-xl py-2">
            <Plus className="h-5 w-5 mr-2" />
            Nouvelle langue
          </Button>
        </div>
      </div>

      {langues.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <Globe className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#082151] mb-2">Aucune langue trouvée</h3>
          <p className="text-slate-500">Commencez par ajouter les langues que vous supportez.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentItems.map((langue) => (
            <Card key={langue.id} className="hover:shadow-lg transition-all duration-200 border-transparent hover:border-indigo-100 p-0 overflow-hidden flex flex-col group">
              <div className="p-4 sm:p-5 flex-1 flex flex-col items-center text-center">
                <div className="bg-indigo-50 text-indigo-600 h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 mb-3 group-hover:scale-110 group-hover:bg-indigo-100 transition-all">
                  <span className="font-mono font-bold text-xl uppercase">{langue.code}</span>
                </div>
                <h3 className="font-bold text-[#082151] text-lg mb-2">{langue.nom}</h3>
                {langue.actif === 1 ? (
                  <span className="inline-flex shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">Actif</span>
                ) : (
                  <span className="inline-flex shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">Désactivé</span>
                )}
              </div>
              <div className="bg-slate-50/50 border-t border-slate-100 p-2 flex justify-center gap-2">
                <button
                  onClick={() => setModal({ open: true, data: langue })}
                  className="flex-1 py-1.5 flex justify-center items-center rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="Modifier"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <div className="w-px bg-slate-200 my-1"></div>
                <button
                  onClick={() => handleDelete(langue.id)}
                  className="flex-1 py-1.5 flex justify-center items-center rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
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
              <Globe className="h-5 w-5" />
            </div>
            <span>{modal.data ? 'Modifier la langue' : 'Nouvelle langue'}</span>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-5 pt-2">
          <Input
            label="Nom de la langue *"
            name="nom"
            defaultValue={modal.data?.nom}
            placeholder="Ex: Français"
            className="bg-slate-50 focus:bg-white transition-colors"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Code (ISO 639-1) *"
              name="code"
              defaultValue={modal.data?.code}
              placeholder="Ex: FR"
              maxLength="2"
              className="bg-slate-50 focus:bg-white transition-colors uppercase"
              required
            />
            <div className="flex flex-col justify-end">
              <label className="flex items-center cursor-pointer p-3 rounded-xl border border-slate-200 hover:border-[#2A4DEF] bg-slate-50 hover:bg-white transition-all">
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
                <span className="ml-3 text-sm font-semibold text-[#082151]">Active</span>
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
    </div>
  )
}

export default AdminLangues

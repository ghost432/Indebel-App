import { useEffect, useState } from 'react'
import { Edit, RefreshCw, Search, Star, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
import { evaluationService } from '../services/evaluationService'

const statusVariant = (status) => status === 'public' ? 'success' : status === 'rejete' ? 'danger' : 'warning'

const AdminAvisMissions = () => {
  const [avis, setAvis] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Edit state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingAvis, setEditingAvis] = useState(null)

  const filteredAvis = avis.filter(item => {
    const s = search.toLowerCase();
    return (
      (item.employer_denomination || '').toLowerCase().includes(s) ||
      (item.employer_prenom || '').toLowerCase().includes(s) ||
      (item.employer_nom || '').toLowerCase().includes(s) ||
      (item.commentaire || '').toLowerCase().includes(s) ||
      (item.freelancer_prenom || '').toLowerCase().includes(s) ||
      (item.freelancer_nom || '').toLowerCase().includes(s)
    );
  });

  const { currentItems, currentPage, totalPages, goToPage, totalItems, resetPage } = usePagination(filteredAvis, 10)

  useEffect(() => {
    resetPage()
  }, [search])

  const load = async () => {
    try {
      setLoading(true)
      const res = await evaluationService.getAdminEvaluations({ limit: 1000 })
      setAvis(res.data?.data || [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible de charger les avis')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Avis missions - Indebel'
    load()
  }, [])

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    try {
      await evaluationService.updateAdminEvaluation(editingAvis.id, {
        note: editingAvis.note,
        commentaire: editingAvis.commentaire,
        qualite_travail: editingAvis.qualite_travail,
        respect_delais: editingAvis.respect_delais,
        communication: editingAvis.communication
      })
      toast.success('Avis modifié avec succès')
      setEditModalOpen(false)
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification')
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Supprimer définitivement cet avis ?')) return
    try {
      await evaluationService.deleteAdminEvaluation(id)
      toast.success('Avis supprimé')
      await load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Suppression impossible')
    }
  }

  return (
    <div className="space-y-7">
      <section className="rounded-[28px] bg-white border border-slate-100 p-7 text-slate-800 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-white/55">Performances</p>
        <h1 className="mt-3 text-3xl font-black">Avis après missions</h1>
        <p className="mt-2 max-w-2xl text-white/70">Gérez les évaluations données par les employeurs aux prestataires après une mission.</p>
      </section>

      <div className="flex flex-wrap gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <input className="input pl-10 w-full" value={search} placeholder="Rechercher auteur, prestataire, commentaire" onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Actualiser</Button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="h-32 animate-pulse rounded-3xl bg-slate-100" />
        ) : currentItems.length ? currentItems.map((item) => (
          <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-black text-[#082151]">De: {item.employer_denomination || `${item.employer_prenom} ${item.employer_nom}`}</h2>
                  <span className="inline-flex items-center gap-1 font-bold text-[#c02525]"><Star className="h-4 w-4 fill-current" /> {item.note}/5</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">Pour: {item.freelancer_prenom} {item.freelancer_nom}</p>
                
                <div className="mt-2 flex gap-4 text-xs font-medium text-slate-500">
                  <span>Qualité: {item.qualite_travail}/5</span>
                  <span>Délais: {item.respect_delais}/5</span>
                  <span>Com: {item.communication}/5</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditingAvis(item); setEditModalOpen(true); }}><Edit className="h-4 w-4 mr-2" /> Modifier</Button>
                <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50" onClick={() => remove(item.id)} title="Supprimer">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-slate-600">{item.commentaire}</p>
          </article>
        )) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">Aucun avis trouvé.</div>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          itemsPerPage={10}
          totalItems={totalItems}
        />
      )}

      {/* Modal Edition */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Modifier l'avis">
        {editingAvis && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Qualité (/5)</label>
                <input type="number" min="1" max="5" className="input w-full" value={editingAvis.qualite_travail || ''} onChange={(e) => setEditingAvis({ ...editingAvis, qualite_travail: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Délais (/5)</label>
                <input type="number" min="1" max="5" className="input w-full" value={editingAvis.respect_delais || ''} onChange={(e) => setEditingAvis({ ...editingAvis, respect_delais: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Com. (/5)</label>
                <input type="number" min="1" max="5" className="input w-full" value={editingAvis.communication || ''} onChange={(e) => setEditingAvis({ ...editingAvis, communication: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Note Générale (/5)</label>
              <input type="number" min="1" max="5" className="input w-full" value={editingAvis.note || ''} onChange={(e) => setEditingAvis({ ...editingAvis, note: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Commentaire</label>
              <textarea className="input w-full h-32 resize-none" value={editingAvis.commentaire || ''} onChange={(e) => setEditingAvis({ ...editingAvis, commentaire: e.target.value })} required />
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setEditModalOpen(false)}>Annuler</Button>
              <Button type="submit" variant="primary">Enregistrer</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

export default AdminAvisMissions

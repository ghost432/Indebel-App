import { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Edit3, Save } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Modal from '../components/Modal'
import PageLoader from '../components/PageLoader'
import { API_BASE_URL } from '../config'

export default function AdminMetierPages() {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingPage, setEditingPage] = useState(null)

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` })

  const loadPages = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/metiers`, { headers: getHeaders() })
      setPages(response.data?.data || [])
    } catch {
      toast.error('Impossible de charger les contenus métier')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Contenus métiers - Admin'
    loadPages()
  }, [])

  const savePage = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      await axios.put(`${API_BASE_URL}/metiers/${editingPage.id}`, {
        titre: form.get('titre'),
        introduction: form.get('introduction'),
        actif: form.get('actif') === 'on'
      }, { headers: getHeaders() })
      toast.success('Contenu métier enregistré')
      setEditingPage(null)
      loadPages()
    } catch {
      toast.error('Impossible d’enregistrer ce contenu')
    }
  }

  if (loading) return <PageLoader fullScreen />

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#082151]">Contenus métiers</h1>
        <p className="mt-1 text-slate-500">Modifiez les textes affichés sur les pages de demande de devis et utilisés pour leur référencement.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {pages.map((page) => (
          <Card key={page.id} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">/{page.slug}</p>
                <h2 className="mt-1 text-xl font-bold text-[#082151]">{page.nom}</h2>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${page.actif ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {page.actif ? 'Actif' : 'Masqué'}
              </span>
            </div>
            <p className="mt-4 font-semibold text-slate-700">{page.titre}</p>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{page.introduction}</p>
            <Button onClick={() => setEditingPage(page)} variant="outline" className="mt-5 border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700">
              <Edit3 className="mr-2 h-4 w-4" /> Modifier
            </Button>
          </Card>
        ))}
      </div>

      <Modal isOpen={Boolean(editingPage)} onClose={() => setEditingPage(null)} title={`Modifier : ${editingPage?.nom || ''}`}>
        {editingPage && (
          <form onSubmit={savePage} className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Titre SEO
              <input name="titre" defaultValue={editingPage.titre} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Texte de présentation
              <textarea name="introduction" defaultValue={editingPage.introduction} rows={6} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input name="actif" type="checkbox" defaultChecked={Boolean(editingPage.actif)} /> Afficher ce contenu
            </label>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setEditingPage(null)}>Annuler</Button>
              <Button type="submit"><Save className="mr-2 h-4 w-4" /> Enregistrer</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

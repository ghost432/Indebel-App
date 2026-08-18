import { useEffect, useMemo, useState } from 'react'
import { MessageSquare, Search, Send, Star, UserRound, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../components/Button'
import Input from '../components/Input'
import { avisService } from '../services/avisService'

const stars = (note, size = 'h-4 w-4') => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star key={star} className={`${size} ${star <= Number(note) ? 'fill-[#c02525] text-[#c02525]' : 'text-slate-300'}`} />
    ))}
  </div>
)

const getName = (freelancer) => `${freelancer?.prenom || ''} ${freelancer?.nom || ''}`.trim() || 'Prestataire'

const Modal = ({ title, subtitle, children, footer, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2A4DEF]/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-gradient-to-br from-[#2A4DEF] to-[#4962D5] px-5 py-5 text-white">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-200">Indebel</p>
          <h2 className="mt-1 text-xl font-black">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-white/70">{subtitle}</p> : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white hover:text-[#2A4DEF]"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5 scrollbar-thin">{children}</div>
      {footer ? <div className="border-t border-slate-200 bg-slate-50 p-4">{footer}</div> : null}
    </div>
  </div>
)

const AvisParticulier = () => {
  const [search, setSearch] = useState('')
  const [freelancers, setFreelancers] = useState([])
  const [freelancersPage, setFreelancersPage] = useState(1)
  const [freelancersPagination, setFreelancersPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState(null)
  const [avis, setAvis] = useState([])
  const [stats, setStats] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [avisPage, setAvisPage] = useState(1)
  const [modal, setModal] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ nom_auteur: '', email_auteur: '', note: 5, commentaire: '' })

  const selectedName = useMemo(() => getName(selected), [selected])

  useEffect(() => {
    document.title = 'Avis particuliers - Indebel'
    loadFreelancers('', { initial: true })
  }, [])

  useEffect(() => {
    if (loading && freelancers.length === 0 && search === '') return
    const timer = window.setTimeout(() => {
      loadFreelancers(search, { page: freelancersPage })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [search, freelancersPage])

  useEffect(() => {
    setFreelancersPage(1)
  }, [search])

  const loadFreelancers = async (query = '', { initial = false, page = 1 } = {}) => {
    try {
      if (initial || freelancers.length === 0) {
        setLoading(true)
      } else {
        setSearching(true)
      }
      const res = await avisService.listFreelancers({ search: query, page, limit: 24 })
      setFreelancers(res.data?.data || [])
      setFreelancersPagination(res.data?.pagination || null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible de charger les prestataires')
    } finally {
      setLoading(false)
      setSearching(false)
    }
  }

  const loadAvis = async (freelancer, page = 1) => {
    const res = await avisService.getFreelancerAvis(freelancer.id, { page, limit: 10 })
    setSelected(freelancer)
    setAvis(res.data?.data || [])
    setStats(res.data?.stats || null)
    setPagination(res.data?.pagination || null)
    setAvisPage(page)
  }

  const openAvis = async (freelancer, page = 1) => {
    try {
      await loadAvis(freelancer, page)
      setModal('avis')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible de charger les avis')
    }
  }

  const openForm = (freelancer) => {
    setSelected(freelancer)
    setModal('form')
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!selected) return toast.error('Sélectionnez un prestataire')

    const toastId = toast.loading('Envoi de votre avis...', {
      style: {
        border: '1px solid #2A4DEF',
        background: '#ffffff',
        color: '#2A4DEF',
        fontWeight: 800
      }
    })

    try {
      setSubmitting(true)
      await avisService.createAvis({ ...form, freelancer_id: selected.id })
      setForm({ nom_auteur: '', email_auteur: '', note: 5, commentaire: '' })
      setModal(null)
      toast.success('Avis envoyé avec succès. Merci pour votre retour.', {
        id: toastId,
        duration: 5000,
        icon: '★',
        style: {
          border: '1px solid #2A4DEF',
          background: '#ffffff',
          color: '#2A4DEF',
          fontWeight: 800
        }
      })
      await loadFreelancers(search)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible d’envoyer votre avis', { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8fc]">
      <section
        className="relative overflow-hidden border-b border-slate-200 bg-[#2A4DEF] bg-cover bg-center px-4 py-16 text-white"
        style={{ backgroundImage: "linear-gradient(90deg, rgba(42,77,239,0.94), rgba(42,77,239,0.78), rgba(192,37,37,0.62)), url('/avis-hero-bg.png')" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.22),transparent_32%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-red-200">Avis particuliers</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black sm:text-5xl">Choisissez un prestataire et partagez votre expérience</h1>
          <p className="mt-4 max-w-2xl text-white/75">Chaque profil affiche sa note publique. Vous pouvez consulter les avis reçus ou déposer votre retour en quelques secondes.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              className="input h-12 pl-12"
              value={search}
              placeholder="Rechercher par nom, prénom ou secteur"
              onChange={(e) => setSearch(e.target.value)}
            />
            {searching && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black uppercase tracking-[0.16em] text-[#c02525]">
                Recherche...
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="h-24 animate-pulse bg-slate-200" />
                <div className="px-5 pb-5">
                  <div className="-mt-10 h-20 w-20 rounded-[24px] border-4 border-white bg-slate-100" />
                  <div className="mt-5 h-5 w-2/3 rounded bg-slate-200" />
                  <div className="mt-3 h-4 w-1/2 rounded bg-slate-100" />
                  <div className="mt-5 h-16 rounded-2xl bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : freelancers.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center">
            <UserRound className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-lg font-bold text-slate-700">Aucun prestataire trouvé</p>
            <p className="mt-2 text-sm text-slate-500">La recherche se met à jour automatiquement pendant la saisie.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {freelancers.map((freelancer) => (
              <article key={freelancer.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="h-24 bg-gradient-to-br from-[#2A4DEF] via-[#4962D5] to-[#c02525]" />
                <div className="px-5 pb-5">
                  <div className="-mt-10 flex items-end justify-between gap-4">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[24px] border-4 border-white bg-slate-100 text-[#2A4DEF] shadow-lg">
                      {freelancer.photo_profil ? (
                        <img src={freelancer.photo_profil} alt={getName(freelancer)} className="h-full w-full object-cover" />
                      ) : (
                        <UserRound className="h-9 w-9" />
                      )}
                    </div>
                    <div className="rounded-2xl bg-white px-3 py-2 text-right shadow-sm ring-1 ring-slate-200">
                      <div className="flex items-center justify-end gap-1 text-sm font-black text-[#c02525]">
                        <Star className="h-4 w-4 fill-current" />
                        {Number(freelancer.note_moyenne || 0).toFixed(1)}
                      </div>
                      <p className="text-xs font-semibold text-slate-400">{freelancer.total_avis || 0} avis</p>
                    </div>
                  </div>

                  <h2 className="mt-4 text-xl font-black text-[#2A4DEF]">{getName(freelancer)}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{freelancer.secteur || 'Prestataire Indebel'}</p>
                  <p className="mt-4 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-600">
                    {freelancer.a_propos || 'Profil prestataire disponible pour recevoir vos avis publics.'}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => openAvis(freelancer)}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-[#2A4DEF] transition hover:border-[#2A4DEF] hover:bg-slate-50"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Voir les avis
                    </button>
                    <button
                      type="button"
                      onClick={() => openForm(freelancer)}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#c02525] px-3 text-sm font-black text-white shadow-sm transition hover:bg-[#a51f1f]"
                    >
                      <Send className="h-4 w-4" />
                      Donner un avis
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {freelancersPagination && freelancersPagination.pages > 1 && (
          <div className="mt-8 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row">
            <Button
              variant="outline"
              disabled={freelancersPage <= 1}
              onClick={() => setFreelancersPage((value) => Math.max(value - 1, 1))}
              className="w-full sm:w-auto"
            >
              Précédent
            </Button>
            <span className="text-sm font-bold text-slate-500">
              Page {freelancersPagination.page} / {freelancersPagination.pages} · {freelancersPagination.total} prestataire(s)
            </span>
            <Button
              variant="outline"
              disabled={freelancersPage >= freelancersPagination.pages}
              onClick={() => setFreelancersPage((value) => value + 1)}
              className="w-full sm:w-auto"
            >
              Suivant
            </Button>
          </div>
        )}
      </section>

      {modal === 'form' && selected && (
        <Modal
          title={`Donner un avis à ${selectedName}`}
          subtitle="Votre retour sera visible publiquement après envoi."
          onClose={() => setModal(null)}
        >
          <div className="mb-5 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2A4DEF] text-white">
                <UserRound className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500">Avis pour</p>
                <p className="text-lg font-black text-[#2A4DEF]">{selectedName}</p>
              </div>
            </div>
          </div>
          <form className="grid gap-4" onSubmit={submit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Votre nom" value={form.nom_auteur} onChange={(e) => setForm({ ...form, nom_auteur: e.target.value })} required />
              <Input label="Votre email" type="email" value={form.email_auteur} onChange={(e) => setForm({ ...form, email_auteur: e.target.value })} />
            </div>
            <label className="label">Note</label>
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3">
              {[1, 2, 3, 4, 5].map((note) => (
                <button
                  key={note}
                  type="button"
                  onClick={() => setForm({ ...form, note })}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-[#c02525]/30"
                  aria-label={`${note}/5`}
                >
                  <Star className={`h-7 w-7 ${note <= form.note ? 'fill-[#c02525] text-[#c02525]' : 'text-slate-300'}`} />
                </button>
              ))}
              <span className="ml-1 text-sm font-black text-[#2A4DEF]">{form.note}/5</span>
            </div>
            <textarea className="input min-h-36" value={form.commentaire} onChange={(e) => setForm({ ...form, commentaire: e.target.value })} placeholder="Votre commentaire" required />
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setModal(null)} className="w-full sm:w-auto">Annuler</Button>
              <Button loading={submitting} className="w-full sm:w-auto"><Send className="h-4 w-4" /> Envoyer l’avis</Button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'avis' && selected && (
        <Modal
          title={`Avis reçus par ${selectedName}`}
          subtitle="Faites défiler la fenêtre pour consulter tous les retours."
          onClose={() => setModal(null)}
          footer={(
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-slate-500">{stats?.total || 0} avis public(s)</p>
              <Button onClick={() => setModal('form')} className="w-full sm:w-auto">
                <Send className="h-4 w-4" />
                Donner mon avis
              </Button>
            </div>
          )}
        >
          <div className="mb-5 rounded-2xl bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-500">Note moyenne</p>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-3xl font-black text-[#2A4DEF]">{Number(stats?.note_moyenne || 0).toFixed(1)}</span>
                  {stars(Math.round(Number(stats?.note_moyenne || 0)), 'h-5 w-5')}
                </div>
              </div>
              <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#c02525] shadow-sm">{stats?.total || 0} avis public(s)</p>
            </div>
          </div>

          {avis.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">Aucun avis public pour ce prestataire.</div>
          ) : (
            <div className="space-y-3">
              {avis.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <strong className="text-[#2A4DEF]">{item.nom_auteur}</strong>
                    {stars(item.note)}
                  </div>
                  <p className="mt-3 leading-7 text-slate-600">{item.commentaire}</p>
                  <p className="mt-3 text-xs font-semibold text-slate-400">
                    {new Date(item.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </article>
              ))}
            </div>
          )}

          {pagination && pagination.pages > 1 && (
            <div className="mt-5 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row">
              <Button variant="outline" disabled={avisPage <= 1} onClick={() => openAvis(selected, Math.max(avisPage - 1, 1))} className="w-full sm:w-auto">Précédent</Button>
              <span className="text-sm font-bold text-slate-500">Page {pagination.page} / {pagination.pages}</span>
              <Button variant="outline" disabled={avisPage >= pagination.pages} onClick={() => openAvis(selected, avisPage + 1)} className="w-full sm:w-auto">Suivant</Button>
            </div>
          )}
        </Modal>
      )}
    </main>
  )
}

export default AvisParticulier

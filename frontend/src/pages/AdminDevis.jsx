import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bot, CheckCircle2, Eye, FileText, Inbox, RefreshCw, Send, Trash2, XCircle, X, BarChart } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import DevisCard, { formatDate, formatMoney } from '../components/devis/DevisCard'
import { devisService } from '../services/devisService'

const filters = [
  ['all', 'Tous'],
  ['en_attente', 'En attente'],
  ['valide', 'Client trouvé'],
  ['traite', 'Traité'],
  ['devis_complet', 'Complet'],
  ['retire_liste', 'Retiré'],
  ['refuse', 'Refusé']
]

const statLabels = {
  total: 'Total',
  en_attente: 'En attente',
  valide: 'Client trouvé',
  traite: 'Traité',
  devis_complet: 'Complet',
  retire_liste: 'Retiré'
}

const AdminDevis = () => {
  const [demandes, setDemandes] = useState([])
  const [stats, setStats] = useState({})
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 12 })
  const [statut, setStatut] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [devisSoumis, setDevisSoumis] = useState([])
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [visibilityModal, setVisibilityModal] = useState(null)
  const [visibilityLoading, setVisibilityLoading] = useState(false)
  const [visibilityData, setVisibilityData] = useState(null)
  const location = useLocation()
  const vue = new URLSearchParams(location.search).get('vue')
  const isSubmittedView = vue === 'envoyes' || vue === 'ia'

  const parsePhotos = (photoData) => {
    if (!photoData) return []
    if (Array.isArray(photoData)) return photoData
    try {
      return JSON.parse(photoData)
    } catch {
      return [photoData]
    }
  }

  const getPhotoUrl = (photoObj) => {
    let finalUrl = photoObj;
    if (typeof finalUrl === 'object' && finalUrl !== null) {
      finalUrl = finalUrl.data || finalUrl.url || finalUrl.src || '';
    }
    if (typeof finalUrl !== 'string' || !finalUrl) return ''
    if (finalUrl.startsWith('http') || finalUrl.startsWith('data:')) return finalUrl
    return finalUrl.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${finalUrl}` : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/uploads/${finalUrl}`
  }

  const statCards = useMemo(() => Object.entries(statLabels).map(([key, label]) => ({
    key,
    label,
    value: Number(stats?.[key] || 0)
  })), [stats])

  useEffect(() => {
    document.title = 'Devis - Admin Indebel'
  }, [])

  useEffect(() => {
    if (isSubmittedView) {
      loadSubmitted(1)
    } else {
      load(1)
    }
  }, [statut, vue])

  const load = async (page = pagination.page) => {
    try {
      setLoading(true)
      const res = await devisService.getAdminDemandes({ statut, page, limit: pagination.limit || 12 })
      const data = res.data?.data || {}
      setDemandes(data.demandes || [])
      setPagination(data.pagination || { page, pages: 1, total: 0, limit: 12 })
      setStats(data.stats || {})
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement des devis')
    } finally {
      setLoading(false)
    }
  }

  const loadSubmitted = async (page = 1) => {
    try {
      setLoading(true)
      const res = await devisService.getAdminDevisSoumis({ page, limit: 20 })
      setDevisSoumis(res.data?.data || [])
      setPagination(res.data?.pagination || { page, pages: 1, total: 0, limit: 20 })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement des devis envoyés')
    } finally {
      setLoading(false)
    }
  }

  const openDetail = async (demande) => {
    try {
      setDetailLoading(true)
      setSelected(demande)
      const res = await devisService.getAdminDemande(demande.id)
      setSelected(res.data?.data || demande)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible de charger le détail')
    } finally {
      setDetailLoading(false)
    }
  }

  const openVisibility = async (demande) => {
    try {
      setVisibilityModal(demande)
      setVisibilityLoading(true)
      const res = await devisService.getVisibility(demande.id)
      setVisibilityData(res.data?.data || null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement des statistiques de visibilité')
      setVisibilityModal(null)
    } finally {
      setVisibilityLoading(false)
    }
  }

  const action = async (id, type, message) => {
    try {
      await devisService.updateAdminStatus(id, type)
      toast.success(message)
      setSelected(null)
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action impossible')
    }
  }

  const remove = async (id) => {
    if (!confirm('Supprimer définitivement cette demande ?')) return
    try {
      await devisService.deleteAdminDemande(id)
      toast.success('Demande supprimée')
      setSelected(null)
      load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Suppression impossible')
    }
  }

  return (
    <div className="space-y-8">
      <header className="overflow-hidden rounded-[30px] bg-white shadow-xl ring-1 ring-slate-200">
        <div className="grid gap-6 bg-gradient-to-br from-[#082151] to-[#0d2f6f] p-7 text-white lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.26em] text-white/55">Pilotage commercial</p>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">
              {vue === 'envoyes' ? 'Devis envoyés' : vue === 'ia' ? 'Devis envoyés par IA' : 'Demandes de devis'}
            </h1>
            <p className="mt-3 max-w-2xl text-white/70">
              {isSubmittedView
                ? 'Consultez les propositions transmises par les prestataires aux particuliers.'
                : 'Suivez les demandes clients, validez leur disponibilité et retirez proprement celles qui ne doivent plus être visibles.'}
            </p>
          </div>
          <Button variant="outline" onClick={() => isSubmittedView ? loadSubmitted() : load()} className="border-white bg-white/10 text-white hover:bg-white/20">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
        {!isSubmittedView && <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-6">
          {statCards.map((item) => (
            <div key={item.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
              <p className="mt-1 text-2xl font-black text-[#082151]">{item.value}</p>
            </div>
          ))}
        </div>}
      </header>

      {isSubmittedView ? (
        <SubmittedDevisList loading={loading} items={devisSoumis} onlyAi={vue === 'ia'} />
      ) : <>
      <div className="flex flex-wrap gap-2">
        {filters.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatut(value)}
            className={`rounded-full px-4 py-2 text-sm font-black transition ${
              statut === value
                ? 'bg-[#c02525] text-white shadow-lg shadow-red-900/10'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-5 grid-cols-1">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-48 animate-pulse rounded-[26px] bg-slate-100" />)}
        </div>
      ) : demandes.length ? (
        <div className="grid gap-5 grid-cols-1">
          {demandes.map((demande) => (
            <DevisCard
              key={demande.id}
              demande={demande}
              onOpen={openDetail}
              isAdmin={true}
              actions={(
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button size="sm" variant="secondary" onClick={() => openVisibility(demande)} className="flex-1 sm:flex-none bg-blue-50 text-[#082151] hover:bg-blue-100">
                    <BarChart className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Visibilité</span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openDetail(demande)} className="flex-1 sm:flex-none">
                    <Eye className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Gérer</span>
                  </Button>
                </div>
              )}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <Inbox className="mx-auto h-10 w-10 text-slate-400" />
          <h2 className="mt-3 text-xl font-black text-slate-900">Aucune demande</h2>
        </div>
      )}

      {(pagination.pages || 0) > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={Number(pagination.page) || 1}
            totalPages={pagination.pages}
            onPageChange={(p) => load(p)}
            itemsPerPage={pagination.limit || 12}
            totalItems={pagination.total || 0}
          />
        </div>
      )}

      <Modal isOpen={!!selectedPhoto} onClose={() => setSelectedPhoto(null)} title="Image agrandie" size="md">
        <div className="flex justify-center">
          <img src={selectedPhoto} alt="Zoom" className="max-h-[80vh] w-auto max-w-full rounded-2xl" />
        </div>
      </Modal>

      <Modal isOpen={!!visibilityModal} onClose={() => setVisibilityModal(null)} title={`Statistiques de Visibilité #${visibilityModal?.id || ''}`} size="md">
        {visibilityLoading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        ) : visibilityData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                <p className="text-xs font-bold uppercase text-slate-400">Vues Totales</p>
                <p className="text-3xl font-black text-[#082151] mt-1">{visibilityData.summary?.total_views || 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                <p className="text-xs font-bold uppercase text-slate-400">Prestataires Uniques</p>
                <p className="text-3xl font-black text-[#082151] mt-1">{visibilityData.summary?.unique_viewers || 0}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-[#082151] border-b border-slate-100 pb-2 mb-3">Prestataires ayant consulté</h3>
              {visibilityData.viewers?.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {visibilityData.viewers.map((v, i) => (
                    <div key={i} className="flex justify-between items-center bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                      <div>
                        <p className="font-bold text-sm text-[#082151]">{v.denomination || `${v.prenom || ''} ${v.nom || ''}`.trim() || 'Utilisateur'}</p>
                        <p className="text-xs text-slate-500">{v.email}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-md">{v.views_count} vues</span>
                        <p className="text-[10px] text-slate-400 mt-1">Dernière: {new Date(v.last_viewed_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-slate-500 py-4">Aucun prestataire n'a encore consulté ce devis.</p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Demande #${selected?.id || ''}`} size="lg">
        {detailLoading ? (
          <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
        ) : selected && (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c02525]">{selected.categorie || 'Demande'}</p>
                    <h2 className="text-2xl font-black text-[#082151] mt-0.5">{selected.type_travaux}</h2>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6">
                  <h3 className="text-sm font-bold text-[#082151] mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" /> Description de la demande
                  </h3>
                  <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{selected.description || selected.details_complementaires || 'Aucune description fournie.'}</p>
                </div>

                {parsePhotos(selected.photos || selected.images || selected.fichiers_joints).length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-[#082151] mb-3">Photos jointes</h3>
                    <div className="flex flex-wrap gap-3">
                      {parsePhotos(selected.photos || selected.images || selected.fichiers_joints).map((photo, idx) => (
                        <div 
                          key={idx} 
                          className="h-24 w-24 rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#2A4DEF] transition-all bg-slate-50"
                          onClick={() => setSelectedPhoto(getPhotoUrl(photo))}
                        >
                          <img src={getPhotoUrl(photo)} alt={`Photo ${idx+1}`} className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selected.devis_soumis?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-black text-slate-900 text-lg">Devis reçus ({selected.devis_soumis.length})</h3>
                  <div className="grid gap-3">
                    {selected.devis_soumis.map((devis) => (
                      <div key={devis.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-200 transition-colors">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                          <p className="font-black text-[#082151] flex items-center gap-2">
                            <span className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                              {(devis.freelancer_prenom?.[0] || '') + (devis.freelancer_nom?.[0] || '')}
                            </span>
                            {devis.freelancer_prenom} {devis.freelancer_nom}
                          </p>
                          <p className="text-sm font-bold text-[#c02525] bg-red-50 px-3 py-1 rounded-lg">{formatMoney(devis.montant_ttc || devis.montant)}</p>
                        </div>
                        {devis.description && (
                          <p className="text-sm text-slate-600 line-clamp-2 mt-2">{devis.description}</p>
                        )}
                        <p className="mt-3 text-xs font-semibold text-slate-500 bg-slate-50 inline-block px-2.5 py-1 rounded-md border border-slate-100">
                          ⏱ Délai: {devis.delai_realisation || 'Non précisé'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <aside className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-[#082151] border-b border-slate-100 pb-3 mb-1">Informations Client</h3>
                <Info label="Client" value={`${selected.prenom || ''} ${selected.nom || ''}`.trim()} />
                {selected.author_role && (
                  <Info label="Type de compte" value={selected.author_role === 'employer' ? 'Recruteur' : 'Prestataire'} highlight={selected.author_role === 'employer'} />
                )}
                <Info label="Email" value={selected.email} />
                <Info label="Téléphone" value={selected.telephone} />
                <Info label="Lieu" value={`${selected.ville || ''} ${selected.code_postal || ''}`.trim()} />
                <Info label="Budget" value={formatMoney(selected.budget_estime)} highlight />
                <Info label="Date de demande" value={formatDate(selected.created_at)} />
              </div>
              
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-[#082151] border-b border-slate-100 pb-3 mb-4">Actions administrateur</h3>
                <div className="grid gap-2.5">
                  {selected.statut !== 'valide' && selected.statut !== 'refuse' && (
                    <>
                      <Button onClick={() => action(selected.id, 'valider', 'Demande validée')} className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Valider
                      </Button>
                      <Button onClick={() => action(selected.id, 'refuser', 'Demande refusée')} variant="danger" className="w-full justify-center mt-2">
                        <XCircle className="h-4 w-4 mr-2" />
                        Refuser
                      </Button>
                    </>
                  )}
                  <Button onClick={() => action(selected.id, 'traiter', 'Demande marquée traitée')} className="w-full justify-center bg-[#082151] hover:bg-[#0d2f6f] text-white shadow-sm hover:shadow-md">
                    <FileText className="h-4 w-4 mr-2" />
                    Marquer traité
                  </Button>
                  <Button onClick={() => action(selected.id, 'retirer-liste', 'Demande retirée des listes')} variant="outline" className="w-full justify-center bg-white border-slate-200 hover:bg-slate-50">
                    Retirer de la liste
                  </Button>
                  <Button onClick={() => remove(selected.id)} variant="danger" className="w-full justify-center bg-red-100 text-red-700 hover:bg-red-200 border-transparent">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </Modal>

      {/* Photo Enlarge Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-sm" onClick={() => setSelectedPhoto(null)}>
          <button className="absolute top-6 right-6 text-white hover:text-slate-300 transition-colors" onClick={() => setSelectedPhoto(null)}>
            <X className="h-10 w-10" />
          </button>
          <img src={selectedPhoto} alt="Agrandissement" className="max-h-[90vh] max-w-full rounded-2xl shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
      </>}
    </div>
  )
}

const SubmittedDevisList = ({ loading, items, onlyAi }) => {
  const [selected, setSelected] = useState(null)

  const filtered = onlyAi
    ? items.filter((item) => item.is_ai_generated || item.source === 'ia' || item.created_with_ai || item.genere_par_ia || /ia|ai/i.test(item.description || ''))
    : items

  if (loading) {
    return <div className="h-72 animate-pulse rounded-[26px] bg-slate-100" />
  }

  if (!filtered.length) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
        <Inbox className="mx-auto h-10 w-10 text-slate-400" />
        <h2 className="mt-3 text-xl font-black text-slate-900">Aucun devis envoyé</h2>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 grid-cols-1">
        {filtered.map((devis) => (
          <article key={devis.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-black text-[#082151]">{devis.type_travaux || 'Devis envoyé'}</h2>
                  {onlyAi || devis.is_ai_generated ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-600">
                      <Bot className="h-3.5 w-3.5" /> IA
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                      <Send className="h-3.5 w-3.5" /> Manuel
                    </span>
                  )}
                  <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                    devis.statut === 'accepte' ? 'bg-green-50 text-green-700 ring-green-200' :
                    devis.statut === 'refuse' ? 'bg-red-50 text-red-700 ring-red-200' :
                    'bg-amber-50 text-amber-700 ring-amber-200'
                  }`}>
                    {devis.statut === 'en_attente' ? 'En attente' : 
                     devis.statut === 'accepte' ? 'Accepté' : devis.statut || 'Envoyé'}
                  </span>
                  {devis.lu_par_client ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-blue-600">
                      <Eye className="h-3 w-3" /> Lu
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                      <Eye className="h-3 w-3 opacity-50" /> Non lu
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Prestataire: <span className="font-bold text-slate-700">{devis.freelancer_company || `${devis.freelancer_prenom || ''} ${devis.freelancer_nom || ''}`.trim() || '-'}</span> · Client: <span className="font-bold text-slate-700">{devis.client_prenom} {devis.client_nom}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-[#c02525] bg-red-50 px-3 py-1 rounded-lg border border-red-100">{formatMoney(devis.montant_ttc || devis.montant)}</p>
                <Button size="sm" onClick={() => setSelected(devis)} className="bg-[#082151] hover:bg-[#0d2f6f] text-white rounded-xl">
                  <Eye className="h-4 w-4 mr-2" />
                  Détail
                </Button>
              </div>
            </div>
            <div className="mt-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 line-clamp-2">{devis.description || 'Aucune description fournie.'}</p>
            </div>
          </article>
        ))}
      </div>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Détail du devis envoyé" size="lg">
        {selected && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Projet client</p>
                <div className="flex items-center gap-3 mt-1">
                  <h3 className="text-2xl font-black text-[#082151]">{selected.type_travaux || 'Demande sans titre'}</h3>
                  <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                    selected.statut === 'accepte' ? 'bg-green-50 text-green-700 ring-green-200' :
                    selected.statut === 'refuse' ? 'bg-red-50 text-red-700 ring-red-200' :
                    'bg-amber-50 text-amber-700 ring-amber-200'
                  }`}>
                    {selected.statut === 'en_attente' ? 'En attente' : 
                     selected.statut === 'accepte' ? 'Accepté' : selected.statut || 'Envoyé'}
                  </span>
                </div>
              </div>
              <div className="bg-red-50 text-[#c02525] px-4 py-2 rounded-xl border border-red-100 text-center">
                <p className="text-base font-bold">{formatMoney(selected.montant_ttc || selected.montant)}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider">Montant total</p>
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#082151]">Prestataire</p>
                <p className="mt-1 font-black text-slate-800">{selected.freelancer_company || `${selected.freelancer_prenom || ''} ${selected.freelancer_nom || ''}`.trim() || 'Inconnu'}</p>
                <p className="text-sm text-slate-500 mt-0.5">{selected.freelancer_email}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#082151]">Client final</p>
                <p className="mt-1 font-black text-slate-800">{selected.client_prenom} {selected.client_nom}</p>
                {selected.author_role && (
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${selected.author_role === 'employer' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'}`}>
                    {selected.author_role === 'employer' ? 'Recruteur' : 'Prestataire'}
                  </span>
                )}
                <p className="text-sm text-slate-500 mt-1">{selected.client_email || 'Email non fourni'}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#c02525] mb-3">Proposition détaillée</p>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="whitespace-pre-wrap leading-relaxed text-slate-700 text-sm">{selected.description || 'Aucune description fournie.'}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
                <p className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg">⏱ Délai: {selected.delai_realisation || 'Non spécifié'}</p>
                <p className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg">Date: {formatDate(selected.date_soumission || selected.created_at)}</p>
                {selected.lu_par_client === 1 && (
                  <p className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Lu par le client {selected.date_lecture ? `le ${new Date(selected.date_lecture).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </p>
                )}
              </div>
            </div>
            
            <div className="pt-4 text-right">
              <Button onClick={() => setSelected(null)} className="bg-slate-200 text-slate-800 hover:bg-slate-300 rounded-full font-bold">Fermer</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

const Info = ({ label, value, highlight }) => (
  <div className="group rounded-2xl border border-slate-100 bg-slate-50 p-3 hover:bg-white hover:border-slate-200 transition-colors">
    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 mb-1">{label}</p>
    <p className={`break-words font-bold text-sm ${highlight ? 'text-[#c02525]' : 'text-[#082151]'}`}>{value || 'Non précisé'}</p>
  </div>
)

export default AdminDevis

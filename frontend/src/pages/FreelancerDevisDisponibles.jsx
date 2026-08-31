import { useEffect, useMemo, useState, useRef } from 'react'
import { AlertTriangle, Brain, Bot, Eye, FileText, LayoutGrid, List, RefreshCw, Send, Sparkles, Image, X, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../components/Button'
import Modal from '../components/Modal'
import DevisCard, { formatMoney } from '../components/devis/DevisCard'
import QuotaModal from '../components/devis/QuotaModal'
import QuotaWidget from '../components/devis/QuotaWidget'
import PageLoader from '../components/PageLoader'
import { devisService } from '../services/devisService'
import { useAuth } from '../context/AuthContext'
import VerificationPopup from '../components/VerificationPopup'
import CreditUnlockGuard from '../components/CreditUnlockGuard'
import api from '../services/api'
import DevisUnlockModal from '../components/devis/DevisUnlockModal'
import { API_BASE_URL } from '../config'

const emptyForm = {
  montant_ht: '',
  taux_tva: 21,
  montant_tva: '',
  montant_ttc: '',
  description: '',
  instructions_supplementaires: '',
  conditions_generales: ''
}

const computeAmounts = (ht, taux) => {
  const base = Number(ht || 0)
  const rate = Number(taux || 0)
  const tva = Math.round((base * rate / 100) * 100) / 100
  return { montant_tva: tva, montant_ttc: Math.round((base + tva) * 100) / 100 }
}

const FreelancerDevisDisponibles = () => {
  const { user, refreshUser } = useAuth()
  const [demandes, setDemandes] = useState([])
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0, limit: 12 })
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState(() => (
    localStorage.getItem('indebel_freelancer_devis_view_mode') === 'list' ? 'list' : 'grid'
  ))
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [quotaModal, setQuotaModal] = useState({ open: false, type: 'view', message: '', limit: null, current: null, forfait: null })
  const [files, setFiles] = useState([])
  const fileRef = useRef(null)
  const [activeWriteMode, setActiveWriteMode] = useState(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [closedDemande, setClosedDemande] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [includeDisclaimer, setIncludeDisclaimer] = useState(true)
  const [devisToUnlock, setDevisToUnlock] = useState(null)
  const [unlockingDevis, setUnlockingDevis] = useState(false)
  const [creditCost, setCreditCost] = useState(1)
  const [aiCreditCost, setAiCreditCost] = useState(2)
  const [creditBalance, setCreditBalance] = useState(user?.solde_credits || 0)

  const totals = useMemo(() => ({
    total: pagination.total || demandes.length,
    urgents: demandes.filter((d) => ['urgent', 'haute', 'élevée'].includes(String(d.urgence || '').toLowerCase())).length,
    disponibles: demandes.filter((d) => !d.deja_soumis).length
  }), [demandes, pagination.total])

  useEffect(() => {
    document.title = 'Devis disponibles - Indebel'
    loadDemandes(1)
    fetchCreditInfo()
  }, [user])

  const fetchCreditInfo = async () => {
    try {
      const [settingsRes, balanceRes] = await Promise.all([
        api.get('/credits/settings/price').catch(() => api.get('/admin-credits/settings/price')).catch(() => ({ data: {} })),
        api.get('/credits/balance').catch(() => ({ data: {} }))
      ])
      if (settingsRes.data?.cout_vues_devis !== undefined) {
        setCreditCost(parseInt(settingsRes.data.cout_vues_devis, 10))
      }
      if (settingsRes.data?.cout_devis_ia !== undefined) {
        setAiCreditCost(parseInt(settingsRes.data.cout_devis_ia, 10))
      }
      if (balanceRes.data?.solde !== undefined) {
        setCreditBalance(parseInt(balanceRes.data.solde, 10))
      } else if (user?.solde_credits !== undefined) {
        setCreditBalance(user.solde_credits)
      }
    } catch (err) {
      console.error('Erreur chargement crédits:', err)
    }
  }

  const loadDemandes = async (page = pagination.currentPage) => {
    try {
      setLoading(true)
      const res = await devisService.getDemandesDisponibles({ page, limit: pagination.limit || 12 })
      setDemandes(res.data?.data || [])
      setPagination(res.data?.pagination || { currentPage: page, totalPages: 1, total: 0, limit: 12 })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement des devis disponibles')
    } finally {
      setLoading(false)
    }
  }

  const changeViewMode = (mode) => {
    setViewMode(mode)
    localStorage.setItem('indebel_freelancer_devis_view_mode', mode)
  }

  const openDetail = (demande) => {
    if (user && user.statut_verification === 'non_verifie') {
      setShowVerificationModal(true)
      return
    }

    if (isClosedStatus(demande?.statut)) {
      toast.error('Ce devis ne reçoit plus de demandes.')
      setClosedDemande(demande)
      return
    }

    const storageKey = `unlocked_devis_detail_${user?.id}_${demande.id}`
    if (user?.role === 'admin' || localStorage.getItem(storageKey) === 'true') {
      openDetailDirect(demande)
    } else {
      setDevisToUnlock(demande)
    }
  }

  const handleConfirmUnlockDevis = async (demande) => {
    try {
      setUnlockingDevis(true)
      const res = await api.post('/credits/consume', { action: 'view_devis_detail', amount: creditCost })
      if (res.data?.success) {
        const storageKey = `unlocked_devis_detail_${user?.id}_${demande.id}`
        localStorage.setItem(storageKey, 'true')
        if (res.data.newBalance !== undefined) {
          setCreditBalance(res.data.newBalance)
        }
        if (refreshUser) refreshUser()
        toast.success(`Devis débloqué ! ${res.data.deducted || creditCost} crédit(s) déduit(s).`)
        setDevisToUnlock(null)
        openDetailDirect(demande)
      }
    } catch (error) {
      if (error.response?.data?.code === 'INSUFFICIENT_CREDITS' || error.response?.status === 403) {
        // Géré par la modale DevisUnlockModal
      } else {
        toast.error(error.response?.data?.message || 'Erreur lors de la déduction des crédits')
      }
    } finally {
      setUnlockingDevis(false)
    }
  }

  const openDetailDirect = async (demande) => {
    try {
      setSelected(demande)
      setDetail(null)
      setForm(emptyForm)
      setFiles([])
      setActiveWriteMode(null); setPreviewMode(false)
      const res = await devisService.getDemandeDisponible(demande.id)
      const data = res.data?.data
      setDetail(data)
      setSelected(data)
      const amounts = computeAmounts(data?.budget_estime || '', 21)
      setForm({
        ...emptyForm,
        montant_ht: data?.budget_estime || '',
        montant_tva: amounts.montant_tva || '',
        montant_ttc: amounts.montant_ttc || '',
        delai_realisation: '3 à 5 jours ouvrables'
      })
    } catch (error) {
      if (error.response?.status === 403) {
        setSelected(null)
        setQuotaModal({ 
          open: true, 
          type: 'view', 
          message: error.response?.data?.message,
          limit: error.response?.data?.limit,
          current: error.response?.data?.viewed_count,
          forfait: error.response?.data?.forfait
        })
        return
      }
      toast.error(error.response?.data?.message || 'Impossible d’ouvrir cette demande')
      setSelected(null)
    }
  }

  const updateAmount = (value, key = 'montant_ht') => {
    const next = { ...form, [key]: value }
    if (key === 'montant_ht' || key === 'taux_tva') {
      Object.assign(next, computeAmounts(key === 'montant_ht' ? value : form.montant_ht, key === 'taux_tva' ? value : form.taux_tva))
    }
    setForm(next)
  }


  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files)
    if (files.length + newFiles.length > 5) {
      return toast.error('Maximum 5 fichiers autorisés')
    }
    setFiles(prev => [...prev, ...newFiles].slice(0, 5))
  }

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx))

  const generateAi = async () => {
    if (!selected) return
    try {
      setGenerating(true)
      const res = await devisService.generateAiDevis({
        demande_devis_id: selected.id,
        taux_tva: form.taux_tva,
        instructions_supplementaires: form.instructions_supplementaires
      })
      const data = res.data?.data || {}
      setForm((current) => ({
        ...current,
        montant_ht: data.montant_ht ?? current.montant_ht,
        taux_tva: data.taux_tva ?? current.taux_tva,
        montant_tva: data.montant_tva ?? current.montant_tva,
        montant_ttc: data.montant_ttc ?? current.montant_ttc,
        delai_realisation: data.delai_realisation || current.delai_realisation,
        description: data.description || current.description
      }))
      toast.success('Devis IA généré')
    } catch (error) {
      if (error.response?.status === 403) {
        setQuotaModal({ 
          open: true, 
          type: 'ai', 
          message: error.response?.data?.message,
          limit: error.response?.data?.limit,
          current: error.response?.data?.currentCount || error.response?.data?.viewed_count,
          forfait: error.response?.data?.forfait
        })
        return
      }
      if (error.response?.status === 409) {
        toast.error(error.response?.data?.message || 'Ce devis ne reçoit plus de demandes')
        return
      }
      toast.error(error.response?.data?.message || 'Erreur lors de la génération IA')
    } finally {
      setGenerating(false)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!selected) return
    try {
      setSubmitting(true)
      const formData = new FormData()
      formData.append('demande_devis_id', selected.id)
      formData.append('montant_ht', form.montant_ht)
      formData.append('taux_tva', form.taux_tva)
      formData.append('montant_tva', form.montant_tva)
      formData.append('montant_ttc', form.montant_ttc)
      formData.append('delai_realisation', form.delai_realisation)

      let finalDescription = form.description;
      if (form.conditions_generales) {
        finalDescription += `\n\nConditions Générales / Politique :\n${form.conditions_generales}`;
      }
      if (activeWriteMode === 'manual' && includeDisclaimer) {
        finalDescription += `\n\nLe montant indiqué est une estimation. Un devis définitif pourra être établi uniquement après une visite sur place, afin d'évaluer précisément les travaux à réaliser.\n\nJe reste à votre disposition pour convenir d'un rendez-vous.`;
      }
      formData.append('description', finalDescription)
      files.forEach(f => formData.append('fichiers', f))

      await devisService.submitDevis(formData)
      toast.success('Devis transmis au client')
      setSelected(null)
      setDetail(null)
      setActiveWriteMode(null); setPreviewMode(false)
      loadDemandes()
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error(error.response?.data?.message || 'Ce devis ne reçoit plus de demandes')
        return
      }
      toast.error(error.response?.data?.message || 'Erreur lors de l’envoi du devis')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CreditUnlockGuard action="view_devis_disponibles" storageKey="unlocked_devis_disponibles" title="les devis disponibles">
    <div className="space-y-8">
            <section className="mb-8 rounded-[28px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#c02525]">OPPORTUNITÉS QUALIFIÉES</p>
        <h1 className="mt-3 text-3xl font-black text-[#082151]">Demandes de devis disponibles</h1>
        <p className="mt-2 text-slate-700 max-w-3xl text-lg font-medium">
          Consultez les besoins validés, contrôlez vos quotas, puis rédigez une proposition claire avec ou sans IA.
        </p>

      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-700">
          Page {pagination.currentPage || pagination.page || 1} sur {pagination.totalPages || pagination.pages || 1}
        </p>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-xl bg-slate-100 p-1" role="group" aria-label="Affichage des devis">
            <button
              type="button"
              onClick={() => changeViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-black transition ${
                viewMode === 'grid'
                  ? 'bg-[#082151] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white hover:text-[#082151]'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Grille</span>
            </button>
            <button
              type="button"
              onClick={() => changeViewMode('list')}
              aria-pressed={viewMode === 'list'}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-black transition ${
                viewMode === 'list'
                  ? 'bg-[#082151] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white hover:text-[#082151]'
              }`}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Liste</span>
            </button>
          </div>
          <Button variant="outline" onClick={() => loadDemandes()}>
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className={`grid gap-5 ${viewMode === 'grid' ? 'md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`${viewMode === 'grid' ? 'h-72' : 'h-52'} animate-pulse rounded-[26px] bg-slate-100`} />
          ))}
        </div>
      ) : demandes.length ? (
        <div className={`grid gap-5 ${viewMode === 'grid' ? 'md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
          {demandes.map((demande) => (
            <DevisCard key={demande.id} demande={demande} onOpen={openDetail} />
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <FileText className="mx-auto h-10 w-10 text-slate-400" />
          <h2 className="mt-3 text-xl font-black text-slate-900">Aucune demande disponible</h2>
          <p className="mt-2 text-slate-700 font-semibold">Les nouvelles demandes validées apparaîtront ici.</p>
        </div>
      )}

      {(pagination.totalPages || pagination.pages || 0) > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages || pagination.pages }).map((_, index) => (
            <button
              key={index}
              onClick={() => loadDemandes(index + 1)}
              className={`h-10 min-w-10 rounded-full px-3 text-sm font-black transition ${
                Number(pagination.currentPage || pagination.page || 1) === index + 1
                  ? 'bg-[#082151] text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}

      <VerificationPopup 
        isOpen={showVerificationModal} 
        onClose={() => setShowVerificationModal(false)} 
      />

            {/* 1. Detail Modal */}
      <Modal isOpen={!!selected && !activeWriteMode} onClose={() => setSelected(null)} title={selected?.type_travaux || 'Détail de la demande'} size="xl">
        {!detail ? (
          <PageLoader label="Chargement des informations..." compact />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#082151]">Client</p>
                <p className="mt-1 font-bold text-slate-800">{[detail.prenom, detail.nom].filter(Boolean).join(' ').trim() || 'Masqué'}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#082151]">Contact</p>
                <p className="mt-1 font-bold text-slate-800 text-sm">
                  {detail.email && <span className="block truncate" title={detail.email}>📧 {detail.email}</span>}
                  {detail.telephone && <span className="block">📞 {detail.telephone}</span>}
                  {(!detail.email && !detail.telephone) && 'Non renseigné'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#082151]">Localisation</p>
                <p className="mt-1 font-bold text-slate-800 text-sm">
                  {detail.adresse && <span className="block truncate" title={detail.adresse}>📍 {detail.adresse}</span>}
                  <span className="block">🏢 {[detail.code_postal, detail.ville, detail.region].filter(Boolean).join(', ') || 'Non renseigné'}</span>
                </p>
              </div>
              {detail.date_souhaite && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#082151]">Date Souhaitée</p>
                  <p className="mt-1 font-bold text-slate-800">{detail.date_souhaite}</p>
                </div>
              )}
              {detail.urgence && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#082151]">Urgence</p>
                  <p className="mt-1 font-bold text-slate-800 capitalize">{detail.urgence}</p>
                </div>
              )}
              {detail.categorie && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#082151]">Catégorie</p>
                  <p className="mt-1 font-bold text-slate-800">{detail.categorie}</p>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <div className="bg-white text-[#df6422] px-3 py-1.5 rounded-xl border border-slate-200 text-center shadow-sm">
                  <p className="text-sm font-bold">{formatMoney(detail.budget_estime)}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Budget Client</p>
                </div>
              </div>
              
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#c02525]">Description du besoin</p>
              <h3 className="mt-2 text-lg font-black text-[#082151] pr-32">{detail.type_travaux}</h3>
              <div className="mt-5 text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-5 rounded-2xl border border-slate-100">
                {detail.description || 'Aucun détail fourni.'}
              </div>
            </div>

            {/* Photos Section */}
            {((detail.photos || detail.images || detail.fichiers_joints) && (Array.isArray(detail.photos || detail.images || detail.fichiers_joints) ? (detail.photos || detail.images || detail.fichiers_joints).length > 0 : true)) && (
              <div className="pt-2">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#082151] mb-3">Photos jointes</p>
                <div className="flex flex-wrap gap-3">
                  {(() => {
                    const sourcePhotos = detail.photos || detail.images || detail.fichiers_joints;
                    let photosArray = [];
                    try {
                      photosArray = Array.isArray(sourcePhotos) ? sourcePhotos : JSON.parse(sourcePhotos || '[]');
                    } catch(e) {
                      if (typeof sourcePhotos === 'string') photosArray = [sourcePhotos];
                    }
                    return photosArray.map((photo, idx) => {
                      let rawUrl = '';
                      if (typeof photo === 'object' && photo !== null) {
                        rawUrl = photo.data || photo.url || photo.src || '';
                      } else {
                        rawUrl = photo;
                      }
                      const baseUrl = API_BASE_URL.replace(/\/api$/, '')
                      const url = typeof rawUrl === 'string' && (rawUrl.startsWith('http') || rawUrl.startsWith('data:')) ? rawUrl : (rawUrl.startsWith('/uploads') ? `${baseUrl}${rawUrl}` : `${baseUrl}/uploads/${rawUrl}`);
                      return (
                        <div key={idx} className="relative h-24 w-24 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden cursor-zoom-in group shadow-sm hover:shadow-md transition-all" onClick={() => setSelectedPhoto(url)}>
                          <img src={url} alt={`Photo ${idx+1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <Eye className="text-white opacity-0 group-hover:opacity-100 h-6 w-6 drop-shadow-md" />
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
              <Button onClick={() => setSelected(null)} variant="outline" className="flex-1 border-slate-300 hover:bg-slate-50">Fermer</Button>
              {detail.deja_soumis ? (
                <div className="flex-[2] flex items-center justify-center bg-emerald-50 text-emerald-700 rounded-xl px-4 py-2 font-bold ring-1 ring-emerald-200">
                  <CheckCircle className="h-5 w-5 mr-2" /> Devis déjà envoyé
                </div>
              ) : (
                <>
                  <Button onClick={() => setActiveWriteMode('manual')} className="flex-1 bg-[#082151] hover:bg-[#0d2f6f] text-white shadow-sm hover:shadow">
                    <FileText className="h-4 w-4 mr-2" /> Rédiger manuellement
                  </Button>
                  <Button onClick={() => setActiveWriteMode('ai')} className="flex-1 bg-[#df6422] hover:bg-[#c5551c] text-white border-0 shadow-sm hover:shadow">
                    <Sparkles className="h-4 w-4 mr-2" /> Rédiger avec IA
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 2. Write Form Modal */}
      <Modal isOpen={!!selected && !!activeWriteMode} onClose={() => { setActiveWriteMode(null); setPreviewMode(false); }} title={activeWriteMode === 'ai' ? 'Rédiger avec IA' : 'Rédiger manuellement'} size="lg">
        {detail && (
          <form onSubmit={submit} className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#082151]">
                    {previewMode ? 'Prévisualisation du devis' : 'Votre proposition'}
                  </p>
                  <h3 className="mt-1 text-xl font-black text-slate-900">{detail.type_travaux}</h3>
                </div>
                {activeWriteMode === 'ai' && !previewMode && (
                  <div className="w-full sm:w-auto space-y-2">
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-purple-50 p-2.5 text-xs font-semibold text-purple-900 border border-purple-200">
                      <span>✨ Tarif IA : <strong>{aiCreditCost} crédit{aiCreditCost > 1 ? 's' : ''}</strong></span>
                      <span>Solde : <strong className={creditBalance < aiCreditCost ? "text-red-600 font-bold" : "text-emerald-700 font-bold"}>{creditBalance} crédit{creditBalance > 1 ? 's' : ''}</strong></span>
                    </div>

                    {creditBalance < aiCreditCost ? (
                      <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-bold space-y-2">
                        <p className="flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          Solde insuffisant pour la génération IA ({creditBalance} / {aiCreditCost} crédits).
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate(user?.role === 'employer' ? '/employer/credits' : '/freelancer/credits')}
                          className="inline-flex items-center justify-center rounded-lg bg-[#c02525] px-3 py-1.5 text-xs font-black text-white hover:bg-[#a91f1f] w-full shadow-sm"
                        >
                          Recharger mes crédits
                        </button>
                      </div>
                    ) : (
                      <Button type="button" onClick={generateAi} loading={generating} disabled={creditBalance < aiCreditCost} className="w-full bg-[#df6422] hover:bg-[#c5551c] text-white border-0 shadow-sm hover:shadow">
                        <Bot className="h-4 w-4 mr-2" />
                        Générer avec l'IA ({aiCreditCost} crédit{aiCreditCost > 1 ? 's' : ''})
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              {previewMode ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="rounded-2xl border border-[#082151]/10 bg-white p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                      <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-center">
                        <p className="text-base font-bold text-[#c02525]">{form.montant_ttc || 0} €</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total TTC</p>
                      </div>
                    </div>
                    
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#082151]">Détails financiers</p>
                    <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-600">
                      <p><strong>Montant HT:</strong> {form.montant_ht || 0} €</p>
                      <p><strong>TVA ({form.taux_tva}%):</strong> {form.montant_tva || 0} €</p>
                      <p><strong>Délai:</strong> {form.delai_realisation || 'Non spécifié'}</p>
                    </div>

                    <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-[#082151]">Prestations détaillées</p>
                    <div className="mt-3 text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-5 rounded-xl border border-slate-100">
                      {form.description || 'Aucune description fournie.'}
                    </div>
                    
                    {files.length > 0 && (
                      <div className="mt-6">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#082151] mb-3">Fichiers joints ({files.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {files.map((file, idx) => (
                            <div key={idx} className="h-16 w-16 rounded-lg border border-slate-200 overflow-hidden">
                              {file.type.startsWith('image/') ? (
                                <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-[8px] font-bold text-center break-all p-1">{file.name}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={() => setPreviewMode(false)} className="w-1/3 border-slate-300 text-slate-700 font-bold hover:bg-slate-100 shadow-sm">
                      Modifier
                    </Button>
                    <Button type="submit" loading={submitting} className="w-2/3 bg-[#082151] hover:bg-[#0d2f6f] shadow-sm text-white font-bold text-lg">
                      <Send className="h-5 w-5 mr-2" />
                      Confirmer et Envoyer
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                {activeWriteMode === 'ai' && (
                  <textarea
                    value={form.instructions_supplementaires}
                    onChange={(e) => setForm({ ...form, instructions_supplementaires: e.target.value })}
                    placeholder="Instructions pour l’IA (ex: Insister sur la garantie de 10 ans, inclure la pose...)"
                    className="min-h-[72px] w-full rounded-xl border border-purple-200 bg-white px-4 py-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/15"
                  />
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Montant HT" type="number" value={form.montant_ht} onChange={(e) => updateAmount(e.target.value)} required />
                  <label className="space-y-1 text-sm font-semibold text-slate-700">
                    TVA
                    <select value={form.taux_tva} onChange={(e) => updateAmount(e.target.value, 'taux_tva')} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:border-[#082151] focus:outline-none focus:ring-2 focus:ring-[#082151]/15">
                      {[0, 6, 12, 21].map((rate) => <option key={rate} value={rate}>{rate}%</option>)}
                    </select>
                  </label>
                  <Input label="TVA calculée" value={form.montant_tva} readOnly />
                  <Input label="Total TTC" value={form.montant_ttc} readOnly />
                </div>
                <Input label="Délai de réalisation" value={form.delai_realisation} onChange={(e) => setForm({ ...form, delai_realisation: e.target.value })} />
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description détaillée du devis"
                  required
                  className="min-h-[220px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 focus:border-[#082151] focus:outline-none focus:ring-2 focus:ring-[#082151]/15"
                />

                {activeWriteMode === 'manual' && (
                  <div className="flex items-start gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="disclaimer-checkbox"
                      checked={includeDisclaimer}
                      onChange={(e) => setIncludeDisclaimer(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-[#082151] focus:ring-[#082151]"
                    />
                    <label htmlFor="disclaimer-checkbox" className="text-sm text-slate-600">
                      Ajouter le texte d'estimation (Le montant indiqué est une estimation. Un devis définitif pourra être établi uniquement après une visite sur place...)
                    </label>
                  </div>
                )}

                <textarea
                  value={form.conditions_generales}
                  onChange={(e) => setForm({ ...form, conditions_generales: e.target.value })}
                  placeholder="Rédigez vos Conditions Générales / Politique (Optionnel)"
                  className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 focus:border-[#082151] focus:outline-none focus:ring-2 focus:ring-[#082151]/15"
                />

                <div className="space-y-3 pt-2">
                  <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Image className="h-4 w-4 text-[#c02525]" /> Images ou documents (Max 5)
                  </p>
                  <input type="file" multiple accept="image/*,.pdf,.doc,.docx" className="hidden" ref={fileRef} onChange={handleFiles} />
                  
                  <div className="flex flex-wrap gap-3">
                    {files.map((file, idx) => (
                      <div key={idx} className="relative h-20 w-20 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden group shadow-sm">
                        {file.type.startsWith('image/') ? (
                          <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover cursor-zoom-in" onClick={() => window.open(URL.createObjectURL(file), '_blank')} />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-white p-2 text-center cursor-pointer" onClick={() => window.open(URL.createObjectURL(file), '_blank')}>
                            <FileText className="h-6 w-6 text-[#082151] mb-1" />
                            <span className="text-[8px] font-bold truncate w-full">{file.name}</span>
                          </div>
                        )}
                        <button type="button" onClick={() => removeFile(idx)} className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {files.length < 5 && (
                      <button type="button" onClick={() => fileRef.current?.click()} className="flex flex-col items-center justify-center h-20 w-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#c02525] hover:bg-red-50 transition-colors text-slate-400 hover:text-[#c02525]">
                        <Sparkles className="h-5 w-5 mb-1 opacity-50" />
                        <span className="text-[10px] font-bold">Ajouter</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap gap-3 pt-6 border-t border-slate-100">
                  <Button type="button" variant="outline" onClick={() => { setActiveWriteMode(null); setPreviewMode(false); }} className="w-full sm:w-1/4 border-slate-300 text-slate-700 font-bold hover:bg-slate-100 shadow-sm">
                    Retour
                  </Button>
                  <Button type="button" onClick={() => setPreviewMode(true)} className="w-full sm:w-1/3 bg-slate-800 hover:bg-slate-900 shadow-sm text-white font-bold">
                    <Eye className="h-4 w-4 mr-2" />
                    Prévisualiser
                  </Button>
                  <Button type="submit" loading={submitting} className="w-full sm:w-5/12 bg-[#082151] hover:bg-[#0d2f6f] shadow-sm text-white font-bold text-lg">
                    <Send className="h-5 w-5 mr-2" />
                    Envoyer au client
                  </Button>
                </div>
              </div>
              )}
            </div>
          </form>
        )}
      </Modal>

      <QuotaModal {...quotaModal} onClose={() => setQuotaModal({ open: false, type: 'view', message: '' })} />
      {closedDemande && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#082151]/70 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[30px] bg-white shadow-2xl shadow-[#082151]/25">
            <div className="relative bg-gradient-to-br from-[#082151] to-[#2A4DEF] p-6 text-white">
              <button
                onClick={() => setClosedDemande(null)}
                className="absolute right-4 top-4 rounded-full bg-white/10 p-2 transition hover:bg-white/20"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#df6422] text-white">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h2 className="mt-5 pr-10 text-2xl font-black">Demande clôturée</h2>
              <p className="mt-2 text-sm leading-6 text-white/75">
                Ce devis ne reçoit plus de demandes.
              </p>
            </div>
            <div className="p-6">
              <p className="text-sm font-black text-[#082151]">#{closedDemande.id} · {closedDemande.type_travaux || 'Projet client'}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                L'administrateur a marqué cette demande comme traitée. Vous pouvez consulter une autre opportunité disponible.
              </p>
              <button
                onClick={() => setClosedDemande(null)}
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#082151] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0d2f6f]"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Photo Enlarge Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-sm" onClick={() => setSelectedPhoto(null)}>
          <button className="absolute top-6 right-6 text-white hover:text-slate-300 transition-colors" onClick={() => setSelectedPhoto(null)}>
            <X className="h-10 w-10" />
          </button>
          <img src={selectedPhoto} alt="Agrandissement" className="max-h-[90vh] max-w-full rounded-2xl shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <DevisUnlockModal
        isOpen={!!devisToUnlock}
        onClose={() => setDevisToUnlock(null)}
        demande={devisToUnlock}
        creditCost={creditCost}
        creditBalance={creditBalance}
        onConfirmUnlock={handleConfirmUnlockDevis}
        unlocking={unlockingDevis}
        user={user}
      />

      <QuotaWidget />
    </div>
    </CreditUnlockGuard>
  )
}

const Info = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4">
    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
    <p className="mt-1 font-black text-slate-800">{value || 'Non précisé'}</p>
  </div>
)

const Input = ({ label, ...props }) => (
  <label className="space-y-1 text-sm font-semibold text-slate-700">
    {label}
    <input
      {...props}
      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-[#082151] focus:outline-none focus:ring-2 focus:ring-[#082151]/15 disabled:bg-slate-50"
    />
  </label>
)

const isClosedStatus = (status) => ['traite', 'traité'].includes(String(status || '').trim().toLowerCase())

export default FreelancerDevisDisponibles

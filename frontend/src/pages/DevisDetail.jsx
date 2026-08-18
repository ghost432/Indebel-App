import { useRef, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Banknote, Brain, CalendarDays, Eye, FileText, Image, Lock, Mail, MapPin, Phone, Send, Sparkles, Timer, Users, User, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../components/Button'
import QuotaModal from '../components/devis/QuotaModal'
import VerificationPopup from '../components/VerificationPopup'
import { devisService } from '../services/devisService'
import { formatDate, formatMoney } from '../components/devis/DevisCard'
import { useAuth } from '../context/AuthContext'

const emptyForm = {
  montant_ht: '',
  taux_tva: 21,
  montant_tva: '',
  montant_ttc: '',
  delai_realisation: '',
  description: '',
  instructions_supplementaires: ''
}

const computeAmounts = (ht, taux) => {
  const base = Number(ht || 0)
  const rate = Number(taux || 0)
  const tva = Math.round((base * rate / 100) * 100) / 100
  return { montant_tva: tva, montant_ttc: Math.round((base + tva) * 100) / 100 }
}

const DevisDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [demande, setDemande] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quotaModal, setQuotaModal] = useState({ open: false, type: 'view', message: '' })
  const [writeMode, setWriteMode] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [files, setFiles] = useState([])
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [suggestingPrice, setSuggestingPrice] = useState(false)
  const [priceSuggestion, setPriceSuggestion] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const fileRef = useRef(null)

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

  useEffect(() => {
    document.title = `Devis #${id} - Indebel`
    load()
  }, [id])

  const load = async () => {
    if (user?.role === 'freelancer' && user?.statut_verification === 'non_verifie') {
      setLoading(false)
      setShowVerificationModal(true)
      return
    }

    try {
      setLoading(true)
      const res = await devisService.getPublicDemande(id)
      const data = res.data?.data
      setDemande(data)
      if (isClosedStatus(data?.statut)) toast.error('Ce devis ne reçoit plus de demandes.')
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
        setQuotaModal({ open: true, type: 'view', message: error.response?.data?.message })
        return
      }
      toast.error(error.response?.data?.message || 'Demande introuvable')
    } finally {
      setLoading(false)
    }
  }

  const isClosed = isClosedStatus(demande?.statut)

  const startWriting = (mode) => {
    if (isClosed) {
      toast.error('Ce devis ne reçoit plus de demandes.')
      return
    }
    if (user?.role !== 'freelancer') {
      navigate('/login')
      return
    }
    setWriteMode(mode)
  }

  const updateAmount = (value, key = 'montant_ht') => {
    const next = { ...form, [key]: value }
    if (key === 'montant_ht' || key === 'taux_tva') {
      Object.assign(next, computeAmounts(key === 'montant_ht' ? value : form.montant_ht, key === 'taux_tva' ? value : form.taux_tva))
    }
    setForm(next)
  }

  const handleFiles = (event) => {
    const newFiles = Array.from(event.target.files || [])
    if (files.length + newFiles.length > 5) return toast.error('Maximum 5 fichiers autorisés')
    setFiles((current) => [...current, ...newFiles].slice(0, 5))
  }

  const removeFile = (index) => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))

  const generateAi = async () => {
    if (!demande?.id || isClosed) return startWriting('ai')
    try {
      setGenerating(true)
      const response = await devisService.generateAiDevis({
        demande_devis_id: demande.id,
        taux_tva: form.taux_tva,
        instructions_supplementaires: form.instructions_supplementaires
      })
      const data = response.data?.data || {}
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
      if (error.response?.status === 409) return toast.error(error.response?.data?.message || 'Ce devis ne reçoit plus de demandes.')
      if (error.response?.status === 403) {
        setQuotaModal({ open: true, type: 'ai', message: error.response?.data?.message })
        return
      }
      toast.error(error.response?.data?.message || 'Erreur lors de la génération IA')
    } finally {
      setGenerating(false)
    }
  }

  const getPriceSuggestion = async () => {
    try {
      setSuggestingPrice(true);
      const response = await devisService.suggestPrice(demande.id);
      const data = response.data?.data;
      if (data) {
        setPriceSuggestion(data);
        toast.success('Assistant de tarification IA consulté');
      }
    } catch (error) {
      toast.error('Erreur lors de la suggestion de prix');
    } finally {
      setSuggestingPrice(false);
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!demande?.id || isClosed) return toast.error('Ce devis ne reçoit plus de demandes.')
    try {
      setSubmitting(true)
      const data = new FormData()
      data.append('demande_devis_id', demande.id)
      data.append('montant_ht', form.montant_ht)
      data.append('taux_tva', form.taux_tva)
      data.append('montant_tva', form.montant_tva)
      data.append('montant_ttc', form.montant_ttc)
      data.append('delai_realisation', form.delai_realisation)
      data.append('description', form.description)
      files.forEach((file) => data.append('fichiers', file))
      await devisService.submitDevis(data)
      toast.success('Devis transmis au client')
      setWriteMode(null)
      setFiles([])
    } catch (error) {
      if (error.response?.status === 409) return toast.error(error.response?.data?.message || 'Ce devis ne reçoit plus de demandes.')
      toast.error(error.response?.data?.message || 'Erreur lors de l’envoi du devis')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9fd]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#082151]"></div>
      </div>
    )
  }

  if (!demande) {
    return (
      <main className="min-h-screen bg-[#f7f9fd]">
        <VerificationPopup 
          isOpen={showVerificationModal} 
          onClose={() => setShowVerificationModal(false)} 
        />
        <section className="px-4 py-20 text-center">
          <FileText className="mx-auto h-16 w-16 text-slate-300" />
          <h1 className="mt-4 text-2xl font-black text-[#082151]">Devis introuvable ou accès restreint</h1>
          <Button onClick={() => navigate('/devis')} className="mt-6 bg-[#082151] hover:bg-[#0d2f6f] text-white">
            Retour aux devis
          </Button>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f9fd]">
      <VerificationPopup 
        isOpen={showVerificationModal} 
        onClose={() => setShowVerificationModal(false)} 
      />
      <section className="relative overflow-hidden bg-[#082151] px-4 py-10 text-white sm:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(42,77,239,0.45),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(192,37,37,0.3),transparent_34%)]" />
        <div className="relative mx-auto max-w-6xl">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/15">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
          <p className="mt-8 text-xs font-black uppercase tracking-[0.24em] text-white/60">Demande de devis #{demande.id}</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight sm:text-5xl">{demande.type_travaux || 'Projet client'}</h1>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-white/85">
            <Pill icon={FileText}>{demande.categorie || 'Catégorie non précisée'}</Pill>
            <Pill icon={Banknote}>{formatMoney(demande.budget_estime)}</Pill>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <section className="overflow-hidden rounded-[34px] bg-white shadow-2xl shadow-[#082151]/10 ring-1 ring-slate-200">
          <div className="grid gap-8 p-6 lg:grid-cols-[1fr_360px] sm:p-10">
            <article className="space-y-6">
              {isClosed && (
                <div className="rounded-3xl border border-[#c02525]/20 bg-[#c02525]/10 p-5 text-[#8f1b1b]">
                  <p className="flex items-center gap-2 font-black">
                    <Lock className="h-5 w-5" />
                    Ce devis ne reçoit plus de demandes.
                  </p>
                  <p className="mt-2 text-sm font-semibold">L'administrateur a marqué cette demande comme traitée.</p>
                </div>
              )}
              <Block title="Description du besoin">
                <p className="whitespace-pre-wrap leading-8 text-slate-700">{demande.description || 'Non renseigné'}</p>
              </Block>
              {demande.details_complementaires && (
                <Block title="Détails complémentaires">
                  <p className="whitespace-pre-wrap leading-8 text-slate-700">{demande.details_complementaires}</p>
                </Block>
              )}
              {parsePhotos(demande.photos || demande.images || demande.fichiers_joints).length > 0 && (
                <Block title="Photos jointes">
                  <div className="flex flex-wrap gap-3">
                    {parsePhotos(demande.photos || demande.images || demande.fichiers_joints).map((photo, idx) => (
                      <div 
                        key={idx} 
                        className="relative h-24 w-24 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden cursor-zoom-in hover:shadow-md transition-all group"
                        onClick={() => setSelectedPhoto(getPhotoUrl(photo))}
                      >
                        <img src={getPhotoUrl(photo)} alt={`Photo ${idx+1}`} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <Eye className="text-white opacity-0 group-hover:opacity-100 h-6 w-6 drop-shadow-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                </Block>
              )}
            </article>

            <aside className="space-y-4">
              <Info icon={CalendarDays} label="Date souhaitée" value={formatDate(demande.date_souhaite)} />
              <Info icon={Timer} label="Priorité" value={demande.urgence || 'Non précisée'} />
              {user ? (
                <>
                  <Info icon={User} label="Client" value={`${demande.prenom || ''} ${demande.nom || ''}`.trim()} />
                  <Info icon={MapPin} label="Localisation" value={`${demande.ville || ''} ${demande.code_postal || ''}, ${demande.region || ''}`.replace(/^[\s,]+|[\s,]+$/g, '')} />
                  <Info icon={Phone} label="Téléphone" value={demande.telephone} />
                  <Info icon={Mail} label="Email" value={demande.email} />
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                  <Lock className="mx-auto h-8 w-8 text-[#c02525]" />
                  <p className="mt-3 font-bold text-slate-800 text-sm">Localisation, email et téléphone masqués.</p>
                  <p className="mt-1 text-xs text-slate-500">Connectez-vous pour voir les informations client.</p>
                  <Link to="/login" className="mt-4 inline-block rounded-xl bg-[#082151] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#0d2f6f] w-full">
                    Se connecter
                  </Link>
                </div>
              )}
              {user?.role === 'freelancer' ? (
                <div className="grid gap-3">
                  <Button onClick={() => startWriting('manual')} disabled={isClosed} className="w-full rounded-full bg-[#082151] hover:bg-[#0d2f6f] disabled:opacity-50">
                    <FileText className="h-4 w-4" />
                    Rédiger manuellement
                  </Button>
                  <Button onClick={() => startWriting('ai')} disabled={isClosed} className="w-full rounded-full bg-[#df6422] hover:bg-[#c5551c] disabled:opacity-50">
                    <Sparkles className="h-4 w-4" />
                    Rédiger avec IA
                  </Button>
                </div>
              ) : (
                <Link to="/login" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#c02525] px-5 py-3 text-sm font-black text-white transition hover:bg-[#a91f1f]">
                  Se connecter pour répondre
                  <Send className="h-4 w-4" />
                </Link>
              )}
            </aside>
          </div>
        </section>
        <div className="pb-8 text-center">
          <Link to="/devis" className="text-sm font-black text-[#082151] hover:text-[#c02525]">Voir toutes les demandes disponibles</Link>
        </div>
      </div>
      {writeMode && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#082151]/70 px-4 py-6 backdrop-blur-sm">
          <form onSubmit={submit} className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[30px] bg-white shadow-2xl shadow-[#082151]/30">
            <div className="relative bg-gradient-to-br from-[#082151] to-[#2A4DEF] p-6 text-white">
              <button type="button" onClick={() => setWriteMode(null)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 transition hover:bg-white/20" aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/60">
                {writeMode === 'ai' ? 'Rédaction assistée' : 'Rédaction manuelle'}
              </p>
              <h2 className="mt-3 pr-10 text-2xl font-black">{demande.type_travaux}</h2>
              {writeMode === 'ai' && (
                <Button type="button" onClick={generateAi} loading={generating} className="mt-5 rounded-full bg-[#df6422] hover:bg-[#c5551c]">
                  <Brain className="h-4 w-4" />
                  Générer avec IA
                </Button>
              )}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {writeMode === 'ai' && (
                <textarea
                  value={form.instructions_supplementaires}
                  onChange={(event) => setForm({ ...form, instructions_supplementaires: event.target.value })}
                  placeholder="Instructions pour l'IA: ton, garantie, délai, éléments à inclure..."
                  className="min-h-[76px] w-full rounded-2xl border border-[#2A4DEF]/20 bg-[#2A4DEF]/5 px-4 py-3 text-sm font-semibold outline-none focus:border-[#2A4DEF] focus:ring-4 focus:ring-[#2A4DEF]/10"
                />
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Input label="Montant HT" type="number" value={form.montant_ht} onChange={(event) => updateAmount(event.target.value)} required />
                  <div className="pt-2">
                    <Button 
                      type="button" 
                      onClick={getPriceSuggestion} 
                      loading={suggestingPrice}
                      variant="outline"
                      className="w-full text-xs py-1 border-[#df6422] text-[#df6422] hover:bg-[#df6422]/10"
                    >
                      💡 Assistant de tarification IA
                    </Button>
                  </div>
                  {priceSuggestion && (
                    <div className="mt-2 text-xs p-3 bg-blue-50 text-blue-800 rounded-xl border border-blue-100">
                      <strong>Suggestion IA:</strong> ~{priceSuggestion.suggestion}€ (Min: {priceSuggestion.min}€, Max: {priceSuggestion.max}€)<br/>
                      <em>{priceSuggestion.reason}</em>
                      <button 
                        type="button" 
                        onClick={() => updateAmount(priceSuggestion.suggestion)}
                        className="mt-1 w-full font-bold underline text-[#df6422]"
                      >
                        Appliquer ce prix
                      </button>
                    </div>
                  )}
                </div>
                <label className="space-y-1 text-sm font-black text-slate-700">
                  TVA
                  <select value={form.taux_tva} onChange={(event) => updateAmount(event.target.value, 'taux_tva')} className={inputClass}>
                    {[0, 6, 12, 21].map((rate) => <option key={rate} value={rate}>{rate}%</option>)}
                  </select>
                </label>
                <Input label="TVA calculée" value={form.montant_tva} readOnly />
                <Input label="Total TTC" value={form.montant_ttc} readOnly />
              </div>

              <Input label="Délai de réalisation" value={form.delai_realisation} onChange={(event) => setForm({ ...form, delai_realisation: event.target.value })} />
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Description détaillée du devis"
                required
                className="min-h-[180px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 outline-none focus:border-[#2A4DEF] focus:ring-4 focus:ring-[#2A4DEF]/10"
              />

              <div>
                <p className="flex items-center gap-2 text-sm font-black text-[#082151]">
                  <Image className="h-4 w-4 text-[#df6422]" />
                  Images ou documents
                </p>
                <input type="file" multiple accept="image/*,.pdf,.doc,.docx" className="hidden" ref={fileRef} onChange={handleFiles} />
                <div className="mt-3 flex flex-wrap gap-3">
                  {files.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 text-center text-[10px] font-bold text-slate-600">
                      {file.type.startsWith('image/') ? <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" /> : <FileText className="h-6 w-6 text-[#082151]" />}
                      <button type="button" onClick={() => removeFile(index)} className="absolute right-1 top-1 rounded-full bg-[#c02525] p-1 text-white" aria-label="Retirer">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {files.length < 5 && (
                    <button type="button" onClick={() => fileRef.current?.click()} className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-xs font-black text-slate-400 transition hover:border-[#2A4DEF] hover:text-[#2A4DEF]">
                      <Sparkles className="mb-1 h-5 w-5" />
                      Ajouter
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 p-4 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setWriteMode(null)} className="rounded-full sm:w-1/3">Annuler</Button>
              <Button type="submit" loading={submitting} className="rounded-full bg-[#082151] hover:bg-[#0d2f6f] sm:w-2/3">
                <Send className="h-5 w-5" />
                Envoyer au client
              </Button>
            </div>
          </form>
        </div>
      )}
      <QuotaModal {...quotaModal} onClose={() => navigate('/freelancer/devis-disponibles')} />
      
      {/* Photo Enlarge Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-sm" onClick={() => setSelectedPhoto(null)}>
          <button className="absolute top-6 right-6 text-white hover:text-slate-300 transition-colors" onClick={() => setSelectedPhoto(null)}>
            <X className="h-10 w-10" />
          </button>
          <img src={selectedPhoto} alt="Agrandissement" className="max-h-[90vh] max-w-full rounded-2xl shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </main>
  )
}

const Block = ({ title, children }) => (
  <section className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5 sm:p-6">
    <h2 className="flex items-center gap-2 text-xl font-black text-[#082151]">
      <FileText className="h-5 w-5 text-[#c02525]" />
      {title}
    </h2>
    <div className="mt-4">{children}</div>
  </section>
)

const Info = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#082151]/80">
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </p>
    <p className="mt-2 font-black text-slate-900">{value || 'Non précisé'}</p>
  </div>
)

const Pill = ({ icon: Icon, children }) => (
  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
    <Icon className="h-4 w-4" />
    {children}
  </span>
)

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#2A4DEF] focus:ring-4 focus:ring-[#2A4DEF]/10 disabled:bg-slate-50'

const Input = ({ label, ...props }) => (
  <label className="space-y-1 text-sm font-black text-slate-700">
    {label}
    <input {...props} className={inputClass} />
  </label>
)

const isClosedStatus = (status) => ['traite', 'traité'].includes(String(status || '').trim().toLowerCase())

export default DevisDetail

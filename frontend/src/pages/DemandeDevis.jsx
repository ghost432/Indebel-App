import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import QuotaModal from '../components/devis/QuotaModal'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  Camera,
  CheckCircle2,
  ClipboardList,
  FileText,
  Home,
  MapPin,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound
} from 'lucide-react'
import { API_BASE_URL } from '../config'
import { getCommunesForRegionAndProvince, getProvincesForRegion } from '../data/belgianCommunes'

const REGIONS = [
  'Région de Bruxelles-Capitale',
  'Région Wallonne',
  'Région Flamande'
]

const FALLBACK_SECTORS = ['Rénovation & Construction', 'Transport & Logistique', 'Nettoyage & Multiservices']

const URGENCES = [
  { value: 'normale', label: 'Normale' },
  { value: 'urgente', label: 'Urgente' }
]

const emptyForm = (categorie = '') => ({
  typeTravaux: '',
  categorie,
  urgence: 'normale',
  budgetEstime: '',
  description: '',
  dateDebut: '',
  details: '',
  adresse: '',
  codePostal: '',
  region: '',
  province: '',
  ville: '',
  prenom: '',
  nom: '',
  email: '',
  telephone: ''
})

export default function DemandeDevis() {
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState(emptyForm(searchParams.get('categorie') || ''))
  const [photos, setPhotos] = useState([])
  const [sectors, setSectors] = useState(FALLBACK_SECTORS)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showQuotaModal, setShowQuotaModal] = useState(false)
  const [quotaMessage, setQuotaMessage] = useState('')
  const fileRef = useRef()
  const provinces = getProvincesForRegion(formData.region)
  const communes = getCommunesForRegionAndProvince(formData.region, formData.province)
  const availableCommunes = provinces.length > 0 && !formData.province ? [] : communes

  useEffect(() => {
    document.title = 'Demande de devis gratuit - Indebel'
    loadSectors()
  }, [])

  const loadSectors = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/secteurs`)
      const nextSectors = (response.data?.data || [])
        .filter((sector) => Number(sector.actif ?? 1) === 1)
        .map((sector) => String(sector.nom || '').trim())
        .filter(Boolean)
      if (nextSectors.length) setSectors(nextSectors)
    } catch (error) {
      setSectors(FALLBACK_SECTORS)
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === 'region' ? { province: '', ville: '' } : {}),
      ...(name === 'province' ? { ville: '' } : {})
    }))
  }

  const handlePhotos = (event) => {
    const files = Array.from(event.target.files || [])
    if (photos.length + files.length > 5) return toast.error('Maximum 5 photos autorisées')
    setPhotos((current) => [...current, ...files].slice(0, 5))
  }

  const removePhoto = (index) => setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const required = ['typeTravaux', 'description', 'adresse', 'codePostal', 'region', 'ville', 'prenom', 'nom', 'email', 'telephone']
    if (required.some((field) => !formData[field])) return toast.error('Veuillez remplir tous les champs obligatoires')
    if (provinces.length > 0 && !formData.province) return toast.error('Veuillez sélectionner une province')

    try {
      setLoading(true)
      const fichiersJoints = await Promise.all(photos.map(readFileAsDataUrl))
      const payload = {
        type_travaux: formData.typeTravaux,
        categorie: formData.categorie,
        description: formData.description,
        urgence: formData.urgence,
        budget_estime: formData.budgetEstime || null,
        adresse: formData.adresse,
        code_postal: formData.codePostal,
        region: formData.region,
        province: formData.province,
        ville: formData.ville,
        prenom: formData.prenom,
        nom: formData.nom,
        email: formData.email,
        telephone: formData.telephone,
        date_souhaite: formData.dateDebut || null,
        details_complementaires: formData.details || null,
        lieu_travaux: 'adresse_renseignee',
        travaux_adresse: formData.adresse,
        travaux_code_postal: formData.codePostal,
        travaux_region: formData.region,
        travaux_province: formData.province,
        travaux_ville: formData.ville,
        fichiers_joints: fichiersJoints
      }
      await axios.post(`${API_BASE_URL}/devis/create`, payload)
      toast.success('Votre demande de devis a bien été envoyée.')
      setSubmitted(true)
      setTimeout(() => {
        window.location.href = 'https://indebel.be'
      }, 1200)
    } catch (error) {
      if (error.response?.data?.code === 'DEMANDE_DEVIS_LIMIT_REACHED') {
        setQuotaMessage(error.response.data.message)
        setShowQuotaModal(true)
      } else {
        toast.error("Erreur lors de l'envoi. Veuillez réessayer.")
      }
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#f5f8ff] px-4 py-12">
        <section className="mx-auto max-w-xl rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-2xl shadow-[#082151]/10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#2A4DEF]/10 text-[#2A4DEF]">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="mt-6 text-3xl font-black text-[#082151]">Demande envoyée</h1>
          <p className="mt-4 leading-7 text-slate-600">
            Merci <strong>{formData.prenom} {formData.nom}</strong>. Votre demande a bien été reçue et une confirmation a été envoyée à <strong>{formData.email}</strong>.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/devis" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-black text-[#082151] hover:border-[#2A4DEF] hover:text-[#2A4DEF]">
              Voir les devis publics
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/" className="inline-flex items-center justify-center rounded-full bg-[#c02525] px-5 py-3 text-sm font-black text-white hover:bg-[#a91f1f]">
              Retour à l'accueil
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <>
      <main className="min-h-screen bg-[#f5f8ff]">
        <section className="relative overflow-hidden bg-[#082151] px-4 pt-12 pb-28 text-white sm:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(42,77,239,0.45),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(192,37,37,0.35),transparent_34%)]" />
        <div className="relative mx-auto max-w-6xl text-center sm:text-left">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white/80">
              <Sparkles className="h-4 w-4" />
              Devis gratuit
            </span>
            <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">Décrivez votre projet, recevez des devis qualifiés</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/75 sm:mx-0 mx-auto">
              Une demande claire, validée par Indebel, puis transmise aux prestataires disponibles dans votre région.
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto grid max-w-6xl gap-6 px-4 -mt-20 pb-8 sm:mt-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden h-max rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm lg:block">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#c02525]">Étapes</p>
          <div className="mt-5 space-y-3">
            <Step icon={ClipboardList} title="Projet" text="Travaux, secteur et détails." />
            <Step icon={MapPin} title="Lieu des travaux" text="Adresse, région et commune." />
            <Step icon={UserRound} title="Coordonnées" text="Contact pour recevoir les devis." />
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl shadow-[#082151]/8">
          <FormSection icon={ClipboardList} title="Détails du projet">
            <Field label="Type de travaux *">
              <input name="typeTravaux" value={formData.typeTravaux} onChange={handleChange} className={inputClass} placeholder="Ex: rénovation salle de bain" required />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Secteur">
                <select name="categorie" value={formData.categorie} onChange={handleChange} className={inputClass}>
                  <option value="">Sélectionnez un secteur</option>
                  {sectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
                </select>
              </Field>
              <Field label="Priorité">
                <select name="urgence" value={formData.urgence} onChange={handleChange} className={inputClass}>
                  {URGENCES.map((urgence) => <option key={urgence.value} value={urgence.value}>{urgence.label}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Description du projet *">
              <textarea name="description" value={formData.description} onChange={handleChange} rows={5} className={`${inputClass} resize-y`} placeholder="Décrivez vos besoins, vos contraintes et le résultat attendu." required />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Budget estimé (en €)">
                <input type="number" name="budgetEstime" value={formData.budgetEstime} onChange={handleChange} className={inputClass} placeholder="Ex: 1500" min="0" step="0.01" />
              </Field>
              <Field label="Date de début souhaitée">
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="date" name="dateDebut" value={formData.dateDebut} onChange={handleChange} className={`${inputClass} pl-11`} />
                </div>
              </Field>
            </div>
            
            <Field label="Détails complémentaires">
              <input name="details" value={formData.details} onChange={handleChange} className={inputClass} placeholder="Surface, étage, accès..." />
            </Field>

            <Field label="Photos du projet (optionnel, max 5)">
              <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#2A4DEF]/25 bg-[#2A4DEF]/5 px-4 py-7 text-center transition hover:border-[#2A4DEF] hover:bg-[#2A4DEF]/10">
                <input ref={fileRef} type="file" accept="image/png,image/jpeg" multiple onChange={handlePhotos} className="hidden" />
                <Camera className="h-8 w-8 text-[#2A4DEF]" />
                <span className="mt-3 text-sm font-black text-[#082151]">Ajouter des images optionnelles</span>
                <span className="mt-1 text-xs font-semibold text-slate-500">PNG ou JPG, 5 fichiers maximum</span>
              </button>
              {photos.length > 0 && (
                <div className="mt-3 grid gap-2">
                  {photos.map((photo, index) => (
                    <div key={`${photo.name}-${index}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
                      <span className="min-w-0 truncate">{photo.name}</span>
                      <button type="button" onClick={() => removePhoto(index)} className="ml-3 rounded-full p-2 text-[#c02525] hover:bg-[#c02525]/10" aria-label="Retirer la photo">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Field>
          </FormSection>

          <FormSection icon={MapPin} title="Lieu des travaux">
            <Field label="Adresse *">
              <div className="relative">
                <Home className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input name="adresse" value={formData.adresse} onChange={handleChange} className={`${inputClass} pl-11`} placeholder="Rue, numéro" required />
              </div>
            </Field>

            <div className={`grid gap-4 ${provinces.length > 0 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
              <Field label="Code postal *">
                <input name="codePostal" value={formData.codePostal} onChange={handleChange} className={inputClass} placeholder="1000" required />
              </Field>
              <Field label="Région *">
                <select name="region" value={formData.region} onChange={handleChange} className={inputClass} required>
                  <option value="">Région</option>
                  {REGIONS.map((region) => <option key={region} value={region}>{region}</option>)}
                </select>
              </Field>
              {provinces.length > 0 && (
                <Field label="Province *">
                  <select name="province" value={formData.province} onChange={handleChange} className={inputClass} required>
                    <option value="">Province</option>
                    {provinces.map((province) => <option key={province} value={province}>{province}</option>)}
                  </select>
                </Field>
              )}
              <Field label="Ville/Commune *">
                <select name="ville" value={formData.ville} onChange={handleChange} className={inputClass} required disabled={!formData.region || provinces.length > 0 && !formData.province}>
                  <option value="">
                    {!formData.region
                      ? 'Choisissez d’abord une région'
                      : provinces.length > 0 && !formData.province
                        ? 'Choisissez d’abord une province'
                        : 'Sélectionnez une ville/commune'}
                  </option>
                  {availableCommunes.map((commune) => <option key={commune.code} value={commune.name}>{commune.name}</option>)}
                </select>
              </Field>
            </div>
          </FormSection>

          <FormSection icon={UserRound} title="Vos coordonnées">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Prénom *">
                <input name="prenom" value={formData.prenom} onChange={handleChange} className={inputClass} placeholder="Prénom" required />
              </Field>
              <Field label="Nom *">
                <input name="nom" value={formData.nom} onChange={handleChange} className={inputClass} placeholder="Nom" required />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Email *">
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="votre@email.com" required />
              </Field>
              <Field label="Téléphone *">
                <input name="telephone" value={formData.telephone} onChange={handleChange} className={inputClass} placeholder="+32 123 45 67 89" required />
              </Field>
            </div>

            <button type="submit" disabled={loading} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#c02525] px-6 py-4 text-base font-black text-white shadow-xl shadow-[#c02525]/20 transition hover:bg-[#a91f1f] disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Envoi en cours...' : 'Envoyer ma demande de devis'}
              {!loading && <Send className="h-5 w-5" />}
            </button>
            <p className="mt-4 text-center text-xs font-semibold leading-6 text-slate-400">
              En soumettant ce formulaire, vous acceptez les{' '}
              <a href="https://indebel.be/cgu-particuliers" target="_blank" rel="noreferrer" className="font-black text-[#2A4DEF] hover:text-[#c02525]">
                conditions d'utilisation et politique de confidentialité
              </a>
              , et d'être contacté par des professionnels.
            </p>
          </FormSection>
        </form>
      </section>
      </main>
      
      <QuotaModal 
        isOpen={showQuotaModal}
        onClose={() => setShowQuotaModal(false)}
        message={quotaMessage}
      />
    </>
  )
}

const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#2A4DEF] focus:ring-4 focus:ring-[#2A4DEF]/10'

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve({
    nom: file.name,
    type: file.type,
    taille: file.size,
    data: reader.result
  })
  reader.onerror = reject
  reader.readAsDataURL(file)
})

const HeroStat = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#082151]">
      <Icon className="h-5 w-5" />
    </span>
    <span className="text-sm font-black">{label}</span>
  </div>
)

const Step = ({ icon: Icon, title, text }) => (
  <div className="flex gap-3 rounded-2xl bg-slate-50 p-3">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#2A4DEF]/10 text-[#2A4DEF]">
      <Icon className="h-5 w-5" />
    </span>
    <div>
      <p className="font-black text-[#082151]">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
    </div>
  </div>
)

const FormSection = ({ icon: Icon, title, children }) => (
  <section className="border-b border-slate-100 p-5 last:border-b-0 sm:p-7">
    <div className="mb-5 flex items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#082151] text-white">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="text-xl font-black text-[#082151]">{title}</h2>
    </div>
    <div className="space-y-4">{children}</div>
  </section>
)

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-black text-slate-700">{label}</span>
    {children}
  </label>
)

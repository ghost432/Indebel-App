import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Euro,
  Eye,
  FileText,
  Filter,
  MapPin,
  Search,
  Send,
  Sparkles,
  Users,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { missionService } from '../services/missionService'
import { demandeService } from '../services/demandeService'
import api from '../services/api'
import Button from '../components/Button'
import VerificationPopup from '../components/VerificationPopup'
import DevisUnlockModal from '../components/devis/DevisUnlockModal'

const itemsPerPage = 9

export default function PublicMissions() {
  const { type, id } = useParams()
  const [searchParams] = useSearchParams()
  const isDetail = Boolean(type && id)

  return isDetail ? (
    <PublicMissionDetail missionType={type} missionId={id} source={searchParams.get('source')} />
  ) : (
    <PublicMissionList />
  )
}

const PublicMissionList = () => {
  const navigate = useNavigate()
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date_desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [appliedMissions, setAppliedMissions] = useState([])
  const [quotaModal, setQuotaModal] = useState({ open: false, title: 'Limite atteinte', message: '', forfait: null, limit: null, current: null })
  const [openingMissionKey, setOpeningMissionKey] = useState(null)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [missionToUnlock, setMissionToUnlock] = useState(null)
  const [unlockingMission, setUnlockingMission] = useState(false)
  const [creditCost, setCreditCost] = useState(1)
  const [creditBalance, setCreditBalance] = useState(user?.solde_credits || 0)
  const { user, refreshUser } = useAuth()

  useEffect(() => {
    document.title = 'Missions publiques - Indebel'
    loadMissions()
  }, [])

  useEffect(() => {
    if (user?.role === 'freelancer') loadAppliedMissions()
    else setAppliedMissions([])
    if (user) fetchCreditInfo()
  }, [user])

  const fetchCreditInfo = async () => {
    try {
      const [settingsRes, balanceRes] = await Promise.all([
        api.get('/credits/settings/price').catch(() => api.get('/admin-credits/settings/price')).catch(() => ({ data: {} })),
        api.get('/credits/balance').catch(() => ({ data: {} }))
      ])
      if (settingsRes.data?.cout_vues_missions !== undefined) {
        setCreditCost(parseInt(settingsRes.data.cout_vues_missions, 10))
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

  const loadMissions = async () => {
    try {
      setLoading(true)
      const response = await missionService.getPublicMissions()
      setMissions(response.data?.data || [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible de charger les missions')
    } finally {
      setLoading(false)
    }
  }

  const loadAppliedMissions = async () => {
    try {
      const response = await demandeService.getFreelancerDemandes()
      const demandes = response.data?.data || []
      setAppliedMissions(demandes.map((demande) => `${demande.mission_type}-${demande.mission_id}`))
    } catch {
      setAppliedMissions([])
    }
  }

  const filteredMissions = useMemo(() => {
    const search = query.trim().toLowerCase()
    const list = missions.filter((mission) => {
      const matchesSearch = !search || [
        mission.titre,
        mission.description,
        mission.denomination,
        mission.categorie,
        mission.ville_mission,
        mission.adresse_mission,
        mission.localisation
      ].join(' ').toLowerCase().includes(search)
      const matchesType = typeFilter === 'all' || mission.mission_type === typeFilter
      return matchesSearch && matchesType
    })

    return [...list].sort((a, b) => {
      if (sortBy === 'date_asc') return new Date(a.date_creation) - new Date(b.date_creation)
      if (sortBy === 'titre_asc') return (a.titre || '').localeCompare(b.titre || '')
      if (sortBy === 'titre_desc') return (b.titre || '').localeCompare(a.titre || '')
      if (sortBy === 'budget_desc') return getMissionBudget(b) - getMissionBudget(a)
      if (sortBy === 'budget_asc') return getMissionBudget(a) - getMissionBudget(b)
      if (a.urgente && !b.urgente) return -1
      if (!a.urgente && b.urgente) return 1
      return new Date(b.date_creation) - new Date(a.date_creation)
    })
  }, [missions, query, typeFilter, sortBy])

  useEffect(() => {
    setCurrentPage(1)
  }, [query, typeFilter, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredMissions.length / itemsPerPage))
  const currentMissions = filteredMissions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const openMission = async (mission) => {
    if (user?.role === 'freelancer' && user?.statut_verification === 'non_verifie') {
      setShowVerificationModal(true)
      return
    }

    const path = `/missions/${mission.mission_type}/${mission.id}${mission.source ? `?source=${mission.source}` : ''}`
    if (user?.role !== 'freelancer') {
      navigate(path)
      return
    }

    const storageKey = `unlocked_mission_detail_${user.id}_${mission.id}`
    if (sessionStorage.getItem(storageKey) === 'true') {
      navigateToMission(mission, path)
      return
    }

    setMissionToUnlock({ ...mission, path })
  }

  const handleConfirmUnlockMission = async (mission) => {
    try {
      setUnlockingMission(true)
      const res = await api.post('/credits/consume', { action: 'view_mission_detail', amount: creditCost })
      if (res.data?.success) {
        const storageKey = `unlocked_mission_detail_${user?.id}_${mission.id}`
        sessionStorage.setItem(storageKey, 'true')
        if (res.data.newBalance !== undefined) {
          setCreditBalance(res.data.newBalance)
        }
        if (refreshUser) refreshUser()
        toast.success(`Mission débloquée ! ${res.data.deducted || creditCost} crédit(s) déduit(s).`)
        setMissionToUnlock(null)
        navigateToMission(mission, mission.path)
      }
    } catch (error) {
      if (error.response?.data?.code === 'INSUFFICIENT_CREDITS' || error.response?.status === 403) {
        // Géré dans la modale
      } else {
        toast.error(error.response?.data?.message || 'Erreur lors du déblocage')
      }
    } finally {
      setUnlockingMission(false)
    }
  }

  const navigateToMission = async (mission, path) => {
    try {
      const missionKey = `${mission.mission_type}-${mission.id}`
      setOpeningMissionKey(missionKey)
      await missionService.logView(mission.id, mission.mission_type, 'public_card')
      navigate(path)
    } catch (error) {
      if (error.response?.status === 403) {
        const message = error.response.data?.message || 'Vous avez atteint votre limite de vues de missions.'
        toast.error(message)
        setQuotaModal({
          open: true,
          title: 'Limite de vues atteinte',
          message,
          forfait: error.response.data?.forfait,
          limit: error.response.data?.limit,
          current: error.response.data?.viewed_count
        })
        return
      }
      navigate(path)
    } finally {
      setOpeningMissionKey(null)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f9fd]">
      <VerificationPopup 
        isOpen={showVerificationModal} 
        onClose={() => setShowVerificationModal(false)} 
      />
      <section className="border-b border-[#dce7f5] bg-[#f7f9fd] px-4 py-12 text-[#082151] sm:py-16">
        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-md bg-[#eaf2ff] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#044cf3]">
                <Briefcase className="h-4 w-4" />
                Opportunités publiques
              </span>
              <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">Missions disponibles</h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                Parcourez les missions publiées sur Indebel. Les prestataires connectés gardent les mêmes quotas de visualisation et de candidature IA.
              </p>
            </div>
            <Link to="/register-freelancer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#c02525] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#c02525]/15 transition hover:bg-[#a91f1f]">
              Devenir prestataire
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>


        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_220px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-[#044cf3] focus:bg-white focus:ring-4 focus:ring-[#044cf3]/10"
              placeholder="Rechercher une mission"
            />
          </div>
          <div className="relative">
            <Filter className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className={selectClass}>
              <option value="all">Tous les types</option>
              <option value="hourly">Forfait horaire</option>
              <option value="fixed">Forfait fixe</option>
            </select>
          </div>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className={selectClass}>
              <option value="date_desc">Plus récentes</option>
              <option value="date_asc">Plus anciennes</option>
              <option value="titre_asc">Titre A-Z</option>
              <option value="titre_desc">Titre Z-A</option>
              <option value="budget_desc">Budget décroissant</option>
              <option value="budget_asc">Budget croissant</option>
            </select>
          </div>
        </div>

        <p className="text-sm font-bold text-slate-500">
          {filteredMissions.length} mission{filteredMissions.length > 1 ? 's' : ''} disponible{filteredMissions.length > 1 ? 's' : ''}
        </p>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-lg bg-white ring-1 ring-slate-200" />)}
          </div>
        ) : currentMissions.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {currentMissions.map((mission) => (
              <MissionCard
                key={`${mission.source || 'employer'}-${mission.mission_type}-${mission.id}`}
                mission={mission}
                hasApplied={appliedMissions.includes(`${mission.mission_type}-${mission.id}`)}
                opening={openingMissionKey === `${mission.mission_type}-${mission.id}`}
                onOpen={() => openMission(mission)}
              />
            ))}
          </div>
        ) : (
          <EmptyState onReset={() => { setQuery(''); setTypeFilter('all') }} />
        )}

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`h-10 min-w-10 rounded-lg px-3 text-sm font-black transition ${
                  currentPage === index + 1
                    ? 'bg-[#082151] text-white'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}
      </section>

      <QuotaReachedModal data={quotaModal} onClose={() => setQuotaModal({ ...quotaModal, open: false })} />
      <DevisUnlockModal
        isOpen={!!missionToUnlock}
        onClose={() => setMissionToUnlock(null)}
        demande={missionToUnlock}
        itemType="mission"
        creditCost={creditCost}
        creditBalance={creditBalance}
        onConfirmUnlock={handleConfirmUnlockMission}
        unlocking={unlockingMission}
        user={user}
      />
    </main>
  )
}

const PublicMissionDetail = ({ missionType, missionId, source }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [mission, setMission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quotaModal, setQuotaModal] = useState({ open: false, title: 'Limite atteinte', message: '', forfait: null, limit: null, current: null })
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [writeMode, setWriteMode] = useState(null)
  const [applyMessage, setApplyMessage] = useState('')
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [aiCreditCost, setAiCreditCost] = useState(1)
  const [creditBalance, setCreditBalance] = useState(user?.solde_credits || 0)
  const hasLoggedRef = useRef(false)

  useEffect(() => {
    document.title = 'Détail mission - Indebel'
    loadMission()
    if (user) fetchCreditInfo()
  }, [missionId, missionType, source, user])

  const fetchCreditInfo = async () => {
    try {
      const [settingsRes, balanceRes] = await Promise.all([
        api.get('/credits/settings/price').catch(() => api.get('/admin-credits/settings/price')).catch(() => ({ data: {} })),
        api.get('/credits/balance').catch(() => ({ data: {} }))
      ])
      if (settingsRes.data?.cout_candidatures_ia !== undefined) {
        setAiCreditCost(parseInt(settingsRes.data.cout_candidatures_ia, 10))
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

  const loadMission = async () => {
    if (user?.role === 'freelancer' && user?.statut_verification === 'non_verifie') {
      setLoading(false)
      setShowVerificationModal(true)
      return
    }

    try {
      setLoading(true)
      if (user?.role === 'freelancer' && !hasLoggedRef.current) {
        hasLoggedRef.current = true
        await missionService.logView(missionId, missionType, 'public_detail')
      }
      const response = await missionService.getPublicMission(missionId, missionType, source)
      setMission(response.data?.data)
      await checkApplied()
    } catch (error) {
      if (error.response?.status === 403) {
        setQuotaModal({
          open: true,
          title: 'Limite de vues atteinte',
          message: error.response.data?.message || 'Vous avez atteint votre limite de vues de missions.',
          forfait: error.response.data?.forfait,
          limit: error.response.data?.limit,
          current: error.response.data?.viewed_count
        })
        setMission(null)
        return
      }
      toast.error(error.response?.data?.message || 'Mission indisponible')
    } finally {
      setLoading(false)
    }
  }

  const checkApplied = async () => {
    if (user?.role !== 'freelancer') return
    try {
      const response = await demandeService.getFreelancerDemandes()
      const demandes = response.data?.data || []
      setHasApplied(demandes.some((demande) => `${demande.mission_type}-${demande.mission_id}` === `${missionType}-${missionId}`))
    } catch {
      setHasApplied(false)
    }
  }

  const openWrite = (mode) => {
    if (user?.role !== 'freelancer') {
      navigate('/login')
      return
    }
    setApplyMessage('')
    setWriteMode(mode)
  }

  const generateAi = async () => {
    try {
      setGenerating(true)
      const response = await demandeService.generateAi({
        mission_id: mission.id,
        mission_type: mission.mission_type,
        instructions_supplementaires: applyMessage
      })
      setApplyMessage(response.data?.data?.message_freelancer || '')
      setWriteMode('manual')
      toast.success('Candidature IA générée')
    } catch (error) {
      if (error.response?.status === 403) {
        setQuotaModal({
          open: true,
          title: 'Limite de génération IA atteinte',
          message: error.response.data?.message || 'Vous avez atteint votre limite mensuelle de générations IA.',
          forfait: error.response.data?.forfait,
          limit: error.response.data?.limit,
          current: error.response.data?.currentCount
        })
        setWriteMode(null)
        return
      }
      toast.error(error.response?.data?.message || 'Erreur lors de la génération IA')
    } finally {
      setGenerating(false)
    }
  }

  const submitApplication = async (event) => {
    event.preventDefault()
    try {
      setSubmitting(true)
      await demandeService.createDemande({
        mission_id: mission.id,
        mission_type: mission.mission_type,
        message_freelancer: applyMessage,
        est_genere_par_ia: writeMode === 'ai'
      })
      toast.success('Candidature envoyée')
      setHasApplied(true)
      setWriteMode(null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l’envoi de la candidature')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-[#f5f8ff] px-4 py-8"><div className="mx-auto h-[520px] max-w-6xl animate-pulse rounded-[32px] bg-white ring-1 ring-slate-200" /></main>
  }

  return (
    <main className="min-h-screen bg-[#f5f8ff]">
      <section className="relative overflow-hidden bg-[#082151] px-4 py-10 text-white sm:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(42,77,239,0.44),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(223,100,34,0.32),transparent_36%)]" />
        <div className="relative mx-auto max-w-6xl">
          <button onClick={() => navigate('/missions')} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/15">
            <ArrowLeft className="h-4 w-4" />
            Retour aux missions
          </button>
          <p className="mt-8 text-xs font-black uppercase tracking-[0.24em] text-white/60">Mission publique</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight sm:text-5xl">{mission?.titre || 'Mission indisponible'}</h1>
          {mission && (
            <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-white/85">
              <Pill icon={Briefcase}>{mission.mission_type === 'hourly' ? 'Forfait horaire' : 'Forfait fixe'}</Pill>
              <Pill icon={Building2}>{mission.denomination || 'Entreprise'}</Pill>
              <Pill icon={MapPin}>{mission.ville_mission || mission.localisation || mission.adresse_mission || 'Lieu à préciser'}</Pill>
            </div>
          )}
        </div>
      </section>

      {!mission && !loading ? (
        <main className="min-h-screen bg-[#f7f9fd]">
          <VerificationPopup 
            isOpen={showVerificationModal} 
            onClose={() => setShowVerificationModal(false)} 
          />
          <section className="px-4 py-20 text-center">
            <FileText className="mx-auto h-16 w-16 text-slate-300" />
            <h1 className="mt-4 text-2xl font-black text-[#082151]">Mission introuvable ou accès restreint</h1>
            <Button onClick={() => navigate('/missions')} className="mt-6 bg-[#082151] hover:bg-[#0d2f6f] text-white">
              Retour aux missions
            </Button>
          </section>
        </main>
      ) : (
        <section className="mx-auto max-w-6xl space-y-6 px-4 py-8">
          <div className="overflow-hidden rounded-[34px] bg-white shadow-2xl shadow-[#082151]/10 ring-1 ring-slate-200">
            <div className="grid gap-8 p-6 lg:grid-cols-[1fr_360px] sm:p-10">
              <article className="space-y-6">
                <Block title="Description de la mission">
                  <p className="whitespace-pre-wrap leading-8 text-slate-700">{mission.description || 'Non renseigné'}</p>
                </Block>
                {mission.competences && (
                  <Block title="Compétences recherchées">
                    <TagList value={mission.competences} />
                  </Block>
                )}
              </article>

              <aside className="space-y-4">
                <Info icon={Euro} label="Budget" value={formatBudget(mission)} />
                <Info icon={Clock} label="Type de mission" value={mission.type_mission || 'Non précisé'} />
                <Info icon={Users} label="Profils recherchés" value={mission.nombre_independants ? `${mission.nombre_independants} personne(s)` : 'Non précisé'} />
                <Info icon={CalendarDays} label="Début souhaité" value={formatDate(mission.date_debut)} />
                <Info icon={MapPin} label="Adresse" value={mission.adresse_mission || mission.localisation || mission.ville_mission} />

                {hasApplied ? (
                  <div className="rounded-2xl border border-[#df6422]/20 bg-[#df6422]/10 p-5 text-[#9a3f12]">
                    <p className="flex items-center gap-2 font-black">
                      <CheckCircle2 className="h-5 w-5" />
                      Candidature envoyée
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    <Button onClick={() => openWrite('manual')} className="w-full rounded-full bg-[#082151] hover:bg-[#0d2f6f]">
                      <FileText className="h-4 w-4" />
                      Postuler manuellement
                    </Button>
                    <Button onClick={() => openWrite('ai')} className="w-full rounded-full bg-[#df6422] hover:bg-[#c5551c]">
                      <Sparkles className="h-4 w-4" />
                      Postuler avec IA
                    </Button>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </section>
      )}

      {writeMode && mission && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#082151]/70 px-4 py-6 backdrop-blur-sm">
          <form onSubmit={submitApplication} className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[30px] bg-white shadow-2xl shadow-[#082151]/30">
            <div className="relative bg-gradient-to-br from-[#082151] to-[#2A4DEF] p-6 text-white">
              <button type="button" onClick={() => setWriteMode(null)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 transition hover:bg-white/20" aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/60">
                {writeMode === 'ai' ? 'Candidature assistée' : 'Candidature manuelle'}
              </p>
              <h2 className="mt-3 pr-10 text-2xl font-black">{mission.titre}</h2>
              {writeMode === 'ai' && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-white/10 p-3 text-xs font-semibold text-white/90 border border-white/20">
                    <span>✨ Tarif Candidature IA : <strong className="text-white">{aiCreditCost} crédit{aiCreditCost > 1 ? 's' : ''}</strong></span>
                    <span>Solde actuel : <strong className={creditBalance < aiCreditCost ? "text-amber-300 font-bold" : "text-emerald-300 font-bold"}>{creditBalance} crédit{creditBalance > 1 ? 's' : ''}</strong></span>
                  </div>

                  {creditBalance < aiCreditCost ? (
                    <div className="rounded-xl bg-red-500/20 border border-red-400/40 p-3 text-xs text-red-100 font-bold space-y-2">
                      <p className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-300 flex-shrink-0" />
                        Crédits insuffisants pour la génération IA ({creditBalance} / {aiCreditCost} crédit{aiCreditCost > 1 ? 's' : ''}).
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate(user?.role === 'employer' ? '/employer/credits' : '/freelancer/credits')}
                        className="inline-flex items-center justify-center rounded-lg bg-[#c02525] px-3 py-2 text-xs font-black text-white hover:bg-[#a91f1f] w-full"
                      >
                        Recharger mes crédits
                      </button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      onClick={generateAi}
                      loading={generating}
                      disabled={creditBalance < aiCreditCost}
                      className="w-full justify-center rounded-full bg-[#df6422] hover:bg-[#c5551c]"
                    >
                      <Sparkles className="h-4 w-4" />
                      Générer avec IA ({aiCreditCost} crédit{aiCreditCost > 1 ? 's' : ''})
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <textarea
                value={applyMessage}
                onChange={(event) => setApplyMessage(event.target.value)}
                placeholder={writeMode === 'ai' ? "Instructions pour l'IA..." : 'Votre message de motivation...'}
                required={writeMode === 'manual'}
                className="min-h-[180px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 outline-none focus:border-[#2A4DEF] focus:ring-4 focus:ring-[#2A4DEF]/10"
              />
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 p-4 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setWriteMode(null)} className="rounded-full sm:w-1/3">Annuler</Button>
              <Button type="submit" loading={submitting} disabled={writeMode === 'ai' || !applyMessage.trim()} className="rounded-full bg-[#082151] hover:bg-[#0d2f6f] sm:w-2/3">
                <Send className="h-5 w-5" />
                Envoyer
              </Button>
            </div>
          </form>
        </div>
      )}

      <QuotaReachedModal data={quotaModal} onClose={() => setQuotaModal({ ...quotaModal, open: false })} />
    </main>
  )
}

const MissionCard = ({ mission, hasApplied, opening, onOpen }) => (
  <article className="group flex min-h-[330px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#2A4DEF]/35 hover:shadow-xl hover:shadow-[#082151]/10">
    <div className="flex items-start justify-between gap-3">
      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${mission.mission_type === 'hourly' ? 'bg-[#2A4DEF]/10 text-[#2A4DEF]' : 'bg-[#df6422]/10 text-[#df6422]'}`}>
        {mission.mission_type === 'hourly' ? 'Horaire' : 'Fixe'}
      </span>
      {mission.urgente ? <span className="rounded-full bg-[#c02525]/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#c02525]">Urgent</span> : null}
    </div>
    <h2 className="mt-5 min-h-[56px] text-xl font-black leading-tight text-[#082151] line-clamp-2">{mission.titre}</h2>
    <p className="mt-4 line-clamp-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-500">{mission.description || 'Description non renseignée'}</p>
    <div className="mt-auto space-y-3 pt-5 text-sm font-bold text-slate-600">
      <Meta icon={Building2}>{mission.denomination || 'Entreprise'}</Meta>
      <Meta icon={MapPin}>{mission.ville_mission || mission.localisation || mission.adresse_mission || 'Lieu à préciser'}</Meta>
      <Meta icon={Euro}>{formatBudget(mission)}</Meta>
    </div>
    {hasApplied ? (
      <div className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#df6422]/20 bg-[#df6422]/10 px-5 py-3 text-sm font-black text-[#9a3f12]">
        <CheckCircle2 className="h-4 w-4" />
        Déjà postulé
      </div>
    ) : (
      <button onClick={onOpen} disabled={opening} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#082151] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0d2f6f] disabled:cursor-wait disabled:opacity-70">
        <Eye className="h-4 w-4" />
        {opening ? 'Vérification...' : 'Voir détail'}
      </button>
    )}
  </article>
)

const EmptyState = ({ onReset }) => (
  <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center">
    <Briefcase className="mx-auto h-12 w-12 text-slate-300" />
    <h2 className="mt-4 text-2xl font-black text-[#082151]">Aucune mission trouvée</h2>
    <p className="mt-2 text-slate-500">Essayez une autre recherche ou revenez plus tard.</p>
    <button onClick={onReset} className="mt-5 rounded-full bg-[#082151] px-5 py-3 text-sm font-black text-white">Réinitialiser</button>
  </div>
)

const QuotaReachedModal = ({ data, onClose }) => {
  if (!data?.open) return null
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#082151]/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-[30px] bg-white shadow-2xl shadow-[#082151]/25">
        <div className="relative bg-gradient-to-br from-[#082151] to-[#2A4DEF] p-6 text-white">
          <button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 transition hover:bg-white/20" aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#df6422] text-white">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="mt-5 pr-10 text-2xl font-black">{data.title}</h2>
          <p className="mt-2 text-sm leading-6 text-white/75">{data.message}</p>
        </div>
        <div className="space-y-4 p-6">
          {((data.limit !== null && data.limit !== undefined) || (data.current !== null && data.current !== undefined)) && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700">
              <div className="flex justify-between"><span>Forfait</span><span>{data.forfait?.nom || data.forfait || 'Actuel'}</span></div>
              <div className="mt-2 flex justify-between"><span>Utilisation</span><span>{data.current ?? 0} / {data.limit ?? 'illimité'}</span></div>
            </div>
          )}
          <Link to="/freelancer/forfaits" className="inline-flex w-full items-center justify-center rounded-full bg-[#082151] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0d2f6f]">
            Voir les forfaits
          </Link>
        </div>
      </div>
    </div>
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
    <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
      <Icon className="h-4 w-4" />
      {label}
    </p>
    <p className="mt-2 font-black text-slate-900">{value || 'Non précisé'}</p>
  </div>
)

const Meta = ({ icon: Icon, children }) => (
  <p className="flex items-center gap-3">
    <Icon className="h-4 w-4 text-slate-400" />
    <span className="line-clamp-1">{children}</span>
  </p>
)

const Pill = ({ icon: Icon, children }) => (
  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
    <Icon className="h-4 w-4" />
    {children}
  </span>
)



const TagList = ({ value }) => {
  const values = parseList(value)
  if (!values.length) return <p className="text-slate-500">Non précisées</p>
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((item) => <span key={item} className="rounded-full bg-[#2A4DEF]/10 px-4 py-2 text-sm font-black text-[#2A4DEF]">{item}</span>)}
    </div>
  )
}

const parseList = (value) => {
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return String(value || '').split(',').map((item) => item.trim()).filter(Boolean)
  }
}

const getMissionBudget = (mission) => Number(mission.forfait_mission || mission.budget_projet || mission.forfait_heure || 0)
const formatBudget = (mission) => {
  if (mission.forfait_heure) return `${mission.forfait_heure} €/h`
  if (mission.forfait_mission) return `${mission.forfait_mission} €`
  if (mission.budget_projet) return `${mission.budget_projet} €`
  return 'Budget à préciser'
}
const formatDate = (date) => date ? new Date(date).toLocaleDateString('fr-FR') : 'Non précisée'
const selectClass = 'w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-[#2A4DEF] focus:bg-white focus:ring-4 focus:ring-[#2A4DEF]/10'

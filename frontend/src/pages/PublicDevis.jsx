import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Briefcase, CalendarDays, FileText, MapPin, RefreshCw, Search, Users, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../components/Button'
import DevisCard from '../components/devis/DevisCard'
import VerificationPopup from '../components/VerificationPopup'
import { devisService } from '../services/devisService'
import { useAuth } from '../context/AuthContext'

const PublicDevis = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [demandes, setDemandes] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 9 })
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [closedDemande, setClosedDemande] = useState(null)
  const [openingId, setOpeningId] = useState(null)
  const [showVerificationModal, setShowVerificationModal] = useState(false)

  useEffect(() => {
    document.title = 'Devis disponibles - Indebel'
    loadDevis(1)
  }, [])

  const loadDevis = async (page = 1) => {
    try {
      setLoading(true)
      const response = await devisService.getDevisValides({ page, limit: 9 })
      setDemandes(response.data?.data || [])
      setPagination(response.data?.pagination || { page, totalPages: 1, total: 0, limit: 9 })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible de charger les devis disponibles')
    } finally {
      setLoading(false)
    }
  }

  const filteredDemandes = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return demandes
    return demandes.filter((demande) => {
      const text = [
        demande.type_travaux,
        demande.categorie,
        demande.ville,
        demande.region,
        demande.description
      ].join(' ').toLowerCase()
      return text.includes(value)
    })
  }, [demandes, query])

  const currentPage = Number(pagination.currentPage || pagination.page || 1)
  const totalPages = Number(pagination.totalPages || pagination.pages || 1)

  const openDetail = async (demande) => {
    if (user?.role === 'freelancer' && user?.statut_verification === 'non_verifie') {
      setShowVerificationModal(true)
      return
    }

    if (isClosedStatus(demande?.statut)) {
      toast.error('Ce devis ne reçoit plus de demandes.')
      setClosedDemande(demande)
      return
    }

    try {
      setOpeningId(demande.id)
      const response = await devisService.getPublicDemandeStatus(demande.id)
      const freshDemande = response.data?.data || demande
      if (isClosedStatus(freshDemande?.statut)) {
        toast.error('Ce devis ne reçoit plus de demandes.')
        setClosedDemande(freshDemande)
        return
      }
      navigate(`/devis/${demande.id}`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible d’ouvrir cette demande')
    } finally {
      setOpeningId(null)
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
              <span className="inline-flex items-center gap-2 rounded-md bg-[#fff0e5] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#c02525]">
                <Briefcase className="h-4 w-4" />
                Opportunités publiques
              </span>
              <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">Devis disponibles</h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-800 font-medium">
                Consultez les demandes validées par Indebel. Les informations sensibles restent protégées jusqu'à la connexion.
              </p>
            </div>
            <Link to="/demande-devis" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#c02525] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#c02525]/15 transition hover:bg-[#a91f1f]">
              Demander un devis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>


        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-[#044cf3] focus:bg-white focus:ring-4 focus:ring-[#044cf3]/10"
              placeholder="Rechercher par ville, catégorie ou travaux"
            />
          </div>
          <Button variant="outline" onClick={() => loadDevis(currentPage)} className="rounded-full">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className="h-72 animate-pulse rounded-lg bg-white ring-1 ring-slate-200" />
            ))}
          </div>
        ) : filteredDemandes.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredDemandes.map((demande) => (
              <DevisCard
                key={demande.id}
                demande={demande}
                onOpen={() => openDetail(demande)}
                actions={openingId === demande.id ? (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-500">
                    Vérification...
                  </span>
                ) : null}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
            <MapPin className="mx-auto h-12 w-12 text-slate-300" />
            <h2 className="mt-4 text-2xl font-black text-[#082151]">Aucun devis trouvé</h2>
            <p className="mt-2 text-slate-700 font-semibold">Essayez une autre recherche ou revenez plus tard.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => loadDevis(index + 1)}
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
    </main>
  )
}



const isClosedStatus = (status) => ['traite', 'traité'].includes(String(status || '').trim().toLowerCase())

export default PublicDevis

import { useEffect, useMemo, useState } from 'react'
import { Eye, MessageSquare, Star, UserRound } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../components/Button'
import Card from '../components/Card'
import PageLoader from '../components/PageLoader'
import { avisService } from '../services/avisService'

const renderStars = (note) => (
  <div className="flex items-center gap-1" aria-label={`${note}/5`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-4 w-4 ${star <= Number(note) ? 'fill-[#c02525] text-[#c02525]' : 'text-slate-300'}`}
      />
    ))}
  </div>
)

const FreelancerEvaluationsParticulier = () => {
  const [avis, setAvis] = useState([])
  const [stats, setStats] = useState(null)
  const [distribution, setDistribution] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'Avis particuliers reçus - Indebel'
    loadAvis()
  }, [page])

  const loadAvis = async () => {
    try {
      setLoading(true)
      const res = await avisService.getMyAvis({ page, limit: 15 })
      const payload = res.data?.data || {}
      setAvis(payload.avis || [])
      setStats(payload.stats || null)
      setDistribution(payload.distribution || [])
      setPagination(payload.pagination || null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible de charger vos avis particuliers')
    } finally {
      setLoading(false)
    }
  }

  const average = Number(stats?.note_moyenne || 0)
  const total = Number(stats?.total_avis || 0)
  const publicCount = Number(stats?.avis_publics || 0)
  const fiveStars = Number(stats?.cinq_etoiles || 0)
  const distributionMap = useMemo(() => {
    return distribution.reduce((acc, item) => ({ ...acc, [Number(item.note)]: Number(item.count) }), {})
  }, [distribution])

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#c02525]">Avis particuliers</p>
            <h1 className="mt-3 text-3xl font-black text-[#082151] md:text-4xl">Avis publics reçus</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Retrouvez ici les retours laissés depuis la page publique par les particuliers.
            </p>
          </div>
          <a
            href="/avis-particulier"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#082151] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#0b2d6c]"
          >
            <Eye className="h-4 w-4" />
            Voir la page publique
          </a>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-200">
          <p className="text-sm font-bold text-slate-500">Note moyenne</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-4xl font-black text-[#082151]">{average.toFixed(1)}</span>
            <span className="pb-1 text-sm font-bold text-slate-400">/5</span>
          </div>
          <div className="mt-3">{renderStars(Math.round(average))}</div>
        </Card>
        <Card className="border-slate-200">
          <p className="text-sm font-bold text-slate-500">Total avis</p>
          <p className="mt-3 text-4xl font-black text-[#082151]">{total}</p>
        </Card>
        <Card className="border-slate-200">
          <p className="text-sm font-bold text-slate-500">Avis publics</p>
          <p className="mt-3 text-4xl font-black text-[#c02525]">{publicCount}</p>
        </Card>
        <Card className="border-slate-200">
          <p className="text-sm font-bold text-slate-500">5 étoiles</p>
          <p className="mt-3 text-4xl font-black text-[#082151]">{fiveStars}</p>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="border-slate-200">
          <h2 className="text-lg font-black text-[#082151]">Répartition</h2>
          <div className="mt-5 space-y-3">
            {[5, 4, 3, 2, 1].map((note) => {
              const count = distributionMap[note] || 0
              const width = total ? Math.round((count / total) * 100) : 0
              return (
                <div key={note} className="grid grid-cols-[54px_1fr_32px] items-center gap-3 text-sm">
                  <span className="font-bold text-slate-600">{note} ★</span>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#c02525]" style={{ width: `${width}%` }} />
                  </div>
                  <span className="text-right font-bold text-slate-500">{count}</span>
                </div>
              )
            })}
          </div>
        </Card>

        <div className="space-y-4">
          {avis.length === 0 ? (
            <Card className="border-dashed border-slate-300 bg-slate-50">
              <div className="py-12 text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-slate-400" />
                <p className="mt-4 text-lg font-bold text-slate-700">Aucun avis particulier reçu</p>
                <p className="mt-2 text-sm text-slate-500">Les avis envoyés depuis la page publique apparaîtront ici.</p>
              </div>
            </Card>
          ) : (
            avis.map((item) => (
              <article key={item.id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#082151] text-white">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-[#082151]">{item.nom_auteur}</h3>
                      <p className="text-xs font-semibold text-slate-400">
                        {new Date(item.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {renderStars(item.note)}
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${item.statut === 'public' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {item.statut === 'public' ? 'Public' : 'En modération'}
                    </span>
                  </div>
                </div>
                <p className="mt-4 rounded-2xl bg-slate-50 p-4 leading-7 text-slate-700">{item.commentaire}</p>
              </article>
            ))
          )}

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>
                Précédent
              </Button>
              <span className="text-sm font-bold text-slate-500">Page {pagination.page} / {pagination.pages}</span>
              <Button variant="outline" disabled={page >= pagination.pages} onClick={() => setPage((value) => value + 1)}>
                Suivant
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default FreelancerEvaluationsParticulier

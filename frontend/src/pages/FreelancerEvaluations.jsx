import { useEffect, useMemo, useState } from 'react'
import { Award, Briefcase, CheckCircle2, MessageSquare, Star, ThumbsUp, UserRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { evaluationService } from '../services/evaluationService'
import Button from '../components/Button'
import Card from '../components/Card'
import PageLoader from '../components/PageLoader'

const renderStars = (note) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-4 w-4 ${star <= Number(note) ? 'fill-[#c02525] text-[#c02525]' : 'text-slate-300'}`}
      />
    ))}
  </div>
)

const score = (value) => Number(value || 0)

const FreelancerEvaluations = () => {
  const { user } = useAuth()
  const [evaluations, setEvaluations] = useState([])
  const [stats, setStats] = useState(null)
  const [distribution, setDistribution] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    document.title = 'Avis après missions - Indebel'
    if (user?.id) {
      fetchEvaluations()
    }
  }, [user?.id, page])

  const fetchEvaluations = async () => {
    try {
      setLoading(true)
      const response = await evaluationService.getFreelancerEvaluations(user.id, page, 15)
      const payload = response.data?.data || {}
      setEvaluations(payload.evaluations || [])
      setStats(payload.stats || null)
      setDistribution(payload.distribution || [])
      setPagination(payload.pagination || null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement des évaluations')
    } finally {
      setLoading(false)
    }
  }

  const average = score(stats?.note_moyenne)
  const total = Number(stats?.total_evaluations || 0)
  const recommendationRate = total ? Math.round((Number(stats?.total_recommandations || 0) / total) * 100) : 0
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
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#c02525]">Avis après missions</p>
            <h1 className="mt-3 text-3xl font-black text-[#082151] md:text-4xl">Évaluations reçues</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Consultez les retours laissés par les recruteurs après les missions terminées.
            </p>
          </div>
          <div className="rounded-[24px] bg-[#082151] px-5 py-4 text-white shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Synthèse</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-4xl font-black">{average.toFixed(1)}</span>
              {renderStars(Math.round(average))}
            </div>
          </div>
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
          <p className="text-sm font-bold text-slate-500">Total évaluations</p>
          <p className="mt-3 text-4xl font-black text-[#082151]">{total}</p>
        </Card>
        <Card className="border-slate-200">
          <p className="text-sm font-bold text-slate-500">Recommandations</p>
          <p className="mt-3 text-4xl font-black text-[#c02525]">{recommendationRate}%</p>
        </Card>
        <Card className="border-slate-200">
          <p className="text-sm font-bold text-slate-500">Qualité moyenne</p>
          <p className="mt-3 text-4xl font-black text-[#082151]">{score(stats?.qualite_moyenne).toFixed(1)}</p>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
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

          <Card className="border-slate-200">
            <h2 className="text-lg font-black text-[#082151]">Critères</h2>
            <div className="mt-5 space-y-5">
              {[
                ['Qualité', stats?.qualite_moyenne, Award],
                ['Délais', stats?.delais_moyen, CheckCircle2],
                ['Communication', stats?.communication_moyenne, MessageSquare]
              ].map(([label, value, Icon]) => {
                const current = score(value)
                return (
                  <div key={label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-bold text-slate-600"><Icon className="h-4 w-4 text-[#c02525]" /> {label}</span>
                      <span className="font-black text-[#082151]">{current.toFixed(1)}/5</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-[#082151]" style={{ width: `${(current / 5) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {evaluations.length === 0 ? (
            <Card className="border-dashed border-slate-300 bg-slate-50">
              <div className="py-12 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-slate-400" />
                <p className="mt-4 text-lg font-bold text-slate-700">Aucune évaluation après mission</p>
                <p className="mt-2 text-sm text-slate-500">Les recruteurs pourront vous évaluer après une mission terminée.</p>
              </div>
            </Card>
          ) : (
            evaluations.map((evaluation) => {
              const author = evaluation.employer_denomination || `${evaluation.employer_prenom || ''} ${evaluation.employer_nom || ''}`.trim() || 'Recruteur'
              return (
                <article key={evaluation.id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#082151] text-white">
                        {evaluation.employer_photo ? (
                          <img src={evaluation.employer_photo} alt={author} className="h-full w-full object-cover" />
                        ) : (
                          <UserRound className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-black text-[#082151]">{author}</h3>
                        <p className="text-xs font-semibold text-slate-400">
                          {new Date(evaluation.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {renderStars(evaluation.note)}
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-[#c02525]">{evaluation.note}/5</span>
                    </div>
                  </div>

                  {evaluation.commentaire && (
                    <p className="mt-4 rounded-2xl bg-slate-50 p-4 leading-7 text-slate-700">{evaluation.commentaire}</p>
                  )}

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-3 text-center">
                      <p className="text-xs font-bold text-slate-500">Qualité</p>
                      <p className="mt-1 text-xl font-black text-[#082151]">{evaluation.qualite_travail}/5</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 text-center">
                      <p className="text-xs font-bold text-slate-500">Délais</p>
                      <p className="mt-1 text-xl font-black text-[#082151]">{evaluation.respect_delais}/5</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 text-center">
                      <p className="text-xs font-bold text-slate-500">Communication</p>
                      <p className="mt-1 text-xl font-black text-[#082151]">{evaluation.communication}/5</p>
                    </div>
                  </div>

                  {evaluation.recommandation ? (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
                      <ThumbsUp className="h-4 w-4" />
                      Recommandé par ce recruteur
                    </div>
                  ) : null}
                </article>
              )
            })
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

export default FreelancerEvaluations

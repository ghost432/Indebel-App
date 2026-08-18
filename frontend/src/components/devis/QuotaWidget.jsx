import { useEffect, useMemo, useState } from 'react'
import { Briefcase, Eye, PenLine, X } from 'lucide-react'
import { devisService } from '../../services/devisService'

const pct = (used, limit) => {
  if (limit === null || limit === undefined || Number(limit) === 0) return 0
  return Math.min(100, Math.round((Number(used || 0) / Number(limit)) * 100))
}

const QuotaLine = ({ icon: Icon, label, used, limit, color }) => {
  const percent = pct(used, limit)
  const unlimited = limit === null || limit === undefined

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 font-semibold text-slate-700">
          <Icon className="h-4 w-4" style={{ color }} />
          {label}
        </span>
        <span className="font-black text-slate-900">
          {unlimited ? 'Illimité' : `${used || 0} / ${limit}`}
        </span>
      </div>
      {!unlimited && (
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${percent}%`, backgroundColor: color }}
          />
        </div>
      )}
    </div>
  )
}

const QuotaWidget = () => {
  const [status, setStatus] = useState(null)
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await devisService.getForfaitStatus()
        setStatus(res.data?.forfait || null)
      } catch {
        setStatus(null)
      }
    }
    load()
    const timer = setInterval(load, 60000)
    return () => clearInterval(timer)
  }, [])

  const alertPct = useMemo(() => {
    if (!status) return 0
    return Math.max(
      pct(status.viewed_count, status.max_devis),
      pct(status.compteur_devis_ia, status.limite_devis_ia),
      pct(status.mission_viewed_count, status.max_vues_missions)
    )
  }, [status])

  if (!status || closed || alertPct < 50) return null

  return (
    <div className="fixed bottom-5 right-5 z-40 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#c02525]">Suivi forfait</p>
          <h3 className="mt-1 text-lg font-black text-[#082151]">{status.nom || 'Forfait actuel'}</h3>
        </div>
        <button
          type="button"
          onClick={() => setClosed(true)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          aria-label="Fermer le suivi des quotas"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-4">
        <QuotaLine icon={Eye} label="Visualisation Devis" used={status.viewed_count} limit={status.max_devis} color="#082151" />
        <QuotaLine icon={PenLine} label="Rédacteur Devis IA" used={status.compteur_devis_ia} limit={status.limite_devis_ia} color="#c02525" />
        <QuotaLine icon={Briefcase} label="Visualisation Missions" used={status.mission_viewed_count} limit={status.max_vues_missions} color="#df6422" />
      </div>
    </div>
  )
}

export default QuotaWidget

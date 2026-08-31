import { Calendar, Euro, MapPin, Timer, Users } from 'lucide-react'
import Button from '../Button'

const statusLabel = {
  en_attente: 'En attente',
  valide: 'Client trouvé',
  refuse: 'Refusé',
  traite: 'Traité',
  devis_complet: 'Complet',
  retire_liste: 'Retiré'
}

const statusClass = {
  en_attente: 'bg-amber-50 text-amber-700 ring-amber-200',
  valide: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  refuse: 'bg-rose-50 text-rose-700 ring-rose-200',
  traite: 'bg-blue-50 text-blue-700 ring-blue-200',
  devis_complet: 'bg-violet-50 text-violet-700 ring-violet-200',
  retire_liste: 'bg-slate-100 text-slate-600 ring-slate-200'
}

export const formatDate = (value) => {
  if (!value) return 'Non précisée'
  return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const formatMoney = (value) => {
  if (value === null || value === undefined || value === '') return 'Budget non précisé'
  return `${Number(value).toLocaleString('fr-FR')} €`
}

const DevisCard = ({ 
  demande, 
  onOpen, 
  actions, 
  variant = 'default',
  isAdmin = false 
}) => (
  <article className="group h-full flex flex-col rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm transition-all hover:shadow-md hover:border-[#c02525]/30 overflow-hidden break-words relative">
    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#082151] via-[#c02525] to-[#082151] opacity-0 group-hover:opacity-100 transition-opacity" />
    
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex-1 min-w-0 w-full">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50/80 px-2.5 py-0.5 rounded-full border border-blue-100">
            {demande.categorie || 'Demande de devis'}
          </p>
          {isAdmin && demande.statut && (
            <span className={`whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ring-1 ${statusClass[demande.statut] || 'bg-slate-50 text-slate-700 ring-slate-200'}`}>
              {statusLabel[demande.statut] || demande.statut}
            </span>
          )}
        </div>
        <h3 className="mt-2 text-base font-bold text-[#082151] group-hover:text-[#c02525] transition-colors">
          {demande.type_travaux || 'Projet client'}
        </h3>
        
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-700">
          <span className="flex items-center gap-1.5 font-semibold"><MapPin className="h-4 w-4 text-slate-600" /> {demande.ville || 'Belgique'}</span>
          <span className="flex items-center gap-1.5 font-semibold"><Calendar className="h-4 w-4 text-slate-600" /> {formatDate(demande.date_souhaite || demande.created_at)}</span>
          {isAdmin && (
            <span className="flex items-center gap-1.5 font-semibold"><Users className="h-4 w-4 text-slate-600" /> {demande.nb_devis_soumis || 0}/5 devis</span>
          )}
        </div>
      </div>
      
      <div className="text-right flex flex-col items-end gap-2">
        <div className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-center min-w-[100px] shadow-sm">
          {demande.budget_estime ? (
            <p className="text-sm font-bold text-[#df6422]">{formatMoney(demande.budget_estime)}</p>
          ) : (
            <p className="text-sm font-semibold text-[#df6422] py-0.5">Non précisé</p>
          )}
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Budget estimé</p>
        </div>
        {demande.urgence && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-[#c02525]">
            <Timer className="h-3.5 w-3.5" />
            Urgent
          </div>
        )}
      </div>
    </div>

    <p className="mt-6 line-clamp-3 text-sm leading-relaxed text-slate-800 bg-slate-50/50 p-6 rounded-3xl border border-slate-100 break-words overflow-hidden font-medium">
      {demande.description || demande.details_complementaires || 'Aucune description fournie.'}
    </p>

    <div className="mt-auto pt-6 flex justify-end gap-2">
      {onOpen && (
        <Button onClick={() => onOpen(demande)} className="bg-[#082151] hover:bg-[#0d2f6f] text-white">
          Voir le détail
        </Button>
      )}
      {actions}
    </div>
  </article>
)

export default DevisCard

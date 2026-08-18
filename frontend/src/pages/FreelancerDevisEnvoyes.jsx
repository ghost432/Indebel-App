import { useEffect, useMemo, useState } from 'react'
import { Bot, FileText, RefreshCw, Send, Eye, Sparkles, MapPin, Calendar, Clock, Euro } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { useNavigate } from 'react-router-dom'
import Badge from '../components/Badge'
import { devisService } from '../services/devisService'

const money = (value) => `${Number(value || 0).toFixed(2)} €`
const date = (value) => value ? new Date(value).toLocaleDateString('fr-BE') : '-'

const FreelancerDevisEnvoyes = ({ onlyAi = false }) => {
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 })
  const [loading, setLoading] = useState(true)
  const [selectedDevis, setSelectedDevis] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredItems = useMemo(() => {
    if (!onlyAi) return items
    return items.filter((item) => item.is_ai_generated || item.source === 'ia' || item.created_with_ai || item.genere_par_ia || /ia|ai/i.test(item.description || ''))
  }, [items, onlyAi])

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const navigate = useNavigate()

  const load = async (page = pagination.page || 1) => {
    try {
      setLoading(true)
      const res = await devisService.getMesDevis({ page, limit: 500 })
      setItems(res.data?.data || [])
      setPagination(res.data?.pagination || { page, pages: 1, total: 0, limit: 20 })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible de charger vos devis')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = onlyAi ? 'Devis IA envoyés - Indebel' : 'Devis envoyés - Indebel'
    load(1)
    setCurrentPage(1)
  }, [onlyAi])

  return (
    <div className="space-y-7">
            <section className="mb-8 rounded-[28px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-500">HISTORIQUE PRESTATAIRE</p>
        <div className="flex items-center gap-3 mt-3">
          {onlyAi ? <Bot className="h-8 w-8 text-[#082151]" /> : <Send className="h-8 w-8 text-[#082151]" />}
          <h1 className="text-3xl md:text-4xl font-black text-[#082151]">{onlyAi ? "Devis envoyés par IA" : "Devis envoyés manuellement"}</h1>
        </div>
        <p className="mt-2 text-slate-500 max-w-3xl text-lg">
          Suivez les propositions transmises aux clients et leur statut de réponse.
        </p>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">{filteredItems.length} devis affiché(s)</p>
        <div className="flex gap-2">
          {onlyAi ? (
            <Button onClick={() => navigate('/freelancer/devis-disponibles')} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 shadow-sm hover:shadow-md transition-all px-5">
              <Sparkles className="h-4 w-4 mr-2" /> Nouveau devis IA
            </Button>
          ) : (
            <Button onClick={() => navigate('/freelancer/devis-disponibles')} className="bg-[#c02525] hover:bg-[#a01e1e] text-white border-0 shadow-sm transition-all px-5">
              <FileText className="h-4 w-4 mr-2" /> Nouveau devis
            </Button>
          )}
          <Button variant="outline" onClick={() => load()} className="px-5"><RefreshCw className="h-4 w-4 mr-2" /> Actualiser</Button>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="h-36 animate-pulse rounded-3xl bg-slate-100" />
        ) : paginatedItems.length ? paginatedItems.map((devis) => (
          <article key={devis.id} className="group rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-200 overflow-hidden break-words">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-0 w-full">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-black text-[#082151] group-hover:text-blue-600 transition-colors">{devis.type_travaux || 'Demande de devis'}</h2>
                  <Badge variant={devis.statut === 'accepte' ? 'success' : devis.statut === 'refuse' ? 'danger' : 'warning'}>{devis.statut || 'envoyé'}</Badge>
                  {(devis.is_ai_generated || devis.source === 'ia' || devis.created_with_ai) && (
                    <Badge className="bg-purple-100 text-purple-700">IA</Badge>
                  )}
                </div>
                
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium"><FileText className="h-4 w-4 text-slate-400" /> Client: {[devis.client_prenom, devis.client_nom].filter(Boolean).join(' ') || 'Particulier'}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-slate-400" /> {devis.ville || '-'}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-slate-400" /> {date(devis.date_soumission)}</span>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 text-center min-w-[120px] shadow-sm">
                  <p className="text-2xl font-black text-[#df6422]">{money(devis.montant_ttc || devis.montant)}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Montant TTC</p>
                </div>
              </div>
            </div>
            
            <p className="mt-6 line-clamp-3 text-sm leading-relaxed text-slate-600 bg-slate-50/50 p-8 rounded-3xl border border-slate-100 break-words overflow-hidden">{devis.description || 'Aucune description détaillée.'}</p>
            
            <div className="mt-5 flex justify-end">
              <Button onClick={() => setSelectedDevis(devis)} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300">
                <Eye className="h-4 w-4 mr-2" />
                Voir le détail
              </Button>
            </div>
          </article>
        )) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
            <FileText className="mx-auto mb-2 h-9 w-9" />
            Aucun devis dans cette catégorie.
          </div>
        )}
      </div>

      {totalPages > 0 && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Précédent
          </button>
          <span className="text-slate-600 px-4 py-2 bg-slate-100 font-medium rounded-xl">
            Page {currentPage} sur {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Suivant
          </button>
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!selectedDevis} onClose={() => setSelectedDevis(null)} title="Détail du devis envoyé" size="lg">
        {selectedDevis && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-2xl font-black text-[#082151]">{selectedDevis.type_travaux || 'Demande de devis'}</h3>
                <p className="text-slate-500 mt-1">
                  Envoyé le {new Date(selectedDevis.date_soumission || selectedDevis.created_at).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <Badge variant={selectedDevis.statut === 'accepte' ? 'success' : selectedDevis.statut === 'refuse' ? 'danger' : 'warning'} className="text-sm px-4 py-1.5">
                Statut: {selectedDevis.statut || 'envoyé'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-xs font-bold uppercase text-slate-400 mb-1">Informations Client</p>
                <p className="font-semibold text-slate-800">{[selectedDevis.client_prenom, selectedDevis.client_nom].filter(Boolean).join(' ') || 'Client Particulier'}</p>
                <p className="text-sm text-slate-600 mt-1 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {selectedDevis.ville || selectedDevis.code_postal || 'Non spécifié'}</p>
              </div>
              
              <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-center items-center shadow-sm">
                <p className="text-xs font-bold uppercase text-slate-400 mb-1">Montant de la proposition</p>
                <p className="text-3xl font-black text-[#df6422]">{money(selectedDevis.montant_ttc || selectedDevis.montant)}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-bold uppercase text-slate-400 mb-3">Description du devis proposé</p>
              <div className="bg-white border border-slate-200 p-10 rounded-[28px] text-slate-700 leading-relaxed whitespace-pre-wrap break-words overflow-hidden shadow-sm max-w-full">
                {selectedDevis.description || 'Aucun détail fourni.'}
              </div>
            </div>
            
            {(selectedDevis.is_ai_generated || selectedDevis.source === 'ia' || selectedDevis.created_with_ai) && (
              <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl flex items-start gap-3">
                <Bot className="h-6 w-6 text-purple-600 flex-shrink-0" />
                <p className="text-sm text-purple-800">Ce devis a été rédigé avec l'assistance de notre IA Indebel, garantissant une présentation professionnelle et optimisée.</p>
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <Button onClick={() => setSelectedDevis(null)} variant="primary" className="bg-[#c02525] hover:bg-[#a01e1e] text-white px-8">Fermer</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default FreelancerDevisEnvoyes

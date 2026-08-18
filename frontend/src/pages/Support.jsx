import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, LifeBuoy, MessageSquare, Plus, Send, Ticket, X } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '../components/Button'
import Badge from '../components/Badge'
import { useAuth } from '../context/AuthContext'
import { supportService } from '../services/supportService'

const initialForm = {
  sujet: '',
  categorie: 'technique',
  priorite: 'normale',
  message: ''
}

const statusVariant = {
  ouvert: 'warning',
  en_cours: 'info',
  resolu: 'success',
  ferme: 'default'
}

const priorityLabel = {
  basse: 'Basse',
  normale: 'Normale',
  haute: 'Haute',
  urgente: 'Urgente'
}

const statusLabel = {
  ouvert: 'Ouvert',
  en_cours: 'En cours',
  resolu: 'Résolu',
  ferme: 'Fermé'
}

const Support = ({ createMode = false }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(createMode)
  const [form, setForm] = useState(initialForm)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [ticketLoading, setTicketLoading] = useState(false)
  const [reply, setReply] = useState('')
  const [replySaving, setReplySaving] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const rolePath = user?.role === 'admin' ? 'admin' : user?.role === 'employer' ? 'employer' : 'freelancer'
  const ticketsPerPage = 10

  useEffect(() => {
    document.title = 'Support - Indebel'
    fetchTickets()
  }, [])

  useEffect(() => {
    setModalOpen(createMode)
  }, [createMode])

  const stats = useMemo(() => {
    const open = tickets.filter((ticket) => ['ouvert', 'en_cours'].includes(ticket.statut)).length
    const completed = tickets.filter((ticket) => ['resolu', 'ferme'].includes(ticket.statut)).length
    return { total: tickets.length, open, completed }
  }, [tickets])

  const pageCount = Math.max(1, Math.ceil(tickets.length / ticketsPerPage))
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * ticketsPerPage
    return tickets.slice(start, start + ticketsPerPage)
  }, [tickets, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [tickets.length])

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount)
  }, [currentPage, pageCount])

  useEffect(() => {
    const ticketId = searchParams.get('ticket')
    if (ticketId) {
      openTicket(ticketId, false)
    }
  }, [searchParams])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = user?.role === 'admin'
        ? await supportService.getAdminTickets()
        : await supportService.getMyTickets()
      setTickets(response.data?.data || [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible de charger les tickets support')
    } finally {
      setLoading(false)
    }
  }

  const closeModal = () => {
    setModalOpen(false)
    if (createMode) {
      navigate(`/${rolePath}/support`)
    }
  }

  const openTicket = async (ticketId, updateUrl = true) => {
    try {
      setTicketLoading(true)
      if (updateUrl) setSearchParams({ ticket: String(ticketId) })
      const response = await supportService.getTicket(ticketId)
      setSelectedTicket(response.data?.data || null)
      setReply('')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible de charger le ticket')
      setSelectedTicket(null)
    } finally {
      setTicketLoading(false)
    }
  }

  const closeTicket = () => {
    setSelectedTicket(null)
    setReply('')
    setSearchParams({})
  }

  const sendReply = async (event) => {
    event.preventDefault()
    if (!selectedTicket?.ticket?.id || !reply.trim()) {
      toast.error('Le message est requis')
      return
    }

    try {
      setReplySaving(true)
      await supportService.addResponse(selectedTicket.ticket.id, { message: reply })
      toast.success('Réponse envoyée')
      await openTicket(selectedTicket.ticket.id, false)
      fetchTickets()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible d’envoyer la réponse')
    } finally {
      setReplySaving(false)
    }
  }

  const updateStatus = async (statut) => {
    if (!selectedTicket?.ticket?.id) return
    try {
      await supportService.updateAdminStatus(selectedTicket.ticket.id, statut)
      toast.success('Statut mis à jour')
      await openTicket(selectedTicket.ticket.id, false)
      fetchTickets()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible de changer le statut')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.sujet.trim() || !form.message.trim()) {
      toast.error('Le sujet et le message sont requis')
      return
    }

    try {
      setSaving(true)
      await supportService.createTicket(form)
      toast.success('Ticket de support créé')
      setForm(initialForm)
      closeModal()
      fetchTickets()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible de créer le ticket')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[24px] border border-[#2A4DEF]/10 bg-gradient-to-br from-[#082151] via-[#12326d] to-[#2A4DEF] p-5 text-white shadow-xl shadow-[#082151]/15 md:p-6">
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/80">
              <LifeBuoy className="h-4 w-4" />
              Centre support
            </div>
            <h1 className="mt-4 text-2xl font-black md:text-3xl">Support Indebel</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
              Créez un ticket, suivez vos demandes et contactez l'équipe Indebel depuis un seul espace.
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)} className="rounded-full bg-[#c02525] px-5 hover:bg-[#a91f1f]">
            <Plus className="h-4 w-4" />
            Nouveau ticket de support
          </Button>
        </div>
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={Ticket} label="Tickets" value={stats.total} />
        <MetricCard icon={AlertCircle} label="En cours" value={stats.open} tone="red" />
        <MetricCard icon={CheckCircle2} label="Terminés" value={stats.completed} tone="green" />
      </div>

      <section className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#c02525]">Historique</p>
            <h2 className="mt-1 text-xl font-black text-[#082151]">Tickets de support</h2>
          </div>
          <Button onClick={() => setModalOpen(true)} variant="outline" className="rounded-full">
            <Plus className="h-4 w-4" />
            Créer
          </Button>
        </div>

        {loading ? (
          <div className="h-32 animate-pulse rounded-3xl bg-slate-100" />
        ) : tickets.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-lg font-black text-[#082151]">Aucun ticket pour le moment</p>
            <p className="mt-2 text-sm text-slate-500">Créez un ticket si vous avez besoin d'aide.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {paginatedTickets.map((ticket) => (
              <article
                key={ticket.id}
                onClick={() => openTicket(ticket.id)}
                className="cursor-pointer rounded-2xl border border-slate-100 bg-slate-50/60 p-3 transition hover:border-[#2A4DEF]/20 hover:bg-white hover:shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-[#082151]">#{ticket.id} · {ticket.sujet}</h3>
                      <Badge variant={statusVariant[ticket.statut] || 'secondary'}>{statusLabel[ticket.statut] || 'Ouvert'}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm leading-5 text-slate-600">{ticket.message}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{priorityLabel[ticket.priorite] || ticket.priorite}</p>
                    <p className="mt-1 text-sm font-bold text-slate-500">
                      {ticket.date_creation ? new Date(ticket.date_creation).toLocaleDateString('fr-FR') : '-'}
                    </p>
                  </div>
                </div>
              </article>
            ))}
            {pageCount > 1 && (
              <div className="mt-2 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row">
                <p className="text-sm font-bold text-slate-500">
                  Page {currentPage} sur {pageCount} · {tickets.length} ticket{tickets.length > 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-[#082151] transition-colors hover:border-[#2A4DEF] hover:text-[#2A4DEF] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Précédent
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
                    disabled={currentPage === pageCount}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-[#082151] transition-colors hover:border-[#2A4DEF] hover:text-[#2A4DEF] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#082151]/70 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-[#082151]/30">
            <div className="relative bg-gradient-to-br from-[#082151] to-[#2A4DEF] p-6 text-white">
              <button
                onClick={closeModal}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                <LifeBuoy className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-2xl font-black">Nouveau ticket de support</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">
                Décrivez votre problème clairement pour permettre à l'équipe de répondre plus vite.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div>
                <label className="mb-2 block text-sm font-black text-[#082151]">Sujet</label>
                <input
                  value={form.sujet}
                  onChange={(event) => setForm((current) => ({ ...current, sujet: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#2A4DEF] focus:bg-white focus:ring-4 focus:ring-[#2A4DEF]/10"
                  placeholder="Ex: Problème avec mon devis"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-black text-[#082151]">Catégorie</label>
                  <select
                    value={form.categorie}
                    onChange={(event) => setForm((current) => ({ ...current, categorie: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#2A4DEF] focus:bg-white focus:ring-4 focus:ring-[#2A4DEF]/10"
                  >
                    <option value="technique">Technique</option>
                    <option value="facturation">Facturation</option>
                    <option value="compte">Compte</option>
                    <option value="mission">Mission</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-black text-[#082151]">Priorité</label>
                  <select
                    value={form.priorite}
                    onChange={(event) => setForm((current) => ({ ...current, priorite: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#2A4DEF] focus:bg-white focus:ring-4 focus:ring-[#2A4DEF]/10"
                  >
                    <option value="basse">Basse</option>
                    <option value="normale">Normale</option>
                    <option value="haute">Haute</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#082151]">Message</label>
                <textarea
                  value={form.message}
                  onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#2A4DEF] focus:bg-white focus:ring-4 focus:ring-[#2A4DEF]/10"
                  placeholder="Expliquez ce qui bloque, avec les détails utiles..."
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={closeModal} className="rounded-full">
                  Annuler
                </Button>
                <Button type="submit" disabled={saving} className="rounded-full bg-[#c02525] px-6 hover:bg-[#a91f1f]">
                  {saving ? (
                    'Envoi...'
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Envoyer le ticket
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {(ticketLoading || selectedTicket) && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-[#082151]/70 px-4 py-6 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-[#082151]/30">
            <div className="relative bg-gradient-to-br from-[#082151] to-[#2A4DEF] p-6 text-white">
              <button
                onClick={closeTicket}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/70">Conversation support</p>
              <h2 className="mt-3 pr-10 text-2xl font-black">
                {ticketLoading ? 'Chargement...' : `#${selectedTicket?.ticket?.id} · ${selectedTicket?.ticket?.sujet}`}
              </h2>
              {!ticketLoading && selectedTicket?.ticket && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant={statusVariant[selectedTicket.ticket.statut] || 'secondary'}>
                    {statusLabel[selectedTicket.ticket.statut] || 'Ouvert'}
                  </Badge>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">
                    {priorityLabel[selectedTicket.ticket.priorite] || selectedTicket.ticket.priorite}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">
                    {selectedTicket.ticket.categorie || 'autre'}
                  </span>
                </div>
              )}
            </div>

            {ticketLoading ? (
              <div className="space-y-3 p-6">
                <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
                <div className="h-20 animate-pulse rounded-3xl bg-slate-100" />
              </div>
            ) : selectedTicket?.ticket ? (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-5">
                  <MessageBubble
                    author={`${selectedTicket.ticket.prenom || ''} ${selectedTicket.ticket.nom || ''}`.trim() || selectedTicket.ticket.denomination || 'Utilisateur'}
                    date={selectedTicket.ticket.date_creation}
                    message={selectedTicket.ticket.message}
                    mine={String(user?.id) === String(selectedTicket.ticket.user_id)}
                  />
                  {(selectedTicket.responses || []).map((response) => {
                    const responseAuthor = `${response.prenom || ''} ${response.nom || ''}`.trim() || response.email;
                    const finalAuthor = responseAuthor === 'Admin Indebel' ? 'Support Indebel' : responseAuthor;
                    return (
                      <MessageBubble
                        key={response.id}
                        author={finalAuthor}
                        date={response.date_creation}
                        message={response.message}
                        mine={String(response.user_id) === String(user?.id)}
                      />
                    );
                  })}
                </div>

                <form onSubmit={sendReply} className="border-t border-slate-100 bg-white p-4">
                  <label className="mb-2 block text-sm font-black text-[#082151]">Répondre</label>
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    rows={2}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold leading-5 outline-none transition focus:border-[#2A4DEF] focus:bg-white focus:ring-4 focus:ring-[#2A4DEF]/10"
                    placeholder="Écrivez votre réponse..."
                  />
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {user?.role === 'admin' ? (
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-400 whitespace-nowrap">Statut :</label>
                        <select
                          value={selectedTicket.ticket.statut || 'ouvert'}
                          onChange={(event) => updateStatus(event.target.value)}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold outline-none transition focus:border-[#2A4DEF] focus:bg-white focus:ring-4 focus:ring-[#2A4DEF]/10"
                        >
                          <option value="ouvert">Ouvert</option>
                          <option value="en_cours">En cours</option>
                          <option value="resolu">Résolu</option>
                          <option value="ferme">Fermé</option>
                        </select>
                      </div>
                    ) : (
                      <div />
                    )}
                    
                    <Button type="submit" disabled={replySaving} className="rounded-full bg-[#c02525] px-6 hover:bg-[#a91f1f] shrink-0">
                      {replySaving ? 'Envoi...' : (
                        <>
                          <Send className="h-4 w-4" />
                          Envoyer
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

const MetricCard = ({ icon: Icon, label, value, tone = 'blue' }) => {
  const toneClass = tone === 'red'
    ? 'bg-[#c02525]/10 text-[#c02525]'
    : tone === 'green'
      ? 'bg-emerald-50 text-emerald-600'
      : 'bg-[#2A4DEF]/10 text-[#2A4DEF]'

  return (
    <article className="rounded-[20px] border border-slate-100 bg-white p-4 shadow-sm">
      <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-black text-[#082151]">{value}</p>
    </article>
  )
}

const MessageBubble = ({ author, date, message, mine }) => (
  <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[88%] rounded-3xl px-4 py-3 shadow-sm ${mine ? 'bg-[#082151] text-white' : 'bg-white text-slate-700'}`}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className={`text-sm font-black ${mine ? 'text-white' : 'text-[#082151]'}`}>{author}</span>
        <span className={`text-xs font-semibold ${mine ? 'text-white/60' : 'text-slate-400'}`}>
          {date ? new Date(date).toLocaleString('fr-FR') : ''}
        </span>
      </div>
      <p className={`whitespace-pre-wrap text-sm leading-6 ${mine ? 'text-white/85' : 'text-slate-600'}`}>{message}</p>
    </div>
  </div>
)

export default Support

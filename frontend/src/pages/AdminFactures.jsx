import { useEffect, useMemo, useState } from 'react'
import { Download, FileText, RefreshCw, Receipt, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Input from '../components/Input'
import { factureService } from '../services/factureService'

const money = (value) => `${Number(value || 0).toFixed(2)} €`
const date = (value) => value ? new Date(value).toLocaleDateString('fr-BE') : '-'

const FalcoBadge = ({ status }) => {
  const value = status || 'pending'
  const variant = value === 'sent' || value === 'success' ? 'success' : value === 'error' ? 'danger' : value === 'skipped_free' ? 'info' : 'warning'
  return <Badge variant={variant}>{value}</Badge>
}

const AdminFactures = () => {
  const [factures, setFactures] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [cnModalOpen, setCnModalOpen] = useState(false)
  const [selectedCnFacture, setSelectedCnFacture] = useState(null)
  const [cnNote, setCnNote] = useState('')
  const [cnSubject, setCnSubject] = useState('')
  const [cnContent, setCnContent] = useState('')
  const [emailMode, setEmailMode] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  const totalPages = Math.ceil(factures.length / itemsPerPage)
  const currentFactures = factures.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)


  const handleDownload = async (id, numero) => {
    try {
      const toastId = toast.loading("Préparation du document...")
      const response = await factureService.downloadFacture(id)
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `${numero}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast.success("Téléchargement terminé", { id: toastId })
    } catch (error) {
      toast.error("Erreur lors du téléchargement")
    }
  }

  const openCreditNoteModal = (facture) => {
    setSelectedCnFacture(facture)
    setCnNote("Annulation d'abonnement / Remboursement")
    setCnSubject(`Votre note de crédit NC-${facture.numero_facture}`)
    setCnContent("Bonjour,\n\nVeuillez trouver ci-joint votre note de crédit annulant la facture correspondante.\n\nCordialement,\nL'équipe Indebel")
    setEmailMode(false)
    setCnModalOpen(true)
  }

  const handleGenerateCreditNote = async () => {
    if (!selectedCnFacture) return
    try {
      const toastId = toast.loading("Création de l'avoir en cours...")
      await factureService.creerCreditNote(selectedCnFacture.id, { note: cnNote })
      toast.success("Avoir généré avec succès !", { id: toastId })
      load()
      
      // Auto download
      const response = await factureService.downloadCreditNote(selectedCnFacture.id)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `avoir-NC-${selectedCnFacture.numero_facture}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()

      setCnModalOpen(false)
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur lors de la création de l'avoir")
    }
  }

  const handleDownloadCreditNote = async () => {
    if (!selectedCnFacture) return
    try {
      const toastId = toast.loading("Téléchargement...")
      const response = await factureService.downloadCreditNote(selectedCnFacture.id)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `avoir-NC-${selectedCnFacture.numero_facture}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success("Téléchargement terminé", { id: toastId })
    } catch (error) {
      toast.error("Erreur lors du téléchargement")
    }
  }

  const handleSendEmail = async () => {
    if (!selectedCnFacture) return
    if (!cnSubject || !cnContent) return toast.error("Veuillez remplir le sujet et le contenu")
    try {
      setSendingEmail(true)
      await factureService.envoyerCreditNoteMail(selectedCnFacture.id, { subject: cnSubject, content: cnContent })
      toast.success("Email envoyé avec succès !")
      setCnModalOpen(false)
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur lors de l'envoi")
    } finally {
      setSendingEmail(false)
    }
  }

  const totalFalcoErrors = useMemo(
    () => factures.filter((facture) => facture.falco_status === 'error' || facture.falco_error).length,
    [factures]
  )

  const load = async () => {
    try {
      setLoading(true)
      const [facturesRes, statsRes] = await Promise.all([
        factureService.getAdminFactures(),
        factureService.getAdminStats()
      ])
      setFactures(facturesRes.data?.factures || [])
      setStats(statsRes.data?.stats || null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible de charger les factures')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Factures Falco - Indebel'
    load()
  }, [])

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-[28px] bg-white border border-slate-100 p-7 text-slate-800 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Falco facturation</p>
            <h1 className="mt-3 text-3xl font-black text-slate-900">Factures forfaits</h1>
            <p className="mt-2 max-w-2xl text-slate-600">Suivi des PDF générés, de l’envoi Falco et des erreurs à traiter.</p>
          </div>
        </div>
        <div className="mt-7 grid gap-3 md:grid-cols-3">
          <Metric label="Factures générées" value={stats?.total?.count || factures.length} suffix="facture(s)" />
          <Metric label="Montant total perçu" value={money(stats?.total?.total)} />
          <Metric label="Alertes de synchronisation Falco" value={totalFalcoErrors} suffix="erreur(s)" tone="red" />
        </div>
      </section>

      <div className="flex justify-end">
        <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Actualiser</Button>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Facture</th>
                <th className="px-5 py-4">Client</th>
                <th className="px-5 py-4">Forfait</th>
                <th className="px-5 py-4">Montant</th>
                <th className="px-5 py-4">Falco</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4 text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="7" className="px-5 py-10 text-center text-slate-500">Chargement...</td></tr>
              ) : currentFactures.length ? currentFactures.map((facture) => (
                <tr key={facture.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-black text-[#082151]">{facture.numero_facture}</td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-900">{facture.user_prenom || ''} {facture.user_nom || ''}</div>
                    <div className="text-xs text-slate-500">{facture.user_email}</div>
                  </td>
                  <td className="px-5 py-4">{facture.forfait_nom || facture.forfait_nom_actuel || '-'}</td>
                  <td className="px-5 py-4 font-bold">{money(facture.montant_ttc)}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <FalcoBadge status={facture.falco_status} />
                      {facture.falco_error && <span className="max-w-xs text-xs text-red-600">{facture.falco_error}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{date(facture.date_creation)}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {facture.montant_ttc > 0 && (
                        <button onClick={() => openCreditNoteModal(facture)} className={`inline-flex h-10 w-auto px-3 items-center justify-center rounded-full border ${facture.statut === 'annulee' ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-red-200 text-red-600 hover:bg-red-50'} cursor-pointer transition-colors`} title="Note de crédit">
                          <Receipt className="h-4 w-4 mr-2" />
                          <span className="text-xs font-semibold">{facture.statut === 'annulee' ? 'Voir Avoir' : 'Note de crédit'}</span>
                        </button>
                      )}
                      <button onClick={() => handleDownload(facture.id, facture.numero_facture)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-[#082151] hover:bg-slate-100 cursor-pointer transition-colors" title="Télécharger PDF">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7" className="px-5 py-12 text-center text-slate-500"><FileText className="mx-auto mb-2 h-8 w-8" />Aucune facture</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pb-6">
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

      <Modal isOpen={cnModalOpen} onClose={() => setCnModalOpen(false)} title="Gestion Note de Crédit">
        {selectedCnFacture && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">Facture d'origine</p>
              <p className="font-bold text-[#082151]">{selectedCnFacture.numero_facture}</p>
              <p className="text-sm text-slate-600 mt-1">{selectedCnFacture.user_prenom} {selectedCnFacture.user_nom} ({selectedCnFacture.user_email})</p>
            </div>

            {selectedCnFacture.statut !== 'annulee' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Motif de l'avoir</label>
                  <Input value={cnNote} onChange={e => setCnNote(e.target.value)} placeholder="Ex: Erreur de facturation..." />
                </div>
                <Button onClick={handleGenerateCreditNote} className="w-full">
                  Générer et Télécharger
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {!emailMode ? (
                  <div className="flex gap-2">
                    <Button onClick={handleDownloadCreditNote} variant="outline" className="flex-1">
                      <Download className="w-4 h-4 mr-2" /> Télécharger
                    </Button>
                    <Button onClick={() => setEmailMode(true)} className="flex-1">
                      <Send className="w-4 h-4 mr-2" /> Envoyer par mail
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Sujet</label>
                      <Input value={cnSubject} onChange={e => setCnSubject(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Contenu</label>
                      <textarea 
                        className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[120px]"
                        value={cnContent} 
                        onChange={e => setCnContent(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => setEmailMode(false)} variant="outline" className="flex-1" disabled={sendingEmail}>Annuler</Button>
                      <Button onClick={handleSendEmail} className="flex-1" disabled={sendingEmail}>
                        {sendingEmail ? "Envoi..." : "Envoyer"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

const Metric = ({ label, value, suffix, tone = 'blue' }) => (
  <div className={`rounded-2xl p-4 ring-1 ${tone === 'red' ? 'bg-red-50 ring-red-200 text-red-900' : 'bg-slate-50 ring-slate-200 text-slate-900'}`}>
    <p className={`text-sm ${tone === 'red' ? 'text-red-600' : 'text-slate-500'}`}>{label}</p>
    <p className="mt-1 text-3xl font-black flex items-baseline gap-2">
      {value}
      {suffix && <span className={`text-sm font-medium ${tone === 'red' ? 'text-red-500' : 'text-slate-400'}`}>{suffix}</span>}
    </p>
  </div>
)

export default AdminFactures

import { useEffect, useState } from 'react'
import { Download, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '../components/Badge'
import { factureService } from '../services/factureService'

const money = (value) => `${Number(value || 0).toFixed(2)} €`
const date = (value) => value ? new Date(value).toLocaleDateString('fr-BE') : '-'

const MesFactures = () => {
  const [factures, setFactures] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const totalPages = Math.ceil(factures.length / itemsPerPage)
  const currentFactures = factures.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleDownload = async (id, numero) => {
    try {
      const toastId = toast.loading('Préparation du document...')
      const response = await factureService.downloadFacture(id)
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${numero}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast.success('Téléchargement terminé', { id: toastId })
    } catch (error) {
      toast.error('Erreur lors du téléchargement')
    }
  }


  useEffect(() => {
    document.title = 'Mes factures - Indebel'
    factureService.getMesFactures()
      .then((res) => setFactures(res.data?.factures || []))
      .catch((error) => toast.error(error.response?.data?.message || 'Impossible de charger vos factures'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-7">
      <section className="rounded-[28px] bg-white p-7 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#c02525]">Facturation</p>
        <h1 className="mt-3 text-3xl font-black text-[#082151]">Mes factures</h1>
        <p className="mt-2 text-slate-500">Retrouvez ici les factures liées à vos forfaits Indebel.</p>
      </section>

      <div className="grid gap-4">
        {loading ? (
          <div className="h-32 animate-pulse rounded-3xl bg-slate-100" />
        ) : currentFactures.length ? currentFactures.map((facture) => (
          <article key={facture.id} className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-black text-[#082151]">{facture.numero_facture}</h2>
                <Badge variant="primary">{facture.forfait_nom || facture.forfait_nom_actuel || 'Forfait'}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">Créée le {date(facture.date_creation)} · Total {money(facture.montant_ttc)}</p>
            </div>
            <button onClick={() => handleDownload(facture.id, facture.numero_facture)} className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600 shadow-sm hover:shadow-md transition-all cursor-pointer border-none outline-none">
              <Download className="h-4 w-4" />
              Télécharger PDF
            </button>
          </article>
        )) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
            <FileText className="mx-auto mb-2 h-9 w-9" />
            Aucune facture disponible.
          </div>
        )}
      </div>

      {totalPages > 1 && (
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
    </div>
  )
}

export default MesFactures

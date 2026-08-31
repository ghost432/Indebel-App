import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import PageLoader from '../components/PageLoader'
import Card from '../components/Card'
import Button from '../components/Button'
import api from '../services/api'
import toast from 'react-hot-toast'
import { 
  CreditCard, 
  Coins, 
  History, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  Bot, 
  Send, 
  Eye, 
  ShieldCheck, 
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Award,
  Users
} from 'lucide-react'

export default function FreelancerCredits() {
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [historique, setHistorique] = useState([])
  const [settings, setSettings] = useState({
    price: 1.00,
    cout_devis_manuel: 1,
    cout_devis_ia: 2,
    cout_postulations: 1,
    cout_candidatures_ia: 1,
    cout_vues_devis: 1,
    cout_vues_missions: 1,
    cout_vues_employers: 1,
    cout_documents_freelancer: 1
  })

  useEffect(() => {
    document.title = 'Mes Crédits - Prestataire - Indebel'
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [settingsRes, histoRes] = await Promise.all([
        api.get('/credits/settings/price').catch(() => api.get('/admin-credits/settings/price')).catch(() => ({ data: {} })),
        api.get('/credits/historique').catch(() => ({ data: { historique: [] } }))
      ])

      if (settingsRes.data) {
        setSettings(prev => ({ ...prev, ...settingsRes.data }))
      }
      if (histoRes.data?.historique) {
        setHistorique(histoRes.data.historique)
      }
      if (refreshUser) refreshUser()
    } catch (error) {
      console.error('Erreur lors du chargement des crédits:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBuyPack = async (packAmount) => {
    try {
      setPurchasing(true)
      const res = await api.post('/credits/buy', { pack_amount: packAmount })
      if (res.data?.url) {
        toast.loading('Redirection vers le paiement sécurisé...')
        window.location.href = res.data.url
      } else {
        toast.success(`Demande d'achat de ${packAmount} crédits initiée.`)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur lors de l'achat de crédits.")
    } finally {
      setPurchasing(false)
    }
  }

  const [customAmount, setCustomAmount] = useState(25)

  if (loading) return <PageLoader fullScreen />

  const pricePerCredit = parseFloat(settings.price || 1)

  return (
    <div className="container-custom py-8 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#082151] via-[#0d2f6f] to-[#2A4DEF] p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Économie de crédits
            </div>
            <h1 className="mt-3 text-3xl md:text-4xl font-black text-white">Gestion de mes Crédits</h1>
            <p className="mt-2 text-white/80 max-w-xl text-sm md:text-base leading-relaxed">
              Consultez votre solde, découvrez le coût des différentes fonctionnalités et rechargez vos crédits en toute simplicité.
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-3xl p-6 border border-white/20 text-center shrink-0 shadow-lg min-w-[220px] flex flex-col items-center justify-between gap-3">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-white/80">Solde Actuel</span>
              <div className="mt-1 flex items-center justify-center gap-2">
                <Coins className="h-7 w-7 text-amber-400 animate-bounce" />
                <span className="text-4xl font-black text-white">{user?.solde_credits || 0}</span>
              </div>
              <span className="text-xs font-bold text-white/90 mt-0.5 block">Crédits disponibles</span>
            </div>
            
            <a
              href="/freelancer/factures"
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-white text-[#082151] hover:bg-slate-100 font-extrabold text-xs rounded-xl shadow-md transition-all hover:scale-105"
            >
              <FileText className="h-4 w-4 text-[#2A4DEF]" />
              Mes Factures
            </a>
          </div>
        </div>
      </section>

      {/* Grille Tarifaire des Actions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-[#082151]">Tarification des actions (Prestataire)</h2>
            <p className="text-xs text-slate-500 font-semibold">Chaque action déduit automatiquement les crédits correspondants de votre solde.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border border-slate-100 hover:border-[#2A4DEF]/30 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-50 text-[#2A4DEF] flex items-center justify-center font-bold">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-sm font-black bg-blue-100 text-[#082151] px-3 py-1 rounded-full">
                {settings.cout_devis_manuel} crédit{settings.cout_devis_manuel > 1 ? 's' : ''}
              </span>
            </div>
            <h3 className="font-bold text-[#082151] text-sm">Rédiger un Devis Manuel</h3>
            <p className="text-xs text-slate-500 mt-1">Création et envoi direct d'un devis personnalisé.</p>
          </Card>

          <Card className="p-5 border border-slate-100 hover:border-[#2A4DEF]/30 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Bot className="h-5 w-5" />
              </div>
              <span className="text-sm font-black bg-purple-100 text-purple-900 px-3 py-1 rounded-full">
                {settings.cout_devis_ia} crédit{settings.cout_devis_ia > 1 ? 's' : ''}
              </span>
            </div>
            <h3 className="font-bold text-[#082151] text-sm">Générer un Devis via IA</h3>
            <p className="text-xs text-slate-500 mt-1">Rédaction intelligente automatique par l'assistant IA.</p>
          </Card>

          <Card className="p-5 border border-slate-100 hover:border-[#2A4DEF]/30 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Send className="h-5 w-5" />
              </div>
              <span className="text-sm font-black bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full">
                {settings.cout_postulations} crédit{settings.cout_postulations > 1 ? 's' : ''}
              </span>
            </div>
            <h3 className="font-bold text-[#082151] text-sm">Postuler à une Mission</h3>
            <p className="text-xs text-slate-500 mt-1">Envoi d'une candidature complète à une offre.</p>
          </Card>

          <Card className="p-5 border border-slate-100 hover:border-[#2A4DEF]/30 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Eye className="h-5 w-5" />
              </div>
              <span className="text-sm font-black bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
                {settings.cout_vues_devis} crédit{settings.cout_vues_devis > 1 ? 's' : ''}
              </span>
            </div>
            <h3 className="font-bold text-[#082151] text-sm">Consulter les coordonnées d'un Devis</h3>
            <p className="text-xs text-slate-500 mt-1">Déblocage complet des coordonnées du client.</p>
          </Card>

          <Card className="p-5 border border-slate-100 hover:border-[#2A4DEF]/30 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-sm font-black bg-indigo-100 text-indigo-900 px-3 py-1 rounded-full">
                {settings.cout_vues_employers} crédit{settings.cout_vues_employers > 1 ? 's' : ''}
              </span>
            </div>
            <h3 className="font-bold text-[#082151] text-sm">Annuaire des Recruteurs</h3>
            <p className="text-xs text-slate-500 mt-1">Consultation et accès aux fiches recruteurs.</p>
          </Card>

          <Card className="p-5 border border-slate-100 hover:border-[#2A4DEF]/30 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-sm font-black bg-rose-100 text-rose-900 px-3 py-1 rounded-full">
                {settings.cout_documents_freelancer} crédit{settings.cout_documents_freelancer > 1 ? 's' : ''}
              </span>
            </div>
            <h3 className="font-bold text-[#082151] text-sm">Export de Documents</h3>
            <p className="text-xs text-slate-500 mt-1">Téléchargement et impression des factures / contrats.</p>
          </Card>
        </div>
      </section>

      {/* Packs de Recharge */}
      <section className="space-y-4 pt-4">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-[#082151]">Recharger vos Crédits</h2>
          <p className="text-sm text-slate-500 mt-1">Sélectionnez le pack qui correspond le mieux à votre activité.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto pt-2">
          {/* Pack 10 */}
          <Card className="p-6 border border-slate-200 flex flex-col justify-between hover:border-[#2A4DEF] transition-all hover:shadow-lg rounded-[28px]">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">Starter</span>
                <Coins className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-xl font-black text-[#082151]">Pack 10 Crédits</h3>
              <p className="text-xs text-slate-500 mt-1">Idéal pour démarrer ou tester la plateforme.</p>

              <div className="my-6">
                <span className="text-3xl font-black text-[#082151]">{(10 * pricePerCredit).toFixed(2)}€</span>
                <span className="text-xs font-semibold text-slate-400 ml-1">HT</span>
              </div>
            </div>

            <Button
              onClick={() => handleBuyPack(10)}
              disabled={purchasing}
              variant="outline"
              className="w-full justify-center py-3 text-sm font-bold border-[#082151] text-[#082151] hover:bg-[#082151] hover:text-white"
            >
              Acheter 10 Crédits
            </Button>
          </Card>

          {/* Pack 50 (Best value) */}
          <Card className="!overflow-visible p-6 border-2 border-[#2A4DEF] bg-gradient-to-b from-blue-50/40 to-white flex flex-col justify-between shadow-xl relative rounded-[28px]">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#2A4DEF] text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md z-10">
              Recommandé
            </div>
            <div>
              <div className="flex justify-between items-center mb-4 mt-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#2A4DEF]">Pro</span>
                <Coins className="h-7 w-7 text-amber-500" />
              </div>
              <h3 className="text-xl font-black text-[#082151]">Pack 50 Crédits</h3>
              <p className="text-xs text-slate-500 mt-1">Pour les prestataires actifs avec un flux régulier.</p>

              <div className="my-6">
                <span className="text-3xl font-black text-[#2A4DEF]">{(50 * pricePerCredit).toFixed(2)}€</span>
                <span className="text-xs font-semibold text-slate-400 ml-1">HT</span>
              </div>
            </div>

            <Button
              onClick={() => handleBuyPack(50)}
              disabled={purchasing}
              className="w-full justify-center py-3 text-sm font-black bg-[#2A4DEF] hover:bg-[#1b3bc4] text-white shadow-lg shadow-[#2A4DEF]/30"
            >
              Acheter 50 Crédits
            </Button>
          </Card>

          {/* Pack 100 */}
          <Card className="p-6 border border-slate-200 flex flex-col justify-between hover:border-[#2A4DEF] transition-all hover:shadow-lg rounded-[28px]">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-purple-600">Expert</span>
                <Coins className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-black text-[#082151]">Pack 100 Crédits</h3>
              <p className="text-xs text-slate-500 mt-1">Pour une utilisation intensive sans contrainte.</p>

              <div className="my-6">
                <span className="text-3xl font-black text-[#082151]">{(100 * pricePerCredit).toFixed(2)}€</span>
                <span className="text-xs font-semibold text-slate-400 ml-1">HT</span>
              </div>
            </div>

            <Button
              onClick={() => handleBuyPack(100)}
              disabled={purchasing}
              variant="outline"
              className="w-full justify-center py-3 text-sm font-bold border-[#082151] text-[#082151] hover:bg-[#082151] hover:text-white"
            >
              Acheter 100 Crédits
            </Button>
          </Card>

          {/* Pack Personnalisé */}
          <Card className="p-6 border border-amber-300 bg-amber-50/20 flex flex-col justify-between hover:border-amber-400 transition-all hover:shadow-lg rounded-[28px]">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-amber-600">Sur Mesure</span>
                <Sparkles className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="text-xl font-black text-[#082151]">Pack Sur Mesure</h3>
              <p className="text-xs text-slate-500 mt-1">Choisissez la quantité exacte de crédits désirée.</p>

              <div className="my-4 space-y-2">
                <label className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider">Nombre de crédits</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-[#082151] focus:ring-2 focus:ring-amber-500 focus:outline-none text-center text-lg bg-white"
                />
                <div className="text-center pt-1">
                  <span className="text-2xl font-black text-amber-600">{(customAmount * pricePerCredit).toFixed(2)}€</span>
                  <span className="text-xs font-semibold text-slate-400 ml-1">HT</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => handleBuyPack(customAmount)}
              disabled={purchasing || customAmount <= 0}
              className="w-full justify-center py-3 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md"
            >
              Acheter {customAmount} Crédits
            </Button>
          </Card>
        </div>
      </section>

      {/* Historique des mouvements */}
      <section className="space-y-4 pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 rounded-xl text-[#082151]">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#082151]">Historique de vos crédits</h2>
            <p className="text-xs text-slate-500">Toutes les opérations d'achats, débits et recharges de votre compte.</p>
          </div>
        </div>

        <Card className="overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {historique.map((h, i) => {
                  const isPositive = h.type === 'achat' || h.type === 'bonus' || h.montant > 0
                  return (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-sm">
                      <td className="py-3 px-4 font-semibold text-slate-600">
                        {h.created_at ? new Date(h.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                          isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                          {h.type || (isPositive ? 'Recharge' : 'Débit')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {h.description || 'Opération sur les crédits'}
                      </td>
                      <td className="py-3 px-4 text-right font-black">
                        <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                          {isPositive ? '+' : '-'}{Math.abs(h.montant)} crédit{Math.abs(h.montant) > 1 ? 's' : ''}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {historique.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400 font-semibold text-sm">
                      Aucune transaction de crédit enregistrée pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  )
}

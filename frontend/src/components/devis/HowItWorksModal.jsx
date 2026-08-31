import { 
  ClipboardList, 
  ShieldCheck, 
  Send, 
  Users, 
  Sparkles, 
  X, 
  ArrowRight, 
  CheckCircle2, 
  Lock 
} from 'lucide-react'

export default function HowItWorksModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative my-8 w-full max-w-2xl overflow-hidden rounded-[32px] bg-white shadow-2xl ring-1 ring-slate-900/10">
        
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#082151] via-[#0d2f6f] to-[#2A4DEF] p-6 sm:p-8 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Service 100% Gratuit & Sans engagement
          </div>

          <h2 className="mt-4 text-2xl sm:text-3xl font-black text-white leading-tight">
            Comment ça marche sur Indebel ?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-white/80 leading-relaxed">
            Obtenez les meilleures propositions sur mesure des prestataires qualifiés de votre région en 4 étapes simples.
          </p>
        </div>

        {/* Steps Content */}
        <div className="p-6 sm:p-8 space-y-4 max-h-[60vh] overflow-y-auto">
          
          {/* Step 1 */}
          <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 transition hover:border-[#2A4DEF]/30 hover:bg-blue-50/30">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#082151] text-white font-black text-lg shadow-md shadow-[#082151]/20">
              1
            </div>
            <div>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-[#2A4DEF]" />
                <h3 className="font-black text-[#082151] text-base">Décrivez votre projet</h3>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Remplissez notre formulaire guidé en 2 minutes (travaux, secteur, localisation et budget estimé).
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 transition hover:border-[#2A4DEF]/30 hover:bg-blue-50/30">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2A4DEF] text-white font-black text-lg shadow-md shadow-[#2A4DEF]/20">
              2
            </div>
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#2A4DEF]" />
                <h3 className="font-black text-[#082151] text-base">Modération & Transmission ciblée</h3>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                L'équipe Indebel vérifie la clarté de votre demande puis la transmet aux prestataires indépendants vérifiés de votre secteur et de votre commune.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 transition hover:border-[#2A4DEF]/30 hover:bg-blue-50/30">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black text-lg shadow-md shadow-emerald-600/20">
              3
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-emerald-600" />
                <h3 className="font-black text-[#082151] text-base">Recevez des devis sur mesure</h3>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Des prestataires qualifiés et disponibles étudient votre demande et vous envoient leurs meilleures offres directement.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 transition hover:border-[#2A4DEF]/30 hover:bg-blue-50/30">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#c02525] text-white font-black text-lg shadow-md shadow-[#c02525]/20">
              4
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#c02525]" />
                <h3 className="font-black text-[#082151] text-base">Comparez et Choisissez librement</h3>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Comparez les devis, compétences et avis d'anciens clients, puis collaborez en toute confiance avec le meilleur pro.
              </p>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center gap-2 rounded-xl bg-blue-50/70 px-3 py-2 text-xs font-bold text-blue-900 border border-blue-100">
              <CheckCircle2 className="h-4 w-4 text-[#2A4DEF] shrink-0" />
              <span>100% Gratuit</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50/70 px-3 py-2 text-xs font-bold text-emerald-900 border border-emerald-100">
              <Lock className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Sans engagement</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-purple-50/70 px-3 py-2 text-xs font-bold text-purple-900 border border-purple-100">
              <ShieldCheck className="h-4 w-4 text-purple-600 shrink-0" />
              <span>Pros vérifiés</span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <span className="text-xs text-slate-500 font-semibold text-center sm:text-left">
            Vos données personnelles sont protégées et ne sont jamais revendues.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[#082151] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#082151]/20 transition hover:bg-[#2A4DEF]"
          >
            <span>C'est parti, faire ma demande</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  )
}

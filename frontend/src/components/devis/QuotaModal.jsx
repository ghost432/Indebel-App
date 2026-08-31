import { AlertTriangle, Coins } from 'lucide-react'
import Button from '../Button'

const QuotaModal = ({ open, type = 'view', message, onClose }) => {
  if (!open) return null

  const isAi = type === 'ai'
  const isEmployer = window.location.pathname.startsWith('/employer')
  const creditsUrl = isEmployer ? '/employer/credits' : '/freelancer/credits'

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="relative bg-gradient-to-br from-[#082151] via-[#0d2f6f] to-[#c02525] px-7 py-6 text-white">

          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
            Crédits insuffisants
          </p>
          <h2 className="mt-2 text-2xl font-black">
            {isAi ? 'Rédaction IA bloquée' : 'Accès limité'}
          </h2>
        </div>
        <div className="space-y-5 px-7 py-6">
          <p className="text-base leading-7 text-slate-700">
            {message || (isAi
              ? 'Votre solde de crédits est insuffisant pour la rédaction par IA. Rechargez vos crédits pour continuer.'
              : 'Votre solde de crédits est insuffisant pour cette action. Rechargez vos crédits pour continuer.')}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" onClick={() => {
              if (window.location.pathname.includes('/dashboard')) {
                if (onClose) onClose();
              } else {
                window.location.href = isEmployer ? '/employer/dashboard' : '/freelancer/dashboard';
              }
            }} className="w-full">
              Retour au dashboard
            </Button>
            <Button onClick={() => { 
              window.location.href = creditsUrl;
            }} className="w-full bg-[#c02525] hover:bg-[#a91f1f] flex items-center justify-center gap-2">
              <Coins className="h-4 w-4" />
              Recharger mes crédits
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuotaModal

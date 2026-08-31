import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../Button'

const DevisUnlockModal = ({
  isOpen,
  onClose,
  demande, // item: devis ou mission
  itemType = 'devis', // 'devis' | 'mission'
  creditCost = 1,
  creditBalance = 0,
  onConfirmUnlock,
  unlocking = false,
  user
}) => {
  const navigate = useNavigate()
  const isInsufficient = creditBalance < creditCost
  const [showInsufficient, setShowInsufficient] = useState(isInsufficient)

  useEffect(() => {
    setShowInsufficient(creditBalance < creditCost)
  }, [creditBalance, creditCost, isOpen])

  if (!isOpen || !demande) return null

  const isMission = itemType === 'mission'
  const creditsUrl = user?.role === 'employer' ? '/employer/credits' : '/freelancer/credits'
  const itemTitle = demande.titre || demande.type_travaux || (isMission ? 'Mission' : 'Projet client')

  const handleUnlockClick = async () => {
    if (isInsufficient) {
      setShowInsufficient(true)
      return
    }
    await onConfirmUnlock(demande)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
        
        {showInsufficient ? (
          /* Insufficient Balance View */
          <div>
            <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100 flex items-center gap-3">
              <div className="p-2.5 bg-red-100 text-red-700 rounded-xl font-bold text-xl">
                ⚠️
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Solde de crédits insuffisant</h3>
                <p className="text-xs text-red-600 font-medium">Rechargement requis</p>
              </div>
            </div>

            <div className="p-6 text-slate-700 space-y-4">
              <p className="text-sm leading-relaxed">
                Votre solde actuel est de <span className="font-bold text-slate-900">{creditBalance} crédit{creditBalance > 1 ? 's' : ''}</span>. Vous avez besoin de <span className="font-bold text-red-600">{creditCost} crédit{creditCost > 1 ? 's' : ''}</span> (tarif défini par l'administration) pour consulter le détail {isMission ? "de la mission" : "du devis"} <span className="font-bold text-slate-900">#{demande.id}</span>.
              </p>
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                Veuillez recharger vos crédits pour pouvoir accéder à cette opportunité et soumettre une proposition.
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
              <Button
                type="button"
                className="w-full justify-center bg-[#c02525] hover:bg-[#a91f1f] text-white font-bold py-3"
                onClick={() => navigate(creditsUrl)}
              >
                Recharger mes crédits
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center text-slate-600 border-slate-200 hover:bg-slate-100 font-bold"
                onClick={() => {
                  setShowInsufficient(false)
                  onClose()
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          /* Confirmation View */
          <div>
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-indigo-100 flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl font-bold text-xl">
                💳
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {isMission ? "Consultation de la mission" : "Consultation du devis"}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Confirmation de déblocage</p>
              </div>
            </div>

            <div className="p-6 text-slate-700 space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#082151] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  {isMission ? "Mission" : "Devis"} #{demande.id}
                </span>
                <h4 className="mt-1.5 text-base font-bold text-slate-900 line-clamp-2">
                  {itemTitle}
                </h4>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed">
                Pour consulter le détail complet et {isMission ? "postuler à cette mission" : "contacter le client pour ce devis"}, cette action vous coûtera :
                <div className="mt-2 flex items-center justify-between font-bold">
                  <span className="text-slate-600">Coût de consultation :</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                    {creditCost} crédit{creditCost > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="bg-indigo-50/70 rounded-xl p-3 border border-indigo-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Votre solde actuel :</span>
                <span className="font-bold text-indigo-950 text-sm">{creditBalance} crédit{creditBalance > 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-1/2 justify-center text-slate-600 border-slate-200 hover:bg-slate-100 font-bold"
                onClick={onClose}
              >
                Annuler
              </Button>
              <Button
                type="button"
                className="w-1/2 justify-center bg-[#082151] hover:bg-[#0d2f6f] text-white font-bold"
                onClick={handleUnlockClick}
                loading={unlocking}
              >
                Oui, Débloquer
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default DevisUnlockModal

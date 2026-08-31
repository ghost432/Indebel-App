import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from './Button'
import api from '../services/api'
import toast from 'react-hot-toast'

const CreditUnlockGuard = ({
  action,
  storageKey,
  title = 'cette page',
  children
}) => {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()

  const [creditCost, setCreditCost] = useState(1)
  const [creditBalance, setCreditBalance] = useState(user?.solde_credits || 0)

  const fullStorageKey = `${storageKey}_${user?.id}`

  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (!user) return false
    if (user.role === 'admin') return true
    return localStorage.getItem(fullStorageKey) === 'true'
  })

  const [showConfirmModal, setShowConfirmModal] = useState(() => {
    if (!user) return false
    if (user.role === 'admin') return false
    return localStorage.getItem(fullStorageKey) !== 'true'
  })

  const [showInsufficientModal, setShowInsufficientModal] = useState(false)
  const [unlocking, setUnlocking] = useState(false)

  useEffect(() => {
    if (!isUnlocked && user && user.role !== 'admin') {
      fetchCreditInfo()
    }
  }, [isUnlocked, user])

  const fetchCreditInfo = async () => {
    try {
      const [settingsRes, balanceRes] = await Promise.all([
        api.get('/credits/settings/price').catch(() => api.get('/admin-credits/settings/price')).catch(() => ({ data: {} })),
        api.get('/credits/balance').catch(() => ({ data: {} }))
      ])

      const actionSettingMap = {
        'view_freelancers_list': 'cout_vues_freelancers',
        'view_employers_list': 'cout_vues_employers',
        'view_missions_list': 'cout_vues_missions',
        'view_devis_list': 'cout_vues_devis',
        'view_devis_disponibles': 'cout_vues_devis',
        'view_demandes_devis': 'cout_demandes_devis',
        'view_devis_recus': 'cout_devis_recus'
      }

      const settingKey = actionSettingMap[action]
      if (settingKey && settingsRes.data?.[settingKey] !== undefined) {
        setCreditCost(parseInt(settingsRes.data[settingKey], 10))
      }

      if (balanceRes.data?.solde !== undefined) {
        setCreditBalance(parseInt(balanceRes.data.solde, 10))
      } else if (user?.solde_credits !== undefined) {
        setCreditBalance(user.solde_credits)
      }
    } catch (err) {
      console.error('Erreur chargement crédits:', err)
    }
  }

  const handleConfirmUnlock = async () => {
    if (creditBalance < creditCost) {
      setShowConfirmModal(false)
      setShowInsufficientModal(true)
      return
    }

    try {
      setUnlocking(true)
      const res = await api.post('/credits/consume', { action, amount: creditCost })
      if (res.data?.success) {
        localStorage.setItem(fullStorageKey, 'true')
        setIsUnlocked(true)
        setShowConfirmModal(false)
        if (refreshUser) refreshUser()
        toast.success(`Accès débloqué ! ${res.data.deducted || creditCost} crédit(s) déduit(s).`)
      }
    } catch (error) {
      if (error.response?.data?.code === 'INSUFFICIENT_CREDITS' || error.response?.status === 403) {
        setShowConfirmModal(false)
        setShowInsufficientModal(true)
      } else {
        toast.error(error.response?.data?.message || 'Erreur lors du déblocage par crédits')
      }
    } finally {
      setUnlocking(false)
    }
  }

  const dashboardUrl = user?.role === 'employer' ? '/employer/dashboard' : '/freelancer/dashboard'
  const creditsUrl = user?.role === 'employer' ? '/employer/credits' : '/freelancer/credits'

  return (
    <div className="relative min-h-[60vh]">
      {/* Dynamic Content */}
      <div className={!isUnlocked ? 'filter blur-md pointer-events-none select-none' : ''}>
        {children}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && !isUnlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-indigo-100 flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl font-bold text-xl">
                💳
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Confirmation de déblocage</h3>
                <p className="text-xs text-slate-500 font-medium">Accès au contenu payant</p>
              </div>
            </div>

            <div className="p-6 text-slate-700 space-y-4">
              <p className="text-sm leading-relaxed">
                Pour consulter <span className="font-bold text-slate-900">{title}</span>, le coût défini pour cette action est de <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">{creditCost} crédit{creditCost !== 1 ? 's' : ''} {creditCost === 0 ? '(Offert)' : ''}</span>.
              </p>
              
              <div className="bg-amber-50/70 rounded-xl p-3.5 border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                  <span>Crédit à débiter :</span>
                  <span className="font-black text-amber-800 text-sm">{creditCost} crédit{creditCost !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pt-1 border-t border-amber-200/60">
                  <span>Votre solde actuel :</span>
                  <span className="font-bold text-slate-900 text-sm">{creditBalance} crédit{creditBalance !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-1/2 justify-center text-slate-600 border-slate-200 hover:bg-slate-100 font-bold"
                onClick={() => navigate(dashboardUrl)}
              >
                Non (Dashboard)
              </Button>
              <Button
                type="button"
                className="w-1/2 justify-center bg-[#2b4eef] hover:bg-[#1f3bbd] text-white font-bold"
                onClick={handleConfirmUnlock}
                loading={unlocking}
              >
                Oui, Débloquer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Insufficient Balance Modal */}
      {showInsufficientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100 flex items-center gap-3">
              <div className="p-2.5 bg-red-100 text-red-700 rounded-xl font-bold text-xl">
                ⚠️
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Solde de crédits insuffisant</h3>
                <p className="text-xs text-red-600 font-medium">Rechargement nécessaire</p>
              </div>
            </div>

            <div className="p-6 text-slate-700 space-y-4">
              <p className="text-sm leading-relaxed">
                Votre solde actuel est de <span className="font-bold text-slate-900">{creditBalance} crédit{creditBalance > 1 ? 's' : ''}</span>. Vous avez besoin de <span className="font-bold text-red-600">{creditCost} crédit{creditCost > 1 ? 's' : ''}</span> pour consulter <span className="font-bold text-slate-900">{title}</span>.
              </p>
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                Veuillez recharger vos crédits pour pouvoir continuer à profiter de toutes les fonctionnalités.
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
              <Button
                type="button"
                className="w-full justify-center bg-[#c02525] hover:bg-[#a91f1f] text-white font-bold"
                onClick={() => navigate(creditsUrl)}
              >
                Recharger mes crédits
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center text-slate-600 border-slate-200 hover:bg-slate-50 font-bold"
                onClick={() => navigate(dashboardUrl)}
              >
                Retour au tableau de bord
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreditUnlockGuard

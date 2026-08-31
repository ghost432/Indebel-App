import { useState, useEffect } from 'react'
import { Clock, Euro, ArrowRight, Coins, AlertCircle, PlusCircle, CreditCard, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { API_BASE_URL } from '../config'
import Button from '../components/Button'

const PublishMission = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [creditCost, setCreditCost] = useState(1)
  const [loadingCost, setLoadingCost] = useState(true)
  const [showInsufficientModal, setShowInsufficientModal] = useState(false)

  useEffect(() => {
    document.title = 'Publier une Mission - Indebel'
    fetchCreditCost()
  }, [])

  const fetchCreditCost = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`${API_BASE_URL}/credits/price`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data && res.data.cout_missions_employer !== undefined) {
        setCreditCost(parseInt(res.data.cout_missions_employer, 10))
      }
    } catch (err) {
      console.error('Erreur chargement coût crédit publication:', err)
    } finally {
      setLoadingCost(false)
    }
  }

  const userBalance = user?.solde_credits !== undefined ? user.solde_credits : 0
  const hasEnoughCredits = user?.role === 'admin' || userBalance >= creditCost

  const handleSelectModel = (path) => {
    if (!hasEnoughCredits) {
      setShowInsufficientModal(true)
      return
    }
    navigate(path)
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Dynamic Credit Banner */}
      <div className="mb-10 p-6 rounded-3xl bg-gradient-to-r from-[#082151] via-[#1a3a7c] to-[#082151] text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 border border-white/10 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#df6422]/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center gap-4 z-10">
          <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-[#df6422]">
            <Coins className="h-7 w-7 text-amber-400 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-white">Tarif de publication</h3>
            <p className="text-sm text-slate-200 mt-0.5">
              Publier une nouvelle mission coûte <span className="font-black text-amber-400 text-base">{creditCost} crédit(s)</span>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 z-10 w-full md:w-auto justify-end">
          <div className="px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-300 block">Votre Solde</span>
            <span className={`text-lg font-black ${userBalance >= creditCost ? 'text-emerald-400' : 'text-rose-400'}`}>
              {userBalance} crédit(s)
            </span>
          </div>
          {userBalance < creditCost && user?.role !== 'admin' && (
            <Button
              onClick={() => navigate('/employer/credits')}
              className="bg-[#df6422] hover:bg-[#c5551c] text-white font-bold rounded-xl shadow-md py-2.5 text-sm"
            >
              Recharger
            </Button>
          )}
        </div>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
          Publier une <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2b4eef] to-[#df6422]">Mission</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Quel type de rémunération souhaitez-vous proposer pour cette mission ? Choisissez le modèle qui correspond le mieux à votre projet.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Mission à Forfait Horaire */}
        <div 
          onClick={() => handleSelectModel('/employer/publish-mission/forfait-heure')}
          className="group relative bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#2b4eef]/40 transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10 h-16 w-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#2b4eef] transition-colors duration-300">
            <Clock className="h-8 w-8 text-[#2b4eef] group-hover:text-white transition-colors duration-300" />
          </div>
          <h3 className="relative z-10 text-2xl font-bold text-slate-900 mb-3">Forfait Horaire</h3>
          <p className="relative z-10 text-slate-600 mb-8 leading-relaxed">
            Idéal pour les projets dont la durée est variable. Vous payez le prestataire en fonction du temps réellement passé sur la mission.
          </p>
          <div className="relative z-10 flex items-center text-[#2b4eef] font-semibold group-hover:translate-x-2 transition-transform duration-300">
            Continuer vers ce modèle
            <ArrowRight className="ml-2 h-5 w-5" />
          </div>
        </div>

        {/* Mission à Forfait Fixe */}
        <div 
          onClick={() => handleSelectModel('/employer/publish-mission/forfait-fixe')}
          className="group relative bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#df6422]/40 transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10 h-16 w-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#df6422] transition-colors duration-300">
            <Euro className="h-8 w-8 text-[#df6422] group-hover:text-white transition-colors duration-300" />
          </div>
          <h3 className="relative z-10 text-2xl font-bold text-slate-900 mb-3">Forfait Fixe</h3>
          <p className="relative z-10 text-slate-600 mb-8 leading-relaxed">
            Parfait pour les projets aux contours bien définis. Vous convenez d'un budget global fixe pour l'ensemble des livrables.
          </p>
          <div className="relative z-10 flex items-center text-[#df6422] font-semibold group-hover:translate-x-2 transition-transform duration-300">
            Continuer vers ce modèle
            <ArrowRight className="ml-2 h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Modal solde insuffisant */}
      {showInsufficientModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-slate-100 text-center relative overflow-hidden">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 mb-4 ring-8 ring-amber-50/50">
              <AlertCircle className="h-8 w-8" />
            </div>
            
            <h3 className="text-xl font-black text-[#082151]">Solde de crédits insuffisant</h3>
            
            <p className="mt-3 text-sm font-medium text-slate-600 leading-relaxed">
              Pour publier une mission, votre compte doit disposer d'au moins <span className="font-bold text-[#082151]">{creditCost} crédit(s)</span>.
            </p>

            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Votre solde actuel :</span>
                <span className="font-black text-rose-600">{userBalance} crédit(s)</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Coût de la publication :</span>
                <span className="font-black text-[#082151]">{creditCost} crédit(s)</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/employer/dashboard')}
                className="w-full rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Retour au dashboard
              </Button>
              <Button
                onClick={() => navigate('/employer/credits')}
                className="w-full rounded-xl font-bold bg-[#df6422] hover:bg-[#c5551c] text-white shadow-md"
              >
                Recharger mes crédits
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PublishMission

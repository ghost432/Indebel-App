import { useEffect } from 'react'
import { Clock, Euro, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PublishMission = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    document.title = 'Publier une Mission - Indebel'
  }, [])

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
          Publier une <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Mission</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Quel type de rémunération souhaitez-vous proposer pour cette mission ? Choisissez le modèle qui correspond le mieux à votre projet.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Mission à Forfait Horaire */}
        <div 
          onClick={() => navigate('/employer/publish-mission/forfait-heure')}
          className="group relative bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(59,130,246,0.15)] transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-2"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10 h-16 w-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
            <Clock className="h-8 w-8 text-blue-600 group-hover:text-white transition-colors duration-300" />
          </div>
          <h3 className="relative z-10 text-2xl font-bold text-slate-900 mb-3">Forfait Horaire</h3>
          <p className="relative z-10 text-slate-600 mb-8 leading-relaxed">
            Idéal pour les projets dont la durée est variable. Vous payez le prestataire en fonction du temps réellement passé sur la mission.
          </p>
          <div className="relative z-10 flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
            Continuer vers ce modèle
            <ArrowRight className="ml-2 h-5 w-5" />
          </div>
        </div>

        {/* Mission à Forfait Fixe */}
        <div 
          onClick={() => navigate('/employer/publish-mission/forfait-fixe')}
          className="group relative bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(16,185,129,0.15)] transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-2"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10 h-16 w-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors duration-300">
            <Euro className="h-8 w-8 text-emerald-600 group-hover:text-white transition-colors duration-300" />
          </div>
          <h3 className="relative z-10 text-2xl font-bold text-slate-900 mb-3">Forfait Fixe</h3>
          <p className="relative z-10 text-slate-600 mb-8 leading-relaxed">
            Parfait pour les projets aux contours bien définis. Vous convenez d'un budget global fixe pour l'ensemble des livrables.
          </p>
          <div className="relative z-10 flex items-center text-emerald-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
            Continuer vers ce modèle
            <ArrowRight className="ml-2 h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PublishMission

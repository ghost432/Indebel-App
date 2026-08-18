import { Link } from 'react-router-dom'
import { User, Building2, ArrowLeft, CheckCircle2 } from 'lucide-react'

const AccountType = () => {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50 overflow-hidden">
      
      {/* Back Action - Top Left */}
      <div className="absolute top-6 left-6 lg:top-8 lg:left-8 z-50">
        <Link 
          to="/login" 
          className="inline-flex items-center justify-center px-4 py-2 lg:px-6 lg:py-3 rounded-full bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:text-[#2b4eef] transition-all shadow-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" strokeWidth={2.5} />
          Retour
        </Link>
      </div>

      {/* Premium Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-[#df6422]/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-[#2b4eef]/10 blur-[120px]" />
      </div>

      <div className="max-w-5xl w-full relative z-10 pt-10 lg:pt-0">
        {/* Header */}
        <div className="text-center mb-16">
          <Link to="/" className="inline-block mb-8 transition-transform hover:scale-105">
            <img 
              src="/logo.png" 
              alt="Indebel Logo" 
              className="h-16 w-auto"
            />
          </Link>
          <h1 className="text-4xl sm:text-5xl font-black text-[#2b4eef] tracking-tight mb-4">
            Rejoignez <span className="text-[#df6422]">Indebel</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
            Sélectionnez le type de profil qui correspond le mieux à vos besoins pour commencer votre aventure.
          </p>
        </div>

        {/* Account Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 mb-8">
          {/* Freelancer Card - Rouge Indebel */}
          <Link
            to="/register?type=freelancer"
            className="group relative flex flex-col bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-[2rem] p-8 sm:p-10 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-[#df6422]/20 hover:-translate-y-2 transition-all duration-500 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#df6422]/0 via-[#df6422]/0 to-[#df6422]/5 group-hover:to-[#df6422]/10 transition-colors duration-500" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="h-16 w-16 bg-gradient-to-br from-[#df6422] to-[#b84d15] rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-[#df6422]/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                <User className="h-8 w-8 text-white" strokeWidth={2.5} />
              </div>
              
              <h2 className="text-2xl font-black text-[#2b4eef] mb-3">
                Je suis Prestataire
              </h2>
              <p className="text-slate-500 leading-relaxed mb-8 flex-grow">
                Vous êtes consultant ou travailleur indépendant à la recherche de nouvelles opportunités et de missions stimulantes.
              </p>
              
              <div className="space-y-4 mb-10">
                {[
                  'Accès exclusif aux missions',
                  'Postuler en un clic',
                  'Suivi centralisé des candidatures',
                  'Notifications temps réel'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center text-slate-600 font-medium">
                    <CheckCircle2 className="h-5 w-5 text-[#df6422] mr-3 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="w-full py-4 px-6 bg-[#df6422] text-white font-bold text-center rounded-xl group-hover:bg-[#b84d15] transition-colors duration-300">
                Créer un compte Prestataire
              </div>
            </div>
          </Link>

          {/* Employer Card - Bleu Indebel */}
          <Link
            to="/register?type=employer"
            className="group relative flex flex-col bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-[2rem] p-8 sm:p-10 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-[#2b4eef]/20 hover:-translate-y-2 transition-all duration-500 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#2b4eef]/0 via-[#2b4eef]/0 to-[#2b4eef]/5 group-hover:to-[#2b4eef]/10 transition-colors duration-500" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="h-16 w-16 bg-gradient-to-br from-[#2b4eef] to-[#1e3bbf] rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-[#2b4eef]/30 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                <Building2 className="h-8 w-8 text-white" strokeWidth={2.5} />
              </div>
              
              <h2 className="text-2xl font-black text-[#2b4eef] mb-3">
                Je suis Recruteur
              </h2>
              <p className="text-slate-500 leading-relaxed mb-8 flex-grow">
                Vous représentez une entreprise et souhaitez dénicher les meilleurs talents pour propulser vos projets.
              </p>
              
              <div className="space-y-4 mb-10">
                {[
                  'Publication illimitée de missions',
                  'Gestion simplifiée des demandes',
                  'Accès au vivier de profils qualifiés',
                  'Tableau de bord analytique complet'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center text-slate-600 font-medium">
                    <CheckCircle2 className="h-5 w-5 text-[#2b4eef] mr-3 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="w-full py-4 px-6 bg-[#2b4eef] text-white font-bold text-center rounded-xl group-hover:bg-[#1e3bbf] transition-colors duration-300">
                Créer un compte Recruteur
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AccountType

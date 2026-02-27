import { Link } from 'react-router-dom'
import { User, Building2, ArrowLeft } from 'lucide-react'

const AccountType = () => {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 to-blue-50 relative">
      {/* Retour au site */}
      <a
        href="https://indebel.be"
        className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center text-xs sm:text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors bg-white/50 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-sm hover:shadow-md border border-gray-100 z-50"
      >
        <span className="mr-1.5 sm:mr-2">←</span>
        Retour au site
      </a>

      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <img
              src="/logo.png"
              alt="Indebel Logo"
              className="h-20 w-auto"
            />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            Créer votre compte Indebel
          </h1>
          <p className="text-lg text-gray-600">
            Choisissez le type de compte qui vous correspond
          </p>
        </div>

        {/* Account Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Prestataire Card */}
          <Link
            to="/register?type=freelancer"
            className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-primary-500 group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <User className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Compte Prestataire
              </h2>
              <p className="text-gray-600 mb-6">
                Vous êtes consultant ou travailleur prestataire et vous recherchez des opportunités professionnelles.
              </p>
              <ul className="text-left space-y-2 text-sm text-gray-600 mb-6">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Accès aux missions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Postuler en un clic</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Suivi de vos demandes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Notifications des nouvelles missions</span>
                </li>
              </ul>
              <div className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold group-hover:from-green-600 group-hover:to-green-700 transition-colors">
                Créer un compte Prestataire
              </div>
            </div>
          </Link>

          {/* Recruteur Card */}
          <Link
            to="/register?type=employer"
            className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-primary-500 group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Building2 className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Compte Recruteur
              </h2>
              <p className="text-gray-600 mb-6">
                Vous êtes un recruteur et vous souhaitez recruter des talents prestataires pour vos projets.
              </p>
              <ul className="text-left space-y-2 text-sm text-gray-600 mb-6">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  <span>Publier des missions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  <span>Gérer les demandes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  <span>Accès aux profils qualifiés</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  <span>Tableau de bord complet</span>
                </li>
              </ul>
              <div className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold group-hover:from-blue-600 group-hover:to-blue-700 transition-colors">
                Créer un compte Recruteur
              </div>
            </div>
          </Link>
        </div>

        {/* Back to Login */}
        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AccountType

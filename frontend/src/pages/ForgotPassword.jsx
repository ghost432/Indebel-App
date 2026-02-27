import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import Button from '../components/Button'
import toast from 'react-hot-toast'
import axios from 'axios'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
      const response = await axios.post(`${API_URL}/auth/request-password-reset`, { email })

      if (response.data.success) {
        setEmailSent(true)
        toast.success('Email envoyé avec succès')
      }
    } catch (error) {
      console.error('Erreur réinitialisation:', error)
      toast.error(error.response?.data?.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 to-blue-50">
      <div className="max-w-md w-full">
        <div className="bg-white p-8 rounded-lg shadow-xl">
          {!emailSent ? (
            <>
              {/* Logo et Titre */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <img
                    src="/logo.png"
                    alt="Indebel Logo"
                    className="h-20 w-auto"
                  />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900">
                  Mot de passe oublié ?
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Entrez votre adresse email pour recevoir un lien de réinitialisation
                </p>
              </div>

              {/* Formulaire */}
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="vous@exemple.com"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={loading}
                >
                  Envoyer le lien de réinitialisation
                </Button>

                <div className="text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour à la connexion
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* Message de succès */}
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Email envoyé !
                </h2>
                <p className="text-gray-600 mb-6">
                  Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>
                </p>
                <p className="text-sm text-gray-500 mb-8">
                  Vérifiez votre boîte de réception et suivez les instructions pour réinitialiser votre mot de passe.
                </p>
                <Link to="/login">
                  <Button variant="primary" className="w-full">
                    Retour à la connexion
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword

import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import Button from '../components/Button'
import toast from 'react-hot-toast'
import api from '../services/api'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    mot_de_passe: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Set page title
  useEffect(() => {
    document.title = 'Connexion - Indebel'
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await api.post('auth/login', {
        email: formData.email,
        mot_de_passe: formData.mot_de_passe
      })

      if (response.data.success) {
        const { data } = response.data

        // Si requiresOTP (freelancer ou employer), rediriger vers VerifyOTP
        if (data.requiresOTP) {
          toast.success('Code de vérification envoyé par email')
          navigate('/verify-otp', {
            state: {
              email: data.email,
              role: data.role,
              type: 'login',
              from: location.state?.from
            }
          })
        } else {
          // Si admin, connexion directe
          const { user, token } = data
          login(user, token)
          toast.success('Connexion réussie !')
          const redirectTo = location.state?.from || '/'
          navigate(redirectTo)
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la tentative de connexion:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 to-blue-50 relative">
      {/* Retour au site */}
      <a
        href="https://indebel.be"
        className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center text-xs sm:text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors bg-white/50 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-sm hover:shadow-md border border-gray-100 z-50"
      >
        <span className="mr-1.5 sm:mr-2">←</span>
        Retour au site
      </a>

      <div className="max-w-md w-full">
        <div className="bg-white p-8 rounded-lg shadow-xl">
          {/* Logo et Titre */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="/logo.png"
                alt="Indebel Logo"
                className="h-24 w-auto"
              />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Connexion à Indebel
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Pas encore de compte ?{' '}
              <Link to="/account-type" className="font-medium text-primary-600 hover:text-primary-500">
                Créer un compte
              </Link>
            </p>
          </div>

          {/* Formulaire */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="vous@exemple.com"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="mot_de_passe"
                    value={formData.mot_de_passe}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Se souvenir de moi
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full flex items-center justify-center space-x-2"
              loading={loading}
            >
              <LogIn className="h-5 w-5" />
              <span>Se connecter</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login

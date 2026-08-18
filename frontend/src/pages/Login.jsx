import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react'
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
          navigate('/verify-otp', {
            state: {
              email: data.email,
              role: data.role,
              type: 'login',
              testOtp: data.testOtp
            }
          })
        } else {
          // Si admin, connexion directe
          const { user, token } = data
          login(user, token)
          toast.success('Connexion réussie !')
          navigate('/')
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-[#df6422]/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-[#2b4eef]/10 blur-[120px]" />
      </div>

      <a
        href="https://indebel.be"
        className="absolute left-4 top-4 z-50 inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 backdrop-blur-md px-4 py-2.5 text-sm font-bold text-[#2b4eef] shadow-sm transition hover:bg-slate-50 hover:text-[#df6422] sm:left-6 sm:top-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la page d'accueil
      </a>
      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/90 backdrop-blur-xl p-10 rounded-[32px] shadow-[0_8px_40px_rgb(0,0,0,0.04)] shadow-[#2b4eef]/5 border border-slate-100">
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

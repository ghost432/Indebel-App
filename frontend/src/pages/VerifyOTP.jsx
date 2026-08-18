import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, ArrowLeft, Loader2, CheckCircle2, Shield } from 'lucide-react'
import Button from '../components/Button'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'
import axios from 'axios'

const VerifyOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const inputRefs = useRef([])
  const navigate = useNavigate()
  const location = useLocation()
  const { login: authLogin } = useAuth()
  
  // Récupérer les données de l'inscription/login ou de l'URL (magic link)
  const searchParams = new URLSearchParams(location.search)
  const urlEmail = searchParams.get('email')
  const urlOtp = searchParams.get('otp')

  const { email: stateEmail, role, type, testOtp } = location.state || {}
  const email = stateEmail || urlEmail

  // Set page title
  useEffect(() => {
    document.title = 'Vérification Email - Indebel'
  }, [])

  useEffect(() => {
    if (!email) {
      toast.error('Session invalide')
      navigate('/login')
    }
  }, [email, navigate])

  // Afficher le toast avec l'OTP s'il est fourni (et s'il ne vient pas d'un magic link)
  useEffect(() => {
    if (testOtp) {
      toast(
        (t) => (
          <div className="flex items-center justify-between w-full">
            <div>
              Code de connexion reçu : <strong className="text-xl ml-2 tracking-widest">{testOtp}</strong>
            </div>
            <button 
              onClick={() => toast.dismiss(t.id)}
              className="ml-4 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              ✕
            </button>
          </div>
        ),
        { 
          id: 'otp-toast',
          duration: 30000,
          position: 'top-center',
          style: {
            padding: '16px',
            border: '2px solid #3b82f6',
          }
        }
      )
    }
  }, [testOtp])

  // Auto-verify if OTP is provided in URL (magic link)
  useEffect(() => {
    if (urlOtp && urlOtp.length === 6 && email) {
      const otpArray = urlOtp.split('')
      setOtp(otpArray)
      handleVerify(urlOtp)
    }
  }, [urlOtp, email])

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Auto-focus premier input
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleChange = (index, value) => {
    // Ne garder que les chiffres
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Garder seulement le dernier chiffre
    setOtp(newOtp)

    // Auto-focus sur le prochain input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit si tous les champs sont remplis
    if (newOtp.every(digit => digit) && index === 5) {
      handleVerify(newOtp.join(''))
    }
  }

  const handleKeyDown = (index, e) => {
    // Backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    
    // Arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    
    if (!/^\d+$/.test(pastedData)) {
      toast.error('Veuillez coller uniquement des chiffres')
      return
    }

    const newOtp = [...otp]
    pastedData.split('').forEach((char, index) => {
      if (index < 6) {
        newOtp[index] = char
      }
    })
    setOtp(newOtp)

    // Focus dernier input rempli
    const lastIndex = Math.min(pastedData.length, 5)
    inputRefs.current[lastIndex]?.focus()

    // Auto-submit si 6 chiffres
    if (pastedData.length === 6) {
      handleVerify(pastedData)
    }
  }

  const handleVerify = async (otpCode = null) => {
    const code = otpCode || otp.join('')
    
    if (code.length !== 6) {
      toast.error('Veuillez saisir les 6 chiffres')
      return
    }

    setLoading(true)

    try {
      const response = await axios.post('/api/auth/otp/verify', {
        email,
        otp: code
      })

      if (response.data.success) {
        toast.success('Email vérifié avec succès !')
        
        // Sauvegarder le token
        const { token, user } = response.data
        const loginResult = await authLogin(user, token)

        // Afficher modal vérification identité pour freelancers si inscription
        if (role === 'freelancer' && type === 'registration') {
          setShowVerificationModal(true)
        } else {
          // Utiliser l'URL de redirection si elle existe
          const redirectUrl = loginResult?.redirectUrl
          
          setTimeout(() => {
            if (redirectUrl) {
              navigate(redirectUrl)
            } else if (role === 'freelancer') {
              navigate('/freelancer/dashboard')
            } else if (role === 'employer') {
              navigate('/employer/dashboard')
            } else if (role === 'admin') {
              navigate('/admin/dashboard')
            } else {
              navigate('/')
            }
          }, 500)
        }
      }
    } catch (error) {
      console.error('Erreur vérification OTP:', error)
      toast.error(error.response?.data?.message || 'Code invalide ou expiré')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)

    try {
      await axios.post('/api/auth/otp/resend', { email })
      toast.success('Nouveau code envoyé par email')
      setTimeLeft(600) // Reset timer
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (error) {
      console.error('Erreur renvoi OTP:', error)
      toast.error('Erreur lors du renvoi du code')
    } finally {
      setResending(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-md w-full">
        <div className="bg-white p-8 rounded-lg shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="h-20 w-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <Mail className="h-10 w-10 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Vérification Email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Un code à 6 chiffres a été envoyé à
            </p>
            <p className="text-sm font-medium text-blue-600">{email}</p>
          </div>

          {/* OTP Inputs */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Entrez le code de vérification
            </label>
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  disabled={loading}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              ))}
            </div>
          </div>

          {/* Timer */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600">
              {timeLeft > 0 ? (
                <>
                  ⏱️ Code valide pendant : <span className="font-medium text-blue-600">{formatTime(timeLeft)}</span>
                </>
              ) : (
                <span className="text-red-600 font-medium">⚠️ Code expiré</span>
              )}
            </p>
          </div>

          {/* Verify Button */}
          <Button
            onClick={() => handleVerify()}
            disabled={otp.some(digit => !digit) || loading}
            loading={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white mb-4"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Vérification...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Vérifier
              </>
            )}
          </Button>

          {/* Resend */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Vous n'avez pas reçu le code ?
            </p>
            <button
              onClick={handleResend}
              disabled={resending || timeLeft === 0}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {resending ? 'Envoi en cours...' : 'Renvoyer le code'}
            </button>
          </div>

          {/* Back link */}
          <div className="text-center mt-6 pt-4 border-t">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour à la connexion
            </button>
          </div>
        </div>

        {/* Info box */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800">
            💡 <strong>Astuce :</strong> Vous pouvez coller directement le code à 6 chiffres depuis votre email
          </p>
        </div>
      </div>

      {/* Modal Vérification Identité */}
      <Modal
        isOpen={showVerificationModal}
        onClose={() => {}}
        title="Vérification d'identité"
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Bienvenue sur Indebel ! 🎉
            </h3>
            <p className="text-gray-600 mb-4">
              Votre compte a été créé avec succès.
            </p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-900">
              <strong>Important :</strong> Pour accéder à toutes les fonctionnalités et postuler aux missions, 
              vous devez compléter la vérification de votre identité.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Ce processus simple vous permettra de :
            </p>
            <ul className="text-sm text-gray-600 space-y-2 ml-4">
              <li>✅ Obtenir un badge vérifié</li>
              <li>✅ Gagner la confiance des entreprises</li>
              <li>✅ Postuler aux missions</li>
              <li>✅ Augmenter vos chances d'être sélectionné</li>
            </ul>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              onClick={() => navigate('/freelancer/verification')}
              className="flex-1"
            >
              Vérifier maintenant
            </Button>
            <Button
              onClick={() => navigate('/freelancer/dashboard')}
              variant="outline"
              className="flex-1"
            >
              Plus tard
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default VerifyOTP

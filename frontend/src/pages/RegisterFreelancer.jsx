import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, Search, Loader2, Building2, Phone, AlertCircle } from 'lucide-react'
import Button from '../components/Button'
import MultiSelect from '../components/MultiSelect'
import PasswordStrength from '../components/PasswordStrength'
import toast from 'react-hot-toast'
import axios from 'axios'
import { pays } from '../data/secteurs'
import SecteurCompetenceSelector from '../components/SecteurCompetenceSelector'
import { validateEmail, validatePassword, isValidEmailFormat } from '../utils/validation'

const RegisterFreelancer = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  
  const stepNames = {
    1: 'verification-bce',
    2: 'contact-securite',
    3: 'informations-personnelles',
    4: 'activite',
    5: 'email-verification',
    6: 'preferences'
  }
  
  const stepTitles = {
    1: 'Vérification BCE (Optionnelle)',
    2: 'Contact & Sécurité',
    3: 'Informations Personnelles',
    4: 'Activité',
    5: 'Email & Vérification',
    6: 'CGU & Préférences'
  }
  const [bceNumber, setBceNumber] = useState('')
  const [bceData, setBceData] = useState(null)
  const [bceVerified, setBceVerified] = useState(false)
  const [bceAlreadyExists, setBceAlreadyExists] = useState(false)
  const [checkingBce, setCheckingBce] = useState(false)
  const [bceApiError, setBceApiError] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  
  // Mettre à jour l'URL et le titre à chaque changement d'étape
  useEffect(() => {
    const stepName = stepNames[step]
    navigate(`/register-freelancer/etape${step}?${stepName}`, { replace: true })
    document.title = `${stepTitles[step]} - Inscription Indépendant - Indebel`
  }, [step])
  
  const [formData, setFormData] = useState({
    // Étape 1
    numero_bce: '',
    denomination: '',
    adresse: '',
    // Étape 2
    prenom: '',
    nom: '',
    pays_code: 'BE',
    indicatif: '+32',
    telephone: '',
    // Étape 3
    mot_de_passe: '',
    confirmPassword: '',
    // Étape 4
    secteur: '',
    competences: [],
    // Étape 5
    email: '',
    accepte_cgu: false,
    accepte_notifications: false,
    accepte_emails: false,
    role: 'freelancer'
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailValid, setEmailValid] = useState(null)
  const [emailError, setEmailError] = useState('')
  const { register } = useAuth()

  // Set page title is now handled by step useEffect

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    })

    // Validation email en temps réel
    if (name === 'email') {
      if (value.length > 0) {
        if (!validateEmail(value)) {
          setEmailValid(false)
          setEmailError('Format d\'email invalide')
        } else if (!isValidEmailFormat(value)) {
          setEmailValid(false)
          setEmailError('Email jetable ou invalide détecté')
        } else {
          setEmailValid(true)
          setEmailError('')
        }
      } else {
        setEmailValid(null)
        setEmailError('')
      }
    }
  }

  const handlePaysChange = (e) => {
    const selectedPays = pays.find(p => p.value === e.target.value)
    setFormData({
      ...formData,
      pays_code: selectedPays.value,
      indicatif: selectedPays.indicatif
    })
  }

  const handleBceChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10)
    setBceNumber(value)
    if (value.length < 10) {
      setBceVerified(false)
      setBceAlreadyExists(false)
      setBceData(null)
    }
  }

  useEffect(() => {
    if (bceNumber.length === 10 && !bceVerified) {
      // Debounce de 500ms pour éviter trop de requêtes
      const timer = setTimeout(() => {
        checkBceNumber()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [bceNumber])

  const checkBceNumber = async () => {
    if (bceNumber.length !== 10) return
    setCheckingBce(true)

    try {
      // 1. Vérifier d'abord en base de données (rapide)
      try {
        const checkResponse = await axios.get(`/api/users/check-bce/${bceNumber}`, {
          timeout: 3000 // 3 secondes max
        })
        
        if (checkResponse.data.exists) {
          setBceVerified(true)
          setBceAlreadyExists(true)
          toast.error('Ce numéro BCE est déjà inscrit sur la plateforme')
          setTimeout(() => navigate('/login'), 3000)
          setCheckingBce(false)
          return
        }
      } catch (error) {
        // Si 404, l'entreprise n'existe pas (on continue)
        if (error.response?.status !== 404) {
          console.error('Erreur vérification base:', error)
          // On continue quand même avec l'API CBE
        }
      }

      // 2. Appel API via backend (évite CORS) avec retry automatique
      let retryCount = 0
      const MAX_RETRIES = 2
      let lastError = null
      
      while (retryCount <= MAX_RETRIES) {
        try {
          if (retryCount > 0) {
            toast.info(`Nouvelle tentative ${retryCount}/${MAX_RETRIES}...`)
          }
          
          const { data } = await axios.get(`/api/users/verify-bce/${bceNumber}`, {
            timeout: 30000 // 30 secondes max
          })

          if (data.success && data.data) {
            setBceData(data.data)
            setFormData({
              ...formData,
              numero_bce: bceNumber,
              denomination: data.data.denomination,
              adresse: data.data.adresse
            })

            setBceVerified(true)
            setBceAlreadyExists(false)
            toast.success('Numéro BCE vérifié avec succès !')
            break // Sortir de la boucle de retry en cas de succès
          } else {
            throw new Error('Données BCE manquantes')
          }
        } catch (apiError) {
          lastError = apiError
          retryCount++
          
          // Si c'est une erreur 404 (BCE introuvable), ne pas retry
          if (apiError.response?.status === 404 || apiError.response?.status === 400) {
            break
          }
          
          // Si on a encore des tentatives, attendre avant de réessayer
          if (retryCount <= MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, 2000)) // Attendre 2s
            continue
          }
          
          // Toutes les tentatives ont échoué
          setBceApiError(true)
          break
        }
      }
      
      // Gestion finale des erreurs après tous les retry
      if (lastError && !bceVerified) {
        let errorMessage = ''
        if (lastError.code === 'ECONNABORTED' || lastError.name === 'AbortError') {
          errorMessage = 'La vérification BCE prend trop de temps.'
        } else if (lastError.response?.status === 404) {
          errorMessage = 'Numéro BCE introuvable dans la base CBE.'
        } else if (lastError.response?.status === 401) {
          errorMessage = 'Erreur d\'authentification avec l\'API CBE.'
        } else if (lastError.message === 'Network Error') {
          errorMessage = 'Impossible de contacter le service de vérification BCE.'
        } else {
          errorMessage = 'Service de vérification BCE temporairement indisponible.'
        }
        
        toast.error(`${errorMessage} Vous pouvez continuer manuellement.`, { duration: 5000 })
        console.error('Erreur API CBE après retry:', lastError)
        
        // Permettre le mode manuel après erreur
        setBceData(null)
        setBceVerified(false)
        setManualMode(true)
      }
    } catch (error) {
      console.error('Erreur générale:', error)
      toast.error('Erreur inattendue. Vous pouvez continuer manuellement.', { duration: 5000 })
      setBceData(null)
      setBceVerified(false)
      setBceApiError(true)
      setManualMode(true)
    } finally {
      setCheckingBce(false)
    }
  }

  const handleNextStep = () => {
    if (step === 1) {
      // Vérifier si BCE est vérifié OU si on est en mode manuel avec un numéro valide
      if (!bceVerified && !manualMode) {
        toast.error('Veuillez vérifier le numéro BCE ou continuer manuellement')
        return
      }
      if (manualMode && bceNumber.length !== 10) {
        toast.error('Le numéro BCE doit contenir exactement 10 chiffres')
        return
      }
      // En mode manuel, définir les données BCE avec le numéro saisi
      if (manualMode && !bceVerified) {
        setFormData({
          ...formData,
          numero_bce: bceNumber,
          denomination: formData.denomination || 'Indépendant',
          adresse: formData.adresse || ''
        })
      }
    }
    
    if (step === 2 && (!formData.prenom || !formData.nom || !formData.telephone)) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    
    if (step === 3) {
      const passwordValidation = validatePassword(formData.mot_de_passe)
      if (!passwordValidation.isValid) {
        toast.error('Le mot de passe ne respecte pas tous les critères de sécurité')
        return
      }
      if (formData.mot_de_passe !== formData.confirmPassword) {
        toast.error('Les mots de passe ne correspondent pas')
        return
      }
    }
    
    if (step === 4 && (!formData.secteur || formData.competences.length === 0)) {
      toast.error('Veuillez sélectionner un secteur et au moins une compétence')
      return
    }
    
    setStep(step + 1)
  }

  const handlePrevStep = () => {
    setStep(step - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.email) {
      toast.error('Veuillez saisir votre email')
      return
    }

    if (!emailValid) {
      toast.error('Veuillez saisir un email valide')
      return
    }

    if (!formData.accepte_cgu) {
      toast.error('Vous devez accepter les conditions d\'utilisation')
      return
    }

    setLoading(true)

    try {
      const { confirmPassword, ...registerData } = formData
      // Ajouter le statut de vérification BCE
      registerData.bce_verifie = bceVerified
      registerData.bce_manuel = manualMode
      const response = await axios.post('/api/auth/register', registerData)
      
      if (response.data.success && (response.data?.data || response.data).requiresOTP) {
        toast.success('Inscription réussie ! Vérifiez votre email.')
        // Rediriger vers la page de vérification OTP
        navigate('/verify-otp', {
          state: {
            email: formData.email,
            role: formData.role,
            type: 'registration',
            testOtp: (response.data?.data || response.data).testOtp
          }
        })
      }
    } catch (error) {
      console.error('Erreur inscription:', error)
      toast.error(error.response?.data?.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  const renderStepIndicator = () => {
    const steps = ['BCE', 'Identité', 'Mot de passe', 'Activité', 'Email']
    return (
      <div className="mb-8">
        <div className="flex justify-between relative">
          {/* Ligne d'arrière-plan */}
          <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-gray-200 z-0" />
          
          {/* Ligne de progression */}
          <div 
            className="absolute top-5 left-[10%] h-1 transition-all duration-300 z-0 bg-[#df6422]" 
            style={{ width: `${((step - 1) / (steps.length - 1)) * 80}%` }} 
          />

          {steps.map((label, index) => (
            <div key={index} className="flex flex-col items-center flex-1 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-300 ${
                step > index + 1 ? 'text-white bg-[#df6422]' :
                step === index + 1 ? 'text-white shadow-lg bg-[#df6422] shadow-[#df6422]/30 ring-4 ring-[#df6422]/20' :
                'bg-white text-gray-400 border-2 border-gray-200'
              }`}>
                {step > index + 1 ? <CheckCircle2 className="h-6 w-6" /> : index + 1}
              </div>
              <span className={`text-xs mt-2 text-center font-medium ${step >= index + 1 ? 'text-[#2b4eef]' : 'text-gray-400'}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-[#df6422]/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-[#2b4eef]/10 blur-[120px]" />
      </div>

      <Link
        to="/account-type"
        className="absolute left-4 top-4 z-50 inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 backdrop-blur-md px-4 py-2.5 text-sm font-bold text-[#082151] shadow-sm transition hover:bg-slate-50 hover:text-[#df6422] sm:left-6 sm:top-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Changer de compte
      </Link>
      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/90 backdrop-blur-xl p-10 rounded-[32px] shadow-[0_8px_40px_rgb(0,0,0,0.04)] shadow-[#2b4eef]/5 border border-slate-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="h-20 w-20 bg-gradient-to-br from-[#df6422] to-[#c25319] rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Créer un compte Indépendant
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Déjà un compte ?{' '}
              <Link to="/login" className="font-medium text-[#df6422] hover:text-[#df6422]">
                Se connecter
              </Link>
            </p>
          </div>

          {renderStepIndicator()}

          {/* Étape 1 : BCE */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro BCE (10 chiffres)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={bceNumber}
                    onChange={handleBceChange}
                    maxLength={10}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#df6422]/20 focus:border-[#df6422] transition-all"
                    placeholder="0123456789"
                    disabled={bceVerified}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {checkingBce ? (
                      <Loader2 className="h-5 w-5 text-[#df6422] animate-spin" />
                    ) : bceVerified ? (
                      <CheckCircle2 className="h-5 w-5 text-[#df6422]" />
                    ) : bceNumber.length === 10 ? (
                      <Search className="h-5 w-5 text-[#df6422]" />
                    ) : (
                      <Search className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {checkingBce ? 'Vérification en cours...' : 'La vérification se fait automatiquement à 10 chiffres'}
                </p>
              </div>

              {/* Mode manuel si l'API BCE échoue */}
              {manualMode && !bceVerified && (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 font-medium flex items-center mb-2">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      Mode manuel activé
                    </p>
                    <p className="text-yellow-700 text-sm">
                      La vérification automatique n'est pas disponible. Veuillez saisir les informations manuellement.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dénomination / Nom de l'entreprise *
                    </label>
                    <input
                      type="text"
                      name="denomination"
                      value={formData.denomination}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#df6422]"
                      placeholder="Votre nom ou dénomination"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse complète *
                    </label>
                    <input
                      type="text"
                      name="adresse"
                      value={formData.adresse}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#df6422]"
                      placeholder="Rue, numéro, code postal, ville"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full bg-gradient-to-r from-[#df6422] to-[#c25319] hover:from-[#df6422] hover:to-[#c25319] text-white"
                  >
                    Suivant
                  </Button>
                </div>
              )}

              {bceVerified && bceData && (
                <div className="space-y-4">
                  {bceAlreadyExists ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 font-medium flex items-center mb-2">
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Numéro BCE vérifié
                      </p>
                      <p className="text-red-700 text-sm">
                        Mais possède déjà un compte sur la plateforme. Redirection vers login...
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-[#df6422]/10 border border-[#df6422]/20 rounded-lg">
                      <p className="text-[#c25319] font-medium flex items-center mb-2">
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Numéro BCE vérifié
                      </p>
                      <p className="text-[#c25319] text-sm">
                        N'a pas encore de compte et peut s'inscrire
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dénomination</label>
                    <input
                      type="text"
                      value={formData.denomination}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse complète</label>
                    <input
                      type="text"
                      value={formData.adresse}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                    />
                  </div>

                  {!bceAlreadyExists && (
                    <Button
                      type="button"
                      onClick={handleNextStep}
                      className="w-full bg-gradient-to-r from-[#df6422] to-[#c25319] hover:from-[#df6422] hover:to-[#c25319] text-white"
                    >
                      Suivant
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Étape 2 : Identité */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#df6422]/20 focus:border-[#df6422] transition-all"
                    placeholder="Jean"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#df6422]/20 focus:border-[#df6422] transition-all"
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <div className="flex gap-2">
                  <select
                    value={formData.pays_code}
                    onChange={handlePaysChange}
                    className="w-32 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#df6422]"
                  >
                    {pays.map(p => (
                      <option key={p.value} value={p.value}>
                        {p.flag} {p.indicatif}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#df6422]/20 focus:border-[#df6422] transition-all"
                      placeholder={pays.find(p => p.value === formData.pays_code)?.format}
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  type="button"
                  onClick={handlePrevStep}
                  variant="secondary"
                  className="flex-1"
                >
                  Précédent
                </Button>
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 bg-gradient-to-r from-[#df6422] to-[#c25319] hover:from-[#df6422] hover:to-[#c25319] text-white"
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}

          {/* Étape 3 : Mot de passe */}
          {step === 3 && (
            <div className="space-y-5">
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
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#df6422]/20 focus:border-[#df6422] transition-all"
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
                <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#df6422]/20 focus:border-[#df6422] transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <PasswordStrength 
                password={formData.mot_de_passe} 
                confirmPassword={formData.confirmPassword}
              />

              <div className="flex space-x-3">
                <Button
                  type="button"
                  onClick={handlePrevStep}
                  variant="secondary"
                  className="flex-1"
                >
                  Précédent
                </Button>
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 bg-gradient-to-r from-[#df6422] to-[#c25319] hover:from-[#df6422] hover:to-[#c25319] text-white"
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}

          {/* Étape 4 : Activité */}
          {step === 4 && (
            <div className="space-y-5">
              <SecteurCompetenceSelector
                selectedSecteur={formData.secteur}
                setSelectedSecteur={(val) => setFormData(prev => ({...prev, secteur: val}))}
                selectedCompetences={formData.competences}
                setSelectedCompetences={(val) => setFormData(prev => ({...prev, competences: val}))}
                competencesLabel="Quelles sont vos compétences ?"
              />

              <div className="flex space-x-3">
                <Button
                  type="button"
                  onClick={handlePrevStep}
                  variant="secondary"
                  className="flex-1"
                >
                  Précédent
                </Button>
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 bg-gradient-to-r from-[#df6422] to-[#c25319] hover:from-[#df6422] hover:to-[#c25319] text-white"
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}

          {/* Étape 5 : Email et CGU */}
          {step === 5 && (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email personnel</label>
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
                    className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                      emailValid === true ? 'border-[#df6422] focus:ring-[#df6422]' : 
                      emailValid === false ? 'border-red-500 focus:ring-red-500' : 
                      'border-gray-300 focus:ring-[#df6422]'
                    }`}
                    placeholder="vous@exemple.com"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {emailValid === true && (
                      <CheckCircle2 className="h-5 w-5 text-[#df6422]" />
                    )}
                    {emailValid === false && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
                {emailError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {emailError}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-start">
                  <input
                    id="accepte_cgu"
                    name="accepte_cgu"
                    type="checkbox"
                    checked={formData.accepte_cgu}
                    onChange={handleChange}
                    required
                    className="h-4 w-4 text-[#df6422] focus:ring-[#df6422] border-gray-300 rounded mt-1"
                  />
                  <label htmlFor="accepte_cgu" className="ml-2 block text-sm text-gray-700">
                    J'ai lu et j'accepte les{' '}
                    <a 
                      href="https://indebel.be/cgu/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#df6422] hover:text-[#df6422] underline"
                    >
                      Conditions d'utilisation
                    </a>
                    {' '}et la politique de confidentialité <span className="text-red-500">*</span>
                  </label>
                </div>

                <div className="flex items-start">
                  <input
                    id="accepte_notifications"
                    name="accepte_notifications"
                    type="checkbox"
                    checked={formData.accepte_notifications}
                    onChange={handleChange}
                    className="h-4 w-4 text-[#df6422] focus:ring-[#df6422] border-gray-300 rounded mt-1"
                  />
                  <label htmlFor="accepte_notifications" className="ml-2 block text-sm text-gray-700">
                    J'accepte de recevoir des notifications
                  </label>
                </div>

                <div className="flex items-start">
                  <input
                    id="accepte_emails"
                    name="accepte_emails"
                    type="checkbox"
                    checked={formData.accepte_emails}
                    onChange={handleChange}
                    className="h-4 w-4 text-[#df6422] focus:ring-[#df6422] border-gray-300 rounded mt-1"
                  />
                  <label htmlFor="accepte_emails" className="ml-2 block text-sm text-gray-700">
                    J'accepte de recevoir des emails
                  </label>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  type="button"
                  onClick={handlePrevStep}
                  variant="secondary"
                  className="flex-1"
                >
                  Précédent
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#df6422] to-[#c25319] hover:from-[#df6422] hover:to-[#c25319] text-white"
                  loading={loading}
                >
                  <User className="h-5 w-5 mr-2" />
                  Créer mon compte
                </Button>
              </div>
            </form>
          )}


        </div>
      </div>
    </div>
  )
}

export default RegisterFreelancer

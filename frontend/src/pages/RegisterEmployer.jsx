import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Building2, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, Search, Loader2, User, Phone, AlertCircle } from 'lucide-react'
import Button from '../components/Button'
import MultiSelect from '../components/MultiSelect'
import PasswordStrength from '../components/PasswordStrength'
import toast from 'react-hot-toast'
import axios from 'axios'
import { pays } from '../data/secteurs'
import SecteurCompetenceSelector from '../components/SecteurCompetenceSelector'
import { validateEmail, validatePassword, isValidEmailFormat } from '../utils/validation'

const RegisterEmployer = () => {
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
    1: 'Vérification BCE',
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
    navigate(`/register-employer/etape${step}?${stepName}`, { replace: true })
    document.title = `${stepTitles[step]} - Inscription Recruteur - Indebel`
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
    competences_recherchees: [],
    // Étape 5
    email: '',
    accepte_cgu: false,
    accepte_notifications: false,
    accepte_emails: false,
    role: 'employer'
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
        // Si 404, le recruteur n'existe pas (on continue)
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
            toast(`Nouvelle tentative ${retryCount}/${MAX_RETRIES}...`)
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
          denomination: formData.denomination || 'Recruteur',
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

    if (step === 4 && (!formData.secteur || formData.competences_recherchees.length === 0)) {
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
      const response = await axios.post('/api/auth/register', registerData)

      if (response.data.success && response.data.data.requiresOTP) {
        toast.success('Inscription réussie ! Vérifiez votre email.')
        // Rediriger vers la page de vérification OTP
        navigate('/verify-otp', {
          state: {
            email: formData.email,
            role: formData.role,
            type: 'registration'
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
        <div className="flex items-center justify-between">
          {steps.map((label, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${step > index + 1 ? 'bg-blue-600 text-white' :
                step === index + 1 ? 'bg-blue-600 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                {step > index + 1 ? <CheckCircle2 className="h-6 w-6" /> : index + 1}
              </div>
              <span className="text-xs mt-1 text-center">{label}</span>
              {index < steps.length - 1 && (
                <div className={`absolute w-full h-1 ${step > index + 1 ? 'bg-blue-600' : 'bg-gray-200'}`}
                  style={{ left: `${(index + 1) * 20}%`, top: '20px', width: '20%', zIndex: -1 }} />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50 relative">
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
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="h-20 w-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <Building2 className="h-10 w-10 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Créer un compte Recruteur
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Déjà un compte ?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
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
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0123456789"
                    disabled={bceVerified}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {checkingBce ? (
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                    ) : bceVerified ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : bceNumber.length === 10 ? (
                      <Search className="h-5 w-5 text-blue-500" />
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
                      Dénomination / Nom de le recruteur *
                    </label>
                    <input
                      type="text"
                      name="denomination"
                      value={formData.denomination}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nom de votre recruteur"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Rue, numéro, code postal, ville"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
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
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-medium flex items-center mb-2">
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Numéro BCE vérifié
                      </p>
                      <p className="text-green-700 text-sm">
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
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
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
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-32 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
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
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
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
                setSelectedSecteur={(val) => setFormData(prev => ({ ...prev, secteur: val }))}
                selectedCompetences={formData.competences_recherchees}
                setSelectedCompetences={(val) => setFormData(prev => ({ ...prev, competences_recherchees: val }))}
                competencesLabel="Quelles sont les compétences que vous recherchez ?"
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
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Email professionnel</label>
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
                    className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${emailValid === true ? 'border-green-500 focus:ring-green-500' :
                      emailValid === false ? 'border-red-500 focus:ring-red-500' :
                        'border-gray-300 focus:ring-blue-500'
                      }`}
                    placeholder="contact@recruteur.com"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {emailValid === true && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
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
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  />
                  <label htmlFor="accepte_cgu" className="ml-2 block text-sm text-gray-700">
                    J'ai lu et j'accepte les{' '}
                    <a
                      href="https://indebel.be/cgu/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-500 underline"
                    >
                      Conditions d'utilisation
                    </a>
                    {' '}et la{' '}
                    <a
                      href="https://indebel.be/politique-de-confidentialite"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-500 underline"
                    >
                      politique de confidentialité
                    </a>
                    {' '}<span className="text-red-500">*</span>
                  </label>
                </div>

                <div className="flex items-start">
                  <input
                    id="accepte_notifications"
                    name="accepte_notifications"
                    type="checkbox"
                    checked={formData.accepte_notifications}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
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
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
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
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  loading={loading}
                >
                  <Building2 className="h-5 w-5 mr-2" />
                  Créer mon compte
                </Button>
              </div>
            </form>
          )}

          {/* Back link */}
          <div className="text-center mt-6 pt-4 border-t">
            <Link
              to="/account-type"
              className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Changer le type de compte
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterEmployer

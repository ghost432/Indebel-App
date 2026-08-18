import { useState, useEffect } from 'react'
import { Upload, FileText, Camera, ArrowLeft, ArrowRight, Send, CheckCircle, Building2, Car, Truck, Check } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import { verificationService } from '../services/verificationService'
import { userService } from '../services/userService'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const FormulaireVerificationMultiEtapes = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState(null)
  const currentStep = parseInt(searchParams.get('etape')) || 1
  const totalSteps = 5

  const [formData, setFormData] = useState({
    // Étape 1: Informations personnelles
    nom_complet: '',
    date_naissance: '',
    telephone: '',
    email: user?.email || '',
    adresse_complete: '',
    
    // Étape 2: Document d'identité
    type_document: 'carte_identite',
    numero_document: '',
    document_recto: '',
    document_verso: '',
    selfie_document: '',
    
    // Étape 3: Documents professionnels
    assurance_rc_professionnelle: '',
    justificatif_domicile: '',
    extrait_bce: '',
    attestation_cotisations_sociales: '',
    
    // Étape 4: Permis de conduire
    a_permis_conduire: false,
    categorie_permis_conduire: '',
    document_permis_conduire: '',
    
    // Étape 5: Permis chariot
    a_permis_chariot: false,
    nombre_permis_chariot: 0,
    document_permis_chariot: ''
  })

  // État pour stocker les métadonnées des fichiers (nom et taille)
  const [fileMetadata, setFileMetadata] = useState({})

  // Initialiser l'étape dans l'URL si elle n'existe pas
  useEffect(() => {
    if (!searchParams.get('etape')) {
      setSearchParams({ etape: '1' }, { replace: true })
    }
  }, [])

  // Charger les données complètes du freelancer au montage
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.id) {
        try {
          console.log('🔄 Chargement des données du freelancer, ID:', user.id)
          const response = await userService.getUserById(user.id)
          const data = (response.data?.data || response.data)
          
          console.log('📦 Données brutes reçues:', {
            prenom: data.prenom,
            nom: data.nom,
            email: data.email,
            telephone: data.telephone,
            indicatif: data.indicatif,
            adresse: data.adresse
          })
          
          setUserData(data)
          
          // Pré-remplir le formulaire avec les données existantes
          if (data) {
            // Construire le nom complet à partir de prenom et nom
            const prenom = data.prenom || ''
            const nom = data.nom || ''
            const nomComplet = `${prenom} ${nom}`.trim()
            
            console.log('👤 Construction nom complet:', {
              prenom: prenom,
              nom: nom,
              nomComplet: nomComplet
            })
            
            // Construire le numéro de téléphone complet avec indicatif si disponible
            let telephoneComplet = data.telephone || ''
            if (data.indicatif && data.telephone && !data.telephone.startsWith('+')) {
              telephoneComplet = `${data.indicatif} ${data.telephone}`
            }
            
            console.log('📞 Construction téléphone:', {
              indicatif: data.indicatif,
              telephone: data.telephone,
              telephoneComplet: telephoneComplet
            })
            
            // Mettre à jour le formulaire
            setFormData(prev => {
              const newData = {
                ...prev,
                nom_complet: nomComplet,
                email: data.email || prev.email,
                telephone: telephoneComplet,
                adresse_complete: data.adresse || prev.adresse_complete
              }
              
              console.log('✅ Formulaire mis à jour:', newData)
              return newData
            })
          }
        } catch (error) {
          console.error('❌ Erreur lors du chargement des données utilisateur:', error)
        }
      } else {
        console.warn('⚠️ Aucun user.id trouvé')
      }
    }
    fetchUserData()
  }, [user?.id])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    })
  }

  const handleFileChange = (e, field) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Le fichier ne doit pas dépasser 5MB')
        return
      }
      
      // Stocker les métadonnées du fichier
      setFileMetadata({
        ...fileMetadata,
        [field]: {
          name: file.name,
          size: file.size,
          type: file.type
        }
      })
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, [field]: reader.result })
        toast.success(`✓ ${file.name} chargé avec succès`)
      }
      reader.readAsDataURL(file)
    }
  }

  const validateStep = (step) => {
    switch(step) {
      case 1:
        if (!formData.nom_complet || !formData.date_naissance || !formData.telephone || !formData.email || !formData.adresse_complete) {
          toast.error('Veuillez remplir tous les champs obligatoires')
          return false
        }
        return true
      case 2:
        if (!formData.numero_document || !formData.document_recto || !formData.selfie_document) {
          toast.error('Veuillez fournir le numéro de document, la photo recto et le selfie')
          return false
        }
        return true
      case 3:
        // Documents professionnels optionnels mais au moins un recommandé
        return true
      case 4:
        if (formData.a_permis_conduire && (!formData.categorie_permis_conduire || !formData.document_permis_conduire)) {
          toast.error('Veuillez indiquer la catégorie et télécharger le document du permis de conduire')
          return false
        }
        return true
      case 5:
        if (formData.a_permis_chariot && (!formData.nombre_permis_chariot || !formData.document_permis_chariot)) {
          toast.error('Veuillez indiquer le nombre de permis chariot et télécharger le document')
          return false
        }
        return true
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      const newStep = Math.min(currentStep + 1, totalSteps)
      setSearchParams({ etape: newStep.toString() })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const prevStep = () => {
    const newStep = Math.max(currentStep - 1, 1)
    setSearchParams({ etape: newStep.toString() })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateStep(currentStep)) {
      return
    }

    try {
      setLoading(true)
      const response = await verificationService.submitVerification(formData)
      
      // Afficher le message de succès
      toast.success('🎉 Demande de vérification envoyée avec succès !', {
        duration: 4000,
      })
      
      // Message supplémentaire
      setTimeout(() => {
        toast.success('📧 Un email de confirmation vous a été envoyé', {
          duration: 4000,
        })
      }, 500)
      
      // Redirection vers le dashboard après 2 secondes
      setTimeout(() => {
        navigate('/freelancer/dashboard')
      }, 2000)
    } catch (error) {
      console.error('Erreur soumission vérification:', error)
      toast.error(error.response?.data?.message || 'Erreur lors de la soumission des documents')
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const renderFileUpload = (field, label, required = false) => {
    const metadata = fileMetadata[field]
    
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className={`border-2 border-dashed rounded-2xl p-8 bg-slate-50 text-center transition-colors ${
          formData[field] ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-primary-500'
        }`}>
          {formData[field] ? (
            <div className="relative">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <div className="bg-green-100 rounded-full p-2">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{metadata?.name || 'Fichier chargé'}</p>
                  {metadata?.size && (
                    <p className="text-xs text-gray-600">{formatFileSize(metadata.size)}</p>
                  )}
                </div>
              </div>
              
              {formData[field].startsWith('data:application/pdf') ? (
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <FileText className="h-16 w-16 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Document PDF</p>
                </div>
              ) : (
                <img 
                  src={formData[field]} 
                  alt={label}
                  className="max-h-48 mx-auto rounded-lg border border-gray-200"
                />
              )}
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setFormData({ ...formData, [field]: '' })
                  setFileMetadata({ ...fileMetadata, [field]: null })
                }}
              >
                Changer le fichier
              </Button>
            </div>
          ) : (
            <div>
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">Cliquez pour télécharger</p>
              <p className="text-xs text-gray-500 mb-3">PDF ou Image (max 5MB)</p>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileChange(e, field)}
                className="hidden"
                id={field}
              />
              <label htmlFor={field}>
                <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-500 hover:bg-orange-600 cursor-pointer transition-colors">
                  Choisir un fichier
                </span>
              </label>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className="flex-1 flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold transition-colors ${
              step < currentStep ? 'bg-green-500 border-green-500 text-white shadow-md' :
              step === currentStep ? 'bg-orange-500 border-orange-500 text-white shadow-md' :
              'bg-slate-100 border-slate-200 text-slate-400'
            }`}>
              {step < currentStep ? <CheckCircle className="h-5 w-5" /> : step}
            </div>
            {step < 5 && (
              <div className={`flex-1 h-1 mx-2 ${step < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-600 mt-2">
        <span>Personnel</span>
        <span>Identité</span>
        <span>Professionnel</span>
        <span>Permis</span>
        <span>Chariot</span>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Button
        variant="outline"
        onClick={() => navigate('/freelancer/verification')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Vérification d'identité
      </h1>
      <p className="text-gray-600 mb-8">
        Étape {currentStep} sur {totalSteps}
      </p>

      {renderProgressBar()}

      <form onSubmit={handleSubmit}>
        {/* Étape 1: Informations personnelles */}
        {currentStep === 1 && (
          <Card className="mb-6 p-8 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <FileText className="h-6 w-6 mr-2 text-orange-500" />
              Informations personnelles
            </h2>

            <div className="space-y-4">
              <Input
                label="Nom complet *"
                name="nom_complet"
                value={formData.nom_complet}
                onChange={handleChange}
                placeholder="Prénom Nom"
                required
              />

              <Input
                label="Email *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@exemple.com"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Date de naissance *"
                  name="date_naissance"
                  type="date"
                  value={formData.date_naissance}
                  onChange={handleChange}
                  required
                />

                <Input
                  label="Téléphone *"
                  name="telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={handleChange}
                  placeholder="+32 xxx xx xx xx"
                  required
                />
              </div>

              <Input
                label="Adresse complète *"
                name="adresse_complete"
                value={formData.adresse_complete}
                onChange={handleChange}
                placeholder="Ex: Chaussée de Ruisbroek 257, 1620 Drogenbos"
                required
              />
            </div>
          </Card>
        )}

        {/* Étape 2: Document d'identité */}
        {currentStep === 2 && (
          <Card className="mb-6 p-8 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <Camera className="h-6 w-6 mr-2 text-orange-500" />
              Document d'identité
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de document *
                </label>
                <select
                  name="type_document"
                  value={formData.type_document}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-200 bg-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base shadow-sm transition-all"
                  required
                >
                  <option value="carte_identite">Carte d'identité</option>
                  <option value="passeport">Passeport</option>
                  <option value="permis_conduire">Permis de conduire</option>
                  <option value="titre_sejour">Titre de séjour</option>
                </select>
              </div>

              <Input
                label="Numéro du document *"
                name="numero_document"
                value={formData.numero_document}
                onChange={handleChange}
                placeholder="Numéro inscrit sur le document"
                required
              />

              {renderFileUpload('document_recto', 'Photo du document (recto)', true)}
              {renderFileUpload('document_verso', 'Photo du document (verso)')}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selfie avec le document *
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Prenez une photo de vous tenant votre document d'identité à côté de votre visage
                </p>
                {renderFileUpload('selfie_document', 'Selfie avec document', true)}
              </div>
            </div>
          </Card>
        )}

        {/* Étape 3: Documents professionnels */}
        {currentStep === 3 && (
          <Card className="mb-6 p-8 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <Building2 className="h-6 w-6 mr-2 text-orange-500" />
              Informations professionnelles
            </h2>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-lg p-4 mb-6">
              <p className="text-sm text-slate-800">
                <strong>Numéro BCE :</strong> {userData?.numero_bce || user?.numero_bce || 'Non renseigné'}<br />
                <strong>Dénomination :</strong> {userData?.denomination || user?.denomination || (userData ? `${userData.prenom} ${userData.nom}` : 'Non renseignée')}
              </p>
            </div>

            <div className="space-y-6">
              {renderFileUpload('assurance_rc_professionnelle', 'Assurance responsabilité civile professionnelle')}
              {renderFileUpload('justificatif_domicile', 'Justificatif de domicile')}
              {renderFileUpload('extrait_bce', 'Extrait BCE pour confirmation')}
              {renderFileUpload('attestation_cotisations_sociales', 'Attestation d\'inscription aux cotisations sociales')}
            </div>
          </Card>
        )}

        {/* Étape 4: Permis de conduire */}
        {currentStep === 4 && (
          <Card className="mb-6 p-8 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <Car className="h-6 w-6 mr-2 text-orange-500" />
              Permis de conduire
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avez-vous un permis de conduire ? *
                </label>
                <select
                  name="a_permis_conduire"
                  value={formData.a_permis_conduire ? 'oui' : 'non'}
                  onChange={(e) => setFormData({ ...formData, a_permis_conduire: e.target.value === 'oui' })}
                  className="w-full px-4 py-3 border border-slate-200 bg-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base shadow-sm transition-all"
                  required
                >
                  <option value="non">Non</option>
                  <option value="oui">Oui</option>
                </select>
              </div>

              {formData.a_permis_conduire && (
                <>
                  <Input
                    label="Quelle catégorie ? *"
                    name="categorie_permis_conduire"
                    value={formData.categorie_permis_conduire}
                    onChange={handleChange}
                    placeholder="Ex: B, C, D, etc."
                    required
                  />
                  {renderFileUpload('document_permis_conduire', 'Document du permis de conduire', true)}
                </>
              )}
            </div>
          </Card>
        )}

        {/* Étape 5: Permis chariot */}
        {currentStep === 5 && (
          <Card className="mb-6 p-8 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <Truck className="h-6 w-6 mr-2 text-orange-500" />
              Permis chariot
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avez-vous un permis de conduire pour chariot ? *
                </label>
                <select
                  name="a_permis_chariot"
                  value={formData.a_permis_chariot ? 'oui' : 'non'}
                  onChange={(e) => setFormData({ ...formData, a_permis_chariot: e.target.value === 'oui' })}
                  className="w-full px-4 py-3 border border-slate-200 bg-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base shadow-sm transition-all"
                  required
                >
                  <option value="non">Non</option>
                  <option value="oui">Oui</option>
                </select>
              </div>

              {formData.a_permis_chariot && (
                <>
                  <Input
                    label="Nombre de permis de conduire pour chariot *"
                    name="nombre_permis_chariot"
                    type="number"
                    min="1"
                    value={formData.nombre_permis_chariot}
                    onChange={handleChange}
                    placeholder="Ex: 1, 2, 3..."
                    required
                  />
                  {renderFileUpload('document_permis_chariot', 'Votre permis de conduire pour chariot', true)}
                </>
              )}

              <Card className="bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div className="text-sm text-slate-800">
                    <p className="font-semibold mb-1">Confidentialité</p>
                    <p>Tous vos documents sont sécurisés et ne seront utilisés que pour vérifier votre identité et vos qualifications. Ils ne seront pas partagés avec des tiers.</p>
                  </div>
                </div>
              </Card>
            </div>
          </Card>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8">
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/freelancer/verification')}
              disabled={loading}
            >
              Annuler
            </Button>
            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={nextStep}
                className="bg-orange-500 text-white hover:bg-orange-600 rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="bg-green-500 text-white hover:bg-green-600 rounded-xl shadow-md hover:shadow-lg transition-all"
                loading={loading}
              >
                <Send className="h-4 w-4 mr-2" />
                Soumettre ma demande
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

export default FormulaireVerificationMultiEtapes

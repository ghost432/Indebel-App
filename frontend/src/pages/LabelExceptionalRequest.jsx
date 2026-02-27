import { useState, useEffect } from 'react'
import { Send, Upload, FileText, AlertTriangle, CheckCircle, Award, Clock, XCircle, RefreshCw } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import axiosInstance from '../services/axiosConfig'

const LabelExceptionalRequest = () => {
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    experience_years: '',
    portfolio_links: '',
    special_skills: '',
    references: '',
    additional_info: ''
  })
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [requestStatus, setRequestStatus] = useState(null) // null, 'pending', 'under_review', 'approved', 'rejected'
  const [showForm, setShowForm] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchRequestStatus()
  }, [])

  const fetchRequestStatus = async () => {
    try {
      setPageLoading(true)
      // Vérifier le statut de la dernière demande exceptionnelle
      const response = await axiosInstance.get('/label/exceptional-request/status')
      if (response.data.success && response.data.request) {
        setRequestStatus(response.data.request.status)
      } else {
        setRequestStatus(null) // Aucune demande
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error)
      setRequestStatus(null)
    } finally {
      setPageLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileUpload = (e) => {
    const selectedFiles = Array.from(e.target.files)
    if (selectedFiles.length + files.length > 5) {
      toast.error('Maximum 5 fichiers autorisés')
      return
    }
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.reason || !formData.description) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      setLoading(true)
      
      const formDataToSend = new FormData()
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key])
      })
      
      files.forEach((file, index) => {
        formDataToSend.append(`file_${index}`, file)
      })

      await axiosInstance.post('/label/exceptional-request', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      toast.success('Demande exceptionnelle envoyée avec succès !')
      setRequestStatus('pending')
      setShowForm(false)
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error)
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi de la demande')
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Rendre le contenu selon le statut de la demande
  const renderStatusContent = () => {
    switch (requestStatus) {
      case 'pending':
      case 'under_review':
        return (
          <div className="p-6 max-w-2xl mx-auto">
            <Card className="border-blue-200 bg-blue-50">
              <div className="p-8 text-center">
                <Clock className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-blue-900 mb-2">
                  Vérification en cours
                </h2>
                <p className="text-blue-800 mb-6">
                  Votre demande exceptionnelle pour le Label Indebel est en cours d'examen par notre équipe. 
                  Vous recevrez une réponse dans un délai de 7 à 10 jours ouvrés.
                </p>
                <Button 
                  variant="secondary"
                  onClick={() => window.history.back()}
                >
                  Retour
                </Button>
              </div>
            </Card>
          </div>
        )
      
      case 'approved':
        return (
          <div className="p-6 max-w-2xl mx-auto">
            <Card className="border-green-200 bg-green-50">
              <div className="p-8 text-center">
                <Award className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-900 mb-2">
                  Label obtenu !
                </h2>
                <p className="text-green-800 mb-6">
                  Félicitations ! Votre demande exceptionnelle a été acceptée. 
                  Vous avez maintenant accès au Label Indebel.
                </p>
                <Button 
                  variant="primary"
                  onClick={() => window.location.href = '/freelancer/profile'}
                >
                  Voir mon profil
                </Button>
              </div>
            </Card>
          </div>
        )
      
      case 'rejected':
        return (
          <div className="p-6 max-w-2xl mx-auto">
            <Card className="border-red-200 bg-red-50">
              <div className="p-8 text-center">
                <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-red-900 mb-2">
                  Label refusé
                </h2>
                <p className="text-red-800 mb-6">
                  Votre demande exceptionnelle n'a pas été acceptée cette fois. 
                  Vous pouvez soumettre une nouvelle demande avec des informations supplémentaires.
                </p>
                <div className="flex justify-center space-x-4">
                  <Button 
                    variant="outline"
                    onClick={() => window.history.back()}
                  >
                    Retour
                  </Button>
                  <Button 
                    variant="primary"
                    icon={RefreshCw}
                    onClick={() => {
                      setRequestStatus(null)
                      setShowForm(true)
                    }}
                  >
                    Réessayer
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )
      
      default:
        // Aucune demande ou état initial
        if (showForm) {
          return renderForm()
        }
        
        return (
          <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Demande exceptionnelle de Label Indebel
              </h1>
              <p className="text-gray-600">
                Soumettez une demande exceptionnelle si vous pensez mériter le Label Indebel malgré des critères non remplis
              </p>
            </div>

            {/* Avertissement */}
            <Card className="mb-6 border-orange-200 bg-orange-50">
              <div className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-orange-900">Demande exceptionnelle</h3>
                    <p className="text-sm text-orange-800 mt-1">
                      Cette demande est réservée aux prestataires ayant des circonstances exceptionnelles 
                      ou des compétences particulières qui justifient l'attribution du Label Indebel 
                      malgré le non-respect de certains critères standards.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Bouton pour ouvrir le formulaire */}
            <div className="text-center">
              <Button
                variant="primary"
                size="lg"
                icon={Send}
                onClick={() => setShowForm(true)}
              >
                Faire une demande exceptionnelle
              </Button>
            </div>
          </div>
        )
    }
  }

  const renderForm = () => (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Demande exceptionnelle de Label Indebel
          </h1>
          <p className="text-gray-600">
            Remplissez ce formulaire pour soumettre votre demande exceptionnelle
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowForm(false)}
        >
          Retour
        </Button>
      </div>

      {/* Avertissement */}
      <Card className="mb-6 border-orange-200 bg-orange-50">
        <div className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-orange-900">Demande exceptionnelle</h3>
              <p className="text-sm text-orange-800 mt-1">
                Cette demande est réservée aux prestataires ayant des circonstances exceptionnelles 
                ou des compétences particulières qui justifient l'attribution du Label Indebel 
                malgré le non-respect de certains critères standards.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Raison principale */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Raison de votre demande
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison principale *
                </label>
                <select
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Sélectionnez une raison</option>
                  <option value="expertise_unique">Expertise unique dans un domaine rare</option>
                  <option value="experience_exceptionnelle">Expérience exceptionnelle (15+ ans)</option>
                  <option value="certifications_prestigieuses">Certifications prestigieuses</option>
                  <option value="references_notables">Références clients notables</option>
                  <option value="contributions_communaute">Contributions à la communauté</option>
                  <option value="autre">Autre (préciser dans la description)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description détaillée *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Expliquez en détail pourquoi vous méritez le Label Indebel..."
                  required
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Informations supplémentaires */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Informations complémentaires
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Années d'expérience"
                name="experience_years"
                type="number"
                value={formData.experience_years}
                onChange={handleInputChange}
                placeholder="Ex: 10"
              />
              
              <Input
                label="Compétences spéciales"
                name="special_skills"
                value={formData.special_skills}
                onChange={handleInputChange}
                placeholder="Ex: Intelligence Artificielle, Blockchain..."
              />
              
              <div className="md:col-span-2">
                <Input
                  label="Liens portfolio/projets"
                  name="portfolio_links"
                  value={formData.portfolio_links}
                  onChange={handleInputChange}
                  placeholder="https://monportfolio.com, https://github.com/..."
                />
              </div>
              
              <div className="md:col-span-2">
                <Input
                  label="Références clients"
                  name="references"
                  value={formData.references}
                  onChange={handleInputChange}
                  placeholder="Noms d'entreprises ou contacts de référence..."
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Informations additionnelles
                </label>
                <textarea
                  name="additional_info"
                  value={formData.additional_info}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Toute information supplémentaire pertinente..."
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Upload de fichiers */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Documents justificatifs
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Joignez des documents qui appuient votre demande (CV, certifications, recommandations, etc.)
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Cliquez pour télécharger</span> ou glissez-déposez
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, PDF (MAX. 5 fichiers, 10MB chacun)
                    </p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    multiple 
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              {/* Liste des fichiers */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Fichiers sélectionnés:</h4>
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Bouton de soumission */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowForm(false)}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon={Send}
          >
            Envoyer la demande
          </Button>
        </div>
      </form>
    </div>
  )

  return renderStatusContent()
}

export default LabelExceptionalRequest

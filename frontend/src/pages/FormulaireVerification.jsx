import { useState } from 'react'
import { Upload, FileText, Camera, ArrowLeft, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import MapboxAutocomplete from '../components/MapboxAutocomplete'
import { verificationService } from '../services/verificationService'
import toast from 'react-hot-toast'

const FormulaireVerification = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nom_complet: '',
    date_naissance: '',
    adresse_complete: '',
    telephone: '',
    type_document: 'carte_identite',
    numero_document: '',
    document_recto: '',
    document_verso: '',
    selfie_document: ''
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e, field) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 5MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, [field]: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.nom_complet || !formData.date_naissance || !formData.adresse_complete || 
        !formData.telephone || !formData.numero_document) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (!formData.document_recto || !formData.selfie_document) {
      toast.error('Veuillez télécharger le document recto et le selfie')
      return
    }

    try {
      setLoading(true)
      await verificationService.submitVerification(formData)
      toast.success('Documents soumis avec succès ! Votre demande sera traitée sous 24-48h.')
      setTimeout(() => {
        navigate('/freelancer/verification')
      }, 2000)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la soumission')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
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
        Remplissez ce formulaire pour faire vérifier votre identité
      </p>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
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
              icon={FileText}
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

            <MapboxAutocomplete
              label="Adresse complète"
              value={formData.adresse_complete}
              onChange={(data) => setFormData({ 
                ...formData, 
                adresse_complete: data.fullAddress 
              })}
              placeholder="Ex: Chaussée de Ruisbroek 257, 1620 Drogenbos"
              required
            />
          </div>
        </Card>

        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Document d'identité
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de document *
              </label>
              <select
                name="type_document"
                value={formData.type_document}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="carte_identite">Carte d'identité</option>
                <option value="passeport">Passeport</option>
                <option value="permis_conduire">Permis de conduire</option>
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
          </div>
        </Card>

        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Photos du document
          </h2>

          <div className="space-y-6">
            {/* Document Recto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo du document (recto) *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                {formData.document_recto ? (
                  <div className="relative">
                    <img 
                      src={formData.document_recto} 
                      alt="Document recto"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="mt-4"
                      onClick={() => setFormData({ ...formData, document_recto: '' })}
                    >
                      Changer
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Cliquez pour télécharger</p>
                    <p className="text-xs text-gray-500">PNG, JPG jusqu'à 5MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'document_recto')}
                      className="hidden"
                      id="document_recto"
                    />
                    <label htmlFor="document_recto" className="cursor-pointer">
                      <Button type="button" className="mt-4" as="span">
                        Choisir un fichier
                      </Button>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Document Verso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo du document (verso) - Optionnel
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                {formData.document_verso ? (
                  <div className="relative">
                    <img 
                      src={formData.document_verso} 
                      alt="Document verso"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="mt-4"
                      onClick={() => setFormData({ ...formData, document_verso: '' })}
                    >
                      Changer
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Cliquez pour télécharger</p>
                    <p className="text-xs text-gray-500">PNG, JPG jusqu'à 5MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'document_verso')}
                      className="hidden"
                      id="document_verso"
                    />
                    <label htmlFor="document_verso" className="cursor-pointer">
                      <Button type="button" variant="outline" className="mt-4" as="span">
                        Choisir un fichier
                      </Button>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Selfie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selfie avec le document *
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Prenez une photo de vous tenant votre document d'identité à côté de votre visage
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                {formData.selfie_document ? (
                  <div className="relative">
                    <img 
                      src={formData.selfie_document} 
                      alt="Selfie"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="mt-4"
                      onClick={() => setFormData({ ...formData, selfie_document: '' })}
                    >
                      Changer
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Cliquez pour télécharger</p>
                    <p className="text-xs text-gray-500">PNG, JPG jusqu'à 5MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'selfie_document')}
                      className="hidden"
                      id="selfie_document"
                    />
                    <label htmlFor="selfie_document" className="cursor-pointer">
                      <Button type="button" className="mt-4" as="span">
                        Choisir un fichier
                      </Button>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-blue-50 border border-blue-200">
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Confidentialité</p>
              <p>Vos documents sont sécurisés et ne seront utilisés que pour vérifier votre identité. Ils ne seront pas partagés avec des tiers.</p>
            </div>
          </div>
        </Card>

        <div className="flex items-center space-x-4 mt-8">
          <Button
            type="submit"
            className="flex-1 bg-gradient-to-r from-primary-500 to-primary-700"
            size="lg"
            loading={loading}
          >
            <Send className="h-5 w-5 mr-2" />
            Soumettre ma demande
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/freelancer/verification')}
            disabled={loading}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  )
}

export default FormulaireVerification

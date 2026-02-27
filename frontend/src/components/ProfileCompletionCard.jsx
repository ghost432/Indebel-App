import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from './Card'
import Button from './Button'

const ProfileCompletionCard = ({ user }) => {
  const navigate = useNavigate()
  const [missingFields, setMissingFields] = useState([])
  const [completionPercentage, setCompletionPercentage] = useState(0)

  useEffect(() => {
    if (!user) return

    const missing = []
    let totalFields = 0
    let filledFields = 0

    if (user.role === 'employer') {
      // Champs obligatoires pour employer
      const fields = [
        { key: 'denomination', label: 'Dénomination de l\'recruteur' },
        { key: 'numero_bce', label: 'Numéro BCE' },
        { key: 'adresse', label: 'Adresse de l\'recruteur' },
        { key: 'prenom', label: 'Prénom' },
        { key: 'nom', label: 'Nom' },
        { key: 'telephone', label: 'Téléphone' },
        { key: 'secteur', label: 'Secteur d\'activité' },
        { key: 'competences_recherchees', label: 'Compétences recherchées', isArray: true },
        { key: 'photo_profil', label: 'Photo de profil' }
      ]

      fields.forEach(field => {
        totalFields++
        if (field.isArray) {
          if (!user[field.key] || user[field.key].length === 0) {
            missing.push(field.label)
          } else {
            filledFields++
          }
        } else {
          const value = user[field.key]
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            missing.push(field.label)
          } else {
            filledFields++
          }
        }
      })
    } else if (user.role === 'freelancer') {
      // Champs obligatoires pour freelancer
      const fields = [
        { key: 'prenom', label: 'Prénom' },
        { key: 'nom', label: 'Nom' },
        { key: 'telephone', label: 'Téléphone' },
        { key: 'adresse', label: 'Adresse' },
        { key: 'secteur', label: 'Secteur d\'activité' },
        { key: 'competences', label: 'Compétences', isArray: true },
        { key: 'langues_parlees', label: 'Langues parlées', isArray: true },
        { key: 'experience', label: 'Informations professionnelles' },
        { key: 'photo_profil', label: 'Photo de profil' }
      ]

      fields.forEach(field => {
        totalFields++
        if (field.isArray) {
          if (!user[field.key] || user[field.key].length === 0) {
            missing.push(field.label)
          } else {
            filledFields++
          }
        } else {
          const value = user[field.key]
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            missing.push(field.label)
          } else {
            filledFields++
          }
        }
      })
    }

    setMissingFields(missing)
    setCompletionPercentage(Math.round((filledFields / totalFields) * 100))
  }, [user])

  if (!user || missingFields.length === 0) {
    return null
  }

  return (
    <Card className="border-l-4 border-l-orange-500">
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Complétez votre profil</h3>
            <p className="text-sm text-gray-600 mt-1">
              Votre profil est complété à <strong>{completionPercentage}%</strong>.
              Remplissez les informations manquantes pour améliorer votre visibilité.
            </p>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>

        {/* Liste des champs manquants */}
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-sm font-medium text-orange-900 mb-2">Informations manquantes :</p>
          <ul className="space-y-1">
            {missingFields.slice(0, 5).map((field, index) => (
              <li key={index} className="text-sm text-orange-800 flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                <span>{field}</span>
              </li>
            ))}
            {missingFields.length > 5 && (
              <li className="text-sm text-orange-700 italic">
                + {missingFields.length - 5} autre(s) champ(s)
              </li>
            )}
          </ul>
        </div>

        {/* Bouton d'action */}
        <Button
          onClick={() => navigate(`/${user.role}/profile`)}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
        >
          Compléter mon profil
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </Card>
  )
}

export default ProfileCompletionCard

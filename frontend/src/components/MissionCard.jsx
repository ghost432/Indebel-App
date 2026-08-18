import { useState } from 'react'
import { 
  MapPin, Euro, Clock, Briefcase, Calendar, Users, 
  Languages, Wrench, X, Check, Building2 
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMissionDemandesUrl } from '../utils/slugify'
import Button from './Button'
import Modal from './Modal'
import toast from 'react-hot-toast'

const MissionCard = ({ mission, onPostuler, onIgnorer, showActions = true, demandesCount = 0, onViewDemandes }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [message, setMessage] = useState('')

  const handlePostulerClick = () => {
    // Vérifier si le profil est vérifié
    if (user?.statut_verification !== 'verifie') {
      toast.error('Vous devez d\'abord vérifier votre identité pour postuler aux missions.', {
        duration: 5000
      })
      // Rediriger vers la page de vérification après 2 secondes
      setTimeout(() => {
        navigate('/freelancer/verification')
      }, 2000)
      return
    }
    setShowConfirmModal(true)
  }

  const handleConfirmPostuler = () => {
    onPostuler(mission, message)
    setShowConfirmModal(false)
    setMessage('')
  }

  // Parse JSON strings
  const parseField = (field) => {
    if (!field) return []
    if (Array.isArray(field)) return field
    try {
      return JSON.parse(field)
    } catch {
      return []
    }
  }

  const competences = parseField(mission.competences)
  const langues = parseField(mission.langues_parlees)

  const isHourly = mission.mission_type === 'hourly'

  return (
    <>
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
        {/* Header avec statut */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-700 px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">{mission.titre}</h3>
              <div className="flex items-center text-white/90 text-sm">
                <Building2 className="h-4 w-4 mr-2" />
                <span>{mission.denomination || `${mission.prenom || ''} ${mission.nom || ''}`.trim() || 'Entreprise'}</span>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              {mission.urgente ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse">
                  🔥 URGENT
                </span>
              ) : null}
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                mission.statut === 'ouvert' ? 'bg-green-100 text-green-700' :
                mission.statut === 'en_cours' ? 'bg-blue-100 text-blue-700' :
                mission.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-700' :
                mission.statut === 'termine' ? 'bg-gray-100 text-gray-700' :
                'bg-red-100 text-red-700'
              }`}>
                {mission.statut === 'ouvert' ? '✓ Ouvert' :
                 mission.statut === 'en_cours' ? '⏳ En cours' :
                 mission.statut === 'en_attente' ? '⏳ En attente de validation' :
                 mission.statut === 'termine' ? '✅ Terminé' :
                 '🔒 Fermé'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                isHourly ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
              }`}>
                {isHourly ? '⏱ Forfait Horaire' : '💰 Forfait Fixe'}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Description */}
          <p className="text-gray-700 mb-4 line-clamp-3">{mission.description}</p>

          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Tarif */}
            <div className="flex items-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <Euro className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
              <div>
                <p className="text-xs text-green-600 font-medium">Forfait</p>
                <p className="text-lg font-bold text-green-700">
                  {isHourly 
                    ? `${mission.forfait_heure}€/h × ${mission.heures_travail_max}h`
                    : `${mission.forfait_mission}€`
                  }
                </p>
              </div>
            </div>

            {/* Durée estimée */}
            <div className="flex items-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
              <div>
                <p className="text-xs text-blue-600 font-medium">Durée estimée</p>
                <p className="text-lg font-bold text-blue-700">
                  {isHourly 
                    ? `${mission.heures_travail_max}h max`
                    : `${mission.temps_max_estime}h`
                  }
                </p>
              </div>
            </div>

            {/* Secteur */}
            {mission.categorie && (
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Briefcase className="h-5 w-5 text-gray-600 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-600 font-medium">Secteur</p>
                  <p className="text-sm font-semibold text-gray-900">{mission.categorie}</p>
                </div>
              </div>
            )}

            {/* Date de début */}
            {mission.date_debut && (
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-gray-600 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-600 font-medium">Début souhaité</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(mission.date_debut).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Détails supplémentaires */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Lieu */}
            <div className="flex items-start">
              <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-600 font-medium">Ville</p>
                <p className="text-sm text-gray-900">
                  {mission.ville_mission || mission.autre_lieu || mission.adresse_mission || 'Non spécifiée'}
                </p>
              </div>
            </div>

            {/* Nombre d'indépendants */}
            {mission.nombre_independants && (
              <div className="flex items-center">
                <Users className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-600 font-medium">Indépendants recherchés</p>
                  <p className="text-sm text-gray-900">{mission.nombre_independants}</p>
                </div>
              </div>
            )}
          </div>

          {/* Compétences */}
          {Array.isArray(competences) && competences.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <Wrench className="h-4 w-4 text-gray-600 mr-2" />
                <p className="text-sm font-semibold text-gray-900">Compétences requises</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {competences.map((comp, idx) => (
                  <span key={idx} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                    {comp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Langues */}
          {Array.isArray(langues) && langues.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <Languages className="h-4 w-4 text-gray-600 mr-2" />
                <p className="text-sm font-semibold text-gray-900">Langues</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {langues.map((langue, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    {langue}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Type de facturation */}
          {mission.type_facturation && (
            <div className="text-sm text-gray-600 mb-4">
              <span className="font-medium">Facturation :</span> {mission.type_facturation}
            </div>
          )}

          {/* Freelancer assigné pour missions en cours */}
          {user?.role === 'employer' && mission.statut === 'en_cours' && mission.freelancer_assigne && (
            <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-lg">
                    {mission.freelancer_assigne.prenom?.charAt(0)}{mission.freelancer_assigne.nom?.charAt(0)}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-green-600 font-medium">✅ Indépendant assigné</p>
                  <p className="font-semibold text-gray-900">
                    {mission.freelancer_assigne.prenom} {mission.freelancer_assigne.nom}
                  </p>
                  <p className="text-sm text-gray-600">{mission.freelancer_assigne.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Demandes reçues - Afficher pour toutes les missions employeur */}
          {onViewDemandes && user?.role === 'employer' && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <button
                onClick={() => {
                  const url = getMissionDemandesUrl(user, mission)
                  navigate(url)
                }}
                className="w-full hover:bg-blue-100 rounded-lg p-2 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">
                      Demandes {demandesCount > 0 ? `(${demandesCount})` : ''}
                    </span>
                  </div>
                  <span className="text-sm text-blue-600 font-medium">
                    {demandesCount > 0 ? 'Voir →' : 'Aucune demande encore reçue'}
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* Actions */}
          {showActions && mission.statut === 'ouvert' && (
            <div className="flex items-center space-x-3 mt-6 pt-6 border-t">
              <Button 
                onClick={handlePostulerClick}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                <Check className="h-5 w-5 mr-2" />
                Postuler
              </Button>
              {onIgnorer && (
                <Button 
                  onClick={() => onIgnorer(mission)}
                  variant="outline"
                  className="flex-1"
                >
                  <X className="h-5 w-5 mr-2" />
                  Ignorer
                </Button>
              )}
            </div>
          )}

          {mission.statut !== 'ouvert' && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-center text-gray-500 text-sm">
                {mission.statut === 'en_cours' && '⏳ Cette mission est en cours'}
                {mission.statut === 'termine' && '✅ Cette mission est terminée'}
                {mission.statut === 'ferme' && '🔒 Cette mission est fermée'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 text-xs text-gray-500">
          Publiée le {mission.date_creation ? new Date(mission.date_creation).toLocaleDateString('fr-FR') : 'N/A'}
        </div>
      </div>

      {/* Modal de confirmation */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Postuler à cette mission"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <h4 className="font-semibold text-blue-900 mb-1">{mission.titre}</h4>
            <p className="text-sm text-blue-700">
              {isHourly 
                ? `${mission.forfait_heure}€/h × ${mission.heures_travail_max}h`
                : `${mission.forfait_mission}€`
              }
            </p>
          </div>

          <p className="text-gray-700">
            Êtes-vous sûr de vouloir postuler à cette mission ? L'employeur sera notifié de votre candidature.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message de motivation (optionnel)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Expliquez pourquoi vous êtes le candidat idéal pour cette mission..."
            />
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <Button
              onClick={handleConfirmPostuler}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              <Check className="h-5 w-5 mr-2" />
              Confirmer
            </Button>
            <Button
              onClick={() => setShowConfirmModal(false)}
              variant="outline"
              className="flex-1"
            >
              Annuler
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default MissionCard

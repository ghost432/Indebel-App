import { useState } from 'react'
import {
  Building2, Mail, Phone, MapPin, Briefcase, Globe, Users,
  Calendar, Award, Star, Languages, Wrench, Euro, Clock, User, MessageSquare,
  Facebook, Instagram, X
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import VerificationBadge from './VerificationBadge'
import LabelBadge from './LabelBadge'
import { profileService } from '../services/profileService'
import { formatForfaitName } from '../utils/forfaitUtils'

const PublicProfileCard = ({ user, type = 'employer' }) => {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  const handleContactClick = () => {
    if (!currentUser) {
      navigate('/login', { state: { from: window.location.pathname } })
      return
    }

    // Rediriger vers la messagerie avec l'ID du destinataire
    const recipientId = user.id
    const recipientType = type === 'employer' ? 'employer' : 'freelancer'
    navigate(`/${currentUser.role === 'employer' ? 'employer' : 'freelancer'}/messages?to=${recipientId}&type=${recipientType}`)
  }
  // Image par défaut de couverture (dégradé)
  const defaultCoverImage = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  const coverImage = profileService.getCoverImage(user)

  // Image de profil et initiales - utiliser le service centralisé
  const profileImage = profileService.getProfileImage(user)
  const initials = profileService.getInitials(user, type)
  const displayName = profileService.getDisplayName(user, type)

  // Parse competences si c'est un string JSON
  const parseCompetences = (comp) => {
    if (!comp) return []
    if (Array.isArray(comp)) return comp
    try {
      return JSON.parse(comp)
    } catch {
      return []
    }
  }

  const competences = parseCompetences(type === 'employer' ? user?.competences_recherchees : user?.competences)
  const langues = parseCompetences(user?.langues_parlees)

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl mx-auto">
      {/* Image de couverture */}
      <div
        className="h-48 sm:h-64 relative"
        style={coverImage
          ? { backgroundImage: `url(${coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: defaultCoverImage }
        }
      >
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      </div>

      {/* Photo de profil et bouton de contact */}
      <div className="relative px-6 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between sm:space-x-6">
          <div className="-mt-16 sm:-mt-20 relative">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-primary-500 to-primary-700 overflow-hidden">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextElementSibling.style.display = 'flex'
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-4xl sm:text-5xl font-bold">
                  {initials}
                </div>
              )}
            </div>
            {/* Bouton Contacter */}
            {currentUser && currentUser.id !== user.id && (
              <div className="mt-4 sm:mt-6">
                <button
                  onClick={handleContactClick}
                  className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
                >
                  <MessageSquare size={16} />
                  <span>Contacter</span>
                </button>
              </div>
            )}
            {/* Badge vérifié */}
            {user?.verified && (
              <div className="absolute bottom-2 right-2 bg-green-500 rounded-full p-2 border-2 border-white">
                <Award className="h-5 w-5 text-white" />
              </div>
            )}
          </div>

          <div className="mt-4 sm:mt-0 sm:mb-4 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {displayName}
              </h1>
              <div className="flex items-center gap-2">
                <LabelBadge userId={user?.id} size="md" />
                <VerificationBadge
                  status={user?.statut_verification || 'non_verifie'}
                  size="md"
                  showText={true}
                  className="text-sm"
                />
              </div>
            </div>
            {user?.numero_bce && (
              <p className="text-sm text-gray-600 mt-1">BCE: {user.numero_bce}</p>
            )}
            {user?.denomination && type === 'freelancer' && (
              <p className="text-sm text-gray-600 mt-1">{user.denomination}</p>
            )}
            {user?.secteur && (
              <div className="flex items-center text-gray-600 mt-2">
                <Briefcase className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">{user.secteur}</span>
              </div>
            )}
          </div>

          {/* Rating */}
          {user?.rating && (
            <div className="flex items-center space-x-1 bg-yellow-50 px-4 py-2 rounded-lg sm:mb-4">
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
              <span className="text-lg font-bold text-gray-900">{user.rating}</span>
              <span className="text-sm text-gray-600">/ 5</span>
            </div>
          )}
        </div>
      </div>

      {/* Informations */}
      <div className="px-6 sm:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Colonne gauche */}
          <div className="space-y-4">
            {/* Description - À propos */}
            {(user?.description_recruteur || user?.a_propos) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {type === 'employer' ? 'À propos de l\'recruteur' : 'À propos'}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {type === 'employer' ? user.description_recruteur : (user.a_propos || user.description_recruteur)}
                </p>
              </div>
            )}

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact</h3>
              <div className="space-y-2">
                {user?.email && (
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-3 text-primary-600 flex-shrink-0" />
                    <a href={`mailto:${user.email}`} className="text-sm hover:text-primary-600 break-all">
                      {user.email}
                    </a>
                  </div>
                )}
                {user?.telephone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-3 text-primary-600 flex-shrink-0" />
                    <a href={`tel:${user.telephone}`} className="text-sm hover:text-primary-600">
                      {user.telephone}
                    </a>
                  </div>
                )}
                {user?.adresse && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-3 text-primary-600 flex-shrink-0" />
                    <span className="text-sm">{user.adresse}</span>
                  </div>
                )}
                {(type === 'employer' ? user?.site_web : user?.portfolio_url) && (
                  <div className="flex items-center text-gray-600">
                    <Globe className="h-4 w-4 mr-3 text-primary-600 flex-shrink-0" />
                    <a
                      href={type === 'employer' ? user.site_web : user.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:text-primary-600 break-all"
                    >
                      {type === 'employer' ? user.site_web : user.portfolio_url}
                    </a>
                  </div>
                )}
                {user?.linkedin && (
                  <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-700 hover:underline mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-4 h-4" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.025-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667h-3.554v-11.5h3.413v1.571h.049c.476-.9 1.637-1.852 3.368-1.852 3.602 0 4.268 2.37 4.268 5.451v6.33z" /></svg>
                    LinkedIn
                  </a>
                )}
                {user?.twitter && (
                  <a href={user.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline mr-4">
                    <X size={16} />
                    X
                  </a>
                )}
                {user?.facebook && (
                  <a href={user.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline mr-4">
                    <Facebook size={16} />
                    Facebook
                  </a>
                )}
                {user?.instagram && (
                  <a href={user.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-pink-600 hover:underline">
                    <Instagram size={16} />
                    Instagram
                  </a>
                )}
              </div>
            </div>

            {/* Informations recruteur */}
            {type === 'employer' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations</h3>
                <div className="space-y-2">
                  {user?.taille_recruteur && (
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-3 text-primary-600 flex-shrink-0" />
                      <span className="text-sm">{user.taille_recruteur} employés</span>
                    </div>
                  )}
                  {user?.date_creation && (
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-3 text-primary-600 flex-shrink-0" />
                      <span className="text-sm">
                        Membre depuis {new Date(user.date_creation).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Informations freelancer */}
            {type === 'freelancer' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations professionnelles</h3>
                <div className="space-y-2">
                  {user?.numero_bce && (
                    <div className="flex items-center text-gray-600">
                      <Building2 className="h-4 w-4 mr-3 text-primary-600 flex-shrink-0" />
                      <span className="text-sm">BCE: {user.numero_bce}</span>
                    </div>
                  )}
                  {user?.denomination && (
                    <div className="flex items-center text-gray-600">
                      <Briefcase className="h-4 w-4 mr-3 text-primary-600 flex-shrink-0" />
                      <span className="text-sm font-medium">{user.denomination}</span>
                    </div>
                  )}
                  {user?.secteur && (
                    <div className="flex items-center text-gray-600">
                      <Briefcase className="h-4 w-4 mr-3 text-primary-600 flex-shrink-0" />
                      <span className="text-sm">Secteur: {user.secteur}</span>
                    </div>
                  )}
                  {user?.adresse && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-3 text-primary-600 flex-shrink-0" />
                      <span className="text-sm">{user.adresse}</span>
                    </div>
                  )}
                  {user?.genre && user.genre !== 'non_specifie' && (
                    <div className="flex items-center text-gray-600">
                      <User className="h-4 w-4 mr-3 text-primary-600 flex-shrink-0" />
                      <span className="text-sm capitalize">Genre: {user.genre}</span>
                    </div>
                  )}
                  {user?.tranche_age && (
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-3 text-primary-600 flex-shrink-0" />
                      <span className="text-sm">Âge: {user.tranche_age} ans</span>
                    </div>
                  )}
                  {user?.experience && (
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-3 text-primary-600 flex-shrink-0" />
                      <span className="text-sm">{user.experience} ans d'expérience</span>
                    </div>
                  )}
                  {(user?.disponibilite_debut || user?.disponibilite_fin) && (
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-3 text-primary-600 flex-shrink-0" />
                      <span className="text-sm">
                        Disponible du {user?.disponibilite_debut && new Date(user.disponibilite_debut).toLocaleDateString('fr-FR')}
                        {user?.disponibilite_debut && user?.disponibilite_fin && ' au '}
                        {user?.disponibilite_fin && new Date(user.disponibilite_fin).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                  {Array.isArray(langues) && langues.length > 0 && (
                    <div className="flex items-center text-gray-600">
                      <Languages className="h-4 w-4 mr-3 text-primary-600 flex-shrink-0" />
                      <span className="text-sm">
                        Langues: {langues.join(', ')}
                      </span>
                    </div>
                  )}
                  {user?.date_creation && (
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-3 text-primary-600 flex-shrink-0" />
                      <span className="text-sm">
                        Membre depuis {new Date(user.date_creation).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Colonne droite */}
          <div className="space-y-4">
            {/* Compétences */}
            {Array.isArray(competences) && competences.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Wrench className="h-5 w-5 mr-2 text-primary-600" />
                  {type === 'employer' ? 'Compétences recherchées' : 'Compétences'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {competences.map((comp, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
                    >
                      {comp}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Langues */}
            {Array.isArray(langues) && langues.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Languages className="h-5 w-5 mr-2 text-primary-600" />
                  Langues parlées
                </h3>
                <div className="flex flex-wrap gap-2">
                  {langues.map((langue, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {langue}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Statistiques */}
            {(user?.missions_completed || user?.total_hours || user?.clients_count) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Statistiques</h3>
                <div className="grid grid-cols-2 gap-4">
                  {user?.missions_completed && (
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">{user.missions_completed}</div>
                      <div className="text-xs text-green-600 mt-1">Missions complétées</div>
                    </div>
                  )}
                  {user?.total_hours && (
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-700">{user.total_hours}h</div>
                      <div className="text-xs text-blue-600 mt-1">Heures travaillées</div>
                    </div>
                  )}
                  {user?.clients_count && (
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-700">{user.clients_count}</div>
                      <div className="text-xs text-purple-600 mt-1">Clients satisfaits</div>
                    </div>
                  )}
                  {user?.response_time && (
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-orange-700">{user.response_time}h</div>
                      <div className="text-xs text-orange-600 mt-1">Temps de réponse</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer avec badge de rôle */}
      <div className="bg-gray-50 px-6 sm:px-8 py-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${type === 'employer'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-green-100 text-green-700'
              }`}>
              {type === 'employer' ? '🏢 Recruteur' : '👤 Prestataire'}
            </span>
            {user?.verified && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                ✓ Vérifié
              </span>
            )}
          </div>

          <button
            onClick={handleContactClick}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
          >
            {type === 'employer' ? 'Contacter l\'recruteur' : 'Contacter l\'prestataire'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PublicProfileCard

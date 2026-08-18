import { 
  MapPin, Globe, Briefcase, Calendar, Star, Languages, MessageSquare,
  Facebook, Instagram, X, ShieldCheck
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { profileService } from '../services/profileService'
import VerificationBadge from './VerificationBadge'

const PublicProfileCard = ({ user, type = 'employer' }) => {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  
  const handleContactClick = () => {
    if (!currentUser) {
      navigate('/login', { state: { from: window.location.pathname } })
      return
    }
    const recipientId = user.id
    const recipientType = type === 'employer' ? 'employer' : 'freelancer'
    navigate(`/${currentUser.role === 'employer' ? 'employer' : 'freelancer'}/messages?to=${recipientId}&type=${recipientType}`)
  }
  
  const defaultCoverImage = 'linear-gradient(to right, #f8fafc, #e2e8f0)'
  const coverImage = profileService.getCoverImage(user)
  const profileImage = profileService.getProfileImage(user)
  const initials = profileService.getInitials(user, type)
  const displayName = profileService.getDisplayName(user, type)

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
    <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden max-w-4xl mx-auto relative pb-8">
      {/* Image de couverture */}
      <div 
        className="h-48 sm:h-64 relative bg-slate-100"
        style={coverImage 
          ? { backgroundImage: `url(${coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: defaultCoverImage }
        }
      />

      {/* Profil Content */}
      <div className="px-6 md:px-8 relative">
        {/* Avatar & Contact Button */}
        <div className="flex justify-between items-end -mt-16 mb-4 relative z-10">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center">
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
                <div className="w-full h-full flex items-center justify-center bg-primary-50 text-primary-600 text-3xl font-bold">
                  {initials}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            {(!currentUser || currentUser.id !== user.id) && (
              <button
                onClick={handleContactClick}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 hover:-translate-y-0.5 transition-all shadow-sm"
              >
                <MessageSquare size={16} />
                <span className="hidden sm:inline">Message</span>
              </button>
            )}
          </div>
        </div>

        {/* Nom & Titre */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
            <VerificationBadge status={user?.statut_verification || 'non_verifie'} premium={user?.forfait_badge_premium} size="md" showText={true} />
          </div>
          {user?.secteur && (
            <div className="flex items-center text-slate-500 font-medium gap-1.5 mt-1"><Briefcase className="h-4 w-4" /><span>{user.secteur}</span></div>
          )}
        </div>

        {/* Rating */}
        {user?.rating && (
          <div className="flex items-center gap-1.5 mb-5">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span className="font-bold text-slate-800">{user.rating}</span>
            <span className="text-slate-500 text-sm">/ 5</span>
          </div>
        )}

        {/* Description / Bio */}
        {(user?.description_entreprise || user?.a_propos || user?.bio) && (
          <div className="mb-5 text-slate-800 leading-relaxed max-w-2xl whitespace-pre-line">
            {type === 'employer' ? user.description_entreprise : (user.a_propos || user.bio || user.description_entreprise)}
          </div>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500 mb-6">
          {user?.adresse && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {user.adresse}
            </div>
          )}
          {user?.date_creation && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> Inscrit en {new Date(user.date_creation).toLocaleDateString('fr-FR', {month:'long', year:'numeric'})}
            </div>
          )}
          {user?.site_web && type === 'employer' && (
            <div className="flex items-center gap-1.5">
              <Globe className="h-4 w-4" /> 
              <a href={user.site_web} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">Site web</a>
            </div>
          )}
          {user?.portfolio_url && type === 'freelancer' && (
            <div className="flex items-center gap-1.5">
              <Globe className="h-4 w-4" /> 
              <a href={user.portfolio_url} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">Portfolio</a>
            </div>
          )}
        </div>

        {/* Reseaux Sociaux */}
        {(user?.facebook || user?.instagram || user?.twitter || user?.linkedin) && (
          <div className="flex gap-3 mb-6">
            {user.linkedin && (
              <a href={user.linkedin} target="_blank" rel="noreferrer" className="p-2 bg-slate-50 text-slate-600 hover:text-blue-700 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-5 h-5" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.025-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667h-3.554v-11.5h3.413v1.571h.049c.476-.9 1.637-1.852 3.368-1.852 3.602 0 4.268 2.37 4.268 5.451v6.33z"/></svg>
              </a>
            )}
            {user.twitter && (
              <a href={user.twitter} target="_blank" rel="noreferrer" className="p-2 bg-slate-50 text-slate-600 hover:text-blue-500 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </a>
            )}
            {user.facebook && (
              <a href={user.facebook} target="_blank" rel="noreferrer" className="p-2 bg-slate-50 text-slate-600 hover:text-blue-600 rounded-full transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            )}
            {user.instagram && (
              <a href={user.instagram} target="_blank" rel="noreferrer" className="p-2 bg-slate-50 text-slate-600 hover:text-pink-600 rounded-full transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            )}
          </div>
        )}

        {/* Tags / Badges / Skills */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          {Array.isArray(competences) && competences.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                {type === 'employer' ? 'Compétences recherchées' : 'Compétences'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {competences.map((comp, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-full">
                    {comp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(langues) && langues.length > 0 && (
            <div className="pt-2">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Langues</h3>
              <div className="flex flex-wrap gap-2">
                {langues.map((langue, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                    {langue}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default PublicProfileCard

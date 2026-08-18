import PropTypes from 'prop-types'
import { Crown } from 'lucide-react'

const UserBadges = ({ statut_verification, forfait_nom, forfait_couleur, forfait_badge_premium, showForfait = true, size = 'md' }) => {
  // Tailles des badges
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8'
  }

  const badgeSize = sizes[size] || sizes.md

  return (
    <div className="flex items-center gap-1">
      {/* Badge de vérification */}
      {(!statut_verification || statut_verification === 'verifie' || statut_verification === 'non_verifie') && (
        <img
          src={statut_verification === 'verifie' ? '/images/2.png' : '/images/1.png'}
          alt={statut_verification === 'verifie' ? 'Vérifié' : 'Non vérifié'}
          className={`${badgeSize} object-contain`}
          title={statut_verification === 'verifie' ? 'Identité vérifiée' : 'Identité non vérifiée'}
        />
      )}
      {(statut_verification === 'en_cours' || statut_verification === 'en cours' || statut_verification === 'en attente') && (
        <div className={`${badgeSize} flex items-center justify-center bg-blue-100 text-blue-600 rounded-full`} title="Vérification en cours">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
      )}
      {statut_verification === 'refuse' && (
        <div className={`${badgeSize} flex items-center justify-center bg-red-100 text-red-600 rounded-full`} title="Vérification refusée">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
      )}

      {/* Badge Premium */}
      {forfait_badge_premium ? (
        <div 
          className={`${badgeSize} flex items-center justify-center bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 rounded-full shadow-sm`} 
          title="Membre Premium"
        >
          <Crown className="w-3/4 h-3/4" />
        </div>
      ) : null}

      {/* Badge de forfait */}
      {showForfait && forfait_nom && (
        <div 
          className="px-2 py-0.5 rounded-full text-xs font-semibold text-white flex items-center gap-1"
          style={{ backgroundColor: forfait_couleur || '#6B7280' }}
          title={forfait_nom}
        >
          📦
          <span className="hidden sm:inline">{forfait_nom.replace(' Freelancer', '').replace(' Employer', '')}</span>
        </div>
      )}
    </div>
  )
}

UserBadges.propTypes = {
  statut_verification: PropTypes.oneOf(['non_verifie', 'en_cours', 'verifie', 'refuse']),
  forfait_nom: PropTypes.string,
  forfait_couleur: PropTypes.string,
  forfait_badge_premium: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
  showForfait: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl'])
}

export default UserBadges

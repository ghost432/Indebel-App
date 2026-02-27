import PropTypes from 'prop-types'
import { getForfaitNameWithoutSuffix } from '../utils/forfaitUtils'

const UserBadges = ({ statut_verification, forfait_nom, forfait_couleur, showForfait = true, size = 'md' }) => {
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
      {statut_verification && (
        <img
          src={statut_verification === 'verifie' ? '/images/2.png' : '/images/1.png'}
          alt={statut_verification === 'verifie' ? 'Vérifié' : 'Non vérifié'}
          className={`${badgeSize} object-contain`}
          title={statut_verification === 'verifie' ? 'Identité vérifiée' : 'Identité non vérifiée'}
        />
      )}

      {/* Badge de forfait */}
      {showForfait && forfait_nom && (
        <div 
          className="px-2 py-0.5 rounded-full text-xs font-semibold text-white flex items-center gap-1"
          style={{ backgroundColor: forfait_couleur || '#6B7280' }}
          title={forfait_nom}
        >
          📦
          <span className="hidden sm:inline">{getForfaitNameWithoutSuffix(forfait_nom)}</span>
        </div>
      )}
    </div>
  )
}

UserBadges.propTypes = {
  statut_verification: PropTypes.oneOf(['non_verifie', 'en_cours', 'verifie', 'refuse']),
  forfait_nom: PropTypes.string,
  forfait_couleur: PropTypes.string,
  showForfait: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl'])
}

export default UserBadges

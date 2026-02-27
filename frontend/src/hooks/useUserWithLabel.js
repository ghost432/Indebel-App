import { useMemo } from 'react'
import UserNameWithLabel from '../components/UserNameWithLabel'

/**
 * Hook pour afficher uniformément les noms d'utilisateurs avec leur badge label
 * @param {Object} user - L'utilisateur à afficher
 * @param {Object} options - Options d'affichage
 * @returns {JSX.Element} Composant avec nom + badge
 */
export const useUserWithLabel = (user, options = {}) => {
  const {
    showLabel = true,
    className = '',
    size = 'md'
  } = options

  return useMemo(() => {
    if (!user) return <span className={className}>Utilisateur</span>

    return (
      <UserNameWithLabel 
        user={user} 
        showLabel={showLabel}
        className={className}
        size={size}
      />
    )
  }, [user, showLabel, className, size])
}

export default useUserWithLabel

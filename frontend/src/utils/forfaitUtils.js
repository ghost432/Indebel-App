/**
 * Utilitaires pour la gestion des forfaits
 */

/**
 * Nettoie le nom du forfait en supprimant les chiffres au début
 * @param {string} nom - Nom du forfait à nettoyer
 * @returns {string} - Nom nettoyé du forfait
 */
export const getCleanForfaitName = (nom) => {
  if (!nom) return 'Forfait'
  // Supprimer les chiffres au début du nom (ex: "01 Gratuit" -> "Gratuit")
  return nom.replace(/^0+\s*/, '').replace(/^\d+\s*/, '').trim()
}

/**
 * Formate le nom du forfait pour l'affichage
 * @param {string} nom - Nom du forfait
 * @returns {string} - Nom formaté
 */
export const formatForfaitName = (nom) => {
  const cleanName = getForfaitNameWithoutSuffix(nom)
  return cleanName === 'Gratuit' ? 'Forfait Gratuit' : cleanName
}

/**
 * Supprime les suffixes "Freelancer" ou "Employer" du nom du forfait
 * @param {string} nom - Nom du forfait
 * @returns {string} - Nom sans le suffixe
 */
export const getForfaitNameWithoutSuffix = (nom) => {
  const cleanName = getCleanForfaitName(nom)
  return cleanName.replace(' Freelancer', '').replace(' Employer', '').trim()
}

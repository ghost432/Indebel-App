/**
 * Convertit un nom en slug URL-friendly
 * @param {string} text - Texte à convertir
 * @returns {string} - Slug généré
 */
export const slugify = (text) => {
  if (!text) return 'mes-missions'
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Remplacer espaces par -
    .replace(/[^\w\-]+/g, '')       // Supprimer caractères spéciaux
    .replace(/\-\-+/g, '-')         // Remplacer -- par -
    .replace(/^-+/, '')             // Trim - au début
    .replace(/-+$/, '')             // Trim - à la fin
}

/**
 * Génère l'URL des missions pour un employer
 * @param {object} user - Objet utilisateur
 * @returns {string} - URL générée
 */
export const getEmployerJobsUrl = (user) => {
  if (!user || user.role !== 'employer') return '/employer/jobs'
  
  // S'assurer qu'on a au moins une information pour créer le slug
  const name = user.denomination || user.nom || user.prenom || 'mes-missions'
  if (!name || name === 'null' || name === 'undefined') {
    return '/employer/mes-missions'
  }
  
  const slug = slugify(name)
  return `/employer/${slug}/myjob`
}

/**
 * Génère un slug pour une mission avec son ID
 * @param {string} titre - Titre de la mission
 * @param {number} id - ID de la mission
 * @returns {string} - Slug de la mission
 */
export const getMissionSlug = (titre, id) => {
  const slug = slugify(titre)
  return `${slug}-${id}`
}

/**
 * Génère l'URL des demandes pour une mission spécifique
 * @param {object} user - Objet utilisateur
 * @param {object} mission - Objet mission
 * @returns {string} - URL générée
 */
export const getMissionDemandesUrl = (user, mission) => {
  if (!user || user.role !== 'employer') return '/employer/demandes'
  
  const entrepriseSlug = slugify(user.denomination || user.nom || 'entreprise')
  const missionSlug = getMissionSlug(mission.titre, mission.id)
  return `/employer/${entrepriseSlug}/myjob/${missionSlug}/demandes`
}

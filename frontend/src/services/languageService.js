// Service pour gérer les langues disponibles
export const languageService = {
  // Liste des langues disponibles
  getAvailableLanguages: () => {
    return [
      'français',
      'néerlandais',
      'anglais',
      'allemand',
      'espagnol',
      'italien',
      'portugais',
      'arabe',
      'russe',
      'chinois'
    ]
  },

  // Formater les langues (JSON string -> array)
  parseLanguages: (languesData) => {
    if (!languesData) return []
    
    if (Array.isArray(languesData)) {
      return languesData
    }
    
    if (typeof languesData === 'string') {
      try {
        const parsed = JSON.parse(languesData)
        return Array.isArray(parsed) ? parsed : []
      } catch (e) {
        console.error('Erreur parsing langues:', e)
        return []
      }
    }
    
    return []
  },

  // Formater les langues pour l'envoi (array -> JSON string)
  stringifyLanguages: (languages) => {
    if (!languages || languages.length === 0) return null
    return JSON.stringify(languages)
  }
}

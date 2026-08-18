// Secteurs d'activité
export const secteurs = [
  { value: 'informatique', label: 'Informatique & Technologie' },
  { value: 'construction', label: 'Construction & BTP' },
  { value: 'commerce', label: 'Commerce & Distribution' },
  { value: 'sante', label: 'Santé & Médical' },
  { value: 'education', label: 'Éducation & Formation' },
  { value: 'finance', label: 'Finance & Banque' },
  { value: 'immobilier', label: 'Immobilier' },
  { value: 'transport', label: 'Transport & Logistique' },
  { value: 'hotellerie', label: 'Hôtellerie & Restauration' },
  { value: 'communication', label: 'Communication & Marketing' },
  { value: 'juridique', label: 'Juridique & Conseil' },
  { value: 'industrie', label: 'Industrie & Production' },
  { value: 'agriculture', label: 'Agriculture & Agroalimentaire' },
  { value: 'energie', label: 'Énergie & Environnement' },
  { value: 'arts', label: 'Arts & Culture' },
  { value: 'services', label: 'Services aux entreprises' },
  { value: 'autre', label: 'Autre' }
]

// Compétences
export const competences = [
  // Informatique
  { value: 'javascript', label: 'JavaScript', categorie: 'Développement' },
  { value: 'python', label: 'Python', categorie: 'Développement' },
  { value: 'java', label: 'Java', categorie: 'Développement' },
  { value: 'php', label: 'PHP', categorie: 'Développement' },
  { value: 'react', label: 'React', categorie: 'Développement' },
  { value: 'nodejs', label: 'Node.js', categorie: 'Développement' },
  { value: 'angular', label: 'Angular', categorie: 'Développement' },
  { value: 'vue', label: 'Vue.js', categorie: 'Développement' },
  { value: 'sql', label: 'SQL', categorie: 'Base de données' },
  { value: 'mongodb', label: 'MongoDB', categorie: 'Base de données' },
  
  // Design
  { value: 'photoshop', label: 'Photoshop', categorie: 'Design' },
  { value: 'illustrator', label: 'Illustrator', categorie: 'Design' },
  { value: 'figma', label: 'Figma', categorie: 'Design' },
  { value: 'ux-ui', label: 'UX/UI Design', categorie: 'Design' },
  
  // Marketing
  { value: 'seo', label: 'SEO', categorie: 'Marketing' },
  { value: 'google-ads', label: 'Google Ads', categorie: 'Marketing' },
  { value: 'facebook-ads', label: 'Facebook Ads', categorie: 'Marketing' },
  { value: 'content-marketing', label: 'Content Marketing', categorie: 'Marketing' },
  { value: 'email-marketing', label: 'Email Marketing', categorie: 'Marketing' },
  
  // Gestion
  { value: 'gestion-projet', label: 'Gestion de projet', categorie: 'Gestion' },
  { value: 'comptabilite', label: 'Comptabilité', categorie: 'Gestion' },
  { value: 'ressources-humaines', label: 'Ressources Humaines', categorie: 'Gestion' },
  
  // Langues
  { value: 'francais', label: 'Français', categorie: 'Langues' },
  { value: 'neerlandais', label: 'Néerlandais', categorie: 'Langues' },
  { value: 'anglais', label: 'Anglais', categorie: 'Langues' },
  { value: 'allemand', label: 'Allemand', categorie: 'Langues' },
  { value: 'espagnol', label: 'Espagnol', categorie: 'Langues' },
  
  // Construction
  { value: 'electricite', label: 'Électricité', categorie: 'Construction' },
  { value: 'plomberie', label: 'Plomberie', categorie: 'Construction' },
  { value: 'menuiserie', label: 'Menuiserie', categorie: 'Construction' },
  { value: 'peinture', label: 'Peinture', categorie: 'Construction' },
  { value: 'maconnerie', label: 'Maçonnerie', categorie: 'Construction' },
  
  // Autres
  { value: 'redaction', label: 'Rédaction', categorie: 'Communication' },
  { value: 'traduction', label: 'Traduction', categorie: 'Communication' },
  { value: 'photographie', label: 'Photographie', categorie: 'Créatif' },
  { value: 'video', label: 'Montage vidéo', categorie: 'Créatif' },
  { value: 'consultation', label: 'Consultation', categorie: 'Conseil' }
]

// Pays avec indicatifs
export const pays = [
  { value: 'BE', label: 'Belgique', indicatif: '+32', flag: '🇧🇪', format: '0XXX XX XX XX' },
  { value: 'FR', label: 'France', indicatif: '+33', flag: '🇫🇷', format: '0X XX XX XX XX' },
  { value: 'LU', label: 'Luxembourg', indicatif: '+352', flag: '🇱🇺', format: 'XXX XXX XXX' },
  { value: 'NL', label: 'Pays-Bas', indicatif: '+31', flag: '🇳🇱', format: '0X XXXX XXXX' },
  { value: 'DE', label: 'Allemagne', indicatif: '+49', flag: '🇩🇪', format: '0XXX XXXXXXX' },
  { value: 'GB', label: 'Royaume-Uni', indicatif: '+44', flag: '🇬🇧', format: '0XXXX XXXXXX' },
  { value: 'ES', label: 'Espagne', indicatif: '+34', flag: '🇪🇸', format: 'XXX XXX XXX' },
  { value: 'IT', label: 'Italie', indicatif: '+39', flag: '🇮🇹', format: 'XXX XXX XXXX' },
  { value: 'PT', label: 'Portugal', indicatif: '+351', flag: '🇵🇹', format: 'XXX XXX XXX' },
  { value: 'CH', label: 'Suisse', indicatif: '+41', flag: '🇨🇭', format: 'XX XXX XX XX' }
]

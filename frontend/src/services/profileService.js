/**
 * Service pour gérer les profils utilisateurs de manière cohérente
 * Gère les initiales, les photos de profil et la synchronisation
 */

export const profileService = {
  /**
   * Génère les initiales de manière cohérente
   * Pour les employeurs: utilise la denomination
   * Pour les freelancers: utilise prenom + nom
   * @param {Object} user - L'utilisateur
   * @param {string} type - 'employer' ou 'freelancer'
   * @returns {string} Les initiales (2 caractères)
   */
  getInitials: (user, type = 'employer') => {
    if (!user) return 'IN';

    let initials = '';

    if (type === 'employer') {
      // Pour les employeurs: utiliser la denomination
      if (user.denomination) {
        initials = user.denomination
          .trim()
          .split(' ')
          .slice(0, 2)
          .map(word => word.charAt(0))
          .join('')
          .toUpperCase()
          .substring(0, 2);
      }
      // Fallback si pas de denomination
      if (!initials) {
        initials = 'EN';
      }
    } else {
      // Pour les freelancers: utiliser prenom + nom
      const prenom = user.prenom?.charAt(0)?.toUpperCase() || '';
      const nom = user.nom?.charAt(0)?.toUpperCase() || '';
      initials = (prenom + nom).substring(0, 2) || 'IN';
    }

    return initials;
  },

  /**
   * Récupère la photo de profil de manière cohérente
   * Priorité: photo_profil du backend > localStorage > null
   * @param {Object} user - L'utilisateur
   * @returns {string|null} L'URL ou data URL de la photo
   */
  getProfileImage: (user) => {
    if (!user) return null;

    // Priorité 1: photo_profil du backend
    if (user.photo_profil) {
      // Vérifier que c'est une data URL valide ou une URL complète
      if (user.photo_profil.startsWith('data:') || user.photo_profil.startsWith('http')) {
        return user.photo_profil;
      }
      // Si c'est juste un nom de fichier, ne pas l'utiliser comme image de profil
      // Les noms de fichiers ne devraient pas être dans photo_profil
      if (user.photo_profil.includes('.')) {
        console.warn('photo_profil contient un nom de fichier au lieu d\'une data URL:', user.photo_profil);
        return null;
      }
    }

    // Priorité 2: localStorage
    if (user.id) {
      const savedImage = localStorage.getItem(`profileImage_${user.id}`);
      if (savedImage) {
        // Même vérification pour localStorage
        if (savedImage.startsWith('data:') || savedImage.startsWith('http')) {
          return savedImage;
        }
        // Si c'est un nom de fichier, ne pas l'utiliser
        if (savedImage.includes('.')) {
          console.warn('localStorage contient un nom de fichier au lieu d\'une data URL:', savedImage);
          localStorage.removeItem(`profileImage_${user.id}`);
          return null;
        }
      }
    }

    return null;
  },

  /**
   * Récupère l'image de couverture de manière cohérente
   * Priorité: image_couverture du backend > localStorage > null
   * @param {Object} user - L'utilisateur
   * @returns {string|null} L'URL ou data URL de l'image
   */
  getCoverImage: (user) => {
    if (!user) return null;

    // Priorité 1: image_couverture du backend
    if (user.image_couverture) {
      return user.image_couverture;
    }

    // Priorité 2: localStorage
    if (user.id) {
      const savedCover = localStorage.getItem(`coverImage_${user.id}`);
      if (savedCover) {
        return savedCover;
      }
    }

    return null;
  },

  /**
   * Sauvegarde une photo de profil localement et prépare pour le backend
   * @param {string} imageData - Les données de l'image (data URL)
   * @param {number} userId - L'ID de l'utilisateur
   * @returns {Object} Les données à envoyer au backend
   */
  saveProfileImage: (imageData, userId) => {
    if (userId) {
      localStorage.setItem(`profileImage_${userId}`, imageData);
    }
    return {
      photo_profil: imageData
    };
  },

  /**
   * Sauvegarde une image de couverture localement et prépare pour le backend
   * @param {string} imageData - Les données de l'image (data URL)
   * @param {number} userId - L'ID de l'utilisateur
   * @returns {Object} Les données à envoyer au backend
   */
  saveCoverImage: (imageData, userId) => {
    if (userId) {
      localStorage.setItem(`coverImage_${userId}`, imageData);
    }
    return {
      image_couverture: imageData
    };
  },

  /**
   * Nettoie les données de profil du localStorage
   * @param {number} userId - L'ID de l'utilisateur
   */
  clearProfileCache: (userId) => {
    if (userId) {
      localStorage.removeItem(`profileImage_${userId}`);
      localStorage.removeItem(`coverImage_${userId}`);
    }
  },

  /**
   * Nettoie toutes les données corrompues du localStorage
   * Supprime tous les éléments qui contiennent des noms de fichiers
   */
  cleanupCorruptedCache: () => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i));
    }
    
    keys.forEach(key => {
      if (key && key.startsWith('profileImage_')) {
        const value = localStorage.getItem(key);
        if (value && value.includes('.') && !value.startsWith('data:') && !value.startsWith('http')) {
          console.warn(`Suppression de données corrompues dans localStorage: ${key} = ${value}`);
          localStorage.removeItem(key);
        }
      }
    });
  },

  /**
   * Obtient le nom d'affichage de l'utilisateur
   * @param {Object} user - L'utilisateur
   * @param {string} type - 'employer' ou 'freelancer'
   * @returns {string} Le nom à afficher
   */
  getDisplayName: (user, type = 'employer') => {
    if (!user) return 'Utilisateur';

    if (type === 'employer') {
      return user.denomination || 'Mon Recruteur';
    } else {
      return `${user.prenom || ''} ${user.nom || ''}`.trim() || 'Utilisateur';
    }
  },

  /**
   * Synchronise les images de profil depuis le backend vers le localStorage
   * À appeler après avoir récupéré un profil depuis l'API
   * @param {Object} user - L'utilisateur récupéré depuis le backend
   * @returns {Object} L'utilisateur avec les images synchronisées
   */
  syncProfileImages: (user) => {
    if (!user || !user.id) return user;

    // Synchroniser la photo de profil
    if (user.photo_profil) {
      localStorage.setItem(`profileImage_${user.id}`, user.photo_profil);
    }

    // Synchroniser l'image de couverture
    if (user.image_couverture) {
      localStorage.setItem(`coverImage_${user.id}`, user.image_couverture);
    }

    return user;
  }
};

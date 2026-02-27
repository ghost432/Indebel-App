// Utilitaire pour déboguer le token JWT
export const debugToken = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.log('❌ Aucun token trouvé dans localStorage');
    return null;
  }

  console.log('✅ Token trouvé:', token.substring(0, 20) + '...');

  try {
    // Décoder le token (partie payload)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const decoded = JSON.parse(jsonPayload);
    console.log('📄 Token décodé:', decoded);

    // Vérifier l'expiration
    if (decoded.exp) {
      const expirationDate = new Date(decoded.exp * 1000);
      const now = new Date();
      const isExpired = now > expirationDate;

      console.log('⏰ Date expiration:', expirationDate.toLocaleString());
      console.log('⏰ Date actuelle:', now.toLocaleString());
      
      if (isExpired) {
        console.log('❌ Token EXPIRÉ depuis', Math.floor((now - expirationDate) / 1000 / 60), 'minutes');
        return { ...decoded, expired: true };
      } else {
        const remainingMinutes = Math.floor((expirationDate - now) / 1000 / 60);
        console.log(`✅ Token valide encore ${remainingMinutes} minutes`);
        return { ...decoded, expired: false };
      }
    }

    return decoded;
  } catch (error) {
    console.error('❌ Erreur décodage token:', error);
    return null;
  }
};

// Fonction pour forcer la reconnexion
export const forceReLogin = () => {
  console.log('🔄 Nettoyage du localStorage et redirection...');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// Ajouter au window pour utilisation dans la console
if (typeof window !== 'undefined') {
  window.debugToken = debugToken;
  window.forceReLogin = forceReLogin;
}

export default { debugToken, forceReLogin };

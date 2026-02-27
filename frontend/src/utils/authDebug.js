// Outil de debug pour l'authentification

export const debugAuth = () => {
  console.log('\n=== DEBUG AUTHENTIFICATION ===');
  
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('Token présent:', !!token);
  console.log('User présent:', !!user);
  
  if (token) {
    try {
      // Décoder le token
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        console.log('Token payload:', payload);
        
        const exp = payload.exp * 1000;
        const now = Date.now();
        const remaining = exp - now;
        
        console.log('Expire dans:', Math.floor(remaining / 1000 / 60), 'minutes');
        console.log('Token valide:', remaining > 0);
      }
    } catch (e) {
      console.error('Erreur décodage token:', e.message);
    }
  }
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log('User data:', userData);
    } catch (e) {
      console.error('Erreur parsing user:', e.message);
    }
  }
  
  console.log('=== FIN DEBUG ===\n');
};

// Rendre disponible globalement
if (typeof window !== 'undefined') {
  window.debugAuth = debugAuth;
}

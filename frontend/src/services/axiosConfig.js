import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Créer une instance axios personnalisée
const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Intercepteur de requête pour ajouter le token
axiosInstance.interceptors.request.use(
  (config) => {
    // Essayer localStorage d'abord, puis sessionStorage comme fallback
    let token = localStorage.getItem('token');
    if (!token) {
      token = sessionStorage.getItem('token');
      if (token) {
        console.log('🔄 Token récupéré depuis sessionStorage (fallback)');
      }
    }

    // Vérifier que le token n'est pas la chaîne 'null' ou invalide
    const isValidToken = token && token !== 'null' && token !== 'undefined' && token.length > 10;

    // Log détaillé pour TOUTES les requêtes pendant le débogage
    console.log('📡 Request interceptor:', {
      url: config.url,
      hasToken: !!token,
      tokenType: typeof token,
      tokenValue: token ? (token.substring(0, 20) + '...') : 'null',
      tokenLength: token?.length,
      isValidToken
    });

    // Console réduite pour développement
    if (!isValidToken && token) {
      console.log('📤 Request avec token invalide:', { url: config.url, tokenPreview: token, tokenLength: token?.length });
    }

    if (isValidToken) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Authorization header ajouté pour:', config.url);
    } else if (token && (token === 'null' || token === 'undefined' || token.length < 10)) {
      // Nettoyer seulement les tokens clairement invalides
      localStorage.removeItem('token');
      console.log('🧹 Token clairement invalide supprimé:', token);
    } else if (config.url !== 'auth/login') {
      console.warn('⚠️ Aucun token valide trouvé pour:', config.url);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Variable pour éviter les redirections multiples
let isRedirecting = false;
let justLoggedIn = false;

// Fonction pour marquer qu'on vient de se connecter
export const markJustLoggedIn = () => {
  justLoggedIn = true;
  console.log('🔓 Protection 401 activée pour 10 secondes');
  setTimeout(() => {
    justLoggedIn = false;
    console.log('✅ Protection 401 désactivée');
  }, 10000);
};

// Intercepteur de réponse pour gérer les erreurs 401
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const requestUrl = error.config?.url || '';

      console.log('🔴 Erreur 401 détectée:', {
        path: currentPath,
        url: requestUrl,
        justLoggedIn,
        token: !!localStorage.getItem('token')
      });

      // Si on vient de se connecter, IGNORER tous les 401 pendant 5 secondes
      if (justLoggedIn) {
        console.log('⚠️ Erreur 401 ignorée (vient de se connecter)');
        return Promise.reject(error);
      }

      // Pages où on ignore les erreurs 401
      const ignorePaths = ['/login', '/register', '/verify-otp', '/forgot-password', '/reset-password'];
      const shouldIgnorePath = ignorePaths.some(path => currentPath.includes(path));

      // Endpoints d'authentification où on ignore les erreurs 401
      // Note: /auth/me retiré pour permettre la déconnexion automatique si token invalide
      const ignoreEndpoints = ['/auth/login', '/auth/register', '/auth/verify-otp', '/support/unread-count', '/label/', '/auth/me'];
      const shouldIgnoreEndpoint = ignoreEndpoints.some(endpoint => requestUrl.includes(endpoint));

      if (shouldIgnorePath || shouldIgnoreEndpoint) {
        console.log('⚠️ Erreur 401 ignorée (page/endpoint ignoré)');
        return Promise.reject(error);
      }

      // Éviter les redirections multiples
      if (!isRedirecting) {
        isRedirecting = true;

        console.log('⚠️ Déconnexion forcée');

        // Nettoyer seulement les données d'authentification
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Toast simple
        toast.error('Session expirée. Veuillez vous reconnecter.');

        // Rediriger vers login
        setTimeout(() => {
          isRedirecting = false;
          window.location.href = '/login';
        }, 1000);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

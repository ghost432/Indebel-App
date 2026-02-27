import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

const TokenValidator = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Ne pas vérifier sur les pages publiques
    const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/'];
    const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path));
    
    if (isPublicPath) return;

    const token = localStorage.getItem('token');
    
    if (!token) {
      // Pas de token, rediriger vers login
      if (!location.pathname.includes('/login')) {
        navigate('/login');
      }
      return;
    }

    // Décoder le token
    const decoded = decodeToken(token);
    
    if (!decoded) {
      // Token malformé
      console.log('❌ Token malformé, nettoyage...');
      localStorage.clear();
      toast.error('Session invalide. Veuillez vous reconnecter.');
      navigate('/login');
      return;
    }

    const currentTime = Date.now() / 1000;

    if (decoded.exp && decoded.exp < currentTime) {
      // Token expiré
      console.log('❌ Token expiré, nettoyage...');
      localStorage.clear();
      toast.error('Votre session a expiré. Veuillez vous reconnecter.');
      navigate('/login');
    }
  }, [location.pathname, navigate]);

  return children;
};

export default TokenValidator;

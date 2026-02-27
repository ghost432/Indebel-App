import { useEffect } from 'react';
import toast from 'react-hot-toast';

const NetworkStatus = () => {
  useEffect(() => {
    let toastId = null;

    const handleOnline = () => {
      // Fermer le toast de déconnexion s'il existe
      if (toastId) {
        toast.dismiss(toastId);
        toastId = null;
      }
      
      // Afficher le toast de reconnexion
      toast.success('✅ Connexion internet rétablie', {
        duration: 3000,
        position: 'bottom-center',
        style: {
          background: '#10B981',
          color: '#fff',
          fontWeight: '500',
          padding: '16px',
          borderRadius: '8px',
        },
        icon: '🌐',
      });
    };

    const handleOffline = () => {
      // Afficher le toast de déconnexion (persistant)
      toastId = toast.error('❌ Connexion internet perdue', {
        duration: Infinity, // Le toast reste jusqu'à reconnexion
        position: 'bottom-center',
        style: {
          background: '#EF4444',
          color: '#fff',
          fontWeight: '500',
          padding: '16px',
          borderRadius: '8px',
        },
        icon: '📡',
      });
    };

    // Vérifier l'état initial
    if (!navigator.onLine) {
      handleOffline();
    }

    // Écouter les événements de connexion
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Nettoyage
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (toastId) {
        toast.dismiss(toastId);
      }
    };
  }, []);

  return null; // Ce composant n'affiche rien, il gère juste les toasts
};

export default NetworkStatus;

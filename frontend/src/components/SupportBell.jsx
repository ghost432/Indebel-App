import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../services/axiosConfig';

const SupportBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Ne charger que si l'utilisateur est connecté
    if (!user) return;
    
    // Attendre 6 secondes après la connexion (après la période de protection des 401)
    const initialTimer = setTimeout(() => {
      console.log('🔔 SupportBell: Chargement du compteur...');
      fetchUnreadCount();
    }, 6000);
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      if (!user) return;

      const response = await axiosInstance.get('/support/unread-count');

      if (response.data.success) {
        setUnreadCount(response.data.data.unreadCount);
      }
    } catch (error) {
      // L'intercepteur axios gère automatiquement les erreurs 401
      // On ignore silencieusement les autres erreurs ici
    }
  };

  const handleClick = () => {
    // Naviguer vers la page support selon le rôle
    if (user?.role === 'admin') {
      navigate('/admin/support');
    } else if (user?.role === 'employer') {
      navigate('/employer/support');
    } else if (user?.role === 'freelancer') {
      navigate('/freelancer/support');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      aria-label="Support"
    >
      <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[20px]">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default SupportBell;

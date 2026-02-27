import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const useForfaitCheck = () => {
  const { user } = useAuth();
  const [forfaitExpired, setForfaitExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [forfaitInfo, setForfaitInfo] = useState(null);

  useEffect(() => {
    checkForfaitStatus();
  }, [user?.id]);

  const checkForfaitStatus = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/forfaits/me/status');
      
      if (response.data.success) {
        setForfaitExpired(response.data.expired);
        setForfaitInfo(response.data.forfait);
      }
    } catch (error) {
      console.error('Erreur vérification forfait:', error);
      // En cas d'erreur, considérer comme non expiré pour ne pas bloquer
      setForfaitExpired(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    forfaitExpired,
    forfaitInfo,
    loading,
    recheckForfait: checkForfaitStatus
  };
};

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import labelService from '../services/labelService';

const useLabelCheck = () => {
  const { user } = useAuth();
  const [showLabelPopup, setShowLabelPopup] = useState(false);
  const [demandeLabelEnAttente, setDemandeLabelEnAttente] = useState(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!user || hasChecked) return;

    // Vérifier uniquement pour freelancer et employer
    if (user.role !== 'freelancer' && user.role !== 'employer') {
      setHasChecked(true);
      return;
    }

    // Attendre 6 secondes après la connexion (après la période de protection des 401)
    const timer = setTimeout(() => {
      console.log('🏷️ LabelCheck: Vérification de l\'éligibilité...');
      checkLabelEligibility();
    }, 6000);

    return () => clearTimeout(timer);
  }, [user]);

  const checkLabelEligibility = async () => {
    try {
      // 1. Vérifier s'il y a déjà une demande en attente
      const demandeResponse = await labelService.getDemandeEnAttente();
      
      if (demandeResponse.data.hasDemandeEnAttente) {
        setDemandeLabelEnAttente(demandeResponse.data.demande);
        setShowLabelPopup(true);
        setHasChecked(true);
        return;
      }

      // 2. Vérifier s'il a déjà le label
      const statutResponse = await labelService.getStatutLabel();
      if (statutResponse.data.hasLabel) {
        setHasChecked(true);
        return;
      }

      // 3. Vérifier les critères
      const criteresResponse = await labelService.verifierCriteres();
      
      if (criteresResponse.data.criteresRemplis) {
        // L'utilisateur remplit les critères, créer automatiquement la demande
        await labelService.demanderLabel(null, false);
        
        // Recharger la demande
        const newDemandeResponse = await labelService.getDemandeEnAttente();
        if (newDemandeResponse.data.hasDemandeEnAttente) {
          setDemandeLabelEnAttente(newDemandeResponse.data.demande);
          setShowLabelPopup(true);
        }
      }

      setHasChecked(true);
    } catch (error) {
      console.error('Erreur vérification label:', error);
      setHasChecked(true);
    }
  };

  const closePopup = () => {
    setShowLabelPopup(false);
    setDemandeLabelEnAttente(null);
  };

  const handleAccept = () => {
    // Rafraîchir après acceptation
    setShowLabelPopup(false);
    setDemandeLabelEnAttente(null);
  };

  return {
    showLabelPopup,
    demandeLabelEnAttente,
    closePopup,
    handleAccept
  };
};

export default useLabelCheck;

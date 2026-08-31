import { AlertTriangle, CreditCard, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import Modal from './Modal';

const ForfaitExpiredModal = ({ isOpen, onClose, action = 'cette action' }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const creditsUrl = user?.role === 'employer' 
    ? '/employer/credits' 
    : '/freelancer/credits';

  const actionMessage = {
    'publier_mission': 'publier une nouvelle mission',
    'postuler_mission': 'postuler à cette mission',
    'candidature': 'envoyer votre candidature',
    'default': action
  };

  const handleGoToCredits = () => {
    onClose();
    navigate(creditsUrl);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center py-6">
        {/* Icône d'alerte */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-4">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
        </div>

        {/* Titre */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Solde de crédits insuffisant
        </h3>

        {/* Message */}
        <p className="text-slate-800 font-medium mb-6">
          Votre solde de crédits est insuffisant pour {actionMessage[action] || actionMessage.default}. 
          Veuillez recharger votre compte de crédits pour continuer.
        </p>

        {/* Avantages du crédit */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <h4 className="font-bold text-blue-950 mb-2 flex items-center">
            <CreditCard className="h-4 w-4 mr-2 text-primary-600" />
            Solde actuel : <span className="ml-1 font-black text-primary-700">{user?.solde_credits || 0} crédit(s)</span>
          </h4>
          <ul className="space-y-1 text-sm text-blue-900 font-semibold">
            {user?.role === 'employer' ? (
              <>
                <li>✓ Publier des offres de mission</li>
                <li>✓ Recevoir et débloquer des devis qualifiés</li>
                <li>✓ Accéder aux coordonnées des prestataires</li>
              </>
            ) : (
              <>
                <li>✓ Postuler aux missions disponibles</li>
                <li>✓ Rédiger et envoyer des devis manuels ou IA</li>
                <li>✓ Consulter les opportunités des recruteurs</li>
              </>
            )}
          </ul>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={onClose}
            className="order-2 sm:order-1"
          >
            <X className="h-4 w-4 mr-2" />
            Fermer
          </Button>
          
          <Button
            onClick={handleGoToCredits}
            className="order-1 sm:order-2 bg-primary-600 hover:bg-primary-700 text-white"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Recharger mes crédits
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ForfaitExpiredModal;

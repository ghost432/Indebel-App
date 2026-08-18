import { AlertTriangle, CreditCard, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import Modal from './Modal';

const ForfaitExpiredModal = ({ isOpen, onClose, action = 'cette action' }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const forfaitUrl = user?.role === 'employer' 
    ? '/employer/forfaits' 
    : '/freelancer/forfaits';

  const actionMessage = {
    'publier_mission': 'publier une nouvelle mission',
    'postuler_mission': 'postuler à cette mission',
    'candidature': 'envoyer votre candidature',
    'default': action
  };

  const handleGoToForfaits = () => {
    onClose();
    navigate(forfaitUrl);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center py-6">
        {/* Icône d'alerte */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>

        {/* Titre */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Forfait expiré
        </h3>

        {/* Message */}
        <p className="text-slate-800 font-medium mb-6">
          Votre forfait a expiré. Pour {actionMessage[action] || actionMessage.default}, 
          vous devez souscrire à un nouveau forfait.
        </p>

        {/* Avantages du forfait */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <h4 className="font-bold text-blue-950 mb-2 flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Avec un forfait actif, vous pouvez :
          </h4>
          <ul className="space-y-1 text-sm text-blue-900 font-semibold">
            {user?.role === 'employer' ? (
              <>
                <li>✓ Publier des missions illimitées</li>
                <li>✓ Recevoir des candidatures qualifiées</li>
                <li>✓ Accéder aux profils des freelancers</li>
                <li>✓ Bénéficier d'un support prioritaire</li>
              </>
            ) : (
              <>
                <li>✓ Postuler à toutes les missions</li>
                <li>✓ Profil mis en avant</li>
                <li>✓ Badge premium</li>
                <li>✓ Statistiques avancées</li>
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
            Annuler
          </Button>
          
          <Button
            onClick={handleGoToForfaits}
            className="order-1 sm:order-2"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Voir les forfaits
          </Button>
        </div>

        {/* Note */}
        <p className="text-xs text-slate-700 font-bold mt-4">
          Choisissez le forfait qui vous convient le mieux et reprenez vos activités immédiatement.
        </p>
      </div>
    </Modal>
  );
};

export default ForfaitExpiredModal;

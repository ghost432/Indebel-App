import { useState } from 'react';
import { X, Award, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import labelService from '../services/labelService';

const LabelPopup = ({ demande, onClose, onAccept }) => {
  const [loading, setLoading] = useState(false);

  const handleResponse = async (accepte) => {
    try {
      setLoading(true);
      await labelService.repondreLabel(demande.id, accepte);
      
      if (accepte) {
        toast.success('🏆 Label Indebel accepté ! Il apparaît maintenant sur votre profil.');
        onAccept && onAccept();
      } else {
        toast.info('Demande de label refusée');
      }
      
      onClose();
    } catch (error) {
      console.error('Erreur réponse label:', error);
      toast.error(error.message || 'Erreur lors de la réponse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white relative">
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex flex-col items-center">
            <div className="bg-white bg-opacity-20 rounded-full p-4 mb-4">
              <Award className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-center">Label Indebel</h2>
            <p className="text-blue-100 text-sm mt-2 text-center">
              Certification de Professionnalisme
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Félicitations ! 🎉
            </h3>
            <p className="text-gray-600 mb-4">
              Vous êtes éligible pour recevoir le <strong>Label Indebel</strong>.
            </p>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Critères remplis :
              </h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span>Profil professionnel complet à 100%</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span>Forfait Standard ou Pro actif</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span>Au moins 3 évaluations positives</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Avantages du label :</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Badge visible sur votre profil</li>
                <li>• Meilleure visibilité auprès des recruteurs</li>
                <li>• Gage de confiance et de professionnalisme</li>
                <li>• Priorité dans les recherches</li>
              </ul>
            </div>
          </div>

          <p className="text-gray-600 text-sm mb-6">
            Souhaitez-vous accepter le Label Indebel ?
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => handleResponse(false)}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Non, merci
            </button>
            <button
              onClick={() => handleResponse(true)}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <Award className="h-5 w-5 mr-2" />
                  Oui, j'accepte !
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelPopup;

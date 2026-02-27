import { useState, useEffect } from 'react';
import { Award, CheckCircle, XCircle, Clock, FileText, Send, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import labelService from '../services/labelService';

const LabelStatus = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [eligibilityStatus, setEligibilityStatus] = useState(null);
  const [labelStatus, setLabelStatus] = useState(null);
  const [showCharterModal, setShowCharterModal] = useState(false);
  const [acceptingLabel, setAcceptingLabel] = useState(false);

  useEffect(() => {
    if (user) {
      checkEligibilityAndStatus();
    }
  }, [user]);

  const checkEligibilityAndStatus = async () => {
    try {
      setLoading(true);
      
      // Vérifier l'éligibilité
      const eligibilityResponse = await labelService.verifierCriteres();
      setEligibilityStatus(eligibilityResponse.data);
      
      // Vérifier le statut actuel du label
      const statusResponse = await labelService.getStatutLabel();
      setLabelStatus(statusResponse.data);
      
    } catch (error) {
      console.error('Erreur vérification:', error);
      toast.error('Erreur lors de la vérification du statut');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptLabel = () => {
    setShowCharterModal(true);
  };

  const handleCharterSubmit = async () => {
    try {
      setAcceptingLabel(true);
      
      if (labelStatus.labelEnAttente) {
        // Accepter le label existant
        await labelService.repondreLabel(labelStatus.labelEnAttente.id, true);
      } else {
        // Faire une nouvelle demande
        await labelService.demanderLabel();
      }
      
      toast.success('Label accepté ! Vous recevrez une confirmation par email.');
      setShowCharterModal(false);
      checkEligibilityAndStatus(); // Rafraîchir les données
      
    } catch (error) {
      console.error('Erreur acceptation label:', error);
      toast.error(error.message || 'Erreur lors de l\'acceptation du label');
    } finally {
      setAcceptingLabel(false);
    }
  };

  const handleExceptionalRequest = async () => {
    try {
      await labelService.demanderLabel(null, false);
      toast.success('Demande exceptionnelle envoyée aux administrateurs');
    } catch (error) {
      console.error('Erreur demande exceptionnelle:', error);
      toast.error('Erreur lors de l\'envoi de la demande');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
            <Award className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Label Indebel</h1>
          <p className="text-gray-600">Vérifiez votre éligibilité et obtenez votre certification d'excellence</p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          {/* Current Status */}
          {labelStatus?.labelAccepte ? (
            // Label déjà accepté
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Label Indebel Actif</h2>
              <p className="text-gray-600 mb-4">
                Félicitations ! Vous possédez le Label Indebel depuis le{' '}
                {new Date(labelStatus.labelAccepte.date_attribution).toLocaleDateString('fr-FR')}
              </p>
              <div className="flex justify-center">
                <button
                  onClick={async () => {
                    try {
                      await labelService.downloadLabelImage();
                      toast.success('Image du label téléchargée');
                    } catch (error) {
                      toast.error('Erreur lors du téléchargement');
                    }
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Award className="h-5 w-5 mr-2" />
                  Télécharger le Label
                </button>
              </div>
            </div>
          ) : labelStatus?.labelEnAttente ? (
            // Label en attente
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-10 w-10 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Demande en Attente</h2>
              <p className="text-gray-600 mb-4">
                Votre demande de Label Indebel est en cours de traitement.
              </p>
              <p className="text-sm text-gray-500">
                Demande soumise le {new Date(labelStatus.labelEnAttente.date_demande).toLocaleDateString('fr-FR')}
              </p>
            </div>
          ) : eligibilityStatus?.eligible ? (
            // Éligible mais pas encore demandé
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🎉 Félicitations !</h2>
              <p className="text-gray-600 mb-6">
                Vous êtes éligible pour recevoir le <strong>Label Indebel</strong> !
              </p>
              
              {/* Critères remplis */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Critères validés :</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {eligibilityStatus.details?.profilComplete && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Profil complété
                    </div>
                  )}
                  {eligibilityStatus.details?.forfaitValide && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Forfait Standard/Pro
                    </div>
                  )}
                  {eligibilityStatus.details?.compteActif && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Compte actif
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleAcceptLabel}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors text-lg font-semibold flex items-center mx-auto"
              >
                <Award className="h-5 w-5 mr-2" />
                Accepter le Label Indebel
              </button>
            </div>
          ) : (
            // Non éligible
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Non Éligible</h2>
              <p className="text-gray-600 mb-6">
                Désolé, vous n'êtes pas encore éligible pour le Label Indebel.
              </p>

              {/* Critères manquants */}
              {eligibilityStatus?.details && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Critères à compléter :</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {!eligibilityStatus.details.profilComplete && (
                      <div className="flex items-center text-red-600">
                        <XCircle className="h-5 w-5 mr-2" />
                        Profil incomplet
                      </div>
                    )}
                    {!eligibilityStatus.details.forfaitValide && (
                      <div className="flex items-center text-red-600">
                        <XCircle className="h-5 w-5 mr-2" />
                        Forfait requis (Standard/Pro)
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => window.location.href = '/freelancer/profile'}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Compléter mon profil
                </button>
                <button
                  onClick={handleExceptionalRequest}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center"
                >
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Demande Exceptionnelle
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Charte */}
        {showCharterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold flex items-center">
                      <FileText className="h-6 w-6 mr-2" />
                      Charte Indebel de Bonne Collaboration
                    </h3>
                    <p className="text-blue-100 text-sm mt-1">
                      Veuillez lire et accepter les conditions du Label Indebel
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCharterModal(false)}
                    className="text-white hover:text-gray-200"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Charter Content */}
              <div className="p-6 overflow-y-auto max-h-96 prose prose-sm max-w-none">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Préambule</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Le Label Indebel récompense les prestataires qui incarnent le professionnalisme et la fiabilité sur la plateforme. Cette charte définit les bonnes pratiques attendues pour garantir une collaboration harmonieuse entre indépendants (prestataires), et entreprises (Recruteurs), et assurer la confiance au sein de la communauté Indebel.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">1. Professionnalisme</h4>
                    <ul className="text-gray-700 text-sm space-y-1">
                      <li>• Chaque prestataire s'engage à fournir un travail de qualité, conforme aux attentes définies avec le client.</li>
                      <li>• Les délais annoncés doivent être respectés, et toute difficulté doit être communiquée rapidement.</li>
                      <li>• Les prestations doivent refléter le niveau de compétence annoncé sur le profil Indebel.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">2. Fiabilité</h4>
                    <ul className="text-gray-700 text-sm space-y-1">
                      <li>• Le prestataire répond aux messages et sollicitations dans un délai raisonnable.</li>
                      <li>• Il honore ses engagements financiers et contractuels.</li>
                      <li>• Il s'engage à gérer les missions avec sérieux, ponctualité et responsabilité.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">3. Transparence</h4>
                    <ul className="text-gray-700 text-sm space-y-1">
                      <li>• Les tarifs et conditions de prestation sont clairement communiqués avant le début de la mission.</li>
                      <li>• Toute modification ou ajustement doit être discuté et validé avec le client.</li>
                      <li>• Les indépendants doivent signaler tout conflit d'intérêts ou situation susceptible d'affecter la mission.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">4. Respect et éthique</h4>
                    <ul className="text-gray-700 text-sm space-y-1">
                      <li>• Le respect mutuel est la base de toute collaboration.</li>
                      <li>• Les échanges doivent rester professionnels, courtois et constructifs, même en cas de désaccord.</li>
                      <li>• Les informations confidentielles des clients ou partenaires doivent être protégées.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">5. Engagement communautaire</h4>
                    <ul className="text-gray-700 text-sm space-y-1">
                      <li>• Les prestataires labellisés contribuent à la bonne réputation de la plateforme Indebel.</li>
                      <li>• Ils partagent leurs expériences et bonnes pratiques pour aider la communauté.</li>
                      <li>• Ils soutiennent la collaboration et l'entraide entre freelances belges.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">6. Innovation et amélioration continue</h4>
                    <ul className="text-gray-700 text-sm space-y-1">
                      <li>• Les prestataires sont encouragés à se former et à actualiser leurs compétences.</li>
                      <li>• Ils participent à l'évolution de la qualité des services proposés via Indebel.</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Signature de l'indépendant (Prestataire)</h4>
                    <p className="text-gray-700 text-sm">
                      Je soussigné(e) <strong>{user?.prenom} {user?.nom}</strong> pour le compte de l'entreprise{' '}
                      <strong>{user?.denomination || 'N/A'}</strong> BCE <strong>{user?.numero_bce || 'N/A'}</strong>{' '}
                      en qualité de <strong>{user?.role === 'freelancer' ? 'Freelancer' : 'Employeur'}</strong>,{' '}
                      m'engage à respecter la présente Charte Indebel de bonne collaboration afin de recevoir et maintenir le Label Indebel – Marque de confiance.
                    </p>
                    <p className="text-gray-600 text-sm mt-2">
                      Date : {new Date().toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    En cliquant sur "Accepter et Signer", vous acceptez les termes de cette charte.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCharterModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleCharterSubmit}
                      disabled={acceptingLabel}
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-colors flex items-center"
                    >
                      {acceptingLabel ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Accepter et Signer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabelStatus;

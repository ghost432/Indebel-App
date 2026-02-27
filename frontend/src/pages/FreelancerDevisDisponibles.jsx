import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, MapPin, Calendar, DollarSign, Clock, Send, Eye, X, Upload, Paperclip, CheckCircle } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import devisSoumisService from '../services/devisSoumisService';

const FreelancerDevisDisponibles = () => {
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);

  /* Removed duplicate inner declaration */
  const [loading, setLoading] = useState(true);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDevisForm, setShowDevisForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [devisForm, setDevisForm] = useState({
    montant: '',
    delai_realisation: '',
    description: '',
    fichiers: []
  });

  useEffect(() => {
    fetchDemandes();
  }, []);

  const fetchDemandes = async () => {
    try {
      setLoading(true);
      const response = await devisSoumisService.getDemandesDisponibles();
      if (response.success) {
        setDemandes(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement demandes:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (demande) => {
    navigate(`/freelancer/devis/${demande.id}`);
  };

  const handleSoumettreDevis = (demande) => {
    // Direct to details page which has the form
    navigate(`/freelancer/devis/${demande.id}`);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);

    if (devisForm.fichiers.length + files.length > 5) {
      toast.error('Vous ne pouvez télécharger que 5 fichiers maximum');
      return;
    }

    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} est trop volumineux (max 10MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setDevisForm(prev => ({
          ...prev,
          fichiers: [...prev.fichiers, { name: file.name, data: reader.result }]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFichier = (index) => {
    setDevisForm(prev => ({
      ...prev,
      fichiers: prev.fichiers.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitDevis = async (e) => {
    e.preventDefault();

    if (!devisForm.montant || !devisForm.delai_realisation || !devisForm.description) {
      toast.error('Tous les champs sont obligatoires');
      return;
    }

    try {
      setSubmitting(true);
      const response = await devisSoumisService.soumettreDevis({
        demande_devis_id: selectedDemande.id,
        montant: parseFloat(devisForm.montant),
        delai_realisation: devisForm.delai_realisation,
        description: devisForm.description,
        fichiers: devisForm.fichiers
      });

      if (response.success) {
        toast.success('Devis soumis avec succès !');
        setShowDevisForm(false);
        setSelectedDemande(null);
        fetchDemandes(); // Rafraîchir la liste
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const getBadgeColor = (nbDevis) => {
    if (nbDevis === 0) return 'bg-green-100 text-green-800';
    if (nbDevis < 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des opportunités...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🎯 Opportunités de devis</h1>
          <p className="mt-2 text-gray-600">
            Consultez les demandes de devis correspondant à votre profil et soumettez vos propositions.
          </p>
        </div>

        {/* Demandes disponibles */}
        {demandes.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Aucune opportunité disponible</h3>
              <p className="mt-2 text-gray-600">
                Il n'y a actuellement aucune demande de devis correspondant à votre profil.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {demandes.map((demande) => (
              <Card key={demande.id} className="hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{demande.type_travaux}</h3>
                    {demande.categorie && (
                      <p className="text-sm text-gray-600">{demande.categorie}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getBadgeColor(demande.nb_devis_soumis)}`}>
                    {demande.nb_devis_soumis}/5 devis
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{demande.ville}, {demande.region}</span>
                  </div>

                  {demande.date_souhaite && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Démarrage : {new Date(demande.date_souhaite).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                  {demande.description}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(demande)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Détails
                  </Button>
                  {demande.deja_soumis ? (
                    <Button
                      size="sm"
                      disabled
                      className="flex-1 bg-green-100 text-green-700 cursor-not-allowed"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Envoyé
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleSoumettreDevis(demande)}
                      className="flex-1"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Soumettre
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal Détails */}
      {showModal && selectedDemande && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedDemande.type_travaux}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Informations générales</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Catégorie:</strong> {selectedDemande.categorie || 'Non spécifiée'}</p>
                    <p><strong>Localisation:</strong> {selectedDemande.ville}, {selectedDemande.region}</p>
                    <p><strong>Urgence:</strong> <span className="capitalize">{selectedDemande.urgence}</span></p>
                    {selectedDemande.budget_estime && (
                      <p><strong>Budget estimé:</strong> {selectedDemande.budget_estime} €</p>
                    )}
                    {selectedDemande.details_complementaires && (
                      <p><strong>Détails:</strong> {selectedDemande.details_complementaires}</p>
                    )}
                    {selectedDemande.date_souhaite && (
                      <p><strong>Date souhaitée:</strong> {new Date(selectedDemande.date_souhaite).toLocaleDateString('fr-FR')}</p>
                    )}
                    {selectedDemande.heure_souhaite && (
                      <p><strong>Heure souhaitée:</strong> {selectedDemande.heure_souhaite}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description du projet</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                    {selectedDemande.description}
                  </p>
                </div>

                {selectedDemande.fichiers_joints && (() => {
                  let fichiers = [];
                  try {
                    const raw = selectedDemande.fichiers_joints;
                    if (Array.isArray(raw)) fichiers = raw;
                    else if (typeof raw === 'string') fichiers = JSON.parse(raw);
                  } catch (e) { fichiers = []; }

                  return fichiers.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Photos / Documents</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {fichiers.map((fichier, idx) => (
                          <div key={idx} className="relative">
                            {(fichier.data && (fichier.data.startsWith('data:image') || fichier.data.match(/\.(jpeg|jpg|gif|png|webp)$/i))) ? (
                              <img
                                src={fichier.data}
                                alt={fichier.name || `Image ${idx + 1}`}
                                className="rounded-lg w-full h-48 object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg border border-gray-200">
                                <Paperclip className="h-5 w-5 text-gray-500" />
                                <span className="text-sm text-gray-700 truncate">
                                  {fichier.name || 'Document'}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="flex-1"
                  >
                    Fermer
                  </Button>
                  {selectedDemande.deja_soumis ? (
                    <Button
                      disabled
                      className="flex-1 bg-green-100 text-green-700 cursor-not-allowed"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Devis déjà envoyé
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setShowModal(false);
                        handleSoumettreDevis(selectedDemande);
                      }}
                      className="flex-1"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Soumettre un devis
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulaire Devis */}
      {showDevisForm && selectedDemande && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Soumettre un devis</h2>
                  <p className="text-gray-600 mt-1">{selectedDemande.type_travaux}</p>
                </div>
                <button
                  onClick={() => setShowDevisForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitDevis} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant proposé (€) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={devisForm.montant}
                    onChange={(e) => setDevisForm({ ...devisForm, montant: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Délai de réalisation *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 2 semaines, 1 mois..."
                    value={devisForm.delai_realisation}
                    onChange={(e) => setDevisForm({ ...devisForm, delai_realisation: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description détaillée de votre offre *
                  </label>
                  <textarea
                    value={devisForm.description}
                    onChange={(e) => setDevisForm({ ...devisForm, description: e.target.value })}
                    rows={6}
                    placeholder="Décrivez en détail ce qui est inclus dans votre devis, les étapes de réalisation, les matériaux utilisés, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Minimum 50 caractères - Soyez précis et professionnel
                  </p>
                </div>

                {/* Upload de fichiers */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Documents, photos ou fichiers (max 5, 10MB chacun)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-500 transition-colors">
                    <input
                      type="file"
                      id="fichiers-upload"
                      accept="image/*,.pdf,.doc,.docx"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="fichiers-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="h-10 w-10 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        Cliquez pour ajouter des fichiers
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        Images, PDF, Word (max 10MB par fichier)
                      </span>
                    </label>
                  </div>

                  {devisForm.fichiers.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {devisForm.fichiers.map((fichier, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200"
                        >
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-700 truncate max-w-xs">
                              {fichier.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFichier(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    ℹ️ <strong>Important:</strong> Votre devis sera envoyé par email au client.
                    Seuls les 5 premiers devis seront acceptés pour cette demande.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDevisForm(false)}
                    className="flex-1"
                    disabled={submitting}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={submitting}
                  >
                    {submitting ? (
                      'Envoi en cours...'
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Envoyer le devis
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreelancerDevisDisponibles;

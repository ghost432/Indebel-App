import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, DollarSign, Eye, X, FileText, ArrowLeft, LogIn, Send } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import PublicHeader from '../components/PublicHeader';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import devisService from '../services/devisService';

const DevisPubliques = () => {
  const [devis, setDevis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    document.title = 'Devis Disponibles - Indebel';
    fetchDevis();
  }, [pagination.page]);

  const fetchDevis = async () => {
    try {
      setLoading(true);
      const response = await devisService.getDevisValides(pagination.page, pagination.limit);
      if (response.success) {
        setDevis(response.data);
        setPagination(prev => ({
          ...prev,
          ...response.pagination
        }));
      }
    } catch (error) {
      console.error('Erreur chargement devis:', error);
      toast.error('Erreur lors du chargement des devis');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer le devis depuis l'URL
  const detailsParam = searchParams.get('details');
  const selectedDevis = devis.find(d =>
    d.titre?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === detailsParam ||
    d.id?.toString() === detailsParam
  );

  const handleViewDetails = (devisItem) => {
    const devisSlug = devisItem.titre?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || devisItem.id;
    setSearchParams({ details: devisSlug });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeDetails = () => {
    setSearchParams({});
  };

  const handleSoumettre = () => {
    if (!user) {
      toast.error('Vous devez être connecté pour soumettre un devis');
      navigate('/login', { state: { from: `/devis?details=${searchParams.get('details')}` } });
      return;
    }
    navigate('/freelancer/devis-disponibles');
    toast.success('Connectez-vous pour voir toutes les demandes et soumettre vos devis');
  };

  const safeJSONParse = (str) => {
    if (!str) return [];
    if (typeof str !== 'string') return [];
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifiée';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatBudget = (budget) => {
    if (!budget) return 'Non communiqué';
    return `${parseInt(budget).toLocaleString('fr-FR')} €`;
  };

  const getUrgenceBadge = (urgence) => {
    const styles = {
      normal: 'bg-gray-100 text-gray-800',
      urgent: 'bg-orange-100 text-orange-800',
      tres_urgent: 'bg-red-100 text-red-800'
    };
    const labels = {
      normal: 'Normal',
      urgent: 'Urgent',
      tres_urgent: 'Très urgent'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[urgence] || styles.normal}`}>
        {labels[urgence] || urgence}
      </span>
    );
  };

  if (loading && devis.length === 0) {
    return (
      <>
        <PublicHeader />
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des devis...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Si un devis est sélectionné, afficher les détails
  if (selectedDevis) {
    return (
      <>
        <PublicHeader />
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Bouton retour */}
            <Button variant="outline" onClick={closeDetails} className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux devis
            </Button>

            <Card>
              <div className="p-8 space-y-6">
                {/* En-tête */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedDevis.type_travaux}</h1>
                  <div className="flex flex-wrap gap-2">
                    {selectedDevis.categorie && (
                      <span className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full font-medium">
                        {selectedDevis.categorie}
                      </span>
                    )}
                    {getUrgenceBadge(selectedDevis.urgence)}
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-semibold">
                      {selectedDevis.nb_devis_soumis || 0}/5 devis soumis
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">📝 Description du projet</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedDevis.description}</p>
                </div>

                {/* Informations principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Localisation</label>
                    <p className="text-gray-900 flex items-center mt-1">
                      <MapPin className="w-4 h-4 mr-2" />
                      {selectedDevis.ville}, {selectedDevis.region}
                    </p>
                  </div>
                  {selectedDevis.date_souhaite && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date de début souhaitée</label>
                      <p className="text-gray-900 flex items-center mt-1">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(selectedDevis.date_souhaite)}
                      </p>
                    </div>
                  )}
                  {selectedDevis.delai_realisation && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Délai de réalisation</label>
                      <p className="text-gray-900 flex items-center mt-1">
                        <Clock className="w-4 h-4 mr-2" />
                        {selectedDevis.delai_realisation}
                      </p>
                    </div>
                  )}
                </div>

                {/* Informations complémentaires */}
                {selectedDevis.informations_complementaires && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">ℹ️ Informations complémentaires</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedDevis.informations_complementaires}</p>
                  </div>
                )}
                {/* Images du projet */}
                {selectedDevis.fichiers_joints && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">📷 Photos du projet</h3>
                    {(() => {
                      let images = [];
                      try {
                        const raw = selectedDevis.fichiers_joints;
                        if (Array.isArray(raw)) images = raw;
                        else if (typeof raw === 'string') images = JSON.parse(raw);
                      } catch (e) { images = []; }

                      if (images.length === 0) return null;

                      return (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {images.map((img, idx) => {
                            if (img.data && (img.data.startsWith('data:image') || img.data.match(/\.(jpeg|jpg|gif|png|webp)$/i))) {
                              return (
                                <img
                                  key={idx}
                                  src={img.data}
                                  alt={img.name || `Photo ${idx + 1}`}
                                  className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                  onClick={() => window.open(img.data, '_blank')}
                                />
                              );
                            }
                            return (
                              <div key={idx} className="w-full h-48 bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center justify-center p-4 text-gray-500">
                                <FileText className="w-8 h-8 mb-2" />
                                <span className="text-xs text-center truncate w-full">{img.name || 'Fichier'}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Client */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">👤 Client</h3>
                  <p className="text-gray-700">{selectedDevis.nom_client} {selectedDevis.prenom_client}</p>
                </div>

                {/* Bouton soumettre */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={closeDetails} className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                  </Button>
                  <Button variant="primary" onClick={handleSoumettre} className="flex-1">
                    {user ? (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Soumettre mon devis
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Se connecter pour soumettre
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PublicHeader />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* En-tête */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Devis Disponibles
            </h1>
            <p className="text-xl text-gray-600">
              Consultez les projets en recherche de professionnels qualifiés
            </p>
            {pagination.total > 0 && (
              <p className="mt-2 text-sm text-gray-500">
                {pagination.total} projet{pagination.total > 1 ? 's' : ''} disponible{pagination.total > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Liste des devis */}
          {devis.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600">Aucun devis disponible pour le moment</p>
                <p className="text-sm text-gray-500 mt-2">Revenez plus tard pour découvrir de nouveaux projets</p>
              </div>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {devis.map((devisItem) => (
                  <Card key={devisItem.id} className="hover:shadow-xl transition-shadow duration-300">
                    <div className="p-6">
                      {/* En-tête de la carte */}
                      <div className="mb-4">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-bold text-gray-900 flex-1">
                            {devisItem.type_travaux}
                          </h3>
                          {getUrgenceBadge(devisItem.urgence)}
                        </div>

                        <div className="flex items-center gap-2">
                          {devisItem.categorie && (
                            <span className="inline-block px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                              {devisItem.categorie}
                            </span>
                          )}
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-semibold">
                            {devisItem.nb_devis_soumis || 0}/5 devis
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {devisItem.description}
                      </p>

                      {/* Informations */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                          <span className="font-medium">{devisItem.ville}, {devisItem.region}</span>
                        </div>

                        {devisItem.date_souhaite && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span>Date souhaitée: {formatDate(devisItem.date_souhaite)}</span>
                          </div>
                        )}

                        {devisItem.surface_m2 && (
                          <div className="flex items-center text-sm text-gray-600">
                            <FileText className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span>Surface: {devisItem.surface_m2} m²</span>
                          </div>
                        )}
                      </div>

                      {/* Images */}
                      {(() => {
                        let images = [];
                        try {
                          const raw = devisItem.fichiers_joints;
                          if (Array.isArray(raw)) images = raw;
                          else if (typeof raw === 'string') images = JSON.parse(raw);
                        } catch (e) { images = []; }

                        if (images.length > 0) {
                          return (
                            <div className="mb-4">
                              <div className="flex gap-2 overflow-x-auto">
                                {images.slice(0, 3).map((img, idx) => {
                                  if (img.data && (img.data.startsWith('data:image') || img.data.match(/\.(jpeg|jpg|gif|png|webp)$/i))) {
                                    return (
                                      <img
                                        key={idx}
                                        src={img.data}
                                        alt={img.name || `Photo ${idx + 1}`}
                                        className="w-20 h-20 object-cover rounded-lg bg-gray-50 border border-gray-200"
                                      />
                                    );
                                  }
                                  return null;
                                })}
                                {images.length > 3 && (
                                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 text-xs font-medium">
                                    +{images.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Bouton voir détails */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(devisItem)}
                        className="w-full"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Voir les détails
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-8 flex justify-center items-center gap-4">
                  <Button
                    variant="outline"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Précédent
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.page} sur {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DevisPubliques;

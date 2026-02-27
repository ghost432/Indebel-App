import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, DollarSign, Eye, X, Briefcase, Users, ArrowLeft, LogIn } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import PublicHeader from '../components/PublicHeader';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { missionService } from '../services/missionService';

const MissionsPubliques = () => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    document.title = 'Missions Disponibles - Indebel';
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      setLoading(true);
      const response = await missionService.getMissionsPubliques();
      if (response.data.success) {
        setMissions(response.data.data);
      }
    } catch (error) {
      console.error('Erreur chargement missions:', error);
      toast.error('Erreur lors du chargement des missions');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer la mission depuis l'URL
  const detailsParam = searchParams.get('details');
  const selectedMission = missions.find(m => 
    m.titre.toLowerCase().replace(/[^a-z0-9]+/g, '-') === detailsParam
  );

  const handleViewDetails = (mission) => {
    const missionSlug = mission.titre.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setSearchParams({ details: missionSlug });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeDetails = () => {
    setSearchParams({});
  };

  const handlePostuler = () => {
    if (!user) {
      toast.error('Vous devez être connecté pour postuler');
      navigate('/login');
    } else {
      navigate('/freelancer/list-missions');
      toast.success('Redirection vers vos missions');
    }
  };

  const safeJSONParse = (str) => {
    if (!str) return [];
    if (typeof str !== 'string') return [];
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return str.split(',').map(s => s.trim()).filter(Boolean);
    }
  };

  const getUrgenceBadge = (urgente) => {
    return urgente ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        🔥 Urgent
      </span>
    ) : null;
  };

  const getTypeBadge = (missionType) => {
    return missionType === 'hourly' ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        💰 Forfait horaire
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        📋 Forfait fixe
      </span>
    );
  };

  if (loading) {
    return (
      <>
        <PublicHeader />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des missions...</p>
          </div>
        </div>
      </>
    );
  }

  // Si une mission est sélectionnée, afficher les détails
  if (selectedMission) {
    return (
      <>
        <PublicHeader />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Bouton retour */}
            <Button
              variant="outline"
              onClick={closeDetails}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux missions
            </Button>

            <Card>
              <div className="p-8 space-y-6">
                {/* En-tête */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedMission.titre}</h1>
                  <div className="flex flex-wrap gap-2">
                    {getTypeBadge(selectedMission.mission_type)}
                    {getUrgenceBadge(selectedMission.urgente)}
                  </div>
                </div>

                {/* Type et catégorie */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedMission.type_mission && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Type de mission</label>
                      <p className="text-gray-900">{selectedMission.type_mission}</p>
                    </div>
                  )}
                  {selectedMission.categorie && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Catégorie</label>
                      <p className="text-gray-900">{selectedMission.categorie}</p>
                    </div>
                  )}
                </div>

                {/* Rémunération */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">💰 Rémunération</h3>
                  {selectedMission.mission_type === 'hourly' ? (
                    <div>
                      <p className="text-2xl font-bold text-green-600">{selectedMission.forfait_heure}€/h</p>
                      {selectedMission.heures_travail_max && (
                        <p className="text-sm text-gray-600 mt-1">Maximum {selectedMission.heures_travail_max} heures</p>
                      )}
                      {selectedMission.type_facturation && (
                        <p className="text-sm text-gray-600">Type: {selectedMission.type_facturation}</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-2xl font-bold text-green-600">{selectedMission.budget_projet}€</p>
                      <p className="text-sm text-gray-600">Forfait fixe</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">📝 Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedMission.description}</p>
                </div>

                {/* Compétences */}
                {selectedMission.competences && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">🎯 Compétences requises</h3>
                    <div className="flex flex-wrap gap-2">
                      {safeJSONParse(selectedMission.competences).map((comp, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Langues */}
                {selectedMission.langues_parlees && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">🗣️ Langues</h3>
                    <div className="flex flex-wrap gap-2">
                      {safeJSONParse(selectedMission.langues_parlees).map((langue, index) => (
                        <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                          {langue}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Détails pratiques */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedMission.date_debut && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date de début</label>
                      <p className="text-gray-900">{new Date(selectedMission.date_debut).toLocaleDateString('fr-FR')}</p>
                    </div>
                  )}
                  {selectedMission.nombre_independants && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Prestataires recherchés</label>
                      <p className="text-gray-900">{selectedMission.nombre_independants}</p>
                    </div>
                  )}
                  {selectedMission.adresse_mission && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Adresse</label>
                      <p className="text-gray-900">{selectedMission.adresse_mission}</p>
                    </div>
                  )}
                </div>

                {/* Recruteur */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">🏢 Recruteur</h3>
                  <p className="text-gray-700">
                    {selectedMission.denomination || `${selectedMission.prenom} ${selectedMission.nom}`}
                  </p>
                </div>

                {/* Bouton postuler */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={closeDetails} className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                  </Button>
                  <Button variant="primary" onClick={handlePostuler} className="flex-1">
                    {user ? (
                      <>
                        <Briefcase className="w-4 h-4 mr-2" />
                        Postuler à cette mission
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Se connecter pour postuler
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* En-tête */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Missions Disponibles
            </h1>
            <p className="text-xl text-gray-600">
              Découvrez les opportunités de missions pour prestataires
            </p>
            {missions.length > 0 && (
              <p className="mt-2 text-sm text-gray-500">
                {missions.length} mission{missions.length > 1 ? 's' : ''} disponible{missions.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Liste des missions */}
          {missions.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600">Aucune mission disponible pour le moment</p>
                <p className="text-sm text-gray-500 mt-2">Revenez plus tard pour découvrir de nouvelles opportunités</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {missions.map((mission) => (
                <Card key={`${mission.mission_type}-${mission.id}`} className="hover:shadow-xl transition-shadow duration-300">
                  <div className="p-6">
                    {/* En-tête de la carte */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900 flex-1 line-clamp-2">
                          {mission.titre}
                        </h3>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {getTypeBadge(mission.mission_type)}
                        {getUrgenceBadge(mission.urgente)}
                      </div>

                      {mission.categorie && (
                        <p className="text-sm text-gray-600 mb-2">
                          📁 {mission.categorie}
                        </p>
                      )}
                    </div>

                    {/* Informations clés */}
                    <div className="space-y-2 mb-4">
                      {mission.mission_type === 'hourly' && mission.forfait_heure && (
                        <div className="flex items-center text-sm text-gray-700">
                          <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                          <span className="font-semibold">{mission.forfait_heure}€/h</span>
                          {mission.heures_travail_max && (
                            <span className="ml-2 text-gray-500">({mission.heures_travail_max}h max)</span>
                          )}
                        </div>
                      )}

                      {mission.mission_type === 'fixed' && mission.budget_projet && (
                        <div className="flex items-center text-sm text-gray-700">
                          <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                          <span className="font-semibold">{mission.budget_projet}€</span>
                        </div>
                      )}

                      {mission.date_debut && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          Début: {new Date(mission.date_debut).toLocaleDateString('fr-FR')}
                        </div>
                      )}

                      {mission.nombre_independants && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-2" />
                          {mission.nombre_independants} indépendant{mission.nombre_independants > 1 ? 's' : ''} recherché{mission.nombre_independants > 1 ? 's' : ''}
                        </div>
                      )}

                      {mission.lieu_mission && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          {mission.lieu_mission}
                        </div>
                      )}
                    </div>

                    {/* Description courte */}
                    {mission.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {mission.description}
                      </p>
                    )}

                    {/* Employeur */}
                    {(mission.denomination || mission.prenom) && (
                      <p className="text-xs text-gray-500 mb-4">
                        Par: {mission.denomination || `${mission.prenom} ${mission.nom}`}
                      </p>
                    )}

                    {/* Bouton d'action */}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleViewDetails(mission)}
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Voir les détails
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MissionsPubliques;

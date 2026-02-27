import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { missionService } from '../services/missionService';
import { demandeService } from '../services/demandeService';
import Card from '../components/Card';
import Button from '../components/Button';
import { Briefcase, MapPin, Calendar, Euro, Eye, Send, ArrowLeft, Clock, Building2, Users, Languages, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const FreelancerMissions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const missionParam = searchParams.get('mission');

  const [missions, setMissions] = useState([]);
  const [filteredMissions, setFilteredMissions] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [ignoredMissions, setIgnoredMissions] = useState([]);
  const [appliedMissions, setAppliedMissions] = useState([]);

  // États des filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, hourly, fixed
  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
    document.title = 'Missions disponibles - Indebel';
    // Charger les missions ignorées depuis localStorage
    const ignored = JSON.parse(localStorage.getItem('ignoredMissions') || '[]');
    setIgnoredMissions(ignored);
    fetchMissions();
    fetchAppliedMissions();
  }, []);

  useEffect(() => {
    filterAndSortMissions();
  }, [missions, searchTerm, typeFilter, sortBy]);

  useEffect(() => {
    if (missionParam && missions.length > 0 && !selectedMission) {
      const mission = missions.find(m => {
        const slug = m.titre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        return slug === missionParam.toLowerCase().replace(/[^a-z0-9-]/g, '');
      });
      if (mission) {
        setSelectedMission(mission);
        checkIfApplied(mission);
      }
    } else if (!missionParam) {
      setSelectedMission(null);
      setHasApplied(false);
    }
  }, [missionParam, missions, selectedMission]);

  const fetchMissions = async () => {
    try {
      const response = await missionService.getAllMissions();
      const missionsData = response.data.data || [];
      // Filtrer uniquement les missions ouvertes et non ignorées
      const ignored = JSON.parse(localStorage.getItem('ignoredMissions') || '[]');
      const openMissions = missionsData.filter(m =>
        m.statut === 'ouvert' && !ignored.includes(m.id)
      );
      // Trier les missions: urgentes en premier
      const sortedMissions = openMissions.sort((a, b) => {
        if (a.urgente && !b.urgente) return -1;
        if (!a.urgente && b.urgente) return 1;
        return new Date(b.date_creation) - new Date(a.date_creation);
      });
      setMissions(sortedMissions);
    } catch (err) {
      console.error('Erreur lors du chargement des missions:', err);
      toast.error('Erreur lors du chargement des missions');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortMissions = () => {
    let filtered = [...missions];

    // Filtre par recherche (mot-clé)
    if (searchTerm) {
      filtered = filtered.filter(m =>
        m.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.denomination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.categorie?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par type de forfait
    if (typeFilter !== 'all') {
      filtered = filtered.filter(m => m.mission_type === typeFilter);
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.date_creation) - new Date(a.date_creation);
        case 'date_asc':
          return new Date(a.date_creation) - new Date(b.date_creation);
        case 'titre_asc':
          return (a.titre || '').localeCompare(b.titre || '');
        case 'titre_desc':
          return (b.titre || '').localeCompare(a.titre || '');
        case 'budget_desc':
          return (b.forfait_mission || b.forfait_heure || 0) - (a.forfait_mission || a.forfait_heure || 0);
        case 'budget_asc':
          return (a.forfait_mission || a.forfait_heure || 0) - (b.forfait_mission || b.forfait_heure || 0);
        default:
          return 0;
      }
    });

    setFilteredMissions(filtered);
  };

  const fetchAppliedMissions = async () => {
    if (!user) return;

    try {
      const response = await demandeService.getFreelancerDemandes();
      const demandes = response.data.data || [];
      const appliedIds = demandes.map(d => `${d.mission_type}-${d.mission_id}`);
      setAppliedMissions(appliedIds);
    } catch (error) {
      console.error('Erreur chargement candidatures:', error);
    }
  };

  const checkIfApplied = async (mission) => {
    if (!user) return;

    try {
      const response = await demandeService.getFreelancerDemandes();
      const demandes = response.data.data || [];
      const missionKey = `${mission.mission_type}-${mission.id}`;
      const hasAlreadyApplied = demandes.some(d => `${d.mission_type}-${d.mission_id}` === missionKey);
      setHasApplied(hasAlreadyApplied);
    } catch (error) {
      console.error('Erreur vérification candidature:', error);
    }
  };

  const handleIgnore = (missionId) => {
    // Ajouter la mission aux missions ignorées
    const ignored = JSON.parse(localStorage.getItem('ignoredMissions') || '[]');
    if (!ignored.includes(missionId)) {
      ignored.push(missionId);
      localStorage.setItem('ignoredMissions', JSON.stringify(ignored));
      setIgnoredMissions(ignored);
      toast.success('Mission ignorée');
      // Retourner à la liste
      navigate('/freelancer/list-missions');
    }
  };

  const handleViewMission = (mission) => {
    const missionSlug = mission.titre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setSelectedMission(mission);
    navigate(`/freelancer/list-missions?mission=${missionSlug}`);
  };

  const handleApply = async (mission, message = '') => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    setApplying(true);
    try {
      await demandeService.createDemande({
        mission_id: mission.id,
        mission_type: mission.mission_type,
        message_freelancer: message
      });
      toast.success('Candidature envoyée avec succès!');
      setHasApplied(true);
      // Ajouter à la liste des missions postulées
      const missionKey = `${mission.mission_type}-${mission.id}`;
      setAppliedMissions([...appliedMissions, missionKey]);
    } catch (error) {
      console.error('Erreur lors de la candidature:', error);
      if (error.response?.status === 400 && error.response?.data?.message?.includes('déjà postulé')) {
        toast.error('Vous avez déjà postulé à cette mission');
        setHasApplied(true);
        const missionKey = `${mission.mission_type}-${mission.id}`;
        if (!appliedMissions.includes(missionKey)) {
          setAppliedMissions([...appliedMissions, missionKey]);
        }
      } else {
        const message = error.response?.data?.message || 'Erreur lors de l\'envoi de la candidature';
        toast.error(message);
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Affichage des détails d'une mission
  if (selectedMission) {
    return (
      <div>
        <Button
          variant="outline"
          onClick={() => navigate('/freelancer/list-missions')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux missions
        </Button>

        <Card>
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedMission.titre}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 mr-1" />
                    {selectedMission.denomination || 'Recruteur'}
                  </div>
                  {selectedMission.localisation && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {selectedMission.localisation}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Publiée le {new Date(selectedMission.date_creation).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Ouvert
              </span>
            </div>

            <div className="space-y-6">
              {/* Informations principales - Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Type de forfait */}
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Type de forfait</h3>
                  <div className="flex items-center">
                    <Briefcase className="h-5 w-5 mr-2 text-primary-600" />
                    <span className="text-base font-medium text-primary-800">
                      {selectedMission.mission_type === 'hourly' ? 'Forfait Horaire' : 'Forfait Fixe'}
                    </span>
                  </div>
                </div>

                {/* Type de mission (jour/nuit) */}
                {selectedMission.type_mission && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Type de mission</h3>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-indigo-600" />
                      <span className="text-base font-medium text-indigo-800">
                        {selectedMission.type_mission === 'jour' ? 'Mission de jour' : 'Mission de nuit'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Type de facturation */}
                {selectedMission.type_facturation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Type de facturation</h3>
                    <div className="flex items-center">
                      <Euro className="h-5 w-5 mr-2 text-blue-600" />
                      <span className="text-base font-medium text-blue-800">
                        {selectedMission.type_facturation === 'jour' ? 'Par jour' :
                          selectedMission.type_facturation === 'semaine' ? 'Par semaine' : 'Par mois'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Catégorie */}
                {selectedMission.categorie && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Catégorie</h3>
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 mr-2 text-purple-600" />
                      <span className="text-base font-medium text-purple-800">
                        {selectedMission.categorie}
                      </span>
                    </div>
                  </div>
                )}

                {/* Nombre d'prestataires */}
                {selectedMission.nombre_independants && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Nombre d'prestataires</h3>
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-orange-600" />
                      <span className="text-base font-medium text-orange-800">
                        {selectedMission.nombre_independants} personne{selectedMission.nombre_independants > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Langues parlées */}
              {selectedMission.langues_parlees && selectedMission.langues_parlees.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Languages className="h-5 w-5 mr-2 text-gray-700" />
                    Langues requises
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(selectedMission.langues_parlees)
                      ? selectedMission.langues_parlees
                      : JSON.parse(selectedMission.langues_parlees || '[]')
                    ).map((langue, index) => (
                      <span key={index} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                        {langue}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Localisation et adresse */}
              {selectedMission.adresse_mission && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-gray-700" />
                    Lieu de la mission
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <span className="text-sm font-medium text-gray-600 w-32">Adresse :</span>
                      <span className="text-sm text-gray-900">{selectedMission.adresse_mission}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-sm font-medium text-gray-600 w-32">Lieu :</span>
                      <span className="text-sm text-gray-900">
                        {selectedMission.lieu_mission === 'site_entreprise' ? 'Sur site' : 'Autre site'}
                      </span>
                    </div>
                    {selectedMission.autre_lieu && selectedMission.lieu_mission === 'autre_site' && (
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-600 w-32">Précision :</span>
                        <span className="text-sm text-gray-900">{selectedMission.autre_lieu}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Date de début */}
              {selectedMission.date_debut && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-gray-700" />
                    Date de début souhaitée
                  </h3>
                  <p className="text-gray-700">
                    {new Date(selectedMission.date_debut).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 whitespace-pre-line">{selectedMission.description}</p>
              </div>

              {selectedMission.competences && selectedMission.competences.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Compétences requises</h3>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(selectedMission.competences)
                      ? selectedMission.competences
                      : JSON.parse(selectedMission.competences || '[]')
                    ).map((competence, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                        {competence}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Informations financières */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedMission.forfait_mission && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Forfait mission</h3>
                    <div className="flex items-center text-gray-700">
                      <Euro className="h-5 w-5 mr-2 text-green-600" />
                      <span className="text-xl font-bold text-green-700">{selectedMission.forfait_mission} €</span>
                    </div>
                  </div>
                )}

                {selectedMission.forfait_heure && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Tarif horaire</h3>
                    <div className="flex items-center text-gray-700">
                      <Clock className="h-5 w-5 mr-2 text-blue-600" />
                      <span className="text-xl font-bold text-blue-700">{selectedMission.forfait_heure} €/h</span>
                    </div>
                  </div>
                )}

                {selectedMission.heures_travail_max && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Heures maximales</h3>
                    <div className="flex items-center text-gray-700">
                      <Clock className="h-5 w-5 mr-2 text-purple-600" />
                      <span className="text-xl font-bold text-purple-700">{selectedMission.heures_travail_max}h</span>
                    </div>
                  </div>
                )}

                {selectedMission.temps_max_estime && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Temps estimé</h3>
                    <div className="flex items-center text-gray-700">
                      <Clock className="h-5 w-5 mr-2 text-purple-600" />
                      <span className="text-xl font-bold text-purple-700">{selectedMission.temps_max_estime}</span>
                    </div>
                  </div>
                )}
              </div>

              {selectedMission.date_fermeture && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Fermeture de la mission</h3>
                  <div className="flex items-center text-gray-700">
                    <Calendar className="h-5 w-5 mr-2 text-red-600" />
                    <span className="font-medium">
                      {new Date(selectedMission.date_fermeture).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      (1 mois après publication)
                    </span>
                  </div>
                  {new Date(selectedMission.date_fermeture) < new Date() ? (
                    <p className="text-sm text-red-600 mt-2">⚠️ Cette mission est expirée</p>
                  ) : (
                    <p className="text-sm text-gray-600 mt-2">
                      ⏱️ {Math.ceil((new Date(selectedMission.date_fermeture) - new Date()) / (1000 * 60 * 60 * 24))} jour(s) restant(s)
                    </p>
                  )}
                </div>
              )}

              {selectedMission.description_livrables && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Livrables attendus</h3>
                  <p className="text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {selectedMission.description_livrables}
                  </p>
                </div>
              )}

              {selectedMission.modalites_paiement && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Modalités de paiement</h3>
                  <p className="text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {selectedMission.modalites_paiement}
                  </p>
                </div>
              )}

              <div className="pt-6 border-t">
                {hasApplied ? (
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center text-green-800">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span className="font-medium">Vous avez déjà postulé à cette mission</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => navigate('/freelancer/applications')}
                      variant="outline"
                      className="w-full md:w-auto"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir votre demande
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row gap-3">
                    <Button
                      onClick={() => handleApply(selectedMission)}
                      loading={applying}
                      className="flex-1 md:flex-initial"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Postuler à cette mission
                    </Button>
                    <Button
                      onClick={() => handleIgnore(selectedMission.id)}
                      className="flex-1 md:flex-initial bg-red-600 hover:bg-red-700 text-white"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Ignorer cette mission
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Affichage de la liste des missions
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Missions disponibles</h1>
      </div>

      {/* Filtres et recherche */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recherche par mot-clé */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par titre, catégorie, recruteur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filtre par type de forfait */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Tous les types</option>
              <option value="hourly">Forfait Horaire</option>
              <option value="fixed">Forfait Fixe</option>
            </select>
          </div>

          {/* Tri */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="date_desc">Plus récentes</option>
              <option value="date_asc">Plus anciennes</option>
              <option value="titre_asc">Titre A-Z</option>
              <option value="titre_desc">Titre Z-A</option>
              <option value="budget_desc">Budget décroissant</option>
              <option value="budget_asc">Budget croissant</option>
            </select>
          </div>
        </div>

        {/* Résumé des filtres */}
        {(searchTerm || typeFilter !== 'all') && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-gray-600">Filtres actifs:</span>
            {searchTerm && (
              <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full">
                "{searchTerm}"
              </span>
            )}
            {typeFilter !== 'all' && (
              <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full">
                {typeFilter === 'hourly' ? 'Forfait Horaire' : 'Forfait Fixe'}
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
              }}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Réinitialiser
            </button>
          </div>
        )}
      </Card>

      {/* Compteur de résultats */}
      {filteredMissions.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          {filteredMissions.length} mission{filteredMissions.length > 1 ? 's' : ''} trouvée{filteredMissions.length > 1 ? 's' : ''}
          {missions.length !== filteredMissions.length && ` sur ${missions.length}`}
        </div>
      )}

      {filteredMissions.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm || typeFilter !== 'all'
                ? 'Aucune mission ne correspond à vos critères de recherche'
                : 'Aucune mission ouverte pour le moment'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {searchTerm || typeFilter !== 'all'
                ? 'Essayez de modifier vos filtres pour voir plus de résultats'
                : 'Revenez plus tard pour découvrir de nouvelles opportunités'}
            </p>
            {(searchTerm || typeFilter !== 'all') && (
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                }}
                variant="outline"
                className="mt-4"
              >
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMissions.map((mission) => (
            <Card key={mission.id} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-2">
                    {mission.titre}
                  </h3>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">
                    Ouvert
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {mission.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Building2 className="h-4 w-4 mr-2" />
                    {mission.denomination || 'Recruteur'}
                  </div>
                  <div className="flex items-center text-sm font-medium">
                    <Briefcase className="h-4 w-4 mr-2 text-primary-600" />
                    <span className="px-2 py-0.5 rounded-full text-xs bg-primary-100 text-primary-800">
                      {mission.mission_type === 'hourly' ? 'Forfait Horaire' : 'Forfait Fixe'}
                    </span>
                  </div>
                  {mission.localisation && (
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-2" />
                      {mission.localisation}
                    </div>
                  )}
                  {mission.budget && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Euro className="h-4 w-4 mr-2" />
                      {mission.budget} €
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(mission.date_creation).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                {appliedMissions.includes(`${mission.mission_type}-${mission.id}`) ? (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => navigate('/freelancer/applications')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Déjà postulé
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleViewMission(mission)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir détails
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FreelancerMissions;
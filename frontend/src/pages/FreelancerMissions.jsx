import { useState, useEffect } from 'react';
import PageLoader from '../components/PageLoader'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { missionService } from '../services/missionService';
import { demandeService } from '../services/demandeService';
import QuotaWidget from '../components/devis/QuotaWidget';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import VerificationPopup from '../components/VerificationPopup';
import { Briefcase, MapPin, Calendar, Euro, Eye, Send, ArrowLeft, Clock, Building2, Users, Languages, CheckCircle, XCircle, Search, Filter, FileText, CheckSquare, CreditCard, Code, Sparkles, AlertTriangle, Bot } from 'lucide-react';
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
  
  // Modal et IA states
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyingMode, setApplyingMode] = useState('manual');
  const [applyMessage, setApplyMessage] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiQuotaReached, setAiQuotaReached] = useState(false);
  const [conditionsGenerales, setConditionsGenerales] = useState('');
  const [includeDisclaimer, setIncludeDisclaimer] = useState(true);
  
  // Quota states
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState(null);
  
  // Verification state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  
  // États des filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, hourly, fixed
  const [sortBy, setSortBy] = useState('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

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
    setCurrentPage(1);
  }, [missions, searchTerm, typeFilter, sortBy]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMissions = filteredMissions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMissions.length / itemsPerPage);

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
      const missionsData = (response.data?.data || response.data) || [];
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
      const demandes = (response.data?.data || response.data) || [];
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
      const demandes = (response.data?.data || response.data) || [];
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

  const handleViewMission = async (mission) => {
    if (user && user.statut_verification === 'non_verifie') {
      setShowVerificationModal(true);
      return;
    }

    try {
      // Vérifier et logger la vue
      const response = await missionService.logView(mission.id, mission.mission_type, 'detail');
      
      const missionSlug = mission.titre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setSelectedMission(mission);
      navigate(`/freelancer/list-missions?mission=${missionSlug}`);
    } catch (error) {
      if (error.response?.status === 403) {
        setQuotaInfo({
          title: 'Limite de vues atteinte',
          message: error.response.data.message || 'Vous avez atteint votre limite de vues de missions.',
          forfait: error.response.data.forfait,
          limit: error.response.data.limit,
          current: error.response.data.viewed_count
        });
        setShowQuotaModal(true);
      } else {
        toast.error('Erreur lors de l\'accès à la mission');
        console.error(error);
      }
    }
  };

  const handleOpenApplyModal = (mission, mode = 'manual') => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }
    setApplyingMode(mode);
    setApplyMessage('');
    setShowApplyModal(true);
  };

  const handleGenerateAi = async () => {
    if (!selectedMission) return;
    
    setIsGeneratingAi(true);
    try {
      const response = await demandeService.generateAi({
        mission_id: selectedMission.id,
        mission_type: selectedMission.mission_type,
        instructions_supplementaires: applyMessage
      });
      
      if (response.data.success) {
        setApplyMessage((response.data?.data || response.data).message_freelancer);
        setApplyingMode('manual'); // Revenir en mode édition pour permettre les modifications
        toast.success('Candidature générée avec succès');
      }
    } catch (error) {
      if (error.response?.status === 403) {
        setAiQuotaReached(true);
        setQuotaInfo({
          title: 'Limite de génération IA atteinte',
          message: error.response.data.message || 'Vous avez atteint votre limite mensuelle de générations IA.',
          forfait: error.response.data.forfait,
          limit: error.response.data.limit,
          current: error.response.data.currentCount
        });
        setShowQuotaModal(true);
        setShowApplyModal(false);
      } else {
        toast.error(error.response?.data?.message || 'Erreur lors de la génération de la candidature par IA');
        console.error(error);
      }
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const submitApplication = async () => {
    handleApply(selectedMission, applyMessage, applyingMode === 'ai');
    setShowApplyModal(false);
  };

  const handleApply = async (mission, message = '', est_genere_par_ia = false) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    let finalMessage = message;
    if (conditionsGenerales) {
      finalMessage += `\n\nConditions Générales / Politique :\n${conditionsGenerales}`;
    }
    if (applyingMode === 'manual' && includeDisclaimer) {
      finalMessage += `\n\nLe montant indiqué est une estimation. Un devis définitif pourra être établi uniquement après une visite sur place, afin d'évaluer précisément les travaux à réaliser.\n\nJe reste à votre disposition pour convenir d'un rendez-vous.`;
    }

    setApplying(true);
    try {
      await demandeService.createDemande({
        mission_id: mission.id,
        mission_type: mission.mission_type,
        message_freelancer: finalMessage,
        est_genere_par_ia
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

    const modals = (
    <>
      <VerificationPopup 
        isOpen={showVerificationModal} 
        onClose={() => setShowVerificationModal(false)} 
      />
      {/* Modal Quota */}
          <Modal isOpen={showQuotaModal} onClose={() => setShowQuotaModal(false)} title={quotaInfo?.title || "Limite atteinte"}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-rose-500" />
              </div>
              <p className="text-gray-700 mb-6">{quotaInfo?.message}</p>
              
              {quotaInfo?.forfait && quotaInfo.forfait !== 'Gratuit' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 text-sm text-left">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-500">Forfait actuel:</span>
                    <span className="font-bold text-slate-800">{quotaInfo.forfait}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Utilisation:</span>
                    <span className="font-bold text-slate-800">{quotaInfo.current} / {quotaInfo.limit}</span>
                  </div>
                </div>
              )}
              
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => setShowQuotaModal(false)}>
                  Fermer
                </Button>
                <Button onClick={() => navigate('/freelancer/forfaits')} className="bg-[#2b4eef] hover:bg-[#1f3bbd] text-white">
                  Voir les forfaits
                </Button>
              </div>
            </div>
          </Modal>
    
          {/* Modal Candidature */}
          <Modal isOpen={showApplyModal} onClose={() => setShowApplyModal(false)} title={`Postuler : ${selectedMission?.titre}`}>
            <div className="p-6">

    
              {applyingMode === 'ai' && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-white p-1.5 rounded-lg shadow-sm border border-indigo-100">
                      <Sparkles className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-indigo-900 mb-1">Assistant IA Indebel</h4>
                      <p className="text-sm text-indigo-700 leading-relaxed mb-4">
                        Notre IA rédigera un message de motivation professionnel basé sur votre profil et les détails de la mission.
                      </p>
                      <textarea
                        value={applyMessage}
                        onChange={(e) => setApplyMessage(e.target.value)}
                        placeholder="Instructions optionnelles (ex: Mettre en avant mes 5 ans d'expérience...)"
                        className="w-full rounded-xl border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500 text-sm mb-4"
                        rows="5"
                      />
                      <Button 
                        onClick={handleGenerateAi}
                        loading={isGeneratingAi}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm flex items-center justify-center"
                      >
                        <Bot className="h-4 w-4 mr-2" />
                        {isGeneratingAi ? 'Génération en cours...' : "Cliquer ici pour générer le message avec l'IA"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
    
              {applyingMode === 'manual' && (
                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Votre message de motivation
                    </label>
                    <textarea
                      value={applyMessage}
                      onChange={(e) => setApplyMessage(e.target.value)}
                      placeholder="Décrivez pourquoi vous êtes le candidat idéal pour cette mission..."
                      className="w-full rounded-xl border-slate-200 focus:border-[#2b4eef] focus:ring-[#2b4eef] text-slate-700 h-40"
                    />
                  </div>

                  <div className="flex items-start gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="disclaimer-checkbox-mission"
                      checked={includeDisclaimer}
                      onChange={(e) => setIncludeDisclaimer(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-[#2b4eef] focus:ring-[#2b4eef]"
                    />
                    <label htmlFor="disclaimer-checkbox-mission" className="text-sm text-slate-600">
                      Ajouter le texte d'estimation (Le montant indiqué est une estimation. Un devis définitif pourra être établi uniquement après une visite sur place...)
                    </label>
                  </div>

                  <textarea
                    value={conditionsGenerales}
                    onChange={(e) => setConditionsGenerales(e.target.value)}
                    placeholder="Rédigez vos Conditions Générales / Politique (Optionnel)"
                    className="w-full min-h-[100px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 focus:border-[#2b4eef] focus:outline-none focus:ring-2 focus:ring-[#2b4eef]/15 text-slate-700"
                  />
                </div>
              )}
    
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button variant="outline" onClick={() => setShowApplyModal(false)} className="rounded-xl font-bold">
                  Annuler
                </Button>
                <Button 
                  onClick={submitApplication}
                  loading={applying}
                  disabled={applyingMode === 'ai' || !applyMessage.trim() || isGeneratingAi}
                  className="bg-[#df6422] hover:bg-[#c5551c] text-white rounded-xl font-bold"
                >
                  Envoyer la candidature
                </Button>
              </div>
            </div>
          </Modal>
    </>
  );

if (loading) {
    return <PageLoader />
  }

  // Affichage des détails d'une mission
  if (selectedMission) {
    const hasApplied = appliedMissions.includes(`${selectedMission.mission_type}-${selectedMission.id}`);

    return (
      <div className="max-w-5xl mx-auto">
        <Button 
          variant="outline"
          onClick={() => navigate('/freelancer/list-missions')}
          className="mb-6 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux missions
        </Button>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
          {/* Ligne dégradée en haut */}
          <div className="h-2 w-full bg-gradient-to-r from-[#2b4eef] via-[#df6422] to-[#2b4eef]" />
          
          <div className="p-8 md:p-10">
            {/* En-tête */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    selectedMission.mission_type === 'hourly' 
                      ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' 
                      : 'bg-purple-50 text-purple-700 ring-1 ring-purple-200'
                  }`}>
                    {selectedMission.mission_type === 'hourly' ? '⏱ Forfait Horaire' : '💰 Forfait Fixe'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                    Ouvert
                  </span>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-black text-[#082151] leading-tight mb-4">
                  {selectedMission.titre}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-600">
                  <div className="flex items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <Building2 className="h-4 w-4 mr-2 text-slate-400" />
                    {selectedMission.denomination || 'Entreprise'}
                  </div>
                  {selectedMission.localisation && (
                    <div className="flex items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                      {selectedMission.localisation}
                    </div>
                  )}
                  <div className="flex items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                    Publiée le {new Date(selectedMission.date_creation).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Informations financières */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedMission.forfait_mission && (
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                      <Euro className="h-5 w-5 text-[#df6422]" />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-orange-800/70 mb-1">Forfait Fixe</h3>
                    <span className="text-xl font-black text-[#df6422]">{selectedMission.forfait_mission} €</span>
                  </div>
                )}
                
                {selectedMission.forfait_heure && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-blue-800/70 mb-1">Tarif Horaire</h3>
                    <span className="text-xl font-black text-blue-700">{selectedMission.forfait_heure} €/h</span>
                  </div>
                )}
                
                {selectedMission.heures_travail_max && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                      <Clock className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-purple-800/70 mb-1">Heures Max</h3>
                    <span className="text-xl font-black text-purple-700">{selectedMission.heures_travail_max}h</span>
                  </div>
                )}
                
                {selectedMission.temps_max_estime && (
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                      <Calendar className="h-5 w-5 text-slate-600" />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Durée Estimée</h3>
                    <span className="text-xl font-black text-slate-700">{selectedMission.temps_max_estime}</span>
                  </div>
                )}
              </div>

              {/* Paramètres de mission Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedMission.type_mission && (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center">
                    <div className="h-10 w-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mr-4">
                      <Clock className="h-5 w-5 text-[#082151]" />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Type de mission</h3>
                      <span className="text-sm font-bold text-slate-700">
                        {selectedMission.type_mission === 'jour' ? 'Mission de jour' : 'Mission de nuit'}
                      </span>
                    </div>
                  </div>
                )}

                {selectedMission.type_facturation && (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center">
                    <div className="h-10 w-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mr-4">
                      <Euro className="h-5 w-5 text-[#082151]" />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Facturation</h3>
                      <span className="text-sm font-bold text-slate-700">
                        {selectedMission.type_facturation === 'jour' ? 'Par jour' : 
                         selectedMission.type_facturation === 'semaine' ? 'Par semaine' : 'Par mois'}
                      </span>
                    </div>
                  </div>
                )}

                {selectedMission.categorie && (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center">
                    <div className="h-10 w-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mr-4">
                      <Briefcase className="h-5 w-5 text-[#082151]" />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Catégorie</h3>
                      <span className="text-sm font-bold text-slate-700">{selectedMission.categorie}</span>
                    </div>
                  </div>
                )}
                
                {selectedMission.nombre_independants && (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center">
                    <div className="h-10 w-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mr-4">
                      <Users className="h-5 w-5 text-[#082151]" />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Profils recherchés</h3>
                      <span className="text-sm font-bold text-slate-700">
                        {selectedMission.nombre_independants} personne{selectedMission.nombre_independants > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Colonne Description Principale */}
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#082151] flex items-center mb-4">
                      <FileText className="h-4 w-4 mr-2" />
                      Description de la mission
                    </h3>
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                      <p className="text-slate-700 whitespace-pre-line leading-relaxed">{selectedMission.description}</p>
                    </div>
                  </div>

                  {selectedMission.description_livrables && (
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-[#082151] flex items-center mb-4">
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Livrables attendus
                      </h3>
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                          {selectedMission.description_livrables}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedMission.modalites_paiement && (
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-[#082151] flex items-center mb-4">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Modalités de paiement
                      </h3>
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                          {selectedMission.modalites_paiement}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Colonne Détails & Tags */}
                <div className="space-y-8">
                  {selectedMission.competences && selectedMission.competences.length > 0 && (
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-[#082151] flex items-center mb-4">
                        <Code className="h-4 w-4 mr-2" />
                        Compétences requises
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(selectedMission.competences) 
                          ? selectedMission.competences 
                          : JSON.parse(selectedMission.competences || '[]')
                        ).map((competence, index) => (
                          <span key={index} className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-100 font-bold rounded-xl text-sm shadow-sm">
                            {competence}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedMission.langues_parlees && selectedMission.langues_parlees.length > 0 && (
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-[#082151] flex items-center mb-4">
                        <Languages className="h-4 w-4 mr-2" />
                        Langues requises
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(selectedMission.langues_parlees)
                          ? selectedMission.langues_parlees
                          : JSON.parse(selectedMission.langues_parlees || '[]')
                        ).map((langue, index) => (
                          <span key={index} className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold rounded-xl text-sm shadow-sm">
                            {langue}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedMission.adresse_mission && (
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-[#082151] flex items-center mb-4">
                        <MapPin className="h-4 w-4 mr-2" />
                        Lieu de la mission
                      </h3>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                        <div className="flex items-start">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-400 w-24 pt-1">Lieu</span>
                          <span className="font-bold text-slate-700 bg-white px-3 py-1 rounded-lg border border-slate-200">
                            {selectedMission.lieu_mission === 'site_entreprise' ? 'Sur site entreprise' : 'Autre site'}
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-400 w-24 pt-1">Adresse</span>
                          <span className="text-sm font-medium text-slate-700 mt-1">{selectedMission.adresse_mission}</span>
                        </div>
                        {selectedMission.autre_lieu && selectedMission.lieu_mission === 'autre_site' && (
                          <div className="flex items-start">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-400 w-24 pt-1">Précision</span>
                            <span className="text-sm font-medium text-slate-700 mt-1">{selectedMission.autre_lieu}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dates importantes */}
                  <div className="bg-slate-800 text-white rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-white/70 flex items-center mb-6">
                      <Calendar className="h-4 w-4 mr-2" />
                      Calendrier
                    </h3>
                    <div className="space-y-4">
                      {selectedMission.date_debut && (
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                          <span className="text-sm font-medium text-slate-300">Début souhaité</span>
                          <span className="font-bold text-white">
                            {new Date(selectedMission.date_debut).toLocaleDateString('fr-FR', {
                              day: 'numeric', month: 'long', year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                      {selectedMission.date_fermeture && (
                        <div className="flex flex-col border-b border-white/10 pb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-300">Fermeture de l'offre</span>
                            <span className="font-bold text-rose-300">
                              {new Date(selectedMission.date_fermeture).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          {new Date(selectedMission.date_fermeture) < new Date() ? (
                            <span className="text-xs font-black bg-rose-500/20 text-rose-300 px-3 py-1 rounded-lg w-max">
                              ⚠️ Mission expirée
                            </span>
                          ) : (
                            <span className="text-xs font-black bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-lg w-max">
                              ⏱️ {Math.ceil((new Date(selectedMission.date_fermeture) - new Date()) / (1000 * 60 * 60 * 24))} jour(s) restant(s)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 mt-4 border-t border-slate-100">
                {hasApplied ? (
                  <div className="flex flex-col md:flex-row items-center justify-between bg-[#df6422]/5 border border-[#df6422]/20 rounded-2xl p-6">
                    <div className="flex items-center text-[#df6422] mb-4 md:mb-0">
                      <div className="h-10 w-10 bg-[#df6422]/10 rounded-full flex items-center justify-center mr-4">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-[#df6422]">Candidature envoyée</h4>
                        <p className="text-sm text-[#df6422]/80 font-medium">Vous avez déjà postulé à cette mission.</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => navigate('/freelancer/applications')}
                      className="w-full md:w-auto bg-[#df6422] hover:bg-[#c5551c] text-white font-bold rounded-xl shadow-sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir votre demande
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <Button
                        onClick={() => handleOpenApplyModal(selectedMission, 'manual')}
                        loading={applying}
                        className="flex-1 bg-[#2b4eef] hover:bg-[#1f3bbd] text-white font-bold rounded-xl shadow-sm h-12 text-lg"
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        Postuler manuellement
                      </Button>

                      {!aiQuotaReached ? (
                        <Button
                          onClick={() => handleOpenApplyModal(selectedMission, 'ai')}
                          className="flex-1 bg-[#df6422] hover:bg-[#c5551c] text-white font-bold rounded-xl shadow-sm h-12 text-lg"
                        >
                          <Sparkles className="h-5 w-5 mr-2" />
                          Postuler avec IA
                        </Button>
                      ) : (
                        <div className="flex-1 flex items-center justify-center px-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl h-12">
                          <AlertTriangle className="h-5 w-5 mr-2" />
                          <span className="text-sm font-bold">Quota IA atteint</span>
                        </div>
                      )}

                      <Button
                        onClick={() => handleIgnore(selectedMission.id)}
                        variant="outline"
                        className="flex-none border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl h-12 px-6"
                      >
                        <XCircle className="h-5 w-5 mr-2" />
                        Ignorer
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {modals}
</div>
          </div>
        </div>
      </div>
    );
  }

  // Affichage de la liste des missions
  return (
    <div>
      <div className="bg-[#082151] rounded-[24px] shadow-md p-6 md:p-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden text-white border-0">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Missions disponibles</h1>
          <p className="text-slate-200 mt-1 text-sm md:text-base">Découvrez et postulez aux missions qui vous correspondent</p>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#2b4eef]/20 to-[#df6422]/20 rounded-full blur-3xl -mr-16 -mt-16 z-0 pointer-events-none"></div>
      </div>

      {/* Filtres et recherche */}
      <div className="mb-6 rounded-3xl bg-slate-50 border border-slate-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recherche par mot-clé */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par titre, catégorie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-[#2b4eef]/20 focus:border-[#2b4eef] transition-all shadow-sm"
            />
          </div>

          {/* Filtre par type de forfait */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-[#2b4eef]/20 focus:border-[#2b4eef] transition-all shadow-sm appearance-none"
            >
              <option value="all">Tous les types</option>
              <option value="hourly">Forfait Horaire</option>
              <option value="fixed">Forfait Fixe</option>
            </select>
          </div>

          {/* Tri */}
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-[#2b4eef]/20 focus:border-[#2b4eef] transition-all shadow-sm appearance-none"
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
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Filtres actifs:</span>
            {searchTerm && (
              <span className="px-3 py-1 bg-[#2b4eef]/10 text-[#082151] rounded-full font-semibold">
                "{searchTerm}"
              </span>
            )}
            {typeFilter !== 'all' && (
              <span className="px-3 py-1 bg-[#2b4eef]/10 text-[#082151] rounded-full font-semibold">
                {typeFilter === 'hourly' ? 'Forfait Horaire' : 'Forfait Fixe'}
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
              }}
              className="text-rose-500 hover:text-rose-600 font-bold ml-2 text-xs uppercase"
            >
              Réinitialiser
            </button>
          </div>
        )}
      </div>

      {/* Compteur de résultats */}
      {filteredMissions.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          {filteredMissions.length} mission{filteredMissions.length > 1 ? 's' : ''} trouvée{filteredMissions.length > 1 ? 's' : ''}
          {missions.length !== filteredMissions.length && ` sur ${missions.length}`}
        </div>
      )}

      {filteredMissions.length === 0 ? (
        <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-slate-200">
          <Briefcase className="h-20 w-20 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium mb-2">
            {searchTerm || typeFilter !== 'all' 
              ? 'Aucune mission ne correspond à vos critères de recherche' 
              : 'Aucune mission ouverte pour le moment'}
          </p>
          <p className="text-sm text-slate-400 mb-6">
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
              className="bg-[#2b4eef] hover:bg-[#1f3bbd] text-white font-bold rounded-xl shadow-sm"
            >
              Réinitialiser les filtres
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {currentMissions.map((mission) => (
              <div key={mission.id} className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-[#2b4eef]/30 transition-all relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2b4eef] via-[#df6422] to-[#2b4eef] opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-start justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    mission.mission_type === 'hourly' 
                      ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' 
                      : 'bg-purple-50 text-purple-700 ring-1 ring-purple-200'
                  }`}>
                    {mission.mission_type === 'hourly' ? '⏱ Horaire' : '💰 Fixe'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 flex-shrink-0">
                    Ouvert
                  </span>
                </div>
                
                <h3 className="text-xl font-black text-[#082151] leading-tight mb-3 line-clamp-2 min-h-[3.5rem]">
                  {mission.titre}
                </h3>
                
                <p className="text-sm text-slate-500 mb-6 line-clamp-3 bg-slate-50 p-4 rounded-2xl">
                  {mission.description}
                </p>

                <div className="space-y-3 mb-6 mt-auto">
                  <div className="flex items-center text-sm font-bold text-slate-600">
                    <Building2 className="h-4 w-4 mr-3 text-slate-400" />
                    {mission.denomination || 'Entreprise'}
                  </div>
                  {mission.localisation && (
                    <div className="flex items-center text-sm font-bold text-slate-600">
                      <MapPin className="h-4 w-4 mr-3 text-slate-400" />
                      {mission.localisation}
                    </div>
                  )}
                  {mission.budget && (
                    <div className="flex items-center text-sm font-black text-[#df6422]">
                      <Euro className="h-4 w-4 mr-3 text-[#df6422]" />
                      {mission.budget} €
                    </div>
                  )}
                  <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 pt-4 border-t border-slate-100">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(mission.date_creation).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                {appliedMissions.includes(`${mission.mission_type}-${mission.id}`) ? (
                  <Button 
                    className="w-full bg-[#df6422] hover:bg-[#c5551c] text-white border border-[#df6422] font-bold rounded-xl shadow-sm cursor-default"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Déjà postulé
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleViewMission(mission)}
                    className="w-full bg-[#2b4eef] hover:bg-[#1f3bbd] text-white font-bold rounded-xl shadow-sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir détails
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
              >
                Précédent
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl font-bold transition-all ${
                      currentPage === page 
                        ? 'bg-[#2b4eef] text-white shadow-md' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}

      {modals}
      <QuotaWidget />
    </div>
  );
};

export default FreelancerMissions;

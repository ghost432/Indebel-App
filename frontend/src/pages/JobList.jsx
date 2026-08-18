import { useState, useEffect, useCallback } from 'react';
import PageLoader from '../components/PageLoader'
import { 
  Search, 
  Briefcase, 
  MapPin, 
  Clock, 
  Send, 
  Filter, 
  X, 
  Plus,
  ChevronDown, 
  ChevronUp, 
  Star, 
  CheckCircle,
  Building2,
  Euro,
  Clock as ClockIcon,
  Calendar,
  FileText,
  ArrowRight,
  Check,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { jobService } from '../services/jobService';
import { applicationService } from '../services/applicationService';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Options pour les filtres
const JOB_TYPES = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'Freelance', label: 'Freelance' },
  { value: 'Stage', label: 'Stage' },
  { value: 'Alternance', label: 'Alternance' },
];

const EXPERIENCE_LEVELS = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'confirme', label: 'Confirmé' },
  { value: 'expert', label: 'Expert' },
];

const JOB_STATUS = {
  ouvert: 'bg-green-100 text-green-800',
  en_cours: 'bg-blue-100 text-blue-800',
  ferme: 'bg-gray-100 text-gray-800',
};

const JobList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    secteur: '',
    type_contrat: [],
    niveau_experience: [],
    competences: [],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [secteurs, setSecteurs] = useState([]);
  const [competences, setCompetences] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Charger les données initiales
  useEffect(() => {
    document.title = user?.role === 'employer' ? 'Mes Missions - Indebel' : 'Missions - Indebel';
    fetchJobs();
    if (user?.role === 'freelancer') {
      fetchApplications();
    }
    fetchFiltersData();
  }, [user, pagination.page]);

  // Charger les données pour les filtres
  const fetchFiltersData = async () => {
    try {
      // Récupérer les secteurs uniques
      const [secteursRes, competencesRes] = await Promise.all([
        jobService.getSecteurs(),
        userService.getCompetences()
      ]);
      
      setSecteurs((secteursRes.data?.data || secteursRes.data) || []);
      setCompetences((competencesRes.data?.data || competencesRes.data) || []);
    } catch (error) {
      console.error('Erreur lors du chargement des filtres:', error);
      toast.error('Erreur lors du chargement des filtres');
    }
  };

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...filters
      };
      
      // Si c'est un employeur, on ne récupère que ses propres missions
      if (user?.role === 'employer') {
        params.employer_id = user.id;
      } else if (user?.role === 'freelancer') {
        // Pour les freelancers, on peut ajouter des filtres supplémentaires
        params.statut = 'ouvert';
      }
      
      const response = await jobService.getAllJobs(params);
      const { data, pagination: paginationData } = response.data;
      
      setJobs(data);
      setFilteredJobs(data);
      setPagination(prev => ({
        ...prev,
        total: paginationData.totalItems,
        totalPages: paginationData.totalPages
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des missions:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du chargement des missions');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters, pagination.page, pagination.limit, user]);

  const fetchApplications = async () => {
    try {
      const response = await applicationService.getFreelancerApplications()
      const jobIds = new Set((response.data?.data || response.data).map(app => app.job_id))
      setAppliedJobs(jobIds)
    } catch (error) {
      console.error('Erreur lors du chargement des candidatures')
    }
  }

  // Gestion des changements de filtres
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    
    // Réinitialiser la pagination lors du changement de filtre
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  // Réinitialiser tous les filtres
  const resetFilters = () => {
    setFilters({
      secteur: '',
      type_contrat: [],
      niveau_experience: [],
      competences: [],
    });
    setSearchTerm('');
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = () => {
    return (
      searchTerm ||
      filters.secteur ||
      filters.type_contrat.length > 0 ||
      filters.niveau_experience.length > 0 ||
      filters.competences.length > 0
    );
  };

  const handleViewJob = (job) => {
    setSelectedJob(job)
    setModalOpen(true)
  }

  const handleApply = async (jobId) => {
    // Vérifier si le profil est vérifié
    if (user?.statut_verification !== 'verifie') {
      toast.error('Vous devez d\'abord vérifier votre identité pour postuler aux missions.', {
        duration: 5000
      })
      // Rediriger vers la page de vérification après 2 secondes
      setTimeout(() => {
        navigate('/freelancer/verification')
      }, 2000)
      return
    }

    try {
      await applicationService.createApplication(jobId)
      toast.success('Candidature envoyée avec succès !')
      setAppliedJobs(new Set([...appliedJobs, jobId]))
      setModalOpen(false)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la candidature')
    }
  }

  const getStatusBadge = (statut) => {
    const variants = {
      ouvert: 'success',
      ferme: 'danger',
      en_cours: 'warning'
    }
    return <Badge variant={variants[statut]}>{statut}</Badge>
  }

  if (loading) {
    return <PageLoader fullScreen />
  }

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: fr 
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {user?.role === 'employer' ? 'Mes Missions' : 'Missions disponibles'}
          </h1>
          <p className="text-gray-500 mt-1">
            Trouvez la mission qui correspond à vos compétences
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 w-full md:w-auto"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtres</span>
            {hasActiveFilters() && (
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium">
                {[
                  searchTerm ? 1 : 0,
                  filters.secteur ? 1 : 0,
                  filters.type_contrat.length,
                  filters.niveau_experience.length,
                  filters.competences.length
                ].reduce((a, b) => a + b, 0)}
              </span>
            )}
          </Button>
          
          {user?.role === 'employer' && (
            <Button 
              onClick={() => navigate('/employer/jobs/new')}
              className="w-full md:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Nouvelle mission</span>
              <span className="sm:hidden">Nouveau</span>
            </Button>
          )}
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Rechercher une mission par mot-clé, compétence ou entreprise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Filtres dépliables */}
      {showFilters && (
        <Card className="mb-8 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Filtre par secteur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secteur d'activité
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                value={filters.secteur}
                onChange={(e) => handleFilterChange('secteur', e.target.value)}
              >
                <option value="">Tous les secteurs</option>
                {secteurs.map((secteur) => (
                  <option key={secteur} value={secteur}>
                    {secteur}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par type de contrat */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de contrat
              </label>
              <div className="space-y-2">
                {JOB_TYPES.slice(0, 3).map((type) => (
                  <div key={type.value} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`type-${type.value}`}
                      checked={filters.type_contrat.includes(type.value)}
                      onChange={(e) => {
                        const newTypes = e.target.checked
                          ? [...filters.type_contrat, type.value]
                          : filters.type_contrat.filter(t => t !== type.value);
                        handleFilterChange('type_contrat', newTypes);
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor={`type-${type.value}`} className="ml-2 text-sm text-gray-700">
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Filtre par niveau d'expérience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau d'expérience
              </label>
              <div className="space-y-2">
                {EXPERIENCE_LEVELS.map((level) => (
                  <div key={level.value} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`exp-${level.value}`}
                      checked={filters.niveau_experience.includes(level.value)}
                      onChange={(e) => {
                        const newLevels = e.target.checked
                          ? [...filters.niveau_experience, level.value]
                          : filters.niveau_experience.filter(l => l !== level.value);
                        handleFilterChange('niveau_experience', newLevels);
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor={`exp-${level.value}`} className="ml-2 text-sm text-gray-700">
                      {level.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Boutons d'action des filtres */}
          <div className="md:col-span-3 flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
            <Button
              variant="outline"
              onClick={resetFilters}
              disabled={!hasActiveFilters()}
              className="px-4 py-2"
            >
              Réinitialiser
            </Button>
            <Button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2"
            >
              Afficher les résultats
            </Button>
          </div>
        </Card>
      )}

      {/* En-tête des résultats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {pagination.total} {pagination.total > 1 ? 'missions trouvées' : 'mission trouvée'}
          </h2>
          <p className="text-sm text-gray-500">
            {pagination.total > 0 
              ? `Affichage de ${Math.min(pagination.limit, filteredJobs.length)} sur ${pagination.total} missions`
              : 'Aucune mission ne correspond à vos critères'}
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-sm text-gray-500 whitespace-nowrap">Trier par :</span>
          <select 
            className="block w-full sm:w-48 rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            value={filters.sort || 'date_desc'}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
          >
            <option value="date_desc">Plus récentes</option>
            <option value="date_asc">Plus anciennes</option>
            {user?.role === 'freelancer' && (
              <option value="relevance">Pertinence</option>
            )}
          </select>
        </div>
      </div>

      {/* Liste des emplois */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-100 rounded w-5/6 mb-4"></div>
              <div className="h-4 bg-gray-100 rounded w-2/3"></div>
            </Card>
          ))}
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <Card 
              key={job.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewJob(job)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {job.titre}
                      </h3>
                      <Badge className={`ml-2 ${JOB_STATUS[job.statut] || 'bg-gray-100 text-gray-800'}`}>
                        {job.statut?.charAt(0).toUpperCase() + job.statut?.slice(1).replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <p className="mt-2 text-gray-600 line-clamp-2">
                      {job.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {job.type_contrat && (
                        <Badge variant="outline" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          {job.type_contrat}
                        </Badge>
                      )}
                      {job.localisation && (
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {job.localisation}
                        </Badge>
                      )}
                      {job.type_forfait && (
                        <Badge variant="outline" className="text-xs">
                          <Euro className="h-3 w-3 mr-1" />
                          {job.type_forfait}
                        </Badge>
                      )}
                      {job.duree && (
                        <Badge variant="outline" className="text-xs">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {job.duree}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{job.employer?.denomination || `${job.employer?.prenom} ${job.employer?.nom}`}</span>
                        {job.employer?.verifie && (
                          <CheckCircle className="h-4 w-4 text-blue-500 ml-1" />
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        Publié {formatDate(job.date_creation)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex-shrink-0">
                    {user?.role === 'freelancer' ? (
                      <Button
                        variant={appliedJobs.has(job.id) ? 'secondary' : 'primary'}
                        size="sm"
                        disabled={appliedJobs.has(job.id) || job.statut !== 'ouvert'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApply(job.id);
                        }}
                        className="whitespace-nowrap"
                      >
                        {appliedJobs.has(job.id) ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Candidature envoyée
                          </>
                        ) : job.statut === 'ouvert' ? (
                          'Postuler maintenant'
                        ) : (
                          'Non disponible'
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewJob(job);
                        }}
                      >
                        Voir les détails
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="flex items-center gap-1" aria-label="Pagination">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  // Afficher les pages autour de la page courante
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                        pagination.page === pageNum
                          ? 'bg-indigo-600 text-white'
                          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </nav>
            </div>
          )}
        </div>
      ) : (
        <Card className="text-center p-8">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune mission trouvée</h3>
          <p className="text-gray-500 mb-4">
            Aucune mission ne correspond à vos critères de recherche.
          </p>
          <Button variant="outline" onClick={resetFilters}>
            Réinitialiser les filtres
          </Button>
        </Card>
      )}
    </div>
  )
}

export default JobList

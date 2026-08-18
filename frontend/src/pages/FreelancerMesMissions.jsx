import { useState, useEffect } from 'react';
import PageLoader from '../components/PageLoader'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { demandeService } from '../services/demandeService';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { Briefcase, Clock, CheckCircle, XCircle, Calendar, Building2, Eye, MessageSquare, Sparkles, User } from 'lucide-react';
import toast from 'react-hot-toast';

const FreelancerMesMissions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, en_attente, accepte, refuse, terminee

  useEffect(() => {
    document.title = 'Mes Missions - Indebel';
    fetchDemandes();
  }, []);

  const fetchDemandes = async () => {
    try {
      const response = await demandeService.getFreelancerDemandes();
      setDemandes((response.data?.data || response.data) || []);
    } catch (error) {
      console.error('Erreur chargement demandes:', error);
      toast.error('Erreur lors du chargement de vos missions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (statut) => {
    const statusConfig = {
      en_attente: { color: 'yellow', label: 'En attente', icon: Clock },
      accepte: { color: 'green', label: 'Acceptée', icon: CheckCircle },
      refuse: { color: 'red', label: 'Refusée', icon: XCircle },
      terminee: { color: 'blue', label: 'Terminée', icon: CheckCircle },
      annulee: { color: 'gray', label: 'Annulée', icon: XCircle }
    };

    const config = statusConfig[statut] || statusConfig.en_attente;
    const Icon = config.icon;

    return (
      <Badge variant={config.color} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getMissionTypeBadge = (type) => {
    return type === 'hourly' ? (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
        Forfait Horaire
      </span>
    ) : (
      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
        Forfait Fixe
      </span>
    );
  };

  const filteredDemandes = demandes.filter(d => 
    filter === 'all' || d.statut === filter
  );

  const stats = {
    total: demandes.length,
    en_attente: demandes.filter(d => d.statut === 'en_attente').length,
    accepte: demandes.filter(d => d.statut === 'accepte').length,
    terminee: demandes.filter(d => d.statut === 'terminee').length,
    refuse: demandes.filter(d => d.statut === 'refuse').length
  };

  if (loading) {
    return <PageLoader />
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Missions</h1>
        <p className="text-gray-600">Suivez l'état de vos candidatures et missions</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card 
          className={`cursor-pointer transition-all ${filter === 'all' ? 'ring-2 ring-primary-500' : ''}`}
          onClick={() => setFilter('all')}
        >
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all ${filter === 'en_attente' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => setFilter('en_attente')}
        >
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.en_attente}</div>
            <div className="text-sm text-gray-600">En attente</div>
          </div>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${filter === 'accepte' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setFilter('accepte')}
        >
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-green-600">{stats.accepte}</div>
            <div className="text-sm text-gray-600">En cours</div>
          </div>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${filter === 'terminee' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setFilter('terminee')}
        >
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.terminee}</div>
            <div className="text-sm text-gray-600">Terminées</div>
          </div>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${filter === 'refuse' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setFilter('refuse')}
        >
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-red-600">{stats.refuse}</div>
            <div className="text-sm text-gray-600">Refusées</div>
          </div>
        </Card>
      </div>

      {/* Liste des demandes */}
      {filteredDemandes.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              {filter === 'all' 
                ? 'Vous n\'avez pas encore postulé à de missions' 
                : `Aucune mission ${filter === 'en_attente' ? 'en attente' : filter === 'accepte' ? 'en cours' : filter}`}
            </p>
            {filter === 'all' && (
              <Button
                onClick={() => navigate('/freelancer/list-missions')}
                className="mt-4"
              >
                Découvrir les missions
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDemandes.map((demande) => (
            <Card key={demande.id} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {demande.mission_titre}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {getStatusBadge(demande.statut)}
                          {getMissionTypeBadge(demande.mission_type)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Building2 className="h-4 w-4 mr-2" />
                        <span className="font-medium">
                          {demande.denomination || `${demande.employer_prenom} ${demande.employer_nom}`}
                        </span>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Candidature envoyée le {new Date(demande.date_demande).toLocaleDateString('fr-FR')}</span>
                      </div>

                      {demande.date_reponse && (
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>
                            Réponse le {new Date(demande.date_reponse).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      )}

                      {demande.message_freelancer && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm text-gray-700">Votre message :</span>
                            {demande.est_genere_par_ia ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-800">
                                <Sparkles className="h-3 w-3 mr-1" />
                                IA
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-800">
                                <User className="h-3 w-3 mr-1" />
                                Manuel
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mt-1">
                            {demande.message_freelancer}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:ml-4">
                    {demande.statut === 'accepte' && (
                      <Button
                        size="sm"
                        onClick={() => navigate(`/freelancer/mes-messages`)}
                        className="whitespace-nowrap"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Contacter
                      </Button>
                    )}
                  </div>
                </div>

                {/* Notification si changement de statut récent */}
                {demande.date_reponse && new Date(demande.date_reponse) > new Date(Date.now() - 24 * 60 * 60 * 1000) && (
                  <div className={`mt-4 p-3 rounded-lg border ${
                    demande.statut === 'accepte' 
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : demande.statut === 'refuse'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}>
                    <p className="text-sm font-medium">
                      {demande.statut === 'accepte' && '🎉 Félicitations ! Votre candidature a été acceptée.'}
                      {demande.statut === 'refuse' && '😔 Votre candidature n\'a pas été retenue cette fois.'}
                      {demande.statut === 'terminee' && '✅ Cette mission a été terminée.'}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FreelancerMesMissions;

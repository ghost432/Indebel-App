import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { demandeService } from '../services/demandeService';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { Briefcase, Clock, CheckCircle, XCircle, Calendar, Building2, MessageSquare, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const FreelancerMyJobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    document.title = 'Mes Missions Postulées - Indebel';
    fetchDemandes();
  }, []);

  const fetchDemandes = async () => {
    try {
      console.log('🔍 Récupération des demandes du freelancer...');
      const response = await demandeService.getFreelancerDemandes();
      const demandesData = response.data.data || [];
      console.log('📋 Demandes récupérées:', demandesData);
      console.log('📊 Nombre de demandes:', demandesData.length);
      setDemandes(demandesData);
    } catch (error) {
      console.error('❌ Erreur chargement demandes:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (statut) => {
    const config = {
      en_attente: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
        label: 'En attente' 
      },
      accepte: { 
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        label: 'Acceptée - En cours' 
      },
      refuse: { 
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
        label: 'Refusée' 
      },
      terminee: { 
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: CheckCircle,
        label: 'Terminée' 
      },
      annulee: { 
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: XCircle,
        label: 'Annulée' 
      }
    };
    return config[statut] || config.en_attente;
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Missions Postulées</h1>
        <p className="text-gray-600">Suivez l'état de toutes vos candidatures</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${filter === 'all' ? 'ring-2 ring-primary-500' : ''}`}
          onClick={() => setFilter('all')}
        >
          <div className="text-center p-4">
            <Briefcase className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600 mt-1">Total</div>
          </div>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${filter === 'en_attente' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => setFilter('en_attente')}
        >
          <div className="text-center p-4">
            <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-yellow-600">{stats.en_attente}</div>
            <div className="text-sm text-gray-600 mt-1">En attente</div>
          </div>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${filter === 'accepte' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setFilter('accepte')}
        >
          <div className="text-center p-4">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-green-600">{stats.accepte}</div>
            <div className="text-sm text-gray-600 mt-1">En cours</div>
          </div>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${filter === 'terminee' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setFilter('terminee')}
        >
          <div className="text-center p-4">
            <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-blue-600">{stats.terminee}</div>
            <div className="text-sm text-gray-600 mt-1">Terminées</div>
          </div>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${filter === 'refuse' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setFilter('refuse')}
        >
          <div className="text-center p-4">
            <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-red-600">{stats.refuse}</div>
            <div className="text-sm text-gray-600 mt-1">Refusées</div>
          </div>
        </Card>
      </div>

      {/* Liste des missions */}
      {filteredDemandes.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <Briefcase className="h-20 w-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all' 
                ? 'Aucune candidature pour le moment' 
                : `Aucune mission ${
                    filter === 'en_attente' ? 'en attente' : 
                    filter === 'accepte' ? 'en cours' : 
                    filter === 'terminee' ? 'terminée' : 'refusée'
                  }`
              }
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? 'Commencez par postuler à des missions pour les voir apparaître ici'
                : 'Modifiez votre filtre pour voir d\'autres missions'
              }
            </p>
            {filter === 'all' && (
              <Button
                onClick={() => navigate('/freelancer/list-missions')}
                className="mx-auto"
              >
                <Eye className="h-4 w-4 mr-2" />
                Découvrir les missions
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDemandes.map((demande) => {
            const statusConfig = getStatusConfig(demande.statut);
            const StatusIcon = statusConfig.icon;
            const isRecent = demande.date_reponse && 
              new Date(demande.date_reponse) > new Date(Date.now() - 48 * 60 * 60 * 1000);

            return (
              <Card key={demande.id} className="hover:shadow-xl transition-all">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {demande.mission_titre}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color}`}>
                          <StatusIcon className="h-4 w-4 mr-2" />
                          {statusConfig.label}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          demande.mission_type === 'hourly' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {demande.mission_type === 'hourly' ? '⏱ Forfait Horaire' : '💰 Forfait Fixe'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recruteur et dates */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-gray-700">
                      <Building2 className="h-5 w-5 mr-3 text-gray-500" />
                      <div>
                        <span className="font-medium">
                          {demande.denomination || 'Recruteur'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-5 w-5 mr-3 text-gray-500" />
                      <span className="text-sm">
                        Postulé le {new Date(demande.date_demande).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    {demande.date_reponse && (
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-5 w-5 mr-3 text-gray-500" />
                        <span className="text-sm">
                          Réponse le {new Date(demande.date_reponse).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Message de candidature */}
                  {demande.message_freelancer && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-1">Votre message :</p>
                      <p className="text-sm text-gray-600">{demande.message_freelancer}</p>
                    </div>
                  )}

                  {/* Alerte si changement récent */}
                  {isRecent && (
                    <div className={`mb-4 p-4 rounded-lg border ${
                      demande.statut === 'accepte' 
                        ? 'bg-green-50 border-green-200'
                        : demande.statut === 'refuse'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <p className={`text-sm font-semibold ${
                        demande.statut === 'accepte' 
                          ? 'text-green-800'
                          : demande.statut === 'refuse'
                          ? 'text-red-800'
                          : 'text-blue-800'
                      }`}>
                        {demande.statut === 'accepte' && '🎉 Félicitations ! Votre candidature a été acceptée.'}
                        {demande.statut === 'refuse' && '😔 Votre candidature n\'a pas été retenue cette fois.'}
                        {demande.statut === 'terminee' && '✅ Cette mission a été marquée comme terminée.'}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {demande.statut === 'accepte' && (
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        onClick={() => navigate('/freelancer/mes-messages')}
                        className="flex-1"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Contacter l'employeur
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FreelancerMyJobs;

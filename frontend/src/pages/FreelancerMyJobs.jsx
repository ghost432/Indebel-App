import { useState, useEffect } from 'react';
import PageLoader from '../components/PageLoader'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { demandeService } from '../services/demandeService';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { Filter, Search, Calendar, CheckCircle, XCircle, Clock, Briefcase, Building, Mail, User, Sparkles, Eye, Building2, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const FreelancerMyJobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    document.title = 'Mes Missions Postulées - Indebel';
    fetchDemandes();
  }, []);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const fetchDemandes = async () => {
    try {
      console.log('🔍 Récupération des demandes du freelancer...');
      const response = await demandeService.getFreelancerDemandes();
      const demandesData = (response.data?.data || response.data) || [];
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

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDemandes = filteredDemandes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDemandes.length / itemsPerPage);

  if (loading) {
    return <PageLoader />
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#082151] mb-2 tracking-tight">Mes missions postulées</h1>
        <p className="text-slate-500 font-medium">Suivez l'état de toutes vos candidatures</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div 
          className={`cursor-pointer transition-all duration-300 rounded-3xl border p-5 ${filter === 'all' ? 'bg-[#2b4eef] border-[#2b4eef] shadow-lg shadow-[#2b4eef]/20 scale-[1.02]' : 'bg-white border-slate-200 hover:border-[#2b4eef]/30 hover:shadow-md'}`}
          onClick={() => setFilter('all')}
        >
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Briefcase className={`h-8 w-8 ${filter === 'all' ? 'text-white' : 'text-slate-400'}`} />
            <div className={`text-4xl font-black ${filter === 'all' ? 'text-white' : 'text-[#082151]'}`}>{stats.total}</div>
            <div className={`text-[10px] uppercase tracking-widest font-bold ${filter === 'all' ? 'text-white/80' : 'text-slate-400'}`}>Total</div>
          </div>
        </div>
        
        <div 
          className={`cursor-pointer transition-all duration-300 rounded-3xl border p-5 ${filter === 'en_attente' ? 'bg-amber-500 border-amber-500 shadow-lg shadow-amber-500/20 scale-[1.02]' : 'bg-white border-slate-200 hover:border-amber-500/30 hover:shadow-md'}`}
          onClick={() => setFilter('en_attente')}
        >
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Clock className={`h-8 w-8 ${filter === 'en_attente' ? 'text-white' : 'text-amber-400'}`} />
            <div className={`text-4xl font-black ${filter === 'en_attente' ? 'text-white' : 'text-amber-500'}`}>{stats.en_attente}</div>
            <div className={`text-[10px] uppercase tracking-widest font-bold ${filter === 'en_attente' ? 'text-white/80' : 'text-slate-400'}`}>En attente</div>
          </div>
        </div>

        <div 
          className={`cursor-pointer transition-all duration-300 rounded-3xl border p-5 ${filter === 'accepte' ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20 scale-[1.02]' : 'bg-white border-slate-200 hover:border-emerald-500/30 hover:shadow-md'}`}
          onClick={() => setFilter('accepte')}
        >
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <CheckCircle className={`h-8 w-8 ${filter === 'accepte' ? 'text-white' : 'text-emerald-400'}`} />
            <div className={`text-4xl font-black ${filter === 'accepte' ? 'text-white' : 'text-emerald-500'}`}>{stats.accepte}</div>
            <div className={`text-[10px] uppercase tracking-widest font-bold ${filter === 'accepte' ? 'text-white/80' : 'text-slate-400'}`}>En cours</div>
          </div>
        </div>

        <div 
          className={`cursor-pointer transition-all duration-300 rounded-3xl border p-5 ${filter === 'terminee' ? 'bg-blue-500 border-blue-500 shadow-lg shadow-blue-500/20 scale-[1.02]' : 'bg-white border-slate-200 hover:border-blue-500/30 hover:shadow-md'}`}
          onClick={() => setFilter('terminee')}
        >
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <CheckCircle className={`h-8 w-8 ${filter === 'terminee' ? 'text-white' : 'text-blue-400'}`} />
            <div className={`text-4xl font-black ${filter === 'terminee' ? 'text-white' : 'text-blue-500'}`}>{stats.terminee}</div>
            <div className={`text-[10px] uppercase tracking-widest font-bold ${filter === 'terminee' ? 'text-white/80' : 'text-slate-400'}`}>Terminées</div>
          </div>
        </div>

        <div 
          className={`cursor-pointer transition-all duration-300 rounded-3xl border p-5 ${filter === 'refuse' ? 'bg-rose-500 border-rose-500 shadow-lg shadow-rose-500/20 scale-[1.02]' : 'bg-white border-slate-200 hover:border-rose-500/30 hover:shadow-md'}`}
          onClick={() => setFilter('refuse')}
        >
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <XCircle className={`h-8 w-8 ${filter === 'refuse' ? 'text-white' : 'text-rose-400'}`} />
            <div className={`text-4xl font-black ${filter === 'refuse' ? 'text-white' : 'text-rose-500'}`}>{stats.refuse}</div>
            <div className={`text-[10px] uppercase tracking-widest font-bold ${filter === 'refuse' ? 'text-white/80' : 'text-slate-400'}`}>Refusées</div>
          </div>
        </div>
      </div>

      {/* Liste des missions */}
      {currentDemandes.length === 0 ? (
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
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {currentDemandes.map((demande) => {
              const statusConfig = getStatusConfig(demande.statut);
              const StatusIcon = statusConfig.icon;
              const isRecent = demande.date_reponse && 
                new Date(demande.date_reponse) > new Date(Date.now() - 48 * 60 * 60 * 1000);

              return (
                <div key={demande.id} className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-[#2b4eef]/30 relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2b4eef] via-[#c02525] to-[#2b4eef] opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusConfig.color}`}>
                          <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                          {statusConfig.label}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          demande.mission_type === 'hourly' 
                            ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' 
                            : 'bg-purple-50 text-purple-700 ring-1 ring-purple-200'
                        }`}>
                          {demande.mission_type === 'hourly' ? '⏱ Forfait Horaire' : '💰 Forfait Fixe'}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-[#082151] leading-tight">
                        {demande.mission_titre}
                      </h3>
                    </div>
                  </div>

                  {/* Entreprise et dates */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 mb-5">
                    <div className="flex items-center text-slate-700">
                      <Building2 className="h-4 w-4 mr-2.5 text-slate-400" />
                      <span className="font-bold text-sm">
                        {demande.employer_denomination || demande.employer_nom || demande.denomination || 'Entreprise non précisée'}
                      </span>
                    </div>

                    <div className="flex items-center text-slate-500">
                      <Calendar className="h-4 w-4 mr-2.5 text-slate-400" />
                      <span className="text-xs font-medium">
                        Postulé le {new Date(demande.date_demande).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    {demande.date_reponse && (
                      <div className="flex items-center text-slate-500">
                        <Clock className="h-4 w-4 mr-2.5 text-slate-400" />
                        <span className="text-xs font-medium">
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
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#082151]">Votre message</p>
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
                      <div className="p-4 bg-white rounded-xl border border-slate-100 text-sm text-slate-600 italic line-clamp-3">
                        "{demande.message_freelancer}"
                      </div>
                    </div>
                  )}

                  {/* Alerte si changement récent */}
                  {isRecent && (
                    <div className={`mb-5 p-3 rounded-xl border flex items-center ${
                      demande.statut === 'accepte' 
                        ? 'bg-emerald-50 border-emerald-100'
                        : demande.statut === 'refuse'
                        ? 'bg-rose-50 border-rose-100'
                        : 'bg-blue-50 border-blue-100'
                    }`}>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                        demande.statut === 'accepte' ? 'bg-emerald-100 text-emerald-600' : 
                        demande.statut === 'refuse' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <p className={`text-xs font-bold leading-tight ${
                        demande.statut === 'accepte' ? 'text-emerald-800' : 
                        demande.statut === 'refuse' ? 'text-rose-800' : 'text-blue-800'
                      }`}>
                        {demande.statut === 'accepte' && 'Félicitations ! Votre candidature a été acceptée.'}
                        {demande.statut === 'refuse' && 'Votre candidature n\'a pas été retenue cette fois.'}
                        {demande.statut === 'terminee' && 'Cette mission a été marquée comme terminée.'}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-auto pt-4 flex gap-2">
                    {demande.statut === 'accepte' && (
                      <Button
                        onClick={() => navigate('/freelancer/mes-messages')}
                        className="w-full bg-[#df6422] hover:bg-[#c5551c] text-white shadow-sm font-bold rounded-xl"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Contacter l'employeur
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
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
    </div>
  );
};

export default FreelancerMyJobs;

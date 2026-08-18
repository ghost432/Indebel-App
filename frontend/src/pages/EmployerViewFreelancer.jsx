import { useState, useEffect } from 'react';
import PageLoader from '../components/PageLoader'
import { useParams, useNavigate } from 'react-router-dom';
import { User, Mail, PhoneCall, Briefcase, Calendar, MapPin, Euro, Languages, ArrowLeft, MessageSquare, Star } from 'lucide-react';
import api from '../services/api';
import { profileService } from '../services/profileService';
import { profileViewService } from '../services/profileViewService';
import { messageService } from '../services/messageService';
import { evaluationService } from '../services/evaluationService';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import VerificationBadge from '../components/VerificationBadge';
import toast from 'react-hot-toast';

const EmployerViewFreelancer = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contactLoading, setContactLoading] = useState(false);
  const [completedMissions, setCompletedMissions] = useState([]);
  const [totalMissions, setTotalMissions] = useState(0);
  const [evaluationStats, setEvaluationStats] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/users/public-profile/${username}`);
        if (response.data && response.data.success) {
          // Synchroniser les images de profil
          const syncedProfile = profileService.syncProfileImages((response.data?.data || response.data));
          setProfile(syncedProfile);
          document.title = `${profileService.getDisplayName(syncedProfile, 'freelancer')} - Profil prestataire - Indebel`;
          // Charger les missions réalisées
          if (syncedProfile.id) {
            // Enregistrer la vue du profil
            profileViewService.trackProfileView(syncedProfile.id).catch(err => {
              console.log('Erreur tracking vue profil:', err);
            });
            
            fetchCompletedMissions(syncedProfile.id);
            
            // Charger les statistiques d'évaluation
            evaluationService.getFreelancerEvaluations(syncedProfile.id, 1, 1)
              .then(evalResponse => {
                if (evalResponse.data && evalResponse.data.success) {
                  setEvaluationStats((evalResponse.data?.data || evalResponse.data).stats);
                }
              })
              .catch(err => console.log('Erreur chargement évaluations:', err));
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Impossible de charger le profil');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  const fetchCompletedMissions = async (freelancerId) => {
    try {
      const response = await api.get(`/users/${freelancerId}/completed-missions`);
      if (response.data && response.data.success) {
        setCompletedMissions(response.data.missions || []);
        setTotalMissions(response.data.total || 0);
      }
    } catch (error) {
      console.error('Error loading missions:', error);
      setCompletedMissions([]);
      setTotalMissions(0);
    }
  };

  const handleContact = async () => {
    if (!profile) return;
    
    setContactLoading(true);
    try {
      // Récupérer les conversations existantes
      const conversationsResponse = await messageService.getConversations();
      const conversations = conversationsResponse.data || conversationsResponse || [];
      
      // Chercher une conversation existante avec ce freelancer
      const existingConversation = conversations.find(conv => {
        // Vérifier si l'un des participants est le freelancer
        return conv.participant_id === profile.id || 
               conv.user1_id === profile.id || 
               conv.user2_id === profile.id;
      });
      
      if (existingConversation) {
        // Si une conversation existe, y naviguer directement
        toast.success('Redirection vers la conversation existante');
        navigate(`/employer/mes-messages?conversation_id=${existingConversation.id}`);
      } else {
        // Sinon, créer une nouvelle conversation
        const newConversation = await messageService.createConversation({
          recipientId: profile.id,
          recipientType: 'freelancer'
        });
        
        const conversationId = newConversation.data?.id || newConversation.id;
        toast.success('Nouvelle conversation créée');
        navigate(`/employer/mes-messages?conversation_id=${conversationId}`);
      }
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
      toast.error('Erreur lors de la création de la conversation');
      // En cas d'erreur, naviguer quand même vers la messagerie
      navigate('/employer/mes-messages');
    } finally {
      setContactLoading(false);
    }
  };

  if (loading) {
    return <PageLoader />
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <div className="text-center py-12">
            <User className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Profil non trouvé</h2>
            <p className="text-gray-600 mb-6">Le freelancer que vous recherchez n'existe pas ou n'est plus disponible.</p>
            <Button onClick={() => navigate('/employer/list-freelancers')}>
              Retour à la liste
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const competences = profile.competences ? 
    (typeof profile.competences === 'string' ? JSON.parse(profile.competences) : profile.competences) 
    : [];

  const langues = profile.langues_parlees ? 
    (typeof profile.langues_parlees === 'string' ? JSON.parse(profile.langues_parlees) : profile.langues_parlees) 
    : [];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Bouton retour */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/employer/list-freelancers')}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>

      {/* Header avec photo de couverture */}
      <Card className="overflow-hidden mb-6">
        <div className="relative h-48 bg-gradient-to-r from-primary-500 to-primary-700">
          {profile.image_couverture && (
            <img src={profile.image_couverture} alt="Couverture" className="w-full h-full object-cover" />
          )}
          <div className="absolute -bottom-16 left-6">
            <div className="h-32 w-32 rounded-full border-4 border-white bg-gradient-to-br from-primary-500 to-primary-700 overflow-hidden flex items-center justify-center">
              {profileService.getProfileImage(profile) ? (
                <img 
                  src={profileService.getProfileImage(profile)} 
                  alt={`${profile.prenom} ${profile.nom}`} 
                  className="h-full w-full object-cover" 
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center font-bold bg-gradient-to-br from-[#2b4eef] to-[#df6422] text-white font-bold">
                  {profileService.getInitials(profile, 'freelancer')}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-20 px-6 pb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile.prenom} {profile.nom}
                </h1>
                <VerificationBadge 
                  status={profile.statut_verification} 
                  premium={profile.forfait_badge_premium}
                  size="lg"
                  showText={true}
                />
              </div>
              {profile.poste && (
                <p className="text-lg text-gray-600 mt-1">{profile.poste}</p>
              )}
            </div>

            {/* Statistiques d'évaluation */}
            {evaluationStats && evaluationStats.total_evaluations > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-3 rounded-lg border border-yellow-200">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                    <span className="text-2xl font-bold text-gray-900">
                      {parseFloat(evaluationStats.note_moyenne).toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {evaluationStats.total_evaluations} avis
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <Button 
              onClick={handleContact} 
              className="flex items-center"
              disabled={contactLoading}
              loading={contactLoading}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {contactLoading ? 'Connexion...' : 'Contacter'}
            </Button>
          </div>

          {/* Informations rapides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {profile.adresse && (
              <div className="flex items-center text-gray-600">
                <MapPin className="h-5 w-5 mr-2" />
                <span>{profile.adresse}</span>
              </div>
            )}
            {profile.email && (
              <div className="flex items-center text-gray-600">
                <Mail className="h-5 w-5 mr-2" />
                <span>{profile.email}</span>
              </div>
            )}
            {profile.telephone && (
              <div className="flex items-center text-gray-600">
                <PhoneCall className="h-5 w-5 mr-2" />
                <span>{profile.telephone}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* À propos */}
          {profile.a_propos && (
            <Card>
              <h2 className="text-xl font-semibold mb-4">À propos</h2>
              <p className="text-gray-700 whitespace-pre-line">{profile.a_propos}</p>
            </Card>
          )}

          {/* Compétences */}
          {Array.isArray(competences) && competences.length > 0 && (
            <Card>
              <h2 className="text-xl font-semibold mb-4">Compétences</h2>
              <div className="flex flex-wrap gap-2">
                {competences.map((skill, index) => (
                  <Badge key={index} variant="primary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Missions réalisées */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
              <span className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Missions réalisées
              </span>
              <Badge variant="info">{totalMissions}</Badge>
            </h3>
            {completedMissions.length > 0 ? (
              <div className="space-y-3">
                {completedMissions.slice(0, 5).map((mission, index) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4 py-2 bg-gray-50 rounded-r">
                    <h4 className="font-medium text-gray-900">{mission.titre}</h4>
                    {mission.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{mission.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Complétée le {new Date(mission.date_completion || mission.date_creation).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                ))}
                {totalMissions > 5 && (
                  <p className="text-sm text-gray-500 text-center pt-2">
                    + {totalMissions - 5} autre{totalMissions - 5 > 1 ? 's' : ''} mission{totalMissions - 5 > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Aucune mission réalisée pour le moment</p>
            )}
          </Card>

          {/* Portfolio */}
          {profile.portfolio_url && (
            <Card>
              <h2 className="text-xl font-semibold mb-4">Portfolio</h2>
              <a 
                href={profile.portfolio_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline flex items-center"
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Voir mon portfolio
              </a>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informations professionnelles */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Informations</h3>
            <div className="space-y-3">
              {profile.experience && (
                <div>
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    Expérience
                  </div>
                  <p className="text-gray-900 ml-6">{profile.experience} ans</p>
                </div>
              )}

              {profile.tarif_journalier && (
                <div>
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <Euro className="h-4 w-4 mr-2" />
                    Tarif journalier
                  </div>
                  <p className="text-gray-900 ml-6">{profile.tarif_journalier}€</p>
                </div>
              )}

              {profile.disponibilite && (
                <div>
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    Disponibilité
                  </div>
                  <Badge variant={profile.disponibilite === 'disponible' ? 'success' : 'warning'}>
                    {profile.disponibilite}
                  </Badge>
                </div>
              )}
            </div>
          </Card>

          {/* Langues */}
          {Array.isArray(langues) && langues.length > 0 && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Languages className="h-5 w-5 mr-2" />
                Langues
              </h3>
              <div className="flex flex-wrap gap-2">
                {langues.map((langue, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm capitalize"
                  >
                    {langue}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Statut de vérification */}
          {profile.statut_verification && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Vérification</h3>
              <Badge variant={profile.statut_verification === 'verifie' ? 'success' : 'info'}>
                {profile.statut_verification === 'verifie' ? '✓ Profil vérifié' : 'En attente'}
              </Badge>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployerViewFreelancer;

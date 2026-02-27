import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Briefcase, Mail, PhoneCall, Globe, Star, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { profileService } from '../services/profileService';
import { profileViewService } from '../services/profileViewService';
import { evaluationService } from '../services/evaluationService';
import LabelBadge from '../components/LabelBadge';

const FreelancerPublicProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluationStats, setEvaluationStats] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/users/public-profile/${username}`);
        if (response.data && response.data.success) {
          // Synchroniser les images de profil
          const syncedProfile = profileService.syncProfileImages(response.data.data);
          setProfile(syncedProfile);
          // Enregistrer la vue du profil
          if (syncedProfile.id) {
            profileViewService.trackProfileView(syncedProfile.id).catch(err => {
              console.log('Erreur tracking vue profil:', err);
            });
            
            // Récupérer les statistiques d'évaluation
            evaluationService.getFreelancerEvaluations(syncedProfile.id, 1, 1)
              .then(evalResponse => {
                if (evalResponse.data && evalResponse.data.success) {
                  setEvaluationStats(evalResponse.data.data.stats);
                }
              })
              .catch(err => {
                console.log('Erreur chargement évaluations:', err);
              });
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  if (loading) return <div>Chargement...</div>;
  if (!profile) return <div>Profil non trouvé</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Bouton retour */}
      <div className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Retour
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-32 relative">
          <div className="absolute -bottom-16 left-6">
            <div className="h-32 w-32 rounded-full border-4 border-white bg-gradient-to-br from-primary-500 to-primary-700 overflow-hidden flex items-center justify-center">
              {profileService.getProfileImage(profile) ? (
                <img src={profileService.getProfileImage(profile)} alt={`${profile.prenom} ${profile.nom}`} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-white text-3xl font-bold">
                  {profileService.getInitials(profile, 'freelancer')}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-20 px-6 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{profile.prenom} {profile.nom}</h1>
                <LabelBadge userId={profile.id} size="md" />
              </div>
              {profile.titre && <p className="text-gray-600">{profile.titre}</p>}
            </div>
            
            {/* Statistiques d'évaluation */}
            {evaluationStats && evaluationStats.total_evaluations > 0 && (
              <div className="flex items-center space-x-4 bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-3 rounded-lg border border-yellow-200">
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
            <h2 className="text-xl font-semibold mb-4">À propos</h2>
            <p className="text-gray-700">{profile.bio || 'Aucune biographie fournie.'}</p>
          </div>

          <div className="mt-6">
            <h3 className="font-medium mb-2">Compétences</h3>
            <div className="flex flex-wrap gap-2">
              {profile.competences?.map((skill, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {skill}
                </span>
              )) || 'Aucune compétence renseignée'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreelancerPublicProfile;

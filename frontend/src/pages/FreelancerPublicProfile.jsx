import { useState, useEffect } from 'react';
import PageLoader from '../components/PageLoader'
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, MapPin, Globe, Star, ArrowLeft, MessageSquare, Briefcase, Calendar } from 'lucide-react';
import api from '../services/api';
import { profileService } from '../services/profileService';
import { profileViewService } from '../services/profileViewService';
import { evaluationService } from '../services/evaluationService';
import VerificationBadge from '../components/VerificationBadge';

const FreelancerPublicProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluationStats, setEvaluationStats] = useState(null);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/users/public-profile/${username}`);
        if (response.data && response.data.success) {
          const syncedProfile = profileService.syncProfileImages((response.data?.data || response.data));
          setProfile(syncedProfile);
          document.title = `${profileService.getDisplayName(syncedProfile, 'freelancer')} - Profil prestataire - Indebel`;
          if (syncedProfile.id) {
            profileViewService.trackProfileView(syncedProfile.id).catch(()=>{});
            
            evaluationService.getFreelancerEvaluations(syncedProfile.id, 1, 1)
              .then(evalResponse => {
                if (evalResponse.data && evalResponse.data.success) {
                  setEvaluationStats((evalResponse.data?.data || evalResponse.data).stats);
                }
              })
              .catch(()=>{});
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  if (loading) return <PageLoader />
  
  if (!profile) return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-12 text-center">
        <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Briefcase className="h-12 w-12 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Profil introuvable</h3>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Le profil de prestataire que vous recherchez n'existe pas ou n'est plus disponible.
        </p>
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center justify-center px-6 py-3 rounded-full font-medium hover:bg-slate-800 transition-colors shadow-sm bg-gradient-to-br from-[#2b4eef] to-[#df6422] text-white font-bold"
        >
          Retour
        </button>
      </div>
    </div>
  );

  const coverImage = profileService.getCoverImage(profile);
  const profileImage = profileService.getProfileImage(profile);
  const displayName = `${profile.prenom} ${profile.nom}`;
  const initials = profileService.getInitials(profile, 'freelancer');

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-slate-500 hover:text-slate-800 transition-colors font-medium mb-4 px-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Retour
      </button>

      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden relative">
        
        {/* Cover Photo */}
        <div 
          className="h-48 md:h-64 bg-slate-100 relative"
          style={{
            backgroundImage: coverImage ? `url(${coverImage})` : 'linear-gradient(to right, #f8fafc, #e2e8f0)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />

        {/* Profile Content */}
        <div className="px-6 md:px-8 pb-8 relative">
          
          {/* Avatar & Action Button Row */}
          <div className="flex justify-between items-end -mt-16 mb-4 relative z-10">
            <div className="relative">
              <div className="h-32 w-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center">
                {profileImage ? (
                  <img src={profileImage} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-blue-50 flex items-center justify-center text-blue-600 text-3xl font-bold">
                    {initials}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => navigate(`/employer/mes-messages?contact=${profile.id}`)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 hover:-translate-y-0.5 transition-all shadow-sm"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Message</span>
              </button>
            </div>
          </div>

          {/* Name & Title */}
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
              <VerificationBadge status={profile.statut_verification || 'non_verifie'} premium={profile.forfait_badge_premium} size="md" showText={true} />
            </div>
            {profile.titre && (
              <p className="text-slate-600 font-medium text-lg mt-0.5">{profile.titre}</p>
            )}
          </div>

          {/* Stats Bar */}
          {evaluationStats && evaluationStats.total_evaluations > 0 && (
            <div className="flex items-center gap-4 mb-5">
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span className="font-bold text-slate-800">{parseFloat(evaluationStats.note_moyenne).toFixed(1)}</span>
                <span className="text-slate-500 text-sm">({evaluationStats.total_evaluations} avis)</span>
              </div>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <div className="mb-5 text-slate-800 leading-relaxed max-w-2xl whitespace-pre-line">
              {profile.bio}
            </div>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500 mb-6">
            {profile.adresse && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {profile.adresse}
              </div>
            )}
            {profile.date_creation && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> Inscrit en {new Date(profile.date_creation).toLocaleDateString('fr-FR', {month:'long', year:'numeric'})}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-slate-100 mb-6">
            <button 
              onClick={() => setActiveTab('about')}
              className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'about' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Aperçu
              {activeTab === 'about' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 rounded-t-full"></div>}
            </button>
            <button 
              onClick={() => setActiveTab('skills')}
              className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'skills' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Compétences
              {activeTab === 'skills' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 rounded-t-full"></div>}
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'about' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-xs text-slate-500 block mb-1">Disponibilité</span>
                <span className="font-medium text-slate-800">{profile.disponibilite || 'Non renseigné'}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-xs text-slate-500 block mb-1">Langues</span>
                <span className="font-medium text-slate-800">
                  {(() => {
                    let lg = [];
                    try {
                      lg = typeof profile.langues_parlees === 'string' ? JSON.parse(profile.langues_parlees) : profile.langues_parlees;
                    } catch(e) {}
                    return (Array.isArray(lg) && lg.length > 0) ? lg.join(', ') : 'Non renseigné';
                  })()}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'skills' && (
            <div>
              <div className="flex flex-wrap gap-2">
                {profile.competences && profile.competences.length > 0 ? (
                  profile.competences.map((skill, index) => (
                    <span key={index} className="px-4 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 font-medium text-sm rounded-full">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm">Aucune compétence renseignée.</p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default FreelancerPublicProfile;

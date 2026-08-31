import { useState, useEffect } from 'react';
import PageLoader from '../components/PageLoader'
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, MapPin, Globe, Briefcase, Users, Calendar, Facebook as FacebookIcon, Instagram, Languages, MessageSquare, ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { profileService } from '../services/profileService';
import { profileViewService } from '../services/profileViewService';
import Badge from '../components/Badge';
import VerificationBadge from '../components/VerificationBadge';

const EmployerPublicProfile = () => {
  const { companyName } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishedMissions, setPublishedMissions] = useState([]);
  const [publishedDevis, setPublishedDevis] = useState([]);
  const [totalMissions, setTotalMissions] = useState(0);
  const [activeTab, setActiveTab] = useState('missions');
  
  const handleSendMessage = () => {
    if (!profile) return;
    navigate(`/freelancer/mes-messages?contact=${profile.id}`);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/users/public-profile/${companyName}`);
        if (response.data && response.data.success) {
          const syncedProfile = profileService.syncProfileImages((response.data?.data || response.data));
          setProfile(syncedProfile);
          document.title = `${profileService.getDisplayName(syncedProfile, 'employer')} - Profil entreprise - Indebel`;
          if (syncedProfile.id) {
            profileViewService.trackProfileView(syncedProfile.id).catch(() => {});
            fetchPublishedMissions(syncedProfile.id);
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
  }, [companyName]);

  const fetchPublishedMissions = async (employerId) => {
    try {
      const response = await api.get(`/users/${employerId}/published-missions`);
      if (response.data && response.data.success) {
        setPublishedMissions(response.data.missions || []);
        setPublishedDevis(response.data.demandes_devis || []);
        setTotalMissions(response.data.total || 0);
      }
    } catch (error) {
      setPublishedMissions([]);
      setPublishedDevis([]);
      setTotalMissions(0);
    }
  };

  if (loading) {
    return <PageLoader />
  }
  
  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-12 text-center">
          <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-12 w-12 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Profil introuvable</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Le profil d'entreprise que vous recherchez n'existe pas ou n'est plus disponible.
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
  }

  const coverImage = profileService.getCoverImage(profile);
  const profileImage = profileService.getProfileImage(profile);
  const displayName = profileService.getDisplayName(profile, 'employer');
  const initials = profileService.getInitials(profile, 'employer');

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
            backgroundImage: coverImage ? `url(${coverImage})` : 'linear-gradient(to right, #f1f5f9, #e2e8f0)',
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
                  <div className="h-full w-full bg-primary-50 flex items-center justify-center text-primary-600 text-3xl font-bold">
                    {initials}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handleSendMessage}
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
            {profile.secteur && (
              <div className="flex items-center text-slate-500 font-medium gap-1.5 mt-1"><Briefcase className="h-4 w-4" /><span>{profile.secteur}</span></div>
            )}
          </div>

          {/* Bio */}
          {profile.description_entreprise && (
            <div className="mb-5 text-slate-800 leading-relaxed max-w-2xl">
              {profile.description_entreprise}
            </div>
          )}

          {/* Meta Info (Location, Date, Website) */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500 mb-6">
            {profile.adresse && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {profile.adresse}
              </div>
            )}
            {profile.site_web && (
              <div className="flex items-center gap-1.5">
                <Globe className="h-4 w-4" /> 
                <a href={profile.site_web} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">Site web</a>
              </div>
            )}
            {profile.date_creation && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> Inscrit en {new Date(profile.date_creation).toLocaleDateString('fr-FR', {month:'long', year:'numeric'})}
              </div>
            )}
          </div>

          {/* Social Links */}
          {(profile.facebook || profile.instagram) && (
            <div className="flex gap-3 mb-6">
              {profile.facebook && (
                <a href={profile.facebook} target="_blank" rel="noreferrer" className="p-2 bg-slate-50 text-slate-600 hover:text-blue-600 rounded-full transition-colors">
                  <FacebookIcon className="h-5 w-5" />
                </a>
              )}
              {profile.instagram && (
                <a href={profile.instagram} target="_blank" rel="noreferrer" className="p-2 bg-slate-50 text-slate-600 hover:text-pink-600 rounded-full transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-6 border-b border-slate-100 mb-6">
            <button 
              onClick={() => setActiveTab('missions')}
              className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'missions' ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Missions ({publishedMissions.length})
              {activeTab === 'missions' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 rounded-t-full"></div>}
            </button>
            <button 
              onClick={() => setActiveTab('devis')}
              className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'devis' ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Demandes de devis ({publishedDevis.length})
              {activeTab === 'devis' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 rounded-t-full"></div>}
            </button>
            <button 
              onClick={() => setActiveTab('details')}
              className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'details' ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Détails
              {activeTab === 'details' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 rounded-t-full"></div>}
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'missions' && (
            <div className="space-y-4">
              {publishedMissions.length > 0 ? (
                publishedMissions.map((mission, index) => (
                  <div key={index} className="p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                    <h4 className="font-bold text-slate-900">{mission.titre}</h4>
                    {mission.description && (
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2">{mission.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs text-slate-400">{new Date(mission.date_creation).toLocaleDateString('fr-FR')}</span>
                      {mission.statut && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${mission.statut === 'ouvert' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                          {mission.statut.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-2xl">
                  Aucune mission publiée
                </div>
              )}
            </div>
          )}

          {activeTab === 'devis' && (
            <div className="space-y-4">
              {publishedDevis.length > 0 ? (
                publishedDevis.map((devis, index) => (
                  <div key={index} className="p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="font-bold text-slate-900">{devis.titre}</h4>
                      {devis.montant && (
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                          {devis.montant} €
                        </span>
                      )}
                    </div>
                    {devis.description && (
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2">{devis.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">
                          {new Date(devis.date_creation).toLocaleDateString('fr-FR')}
                        </span>
                        {devis.statut && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            devis.statut === 'valide' || devis.statut === 'ouvert' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {devis.statut.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => navigate(`/devis/${devis.id}`)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Voir le devis →
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-2xl">
                  Aucune demande de devis publiée
                </div>
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile.numero_bce && (
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <span className="text-xs text-slate-500 block mb-1">Numéro BCE</span>
                  <span className="font-medium text-slate-800">{profile.numero_bce}</span>
                </div>
              )}
              {profile.taille_entreprise && (
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <span className="text-xs text-slate-500 block mb-1">Taille d'entreprise</span>
                  <span className="font-medium text-slate-800">{profile.taille_entreprise}</span>
                </div>
              )}
              {profile.competences_recherchees && (
                <div className="p-4 bg-slate-50 rounded-2xl sm:col-span-2">
                  <span className="text-xs text-slate-500 block mb-2">Compétences fréquemment recherchées</span>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      let comps = [];
                      try {
                        comps = typeof profile.competences_recherchees === 'string' ? JSON.parse(profile.competences_recherchees) : profile.competences_recherchees;
                      } catch(e) {}
                      return Array.isArray(comps) ? comps.map((c, i) => (
                        <span key={i} className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs rounded-full">{c}</span>
                      )) : null;
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default EmployerPublicProfile;

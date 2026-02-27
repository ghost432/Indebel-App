import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Mail, PhoneCall, Globe, Briefcase, MapPin, Users, CheckCircle, ArrowLeft, Award, Calendar, Facebook as FacebookIcon, Instagram, Languages, MessageSquare } from 'lucide-react';
import api from '../services/api';
import { profileService } from '../services/profileService';
import { profileViewService } from '../services/profileViewService';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { getCleanForfaitName } from '../utils/forfaitUtils'

const EmployerPublicProfile = () => {
  const { companyName } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishedMissions, setPublishedMissions] = useState([]);
  const [totalMissions, setTotalMissions] = useState(0);

  const handleSendMessage = () => {
    if (!profile) return;
    // Rediriger vers la messagerie avec l'employeur pré-sélectionné
    navigate(`/freelancer/messages?contact=${profile.id}`);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/users/public-profile/${companyName}`);
        if (response.data && response.data.success) {
          // Synchroniser les images de profil
          const syncedProfile = profileService.syncProfileImages(response.data.data);
          setProfile(syncedProfile);
          // Enregistrer la vue du profil
          if (syncedProfile.id) {
            profileViewService.trackProfileView(syncedProfile.id).catch(err => {
              console.log('Erreur tracking vue profil:', err);
            });
            fetchPublishedMissions(syncedProfile.id);
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
  }, [companyName]);

  const fetchPublishedMissions = async (employerId) => {
    try {
      console.log('Fetching missions for employer ID:', employerId);
      const response = await api.get(`/users/${employerId}/published-missions`);
      console.log('Missions response:', response.data);
      if (response.data && response.data.success) {
        setPublishedMissions(response.data.missions || []);
        setTotalMissions(response.data.total || 0);
      }
    } catch (error) {
      console.error('Error loading missions:', error);
      setPublishedMissions([]);
      setTotalMissions(0);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Profil recruteur non trouvé</p>
            <Button onClick={() => navigate(-1)} className="mt-4">
              Retour
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const coverImage = profileService.getCoverImage(profile);
  const profileImage = profileService.getProfileImage(profile);
  const displayName = profileService.getDisplayName(profile, 'employer');
  const initials = profileService.getInitials(profile, 'employer');

  return (
    <div className="max-w-6xl mx-auto">
      {/* Boutons action */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Button
          variant="outline"
          onClick={() => navigate('/freelancer/list-employers')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <Button
          onClick={handleSendMessage}
          className="flex items-center"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Envoyer un message
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Image de couverture */}
        <div
          className="h-48 md:h-64 relative bg-gradient-to-r from-blue-500 to-blue-700"
          style={{
            backgroundImage: coverImage ? `url(${coverImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Photo de profil */}
          <div className="absolute -bottom-16 left-6">
            <div className="relative">
              <div className="h-32 w-32 rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-blue-700 overflow-hidden flex items-center justify-center">
                {profileImage ? (
                  <img src={profileImage} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-white text-3xl font-bold">
                    {initials}
                  </div>
                )}
              </div>
              {/* Badge de vérification */}
              {profile.statut_verification === 'verifie' && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 border-2 border-white">
                  <CheckCircle className="h-5 w-5 text-white" fill="currentColor" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-20 px-6 pb-6">
          {/* Nom et badge */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{displayName}</h1>
            {profile.statut_verification === 'verifie' && (
              <Badge variant="success" className="flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                Vérifié
              </Badge>
            )}
          </div>

          {/* Informations principales en grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {profile.numero_bce && (
              <div className="flex items-center text-gray-700">
                <Building2 className="h-5 w-5 mr-2 text-gray-400" />
                <div>
                  <span className="text-xs text-gray-500">Numéro BCE</span>
                  <p className="font-medium">{profile.numero_bce}</p>
                </div>
              </div>
            )}

            {profile.secteur && (
              <div className="flex items-center text-gray-700">
                <Briefcase className="h-5 w-5 mr-2 text-gray-400" />
                <div>
                  <span className="text-xs text-gray-500">Secteur</span>
                  <p className="font-medium">{profile.secteur}</p>
                </div>
              </div>
            )}

            {profile.taille_recruteur && (
              <div className="flex items-center text-gray-700">
                <Users className="h-5 w-5 mr-2 text-gray-400" />
                <div>
                  <span className="text-xs text-gray-500">Taille</span>
                  <p className="font-medium">{profile.taille_recruteur}</p>
                </div>
              </div>
            )}

            {profile.adresse && (
              <div className="flex items-center text-gray-700">
                <MapPin className="h-5 w-5 mr-2 text-gray-400" />
                <div>
                  <span className="text-xs text-gray-500">Adresse</span>
                  <p className="font-medium">{profile.adresse}</p>
                </div>
              </div>
            )}

            {profile.site_web && (
              <div className="flex items-center text-gray-700">
                <Globe className="h-5 w-5 mr-2 text-gray-400" />
                <div>
                  <span className="text-xs text-gray-500">Site web</span>
                  <a
                    href={profile.site_web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    Visiter
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Informations additionnelles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {/* Langues parlées */}
            {profile.langues_parlees && (() => {
              let langues = [];
              try {
                if (Array.isArray(profile.langues_parlees)) {
                  langues = profile.langues_parlees;
                } else if (typeof profile.langues_parlees === 'string' && profile.langues_parlees.trim()) {
                  langues = JSON.parse(profile.langues_parlees);
                }
              } catch (e) {
                langues = [];
              }

              if (langues.length === 0) return null;

              return (
                <div className="flex items-start text-gray-700">
                  <Languages className="h-5 w-5 mr-2 text-gray-400 mt-0.5" />
                  <div>
                    <span className="text-xs text-gray-500">Langues parlées</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {langues.map((langue, index) => (
                        <span key={index} className="text-sm font-medium">
                          {langue}{index < langues.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Date d'inscription */}
            {profile.date_creation && (
              <div className="flex items-center text-gray-700">
                <Calendar className="h-5 w-5 mr-2 text-gray-400" />
                <div>
                  <span className="text-xs text-gray-500">Membre depuis</span>
                  <p className="font-medium">
                    {new Date(profile.date_creation).toLocaleDateString('fr-FR', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Réseaux sociaux */}
          {(profile.facebook || profile.instagram) && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Réseaux sociaux</h3>
              <div className="flex gap-4">
                {profile.facebook && (
                  <a
                    href={profile.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <FacebookIcon className="h-4 w-4" />
                    Facebook
                  </a>
                )}
                {profile.instagram && (
                  <a
                    href={profile.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition"
                  >
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {profile.description_recruteur && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-3">À propos</h2>
              <p className="text-gray-700 whitespace-pre-line">{profile.description_recruteur}</p>
            </div>
          )}

          {/* Compétences recherchées */}
          {profile.competences_recherchees && (() => {
            let competences = [];
            try {
              if (Array.isArray(profile.competences_recherchees)) {
                competences = profile.competences_recherchees;
              } else if (typeof profile.competences_recherchees === 'string' && profile.competences_recherchees.trim()) {
                competences = JSON.parse(profile.competences_recherchees);
              }
            } catch (e) {
              competences = [];
            }

            if (!Array.isArray(competences) || competences.length === 0) return null;

            return (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Compétences recherchées</h3>
                <div className="flex flex-wrap gap-2">
                  {competences.map((comp, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {comp}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Missions publiées */}
          <div className="mt-6">
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
                <span className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Missions publiées
                </span>
                <Badge variant="info">{totalMissions}</Badge>
              </h3>
              {publishedMissions.length > 0 ? (
                <div className="space-y-3">
                  {publishedMissions.slice(0, 5).map((mission, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r">
                      <h4 className="font-medium text-gray-900">{mission.titre}</h4>
                      {mission.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{mission.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-xs text-gray-500">
                          Publiée le {new Date(mission.date_creation).toLocaleDateString('fr-FR')}
                        </p>
                        {mission.statut && (
                          <Badge variant={mission.statut === 'ouvert' ? 'success' : mission.statut === 'en_cours' ? 'warning' : 'default'}>
                            {mission.statut}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {totalMissions > 5 && (
                    <p className="text-sm text-gray-500 text-center pt-2">
                      + {totalMissions - 5} autre{totalMissions - 5 > 1 ? 's' : ''} mission{totalMissions - 5 > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Aucune mission publiée pour le moment</p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerPublicProfile;

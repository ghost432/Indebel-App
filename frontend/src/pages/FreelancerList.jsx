import { useState, useEffect } from 'react'
import { Search, User, Mail, Briefcase, Eye, MapPin, Star, Filter } from 'lucide-react'
import verifiedBadge from '../images/2.png';
import unverifiedBadge from '../images/1.png';
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import LabelBadge from '../components/LabelBadge'
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
import { userService } from '../services/userService'
import { evaluationService } from '../services/evaluationService'
import { profileService } from '../services/profileService'
import axios from 'axios'
import { API_BASE_URL } from '../config'
import toast from 'react-hot-toast'

const FreelancerList = () => {
  const navigate = useNavigate()
  const [freelancers, setFreelancers] = useState([])
  const [filteredFreelancers, setFilteredFreelancers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSecteur, setSelectedSecteur] = useState('')
  const [secteurs, setSecteurs] = useState([])
  const [selectedFreelancer, setSelectedFreelancer] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [evaluationsStats, setEvaluationsStats] = useState({})

  // Pagination
  const { currentItems, currentPage, totalPages, goToPage, totalItems } = usePagination(filteredFreelancers, 12)

  useEffect(() => {
    document.title = 'Liste des Prestataires - Indebel'
    fetchFreelancers()
    fetchSecteurs()
  }, [])

  useEffect(() => {
    filterFreelancers()
  }, [searchTerm, selectedSecteur, freelancers])

  const fetchFreelancers = async () => {
    try {
      const response = await userService.getFreelancers();
      console.log('Réponse des freelancers:', response);
      
      // Vérifier la structure de la réponse
      const freelancersList = Array.isArray(response.data) 
        ? response.data 
        : response.data?.data || [];
      
      console.log('Liste des freelancers:', freelancersList);
      // Afficher les données de vérification pour débogage
      freelancersList.forEach(f => {
        console.log(`Freelancer ${f.prenom} ${f.nom}:`, {
          role: f.role,
          statut_verification: f.statut_verification,
          verification_identite_status: f.verification_identite_status
        });
      });
      
      // Filtrer pour s'assurer que les champs requis existent
      const validFreelancers = freelancersList.filter(freelancer => 
        freelancer.prenom && 
        freelancer.nom
      );
      
      console.log('Freelancers valides:', validFreelancers);
      
      // Synchroniser les images de profil pour chaque freelancer
      const syncedFreelancers = validFreelancers.map(f => profileService.syncProfileImages(f));
      
      setFreelancers(syncedFreelancers);
      setFilteredFreelancers(syncedFreelancers);
      
      // Récupérer les stats d'évaluation pour chaque freelancer
      validFreelancers.forEach(freelancer => {
        evaluationService.getFreelancerEvaluations(freelancer.id, 1, 1)
          .then(response => {
            if (response.data && response.data.success) {
              setEvaluationsStats(prev => ({
                ...prev,
                [freelancer.id]: response.data.data.stats
              }));
            }
          })
          .catch(err => console.log('Erreur évaluations:', err));
      });
    } catch (error) {
      console.error('Erreur lors du chargement des prestataires:', error);
      toast.error('Erreur lors du chargement des prestataires');
    } finally {
      setLoading(false);
    }
  }

  const fetchSecteurs = async () => {
    // Liste statique des secteurs pour éviter les problèmes d'autorisation
    const secteursList = [
      { id: 1, nom: 'Rénovation & Construction', description: 'Travaux de rénovation et construction' },
      { id: 2, nom: 'Transport & Logistique', description: 'Transport de marchandises et logistique' },
      { id: 3, nom: 'Nettoyage & Multiservices', description: 'Services de nettoyage et multiservices' }
    ];
    setSecteurs(secteursList);
  }

  const filterFreelancers = () => {
    let filtered = freelancers

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(freelancer =>
        freelancer.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        freelancer.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        freelancer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        freelancer.secteur?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtre par secteur
    if (selectedSecteur) {
      filtered = filtered.filter(freelancer => 
        freelancer.secteur === selectedSecteur
      )
    }

    setFilteredFreelancers(filtered)
  }

  const viewFreelancer = (freelancer) => {
    // Créer un slug à partir du prénom et nom
    const slug = `${freelancer.prenom}-${freelancer.nom}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    navigate(`/employer/list-freelancer/${slug}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Liste des Prestataires</h1>
        <Badge variant="info">{filteredFreelancers.length} Prestataire(s)</Badge>
      </div>

      {/* Search Bar and Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou secteur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={selectedSecteur}
            onChange={(e) => setSelectedSecteur(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="">Tous les secteurs</option>
            {secteurs.map((secteur) => (
              <option key={secteur.id} value={secteur.nom}>
                {secteur.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Freelancers Grid */}
      {filteredFreelancers.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Aucun prestataire ne correspond à votre recherche' : 'Aucun prestataire disponible'}
            </p>
          </div>
        </Card>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {currentItems.map((freelancer) => (
            <Card key={freelancer.id} className="hover:shadow-lg transition-shadow">
              <div className="text-center">
                {/* Avatar */}
                {(() => {
                  const profileImage = profileService.getProfileImage(freelancer);
                  return profileImage ? (
                    <img 
                      src={profileImage}
                      alt={`${freelancer.prenom} ${freelancer.nom}`}
                      className="h-20 w-20 rounded-full object-cover mx-auto mb-4 border-2 border-gray-200"
                    />
                  ) : (
                    <div className="h-20 w-20 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                      {profileService.getInitials(freelancer, 'freelancer')}
                    </div>
                  );
                })()}

                {/* Info */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {freelancer.prenom} {freelancer.nom}
                  </h3>
                  <LabelBadge userId={freelancer.id} size="sm" />
                  {(freelancer.verification_identite_status === 'valide' || freelancer.role === 'employer') && (
                    <img 
                      src={verifiedBadge}
                      alt="Profil vérifié"
                      className="h-5 w-5"
                      title="Profil vérifié"
                    />
                  )}
                  {freelancer.verification_identite_status === 'en_attente' && freelancer.role !== 'employer' && (
                    <img 
                      src={unverifiedBadge}
                      alt="Vérification en cours"
                      className="h-5 w-5 opacity-50"
                      title="Vérification en cours"
                    />
                  )}
                  {freelancer.verification_identite_status === 'non_verifie' && freelancer.role !== 'employer' && (
                    <img 
                      src={unverifiedBadge}
                      alt="Profil non vérifié"
                      className="h-5 w-5 opacity-30"
                      title="Profil non vérifié"
                    />
                  )}
                </div>

                {/* Statistiques d'évaluation */}
                {evaluationsStats[freelancer.id] && evaluationsStats[freelancer.id].total_evaluations > 0 && (
                  <div className="flex items-center justify-center space-x-1 mb-3">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-semibold text-gray-900">
                      {parseFloat(evaluationsStats[freelancer.id].note_moyenne).toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({evaluationsStats[freelancer.id].total_evaluations} avis)
                    </span>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  {freelancer.secteur && (
                    <div className="flex items-center justify-center text-sm text-gray-600">
                      <Briefcase className="h-4 w-4 mr-2" />
                      <span>{freelancer.secteur}</span>
                    </div>
                  )}

                  {freelancer.pays_code && (
                    <div className="flex items-center justify-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{freelancer.pays_code}</span>
                    </div>
                  )}
                </div>

                {/* Competences */}
                {(() => {
                  try {
                    // Vérifier si des compétences existent et sont valides
                    if (!freelancer.competences) return null;
                    
                    // Essayer de parser les compétences
                    const skills = typeof freelancer.competences === 'string' 
                      ? JSON.parse(freelancer.competences)
                      : Array.isArray(freelancer.competences)
                        ? freelancer.competences
                        : [];
                    
                    // Si pas de compétences, ne rien afficher
                    if (!skills.length) return null;
                    
                    return (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2 justify-center">
                          {skills.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                            >
                              {typeof skill === 'string' ? skill : 'Compétence'}
                            </span>
                          ))}
                          {skills.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{skills.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  } catch (error) {
                    console.error('Erreur lors de l\'affichage des compétences:', error);
                    return null;
                  }
                })()}

                {/* Button */}
                <Button
                  onClick={() => viewFreelancer(freelancer)}
                  variant="outline"
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Voir le profil
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            itemsPerPage={12}
            totalItems={totalItems}
          />
        )}
        </>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Détails de le Prestataire"
      >
        {selectedFreelancer && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="h-24 w-24 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
                {selectedFreelancer.nom?.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedFreelancer.nom} {selectedFreelancer.prenom}
              </h3>
              <Badge variant="success" className="mt-2">Prestataire</Badge>
            </div>

            <div className="space-y-3 border-t pt-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{selectedFreelancer.email}</p>
              </div>

              {selectedFreelancer.telephone && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Téléphone</label>
                  <p className="text-gray-900">{selectedFreelancer.indicatif} {selectedFreelancer.telephone}</p>
                </div>
              )}

              {selectedFreelancer.secteur && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Secteur</label>
                  <p className="text-gray-900">{selectedFreelancer.secteur}</p>
                </div>
              )}

              {selectedFreelancer.competences && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Compétences</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {JSON.parse(selectedFreelancer.competences || '[]').map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedFreelancer.pays_code && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Pays</label>
                  <p className="text-gray-900">{selectedFreelancer.pays_code}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Membre depuis</label>
                <p className="text-gray-900">
                  {new Date(selectedFreelancer.date_creation).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default FreelancerList

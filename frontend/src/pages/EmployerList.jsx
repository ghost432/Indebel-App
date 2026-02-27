import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Building2, Mail, Briefcase, Eye, MapPin, MessageSquare, Filter } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Badge from '../components/Badge'
import LabelBadge from '../components/LabelBadge'
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
import { userService } from '../services/userService'
import { messageService } from '../services/messageService'
import { profileService } from '../services/profileService'
import toast from 'react-hot-toast'

const EmployerList = () => {
  const navigate = useNavigate()
  const [employers, setEmployers] = useState([])
  const [filteredEmployers, setFilteredEmployers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSecteur, setSelectedSecteur] = useState('')
  const [secteurs, setSecteurs] = useState([])
  const [contactLoading, setContactLoading] = useState(false)

  // Pagination
  const { currentItems, currentPage, totalPages, goToPage, totalItems } = usePagination(filteredEmployers, 12)

  useEffect(() => {
    document.title = 'Liste des Recruteurs - Indebel'
    fetchEmployers()
    fetchSecteurs()
  }, [])

  useEffect(() => {
    filterEmployers()
  }, [searchTerm, selectedSecteur, employers])

  const fetchEmployers = async () => {
    setLoading(true)
    try {
      // Utiliser getEmployers() qui filtre automatiquement les employeurs vérifiés
      const response = await userService.getEmployers()
      console.log('Réponse complète du serveur:', response);
      
      if (response?.data) {
        // S'assurer que nous avons bien un tableau dans response.data
        const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
        console.log('Données des employeurs:', data);
        
        // Synchroniser les images de profil pour chaque employeur
        const syncedEmployers = data.map(emp => profileService.syncProfileImages(emp));
        
        setEmployers(syncedEmployers);
        setFilteredEmployers(syncedEmployers);
      } else {
        console.error('Format de réponse inattendu:', response);
        toast.error('Aucune donnée reçue du serveur');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des recruteurs:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors du chargement des recruteurs';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const fetchSecteurs = () => {
    // Liste statique des secteurs
    const secteursList = [
      { id: 1, nom: 'Rénovation & Construction', description: 'Travaux de rénovation et construction' },
      { id: 2, nom: 'Transport & Logistique', description: 'Transport de marchandises et logistique' },
      { id: 3, nom: 'Nettoyage & Multiservices', description: 'Services de nettoyage et multiservices' }
    ];
    setSecteurs(secteursList);
  }

  const filterEmployers = () => {
    let filtered = employers

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(employer =>
        employer.denomination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employer.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employer.secteur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employer.numero_bce?.includes(searchTerm)
      )
    }

    // Filtre par secteur
    if (selectedSecteur) {
      filtered = filtered.filter(employer => 
        employer.secteur === selectedSecteur
      )
    }

    setFilteredEmployers(filtered)
  }

  const handleViewDetails = (employer) => {
    // Créer un slug à partir de la dénomination
    const slug = (employer.denomination || employer.nom)
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    navigate(`/freelancer/list-employers/${slug}`);
  }

  const handleContact = async (employer) => {
    if (!employer) return;
    
    setContactLoading(true);
    try {
      // Récupérer les conversations existantes
      const conversationsResponse = await messageService.getConversations();
      const conversations = conversationsResponse.data || conversationsResponse || [];
      
      // Chercher une conversation existante avec cet employeur
      const existingConversation = conversations.find(conv => {
        return conv.participant_id === employer.id || 
               conv.user1_id === employer.id || 
               conv.user2_id === employer.id;
      });
      
      if (existingConversation) {
        toast.success('Redirection vers la conversation existante');
        navigate(`/freelancer/mes-messages?conversation_id=${existingConversation.id}`);
      } else {
        // Créer une nouvelle conversation
        const newConversation = await messageService.createConversation({
          recipientId: employer.id,
          recipientType: 'employer'
        });
        
        const conversationId = newConversation.data?.id || newConversation.id;
        toast.success('Nouvelle conversation créée');
        navigate(`/freelancer/mes-messages?conversation_id=${conversationId}`);
      }
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
      toast.error('Erreur lors de la création de la conversation');
      navigate('/freelancer/mes-messages');
    } finally {
      setContactLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="text-gray-600">Chargement des recruteurs...</p>
      </div>
    )
  }
  
  if (filteredEmployers.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune recruteur trouvée</h3>
        <p className="mt-1 text-sm text-gray-500">
          {searchTerm 
            ? 'Aucune recruteur ne correspond à votre recherche.' 
            : 'Aucune recruteur inscrite pour le moment.'}
        </p>
        <div className="mt-6">
          <Button onClick={fetchEmployers} variant="outline">
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Liste des Recruteurs</h1>
        <Badge variant="info">{filteredEmployers.length} Recruteur(s)</Badge>
      </div>

      {/* Search Bar and Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, secteur ou numéro BCE..."
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

      {/* Employers Grid */}
      {filteredEmployers.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Aucune recruteur ne correspond à votre recherche' : 'Aucune recruteur disponible'}
            </p>
          </div>
        </Card>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {currentItems.map((employer) => (
            <Card key={employer.id} className="hover:shadow-lg transition-shadow">
              <div className="text-center">
                {/* Avatar */}
                <div className="relative inline-block mb-4">
                  <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto overflow-hidden">
                    {profileService.getProfileImage(employer) ? (
                      <img 
                        src={profileService.getProfileImage(employer)} 
                        alt={profileService.getDisplayName(employer, 'employer')} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      profileService.getInitials(employer, 'employer')
                    )}
                  </div>
                  {/* Badge de vérification */}
                  {employer.statut_verification === 'verifie' && (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
                      <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex items-center justify-center gap-2 mb-1 px-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {profileService.getDisplayName(employer, 'employer')}
                  </h3>
                  <LabelBadge userId={employer.id} size="sm" />
                </div>
                
                {/* Badge vérifié */}
                {employer.statut_verification === 'verifie' && (
                  <div className="flex items-center justify-center mb-3">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center">
                      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      Vérifié
                    </span>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  {employer.numero_bce && (
                    <div className="flex items-center justify-center text-sm text-gray-600">
                      <Building2 className="h-4 w-4 mr-2" />
                      <span>BCE: {employer.numero_bce}</span>
                    </div>
                  )}

                  {employer.secteur && (
                    <div className="flex items-center justify-center text-sm text-gray-600">
                      <Briefcase className="h-4 w-4 mr-2" />
                      <span>{employer.secteur}</span>
                    </div>
                  )}

                  {employer.pays_code && (
                    <div className="flex items-center justify-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{employer.pays_code}</span>
                    </div>
                  )}
                </div>

                {/* Competences Recherchées */}
                {employer.competences_recherchees && (() => {
                  let competences = [];
                  try {
                    if (Array.isArray(employer.competences_recherchees)) {
                      competences = employer.competences_recherchees;
                    } else if (typeof employer.competences_recherchees === 'string' && employer.competences_recherchees.trim()) {
                      competences = JSON.parse(employer.competences_recherchees);
                    }
                  } catch (e) {
                    console.error('Erreur parsing competences_recherchees:', e);
                    competences = [];
                  }
                  
                  if (competences.length === 0) return null;
                  
                  return (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {competences.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {competences.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{competences.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Button */}
                <Button
                  onClick={() => handleViewDetails(employer)}
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
    </div>
  )
}

export default EmployerList

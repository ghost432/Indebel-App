import VerificationBadge from '../components/VerificationBadge'
import PageLoader from '../components/PageLoader'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Building2, Mail, Briefcase, Eye, MapPin, MessageSquare, Filter } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Badge from '../components/Badge'
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
import { userService } from '../services/userService'
import { messageService } from '../services/messageService'
import { profileService } from '../services/profileService'
import QuotaModal from '../components/devis/QuotaModal'
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
  const [quotaModal, setQuotaModal] = useState({ open: false, type: 'view', message: '' })

  // Pagination
  const { currentItems, currentPage, totalPages, goToPage, totalItems } = usePagination(filteredEmployers, 12)

  useEffect(() => {
    document.title = 'Liste des Entreprises - Indebel'
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
        const data = Array.isArray(response.data) ? response.data : ((response.data?.data || response.data) || []);
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
      if (error.response?.data?.code === 'LIST_ACCESS_DENIED') {
        setQuotaModal({ open: true, type: 'view', message: error.response.data.message });
      } else {
        console.error('Erreur lors du chargement des entreprises:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Erreur lors du chargement des entreprises';
        toast.error(errorMessage);
      }
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
    return <PageLoader label='Chargement des entreprises...' />
  }
  

  return (
    <div>
      <QuotaModal 
        open={quotaModal.open} 
        type={quotaModal.type} 
        message={quotaModal.message} 
        onClose={() => setQuotaModal({ ...quotaModal, open: false })} 
      />
            <section className="mb-8 rounded-[28px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-500">ANNUAIRE</p>
            <h1 className="mt-3 text-3xl md:text-4xl font-black text-[#082151]">Liste des Entreprises</h1>
            <p className="mt-2 text-slate-500 max-w-3xl text-lg">Parcourez les profils des recruteurs et entreprises inscrits sur Indebel.</p>
          </div>
          <Badge variant="info">{filteredEmployers.length} Entreprise(s)</Badge>
        </div>
      </section>

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
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-12 text-center">
          <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-12 w-12 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun résultat trouvé</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            {(searchTerm || selectedSecteur) 
              ? "Nous n'avons trouvé aucune entreprise correspondant à vos critères de recherche." 
              : "Aucune entreprise n'est inscrite pour le moment."}
          </p>
          {(searchTerm || selectedSecteur) && (
            <button 
              onClick={() => { setSearchTerm(''); setSelectedSecteur(''); }} 
              className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-colors shadow-sm"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {currentItems.map((employer) => (
            <div key={employer.id} className="bg-white rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
              <div 
                className="h-32 w-full bg-slate-100"
                style={profileService.getCoverImage(employer) 
                  ? { backgroundImage: `url(${profileService.getCoverImage(employer)})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: 'linear-gradient(to right, #f8fafc, #e2e8f0)' }
                }
              />
              <div className="px-5 pb-6 flex-1 flex flex-col relative">
                <div className="flex justify-center -mt-12 mb-3">
                  <div className="h-24 w-24 bg-white rounded-full p-1.5 shadow-sm relative">
                    <div className="w-full h-full rounded-full overflow-hidden bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-2xl">
                      {profileService.getProfileImage(employer) ? (
                        <img src={profileService.getProfileImage(employer)} alt="Avatar" className="w-full h-full object-cover bg-gradient-to-br from-[#2b4eef] to-[#df6422] text-white font-bold" />
                      ) : profileService.getInitials(employer, 'employer')}
                    </div>
                    <div className="absolute bottom-0 right-0">
                      <VerificationBadge status={employer.statut_verification || 'non_verifie'} premium={employer.forfait_badge_premium} size="sm" showText={false} />
                    </div>
                  </div>
                </div>
                
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-slate-900 truncate mb-1">
                    {profileService.getDisplayName(employer, 'employer')}
                  </h3>
                  {employer.secteur && (
                    <div className="flex items-center justify-center text-sm font-medium text-slate-500 gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" /> {employer.secteur}
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-4 text-center">
                  {employer.numero_bce && (
                    <div className="flex items-center justify-center text-sm text-slate-600">
                      <Building2 className="h-4 w-4 mr-1.5 text-slate-400" />
                      <span>BCE: {employer.numero_bce}</span>
                    </div>
                  )}
                  {employer.pays_code && (
                    <div className="flex items-center justify-center text-sm text-slate-600">
                      <MapPin className="h-4 w-4 mr-1.5 text-slate-400" />
                      <span>{employer.pays_code}</span>
                    </div>
                  )}
                </div>

                <div className="mt-auto">
                  {employer.competences_recherchees && (() => {
                    let comp = [];
                    try {
                      if (Array.isArray(employer.competences_recherchees)) comp = employer.competences_recherchees;
                      else if (typeof employer.competences_recherchees === 'string') comp = JSON.parse(employer.competences_recherchees);
                    } catch(e) {}
                    if (!comp || comp.length === 0) return null;
                    return (
                      <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                        {comp.slice(0, 3).map((c, i) => (
                          <span key={i} className="px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-600 text-[11px] font-medium rounded-full">
                            {c}
                          </span>
                        ))}
                        {comp.length > 3 && (
                          <span className="px-2.5 py-1 bg-primary-50 text-primary-600 text-[11px] font-bold rounded-full">
                            +{comp.length - 3}
                          </span>
                        )}
                      </div>
                    )
                  })()}
                  
                  <Button
                    onClick={() => handleViewDetails(employer)}
                    variant="outline"
                    className="w-full bg-white hover:bg-slate-50 shadow-sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir le profil
                  </Button>
                </div>
              </div>
            </div>
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

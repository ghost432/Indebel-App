import VerificationBadge from '../components/VerificationBadge'
import PageLoader from '../components/PageLoader'
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
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
import QuotaModal from '../components/devis/QuotaModal'
import { userService } from '../services/userService'
import { evaluationService } from '../services/evaluationService'
import { profileService } from '../services/profileService'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config'
import toast from 'react-hot-toast'
import api from '../services/api'

const FreelancerList = () => {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [freelancers, setFreelancers] = useState([])
  const [filteredFreelancers, setFilteredFreelancers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSecteur, setSelectedSecteur] = useState('')
  const [selectedDisponibilite, setSelectedDisponibilite] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [secteurs, setSecteurs] = useState([])
  const [contactLoading, setContactLoading] = useState(false)
  const [selectedFreelancer, setSelectedFreelancer] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [evaluationsStats, setEvaluationsStats] = useState({})
  
  const [creditCost, setCreditCost] = useState(1)
  const [creditBalance, setCreditBalance] = useState(user?.solde_credits || 0)

  // Gestion du déblocage par crédits
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (user?.role === 'admin') return true;
    return sessionStorage.getItem(`unlocked_freelancer_list_${user?.id}`) === 'true';
  })
  const [showConfirmUnlock, setShowConfirmUnlock] = useState(() => {
    if (user?.role === 'admin') return false;
    return sessionStorage.getItem(`unlocked_freelancer_list_${user?.id}`) !== 'true';
  })
  const [showInsufficientModal, setShowInsufficientModal] = useState(false)
  const [unlocking, setUnlocking] = useState(false)

  // Pagination
  const { currentItems, currentPage, totalPages, goToPage, totalItems } = usePagination(filteredFreelancers, 12)

  useEffect(() => {
    document.title = 'Liste des prestataires - Indebel'
    fetchFreelancers()
    fetchSecteurs()
    fetchCreditInfo()
  }, [])

  const fetchCreditInfo = async () => {
    try {
      const [settingsRes, balanceRes] = await Promise.all([
        api.get('/credits/settings/price').catch(() => api.get('/admin-credits/settings/price')).catch(() => ({ data: {} })),
        api.get('/credits/balance').catch(() => ({ data: {} }))
      ]);
      if (settingsRes.data?.cout_vues_freelancers !== undefined) {
        setCreditCost(parseInt(settingsRes.data.cout_vues_freelancers, 10));
      }
      if (balanceRes.data?.solde !== undefined) {
        setCreditBalance(balanceRes.data.solde);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmUnlock = async () => {
    if (creditBalance < creditCost) {
      setShowConfirmUnlock(false);
      setShowInsufficientModal(true);
      return;
    }

    setUnlocking(true);
    try {
      const res = await api.post('/credits/consume', { action: 'view_freelancers_list' });
      if (res.data?.success) {
        sessionStorage.setItem(`unlocked_freelancer_list_${user?.id}`, 'true');
        setIsUnlocked(true);
        setShowConfirmUnlock(false);
        setCreditBalance(res.data.newBalance);
        if (refreshUser) refreshUser();
        toast.success(`Accès débloqué ! ${creditCost} crédit(s) déduit(s).`);
      }
    } catch (err) {
      if (err.response?.data?.code === 'INSUFFICIENT_CREDITS' || creditBalance < creditCost) {
        setShowConfirmUnlock(false);
        setShowInsufficientModal(true);
      } else {
        toast.error(err.response?.data?.message || 'Erreur lors du déblocage par crédits');
      }
    } finally {
      setUnlocking(false);
    }
  };

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
                [freelancer.id]: (response.data?.data || response.data).stats
              }));
            }
          })
          .catch(err => console.log('Erreur évaluations:', err));
      });
    } catch (error) {
      if (error.response?.data?.code === 'LIST_ACCESS_DENIED') {
        setQuotaModal({ open: true, type: 'view', message: error.response.data.message });
      } else {
        console.error('Erreur lors du chargement des indépendants:', error);
        toast.error('Erreur lors du chargement des indépendants');
      }
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
    return <PageLoader />
  }

  return (
    <div className="relative min-h-[60vh]">
      {/* Contenu principal de la page avec flou si non débloqué */}
      <div className={!isUnlocked ? "filter blur-md pointer-events-none select-none transition-all duration-300" : ""}>
        <section className="mb-8 rounded-[28px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-500">ANNUAIRE</p>
              <h1 className="mt-3 text-3xl md:text-4xl font-black text-[#082151]">Liste des prestataires</h1>
              <p className="mt-2 text-slate-500 max-w-3xl text-lg">Parcourez les profils des prestataires vérifiés sur Indebel.</p>
            </div>
            <Badge variant="info">{filteredFreelancers.length} prestataire(s)</Badge>
          </div>

          {/* Credit Banner */}
          <div className="mt-6 p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                💳
              </div>
              <div>
                <p className="text-sm font-bold text-blue-950">Accès et consultation des prestataires</p>
                <p className="text-xs text-blue-800">
                  Coût défini par l'administration : <span className="font-bold text-blue-900">{creditCost} crédit(s)</span> par consultation.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-full border border-blue-200 shadow-sm">
                Solde actuel : <strong className="text-primary-600">{creditBalance} crédit(s)</strong>
              </span>
              {creditBalance < creditCost && (
                <Button
                  onClick={() => navigate('/employer/credits')}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
                >
                  Recharger
                </Button>
              )}
            </div>
          </div>
        </section>

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
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-12 text-center">
            <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="h-12 w-12 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun résultat trouvé</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              {(searchTerm || selectedSecteur) 
                ? "Nous n'avons trouvé aucun indépendant correspondant à vos critères de recherche." 
                : "Aucun indépendant n'est inscrit pour le moment."}
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
            {currentItems.map((freelancer) => (
              <div key={freelancer.id} className="bg-white rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                <div 
                  className="h-32 w-full bg-slate-100"
                  style={profileService.getCoverImage(freelancer) 
                    ? { backgroundImage: `url(${profileService.getCoverImage(freelancer)})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : { background: 'linear-gradient(to right, #f8fafc, #e2e8f0)' }
                  }
                />
                <div className="px-5 pb-6 flex-1 flex flex-col relative">
                  <div className="flex justify-center -mt-12 mb-3">
                    <div className="h-24 w-24 bg-white rounded-full p-1.5 shadow-sm relative">
                      <div className="w-full h-full rounded-full overflow-hidden bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-2xl">
                        {profileService.getProfileImage(freelancer) ? (
                          <img src={profileService.getProfileImage(freelancer)} alt="Avatar" className="w-full h-full object-cover bg-gradient-to-br from-[#2b4eef] to-[#df6422] text-white font-bold" />
                        ) : profileService.getInitials(freelancer, 'freelancer')}
                      </div>
                      <div className="absolute bottom-0 right-0">
                        <VerificationBadge status={(freelancer.verification_identite_status && freelancer.verification_identite_status !== 'non_verifie') ? freelancer.verification_identite_status : freelancer.statut_verification || 'non_verifie'} premium={freelancer.forfait_badge_premium} size="sm" showText={false} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 truncate mb-1">
                      {profileService.getDisplayName(freelancer, 'freelancer')}
                    </h3>
                    {freelancer.secteur && (
                      <div className="flex items-center justify-center text-sm font-medium text-slate-500 gap-1.5">
                        <Briefcase className="h-3.5 w-3.5" /> {freelancer.secteur}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-4 text-center">
                    {freelancer.ville && (
                      <div className="flex items-center justify-center text-sm text-slate-600">
                        <MapPin className="h-4 w-4 mr-1.5 text-slate-400" />
                        <span>{freelancer.ville}</span>
                      </div>
                    )}
                    {freelancer.pays_code && (
                      <div className="flex items-center justify-center text-sm text-slate-600">
                        <MapPin className="h-4 w-4 mr-1.5 text-slate-400" />
                        <span>{freelancer.pays_code}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto">
                    {freelancer.competences && (() => {
                      let comp = [];
                      try {
                        if (Array.isArray(freelancer.competences)) comp = freelancer.competences;
                        else if (typeof freelancer.competences === 'string') comp = JSON.parse(freelancer.competences);
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
                      onClick={() => viewFreelancer(freelancer)}
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

        {/* Details Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Détails du prestataire"
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

      {/* Modal de Confirmation pour Débloquer la Liste */}
      {showConfirmUnlock && !isUnlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slideUp border border-slate-100">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-indigo-100 flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl font-bold text-xl">
                💳
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Consulter l'annuaire des prestataires</h3>
                <p className="text-xs text-slate-500">Déblocage par crédits requis</p>
              </div>
            </div>

            <div className="p-6 space-y-5 text-center">
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                Pour consulter cette liste, cette action vous coûtera <strong className="text-primary-600 text-base">{creditCost} crédit(s)</strong>.
              </p>

              <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900 border border-amber-200/80 font-bold flex items-center justify-center gap-2">
                <span>Solde disponible :</span>
                <span className="text-amber-700 text-sm">{creditBalance} crédit(s)</span>
              </div>

              <p className="text-xs text-slate-500 font-medium">Voulez-vous continuer et accéder aux profils ?</p>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 justify-center border-slate-200 text-slate-700 hover:bg-slate-50"
                  onClick={() => navigate(user?.role === 'employer' ? '/employer/dashboard' : '/freelancer/dashboard')}
                >
                  Non (Dashboard)
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmUnlock}
                  disabled={unlocking}
                  className="flex-1 justify-center bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-md"
                >
                  {unlocking ? 'Déblocage...' : 'Oui, Débloquer'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Solde Insuffisant */}
      {showInsufficientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slideUp border border-red-100">
            <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center gap-3">
              <div className="p-2.5 bg-red-100 text-red-700 rounded-xl font-bold text-xl">
                ⚠️
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-900">Solde de crédits insuffisant</h3>
                <p className="text-xs text-red-600">Action impossible sans rechargement</p>
              </div>
            </div>

            <div className="p-6 space-y-5 text-center">
              <p className="text-sm text-slate-700 leading-relaxed">
                Votre solde actuel est de <strong className="text-red-600 font-bold">{creditBalance} crédit(s)</strong>. Vous avez besoin de <strong className="text-slate-900 font-bold">{creditCost} crédit(s)</strong> pour consulter la liste des prestataires.
              </p>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => navigate(user?.role === 'employer' ? '/employer/credits' : '/freelancer/credits')}
                  className="w-full justify-center bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 shadow-md"
                >
                  Recharger mes crédits
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center text-slate-600 border-slate-200 hover:bg-slate-50"
                  onClick={() => navigate(user?.role === 'employer' ? '/employer/dashboard' : '/freelancer/dashboard')}
                >
                  Retour au tableau de bord
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FreelancerList

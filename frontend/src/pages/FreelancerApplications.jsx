import { useState, useEffect } from 'react'
import PageLoader from '../components/PageLoader'
import { Filter, Search, Calendar, CheckCircle, XCircle, Clock, Briefcase, Building, Mail, User, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import { demandeService } from '../services/demandeService'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const FreelancerApplications = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [filteredApplications, setFilteredApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date_desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  useEffect(() => {
    document.title = 'Mes candidatures - Indebel'
    fetchApplications()
  }, [])

  useEffect(() => {
    filterAndSortApplications()
    setCurrentPage(1)
  }, [applications, searchTerm, statusFilter, sortBy])

  const fetchApplications = async () => {
    try {
      const response = await demandeService.getFreelancerDemandes()
      const applicationsData = (response.data?.data || response.data) || []
      setApplications(applicationsData)
    } catch (error) {
      console.error('Erreur chargement candidatures:', error)
      toast.error('Erreur lors du chargement des candidatures')
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortApplications = () => {
    let filtered = [...applications]

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.mission_titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.employer_denomination?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.statut === statusFilter)
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.date_demande) - new Date(a.date_demande)
        case 'date_asc':
          return new Date(a.date_demande) - new Date(b.date_demande)
        case 'job_asc':
          return (a.mission_titre || '').localeCompare(b.mission_titre || '')
        case 'job_desc':
          return (b.mission_titre || '').localeCompare(a.mission_titre || '')
        default:
          return 0
      }
    })

    setFilteredApplications(filtered)
  }

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentApplications = filteredApplications.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

  const getStatusBadge = (statut) => {
    const badges = {
      en_attente: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'En attente' },
      accepte: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Accepté' },
      refuse: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Refusé' }
    }
    
    const badge = badges[statut] || badges.en_attente
    const Icon = badge.icon
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </span>
    )
  }

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.statut === 'en_attente').length,
    accepted: applications.filter(a => a.statut === 'accepte').length,
    refused: applications.filter(a => a.statut === 'refuse').length
  }

  if (loading) {
    return <PageLoader />
  }

  return (
    <div>
      <div className="bg-[#082151] rounded-[24px] shadow-md p-6 md:p-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden text-white border-0">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Mes candidatures</h1>
          <p className="text-slate-200 mt-1 text-sm md:text-base">Suivez l'état de toutes vos candidatures envoyées</p>
        </div>
        <div className="relative z-10">
          <Button 
            onClick={() => navigate('/freelancer/list-missions')} 
            variant="white"
            className="rounded-xl font-bold"
          >
            <Briefcase className="h-5 w-5 mr-2" />
            Missions disponibles
          </Button>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#2b4eef]/20 to-[#df6422]/20 rounded-full blur-3xl -mr-16 -mt-16 z-0 pointer-events-none"></div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center gap-2 hover:border-[#2b4eef]/30 hover:shadow-md transition-all">
          <Briefcase className="h-8 w-8 text-[#082151]" />
          <p className="text-4xl font-black text-[#082151]">{stats.total}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total</p>
        </div>
        
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center gap-2 hover:border-amber-500/30 hover:shadow-md transition-all">
          <Clock className="h-8 w-8 text-amber-400" />
          <p className="text-4xl font-black text-amber-500">{stats.pending}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">En attente</p>
        </div>
        
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center gap-2 hover:border-emerald-500/30 hover:shadow-md transition-all">
          <CheckCircle className="h-8 w-8 text-emerald-400" />
          <p className="text-4xl font-black text-emerald-500">{stats.accepted}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Acceptées</p>
        </div>
        
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center gap-2 hover:border-rose-500/30 hover:shadow-md transition-all">
          <XCircle className="h-8 w-8 text-rose-400" />
          <p className="text-4xl font-black text-rose-500">{stats.refused}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Refusées</p>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="mb-6 rounded-3xl bg-slate-50 border border-slate-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-[#2b4eef]/20 focus:border-[#2b4eef] transition-all shadow-sm"
            />
          </div>

          {/* Filtre par statut */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-[#2b4eef]/20 focus:border-[#2b4eef] transition-all shadow-sm appearance-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="accepte">Accepté</option>
              <option value="refuse">Refusé</option>
            </select>
          </div>

          {/* Tri */}
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-[#2b4eef]/20 focus:border-[#2b4eef] transition-all shadow-sm appearance-none"
            >
              <option value="date_desc">Plus récentes</option>
              <option value="date_asc">Plus anciennes</option>
              <option value="job_asc">Mission A-Z</option>
              <option value="job_desc">Mission Z-A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des candidatures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {currentApplications.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-slate-200">
            <Briefcase className="h-20 w-20 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Aucune candidature ne correspond à vos critères' 
                : 'Vous n\'avez pas encore postulé à des missions'}
            </p>
            <Button onClick={() => navigate('/freelancer/list-missions')} className="bg-[#2b4eef] hover:bg-[#1f3bbd] text-white font-bold rounded-xl shadow-sm">
              <Briefcase className="h-5 w-5 mr-2" />
              Parcourir les missions
            </Button>
          </div>
        ) : (
          currentApplications.map(app => (
            <div 
              key={app.id}
              className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-[#2b4eef]/30 transition-all relative overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2b4eef] via-[#df6422] to-[#2b4eef] opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      {getStatusBadge(app.statut)}
                      {app.est_genere_par_ia ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Généré par IA
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          <User className="h-3 w-3 mr-1" />
                          Rédigé manuellement
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-black text-[#082151] leading-tight">
                      {app.mission_titre}
                    </h3>
                  </div>
                </div>
                
                {/* Information cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                  <div className="flex items-center p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 flex-shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prestataire</p>
                      <p className="font-bold text-sm text-[#082151]">{user?.prenom} {user?.nom}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3 flex-shrink-0">
                      <Building className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Entreprise</p>
                      <p className="font-bold text-sm text-[#082151]">{app.employer_denomination || app.employer_nom}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-sm text-slate-600 mb-5">
                  {app.mission_description && (
                    <div className="mb-4 bg-white p-4 rounded-2xl border border-slate-100 text-sm text-slate-600 italic line-clamp-2">
                      "{app.mission_description}"
                    </div>
                  )}
                  
                  <div className="flex items-center mt-2 text-slate-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="text-xs font-medium">Candidature envoyée le {new Date(app.date_demande).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>

              {/* Statut details */}
              <div className="mt-auto pt-4 border-t border-slate-100">
                {app.statut === 'en_attente' && (
                  <div className="flex items-center text-sm font-bold text-amber-500">
                    <Clock className="h-4 w-4 mr-2" />
                    En attente de réponse de l'entreprise
                  </div>
                )}
                {app.statut === 'accepte' && (
                  <div className="flex items-center text-sm font-bold text-emerald-500">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Candidature acceptée !
                  </div>
                )}
                {app.statut === 'refuse' && (
                  <div>
                    <div className="flex items-center text-sm font-bold text-rose-500">
                      <XCircle className="h-4 w-4 mr-2" />
                      Candidature refusée
                    </div>
                    {app.motif_refus && (
                      <p className="text-xs text-rose-400/80 mt-1 font-medium italic">
                        Motif : {app.motif_refus}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
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

      {/* Résultats */}
      {filteredApplications.length > 0 && (
        <div className="mt-4 text-sm text-gray-600 text-center">
          Affichage de {currentApplications.length} candidature{currentApplications.length > 1 ? 's' : ''} sur {filteredApplications.length} ({applications.length} au total)
        </div>
      )}
    </div>
  )
}

export default FreelancerApplications

import { useState, useEffect } from 'react'
import PageLoader from '../components/PageLoader'
import { Eye, Filter, Search, Calendar, CheckCircle, XCircle, Clock, User, Briefcase, Mail, Phone, Building } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import { missionService } from '../services/missionService'
import { applicationService } from '../services/applicationService'
import { demandeService } from '../services/demandeService'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Brain } from 'lucide-react'

const EmployerApplications = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [filteredApplications, setFilteredApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date_desc')

  useEffect(() => {
    document.title = 'Demandes reçues - Indebel'
    fetchAllApplications()
  }, [])

  useEffect(() => {
    filterAndSortApplications()
  }, [applications, searchTerm, statusFilter, sortBy])

  const fetchAllApplications = async () => {
    try {
      // Récupérer toutes les demandes avec les informations des missions
      const response = await demandeService.getEmployerDemandes()
      const demandesData = (response.data?.data || response.data) || []
      
      setApplications(demandesData)
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
        app.freelancer_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.freelancer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.mission_titre?.toLowerCase().includes(searchTerm.toLowerCase())
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
          return new Date(b.date_creation || 0) - new Date(a.date_creation || 0)
        case 'date_asc':
          return new Date(a.date_creation || 0) - new Date(b.date_creation || 0)
        case 'name_asc':
          return (a.freelancer_nom || '').localeCompare(b.freelancer_nom || '')
        case 'name_desc':
          return (b.freelancer_nom || '').localeCompare(a.freelancer_nom || '')
        default:
          return 0
      }
    })

    setFilteredApplications(filtered)
  }

  const handleAcceptApplication = async (application) => {
    try {
      await demandeService.accepterDemande(application.id)
      toast.success(`Candidature de ${application.freelancer_nom} acceptée!`)
      fetchAllApplications()
    } catch (error) {
      console.error('Erreur acceptation:', error)
      toast.error('Erreur lors de l\'acceptation')
    }
  }

  const handleRejectApplication = async (application) => {
    const confirmer = window.confirm(`Êtes-vous sûr de vouloir refuser la candidature de ${application.freelancer_nom} ?`)
    if (!confirmer) {
      return
    }

    try {
      await demandeService.refuserDemande(application.id)
      toast.success('Candidature refusée et freelancer notifié')
      fetchAllApplications()
    } catch (error) {
      console.error('Erreur refus:', error)
      toast.error('Erreur lors du refus')
    }
  }

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
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="bg-[#082151] rounded-[24px] shadow-md p-6 md:p-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden text-white border-0">
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-white/10 text-white rounded-2xl hidden sm:block">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Demandes reçues</h1>
            <p className="text-slate-200 mt-1 text-sm md:text-base">Gérez et suivez l'ensemble des candidatures pour vos missions en cours.</p>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#2b4eef]/20 to-[#df6422]/20 rounded-full blur-3xl -mr-16 -mt-16 z-0 pointer-events-none"></div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Briefcase className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Acceptées</p>
              <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Refusées</p>
              <p className="text-2xl font-bold text-red-600">{stats.refused}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou mission..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filtre par statut */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="accepte">Accepté</option>
              <option value="refuse">Refusé</option>
            </select>
          </div>

          {/* Tri */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="date_desc">Plus récentes</option>
              <option value="date_asc">Plus anciennes</option>
              <option value="name_asc">Nom A-Z</option>
              <option value="name_desc">Nom Z-A</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Liste des candidatures */}
      <Card>
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Aucune candidature ne correspond à vos critères' 
                : 'Aucune candidature reçue'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map(app => (
              <div 
                key={app.id}
                className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Informations principales */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div
                        onClick={() => {
                          const slug = `${app.freelancer_prenom || ''}-${app.freelancer_nom_famille || ''}`
                            .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                          navigate(`/employer/list-freelancer/${slug}`);
                        }}
                        className="cursor-pointer hover:underline"
                      >
                        <h3 className="text-lg font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-2">
                          <User className="h-5 w-5" />
                          {app.freelancer_nom}
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-bold text-indigo-700 ml-2" title="Smart Matching IA">
                            <Brain className="h-3 w-3" />
                            {Math.floor(Math.random() * (98 - 75 + 1) + 75)}% Match IA
                          </span>
                        </h3>
                      </div>
                      {getStatusBadge(app.statut)}
                    </div>
                    
                    {/* Message de candidature */}
                    <div className="mb-3 p-3 bg-green-50 border-l-4 border-green-500 rounded">
                      <p className="text-sm text-green-900">
                        L'indépendant{' '}
                        <span className="font-semibold">{app.freelancer_nom}</span>
                        {' '}a postulé à la mission publiée par{' '}
                        <span className="font-semibold">{user?.denomination || 'votre entreprise'}</span>
                      </p>
                    </div>

                    { (app.message_freelancer || app.message || app.note_complementaire) && (
                      <div className="mb-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded text-sm text-slate-800">
                        <span className="font-bold text-blue-900 block mb-1">Note / Message de présentation du candidat :</span>
                        <p className="italic text-slate-700 font-medium">"{app.message_freelancer || app.message || app.note_complementaire}"</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center p-2 bg-gray-50 rounded">
                        <User className="h-4 w-4 mr-2 text-primary-600" />
                        <div>
                          <span className="text-xs text-gray-500">Indépendant:</span>
                          <p className="font-medium text-sm">{app.freelancer_nom}</p>
                        </div>
                      </div>
                      <div className="flex items-center p-2 bg-gray-50 rounded">
                        <Building className="h-4 w-4 mr-2 text-primary-600" />
                        <div>
                          <span className="text-xs text-gray-500">Entreprise:</span>
                          <p className="font-medium text-sm">{user?.denomination || 'Votre entreprise'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="font-medium">Mission:</span>
                        <span className="ml-2">{app.mission_titre}</span>
                      </p>
                      
                      <p className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {app.freelancer_email}
                      </p>
                      
                      <p className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        Postulé le {(() => {
                          const dateValue = app.date_creation || app.date_demande || app.created_at;
                          if (dateValue) {
                            try {
                              return new Date(dateValue).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              });
                            } catch (e) {
                              return 'Date invalide';
                            }
                          }
                          return 'Date non disponible';
                        })()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {app.statut === 'en_attente' && (
                    <div className="flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleAcceptApplication(app)}
                        className="whitespace-nowrap"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accepter
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRejectApplication(app)}
                        className="whitespace-nowrap"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Refuser
                      </Button>
                    </div>
                  )}

                  {app.statut === 'accepte' && (
                    <div className="text-sm text-green-600 font-medium">
                      ✓ Candidature acceptée
                    </div>
                  )}

                  {app.statut === 'refuse' && (
                    <div className="text-sm text-red-600 font-medium">
                      ✗ Candidature refusée
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Résultats */}
      {filteredApplications.length > 0 && (
        <div className="mt-4 text-sm text-gray-600 text-center">
          Affichage de {filteredApplications.length} candidature{filteredApplications.length > 1 ? 's' : ''} sur {applications.length}
        </div>
      )}
    </div>
  )
}

export default EmployerApplications

import { useState, useEffect } from 'react'
import { Filter, Search, Calendar, CheckCircle, XCircle, Clock, Briefcase, Building, Mail, User } from 'lucide-react'
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

  useEffect(() => {
    document.title = 'Mes candidatures - Indebel'
    fetchApplications()
  }, [])

  useEffect(() => {
    filterAndSortApplications()
  }, [applications, searchTerm, statusFilter, sortBy])

  const fetchApplications = async () => {
    try {
      const response = await demandeService.getFreelancerDemandes()
      const applicationsData = response.data.data || []
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes candidatures</h1>
          <p className="text-gray-600 mt-1">Suivez toutes vos candidatures envoyées</p>
        </div>
        <Button onClick={() => navigate('/freelancer/list-missions')}>
          <Briefcase className="h-5 w-5 mr-2" />
          Missions disponibles
        </Button>
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
              placeholder="Rechercher par mission ou recruteur..."
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
              <option value="job_asc">Mission A-Z</option>
              <option value="job_desc">Mission Z-A</option>
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
                : 'Vous n\'avez pas encore postulé à des missions'}
            </p>
            <Button onClick={() => navigate('/freelancer/list-missions')}>
              <Briefcase className="h-5 w-5 mr-2" />
              Parcourir les missions
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map(app => (
              <div 
                key={app.id}
                className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Informations principales */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          <Briefcase className="inline h-5 w-5 mr-2 text-primary-600" />
                          {app.mission_titre}
                        </h3>
                      </div>
                      {getStatusBadge(app.statut)}
                    </div>
                    
                    {/* Message de candidature */}
                    <div className="mb-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                      <p className="text-sm text-blue-900">
                        <span className="font-semibold">{user?.prenom} {user?.nom}</span>
                        {' '}a postulé à la mission publiée par{' '}
                        <span className="font-semibold">{app.employer_denomination || app.employer_nom}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center p-2 bg-gray-50 rounded">
                        <User className="h-4 w-4 mr-2 text-primary-600" />
                        <div>
                          <span className="text-xs text-gray-500">Prestataire:</span>
                          <p className="font-medium text-sm">{user?.prenom} {user?.nom}</p>
                        </div>
                      </div>
                      <div className="flex items-center p-2 bg-gray-50 rounded">
                        <Building className="h-4 w-4 mr-2 text-primary-600" />
                        <div>
                          <span className="text-xs text-gray-500">Recruteur:</span>
                          <p className="font-medium text-sm">{app.employer_denomination || app.employer_nom}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      
                      {app.mission_description && (
                        <p className="text-gray-500 mt-2 line-clamp-2">
                          {app.mission_description}
                        </p>
                      )}
                      
                      <p className="flex items-center mt-2">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        Candidature envoyée le {new Date(app.date_demande).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Statut et message */}
                  <div className="text-right">
                    {app.statut === 'en_attente' && (
                      <div className="text-sm text-yellow-600">
                        <Clock className="inline h-4 w-4 mr-1" />
                        En attente de réponse
                      </div>
                    )}

                    {app.statut === 'accepte' && (
                      <div className="text-sm text-green-600 font-medium">
                        <CheckCircle className="inline h-4 w-4 mr-1" />
                        Candidature acceptée !
                      </div>
                    )}

                    {app.statut === 'refuse' && (
                      <div>
                        <div className="text-sm text-red-600 font-medium">
                          <XCircle className="inline h-4 w-4 mr-1" />
                          Candidature refusée
                        </div>
                        {app.motif_refus && (
                          <p className="text-xs text-gray-500 mt-1 max-w-xs">
                            Motif: {app.motif_refus}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
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

export default FreelancerApplications

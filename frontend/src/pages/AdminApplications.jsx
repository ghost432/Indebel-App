import { useState, useEffect } from 'react'
import { FileText, Clock, CheckCircle, XCircle, Briefcase, User, Building2 } from 'lucide-react'
import Card from '../components/Card'
import Table from '../components/Table'
import { demandeService } from '../services/demandeService'
import toast from 'react-hot-toast'

const AdminApplications = () => {
  const [demandes, setDemandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, en_attente, accepte, refuse

  useEffect(() => {
    document.title = 'Gestion des Demandes - Admin - Indebel'
    fetchDemandes()
  }, [])

  const fetchDemandes = async () => {
    try {
      setLoading(true)
      const response = await demandeService.getAllDemandes()
      setDemandes(response.data.data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error)
      toast.error('Erreur lors du chargement des demandes')
    } finally {
      setLoading(false)
    }
  }

  const getStatutBadge = (statut) => {
    switch (statut) {
      case 'en_attente':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            En attente
          </span>
        )
      case 'accepte':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Acceptée
          </span>
        )
      case 'refuse':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Refusée
          </span>
        )
      default:
        return statut
    }
  }

  const getMissionTypeBadge = (type) => {
    return type === 'hourly' ? (
      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
        Forfait Horaire
      </span>
    ) : (
      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
        Forfait Fixe
      </span>
    )
  }

  const filteredDemandes = filter === 'all' 
    ? demandes 
    : demandes.filter(d => d.statut === filter)

  const stats = {
    total: demandes.length,
    en_attente: demandes.filter(d => d.statut === 'en_attente').length,
    accepte: demandes.filter(d => d.statut === 'accepte').length,
    refuse: demandes.filter(d => d.statut === 'refuse').length
  }

  const columns = [
    { 
      header: 'Mission', 
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{row.mission_titre}</span>
          {getMissionTypeBadge(row.mission_type)}
        </div>
      )
    },
    { 
      header: 'Freelancer', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <div>
            <p className="font-medium text-gray-900">
              {row.freelancer_prenom} {row.freelancer_nom}
            </p>
            <p className="text-xs text-gray-500">{row.freelancer_email}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'Employeur', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          <div>
            <p className="font-medium text-gray-900">
              {row.employer_denomination || `${row.employer_prenom} ${row.employer_nom}`}
            </p>
          </div>
        </div>
      )
    },
    { 
      header: 'Statut', 
      render: (row) => getStatutBadge(row.statut)
    },
    { 
      header: 'Date', 
      render: (row) => (
        <div className="text-sm text-gray-600">
          <p>{new Date(row.date_demande).toLocaleDateString('fr-FR')}</p>
          <p className="text-xs text-gray-500">
            {new Date(row.date_demande).toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="container-custom py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary-600" />
            Gestion des Demandes
          </h1>
          <p className="text-gray-600 mt-2">
            Visualisez toutes les demandes de missions de la plateforme
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card 
          className={`cursor-pointer transition-all ${filter === 'all' ? 'ring-2 ring-primary-500' : ''}`}
          onClick={() => setFilter('all')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <Briefcase className="h-8 w-8 text-gray-400" />
          </div>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${filter === 'en_attente' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => setFilter('en_attente')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En attente</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.en_attente}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${filter === 'accepte' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setFilter('accepte')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Acceptées</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.accepte}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${filter === 'refuse' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setFilter('refuse')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Refusées</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.refuse}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
        </Card>
      </div>

      {/* Applications Table */}
      <Card>
        {filteredDemandes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune demande {filter !== 'all' && `avec le statut "${filter}"`}
            </h3>
            <p className="text-gray-500">
              Les demandes de missions apparaîtront ici
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {filter === 'all' 
                  ? 'Toutes les demandes' 
                  : `Demandes ${filter === 'en_attente' ? 'en attente' : filter === 'accepte' ? 'acceptées' : 'refusées'}`
                }
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({filteredDemandes.length})
                </span>
              </h2>
            </div>
            <Table columns={columns} data={filteredDemandes} />
          </div>
        )}
      </Card>
    </div>
  )
}

export default AdminApplications

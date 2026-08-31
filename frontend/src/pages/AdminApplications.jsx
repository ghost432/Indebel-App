import { useState, useEffect } from 'react'
import PageLoader from '../components/PageLoader'
import { FileText, Clock, CheckCircle, XCircle, Briefcase, User, Building2 } from 'lucide-react'
import Card from '../components/Card'
import Table from '../components/Table'
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
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
      setDemandes((response.data?.data || response.data) || [])
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

  // Pagination
  const { currentItems, currentPage, totalPages, goToPage, totalItems } = usePagination(filteredDemandes, 10)

  const stats = {
    total: demandes.length,
    en_attente: demandes.filter(d => d.statut === 'en_attente').length,
    accepte: demandes.filter(d => d.statut === 'accepte').length,
    refuse: demandes.filter(d => d.statut === 'refuse').length
  }
  if (loading) {
    return <PageLoader fullScreen />
  }

  return (
    <div className="py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Demandes</h1>
          <p className="text-gray-600 mt-1">Visualisez toutes les demandes de missions de la plateforme</p>
        </div>
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
          <FileText className="h-5 w-5 text-gray-600" />
          <span className="text-lg font-semibold text-gray-900">{filteredDemandes.length}</span>
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

      {/* Applications List */}
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
          <div className="grid grid-cols-1 gap-4">
            <div className="mb-2">
              <h2 className="text-xl font-bold text-[#082151]">
                {filter === 'all' 
                  ? 'Toutes les demandes' 
                  : `Demandes ${filter === 'en_attente' ? 'en attente' : filter === 'accepte' ? 'acceptées' : 'refusées'}`
                }
                <span className="ml-2 text-sm font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                  {filteredDemandes.length}
                </span>
              </h2>
            </div>
            
            {currentItems.map((demande) => (
              <Card key={demande.id} className="hover:shadow-lg transition-all duration-200 group relative overflow-hidden border-transparent hover:border-primary-100">
                {/* Indicateur de statut latéral */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${
                  demande.statut === 'accepte' ? 'bg-emerald-500' :
                  demande.statut === 'refuse' ? 'bg-red-500' :
                  'bg-amber-500'
                }`} />

                <div className="pl-3 sm:pl-4 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <h3 className="text-lg font-bold text-[#082151] group-hover:text-[#2A4DEF] transition-colors break-words">
                        {demande.mission_titre}
                      </h3>
                      <div className="shrink-0 flex self-start sm:self-auto">
                        {getStatutBadge(demande.statut)}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                      <span className="inline-flex items-center bg-blue-50 text-blue-800 px-3 py-2 rounded-xl border border-blue-100/50">
                        <User className="h-4 w-4 mr-2 text-blue-500 shrink-0" />
                        <span className="flex flex-col">
                          <span className="truncate max-w-[180px]">{demande.freelancer_prenom} {demande.freelancer_nom}</span>
                          <span className="text-blue-600/70 font-normal text-[10px]">{demande.freelancer_email}</span>
                        </span>
                      </span>

                      <span className="inline-flex items-center bg-indigo-50 text-indigo-800 px-3 py-2 rounded-xl border border-indigo-100/50">
                        <Building2 className="h-4 w-4 mr-2 text-indigo-500 shrink-0" />
                        <span className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-wider text-indigo-500/70 font-black">Recruteur</span>
                          <span className="truncate max-w-[180px]">
                            {demande.employer_denomination || `${demande.employer_prenom} ${demande.employer_nom}`}
                          </span>
                        </span>
                      </span>

                      <span className={`inline-flex items-center px-3 py-2 rounded-xl border ${
                          demande.mission_type === 'hourly' 
                            ? 'bg-purple-50 text-purple-700 border-purple-100/50' 
                            : 'bg-teal-50 text-teal-700 border-teal-100/50'
                      }`}>
                        <Briefcase className={`h-4 w-4 mr-2 shrink-0 ${demande.mission_type === 'hourly' ? 'text-purple-500' : 'text-teal-500'}`} />
                        <span className="truncate">
                          {demande.mission_type === 'hourly' ? 'Forfait Horaire' : 'Forfait Fixe'}
                        </span>
                      </span>

                      <span className="inline-flex items-center text-slate-500 px-2 ml-auto">
                        <span className="flex flex-col items-end">
                          <span>{new Date(demande.date_demande).toLocaleDateString('fr-FR')}</span>
                          <span className="font-normal text-[10px] text-slate-400">à {new Date(demande.date_demande).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      </span>
                    </div>

                    { (demande.message_freelancer || demande.message || demande.note_complementaire) && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-slate-800">
                        <span className="font-bold text-blue-900 block mb-1">Note / Message de présentation du candidat :</span>
                        <p className="italic text-slate-700 font-medium">"{demande.message_freelancer || demande.message || demande.note_complementaire}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  itemsPerPage={10}
                  totalItems={totalItems}
                />
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

export default AdminApplications

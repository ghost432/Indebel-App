import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Euro, ArrowLeft, Search, Building2, CheckCircle2, X, Mail, User } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import axios from 'axios'
import toast from 'react-hot-toast'
import { API_BASE_URL } from '../config'

const AdminPublishMission = () => {
  const navigate = useNavigate()
  const [employers, setEmployers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployer, setSelectedEmployer] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    document.title = 'Publier une mission - Admin'
    fetchEmployers()
  }, [])

  const fetchEmployers = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/users?role=employer`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null)

      let rawData = response?.data?.data || response?.data

      if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        const fallbackRes = await axios.get(`${API_BASE_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        rawData = fallbackRes?.data?.data || fallbackRes?.data || []
      }

      const list = Array.isArray(rawData) ? rawData : []
      const employersList = list.filter(user => user.role === 'employer' || user.role === 'recruteur')
      
      setEmployers(employersList.length > 0 ? employersList : list)
    } catch (error) {
      console.error('Erreur chargement entreprises:', error)
      toast.error('Erreur lors du chargement des entreprises')
    } finally {
      setLoading(false)
    }
  }

  // Filtre de recherche automatique
  const filteredEmployers = useMemo(() => {
    if (!searchTerm.trim()) return employers

    const term = searchTerm.toLowerCase().trim()
    return employers.filter(emp => {
      const denom = (emp.denomination || '').toLowerCase()
      const prenomNom = `${emp.prenom || ''} ${emp.nom || ''}`.toLowerCase()
      const email = (emp.email || '').toLowerCase()
      const telephone = (emp.telephone || '').toLowerCase()
      const secteur = (emp.secteur || '').toLowerCase()

      return denom.includes(term) || prenomNom.includes(term) || email.includes(term) || telephone.includes(term) || secteur.includes(term)
    })
  }, [employers, searchTerm])

  const selectedEmpObject = useMemo(() => {
    return employers.find(e => String(e.id) === String(selectedEmployer))
  }, [employers, selectedEmployer])

  const handleSelectMissionType = (type) => {
    if (!selectedEmployer) {
      return toast.error('Veuillez d\'abord sélectionner une entreprise')
    }
    
    if (type === 'hourly') {
      navigate(`/admin/publish-mission/forfait-heure?employer_id=${selectedEmployer}`)
    } else {
      navigate(`/admin/publish-mission/forfait-fixe?employer_id=${selectedEmployer}`)
    }
  }

  return (
    <div className="py-8 px-4 max-w-5xl mx-auto">
      <Button 
        onClick={() => navigate('/admin/jobs')} 
        variant="outline"
        className="mb-6 hover:bg-gray-100 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour aux missions
      </Button>

      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Publier une mission (Admin)</h1>
          <p className="text-gray-600">Sélectionnez l'entreprise au nom de laquelle vous souhaitez publier une mission.</p>
        </div>

        {/* Étape 1: Sélection entreprise */}
        <Card className="mb-8 border-2 border-slate-200 shadow-sm rounded-2xl p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm">1</span>
              <h3 className="text-xl font-bold text-gray-900">Sélectionnez l'entreprise</h3>
            </div>
            {selectedEmpObject && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Entreprise sélectionnée
              </span>
            )}
          </div>

          {/* Filtre de recherche automatique */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Recherche automatique (nom, entreprise, email, téléphone, secteur)..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setIsDropdownOpen(true)
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm shadow-sm transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Menu Dropdown / Liste déroulante classique pour choix direct */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Ou choisissez directement dans la liste déroulante ({filteredEmployers.length} disponible{filteredEmployers.length > 1 ? 's' : ''}) :
              </label>
              <select
                value={selectedEmployer}
                onChange={(e) => {
                  setSelectedEmployer(e.target.value)
                  setIsDropdownOpen(false)
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm bg-white shadow-sm"
              >
                <option value="">-- Sélectionnez une entreprise dans la liste --</option>
                {filteredEmployers.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.denomination ? `${emp.denomination} (${emp.prenom} ${emp.nom})` : `${emp.prenom} ${emp.nom}`} {emp.email ? `- ${emp.email}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Liste de résultats rapides sous forme de cartes cliquables */}
            {isDropdownOpen && searchTerm.trim() !== '' && (
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-lg divide-y divide-gray-100">
                {filteredEmployers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Aucune entreprise ne correspond à "{searchTerm}".
                  </div>
                ) : (
                  filteredEmployers.map(emp => {
                    const isSelected = String(emp.id) === String(selectedEmployer)
                    return (
                      <div
                        key={emp.id}
                        onClick={() => {
                          setSelectedEmployer(emp.id)
                          setIsDropdownOpen(false)
                        }}
                        className={`p-3.5 cursor-pointer hover:bg-blue-50 transition-colors flex items-center justify-between ${isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                            {(emp.denomination || emp.prenom || 'E').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {emp.denomination || `${emp.prenom} ${emp.nom}`}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-2">
                              <span><User className="inline w-3 h-3 mr-0.5" />{emp.prenom} {emp.nom}</span>
                              {emp.email && <span>• <Mail className="inline w-3 h-3 mr-0.5" />{emp.email}</span>}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* Badge de récapitulatif si entreprise sélectionnée */}
            {selectedEmpObject && (
              <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Building2 className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">
                      {selectedEmpObject.denomination || `${selectedEmpObject.prenom} ${selectedEmpObject.nom}`}
                    </h4>
                    <div className="mt-1 text-xs text-gray-600 space-y-0.5">
                      <p><strong className="text-gray-700">Contact:</strong> {selectedEmpObject.prenom} {selectedEmpObject.nom}</p>
                      {selectedEmpObject.email && <p><strong className="text-gray-700">Email:</strong> {selectedEmpObject.email}</p>}
                      {selectedEmpObject.telephone && <p><strong className="text-gray-700">Téléphone:</strong> {selectedEmpObject.telephone}</p>}
                      {selectedEmpObject.secteur && <p><strong className="text-gray-700">Secteur:</strong> {selectedEmpObject.secteur}</p>}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEmployer('')}
                  className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  Changer
                </button>
              </div>
            )}

            {loading && (
              <p className="text-sm text-gray-500 animate-pulse">Chargement de la liste des entreprises...</p>
            )}

            {!loading && employers.length === 0 && (
              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                Aucune entreprise enregistrée dans la base de données.
              </p>
            )}
          </div>
        </Card>

        {/* Étape 2: Sélection du type de mission */}
        <Card className="border-2 border-slate-200 shadow-sm rounded-2xl p-6 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm">2</span>
            <h3 className="text-xl font-bold text-gray-900">Choisissez le type de mission</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Forfait Horaire */}
            <button
              type="button"
              onClick={() => handleSelectMissionType('hourly')}
              className={`group relative overflow-hidden p-6 rounded-2xl border-2 text-left transition-all duration-300 ${
                selectedEmployer
                  ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 hover:border-blue-500 hover:shadow-md cursor-pointer'
                  : 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-600 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                  <Clock className="h-7 w-7 text-white" />
                </div>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Forfait Horaire</h4>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                Rémunération basée sur un tarif horaire (ex: €/heure) et un nombre d'heures prévisionnel.
              </p>
              <div className="flex items-center text-blue-600 font-semibold text-sm">
                <span>Créer mission horaire</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Forfait Fixe */}
            <button
              type="button"
              onClick={() => handleSelectMissionType('fixed')}
              className={`group relative overflow-hidden p-6 rounded-2xl border-2 text-left transition-all duration-300 ${
                selectedEmployer
                  ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300 hover:border-purple-500 hover:shadow-md cursor-pointer'
                  : 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-600 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                  <Euro className="h-7 w-7 text-white" />
                </div>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Forfait Fixe</h4>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                Montant forfaitaire global négocié pour l'intégralité de la prestation du projet.
              </p>
              <div className="flex items-center text-purple-600 font-semibold text-sm">
                <span>Créer mission forfait fixe</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AdminPublishMission

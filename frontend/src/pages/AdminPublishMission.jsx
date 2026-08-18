import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Euro, ArrowLeft } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import axios from 'axios'
import toast from 'react-hot-toast'
import { API_BASE_URL } from '../config'

const AdminPublishMission = () => {
  const navigate = useNavigate()
  const [employers, setEmployers] = useState([])
  const [selectedEmployer, setSelectedEmployer] = useState('')

  useEffect(() => {
    document.title = 'Publier une mission - Admin'
    fetchEmployers()
  }, [])

  const fetchEmployers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Filtrer uniquement les employers
      const employersList = ((response.data?.data || response.data) || []).filter(user => user.role === 'employer')
      setEmployers(employersList)
    } catch (error) {
      toast.error('Erreur lors du chargement des entreprises')
    }
  }

  const handleSelectMissionType = (type) => {
    if (!selectedEmployer) {
      return toast.error('Veuillez d\'abord sélectionner une entreprise')
    }
    
    // Rediriger vers le formulaire approprié avec l'employer_id
    if (type === 'hourly') {
      navigate(`/admin/publish-mission/forfait-heure?employer_id=${selectedEmployer}`)
    } else {
      navigate(`/admin/publish-mission/forfait-fixe?employer_id=${selectedEmployer}`)
    }
  }

  return (
    <div className="py-8">
      <Button 
        onClick={() => navigate('/admin/jobs')} 
        variant="outline"
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Publier une mission</h1>
        <p className="text-gray-600 mb-8">Sélectionnez une entreprise et le type de mission</p>

        {/* Sélection entreprise */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-4">1. Sélectionnez l'entreprise</h3>
          <select
            value={selectedEmployer}
            onChange={(e) => setSelectedEmployer(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">-- Choisir une entreprise --</option>
            {employers.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.denomination || `${emp.prenom} ${emp.nom}`} - {emp.email}
              </option>
            ))}
          </select>
          {employers.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">Aucune entreprise trouvée</p>
          )}
        </Card>

        {/* Sélection type de mission */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">2. Choisissez le type de mission</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Forfait Horaire */}
            <button
              type="button"
              onClick={() => handleSelectMissionType('hourly')}
              className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 p-6 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-500 rounded-lg group-hover:scale-110 transition-transform">
                  <Clock className="h-8 w-8 text-white" />
                </div>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Forfait Horaire</h4>
              <p className="text-sm text-gray-600 mb-4">
                Rémunération basée sur un tarif horaire et un nombre d'heures maximum
              </p>
              <div className="flex items-center text-blue-600 font-medium">
                <span>Choisir ce type</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Forfait Fixe */}
            <button
              type="button"
              onClick={() => handleSelectMissionType('fixed')}
              className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 p-6 rounded-xl border-2 border-purple-200 hover:border-purple-400 transition-all duration-300 text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-500 rounded-lg group-hover:scale-110 transition-transform">
                  <Euro className="h-8 w-8 text-white" />
                </div>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Forfait Fixe</h4>
              <p className="text-sm text-gray-600 mb-4">
                Montant global fixe pour l'ensemble de la mission
              </p>
              <div className="flex items-center text-purple-600 font-medium">
                <span>Choisir ce type</span>
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

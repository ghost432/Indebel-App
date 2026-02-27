import { useState, useEffect } from 'react'
import { Shield, CheckCircle, XCircle, AlertTriangle, Award, Star, Clock, User, TrendingUp, Mail } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import axiosInstance from '../services/axiosConfig'
import VerificationBadge from '../components/VerificationBadge'
import LabelBadge from '../components/LabelBadge'
import { profileService } from '../services/profileService'

const AdminLabelEligibleUsers = () => {
  const [loading, setLoading] = useState(true)
  const [eligibleUsers, setEligibleUsers] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    eligible: 0,
    hasLabel: 0,
    percentage: 0
  })
  const { user } = useAuth()

  useEffect(() => {
    document.title = 'Utilisateurs Éligibles - Labels Indebel'
    // Nettoyer les données corrompues du cache au chargement
    profileService.cleanupCorruptedCache()
    fetchEligibleUsers()
  }, [])

  const fetchEligibleUsers = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/label/eligible-users')
      
      if (response.data.success) {
        setEligibleUsers(response.data.data.users)
        setStats(response.data.data.stats)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs éligibles:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const grantLabel = async (userId) => {
    try {
      const response = await axiosInstance.post(`/label/grant/${userId}`)
      
      if (response.data.success) {
        toast.success('Label accordé avec succès')
        fetchEligibleUsers() // Refresh data
      }
    } catch (error) {
      console.error('Erreur lors de l\'attribution du label:', error)
      toast.error('Erreur lors de l\'attribution du label')
    }
  }

  const revokeLabel = async (userId) => {
    try {
      const response = await axiosInstance.delete(`/label/revoke/${userId}`)
      
      if (response.data.success) {
        toast.success('Label retiré avec succès')
        fetchEligibleUsers() // Refresh data
      }
    } catch (error) {
      console.error('Erreur lors du retrait du label:', error)
      toast.error('Erreur lors du retrait du label')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Utilisateurs Éligibles - Labels Indebel
        </h1>
        <p className="text-gray-600">
          Gérez l'attribution des labels de qualité Indebel aux utilisateurs éligibles
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Utilisateurs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <User className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Éligibles</p>
                <p className="text-2xl font-bold text-green-600">{stats.eligible}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avec Label</p>
                <p className="text-2xl font-bold text-primary-600">{stats.hasLabel}</p>
              </div>
              <Award className="h-8 w-8 text-primary-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pourcentage</p>
                <p className="text-2xl font-bold text-blue-600">{stats.percentage}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Liste des utilisateurs éligibles */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Utilisateurs Éligibles au Label Indebel
          </h2>

          {eligibleUsers.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun utilisateur éligible pour le moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {eligibleUsers.map((eligibleUser) => (
                <div key={eligibleUser.id} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden">
                        {profileService.getProfileImage(eligibleUser) ? (
                          <img 
                            src={profileService.getProfileImage(eligibleUser)} 
                            alt="Profile" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span>{profileService.getInitials(eligibleUser, eligibleUser.role === 'employer' ? 'employer' : 'freelancer')}</span>
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {eligibleUser.prenom} {eligibleUser.nom}
                          </h3>
                          {eligibleUser.hasLabel && (
                            <LabelBadge userId={eligibleUser.id} size="md" forceShow={true} />
                          )}
                          <VerificationBadge status={eligibleUser.status_verification} size="sm" showText={false} />
                        </div>
                        <p className="text-gray-600 capitalize">{eligibleUser.role}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {eligibleUser.email}
                          </span>
                          <span className="flex items-center">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            Score: {eligibleUser.eligibilityScore}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {eligibleUser.hasLabel ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => revokeLabel(eligibleUser.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Retirer Label
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => grantLabel(eligibleUser.id)}
                        >
                          <Award className="h-4 w-4 mr-2" />
                          Accorder Label
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Critères d'éligibilité */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Critères d'éligibilité:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center">
                        {eligibleUser.criteria?.profileComplete ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mr-2" />
                        )}
                        <span>Profil complet</span>
                      </div>
                      
                      <div className="flex items-center">
                        {eligibleUser.criteria?.verified ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mr-2" />
                        )}
                        <span>Vérifié</span>
                      </div>
                      
                      <div className="flex items-center">
                        {eligibleUser.criteria?.activeUser ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mr-2" />
                        )}
                        <span>Utilisateur actif</span>
                      </div>
                      
                      <div className="flex items-center">
                        {eligibleUser.criteria?.goodRating ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mr-2" />
                        )}
                        <span>Bonne évaluation</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default AdminLabelEligibleUsers

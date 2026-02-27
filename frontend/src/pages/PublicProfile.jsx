import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Button from '../components/Button'
import PublicProfileCard from '../components/PublicProfileCard'
import { userService } from '../services/userService'
import toast from 'react-hot-toast'

const PublicProfile = () => {
  const { identifier } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    document.title = 'Profil Public - Indebel'
    if (identifier) {
      fetchProfile(identifier)
    }
  }, [identifier])

  const fetchProfile = async (id) => {
    try {
      setLoading(true)
      console.log('Fetching profile for ID:', id);
      const response = await userService.getPublicProfile(id)
      console.log('Profile API response:', response);
      
      if (response.data && response.data.success && response.data.data) {
        setProfile(response.data.data)
        const name = response.data.data.role === 'employer' 
          ? response.data.data.denomination 
          : `${response.data.data.prenom || ''} ${response.data.data.nom || ''}`.trim()
        document.title = `${name} - Profil Public - Indebel`
      } else {
        console.error('Invalid profile data format:', response.data);
        throw new Error(response.data?.message || 'Profil non trouvé')
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      toast.error(error.response?.data?.message || 'Impossible de charger le profil demandé')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-16 bg-gray-50 min-h-screen">
        <div className="max-w-2xl mx-auto text-center bg-white rounded-2xl shadow-xl p-12">
          <div className="mb-6">
            <div className="h-24 w-24 bg-gray-200 rounded-full mx-auto flex items-center justify-center">
              <span className="text-4xl">❌</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Profil non trouvé</h1>
          <p className="text-gray-600 mb-6">
            L'utilisateur que vous recherchez n'existe pas ou son profil n'est plus disponible.
          </p>
          <a 
            href="/" 
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    )
  }

  const profileType = profile.role === 'employer' ? 'employer' : 'freelancer'
  
  const handleBack = () => {
    if (profileType === 'freelancer') {
      navigate('/freelancer/profile')
    } else {
      navigate('/employer/profile')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Button onClick={handleBack} variant="outline" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <PublicProfileCard user={profile} type={profileType} />
      </div>
    </div>
  )
}

export default PublicProfile

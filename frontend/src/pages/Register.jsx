import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const Register = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const accountType = searchParams.get('type')

  useEffect(() => {
    // Rediriger vers les formulaires spécifiques
    if (accountType === 'employer') {
      navigate('/register-employer', { replace: true })
    } else if (accountType === 'freelancer') {
      navigate('/register-freelancer', { replace: true })
    } else {
      // Si pas de type, rediriger vers la page de choix
      navigate('/account-type', { replace: true })
    }
  }, [accountType, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirection...</p>
      </div>
    </div>
  )
}

export default Register

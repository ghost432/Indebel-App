import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageLoader from '../components/PageLoader'

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

  return <PageLoader label="Redirection..." fullScreen />
}

export default Register

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageLoader from './PageLoader'

const PrivateRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <PageLoader fullScreen />
  }

  if (!user) {
    // Sauvegarder l'URL actuelle (avec query params) pour redirection après login
    const currentUrl = location.pathname + location.search
    localStorage.setItem('redirectAfterLogin', currentUrl)
    return <Navigate to="/login" />
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" />
  }

  return children
}

export default PrivateRoute

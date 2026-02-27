import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PrivateRoute = ({ children, requiredRole }) => {
  const { user, loading, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Debug logs
  console.log('🔍 PrivateRoute Debug:', { 
    user: !!user, 
    loading, 
    isLoading, 
    isAuthenticated,
    userRole: user?.role 
  })

  if (loading || isLoading) {
    console.log('⏳ PrivateRoute: Affichage du spinner de chargement')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <div className="ml-4 text-gray-600">Vérification de l'authentification...</div>
      </div>
    )
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

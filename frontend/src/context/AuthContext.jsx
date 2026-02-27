import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/axiosConfig'
import { markJustLoggedIn } from '../services/axiosConfig'
import TokenExpiredModal from '../components/TokenExpiredModal'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    if (isCheckingAuth) {
      console.log('⚠️ Vérification auth déjà en cours, ignorée');
      return;
    }

    setIsCheckingAuth(true);
    const token = localStorage.getItem('token');
    console.log('🔍 Vérification auth, token présent:', !!token);

    if (token) {
      try {
        // Vérifier si le token a un format valide JWT
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Format de token invalide');
        }

        console.log('🔐 Validation du token...');
        const response = await api.get('/auth/me');
        console.log('✅ Token valide, utilisateur:', response.data.data?.email);
        setUser(response.data.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('❌ Token invalide:', error.response?.status, error.message);
        console.log('🧹 Nettoyage des données d\'authentification...');

        // Nettoyer complètement l'état d'authentification
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        setUser(null);
        setIsAuthenticated(false);

        if (error.response?.status === 401) {
          console.warn('🔄 Session expirée - affichage du modal');
          setShowTokenExpiredModal(true);
        }
      }
    } else {
      console.log('ℹ️ Aucun token trouvé');
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsLoading(false);
    setLoading(false);
    setIsCheckingAuth(false);
  };

  const login = async (emailOrUser, mot_de_passe_or_token) => {
    // Si appelé avec user et token (après OTP)
    if (typeof emailOrUser === 'object' && emailOrUser !== null) {
      const user = emailOrUser
      const token = mot_de_passe_or_token

      console.log('🔐 Login appelé avec:', {
        hasUser: !!user,
        userEmail: user?.email,
        hasToken: !!token,
        tokenType: typeof token,
        tokenValue: token?.substring(0, 20) + '...'
      })

      // Valider le token avant de le stocker
      if (!token || token === 'null' || token === 'undefined') {
        console.error('❌ Token invalide:', { token, type: typeof token })
        throw new Error('Token invalide reçu')
      }

      // Stocker le token avec double vérification
      try {
        localStorage.setItem('token', token)
        console.log('✅ Token stocké dans localStorage:', `${token.length} chars`)

        // Vérifier immédiatement que le token est bien stocké
        const storedToken = localStorage.getItem('token')
        console.log('🔍 Vérification immédiate:', {
          tokenStored: !!storedToken,
          matches: storedToken === token,
          storedLength: storedToken?.length
        })

        // Si localStorage échoue, utiliser sessionStorage comme fallback
        if (!storedToken || storedToken !== token) {
          console.error('❌ localStorage a échoué, tentative avec sessionStorage')
          sessionStorage.setItem('token', token)
          localStorage.setItem('token', token) // Réessayer

          // Vérifier à nouveau
          const retryToken = localStorage.getItem('token')
          if (!retryToken) {
            console.error('❌ CRITICAL: Impossible de stocker le token!')
            throw new Error('Erreur de stockage du token')
          }
        }
      } catch (storageError) {
        console.error('❌ Erreur stockage token:', storageError)
        throw new Error('Impossible de sauvegarder la session')
      }

      // Activer la protection contre les 401 pendant 5 secondes
      markJustLoggedIn()

      // Recharger les données complètes de l'utilisateur depuis l'API
      try {
        const response = await api.get('/auth/me')
        setUser(response.data.data)
        setIsAuthenticated(true)
        setLoading(false)
        console.log('✅ User défini:', response.data.data.email);
      } catch (error) {
        // Fallback sur les données fournies si l'API échoue
        console.warn('⚠️ Échec /auth/me, fallback:', error.response?.status || error.message)
        setUser(user)
        setIsAuthenticated(true)
        setLoading(false)
        console.log('✅ User défini (fallback):', user.email);
      }

      // Récupérer et supprimer l'URL de redirection
      const redirectUrl = localStorage.getItem('redirectAfterLogin')
      if (redirectUrl) {
        localStorage.removeItem('redirectAfterLogin')
      }

      return { success: true, data: { user, token }, redirectUrl }
    }

    // Sinon, appel API classique (admin uniquement maintenant)
    const response = await api.post('/auth/login', {
      email: emailOrUser,
      mot_de_passe: mot_de_passe_or_token
    })
    const { user, token } = response.data.data

    // Valider le token avant de le stocker
    if (!token || token === 'null' || token === 'undefined') {
      throw new Error('Token invalide reçu du serveur')
    }

    localStorage.setItem('token', token)
    console.log('✅ Token stocké dans localStorage:', `${token.length} chars`)

    // Activer la protection contre les 401 pendant 5 secondes
    markJustLoggedIn()

    // Recharger les données complètes de l'utilisateur depuis l'API
    try {
      const meResponse = await api.get('/auth/me')
      setUser(meResponse.data.data)
      setIsAuthenticated(true)
      setLoading(false)
      console.log('✅ User défini:', meResponse.data.data.email);
    } catch (error) {
      // Fallback sur les données retournées par le login
      setUser(user)
      setIsAuthenticated(true)
      setLoading(false)
      console.log('✅ User défini (fallback):', user.email);
    }

    // Récupérer et supprimer l'URL de redirection
    const redirectUrl = localStorage.getItem('redirectAfterLogin')
    if (redirectUrl) {
      localStorage.removeItem('redirectAfterLogin')
    }

    return { ...response.data, redirectUrl }
  }

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData)
    const { user, token } = response.data.data
    localStorage.setItem('token', token)
    setUser(user)
    return response.data
  }

  const logout = () => {
    console.log('🚪 Déconnexion en cours...')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setIsAuthenticated(false)
    markJustLoggedIn() // Marquer qu'on vient de se déconnecter
    console.log('✅ Déconnexion terminée')
  }

  const handleReconnect = () => {
    setShowTokenExpiredModal(false)
    window.location.href = '/auth-help'
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      <TokenExpiredModal
        isOpen={showTokenExpiredModal}
        onReconnect={handleReconnect}
      />
    </AuthContext.Provider>
  )
}

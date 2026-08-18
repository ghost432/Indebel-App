import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

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

  useEffect(() => {
    const url = new URL(window.location.href)
    const incomingToken = url.searchParams.get('auth_token')

    if (incomingToken) {
      localStorage.setItem('token', incomingToken)
      url.searchParams.delete('auth_token')
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
    }

    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const response = await api.get('/auth/me')
        setUser(response.data.data)
      } catch (error) {
        localStorage.removeItem('token')
      }
    }
    setLoading(false)
  }

  const login = async (emailOrUser, mot_de_passe_or_token) => {
    // Si appelé avec user et token (après OTP)
    if (typeof emailOrUser === 'object' && emailOrUser !== null) {
      const user = emailOrUser
      const token = mot_de_passe_or_token
      localStorage.setItem('token', token)
      
      // Recharger les données complètes de l'utilisateur depuis l'API
      try {
        const response = await api.get('/auth/me')
        setUser(response.data.data)
      } catch (error) {
        // Fallback sur les données fournies si l'API échoue
        setUser(user)
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
    localStorage.setItem('token', token)
    
    // Recharger les données complètes de l'utilisateur depuis l'API
    try {
      const meResponse = await api.get('/auth/me')
      setUser(meResponse.data.data)
    } catch (error) {
      // Fallback sur les données retournées par le login
      setUser(user)
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
    localStorage.removeItem('token')
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

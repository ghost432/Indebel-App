import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { LogOut, User, Briefcase, LayoutDashboard, Menu, X, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { profileService } from '../services/profileService'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [profileImage, setProfileImage] = useState(null)
  const profileMenuRef = useRef(null)

  useEffect(() => {
    if (user?.id) {
      // Utiliser profileService pour obtenir l'image
      const image = profileService.getProfileImage(user)
      setProfileImage(image)
    }
  }, [user?.id, user?.photo_profil])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    toast.success('Déconnexion réussie')
    navigate('/login')
  }

  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin/dashboard'
    if (user?.role === 'employer') return '/employer/dashboard'
    if (user?.role === 'freelancer') return '/freelancer/dashboard'
    return '/'
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center h-16 px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <img 
              src="/logo.png" 
              alt="Indebel" 
              className="h-8 sm:h-10 w-auto"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextElementSibling.style.display = 'block'
              }}
            />
            <div className="hidden">
              <Briefcase className="h-6 sm:h-8 w-6 sm:w-8 text-primary-600" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-primary-600">Indebel</span>
          </Link>

          {user && (
            <>
              {/* Desktop Menu */}
              <div className="hidden lg:flex items-center space-x-6">
                <Link
                  to={getDashboardLink()}
                  className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span className="whitespace-nowrap">Dashboard</span>
                </Link>

                <Link
                  to="/jobs"
                  className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <Briefcase className="h-5 w-5" />
                  <span className="whitespace-nowrap">Missions</span>
                </Link>

                {/* Profile Dropdown - Desktop */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg p-2 transition-colors"
                  >
                    <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden">
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm">{profileService.getInitials(user, user?.role)}</span>
                      )}
                    </div>
                    <div className="hidden xl:flex flex-col items-start">
                      <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                        {profileService.getDisplayName(user, user?.role)}
                      </span>
                      <span className="text-xs text-gray-500 capitalize whitespace-nowrap">{user.role}</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <Link
                        to={`/${user.role}/profile`}
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        <span>Mon profil</span>
                      </Link>
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false)
                          handleLogout()
                        }}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Menu Button */}
              <div className="lg:hidden flex items-center space-x-3">
                {/* Profile Image - Mobile */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="h-9 w-9 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden"
                  >
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm">{profileService.getInitials(user, user?.role)}</span>
                    )}
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <Link
                        to={`/${user.role}/profile`}
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        <span>Mon profil</span>
                      </Link>
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false)
                          handleLogout()
                        }}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-gray-700 hover:text-primary-600 transition-colors"
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        {user && mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4 px-4 space-y-2">
            <Link
              to={getDashboardLink()}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/jobs"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Briefcase className="h-5 w-5" />
              <span>Missions</span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar

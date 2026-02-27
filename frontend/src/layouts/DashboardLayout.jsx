import { useState, useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import AdminSidebar from '../components/AdminSidebar'
import NotificationBell from '../components/NotificationBell'
import SupportBell from '../components/SupportBell'
import VerificationPopup from '../components/VerificationPopup'
import LabelPopup from '../components/LabelPopup'
import { LogOut, Menu, X, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { profileService } from '../services/profileService'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useLabelCheck from '../hooks/useLabelCheck'

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [profileImage, setProfileImage] = useState(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { showLabelPopup, demandeLabelEnAttente, closePopup, handleAccept } = useLabelCheck()

  useEffect(() => {
    // Close sidebar on mobile by default
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (user?.id) {
      const image = profileService.getProfileImage(user)
      if (image) setProfileImage(image)
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleLogout = () => {
    logout()
    toast.success('Déconnexion réussie')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Popup de vérification d'identité */}
      <VerificationPopup />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:relative ${sidebarOpen ? 'block' : 'hidden lg:block'} z-50 lg:z-auto`}>
        {user?.role === 'admin' ? (
          <AdminSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        ) : (
          <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        )}
      </div>

      {/* Main content */}
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}
          px-4 sm:px-6 lg:px-8 pt-4
        `}
      >
        {/* Top bar */}
        <div className="bg-white rounded-lg lg:rounded-[20px] shadow-sm mb-4 lg:mb-6 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 flex-shrink-0"
            >
              {sidebarOpen && window.innerWidth < 1024 ? (
                <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              ) : (
                <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              )}
            </button>
            <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">
              <span className="hidden sm:inline">Bienvenue, </span>{user?.prenom || user?.nom}
            </h1>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <SupportBell />
            <NotificationBell />

            {/* Profile dropdown - Desktop & Mobile */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user?.nom?.charAt(0).toUpperCase()
                  )}
                </div>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false)
                      navigate(`/${user.role}/profile`)
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span>Mon profil</span>
                  </button>
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
        </div>

        {/* Page content with rounded corners */}
        <div
          className="bg-white rounded-lg lg:rounded-[20px] shadow-sm p-4 sm:p-6 mb-4 lg:mb-6 overflow-x-auto"
          style={{ minHeight: 'calc(100vh - 12rem)' }}
        >
          <Outlet />
        </div>
      </div>

      {/* Label Popup */}
      {showLabelPopup && demandeLabelEnAttente && (
        <LabelPopup
          demande={demandeLabelEnAttente}
          onClose={closePopup}
          onAccept={handleAccept}
        />
      )}
    </div>
  )
}

export default DashboardLayout

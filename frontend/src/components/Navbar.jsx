import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { LogOut, User, Briefcase, LayoutDashboard, X, ChevronDown, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { profileService } from '../services/profileService'

const Navbar = () => {
  const { user, loading: authLoading, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [profileImage, setProfileImage] = useState(null)
  const desktopProfileMenuRef = useRef(null)
  const mobileProfileMenuRef = useRef(null)

  useEffect(() => {
    if (user?.id) {
      // Utiliser profileService pour obtenir l'image
      const image = profileService.getProfileImage(user)
      setProfileImage(image)
    }
  }, [user?.id, user?.photo_profil])

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideDesktop = desktopProfileMenuRef.current?.contains(event.target)
      const clickedInsideMobile = mobileProfileMenuRef.current?.contains(event.target)
      if (!clickedInsideDesktop && !clickedInsideMobile) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    toast.success('Déconnexion réussie')
    setProfileMenuOpen(false)
    setMobileMenuOpen(false)
    navigate('/login', { replace: true })
  }

  const handleProfileNavigation = () => {
    setProfileMenuOpen(false)
    setMobileMenuOpen(false)
    navigate(getProfileLink())
  }

  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin/dashboard'
    if (user?.role === 'employer') return '/employer/dashboard'
    if (user?.role === 'freelancer') return '/freelancer/dashboard'
    return '/'
  }

  const getRoleLabel = (role) => {
    if (role === 'admin') return 'Admin'
    if (role === 'employer') return 'Recruteur'
    if (role === 'freelancer') return 'Prestataire'
    return 'Compte'
  }

  const getProfileLink = () => {
    if (user?.role === 'admin') return '/admin/profile'
    if (user?.role === 'employer' || user?.role === 'recruteur') return '/employer/profile'
    if (user?.role === 'freelancer' || user?.role === 'prestataire') return '/freelancer/profile'
    return '/profile'
  }

  const navItems = [
    user
      ? { label: 'Tableau de bord', path: getDashboardLink(), icon: LayoutDashboard }
      : { label: 'Accueil', path: 'https://indebel.be', icon: LayoutDashboard, external: true },
    { label: 'Devis', path: '/devis', icon: FileText },
    { label: 'Missions', path: '/missions', icon: Briefcase }
  ]

  const isActive = (item) => {
    if (item.external) return false
    if (item.path === '/devis') return location.pathname === '/devis' || location.pathname.startsWith('/devis/')
    if (item.path === '/missions') return location.pathname === '/missions' || location.pathname.startsWith('/missions/')
    return location.pathname === item.path
  }

  const NavItem = ({ item, mobile = false }) => {
    const Icon = item.icon
    const active = isActive(item)
    const className = mobile
      ? `flex items-center space-x-3 rounded-2xl px-4 py-3 font-bold transition-colors ${
          active ? 'bg-[#082151] text-white shadow-sm' : 'text-[#082151] hover:bg-slate-100'
        }`
      : `inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-black transition ${
          active ? 'bg-[#082151] text-white shadow-sm' : 'text-[#082151] hover:bg-white hover:text-[#c02525] hover:shadow-sm'
        }`

    if (item.external) {
      return (
        <a href={item.path} className={className}>
          <Icon className={mobile ? 'h-5 w-5' : 'h-4 w-4'} />
          <span className="whitespace-nowrap">{item.label}</span>
        </a>
      )
    }

    return (
      <Link to={item.path} onClick={() => mobile && setMobileMenuOpen(false)} className={className}>
        <Icon className={mobile ? 'h-5 w-5' : 'h-4 w-4'} />
        <span className="whitespace-nowrap">{item.label}</span>
      </Link>
    )
  }

  const HamburgerIcon = () => (
    <span className="flex h-6 w-6 flex-col items-end justify-center gap-1.5" aria-hidden="true">
      <span className="h-0.5 w-6 rounded-full bg-current" />
      <span className="h-0.5 w-3.5 rounded-full bg-current" />
    </span>
  )

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="container-custom">
        <div className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-3 px-4">
          {/* Logo */}
          <a href="https://indebel.be" className="flex items-center justify-start" aria-label="Aller sur indebel.be">
            <img 
              src="/logo.png" 
              alt="Indebel" 
              className="h-9 w-auto sm:h-11"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextElementSibling.style.display = 'block'
              }}
            />
            <div className="hidden">
              <Briefcase className="h-6 sm:h-8 w-6 sm:w-8 text-primary-600" />
            </div>
          </a>

          <div className="hidden justify-center lg:flex">
            <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 p-1">
              {navItems.map((item) => <NavItem key={item.label} item={item} />)}
            </div>
          </div>

          {user && (
            <>
              {/* Desktop Menu */}
              <div className="hidden items-center justify-end lg:flex">
                {/* Profile Dropdown - Desktop */}
                <div className="relative" ref={desktopProfileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 shadow-sm transition hover:border-[#2A4DEF] hover:bg-slate-50"
                    aria-label="Ouvrir le menu du profil"
                    aria-expanded={profileMenuOpen}
                  >
                    <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2A4DEF] text-white shadow-sm">
                      <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white/10 font-semibold">
                        {profileImage ? (
                          <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2b4eef] to-[#df6422] text-white font-bold text-sm">{profileService.getInitials(user, user?.role)}</span>
                        )}
                      </span>
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#c02525]">
                        <ChevronDown className={`h-3 w-3 text-white transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
                      </span>
                    </div>
                    <div className="hidden xl:flex flex-col items-start">
                      <span className="text-sm font-black text-[#2A4DEF] whitespace-nowrap">
                        {profileService.getDisplayName(user, user?.role)}
                      </span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{getRoleLabel(user.role)}</span>
                    </div>
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <button
                        type="button"
                        onClick={handleProfileNavigation}
                        className="flex w-full items-center space-x-2 px-4 py-2 text-left text-gray-700 transition-colors hover:bg-gray-100"
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

              {/* Mobile Menu Button */}
              <div className="flex items-center justify-end gap-4 lg:hidden">
                {/* Profile Image - Mobile */}
                <div className="relative" ref={mobileProfileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2A4DEF] text-white shadow-sm transition hover:bg-[#4962D5]"
                    aria-label="Ouvrir le menu du profil"
                    aria-expanded={profileMenuOpen}
                  >
                    <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white/10 font-semibold">
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2b4eef] to-[#df6422] text-white font-bold text-sm">{profileService.getInitials(user, user?.role)}</span>
                      )}
                    </span>
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#c02525]">
                      <ChevronDown className={`h-3 w-3 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
                    </span>
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <button
                        type="button"
                        onClick={handleProfileNavigation}
                        className="flex w-full items-center space-x-2 px-4 py-2 text-left text-gray-700 transition-colors hover:bg-gray-100"
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

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#2A4DEF] shadow-sm transition hover:border-[#2A4DEF] hover:bg-slate-50"
                  aria-label="Ouvrir le menu principal"
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <HamburgerIcon />}
                </button>
              </div>
            </>
          )}

          {!authLoading && !user && (
            <div className="flex items-center justify-end gap-2">
              <div className="hidden items-center gap-2 lg:flex">
                <Link
                  to="/login"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-[#082151]/20 bg-white px-5 text-sm font-black text-[#082151] shadow-sm transition hover:border-[#082151] hover:bg-slate-50"
                >
                  Se connecter
                </Link>
                <Link
                  to="/register"
                  className="inline-flex h-10 items-center justify-center rounded-full bg-[#df6422] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#f07633]"
                >
                  S'inscrire
                </Link>
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#2A4DEF] shadow-sm transition hover:border-[#2A4DEF] hover:bg-slate-50 lg:hidden"
                aria-label="Ouvrir le menu principal"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <HamburgerIcon />}
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4 px-4 space-y-2">
            {navItems.map((item) => <NavItem key={item.label} item={item} mobile />)}
            {!authLoading && !user && (
              <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-4">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#082151]/20 bg-white px-3 text-center text-sm font-black text-[#082151]"
                >
                  Se connecter
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#df6422] px-3 text-center text-sm font-black text-white"
                >
                  S'inscrire
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar

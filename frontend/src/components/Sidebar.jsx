import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  User, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  FileText,
  PlusCircle,
  Bell,
  MessageSquare,
  LifeBuoy,
  Shield,
  Package,
  Star,
  Receipt,
  Send,
  Bot,
  X
} from 'lucide-react'
import VerificationBadge from './VerificationBadge'
import UserBadges from './UserBadges'
import { useAuth } from '../context/AuthContext'
import { getEmployerJobsUrl } from '../utils/slugify'
import { profileService } from '../services/profileService'

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user } = useAuth()
  const location = useLocation()
  const [profileImage, setProfileImage] = useState(null)
  const [missionsOpen, setMissionsOpen] = useState(false)
  const [devisOpen, setDevisOpen] = useState(false)
  const [avisOpen, setAvisOpen] = useState(false)

  useEffect(() => {
    // Utiliser profileService pour obtenir l'image de manière centralisée
    if (user?.id) {
      const image = profileService.getProfileImage(user)
      setProfileImage(image)
    } else {
      setProfileImage(null)
    }
  }, [user?.id, user?.photo_profil])

  useEffect(() => {
    if (location.pathname.startsWith('/freelancer/evaluations')) {
      setAvisOpen(true)
    }
    if (location.pathname.startsWith('/freelancer/devis')) {
      setDevisOpen(true)
    }
    if (
      location.pathname.startsWith('/freelancer/list-missions') ||
      location.pathname.startsWith('/freelancer/applications') ||
      location.pathname.startsWith('/freelancer/my-jobs')
    ) {
      setMissionsOpen(true)
    }
  }, [location.pathname])

  const isActive = (path) => {
    return location.pathname === path
  }

  const employerJobsUrl = useMemo(() => {
    return getEmployerJobsUrl(user)
  }, [user])

  const getMenuItems = () => {
    // Récupérer le nombre de messages non lus
    const unreadCount = user?.unread_messages_count || 0;

    if (user?.role === 'employer') {
      return [
        { 
          icon: LayoutDashboard, 
          label: 'Tableau de bord', 
          path: '/employer/dashboard' 
        },
        {
          type: 'group',
          label: 'Devis',
          icon: FileText,
          isOpen: devisOpen,
          onClick: () => setDevisOpen((open) => !open),
          items: [
            { label: 'Demander un devis', path: '/demande-devis', icon: FileText, indent: true },
            { label: 'Mes demandes (publiées)', path: '/employer/demandes-devis', icon: FileText, indent: true },
            { label: 'Devis reçus', path: '/employer/devis-recus', icon: FileText, indent: true },
            { label: 'Factures', path: '/employer/factures', icon: Receipt, indent: true }
          ]
        },
        {
          type: 'group',
          label: 'Missions',
          icon: Briefcase,
          isOpen: missionsOpen,
          onClick: () => setMissionsOpen((open) => !open),
          items: [
            { label: 'Mes missions', path: employerJobsUrl, icon: Briefcase, indent: true },
            { label: 'Publier une mission', path: '/employer/publish-mission', icon: PlusCircle, indent: true },
            { label: 'Candidatures', path: '/employer/applications', icon: Users, indent: true }
          ]
        },
        { 
          icon: Users, 
          label: 'Prestataires', 
          path: '/employer/list-freelancers' 
        },
        { 
          icon: MessageSquare, 
          label: 'Messages', 
          path: '/employer/mes-messages' 
        },
        { 
          icon: Package, 
          label: 'Forfaits', 
          path: '/employer/forfaits' 
        },
        { 
          icon: LifeBuoy, 
          label: 'Support', 
          path: '/employer/support' 
        },
        { 
          icon: Bell, 
          label: 'Notifications', 
          path: '/employer/notifications' 
        },
        { 
          icon: User, 
          label: 'Profil', 
          path: '/employer/profile' 
        },
        { 
          icon: Settings, 
          label: 'Paramètres', 
          path: '/employer/settings' 
        }
      ]
    }

    if (user?.role === 'freelancer') {
      return [
        { 
          icon: LayoutDashboard, 
          label: 'Tableau de bord', 
          path: '/freelancer/dashboard' 
        },
        {
          type: 'group',
          label: 'Devis',
          icon: FileText,
          isOpen: devisOpen,
          onClick: () => setDevisOpen((open) => !open),
          items: [
            { label: 'Devis disponibles', path: '/freelancer/devis-disponibles', icon: FileText, indent: true },
            { label: 'Devis envoyés manuellement', path: '/freelancer/devis-envoyes', icon: Send, indent: true },
            { label: 'Devis envoyés par IA', path: '/freelancer/devis-ia', icon: Bot, indent: true },
            { label: 'Factures', path: '/freelancer/factures', icon: Receipt, indent: true }
          ]
        },
        {
          type: 'group',
          label: 'Missions',
          icon: Briefcase,
          isOpen: missionsOpen,
          onClick: () => setMissionsOpen((open) => !open),
          items: [
            { label: 'Missions disponibles', path: '/freelancer/list-missions', icon: Briefcase, indent: true },
            { label: 'Mes demandes', path: '/freelancer/applications', icon: FileText, indent: true },
            { label: 'Mes missions postulées', path: '/freelancer/my-jobs', icon: FileText, indent: true }
          ]
        },
        { 
          icon: Users, 
          label: 'Recruteurs', 
          path: '/freelancer/list-employers' 
        },
        { 
          icon: MessageSquare, 
          label: 'Messages', 
          path: '/freelancer/mes-messages' 
        },
        {
          type: 'group',
          label: 'Avis',
          icon: Star,
          isOpen: avisOpen,
          onClick: () => setAvisOpen((open) => !open),
          items: [
            { label: 'Avis après missions', path: '/freelancer/evaluations', icon: Star, indent: true },
            { label: 'Avis particuliers', path: '/freelancer/evaluations-particulier', icon: MessageSquare, indent: true }
          ]
        },
        { 
          icon: Shield, 
          label: 'Vérification d\'identité', 
          path: '/freelancer/verification' 
        },
        { 
          icon: Package, 
          label: 'Forfaits', 
          path: '/freelancer/forfaits' 
        },
        { 
          icon: LifeBuoy, 
          label: 'Support', 
          path: '/freelancer/support/create' 
        },
        { 
          icon: Bell, 
          label: 'Notifications', 
          path: '/freelancer/notifications' 
        },
        { 
          icon: User, 
          label: 'Profil', 
          path: '/freelancer/profile' 
        },
        { 
          icon: Settings, 
          label: 'Paramètres', 
          path: '/freelancer/settings' 
        }
      ]
    }

    return []
  }

  const menuItems = getMenuItems()
  const isFreePlan = Boolean(user?.forfait_nom) && String(user.forfait_nom).toLowerCase().includes('gratuit')
  const forfaitPath = user?.role === 'employer' ? '/employer/forfaits' : '/freelancer/forfaits'

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          indebel-sidebar fixed top-0 left-0 h-screen bg-white shadow-xl z-30
          transition-all duration-300 ease-in-out
          ${isOpen ? 'w-64' : 'w-20'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          borderRadius: '20px',
          margin: '1rem',
          marginRight: '0.5rem',
          height: 'calc(100vh - 2rem)'
        }}
      >
        {/* Header du sidebar */}
        <div className="px-3 py-2 border-b">
          <div className="flex items-center justify-between">
            <Link to="/" className={`flex items-center justify-center ${isOpen ? 'w-full' : 'w-full'}`}>
              <img 
                src="/logo.png" 
                alt="Logo" 
                className={`object-contain transition-all duration-300 ${isOpen ? 'h-14 w-28' : 'h-11 w-11'}`}
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextElementSibling.style.display = 'block'
                }}
              />
              <div className="hidden">
                <Briefcase className={`text-primary-600 transition-all duration-300 ${isOpen ? 'h-14 w-14' : 'h-11 w-11'}`} />
              </div>
            </Link>
            
            {/* Bouton fermer (mobile uniquement) */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
              aria-label="Fermer la navigation"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>


        {/* Menu items */}
        <nav className="mt-4 px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-thin">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            const hasSubmenu = item.type === 'group' && item.items
            
            if (hasSubmenu) {
              return (
                <div key={item.label} className="mb-2">
                  <button
                    onClick={item.onClick}
                    className={`
                      w-full flex items-center justify-between space-x-3 px-3 py-3 rounded-2xl
                      transition-all duration-200
                      text-[#082151] hover:bg-primary-50 hover:text-primary-600 font-semibold
                      ${!isOpen ? 'justify-center' : ''}
                    `}
                    title={!isOpen ? item.label : ''}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5" />
                      {isOpen && (
                        <span className="font-bold">{item.label}</span>
                      )}
                    </div>
                    {isOpen && (
                      <ChevronRight 
                        className={`h-4 w-4 transition-transform ${item.isOpen ? 'transform rotate-90' : ''}`} 
                      />
                    )}
                  </button>
                  
                  {/* Sous-menus */}
                  {isOpen && item.isOpen && item.items?.map((subItem, index) => (
                    <Link
                      key={index}
                      to={subItem.path}
                      onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                      className={`
                        flex items-center space-x-3 px-3 py-2.5 rounded-2xl mx-2 my-1
                        transition-all duration-200 text-sm
                        ${isActive(subItem.path) 
                          ? 'bg-primary-100 text-primary-700 font-bold' 
                          : 'text-[#082151]/85 hover:bg-gray-100 hover:text-gray-900 font-semibold'
                        }
                        ${subItem.indent ? 'pl-10' : 'pl-3'}
                      `}
                    >
                      {subItem.icon && (
                        <subItem.icon className="h-4 w-4" />
                      )}
                      <span>{subItem.label}</span>
                    </Link>
                  ))}
                </div>
              )
            }
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                className={`
                  flex items-center space-x-3 px-3 py-3 rounded-2xl
                  transition-all duration-200
                  ${active 
                    ? 'bg-primary-600 text-white shadow-md' 
                    : 'text-[#082151] hover:bg-primary-50 hover:text-primary-600 font-semibold'
                  }
                  ${!isOpen && 'justify-center'}
                `}
                title={!isOpen ? item.label : ''}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-white' : ''}`} />
                {isOpen && (
                  <span className="font-bold">{item.label}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer du sidebar - Visible sur mobile et desktop */}
        <div className={`mt-auto border-t flex-shrink-0 bg-gray-50 rounded-br-[20px] ${
          isOpen ? 'p-3' : 'p-2'
        }`}>
          <Link 
            to={user?.role === 'employer' ? '/employer/profile' : '/freelancer/profile'}
            onClick={() => window.innerWidth < 1024 && toggleSidebar()}
            className="flex items-center hover:bg-white/10 rounded-2xl p-2 -m-2 transition-colors"
          >
            {isOpen ? (
              <div className="flex items-center space-x-3 w-full">
                <div className="relative">
                  {profileImage ? (
                    <img 
                      src={profileImage} 
                      alt={user?.prenom || 'Profil'} 
                      className="h-10 w-10 rounded-full border-2 border-[#2A4DEF] object-cover ring-4 ring-white"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full border-2 border-[#2A4DEF] flex items-center justify-center font-medium ring-4 ring-white bg-gradient-to-br from-[#2b4eef] to-[#df6422] text-white font-bold">
                      {profileService.getInitials(user, user?.role)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-bold text-slate-900 truncate" title={user?.denomination || ''}>
                        {profileService.getDisplayName(user, user?.role)}
                      </p>
                      {(user?.role === 'employer' || user?.role === 'freelancer') && (
                        <VerificationBadge 
                          status={user?.statut_verification || 'non_verifie'} 
                          premium={user?.forfait_badge_premium}
                          size="xs" 
                          showText={false}
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-slate-700 font-medium">
                        {user?.role === 'employer' ? `Recruteur • ${user?.forfait_nom || 'Forfait inconnu'}` : 'Prestataire'}
                        {(user?.forfait_nom && user?.role === 'freelancer') ? ` • ${user.forfait_nom}` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center w-full">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt={user?.prenom || 'Profil'} 
                    className="h-10 w-10 rounded-full border-2 border-[#2A4DEF] object-cover ring-4 ring-white"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full border-2 border-[#2A4DEF] flex items-center justify-center font-medium ring-4 ring-white bg-gradient-to-br from-[#2b4eef] to-[#df6422] text-white font-bold">
                    {profileService.getInitials(user, user?.role)}
                  </div>
                )}
              </div>
            )}
          </Link>
          {isOpen && user?.role !== 'admin' && isFreePlan && (
            <Link
              to={forfaitPath}
              onClick={() => window.innerWidth < 1024 && toggleSidebar()}
              className="mt-3 block rounded-2xl border border-[#c02525]/20 bg-white px-3 py-2 text-center text-[11px] font-black uppercase tracking-[0.12em] text-[#c02525] shadow-sm animate-pulse"
            >
              Mettre à niveau votre forfait
            </Link>
          )}
        </div>
      </aside>
    </>
  )
}

export default Sidebar

import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  Users, 
  Briefcase,
  Settings, 
  ChevronLeft,
  ChevronRight,
  FileText,
  Shield,
  TrendingUp,
  Bell,
  LifeBuoy,
  FolderTree,
  Layers,
  ChevronDown,
  ChevronUp,
  Globe,
  CreditCard,
  MapPin,
  Plus,
  Package,
  Receipt,
  Send,
  Building2,
  Bot,
  Star,
  X
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import VerificationBadge from './VerificationBadge'
import { profileService } from '../services/profileService'

const AdminSidebar = ({ isOpen, toggleSidebar }) => {
  const { user } = useAuth()
  
  let permissions = { pages: [], roles: [] }
  if (user?.admin_permissions) {
    try {
      permissions = typeof user.admin_permissions === 'string' ? JSON.parse(user.admin_permissions) : user.admin_permissions;
    } catch(e) {}
  }
  const isSuperAdmin = user?.email === 'noreply@indebel.be'
  
  const hasPageAccess = (page) => {
    if (isSuperAdmin) return true;
    return permissions.pages?.includes(page)
  }

  const location = useLocation()
  const [profileImage, setProfileImage] = useState(null)
  const [expandedMenus, setExpandedMenus] = useState({})

  const toggleSubMenu = (label) => {
    setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }))
  }

  useEffect(() => {
    if (user?.id) {
      setProfileImage(profileService.getProfileImage(user))
    } else {
      setProfileImage(null)
    }
  }, [user?.id, user?.photo_profil])

  const isActive = (path) => {
    const current = `${location.pathname}${location.search}`
    if (path.includes('?')) return current === path
    return location.pathname === path && !location.search
  }


  const allMenuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Tableau de bord', 
      path: '/admin/dashboard',
      pageId: 'dashboard'
    },
    { 
      icon: TrendingUp, 
      label: 'Statistiques', 
      path: '/admin/stats',
      pageId: 'analytics'
    },
    { 
      icon: Users, 
      label: 'Utilisateurs',
      pageId: 'users',
      subItems: [
        { icon: Users, label: 'Tous les utilisateurs', path: '/admin/users' },
        { icon: Users, label: 'Prestataires', path: '/admin/users?role=freelancer' },
        { icon: Users, label: 'Recruteurs', path: '/admin/users?role=employer' },
        { icon: Users, label: 'Administrateurs', path: '/admin/users?role=admin' }
      ]
    },
    { 
      icon: FileText, 
      label: 'Devis',
      pageId: 'devis',
      subItems: [
        { icon: FileText, label: 'Devis disponibles', path: '/admin/devis' },
        { icon: Send, label: 'Devis envoyés manuellement', path: '/admin/devis?vue=envoyes' },
        { icon: Bot, label: 'Devis envoyés par IA', path: '/admin/devis?vue=ia' },
        { icon: Receipt, label: 'Factures Falco', path: '/admin/factures' }
      ]
    },
    { 
      icon: Briefcase, 
      label: 'Missions',
      pageId: 'missions',
      subItems: [
        { icon: Plus, label: 'Publier une mission', path: '/admin/publish-mission' },
        { icon: Briefcase, label: 'Liste des missions', path: '/admin/jobs' },
        { icon: Briefcase, label: 'Candidatures missions', path: '/admin/applications' },
        { icon: FolderTree, label: 'Secteurs', path: '/admin/secteurs' },
        { icon: Layers, label: 'Compétences', path: '/admin/competences' },
        { icon: Globe, label: 'Langues', path: '/admin/langues' },
        { icon: CreditCard, label: 'Type de facturation', path: '/admin/type-facturation' },
        { icon: FileText, label: 'Type de mission', path: '/admin/type-mission' },
        { icon: MapPin, label: 'Lieu de mission', path: '/admin/lieu-mission' }
      ]
    },
    { 
      icon: Shield, 
      label: 'Vérification d\'identité', 
      path: '/admin/verifications',
      pageId: 'verifications'
    },
    { 
      icon: Building2, 
      label: 'Vérification BCE', 
      path: '/admin/verification-bce',
      pageId: 'verification-bce'
    },
    { 
      icon: LifeBuoy, 
      label: 'Support', 
      path: '/admin/support',
      pageId: 'support'
    },
    { 
      icon: Bell, 
      label: 'Messages',
      pageId: 'newsletter',
      subItems: [
        { icon: Bell, label: 'Mes notifications', path: '/admin/notifications' },
        { icon: Plus, label: 'Envoyer une notification', path: '/admin/send-notification' }
      ]
    },
    { 
      icon: Star, 
      label: 'Avis',
      pageId: 'avis',
      subItems: [
        { icon: Star, label: 'Avis prestataires', path: '/admin/avis-prestataires' },
        { icon: Star, label: 'Avis missions', path: '/admin/avis-missions' }
      ]
    },
    { 
      icon: Package, 
      label: 'Forfaits', 
      path: '/admin/forfaits',
      pageId: 'forfaits'
    },
    { 
      icon: Send, 
      label: 'Newsletter', 
      path: '/admin/newsletter',
      pageId: 'newsletter'
    },
    { 
      icon: Globe, 
      label: 'SEO', 
      path: '/admin/seo',
      pageId: 'seo'
    },
    { 
      icon: Settings, 
      label: 'Paramètres', 
      path: '/admin/settings',
      pageId: 'settings'
    }
  ]

  const menuItems = allMenuItems.filter(item => hasPageAccess(item.pageId));

  return (
    <aside
      className={`
        indebel-sidebar fixed left-0 top-0 h-screen bg-white shadow-xl z-40 transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64' : 'w-20'}
      `}
      style={{
        borderRadius: '20px',
        margin: '1rem',
        marginRight: '0.5rem',
        height: 'calc(100vh - 2rem)'
      }}
    >
      <div className="flex flex-col h-full">
        {/* Header avec logo */}
        <div className="px-3 py-2 border-b relative">
          <div className="flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Indebel" 
              className={`object-contain transition-all duration-300 ${isOpen ? 'h-14 w-28' : 'h-11 w-11'}`}
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
          
          {/* Bouton fermer (mobile uniquement) */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
            aria-label="Fermer la navigation"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = item.path ? isActive(item.path) : false
            const hasSubItems = item.subItems && item.subItems.length > 0
            const isExpanded = expandedMenus[item.label]

            return (
              <div key={item.label}>
                {hasSubItems ? (
                  <button
                    onClick={() => isOpen && toggleSubMenu(item.label)}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-3 rounded-2xl mb-1 transition-all
                      text-[#082151] hover:bg-gray-100 font-semibold
                      ${!isOpen && 'justify-center'}
                    `}
                    title={!isOpen ? item.label : ''}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0 text-[#082151]/80" />
                    {isOpen && (
                      <>
                        <span className="font-bold flex-1 text-left">{item.label}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-650" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-650" />
                        )}
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    className={`
                      flex items-center space-x-3 px-4 py-3 rounded-2xl mb-1 transition-all
                      ${active 
                        ? 'bg-primary-600 text-white shadow-md' 
                        : 'text-[#082151] hover:bg-gray-100 font-semibold'
                      }
                      ${!isOpen && 'justify-center'}
                    `}
                    title={!isOpen ? item.label : ''}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-white' : 'text-[#082151]/80'}`} />
                    {isOpen && (
                      <span className="font-bold">{item.label}</span>
                    )}
                  </Link>
                )}

                {/* Sub Items */}
                {hasSubItems && isOpen && isExpanded && (
                  <div className="ml-4 space-y-1 mb-2">
                    {item.subItems.map((subItem) => {
                      const SubIcon = subItem.icon
                      const subActive = isActive(subItem.path)
                      
                      return (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={`
                            flex items-center space-x-3 px-4 py-2 rounded-2xl transition-all text-sm
                            ${subActive 
                              ? 'bg-primary-100 text-primary-700 font-bold' 
                              : 'text-[#082151]/80 hover:bg-gray-50 font-semibold'
                            }
                          `}
                        >
                          <SubIcon className="h-4 w-4 flex-shrink-0" />
                          <span>{subItem.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer avec badge Admin */}
        {isOpen && (
          <div className="mt-auto p-3 border-t flex-shrink-0 bg-gradient-to-r from-red-50 to-orange-50 rounded-br-[20px]">
            <Link 
              to="/admin/profile"
              className="flex items-center space-x-3 hover:bg-white/10 rounded-2xl p-2 -m-2 transition-colors"
            >
              <div className="h-10 w-10 bg-gradient-to-br from-[#2b4eef] to-[#df6422] rounded-full border-2 border-[#2A4DEF] flex items-center justify-center text-white font-semibold overflow-hidden ring-4 ring-white">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm">{profileService.getInitials(user, user?.role)}</span>
                )}
              </div>
              <div className="flex flex-col overflow-hidden flex-1">
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-bold text-slate-900 truncate">
                    {user?.prenom} {user?.nom || 'Admin'}
                  </span>
                  <VerificationBadge status="verifie" size="sm" showText={false} />
                </div>
                <span className="text-xs text-red-600 font-semibold flex items-center">
                  <Shield className="h-3 w-3 mr-1" />
                  Administrateur
                </span>
              </div>
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}

export default AdminSidebar

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
  FolderTree,
  Layers,
  ChevronDown,
  ChevronUp,
  Globe,
  CreditCard,
  MapPin,
  Plus,
  Package,
  X,
  Headphones,
  Award,
  Smartphone
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import VerificationBadge from './VerificationBadge'
import UserNameWithLabel from './UserNameWithLabel'
import LabelBadge from './LabelBadge'

const AdminSidebar = ({ isOpen, toggleSidebar }) => {
  const { user } = useAuth()
  const location = useLocation()
  const [profileImage, setProfileImage] = useState(null)
  const [expandedMenus, setExpandedMenus] = useState({})

  const toggleSubMenu = (label) => {
    setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }))
  }

  useEffect(() => {
    // Charger l'image de profil: priorité à user.photo_profil, puis localStorage
    if (user?.id) {
      if (user.photo_profil) {
        setProfileImage(user.photo_profil)
      } else {
        const savedImage = localStorage.getItem(`profileImage_${user.id}`)
        if (savedImage) {
          setProfileImage(savedImage)
        } else {
          setProfileImage(null)
        }
      }
    } else {
      setProfileImage(null)
    }
  }, [user?.id, user?.photo_profil])

  const isActive = (path) => {
    return location.pathname === path
  }

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Tableau de bord',
      path: '/admin/dashboard'
    },
    {
      icon: TrendingUp,
      label: 'Statistiques',
      path: '/admin/stats'
    },
    {
      icon: Users,
      label: 'Utilisateurs',
      path: '/admin/users'
    },
    {
      icon: Briefcase,
      label: 'Missions',
      subItems: [
        { icon: Plus, label: 'Publier une mission', path: '/admin/publish-mission' },
        { icon: Users, label: 'Missions Prestataires', path: '/admin/missions-prestataires' },
        { icon: Shield, label: 'Modération Mission', path: '/admin/missions' },
        { icon: Briefcase, label: 'Liste des missions', path: '/admin/jobs' },
        { icon: Globe, label: 'Langues', path: '/admin/langues' },
        { icon: CreditCard, label: 'Type de facturation', path: '/admin/type-facturation' },
        { icon: FileText, label: 'Type de mission', path: '/admin/type-mission' },
        { icon: MapPin, label: 'Lieu de mission', path: '/admin/lieu-mission' }
      ]
    },
    {
      icon: FileText,
      label: 'Demandes',
      subItems: [
        { icon: Briefcase, label: 'Candidatures Jobs', path: '/admin/applications' },
        { icon: FileText, label: 'Demandes Missions', path: '/admin/demandes' },
        { icon: FileText, label: 'Demandes de Devis', path: '/admin/devis' }
      ]
    },
    {
      icon: FolderTree,
      label: 'Secteurs',
      path: '/admin/secteurs'
    },
    {
      icon: Layers,
      label: 'Compétences',
      path: '/admin/competences'
    },
    {
      icon: Bell,
      label: 'Notifications',
      subItems: [
        { icon: Bell, label: 'Mes notifications', path: '/admin/notifications' },
        { icon: Plus, label: 'Envoyer une notification', path: '/admin/send-notification' }
      ]
    },
    {
      icon: Shield,
      label: 'Vérification d\'identité',
      path: '/admin/verifications'
    },
    {
      icon: Package,
      label: 'Forfaits',
      path: '/admin/forfaits'
    },
    {
      icon: FileText,
      label: 'Factures',
      path: '/admin/factures'
    },
    {
      icon: Smartphone,
      label: 'PWA & Analytics',
      path: '/admin/pwa'
    },
    {
      icon: Headphones,
      label: 'Support',
      path: '/admin/support'
    },
    {
      icon: Award,
      label: 'Labels Indebel',
      subItems: [
        { icon: Shield, label: 'Utilisateurs éligibles', path: '/admin/label/eligible-users' },
        { icon: FileText, label: 'Demandes exceptionnelles', path: '/admin/label/exceptional-requests' },
        { icon: Award, label: 'Gestion des labels', path: '/admin/label' }
      ]
    },
    {
      icon: Settings,
      label: 'Paramètres',
      path: '/admin/settings'
    }
  ]

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen bg-white shadow-xl z-40 transition-all duration-300 ease-in-out
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
        <div className="p-4 border-b relative">
          <div className="flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Indebel"
              className={`object-contain transition-all duration-300 ${isOpen ? 'h-20 w-32' : 'h-16 w-16'}`}
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>

          {/* Bouton fermer (mobile uniquement) */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 pb-20">
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
                      w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-all
                      text-gray-700 hover:bg-gray-100
                      ${!isOpen && 'justify-center'}
                    `}
                    title={!isOpen ? item.label : ''}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0 text-gray-600" />
                    {isOpen && (
                      <>
                        <span className="font-medium flex-1 text-left">{item.label}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    className={`
                      flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-all
                      ${active
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                      ${!isOpen && 'justify-center'}
                    `}
                    title={!isOpen ? item.label : ''}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-white' : 'text-gray-600'}`} />
                    {isOpen && (
                      <span className="font-medium">{item.label}</span>
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
                            flex items-center space-x-3 px-4 py-2 rounded-lg transition-all text-sm
                            ${subActive
                              ? 'bg-primary-100 text-primary-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
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
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gradient-to-r from-red-50 to-orange-50 rounded-br-[20px]">
            <Link
              to="/admin/profile"
              className="flex items-center space-x-3 hover:bg-white/50 rounded-lg p-2 -m-2 transition-colors"
            >
              <div className="h-10 w-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span><Shield className="h-5 w-5" /></span>
                )}
              </div>
              <div className="flex flex-col overflow-hidden flex-1">
                <div className="flex items-center space-x-1">
                  <UserNameWithLabel user={user} showLabel={false} />
                  <VerificationBadge status="verifie" size="sm" showText={false} />
                  <LabelBadge userId={user?.id} size="sm" />
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

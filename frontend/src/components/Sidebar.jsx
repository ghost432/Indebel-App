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
  Home,
  MessageSquare,
  Shield,
  Package,
  Building,
  Star,
  X,
  Headphones,
  Award
} from 'lucide-react'
import VerificationBadge from './VerificationBadge'
import UserBadges from './UserBadges'
import LabelBadge from './LabelBadge'
import { useAuth } from '../context/AuthContext'
import { getEmployerJobsUrl } from '../utils/slugify'
import { profileService } from '../services/profileService'
import { getCleanForfaitName, getForfaitNameWithoutSuffix } from '../utils/forfaitUtils'

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user } = useAuth()
  const location = useLocation()
  const [profileImage, setProfileImage] = useState(null)
  const [missionsOpen, setMissionsOpen] = useState(false)
  const [labelOpen, setLabelOpen] = useState(false)

  useEffect(() => {
    // Utiliser profileService pour obtenir l'image de manière centralisée
    if (user?.id) {
      const image = profileService.getProfileImage(user)
      setProfileImage(image)
    } else {
      setProfileImage(null)
    }
  }, [user?.id, user?.photo_profil])

  const isActive = (path) => {
    return location.pathname === path
  }

  const employerJobsUrl = useMemo(() => {
    return getEmployerJobsUrl(user)
  }, [user])

  const toggleMissions = () => setMissionsOpen(!missionsOpen)
  const toggleLabel = () => setLabelOpen(!labelOpen)

  const getMenuItems = () => {
    // Récupérer le nombre de messages non lus
    const unreadCount = user?.unread_messages_count || 0;

    if (user?.role === 'admin') {
      return [
        {
          icon: LayoutDashboard,
          label: 'Tableau de bord',
          path: '/admin/dashboard'
        },
        {
          icon: MessageSquare,
          label: 'Messages',
          path: '/admin/mes-messages'
        },
        {
          icon: Users,
          label: 'Utilisateurs',
          path: '/admin/users'
        },
        {
          icon: Briefcase,
          label: 'Missions publiées',
          path: '/admin/missions'
        },
        {
          icon: Briefcase,
          label: 'Missions par prestataires',
          path: '/admin/missions-prestataires'
        },
        {
          icon: Shield,
          label: 'Vérifications',
          path: '/admin/verifications'
        },
        {
          icon: Package,
          label: 'Forfaits',
          path: '/admin/forfaits'
        },
        {
          icon: Bell,
          label: 'Notifications',
          path: '/admin/notifications'
        },
        {
          icon: User,
          label: 'Profil',
          path: '/admin/profile'
        },
        {
          icon: Headphones,
          label: 'Support',
          path: '/admin/support'
        },
        {
          icon: Settings,
          label: 'Paramètres',
          path: '/admin/settings'
        }
      ]
    }

    if (user?.role === 'freelancer') {
      const items = [
        {
          icon: LayoutDashboard,
          label: 'Tableau de bord',
          path: '/freelancer/dashboard'
        },
        {
          icon: MessageSquare,
          label: 'Messages',
          path: '/freelancer/mes-messages'
        },
        {
          icon: Star,
          label: 'Avis reçus',
          path: '/freelancer/evaluations'
        },
        {
          type: 'group',
          label: 'Mes missions',
          icon: Briefcase,
          isOpen: missionsOpen,
          onClick: toggleMissions,
          items: [
            {
              label: 'Missions disponibles',
              path: '/freelancer/list-missions',
              icon: Briefcase,
              indent: true
            },
            {
              label: 'Mes demandes',
              path: '/freelancer/applications',
              icon: FileText,
              indent: true
            },
            {
              label: 'Mes missions postulées',
              path: '/freelancer/my-jobs',
              icon: FileText,
              indent: true
            },
            {
              label: 'Demande de devis disponibles',
              path: '/freelancer/devis-disponibles',
              icon: FileText,
              indent: true
            },
            // Options de publication (conditionnelles à l'affichage si forfait payant, mais lien toujours présent pour paywall)
            {
              label: 'Recruter un sous-traitant',
              path: '/freelancer/publish-mission',
              icon: PlusCircle,
              indent: true
            },
            {
              label: 'Mes missions publiées',
              path: '/freelancer/my-published-jobs',
              icon: Briefcase,
              indent: true
            }
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
          icon: Users,
          label: 'Recruteurs',
          path: '/freelancer/employers'
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
          type: 'group',
          label: 'Label Indebel',
          icon: Award,
          isOpen: labelOpen,
          onClick: toggleLabel,
          items: [
            {
              label: 'Vérifier mon éligibilité',
              path: '/freelancer/label/eligibility',
              icon: Shield,
              indent: true
            },
            {
              label: 'Demande exceptionnelle',
              path: '/freelancer/label/exceptional-request',
              icon: PlusCircle,
              indent: true
            }
          ]
        },
        {
          icon: Headphones,
          label: 'Support',
          path: '/freelancer/support'
        },
        {
          icon: Settings,
          label: 'Paramètres',
          path: '/freelancer/settings'
        }
      ]

      return items;
    }

    return []
  }

  const menuItems = getMenuItems()

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
          fixed top-0 left-0 h-screen bg-white shadow-xl z-30
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
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <Link to="/" className={`flex items-center justify-center ${isOpen ? 'w-full' : 'w-full'}`}>
              <img
                src="/logo.png"
                alt="Logo"
                className={`object-contain transition-all duration-300 ${isOpen ? 'h-20 w-32' : 'h-16 w-16'}`}
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextElementSibling.style.display = 'block'
                }}
              />
              <div className="hidden">
                <Briefcase className={`text-primary-600 transition-all duration-300 ${isOpen ? 'h-20 w-20' : 'h-16 w-16'}`} />
              </div>
            </Link>

            {/* Bouton fermer (mobile uniquement) */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>


        {/* Menu items */}
        <nav className="mt-6 px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-250px)]">
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
                      w-full flex items-center justify-between space-x-3 px-3 py-3 rounded-lg
                      transition-all duration-200
                      text-gray-700 hover:bg-primary-50 hover:text-primary-600
                      ${!isOpen ? 'justify-center' : ''}
                    `}
                    title={!isOpen ? item.label : ''}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5" />
                      {isOpen && (
                        <span className="font-medium">{item.label}</span>
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
                        flex items-center space-x-3 px-3 py-2.5 rounded-lg mx-2 my-1
                        transition-all duration-200 text-sm
                        ${isActive(subItem.path)
                          ? 'bg-primary-100 text-primary-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
                  flex items-center space-x-3 px-3 py-3 rounded-lg
                  transition-all duration-200
                  ${active
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
                  }
                  ${!isOpen && 'justify-center'}
                `}
                title={!isOpen ? item.label : ''}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-white' : ''}`} />
                {isOpen && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer du sidebar - Visible sur mobile et desktop */}
        <div className={`absolute bottom-0 left-0 right-0 border-t bg-gray-50 rounded-br-[20px] ${isOpen ? 'p-4' : 'p-2'
          }`}>
          <Link
            to={user?.role === 'employer' ? '/employer/profile' : '/freelancer/profile'}
            onClick={() => window.innerWidth < 1024 && toggleSidebar()}
            className="flex items-center hover:bg-gray-100 rounded-lg p-2 -m-2 transition-colors"
          >
            {isOpen ? (
              <div className="flex items-center space-x-3 w-full">
                <div className="relative">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={user?.prenom || 'Profil'}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                      {profileService.getInitials(user, user?.role)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate" title={user?.denomination || ''}>
                        {profileService.getDisplayName(user, user?.role)}
                      </p>
                      <LabelBadge userId={user?.id} size="sm" />
                      {(user?.role === 'employer' || user?.role === 'freelancer') && (
                        <VerificationBadge
                          status={user?.statut_verification || 'non_verifie'}
                          size="xs"
                          showText={false}
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {user?.role === 'employer' ? `Recruteur • ${getForfaitNameWithoutSuffix(user?.forfait_nom) || 'Forfait inconnu'}` : 'Prestataire'}
                        {(user?.forfait_nom && user?.role === 'freelancer') ? ` • ${getForfaitNameWithoutSuffix(user.forfait_nom)}` : ''}
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
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium text-sm">
                    {profileService.getInitials(user, user?.role)}
                  </div>
                )}
              </div>
            )}
          </Link>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

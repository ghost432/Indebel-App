import { useState, useEffect, useMemo, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import AdminSidebar from '../components/AdminSidebar'
import NotificationBell from '../components/NotificationBell'
import VerificationPopup from '../components/VerificationPopup'
import { ChevronRight, Clock3, LogOut, PanelLeftClose, PanelLeftOpen, Search, User, MessageSquare } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { profileService } from '../services/profileService'
import { supportService } from '../services/supportService'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [profileImage, setProfileImage] = useState(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [supportMenuOpen, setSupportMenuOpen] = useState(false)
  const [supportTickets, setSupportTickets] = useState([])
  const [supportLoading, setSupportLoading] = useState(false)
  const [viewedTickets, setViewedTickets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('viewedTickets') || '{}')
    } catch {
      return {}
    }
  })
  const profileMenuRef = useRef(null)
  const supportMenuRef = useRef(null)
  const desktopSearchRef = useRef(null)
  const mobileSearchRef = useRef(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

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
  }, [user?.id])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false)
      }
      if (supportMenuRef.current && !supportMenuRef.current.contains(event.target)) {
        setSupportMenuOpen(false)
      }
      const clickedDesktopSearch = desktopSearchRef.current?.contains(event.target)
      const clickedMobileSearch = mobileSearchRef.current?.contains(event.target)
      if (!clickedDesktopSearch && !clickedMobileSearch) {
        setSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const rolePath = user?.role === 'admin' ? 'admin' : user?.role === 'employer' ? 'employer' : 'freelancer'

  const fetchSupportTickets = async () => {
    if (!user?.id) return
    try {
      setSupportLoading(true)
      const response = user?.role === 'admin'
        ? await supportService.getAdminTickets()
        : await supportService.getMyTickets()
      setSupportTickets(response.data?.data || [])
    } catch (error) {
      setSupportTickets([])
    } finally {
      setSupportLoading(false)
    }
  }

  useEffect(() => {
    fetchSupportTickets()
  }, [user?.id, user?.role, location.pathname])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleLogout = () => {
    logout()
    toast.success('Déconnexion réussie')
    navigate('/login')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    const firstSuggestion = filteredSearchSuggestions[0]
    if (firstSuggestion) {
      navigate(firstSuggestion.path)
      setSearchFocused(false)
      setMobileSearchOpen(false)
      return
    }
  }

  const searchSuggestions = useMemo(() => {
    const common = [
      { label: 'Profil', path: `/${user?.role}/profile`, keywords: ['compte', 'profil'] },
      { label: 'Paramètres', path: `/${user?.role}/settings`, keywords: ['configuration', 'parametres'] },
      { label: 'Notifications', path: `/${user?.role}/notifications`, keywords: ['alertes', 'notification'] }
    ]

    if (user?.role === 'admin') {
      return [
        { label: 'Tableau de bord', path: '/admin/dashboard', keywords: ['dashboard', 'accueil'] },
        { label: 'Devis', path: '/admin/devis', keywords: ['demande', 'factures', 'ia'] },
        { label: 'Missions', path: '/admin/jobs', keywords: ['offres', 'jobs'] },
        { label: 'Entreprises', path: '/admin/users?role=employer', keywords: ['recruteurs', 'clients'] },
        { label: 'Utilisateurs', path: '/admin/users', keywords: ['prestataires', 'recruteurs'] },
        { label: 'Messages', path: '/admin/send-notification', keywords: ['message', 'envoyer'] },
        ...common
      ]
    }

    if (user?.role === 'employer') {
      return [
        { label: 'Tableau de bord', path: '/employer/dashboard', keywords: ['dashboard', 'accueil'] },
        { label: 'Devis', path: '/demande-devis', keywords: ['demander', 'factures'] },
        { label: 'Missions', path: '/employer/publish-mission', keywords: ['publier', 'offres'] },
        { label: 'Prestataires', path: '/employer/list-freelancers', keywords: ['prestataires', 'talents'] },
        { label: 'Messages', path: '/employer/mes-messages', keywords: ['conversation'] },
        ...common
      ]
    }

    return [
      { label: 'Tableau de bord', path: '/freelancer/dashboard', keywords: ['dashboard', 'accueil'] },
      { label: 'Devis', path: '/freelancer/devis-disponibles', keywords: ['demandes', 'ia', 'factures'] },
      { label: 'Missions', path: '/freelancer/list-missions', keywords: ['offres', 'jobs'] },
      { label: 'Entreprises', path: '/freelancer/list-employers', keywords: ['recruteurs', 'clients'] },
      { label: 'Messages', path: '/freelancer/mes-messages', keywords: ['conversation'] },
      { label: 'Avis', path: '/freelancer/evaluations', keywords: ['evaluations', 'notes'] },
      ...common
    ]
  }, [user?.role])

  const filteredSearchSuggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return searchSuggestions.slice(0, 6)
    return searchSuggestions.filter((item) => {
      const haystack = `${item.label} ${item.keywords?.join(' ') || ''}`.toLowerCase()
      return haystack.includes(query)
    }).slice(0, 6)
  }, [searchQuery, searchSuggestions])

  const openSuggestion = (path) => {
    navigate(path)
    setSearchQuery('')
    setSearchFocused(false)
    setMobileSearchOpen(false)
  }

  const SearchSuggestions = () => (
    searchFocused && filteredSearchSuggestions.length > 0 ? (
      <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-[#082151]/10">
        {filteredSearchSuggestions.map((item) => (
          <button
            key={item.path}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => openSuggestion(item.path)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold text-slate-700 transition-colors hover:bg-[#2A4DEF]/5 hover:text-[#2A4DEF]"
          >
            <span>{item.label}</span>
            <span className="text-xs font-semibold text-slate-400">{item.path.replace(`/${user?.role}`, '') || '/'}</span>
          </button>
        ))}
      </div>
    ) : null
  )

  const unreadTickets = useMemo(() => {
    return supportTickets.filter(ticket => {
      if (user?.role === 'admin' && !['ouvert', 'en_cours'].includes(ticket.statut)) return false;
      if (user?.role !== 'admin' && ticket.statut === 'ferme') return false;

      const ticketDate = new Date(ticket.date_mise_a_jour || ticket.date_creation || 0).getTime();
      const viewedDate = viewedTickets[ticket.id];

      return !viewedDate || ticketDate > viewedDate;
    })
  }, [supportTickets, viewedTickets, user?.role])

  const supportTicketCount = unreadTickets.length

  const latestSupportTickets = useMemo(
    () => supportTickets
      .slice()
      .sort((a, b) => new Date(b.date_mise_a_jour || b.date_creation || 0) - new Date(a.date_mise_a_jour || a.date_creation || 0))
      .slice(0, 5),
    [supportTickets]
  )

  const openSupportTicket = (ticketId) => {
    setSupportMenuOpen(false)
    
    const ticket = supportTickets.find(t => t.id === ticketId);
    if (ticket) {
      const ticketDate = new Date(ticket.date_mise_a_jour || ticket.date_creation || 0).getTime();
      const newViewed = { ...viewedTickets, [ticketId]: ticketDate };
      setViewedTickets(newViewed);
      localStorage.setItem('viewedTickets', JSON.stringify(newViewed));
    }

    navigate(`/${rolePath}/support?ticket=${ticketId}`)
  }

  const roleLabel = {
    admin: 'Administration',
    employer: 'Recruteur',
    freelancer: 'Prestataire'
  }[user?.role] || 'Dashboard'

  const customTitles = {
    dashboard: 'tableau de bord',
    'my-jobs': 'mes missions',
    myjob: 'mes missions',
    'applications': 'mes candidatures',
    'list-missions': 'missions disponibles',
    'mes-missions': 'mes missions',
    'devis-disponibles': 'demandes de devis',
    'devis-envoyes': 'devis envoyés',
    support: 'support',
    create: 'nouveau ticket',
    'list-employers': 'entreprises',
    'list-freelancers': 'liste des prestataires',
    'list-freelancer': 'prestataire',
    jobs: 'missions',
    stats: 'statistiques',
    demandes: 'demandes',
    factures: 'factures',
    forfaits: 'forfaits',
    seo: 'référencement',
    secteurs: 'secteurs',
    competences: 'compétences',
    langues: 'langues',
    verifications: 'vérifications',
    notifications: 'notifications',
    settings: 'paramètres'
  }

  let pageTitle = location.pathname
    .split('/')
    .filter(Boolean)
    .slice(1)
    .map((part) => customTitles[part] || part.replace(/-/g, ' '))
    .join(' / ') || 'dashboard'

  if (location.pathname === '/admin/users') {
    const searchParams = new URLSearchParams(location.search);
    const role = searchParams.get('role');
    if (role === 'freelancer') pageTitle = 'prestataires';
    else if (role === 'employer') pageTitle = 'recruteurs';
    else if (role === 'admin') pageTitle = 'administrateurs';
    else pageTitle = 'utilisateurs';
  }

  return (
    <div className="dashboard-shell min-h-screen">
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
          dashboard-main transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}
          px-3 sm:px-5 lg:px-8 py-4
        `}
      >
        {/* Top bar */}
        <div className="dashboard-topbar sticky top-4 z-40 mb-4 lg:mb-6 flex items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <button
              onClick={toggleSidebar}
              className="dashboard-icon-button flex-shrink-0"
              aria-label="Basculer la navigation"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" />
              )}
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#082151]/75">{roleLabel}</p>
              <h1 className="truncate text-base sm:text-xl font-black text-[#082151]">
                {pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1)}
              </h1>
            </div>
          </div>

          <div ref={desktopSearchRef} className="hidden lg:flex flex-1 justify-end items-center mx-4 max-w-md">
            <form onSubmit={handleSearch} className="dashboard-search relative flex w-full max-w-[380px] items-center gap-2 rounded-2xl px-3 py-2">
            <Search className="h-4 w-4 text-slate-600" />
            <input 
              className="w-full bg-transparent text-left text-sm outline-none placeholder:text-slate-600 text-[#082151] font-semibold" 
              placeholder="Recherche..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
            />
            <SearchSuggestions />
            </form>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Mobile Search Button */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="dashboard-icon-button relative lg:hidden"
              aria-label="Rechercher"
            >
              <Search className="h-5 w-5" />
            </button>

            <div className="relative" ref={supportMenuRef}>
              <button
                onClick={() => {
                  setSupportMenuOpen((current) => !current)
                  if (!supportMenuOpen) fetchSupportTickets()
                }}
                className="dashboard-icon-button relative"
                aria-label="Tickets support"
              >
                <MessageSquare className="h-5 w-5" />
                {supportTicketCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c02525] px-1 text-[10px] font-black text-white ring-2 ring-white">
                    {supportTicketCount > 9 ? '9+' : supportTicketCount}
                  </span>
                )}
              </button>

              {supportMenuOpen && (
                <div className="fixed md:absolute right-2 md:right-0 left-2 md:left-auto top-20 md:top-auto md:mt-2 w-auto md:w-[22rem] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-[#082151]/15 z-50 max-h-[80vh] flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c02525]">Support</p>
                      <p className="text-sm font-black text-[#082151]">{supportTicketCount} ticket{supportTicketCount > 1 ? 's' : ''} reçu{supportTicketCount > 1 ? 's' : ''}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSupportMenuOpen(false)
                        navigate(`/${rolePath}/support/create`)
                      }}
                      className="rounded-full bg-[#082151] px-3 py-2 text-xs font-black text-white transition-colors hover:bg-[#2A4DEF]"
                    >
                      Nouveau
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto p-2">
                    {supportLoading ? (
                      <div className="space-y-2 p-2">
                        {[1, 2, 3].map((item) => (
                          <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                        ))}
                      </div>
                    ) : latestSupportTickets.length === 0 ? (
                      <div className="p-6 text-center">
                        <MessageSquare className="mx-auto h-9 w-9 text-slate-300" />
                        <p className="mt-3 text-sm font-black text-[#082151]">Aucun ticket reçu</p>
                        <p className="mt-1 text-xs text-slate-500">Les prochains tickets apparaîtront ici.</p>
                      </div>
                    ) : (
                      latestSupportTickets.map((ticket) => (
                        <button
                          key={ticket.id}
                          onClick={() => openSupportTicket(ticket.id)}
                          className="group flex w-full items-start gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-[#2A4DEF]/5"
                        >
                          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#2A4DEF]/10 text-[#2A4DEF]">
                            <MessageSquare className="h-5 w-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-sm font-black text-[#082151]">#{ticket.id} · {ticket.sujet}</span>
                              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500">
                                {ticket.statut || 'ouvert'}
                              </span>
                            </span>
                            <span className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-600">
                              <Clock3 className="h-3.5 w-3.5" />
                              {ticket.date_mise_a_jour || ticket.date_creation
                                ? new Date(ticket.date_mise_a_jour || ticket.date_creation).toLocaleDateString('fr-FR')
                                : 'Date inconnue'}
                            </span>
                          </span>
                          <ChevronRight className="mt-2 h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#2A4DEF]" />
                        </button>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSupportMenuOpen(false)
                      navigate(`/${rolePath}/support`)
                    }}
                    className="flex w-full items-center justify-center gap-2 border-t border-slate-100 px-4 py-3 text-sm font-black text-[#082151] transition-colors hover:bg-slate-50"
                  >
                    Voir tous les tickets
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <NotificationBell />
            
            {/* Profile dropdown - Desktop & Mobile */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="dashboard-profile-button flex items-center gap-2"
              >
                <div className="h-9 w-9 bg-gradient-to-br from-[#2b4eef] to-[#df6422] rounded-2xl flex items-center justify-center text-white font-semibold overflow-hidden ring-2 ring-white">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm">{profileService.getInitials(user, user?.role)}</span>
                  )}
                </div>
              </button>

              {profileMenuOpen && user && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-2xl z-50">
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false)
                      navigate(`/${user.role}/profile`)
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span>Mon profil</span>
                  </button>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false)
                      handleLogout()
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile search bar */}
        {mobileSearchOpen && (
          <div ref={mobileSearchRef} className="lg:hidden px-4 sm:px-5 mb-4">
            <form onSubmit={handleSearch} className="relative flex w-full items-center gap-2 rounded-2xl px-4 py-3 bg-white border border-slate-200 shadow-sm">
              <Search className="h-5 w-5 text-slate-600" />
              <input 
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600 text-[#082151] font-semibold" 
                placeholder="Recherche" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                autoFocus
              />
              <SearchSuggestions />
            </form>
          </div>
        )}

        {/* Page content with rounded corners */}
        <div 
          className="dashboard-content p-4 sm:p-6 mb-4 lg:mb-6 overflow-x-auto"
          style={{ minHeight: 'calc(100vh - 12rem)' }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout

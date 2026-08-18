const fs = require('fs');
const file = 'frontend/src/components/AdminSidebar.jsx';
let content = fs.readFileSync(file, 'utf8');

const hookInjection = `const AdminSidebar = ({ isOpen, toggleSidebar }) => {
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
`;

content = content.replace('const AdminSidebar = ({ isOpen, toggleSidebar }) => {\n  const { user } = useAuth()', hookInjection);

const menuItemsStart = '  const menuItems = [';
const menuItemsEnd = '  ]';
const replacementMenuItems = `
  const allMenuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Tableau de bord', 
      path: '/admin/dashboard',
      pageId: 'dashboard'
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
      icon: TrendingUp, 
      label: 'Statistiques', 
      path: '/admin/stats',
      pageId: 'analytics'
    },
    { 
      icon: Globe, 
      label: 'SEO', 
      path: '/admin/seo',
      pageId: 'analytics'
    },
    { 
      icon: Star, 
      label: 'Avis',
      pageId: 'users',
      subItems: [
        { icon: Star, label: 'Avis prestataires', path: '/admin/avis-prestataires' },
        { icon: Star, label: 'Avis missions', path: '/admin/avis-missions' }
      ]
    },
    { 
      icon: Shield, 
      label: 'Vérification d\\'identité', 
      path: '/admin/verifications',
      pageId: 'users'
    },
    { 
      icon: Package, 
      label: 'Forfaits', 
      path: '/admin/forfaits',
      pageId: 'forfaits'
    },
    { 
      icon: Settings, 
      label: 'Paramètres', 
      path: '/admin/settings',
      pageId: 'dashboard'
    }
  ]

  const menuItems = allMenuItems.filter(item => hasPageAccess(item.pageId));
`;

content = content.replace(/  const menuItems = \[[\s\S]*?\]\s*return \(/, replacementMenuItems + '\n  return (');

fs.writeFileSync(file, content);
console.log('AdminSidebar.jsx patched successfully');

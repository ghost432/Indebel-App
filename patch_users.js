const fs = require('fs');
const file = 'frontend/src/pages/AdminUsers.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add import for useAuth
content = content.replace("import { profileService } from '../services/profileService'", "import { profileService } from '../services/profileService'\nimport { useAuth } from '../context/AuthContext'");

// 2. Add useAuth hook and new states
const hookInjection = `const AdminUsers = () => {
  const { user: currentUser } = useAuth()
  const [subAdminModal, setSubAdminModal] = useState(false)
  const [subAdminData, setSubAdminData] = useState({
    email: '', prenom: '', nom: '', mot_de_passe: '', nom_partenariat: '', envoyer_email: true,
    permissions: {
      pages: ['dashboard'],
      roles: ['freelancer', 'employer']
    }
  })
  const [subAdminSaving, setSubAdminSaving] = useState(false)
`;
content = content.replace('const AdminUsers = () => {', hookInjection);

// 3. Add handleCreateSubAdmin
const handleCreateSubAdmin = `
  const handleCreateSubAdmin = async (e) => {
    e.preventDefault()
    try {
      setSubAdminSaving(true)
      await userService.createSubAdmin(subAdminData)
      toast.success('Sous-admin créé avec succès')
      setSubAdminModal(false)
      fetchUsers()
      setSubAdminData({
        email: '', prenom: '', nom: '', mot_de_passe: '', nom_partenariat: '', envoyer_email: true,
        permissions: { pages: ['dashboard'], roles: ['freelancer', 'employer'] }
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création')
    } finally {
      setSubAdminSaving(false)
    }
  }

  const togglePermission = (type, value) => {
    setSubAdminData(prev => {
      const currentList = prev.permissions[type]
      const newList = currentList.includes(value)
        ? currentList.filter(item => item !== value)
        : [...currentList, value]
      return { ...prev, permissions: { ...prev.permissions, [type]: newList } }
    })
  }
`;
content = content.replace('  const fetchUsers = async () => {', handleCreateSubAdmin + '\n  const fetchUsers = async () => {');

// 4. Add "Créer sous-admin" button
const btnInjection = `
          {currentUser?.email === 'noreply@indebel.be' && (
            <Button onClick={() => setSubAdminModal(true)} variant="secondary" className="flex-1 sm:flex-none justify-center">
              <Shield className="h-4 w-4 mr-2" />
              Créer sous-admin
            </Button>
          )}
          <Button onClick={() => navigate('/admin/users/create')} className="flex-1 sm:flex-none justify-center">`;
content = content.replace('<Button onClick={() => navigate(\'/admin/users/create\')} className="flex-1 sm:flex-none justify-center">', btnInjection);

// 5. Add "Code Parrainage" rendering in the user list card
const badgeInjection = `
                      {user.role !== 'admin' && user.forfait_nom && (
                        <Badge variant={user.forfait_nom.includes('Gratuit') ? 'secondary' : user.forfait_nom.includes('Premium') ? 'warning' : 'primary'}>
                          📦 Forfait : {user.forfait_nom}
                        </Badge>
                      )}
                      {user.nom_partenariat && (
                        <Badge variant="info">
                          🤝 Parrain : {user.nom_partenariat}
                        </Badge>
                      )}
`;
content = content.replace(/\{user\.role !== 'admin' && user\.forfait_nom && \([\s\S]*?Badge>\s*\)\}/g, badgeInjection.trim());

// 6. Add subAdminModal JSX before the end
const modalJSX = `
      {/* Modal Créer Sous-Admin */}
      <Modal
        isOpen={subAdminModal}
        onClose={() => setSubAdminModal(false)}
        title="Créer un Sous-Administrateur"
        size="lg"
      >
        <form onSubmit={handleCreateSubAdmin} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Prénom"
              value={subAdminData.prenom}
              onChange={(e) => setSubAdminData({...subAdminData, prenom: e.target.value})}
              required
            />
            <Input
              label="Nom"
              value={subAdminData.nom}
              onChange={(e) => setSubAdminData({...subAdminData, nom: e.target.value})}
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={subAdminData.email}
            onChange={(e) => setSubAdminData({...subAdminData, email: e.target.value})}
            required
          />
          <Input
            label="Mot de passe provisoire"
            type="password"
            value={subAdminData.mot_de_passe}
            onChange={(e) => setSubAdminData({...subAdminData, mot_de_passe: e.target.value})}
            required
          />
          <Input
            label="Code Parrainage (Nom du Partenariat)"
            value={subAdminData.nom_partenariat}
            onChange={(e) => setSubAdminData({...subAdminData, nom_partenariat: e.target.value})}
            placeholder="Ex: IND-PART-2024"
            required
          />

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Permissions d'accès aux pages</h4>
            <div className="flex gap-4 flex-wrap">
              {['dashboard', 'users', 'devis', 'missions', 'factures', 'forfaits', 'newsletter', 'support', 'analytics'].map(page => (
                <label key={page} className="flex items-center space-x-2">
                  <input type="checkbox" checked={subAdminData.permissions.pages.includes(page)} onChange={() => togglePermission('pages', page)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm capitalize">{page}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Peut créer ces types d'utilisateurs</h4>
            <div className="flex gap-4 flex-wrap">
              {['employer', 'freelancer'].map(r => (
                <label key={r} className="flex items-center space-x-2">
                  <input type="checkbox" checked={subAdminData.permissions.roles.includes(r)} onChange={() => togglePermission('roles', r)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm capitalize">{r === 'employer' ? 'Recruteur' : 'Prestataire'}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={subAdminData.envoyer_email} onChange={(e) => setSubAdminData({...subAdminData, envoyer_email: e.target.checked})} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm font-medium">Envoyer les accès par email au sous-admin</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4">
            <Button type="button" variant="secondary" onClick={() => setSubAdminModal(false)}>Annuler</Button>
            <Button type="submit" loading={subAdminSaving}>Créer le sous-admin</Button>
          </div>
        </form>
      </Modal>
`;
content = content.replace('    </div>\n  )\n}\n\nexport default AdminUsers', modalJSX + '\n    </div>\n  )\n}\n\nexport default AdminUsers');

fs.writeFileSync(file, content);
console.log('AdminUsers.jsx patched successfully');

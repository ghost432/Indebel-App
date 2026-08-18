import { useState, useEffect } from 'react'
import PageLoader from '../components/PageLoader'
import { Search, Users, Edit, Trash2, Eye, Mail, Phone, Calendar, Shield, UserPlus, User, FileText, Briefcase, MapPin, Package } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Input from '../components/Input'
import Pagination from '../components/Pagination'
import VerificationBadge from '../components/VerificationBadge'
import usePagination from '../hooks/usePagination'
import { userService } from '../services/userService'
import { profileService } from '../services/profileService'
import { useAuth } from '../context/AuthContext'
import { forfaitService } from '../services/forfaitService'
import toast from 'react-hot-toast'

const AdminUsers = () => {
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

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const roleParam = searchParams.get('role')
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editModal, setEditModal] = useState({ open: false, user: null })
  const [editFormData, setEditFormData] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ open: false, userId: null })
  const [forfaits, setForfaits] = useState([])
  const [prolongeModal, setProlongeModal] = useState({ open: false, user: null, newDate: '' })
  const [prolongeLoading, setProlongeLoading] = useState(false)

  // Pagination
  const { currentItems, currentPage, totalPages, goToPage, totalItems, resetPage } = usePagination(filteredUsers, 12)

  useEffect(() => {
    document.title = 'Utilisateurs - Admin - Indebel'
    if (['admin', 'employer', 'freelancer'].includes(roleParam)) {
      setRoleFilter(roleParam)
    }
    fetchUsers()
    fetchForfaits()
  }, [roleParam])

  useEffect(() => {
    filterUsers()
    resetPage()
  }, [searchTerm, roleFilter, users])


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

  const toggleEditPermission = (type, value) => {
    setEditFormData(prev => {
      const perms = prev.admin_permissions || { pages: [], roles: [] }
      const currentList = perms[type] || []
      const newList = currentList.includes(value)
        ? currentList.filter(item => item !== value)
        : [...currentList, value]
      return { ...prev, admin_permissions: { ...perms, [type]: newList } }
    })
  }

  const fetchUsers = async () => {
    try {
      const response = await userService.getAllUsers()
      const usersData = Array.isArray(response.data?.data) ? (response.data?.data || response.data) : (Array.isArray(response.data) ? response.data : []);
      setUsers(usersData)
      setFilteredUsers(usersData)
    } catch (error) {
      toast.error('Erreur lors du chargement des utilisateurs')
    } finally {
      setLoading(false)
    }
  }

  const fetchForfaits = async () => {
    try {
      const response = await forfaitService.getAllForfaits()
      setForfaits((response.data?.data || response.data) || [])
    } catch (error) {
      console.error('Erreur lors du chargement des forfaits:', error)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.denomination?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtre par rôle
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }

  const handleView = (user) => {
    setSelectedUser(user)
    setModalOpen(true)
  }

  const handleEdit = (user) => {
    let permissions = { pages: ['dashboard'], roles: ['freelancer', 'employer'] };
    if (user.role === 'admin' && user.admin_permissions) {
      try {
        permissions = typeof user.admin_permissions === 'string' ? JSON.parse(user.admin_permissions) : user.admin_permissions;
      } catch (e) {}
    }

    setEditFormData({
      numero_bce: user.numero_bce || '',
      denomination: user.denomination || '',
      adresse: user.adresse || '',
      poste: user.poste || '',
      secteur: user.secteur || '',
      competences: user.competences || '',
      tarif_journalier: user.tarif_journalier || '',
      forfait_id: user.forfait_id || '',
      prenom: user.prenom || '',
      nom: user.nom || '',
      nom_partenariat: user.nom_partenariat || '',
      admin_permissions: permissions
    })
    setEditModal({ open: true, user })
  }

  const handleSaveEdit = async () => {
    try {
      setSaving(true)
      
      // Si on change le forfait, ajouter les champs nécessaires
      const dataToUpdate = { ...editFormData }
      if (editFormData.forfait_id && editFormData.forfait_id !== editModal.user.forfait_id) {
        dataToUpdate.forfait_date_debut = new Date().toISOString().split('T')[0]
        dataToUpdate.forfait_statut = 'actif'
      }

      if (editModal.user.role === 'admin' && dataToUpdate.admin_permissions) {
        dataToUpdate.admin_permissions = JSON.stringify(dataToUpdate.admin_permissions);
      }
      
      await userService.updateUser(editModal.user.id, dataToUpdate)
      toast.success('Utilisateur mis à jour avec succès')
      setEditModal({ open: false, user: null })
      fetchUsers()
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const handleProlongeForfait = (user) => {
    let defaultNewDate = '';
    if (user.forfait_date_expiration) {
      defaultNewDate = new Date(user.forfait_date_expiration).toISOString().split('T')[0];
    } else {
      defaultNewDate = new Date().toISOString().split('T')[0];
    }
    setProlongeModal({ open: true, user, newDate: defaultNewDate });
  };

  const handleSaveProlongement = async () => {
    try {
      setProlongeLoading(true);
      await userService.prolongeForfait(prolongeModal.user.id, {
        new_expiration_date: prolongeModal.newDate
      });
      toast.success('Forfait prolongé avec succès');
      setProlongeModal({ open: false, user: null, newDate: '' });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la prolongation');
    } finally {
      setProlongeLoading(false);
    }
  }

  const handleDelete = async () => {
    try {
      await userService.deleteUser(deleteModal.userId)
      toast.success('Utilisateur supprimé avec succès')
      setDeleteModal({ open: false, userId: null })
      fetchUsers()
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const getRoleBadge = (user) => {
    if (!user) return null;
    const role = user.role;
    if (role === 'admin') {
      if (user.email === 'noreply@indebel.be') {
        return <Badge variant="danger">Super Admin</Badge>;
      }
      return <Badge variant="warning">Sous-Admin</Badge>;
    }
    const variants = { employer: 'info', freelancer: 'success' };
    const labels = { employer: 'Recruteur', freelancer: 'Prestataire' };
    return <Badge variant={variants[role] || 'secondary'}>{labels[role] || role}</Badge>;
  }

  const formatDate = (dateString, fallback = 'Non défini') => {
    if (!dateString) return fallback
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getPageTitle = () => {
    switch (roleFilter) {
      case 'freelancer': return 'Prestataires'
      case 'employer': return 'Recruteurs'
      case 'admin': return 'Administrateurs'
      default: return 'Gestion des Utilisateurs'
    }
  }

  const getPageDescription = () => {
    switch (roleFilter) {
      case 'freelancer': return 'Gérez les comptes des prestataires'
      case 'employer': return 'Gérez les comptes des recruteurs'
      case 'admin': return 'Gérez les comptes administrateurs'
      default: return 'Gérez tous les comptes de la plateforme'
    }
  }

  if (loading) {
    return <PageLoader fullScreen />
  }

  return (
    <div className="py-8">
      <div className="bg-[#082151] rounded-[24px] shadow-md p-6 md:p-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden text-white border-0">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-white">{getPageTitle()}</h1>
          <p className="text-slate-200 mt-1 text-sm md:text-base">{getPageDescription()}</p>
        </div>
        <div className="relative z-10 flex items-center space-x-4 w-full sm:w-auto">
          <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-lg">
            <Users className="h-5 w-5 text-white" />
            <span className="text-lg font-semibold text-white">{filteredUsers.length}</span>
          </div>
          
          {currentUser?.email === 'noreply@indebel.be' && (
            <Button onClick={() => setSubAdminModal(true)} variant="white" className="flex-1 sm:flex-none justify-center">
              <Shield className="h-4 w-4 mr-2" />
              Créer sous-admin
            </Button>
          )}
          <Button onClick={() => navigate('/admin/users/create')} className="flex-1 sm:flex-none justify-center bg-[#df6422] hover:bg-[#c9571b] text-white border-0">
            <UserPlus className="h-4 w-4 mr-2" />
            Créer
          </Button>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#2b4eef]/20 to-[#df6422]/20 rounded-full blur-3xl -mr-16 -mt-16 z-0 pointer-events-none"></div>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">Tous les rôles</option>
              <option value="employer">Recruteurs</option>
              <option value="freelancer">Prestataires</option>
              <option value="admin">Administrateurs</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Liste des utilisateurs */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        {filteredUsers.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun utilisateur trouvé</p>
            </div>
          </Card>
        ) : (
          currentItems.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                  <div className="flex items-center gap-4">
                    {user.photo_profil ? (
                      <img
                        src={profileService.getProfileImage(user)}
                        alt={user.role === 'employer' ? user.denomination : `${user.prenom} ${user.nom}`}
                        className="h-12 w-12 rounded-full object-cover border-2 border-primary-200 shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full flex items-center justify-center font-bold shrink-0 bg-gradient-to-br from-[#2b4eef] to-[#df6422] text-white font-bold">
                        {profileService.getInitials(user, user.role)}
                      </div>
                    )}
                    <div className="sm:hidden flex flex-col items-start gap-1">
                      {getRoleBadge(user)}
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
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 break-words flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        {user.role === 'employer' && user.denomination 
                          ? user.denomination 
                          : `${user.prenom || ''} ${user.nom || ''}`
                        }
                        {user.forfait_badge_premium === 1 && (
                            <div className="flex items-center justify-center h-4 w-4 bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 rounded-full shadow-sm" title="Membre Premium">
                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
                            </div>
                        )}
                      </div>
                      {(user.role === 'freelancer' || user.role === 'employer') && (
                        <VerificationBadge status={(user.verification_identite_status && user.verification_identite_status !== 'non_verifie') ? user.verification_identite_status : user.statut_verification} premium={user.forfait_badge_premium} size="sm" showText={false} />
                      )}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
                      <span className="flex items-center truncate">
                        <Mail className="h-4 w-4 mr-1 shrink-0" />
                        <span className="truncate max-w-[200px] sm:max-w-xs">{user.email}</span>
                      </span>
                      {user.telephone && (
                        <span className="flex items-center whitespace-nowrap">
                          <Phone className="h-4 w-4 mr-1 shrink-0" />
                          {user.indicatif} {user.telephone}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                      <span className="flex items-center whitespace-nowrap">
                        <Calendar className="h-3 w-3 mr-1 shrink-0" />
                        Inscrit : {formatDate(user.date_creation)}
                      </span>
                      {user.last_login && (
                        <span className="flex items-center text-green-600 whitespace-nowrap">
                          <Calendar className="h-3 w-3 mr-1 shrink-0" />
                          Actif : {formatDate(user.last_login)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="hidden sm:flex flex-col items-end space-y-1">
                    {getRoleBadge(user)}
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
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 self-end sm:self-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-gray-100 w-full sm:w-auto justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleView(user)}
                    title="Voir les détails"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {(user.role === 'freelancer' || user.role === 'employer') && user.forfait_id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleProlongeForfait(user)}
                      title="Prolonger forfait"
                      className="border-amber-500 text-amber-500 hover:bg-amber-50"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                  )}
                  {(user.role !== 'admin' || (currentUser?.email === 'noreply@indebel.be' && user.email !== 'noreply@indebel.be')) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {(user.role !== 'admin' || (currentUser?.email === 'noreply@indebel.be' && user.email !== 'noreply@indebel.be')) && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteModal({ open: true, userId: user.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          itemsPerPage={12}
          totalItems={totalItems}
        />
      )}

      {/* Modal détails utilisateur */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title=""
        size="lg"
      >
        {selectedUser && (
          <div className="-m-4 sm:-m-6">
            {/* Banner */}
            <div 
              className={`h-28 rounded-t-lg relative z-0 ${!profileService.getCoverImage(selectedUser) ? 'bg-gradient-to-r from-primary-600 to-primary-800' : 'bg-cover bg-center'}`}
              style={profileService.getCoverImage(selectedUser) ? { backgroundImage: `url(${profileService.getCoverImage(selectedUser)})` } : {}}
            ></div>
            
            <div className="relative z-10 px-4 sm:px-6 -mt-12 pb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
                <div className="relative">
                  {selectedUser.photo_profil ? (
                    <img
                      src={profileService.getProfileImage(selectedUser)}
                      alt={selectedUser.role === 'employer' ? selectedUser.denomination : `${selectedUser.prenom} ${selectedUser.nom}`}
                      className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md bg-white"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full flex items-center justify-center font-bold border-4 border-white shadow-md bg-gradient-to-br from-[#2b4eef] to-[#df6422] text-white font-bold">
                      {profileService.getInitials(selectedUser, selectedUser.role)}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 text-center sm:text-left mb-1">
                  <h3 className="text-2xl font-bold text-gray-900 mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <div className="flex items-center gap-2">
                      {selectedUser.role === 'employer' && selectedUser.denomination 
                        ? selectedUser.denomination 
                        : `${selectedUser.prenom || ''} ${selectedUser.nom || ''}`
                      }
                      {selectedUser.forfait_badge_premium === 1 && (
                          <div className="flex items-center justify-center h-5 w-5 bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 rounded-full shadow-sm" title="Membre Premium">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
                          </div>
                      )}
                    </div>
                    {(selectedUser.role === 'freelancer' || selectedUser.role === 'employer') && (
                      <VerificationBadge status={(selectedUser.verification_identite_status && selectedUser.verification_identite_status !== 'non_verifie') ? selectedUser.verification_identite_status : selectedUser.statut_verification} premium={selectedUser.forfait_badge_premium} size="md" showText={false} />
                    )}
                  </h3>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                    {getRoleBadge(selectedUser.role)}
                    <Badge variant="secondary" className="flex items-center text-xs px-2 py-1">
                      <Mail className="w-3 h-3 mr-1" />
                      {selectedUser.email}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Contenu détaillé - Deux colonnes pour les grands écrans */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-100">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 border-b pb-2 mb-3">Informations de Profil</h4>
                  
                  {selectedUser.prenom && (
                    <div className="flex items-start">
                      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 mr-3">
                        <User className="h-4 w-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Prénom & Nom</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedUser.prenom} {selectedUser.nom}</p>
                      </div>
                    </div>
                  )}

                  {selectedUser.poste && (
                    <div className="flex items-start">
                      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 mr-3">
                        <Briefcase className="h-4 w-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Poste / Titre</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedUser.poste}</p>
                      </div>
                    </div>
                  )}

                  {selectedUser.telephone && (
                    <div className="flex items-start">
                      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 mr-3">
                        <Phone className="h-4 w-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedUser.indicatif} {selectedUser.telephone}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedUser.adresse && (
                    <div className="flex items-start">
                      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 mr-3">
                        <MapPin className="h-4 w-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Localisation</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedUser.adresse} {selectedUser.pays_code ? `(${selectedUser.pays_code})` : ''}</p>
                      </div>
                    </div>
                  )}

                  {(selectedUser.a_propos || selectedUser.description_entreprise) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">À propos</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedUser.a_propos || selectedUser.description_entreprise}</p>
                    </div>
                  )}
                  
                  {selectedUser.competences && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Compétences</p>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(selectedUser.competences) ? selectedUser.competences.map((comp, i) => (
                          <Badge key={i} variant="outline" className="bg-white">{comp}</Badge>
                        )) : (
                          <span className="text-sm text-gray-900">{selectedUser.competences}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 border-b pb-2 mb-3">Détails Professionnels & Système</h4>
                  
                  {selectedUser.role !== 'admin' && selectedUser.forfait_nom && (
                    <div className="flex items-start">
                      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 mr-3">
                        <Package className="h-4 w-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Forfait actuel</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedUser.forfait_nom}</p>
                      </div>
                    </div>
                  )}

                  {selectedUser.numero_bce && (
                    <div className="flex items-start">
                      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 mr-3">
                        <FileText className="h-4 w-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro BCE</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedUser.numero_bce}</p>
                      </div>
                    </div>
                  )}

                  {selectedUser.secteur && (
                    <div className="flex items-start">
                      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 mr-3">
                        <Briefcase className="h-4 w-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Secteur</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedUser.secteur}</p>
                      </div>
                    </div>
                  )}

                  {selectedUser.tarif_journalier && (
                    <div className="flex items-start">
                      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 mr-3">
                        <Package className="h-4 w-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tarif Journalier</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedUser.tarif_journalier} € / jour</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedUser.site_web && (
                    <div className="flex items-start">
                      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 mr-3">
                        <Search className="h-4 w-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Site Web</p>
                        <a href={selectedUser.site_web} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 hover:underline break-all">{selectedUser.site_web}</a>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-200 mt-4 pt-4 space-y-4">
                    <div className="flex items-start">
                      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 mr-3">
                        <Calendar className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Date d'inscription</p>
                        <p className="text-sm font-semibold text-gray-900">{formatDate(selectedUser.date_creation)}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 mr-3">
                        <Shield className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière connexion</p>
                        <p className="text-sm font-semibold text-gray-900">{formatDate(selectedUser.last_login, 'Jamais connecté')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal édition utilisateur */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, user: null })}
        title=""
        size="lg"
      >
        {editModal.user && (
          <div className="-m-4 sm:-m-6">
            {/* Banner */}
            <div 
              className={`h-24 rounded-t-lg relative z-0 border-b border-gray-300 ${!profileService.getCoverImage(editModal.user) ? 'bg-gradient-to-r from-gray-100 to-gray-200' : 'bg-cover bg-center'}`}
              style={profileService.getCoverImage(editModal.user) ? { backgroundImage: `url(${profileService.getCoverImage(editModal.user)})` } : {}}
            ></div>
            
            <div className="relative z-10 px-4 sm:px-6 -mt-12 pb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
                <div className="relative">
                  {editModal.user.photo_profil ? (
                    <img
                      src={profileService.getProfileImage(editModal.user)}
                      alt="Profil"
                      className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-md bg-white"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full flex items-center justify-center font-bold border-4 border-white shadow-md bg-gradient-to-br from-[#2b4eef] to-[#df6422] text-white font-bold">
                      {profileService.getInitials(editModal.user, editModal.user.role)}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 text-center sm:text-left mb-1">
                  <h3 className="text-xl font-bold text-gray-900 mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    Modifier : {editModal.user.role === 'employer' && editModal.user.denomination 
                      ? editModal.user.denomination 
                      : `${editModal.user.prenom || ''} ${editModal.user.nom || ''}`
                    }
                    {(editModal.user.role === 'freelancer' || editModal.user.role === 'employer') && (
                      <VerificationBadge status={(editModal.user.verification_identite_status && editModal.user.verification_identite_status !== 'non_verifie') ? editModal.user.verification_identite_status : editModal.user.statut_verification} premium={editModal.user.forfait_badge_premium} size="md" showText={false} />
                    )}
                  </h3>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                    <Badge variant="outline" className="text-xs bg-white">
                      Rôle: {editModal.user.role === 'freelancer' ? 'Prestataire' : editModal.user.role === 'employer' ? 'Recruteur' : 'Admin'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-100 space-y-6">
                {editModal.user.role === 'admin' ? (
                  <div className="space-y-5">
                    <h4 className="font-semibold text-gray-900 border-b pb-2">Informations Sous-Admin</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input label="Prénom" value={editFormData.prenom || ''} onChange={(e) => setEditFormData({...editFormData, prenom: e.target.value})} />
                      <Input label="Nom" value={editFormData.nom || ''} onChange={(e) => setEditFormData({...editFormData, nom: e.target.value})} />
                    </div>
                    <Input label="Code Parrainage" value={editFormData.nom_partenariat || ''} onChange={(e) => setEditFormData({...editFormData, nom_partenariat: e.target.value})} />
                    
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-2">Permissions d'accès aux pages</h4>
                      <div className="flex gap-4 flex-wrap">
                        {['dashboard', 'users', 'devis', 'missions', 'factures', 'forfaits', 'newsletter', 'seo', 'support', 'analytics', 'verifications', 'avis', 'settings'].map(page => (
                          <label key={page} className="flex items-center space-x-2">
                            <input type="checkbox" checked={editFormData.admin_permissions?.pages?.includes(page) || false} onChange={() => toggleEditPermission('pages', page)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
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
                            <input type="checkbox" checked={editFormData.admin_permissions?.roles?.includes(r) || false} onChange={() => toggleEditPermission('roles', r)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                            <span className="text-sm capitalize">{r === 'employer' ? 'Recruteur' : 'Prestataire'}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : editModal.user.role === 'employer' ? (
                  <div className="space-y-5">
                    <h4 className="font-semibold text-gray-900 border-b pb-2">Informations de l'entreprise</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input
                        label="Numéro BCE"
                        name="numero_bce"
                        value={editFormData.numero_bce}
                        onChange={(e) => setEditFormData({...editFormData, numero_bce: e.target.value})}
                        placeholder="0123456789"
                      />

                      <Input
                        label="Dénomination"
                        name="denomination"
                        value={editFormData.denomination}
                        onChange={(e) => setEditFormData({...editFormData, denomination: e.target.value})}
                        placeholder="Nom de l'entreprise"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input
                        label="Secteur d'activité"
                        name="secteur"
                        value={editFormData.secteur || ''}
                        onChange={(e) => setEditFormData({...editFormData, secteur: e.target.value})}
                        placeholder="Ex: Informatique, Bâtiment..."
                      />
                    </div>

                    <Input
                      label="Adresse complète"
                      name="adresse"
                      value={editFormData.adresse}
                      onChange={(e) => setEditFormData({...editFormData, adresse: e.target.value})}
                      placeholder="Rue, numéro, code postal, ville"
                    />
                  </div>
                ) : (
                  <div className="space-y-5">
                    <h4 className="font-semibold text-gray-900 border-b pb-2">Informations du profil</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input
                        label="Numéro BCE"
                        name="numero_bce"
                        value={editFormData.numero_bce}
                        onChange={(e) => setEditFormData({...editFormData, numero_bce: e.target.value})}
                        placeholder="0123456789"
                      />
                      <Input
                        label="Dénomination"
                        name="denomination"
                        value={editFormData.denomination}
                        onChange={(e) => setEditFormData({...editFormData, denomination: e.target.value})}
                        placeholder="Nom de l'entreprise ou indépendant"
                      />
                    </div>
                    
                    <Input
                      label="Adresse complète"
                      name="adresse"
                      value={editFormData.adresse}
                      onChange={(e) => setEditFormData({...editFormData, adresse: e.target.value})}
                      placeholder="Rue, numéro, code postal, ville"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input
                        label="Poste / Métier"
                        name="poste"
                        value={editFormData.poste}
                        onChange={(e) => setEditFormData({...editFormData, poste: e.target.value})}
                        placeholder="Ex: Développeur Full-Stack"
                      />

                      <Input
                        label="Tarif journalier (€)"
                        name="tarif_journalier"
                        type="number"
                        value={editFormData.tarif_journalier}
                        onChange={(e) => setEditFormData({...editFormData, tarif_journalier: e.target.value})}
                        placeholder="Ex: 450"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input
                        label="Secteur d'activité"
                        name="secteur"
                        value={editFormData.secteur || ''}
                        onChange={(e) => setEditFormData({...editFormData, secteur: e.target.value})}
                        placeholder="Ex: Informatique, Design..."
                      />
                      <Input
                        label="Compétences (séparées par des virgules)"
                        name="competences"
                        value={Array.isArray(editFormData.competences) ? editFormData.competences.join(', ') : (editFormData.competences || '')}
                        onChange={(e) => setEditFormData({...editFormData, competences: e.target.value.split(',').map(s => s.trim())})}
                        placeholder="Ex: React, Node.js, UI/UX"
                      />
                    </div>
                  </div>
                )}

                {editModal.user.role !== 'admin' && (
                  <div className="border-t border-gray-200 pt-5 mt-5">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Package className="h-4 w-4 mr-2 text-primary-600" /> Gestion du Forfait
                    </h4>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      value={editFormData.forfait_id || ''}
                      onChange={(e) => setEditFormData({...editFormData, forfait_id: e.target.value})}
                    >
                      <option value="">Aucun forfait attribué</option>
                      {forfaits.map((forfait) => (
                        <option key={forfait.id} value={forfait.id}>
                          {forfait.nom} - {forfait.prix_mensuel === 0 ? 'Gratuit' : `${forfait.prix_mensuel}€/mois`}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-2 ml-1">
                      Sélectionnez le forfait à attribuer à cet utilisateur
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-6 mt-2">
                <Button
                  variant="secondary"
                  onClick={() => setEditModal({ open: false, user: null })}
                  disabled={saving}
                >
                  Annuler
                </Button>
                <Button onClick={handleSaveEdit} loading={saving}>
                  Enregistrer les modifications
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal confirmation suppression */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, userId: null })}
        title="Confirmer la suppression"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
        </p>
        <div className="flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={() => setDeleteModal({ open: false, userId: null })}
          >
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Supprimer
          </Button>
        </div>
      </Modal>

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
            type="text"
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
              {['dashboard', 'users', 'devis', 'missions', 'factures', 'forfaits', 'newsletter', 'seo', 'support', 'analytics', 'verifications', 'avis', 'settings'].map(page => (
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

      {/* Modal Prolonger Forfait */}
      <Modal
        isOpen={prolongeModal.open}
        onClose={() => setProlongeModal({ open: false, user: null, newDate: '' })}
        title="Prolonger le forfait"
        size="md"
      >
        {prolongeModal.user && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Utilisateur :</p>
              <p className="font-semibold">{prolongeModal.user.prenom} {prolongeModal.user.nom} {prolongeModal.user.denomination ? `(${prolongeModal.user.denomination})` : ''}</p>
              <p className="text-sm text-gray-600 mt-3 mb-1">Forfait actuel :</p>
              <p className="font-semibold text-primary-600">{prolongeModal.user.forfait_nom}</p>
              <p className="text-sm text-gray-600 mt-3 mb-1">Date d'expiration actuelle :</p>
              <p className="font-semibold">{formatDate(prolongeModal.user.forfait_date_expiration)}</p>
            </div>

            {prolongeModal.user.forfait_nom && prolongeModal.user.forfait_nom.toLowerCase().includes('à vie') ? (
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800 flex items-start">
                <Calendar className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">Ce forfait est à vie et ne peut pas être modifié.</p>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleSaveProlongement(); }} className="space-y-4">
                <Input
                  label="Nouvelle date d'expiration"
                  type="date"
                  value={prolongeModal.newDate}
                  onChange={(e) => setProlongeModal(prev => ({ ...prev, newDate: e.target.value }))}
                  required
                />
                <p className="text-xs text-gray-500">
                  La nouvelle date remplacera l'ancienne date d'expiration et l'utilisateur en sera notifié par email.
                </p>
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-4">
                  <Button type="button" variant="secondary" onClick={() => setProlongeModal({ open: false, user: null, newDate: '' })}>
                    Annuler
                  </Button>
                  <Button type="submit" loading={prolongeLoading}>
                    Enregistrer et notifier
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>

    </div>
  )
}

export default AdminUsers

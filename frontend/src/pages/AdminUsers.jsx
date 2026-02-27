import { useState, useEffect } from 'react'
import { Search, Users, Edit, Trash2, Eye, Mail, Phone, Calendar, Shield, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Input from '../components/Input'
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
import LabelBadge from '../components/LabelBadge'
import { userService } from '../services/userService'
import { profileService } from '../services/profileService'
import { forfaitService } from '../services/forfaitService'
import toast from 'react-hot-toast'
import { getCleanForfaitName, getForfaitNameWithoutSuffix } from '../utils/forfaitUtils'

const AdminUsers = () => {
  const navigate = useNavigate()
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

  // Pagination
  const { currentItems, currentPage, totalPages, goToPage, totalItems } = usePagination(filteredUsers, 12)

  useEffect(() => {
    document.title = 'Utilisateurs - Admin - Indebel'
    fetchUsers()
    fetchForfaits()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [searchTerm, roleFilter, users])

  const fetchUsers = async () => {
    try {
      const response = await userService.getAllUsers()
      setUsers(response.data.data)
      setFilteredUsers(response.data.data)
    } catch (error) {
      toast.error('Erreur lors du chargement des utilisateurs')
    } finally {
      setLoading(false)
    }
  }

  const fetchForfaits = async () => {
    try {
      const response = await forfaitService.getAllForfaits()
      setForfaits(response.data.data || [])
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
    setEditFormData({
      numero_bce: user.numero_bce || '',
      denomination: user.denomination || '',
      adresse: user.adresse || '',
      poste: user.poste || '',
      tarif_journalier: user.tarif_journalier || '',
      forfait_id: user.forfait_id || ''
    })
    setEditModal({ open: true, user })
  }

  const handleSaveEdit = async () => {
    try {
      setSaving(true)

      // Si on change le forfait, ajouter les champs nécessaires
      const dataToUpdate = { ...editFormData }
      if (editFormData.forfait_id && editFormData.forfait_id !== editModal.user.forfait_id) {
        const now = new Date()
        dataToUpdate.forfait_date_debut = now.toISOString().split('T')[0]

        // Calculer l'expiration (+30 jours par défaut pour une attribution manuelle)
        const expirationDate = new Date(now)
        expirationDate.setDate(expirationDate.getDate() + 30)
        dataToUpdate.forfait_date_expiration = expirationDate.toISOString().split('T')[0]

        dataToUpdate.forfait_statut = 'actif'
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

  const getRoleBadge = (role) => {
    const variants = {
      admin: 'primary',
      employer: 'info',
      freelancer: 'success'
    }
    const labels = {
      admin: 'Administrateur',
      employer: 'Recruteur',
      freelancer: 'Prestataire'
    }
    return <Badge variant={variants[role]}>{labels[role]}</Badge>
  }

  const getVerificationBadge = (statut) => {
    if (!statut || statut === 'non_verifie') {
      return <Badge variant="secondary">❌ Non vérifié</Badge>
    }
    if (statut === 'en_cours') {
      return <Badge variant="warning">⏳ En cours</Badge>
    }
    if (statut === 'verifie') {
      return <Badge variant="success">✅ Vérifié</Badge>
    }
    return <Badge variant="danger">❌ Refusé</Badge>
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Non défini'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
          <p className="text-gray-600 mt-1">Gérez tous les comptes de la plateforme</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-gray-600" />
            <span className="text-lg font-semibold text-gray-900">{filteredUsers.length}</span>
          </div>
          <Button onClick={() => navigate('/admin/users/create')}>
            <UserPlus className="h-4 w-4 mr-2" />
            Créer un utilisateur
          </Button>
        </div>
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
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  {user.photo_profil ? (
                    <img
                      src={profileService.getProfileImage(user)}
                      alt={user.role === 'employer' ? user.denomination : `${user.prenom} ${user.nom}`}
                      className="h-12 w-12 rounded-full object-cover border-2 border-primary-200"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold">
                      {profileService.getInitials(user, user.role)}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user.role === 'employer' && user.denomination
                        ? user.denomination
                        : `${user.prenom || ''} ${user.nom || ''}`
                      }
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {user.email}
                      </span>
                      {user.telephone && (
                        <span className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {user.indicatif} {user.telephone}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Inscrit : {formatDate(user.date_creation)}
                      </span>
                      {user.last_login && (
                        <span className="flex items-center text-green-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          Dernière connexion : {formatDate(user.last_login)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <LabelBadge userId={user.id} size="sm" />
                    {getRoleBadge(user.role)}
                    {user.role === 'freelancer' && getVerificationBadge(user.statut_verification)}
                    {user.role !== 'admin' && user.forfait_nom && (
                      <Badge variant={user.forfait_nom.includes('Gratuit') ? 'secondary' : user.forfait_nom.includes('Premium') ? 'warning' : 'primary'}>
                        📦 {getForfaitNameWithoutSuffix(user.forfait_nom)}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleView(user)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {user.role !== 'admin' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {user.role !== 'admin' && (
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
        title="Détails de l'utilisateur"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 pb-4 border-b">
              {selectedUser.photo_profil ? (
                <img
                  src={profileService.getProfileImage(selectedUser)}
                  alt={selectedUser.role === 'employer' ? selectedUser.denomination : `${selectedUser.prenom} ${selectedUser.nom}`}
                  className="h-20 w-20 rounded-full object-cover border-4 border-primary-200"
                />
              ) : (
                <div className="h-20 w-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {profileService.getInitials(selectedUser, selectedUser.role)}
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedUser.role === 'employer' && selectedUser.denomination
                    ? selectedUser.denomination
                    : `${selectedUser.prenom || ''} ${selectedUser.nom || ''}`
                  }
                </h3>
                {getRoleBadge(selectedUser.role)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{selectedUser.email}</p>
              </div>

              {selectedUser.prenom && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Prénom</label>
                  <p className="text-gray-900">{selectedUser.prenom}</p>
                </div>
              )}

              {selectedUser.nom && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Nom</label>
                  <p className="text-gray-900">{selectedUser.nom}</p>
                </div>
              )}

              {selectedUser.telephone && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Téléphone</label>
                  <p className="text-gray-900">{selectedUser.indicatif} {selectedUser.telephone}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-600">Date d'inscription</label>
                <p className="text-gray-900">{formatDate(selectedUser.date_creation)}</p>
              </div>

              {selectedUser.last_login && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Dernière connexion</label>
                  <p className="text-green-600 font-medium">{formatDate(selectedUser.last_login)}</p>
                </div>
              )}

              {selectedUser.numero_bce && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Numéro BCE</label>
                  <p className="text-gray-900">{selectedUser.numero_bce}</p>
                </div>
              )}

              {selectedUser.secteur && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Secteur</label>
                  <p className="text-gray-900">{selectedUser.secteur}</p>
                </div>
              )}

              {selectedUser.adresse && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600">Adresse</label>
                  <p className="text-gray-900">{selectedUser.adresse}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-600">Date d'inscription</label>
                <p className="text-gray-900">{formatDate(selectedUser.date_creation)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal édition utilisateur */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, user: null })}
        title={`Modifier ${editModal.user?.prenom} ${editModal.user?.nom}`}
        size="lg"
      >
        {editModal.user && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-900">
                <strong>Rôle:</strong> {editModal.user.role === 'freelancer' ? 'Prestataire' : editModal.user.role === 'employer' ? 'Recruteur' : 'Admin'}
              </p>
            </div>

            {editModal.user.role === 'employer' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Numéro BCE"
                    name="numero_bce"
                    value={editFormData.numero_bce}
                    onChange={(e) => setEditFormData({ ...editFormData, numero_bce: e.target.value })}
                    placeholder="0123456789"
                  />

                  <Input
                    label="Dénomination"
                    name="denomination"
                    value={editFormData.denomination}
                    onChange={(e) => setEditFormData({ ...editFormData, denomination: e.target.value })}
                    placeholder="Nom de le recruteur"
                  />
                </div>

                <Input
                  label="Adresse complète"
                  name="adresse"
                  value={editFormData.adresse}
                  onChange={(e) => setEditFormData({ ...editFormData, adresse: e.target.value })}
                  placeholder="Rue, numéro, code postal, ville"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  label="Adresse complète"
                  name="adresse"
                  value={editFormData.adresse}
                  onChange={(e) => setEditFormData({ ...editFormData, adresse: e.target.value })}
                  placeholder="Rue, numéro, code postal, ville"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Poste / Métier"
                    name="poste"
                    value={editFormData.poste}
                    onChange={(e) => setEditFormData({ ...editFormData, poste: e.target.value })}
                    placeholder="Ex: Développeur Full-Stack"
                  />

                  <Input
                    label="Tarif journalier (€)"
                    name="tarif_journalier"
                    type="number"
                    value={editFormData.tarif_journalier}
                    onChange={(e) => setEditFormData({ ...editFormData, tarif_journalier: e.target.value })}
                    placeholder="Ex: 450"
                  />
                </div>
              </div>
            )}

            <div className="border-t pt-4 mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📦 Forfait
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={editFormData.forfait_id}
                onChange={(e) => setEditFormData({ ...editFormData, forfait_id: e.target.value })}
              >
                <option value="">Aucun forfait</option>
                {forfaits.map((forfait) => (
                  <option key={forfait.id} value={forfait.id}>
                    {getForfaitNameWithoutSuffix(forfait.nom)} - {forfait.prix_mensuel === 0 ? 'Gratuit' : `${forfait.prix_mensuel}€/mois`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Sélectionnez le forfait à attribuer à cet utilisateur
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setEditModal({ open: false, user: null })}
                disabled={saving}
              >
                Annuler
              </Button>
              <Button onClick={handleSaveEdit} loading={saving}>
                Enregistrer
              </Button>
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
    </div>
  )
}

export default AdminUsers

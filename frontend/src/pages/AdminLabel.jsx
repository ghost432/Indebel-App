import { useState, useEffect } from 'react';
import { Award, Search, Send, XCircle, CheckCircle, Clock, Filter, Users, Mail, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import labelService from '../services/labelService';
import { userService } from '../services/userService';

const AdminLabel = () => {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatut, setSelectedStatut] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEnvoyerModal, setShowEnvoyerModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // États pour la sélection d'utilisateurs
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    loadLabels();
  }, [selectedStatut]);

  const loadLabels = async () => {
    try {
      setLoading(true);
      const data = await labelService.getUsersAvecLabel(selectedStatut || null);
      setLabels(data.data || []);
    } catch (error) {
      console.error('Erreur chargement labels:', error);
      toast.error('Erreur lors du chargement des labels');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoquer = async (labelId, nom) => {
    if (!confirm(`Êtes-vous sûr de vouloir révoquer le label de ${nom} ?`)) {
      return;
    }

    try {
      await labelService.revoquerLabel(labelId, 'Label révoqué par un administrateur');
      toast.success('Label révoqué avec succès');
      loadLabels();
    } catch (error) {
      console.error('Erreur révocation:', error);
      toast.error(error.message || 'Erreur lors de la révocation');
    }
  };

  // Charger tous les utilisateurs pour la sélection
  const loadAllUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await userService.getAllUsers();
      // Filtrer pour exclure les admins et ceux qui ont déjà un label
      const existingLabelUserIds = labels.map(l => l.user_id);
      const eligibleUsers = response.data.data.filter(user => 
        user.role !== 'admin' && 
        !existingLabelUserIds.includes(user.id)
      );
      setAllUsers(eligibleUsers);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleEnvoyerDemandes = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Veuillez sélectionner au moins un utilisateur');
      return;
    }

    try {
      const promises = selectedUsers.map(userId => 
        labelService.demanderLabel(userId, true)
      );
      
      await Promise.all(promises);
      
      toast.success(`${selectedUsers.length} demande(s) de label envoyée(s)`);
      setShowEnvoyerModal(false);
      setSelectedUsers([]);
      loadLabels();
    } catch (error) {
      console.error('Erreur envoi demandes:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi des demandes');
    }
  };

  // Gestion de la sélection d'utilisateurs
  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const filteredUserIds = filteredUsers.map(user => user.id);
    setSelectedUsers(filteredUserIds);
  };

  const handleDeselectAll = () => {
    setSelectedUsers([]);
  };

  // Télécharger l'image du label
  const handleDownloadLabel = async () => {
    try {
      await labelService.downloadLabelImage();
      toast.success('Image du label téléchargée');
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const filteredLabels = labels.filter(label => {
    const searchLower = searchTerm.toLowerCase();
    return (
      label.nom?.toLowerCase().includes(searchLower) ||
      label.prenom?.toLowerCase().includes(searchLower) ||
      label.email?.toLowerCase().includes(searchLower)
    );
  });

  // Utilisateurs filtrés pour la sélection
  const filteredUsers = allUsers.filter(user => {
    const searchLower = userSearchTerm.toLowerCase();
    return (
      user.nom?.toLowerCase().includes(searchLower) ||
      user.prenom?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.denomination?.toLowerCase().includes(searchLower)
    );
  });

  const getStatutBadge = (statut) => {
    const badges = {
      en_attente: {
        icon: Clock,
        color: 'bg-yellow-100 text-yellow-800',
        text: 'En attente'
      },
      accepte: {
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800',
        text: 'Accepté'
      },
      refuse: {
        icon: XCircle,
        color: 'bg-red-100 text-red-800',
        text: 'Refusé'
      }
    };

    const badge = badges[statut] || badges.en_attente;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className="h-4 w-4 mr-1" />
        {badge.text}
      </span>
    );
  };

  const stats = {
    total: labels.length,
    accepte: labels.filter(l => l.statut === 'accepte').length,
    en_attente: labels.filter(l => l.statut === 'en_attente').length,
    refuse: labels.filter(l => l.statut === 'refuse').length
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Award className="h-8 w-8 mr-3 text-blue-600" />
              Gestion des Labels Indebel
            </h1>
            <p className="text-gray-600 mt-2">
              Gérez les demandes et attributions du Label Indebel
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDownloadLabel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
              title="Télécharger l'image du label"
            >
              <Download className="h-5 w-5 mr-2" />
              Télécharger Label
            </button>
            <button
              onClick={() => {
                setShowEnvoyerModal(true);
                loadAllUsers();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Send className="h-5 w-5 mr-2" />
              Envoyer demandes
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-200">
            <div className="text-sm text-green-600">Acceptés</div>
            <div className="text-2xl font-bold text-green-900">{stats.accepte}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 shadow-sm border border-yellow-200">
            <div className="text-sm text-yellow-600">En attente</div>
            <div className="text-2xl font-bold text-yellow-900">{stats.en_attente}</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 shadow-sm border border-red-200">
            <div className="text-sm text-red-600">Refusés</div>
            <div className="text-2xl font-bold text-red-900">{stats.refuse}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Rechercher par nom, prénom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedStatut}
              onChange={(e) => setSelectedStatut(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="accepte">Acceptés</option>
              <option value="refuse">Refusés</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : filteredLabels.length === 0 ? (
          <div className="text-center py-12">
            <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucun label trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Demande
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLabels.map((label) => (
                  <tr key={label.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">
                          {label.nom} {label.prenom}
                        </div>
                        <div className="text-sm text-gray-500">{label.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        {label.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatutBadge(label.statut)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {label.demande_par === 'admin' ? (
                        <span className="text-blue-600">Par admin</span>
                      ) : (
                        <span className="text-gray-600">Automatique</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(label.date_demande).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {label.statut === 'accepte' && (
                        <button
                          onClick={() => handleRevoquer(label.id, `${label.prenom} ${label.nom}`)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Révoquer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Sélection Utilisateurs */}
      {showEnvoyerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-600" />
                    Sélectionner les utilisateurs
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Choisissez les utilisateurs éligibles pour recevoir une demande de label
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowEnvoyerModal(false);
                    setSelectedUsers([]);
                    setUserSearchTerm('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              {/* Contrôles */}
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Rechercher un utilisateur..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Tout sélectionner
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Tout désélectionner
                  </button>
                </div>
              </div>
              
              {selectedUsers.length > 0 && (
                <div className="mt-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-blue-800 text-sm font-medium">
                    {selectedUsers.length} utilisateur(s) sélectionné(s)
                  </span>
                </div>
              )}
            </div>

            {/* Liste des utilisateurs */}
            <div className="flex-1 overflow-y-auto max-h-96">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun utilisateur éligible trouvé</p>
                </div>
              ) : (
                <div className="p-4">
                  <div className="grid gap-2">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedUsers.includes(user.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleUserSelect(user.id)}
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleUserSelect(user.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {user.prenom ? `${user.prenom} ${user.nom}` : user.nom}
                                  {user.denomination && (
                                    <span className="text-gray-600 text-sm ml-2">({user.denomination})</span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {user.role === 'freelancer' ? 'Freelancer' : 'Employeur'} • 
                                  {user.secteur ? ` ${user.secteur}` : ' Secteur non défini'}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.role === 'freelancer' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {user.role === 'freelancer' ? 'Freelancer' : 'Employeur'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {filteredUsers.length} utilisateur(s) disponible(s)
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowEnvoyerModal(false);
                      setSelectedUsers([]);
                      setUserSearchTerm('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleEnvoyerDemandes}
                    disabled={selectedUsers.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Envoyer {selectedUsers.length > 0 && `(${selectedUsers.length})`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLabel;

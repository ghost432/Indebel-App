import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Check, X, Eye, Trash2, Filter, Clock, CheckCircle, XCircle, TrendingUp, Paperclip } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import devisService from '../services/devisService';

const AdminDemandesDevis = () => {
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    en_attente: 0,
    valide: 0,
    refuse: 0,
    traite: 0,
    devis_complet: 0
  });
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionModal, setActionModal] = useState({ open: false, type: '', demande: null });
  const [commentaire, setCommentaire] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    document.title = 'Demandes de Devis - Admin Indebel';
    fetchDemandes();
  }, [filterStatus]);

  const fetchDemandes = async () => {
    try {
      setLoading(true);
      const response = await devisService.getAllDemandes({ statut: filterStatus });

      if (response.success) {
        setDemandes(response.data.demandes);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Erreur chargement demandes:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  // Modal logic removed in favor of Detail Page
  const handleViewDetails = (id) => {
    navigate(`/admin/devis/${id}`);
  };

  const handleAction = (type, demande) => {
    setActionModal({ open: true, type, demande });
    setCommentaire('');
  };

  const confirmAction = async () => {
    const { type, demande } = actionModal;

    try {
      let response;

      switch (type) {
        case 'valider':
          response = await devisService.validerDemande(demande.id, commentaire);
          toast.success('Demande validée avec succès');
          break;
        case 'refuser':
          response = await devisService.refuserDemande(demande.id, commentaire);
          toast.success('Demande refusée');
          break;
        case 'traiter':
          response = await devisService.marquerTraitee(demande.id);
          toast.success('Demande marquée comme traitée');
          break;
        case 'supprimer':
          response = await devisService.deleteDemande(demande.id);
          toast.success('Demande supprimée');
          break;
        default:
          break;
      }

      setActionModal({ open: false, type: '', demande: null });
      setCommentaire('');
      fetchDemandes();
      if (modalOpen) setModalOpen(false);
    } catch (error) {
      console.error('Erreur action:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'action');
    }
  };

  const getStatusBadge = (statut) => {
    const badges = {
      en_attente: { color: 'bg-yellow-100 text-yellow-800', text: 'En attente', icon: Clock },
      valide: { color: 'bg-green-100 text-green-800', text: 'Validé', icon: CheckCircle },
      refuse: { color: 'bg-red-100 text-red-800', text: 'Refusé', icon: XCircle },
      traite: { color: 'bg-blue-100 text-blue-800', text: 'Traité', icon: TrendingUp },
      devis_complet: { color: 'bg-purple-100 text-purple-800', text: 'Devis complet (5/5)', icon: FileText }
    };

    const badge = badges[statut] || badges.en_attente;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {badge.text}
      </span>
    );
  };

  const getUrgenceBadge = (urgence) => {
    const badges = {
      normal: { color: 'bg-gray-100 text-gray-800', text: 'Normal' },
      urgent: { color: 'bg-orange-100 text-orange-800', text: 'Urgent' },
      tres_urgent: { color: 'bg-red-100 text-red-800', text: 'Très urgent' }
    };

    return badges[urgence] || badges.normal;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Demandes de Devis
        </h1>
        <p className="text-gray-600">
          Gérez les demandes de devis des clients
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.en_attente}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Validées</p>
                <p className="text-2xl font-bold text-green-600">{stats.valide}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Refusées</p>
                <p className="text-2xl font-bold text-red-600">{stats.refuse}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Traitées</p>
                <p className="text-2xl font-bold text-blue-600">{stats.traite}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Devis complet</p>
                <p className="text-2xl font-bold text-purple-600">{stats.devis_complet || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <div className="flex gap-2 flex-wrap">
              {['all', 'en_attente', 'valide', 'refuse', 'traite', 'devis_complet'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterStatus === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {status === 'all' ? 'Toutes' :
                    status === 'en_attente' ? 'En attente' :
                      status === 'valide' ? 'Validées' :
                        status === 'refuse' ? 'Refusées' :
                          status === 'traite' ? 'Traitées' : 'Devis complet'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Liste des demandes */}
      <Card>
        <div className="p-6">
          {demandes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune demande trouvée</p>
            </div>
          ) : (
            <div className="space-y-4">
              {demandes.map((demande) => (
                <div
                  key={demande.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          #{demande.id} - {demande.type_travaux}
                        </h3>
                        {getStatusBadge(demande.statut)}
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getUrgenceBadge(demande.urgence).color}`}>
                          {getUrgenceBadge(demande.urgence).text}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                          {demande.nb_devis_soumis || 0}/5 devis
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Client:</span> {demande.prenom} {demande.nom}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {demande.email}
                        </div>
                        <div>
                          <span className="font-medium">Ville:</span> {demande.ville}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {new Date(demande.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>

                      <p className="mt-3 text-gray-700 line-clamp-2">
                        {demande.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(demande.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Voir détails
                    </Button>

                    {demande.statut === 'en_attente' && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleAction('valider', demande)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Valider
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleAction('refuser', demande)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Refuser
                        </Button>
                      </>
                    )}

                    {demande.statut === 'valide' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAction('traiter', demande)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Marquer traitée
                      </Button>
                    )}

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleAction('supprimer', demande)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Modal Détails */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Détails de la demande #${selectedDemande?.id}`}
        size="large"
      >
        {selectedDemande && (
          <div className="space-y-6">
            {/* Statut et Urgence */}
            <div className="flex items-center gap-4">
              {getStatusBadge(selectedDemande.statut)}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getUrgenceBadge(selectedDemande.urgence).color}`}>
                {getUrgenceBadge(selectedDemande.urgence).text}
              </span>
            </div>

            {/* Projet */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Détails du Projet</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Urgence</label>
                  <p className={`text-sm font-medium ${getUrgenceBadge(selectedDemande.urgence).color.split(' ')[1]}`}>
                    {getUrgenceBadge(selectedDemande.urgence).text}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Type de travaux</label>
                  <p className="text-gray-900">{selectedDemande.type_travaux}</p>
                </div>
                {selectedDemande.categorie && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Catégorie</label>
                    <p className="text-gray-900">{selectedDemande.categorie}</p>
                  </div>
                )}
                {selectedDemande.date_souhaite && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date souhaitée</label>
                    <p className="text-gray-900">
                      {new Date(selectedDemande.date_souhaite).toLocaleDateString('fr-FR')}
                      {selectedDemande.heure_souhaite && ` à ${selectedDemande.heure_souhaite}`}
                    </p>
                  </div>
                )}
                {selectedDemande.budget_estime && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Budget estimé</label>
                    <p className="text-gray-900">{selectedDemande.budget_estime} €</p>
                  </div>
                )}
                {selectedDemande.details_complementaires && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Détails complémentaires</label>
                    <p className="text-gray-900">{selectedDemande.details_complementaires}</p>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-gray-900 mt-1 whitespace-pre-wrap">{selectedDemande.description}</p>
              </div>

              {/* Fichiers joints */}
              {selectedDemande.fichiers_joints && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-600 block mb-2">Pièces jointes</label>
                  {(() => {
                    let parsedFichiers = [];
                    try {
                      const raw = selectedDemande.fichiers_joints;
                      if (Array.isArray(raw)) parsedFichiers = raw;
                      else if (typeof raw === 'string') parsedFichiers = JSON.parse(raw);
                    } catch (e) { parsedFichiers = []; }

                    if (parsedFichiers.length === 0) return null;

                    return (
                      <div className="grid grid-cols-3 gap-3">
                        {parsedFichiers.map((fichier, idx) => (
                          <div key={idx} className="relative group">
                            {(fichier.data && (fichier.data.startsWith('data:image') || fichier.data.match(/\.(jpeg|jpg|gif|png|webp)$/i))) ? (
                              <img
                                src={fichier.data}
                                alt={fichier.name || `Image ${idx + 1}`}
                                className="w-full h-24 object-cover rounded-lg border border-gray-200"
                              />
                            ) : (
                              <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                                <FileText className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            {/* Download link overlay */}
                            {(fichier.data) && (
                              <a
                                href={fichier.data}
                                download={fichier.name || `file-${idx}`}
                                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Localisation */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Localisation</h3>
              <div className="space-y-2">
                <p className="text-gray-900">{selectedDemande.adresse}</p>
                <p className="text-gray-900">{selectedDemande.code_postal} {selectedDemande.ville}</p>
                {selectedDemande.region && <p className="text-gray-900">{selectedDemande.region}</p>}
              </div>
            </div>

            {/* Client */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Coordonnées Client</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nom complet</label>
                  <p className="text-gray-900">{selectedDemande.prenom} {selectedDemande.nom}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{selectedDemande.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Téléphone</label>
                  <p className="text-gray-900">{selectedDemande.telephone}</p>
                </div>
              </div>
            </div>

            {/* Commentaire admin */}
            {selectedDemande.commentaire_admin && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Commentaire Administrateur</h3>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{selectedDemande.commentaire_admin}</p>
              </div>
            )}

            {/* Devis soumis */}
            {selectedDemande.devis_soumis && selectedDemande.devis_soumis.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">
                  Devis soumis ({selectedDemande.nb_devis_soumis || selectedDemande.devis_soumis.length}/5)
                </h3>
                <div className="space-y-4">
                  {selectedDemande.devis_soumis.map((devis) => (
                    <div key={devis.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {devis.freelancer_prenom} {devis.freelancer_nom}
                          </p>
                          <p className="text-sm text-gray-600">{devis.freelancer_email}</p>
                          {devis.freelancer_telephone && (
                            <p className="text-sm text-gray-600">{devis.freelancer_telephone}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-purple-600">{devis.montant} €</p>
                          <p className="text-sm text-gray-600">{devis.delai_realisation}</p>
                        </div>
                      </div>
                      <div className="border-t border-gray-300 pt-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Description:</p>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{devis.description}</p>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Soumis le {new Date(devis.date_soumission).toLocaleDateString('fr-FR')} à {new Date(devis.date_soumission).toLocaleTimeString('fr-FR')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-t pt-6 flex gap-3">
              {selectedDemande.statut === 'en_attente' && (
                <>
                  <Button
                    variant="success"
                    onClick={() => {
                      setModalOpen(false);
                      handleAction('valider', selectedDemande);
                    }}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Valider
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setModalOpen(false);
                      handleAction('refuser', selectedDemande);
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Refuser
                  </Button>
                </>
              )}
              {selectedDemande.statut === 'valide' && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setModalOpen(false);
                    handleAction('traiter', selectedDemande);
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marquer comme traitée
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Actions */}
      <Modal
        isOpen={actionModal.open}
        onClose={() => setActionModal({ open: false, type: '', demande: null })}
        title={
          actionModal.type === 'valider' ? 'Valider la demande' :
            actionModal.type === 'refuser' ? 'Refuser la demande' :
              actionModal.type === 'traiter' ? 'Marquer comme traitée' :
                'Supprimer la demande'
        }
      >
        <div className="space-y-4">
          {actionModal.type !== 'traiter' && actionModal.type !== 'supprimer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {actionModal.type === 'valider' ? 'Message au client (optionnel)' : 'Raison du refus (optionnel)'}
              </label>
              <textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Votre message..."
              />
            </div>
          )}

          {actionModal.type === 'supprimer' && (
            <p className="text-gray-700">
              Êtes-vous sûr de vouloir supprimer définitivement cette demande ? Cette action est irréversible.
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setActionModal({ open: false, type: '', demande: null })}
            >
              Annuler
            </Button>
            <Button
              variant={
                actionModal.type === 'valider' ? 'success' :
                  actionModal.type === 'refuser' ? 'danger' :
                    actionModal.type === 'traiter' ? 'primary' : 'danger'
              }
              onClick={confirmAction}
            >
              Confirmer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDemandesDevis;

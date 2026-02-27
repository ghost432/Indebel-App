import { useState, useEffect } from 'react'
import { Shield, Eye, CheckCircle, XCircle, Clock, FileText } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import { verificationService } from '../services/verificationService'
import toast from 'react-hot-toast'

const AdminVerifications = () => {
  const [verifications, setVerifications] = useState([])
  const [filteredVerifications, setFilteredVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [statutFilter, setStatutFilter] = useState('all')
  const [selectedVerification, setSelectedVerification] = useState(null)
  const [viewModal, setViewModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [motifRefus, setMotifRefus] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    document.title = 'Vérifications d\'identité - Admin - Indebel'
    fetchVerifications()
  }, [])

  useEffect(() => {
    filterVerifications()
  }, [statutFilter, verifications])

  const fetchVerifications = async () => {
    try {
      console.log('Fetching verifications...');
      const response = await verificationService.getAllVerifications(statutFilter)
      console.log('Verifications response:', response);

      const data = response.data?.data || [];
      if (!Array.isArray(data)) {
        console.error('Verifications data is not an array:', data);
        setVerifications([]);
        setFilteredVerifications([]);
        return;
      }

      setVerifications(data)
      setFilteredVerifications(data)
    } catch (error) {
      console.error('Error fetching verifications:', error);
      toast.error('Erreur lors du chargement des vérifications')
      setVerifications([]);
      setFilteredVerifications([]);
    } finally {
      setLoading(false)
    }
  }

  const filterVerifications = () => {
    const safeVerifications = Array.isArray(verifications) ? verifications : [];
    if (statutFilter === 'all') {
      setFilteredVerifications(safeVerifications)
    } else {
      setFilteredVerifications(safeVerifications.filter(v => v.statut === statutFilter))
    }
  }

  const handleView = (verification) => {
    console.log('handleView called with:', verification);
    setSelectedVerification(verification)
    setViewModal(true)
  }

  const handleValidate = async (verificationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir valider cette vérification ?')) {
      return
    }

    try {
      setProcessing(true)
      await verificationService.validateVerification(verificationId)
      toast.success('Vérification validée avec succès')
      setViewModal(false)
      fetchVerifications()
    } catch (error) {
      toast.error('Erreur lors de la validation')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = (verification) => {
    setSelectedVerification(verification)
    setRejectModal(true)
  }

  const handleConfirmReject = async () => {
    if (!motifRefus.trim()) {
      toast.error('Veuillez indiquer un motif de refus')
      return
    }

    try {
      setProcessing(true)
      await verificationService.rejectVerification(selectedVerification.id, motifRefus)
      toast.success('Vérification refusée. Le freelancer a été notifié.')
      setRejectModal(false)
      setViewModal(false)
      setMotifRefus('')
      fetchVerifications()
    } catch (error) {
      toast.error('Erreur lors du refus')
    } finally {
      setProcessing(false)
    }
  }

  const openDocument = (dataUrl) => {
    if (!dataUrl) return;

    try {
      // If it's a regular URL (http/https), open directly
      if (dataUrl.startsWith('http')) {
        window.open(dataUrl, '_blank');
        return;
      }

      // If it's a data URL, convert to Blob
      if (dataUrl.startsWith('data:')) {
        // Simple basic check for valid data URL structure
        const parts = dataUrl.split(',');
        if (parts.length < 2) {
          console.error('Invalid data URL');
          window.open(dataUrl, '_blank'); // Fallback
          return;
        }

        const mimeMatch = parts[0].match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        const base64 = parts[1];

        // Convert base64 to blob
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });

        // Create Object URL and open
        const blobUrl = URL.createObjectURL(blob);
        const newWindow = window.open(blobUrl, '_blank');

        if (!newWindow) {
          toast.error('Veuillez autoriser les pop-ups pour voir le document');
        }

        return;
      }

      // Fallback for other cases
      window.open(dataUrl, '_blank');

    } catch (error) {
      console.error('Error opening document:', error);
      // Fallback in case of conversion error
      window.open(dataUrl, '_blank');
    }
  }

  const getStatutBadge = (statut) => {
    const variants = {
      en_attente: { variant: 'warning', label: 'En attente', icon: Clock },
      valide: { variant: 'success', label: 'Validé', icon: CheckCircle },
      refuse: { variant: 'danger', label: 'Refusé', icon: XCircle }
    }
    const config = variants[statut] || variants.en_attente
    const Icon = config.icon
    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1 inline" />
        {config.label}
      </Badge>
    )
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <Shield className="inline h-8 w-8 mr-2 text-primary-600" />
            Vérifications d'identité
          </h1>
          <p className="text-gray-600">Gérez les demandes de vérification des freelancers</p>
        </div>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <div className="flex items-center space-x-4">
          <span className="font-medium text-gray-700">Statut :</span>
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Tous</option>
            <option value="en_attente">En attente</option>
            <option value="valide">Validés</option>
            <option value="refuse">Refusés</option>
          </select>
          <span className="text-sm text-gray-600">
            {filteredVerifications.length} demande(s)
          </span>
        </div>
      </Card>

      {/* Liste des vérifications */}
      <div className="grid grid-cols-1 gap-4">
        {filteredVerifications.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune demande de vérification</p>
            </div>
          </Card>
        ) : (
          (filteredVerifications || []).map((verification) => (
            <Card key={verification.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold">
                    {verification.prenom?.charAt(0).toUpperCase() || 'F'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {verification.prenom} {verification.nom}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span>{verification.email}</span>
                      <span className="capitalize">{verification.type_document?.replace('_', ' ')}</span>
                      <span>
                        {verification.date_soumission ? new Date(verification.date_soumission).toLocaleDateString('fr-FR') : 'Date inconnue'}
                      </span>
                    </div>
                  </div>
                  <div>
                    {getStatutBadge(verification.statut)}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleView(verification)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {verification.statut === 'en_attente' && (
                    <>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleValidate(verification.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleReject(verification)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal détails vérification */}
      <Modal
        isOpen={viewModal}
        onClose={() => setViewModal(false)}
        title="Détails de la vérification"
        size="lg"
      >
        {selectedVerification && (
          <div className="space-y-6">
            {console.log('Rendering modal content for:', selectedVerification)}
            <div className="flex items-center space-x-4 pb-4 border-b">
              <div className="h-16 w-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {selectedVerification.prenom?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedVerification.prenom} {selectedVerification.nom}
                </h3>
                {getStatutBadge(selectedVerification.statut)}
              </div>
            </div>

            {/* Informations personnelles */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Informations personnelles</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nom complet</label>
                  <p className="text-gray-900">{selectedVerification.nom_complet}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{selectedVerification.email || 'Non renseigné'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Date de naissance</label>
                  <p className="text-gray-900">
                    {selectedVerification.date_naissance ? new Date(selectedVerification.date_naissance).toLocaleDateString('fr-FR') : 'Non renseignée'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Téléphone</label>
                  <p className="text-gray-900">{selectedVerification.telephone}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">Adresse</label>
                  <p className="text-gray-900">{selectedVerification.adresse_complete}</p>
                </div>
              </div>
            </div>

            {/* Document d'identité */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Document d'identité</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Type de document</label>
                  <p className="text-gray-900 capitalize">
                    {selectedVerification.type_document?.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Numéro de document</label>
                  <p className="text-gray-900">{selectedVerification.numero_document}</p>
                </div>
              </div>
            </div>

            {/* Permis de conduire */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Permis de conduire</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Possède un permis</label>
                  <p className="text-gray-900">{selectedVerification.a_permis_conduire ? 'Oui' : 'Non'}</p>
                </div>
                {selectedVerification.a_permis_conduire && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Catégorie</label>
                    <p className="text-gray-900">{selectedVerification.categorie_permis_conduire || 'Non renseigné'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Permis chariot */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Permis chariot</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Possède un permis chariot</label>
                  <p className="text-gray-900">{selectedVerification.a_permis_chariot ? 'Oui' : 'Non'}</p>
                </div>
                {selectedVerification.a_permis_chariot && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nombre de permis</label>
                    <p className="text-gray-900">{selectedVerification.nombre_permis_chariot || 'Non renseigné'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Documents d'identité */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Documents d'identité</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedVerification.document_recto && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Document recto</p>
                    <img
                      src={selectedVerification.document_recto}
                      alt="Document recto"
                      className="w-full h-auto rounded-lg border cursor-pointer hover:opacity-90"
                      onClick={() => openDocument(selectedVerification.document_recto)}
                    />
                  </div>
                )}
                {selectedVerification.document_verso && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Document verso</p>
                    <img
                      src={selectedVerification.document_verso}
                      alt="Document verso"
                      className="w-full h-auto rounded-lg border cursor-pointer hover:opacity-90"
                      onClick={() => openDocument(selectedVerification.document_verso)}
                    />
                  </div>
                )}
                {selectedVerification.selfie_document && (
                  <div className="col-span-full">
                    <p className="text-xs font-medium text-gray-600 mb-2">Selfie avec document</p>
                    <img
                      src={selectedVerification.selfie_document}
                      alt="Selfie"
                      className="w-full max-w-md mx-auto h-auto rounded-lg border cursor-pointer hover:opacity-90"
                      onClick={() => openDocument(selectedVerification.selfie_document)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Documents professionnels */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Documents professionnels</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedVerification.assurance_rc_professionnelle && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Assurance RC professionnelle</p>
                    {selectedVerification.assurance_rc_professionnelle.startsWith('data:application/pdf') ? (
                      <div className="border rounded-lg p-4 text-center">
                        <FileText className="h-12 w-12 text-red-500 mx-auto mb-2" />
                        <Button size="sm" onClick={() => openDocument(selectedVerification.assurance_rc_professionnelle)}>
                          Ouvrir le PDF
                        </Button>
                      </div>
                    ) : (
                      <img
                        src={selectedVerification.assurance_rc_professionnelle}
                        alt="Assurance RC"
                        className="w-full h-auto rounded-lg border cursor-pointer hover:opacity-90"
                        onClick={() => openDocument(selectedVerification.assurance_rc_professionnelle)}
                      />
                    )}
                  </div>
                )}
                {selectedVerification.justificatif_domicile && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Justificatif de domicile</p>
                    {selectedVerification.justificatif_domicile.startsWith('data:application/pdf') ? (
                      <div className="border rounded-lg p-4 text-center">
                        <FileText className="h-12 w-12 text-red-500 mx-auto mb-2" />
                        <Button size="sm" onClick={() => openDocument(selectedVerification.justificatif_domicile)}>
                          Ouvrir le PDF
                        </Button>
                      </div>
                    ) : (
                      <img
                        src={selectedVerification.justificatif_domicile}
                        alt="Justificatif domicile"
                        className="w-full h-auto rounded-lg border cursor-pointer hover:opacity-90"
                        onClick={() => openDocument(selectedVerification.justificatif_domicile)}
                      />
                    )}
                  </div>
                )}
                {selectedVerification.extrait_bce && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Extrait BCE</p>
                    {selectedVerification.extrait_bce.startsWith('data:application/pdf') ? (
                      <div className="border rounded-lg p-4 text-center">
                        <FileText className="h-12 w-12 text-red-500 mx-auto mb-2" />
                        <Button size="sm" onClick={() => openDocument(selectedVerification.extrait_bce)}>
                          Ouvrir le PDF
                        </Button>
                      </div>
                    ) : (
                      <img
                        src={selectedVerification.extrait_bce}
                        alt="Extrait BCE"
                        className="w-full h-auto rounded-lg border cursor-pointer hover:opacity-90"
                        onClick={() => openDocument(selectedVerification.extrait_bce)}
                      />
                    )}
                  </div>
                )}
                {selectedVerification.attestation_cotisations_sociales && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Attestation cotisations sociales</p>
                    {selectedVerification.attestation_cotisations_sociales.startsWith('data:application/pdf') ? (
                      <div className="border rounded-lg p-4 text-center">
                        <FileText className="h-12 w-12 text-red-500 mx-auto mb-2" />
                        <Button size="sm" onClick={() => openDocument(selectedVerification.attestation_cotisations_sociales)}>
                          Ouvrir le PDF
                        </Button>
                      </div>
                    ) : (
                      <img
                        src={selectedVerification.attestation_cotisations_sociales}
                        alt="Attestation cotisations"
                        className="w-full h-auto rounded-lg border cursor-pointer hover:opacity-90"
                        onClick={() => openDocument(selectedVerification.attestation_cotisations_sociales)}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Documents permis */}
            {(selectedVerification.document_permis_conduire || selectedVerification.document_permis_chariot) && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Documents permis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedVerification.document_permis_conduire && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Permis de conduire</p>
                      {selectedVerification.document_permis_conduire.startsWith('data:application/pdf') ? (
                        <div className="border rounded-lg p-4 text-center">
                          <FileText className="h-12 w-12 text-red-500 mx-auto mb-2" />
                          <Button size="sm" onClick={() => openDocument(selectedVerification.document_permis_conduire)}>
                            Ouvrir le PDF
                          </Button>
                        </div>
                      ) : (
                        <img
                          src={selectedVerification.document_permis_conduire}
                          alt="Permis de conduire"
                          className="w-full h-auto rounded-lg border cursor-pointer hover:opacity-90"
                          onClick={() => openDocument(selectedVerification.document_permis_conduire)}
                        />
                      )}
                    </div>
                  )}
                  {selectedVerification.document_permis_chariot && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Permis chariot</p>
                      {selectedVerification.document_permis_chariot.startsWith('data:application/pdf') ? (
                        <div className="border rounded-lg p-4 text-center">
                          <FileText className="h-12 w-12 text-red-500 mx-auto mb-2" />
                          <Button size="sm" onClick={() => openDocument(selectedVerification.document_permis_chariot)}>
                            Ouvrir le PDF
                          </Button>
                        </div>
                      ) : (
                        <img
                          src={selectedVerification.document_permis_chariot}
                          alt="Permis chariot"
                          className="w-full h-auto rounded-lg border cursor-pointer hover:opacity-90"
                          onClick={() => openDocument(selectedVerification.document_permis_chariot)}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedVerification.motif_refus && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <label className="text-sm font-medium text-red-900">Motif du refus</label>
                <p className="text-red-800 mt-1">{selectedVerification.motif_refus}</p>
              </div>
            )}

            {selectedVerification.statut === 'en_attente' && (
              <div className="flex items-center space-x-3 pt-4 border-t">
                <Button
                  onClick={() => handleValidate(selectedVerification.id)}
                  variant="success"
                  className="flex-1"
                  loading={processing}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Valider
                </Button>
                <Button
                  onClick={() => handleReject(selectedVerification)}
                  variant="danger"
                  className="flex-1"
                  disabled={processing}
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Refuser
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal refus */}
      <Modal
        isOpen={rejectModal}
        onClose={() => setRejectModal(false)}
        title="Refuser la vérification"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Veuillez indiquer la raison du refus. Le freelancer recevra cette information par email.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motif du refus *
            </label>
            <textarea
              value={motifRefus}
              onChange={(e) => setMotifRefus(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ex: Document illisible, informations non visibles, photo de mauvaise qualité..."
            />
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <Button
              onClick={handleConfirmReject}
              variant="danger"
              className="flex-1"
              loading={processing}
            >
              Confirmer le refus
            </Button>
            <Button
              onClick={() => setRejectModal(false)}
              variant="secondary"
              className="flex-1"
              disabled={processing}
            >
              Annuler
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AdminVerifications

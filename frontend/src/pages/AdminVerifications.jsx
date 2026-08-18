import { useState, useEffect } from 'react'
import PageLoader from '../components/PageLoader'
import { Shield, Eye, CheckCircle, XCircle, Clock, FileText, User, FileCheck, Truck, Image as ImageIcon, Briefcase, FileSignature, MapPin, Mail, Phone, Calendar, AlertTriangle } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import { verificationService } from '../services/verificationService'
import toast from 'react-hot-toast'
import { profileService } from '../services/profileService'
import { API_BASE_URL } from '../config'

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
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  useEffect(() => {
    document.title = 'Vérifications d\'identité - Admin - Indebel'
    fetchVerifications()
  }, [])

  useEffect(() => {
    filterVerifications()
  }, [statutFilter, verifications])

  const fetchVerifications = async () => {
    try {
      const response = await verificationService.getAllVerifications(statutFilter)
      const data = response?.data?.data || []
      setVerifications(data)
      setFilteredVerifications(data)
    } catch (error) {
      toast.error('Erreur lors du chargement des vérifications')
    } finally {
      setLoading(false)
    }
  }

  const filterVerifications = () => {
    const list = Array.isArray(verifications) ? verifications : []
    if (statutFilter === 'all') {
      setFilteredVerifications(list)
    } else {
      setFilteredVerifications(list.filter(v => v && v.statut === statutFilter))
    }
    setCurrentPage(1)
  }

  // Calcul pour la pagination
  const safeFiltered = Array.isArray(filteredVerifications) ? filteredVerifications : []
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentVerifications = safeFiltered.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(safeFiltered.length / itemsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleView = async (verification) => {
    try {
      setProcessing(true);
      const res = await verificationService.getVerificationById(verification.id);
      if (res?.data?.success) {
        setSelectedVerification((res.data?.data || res.data));
        setViewModal(true);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des détails de la vérification');
    } finally {
      setProcessing(false);
    }
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

  const getStatutBadge = (statut) => {
    const variants = {
      en_attente: { variant: 'warning', label: 'En attente', icon: Clock },
      valide: { variant: 'success', label: 'Validé', icon: CheckCircle },
      refuse: { variant: 'danger', label: 'Refusé', icon: XCircle }
    }
    const config = variants[statut] || variants.en_attente
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="shadow-sm">
        <Icon className="h-4 w-4 mr-1.5 inline bg-gradient-to-br from-[#2b4eef] to-[#df6422] text-white font-bold" />
        {config.label}
      </Badge>
    )
  }

  const renderAvatar = (verification, size = 'md') => {
    const userObj = {
      id: verification.freelancer_id,
      photo_profil: verification.photo_profil,
      prenom: verification.prenom,
      nom: verification.nom
    };
    const img = profileService.getProfileImage(userObj);
    const initials = profileService.getInitials(userObj, 'freelancer');
    
    const sizeClasses = {
      sm: 'h-10 w-10 text-sm',
      md: 'h-14 w-14 text-lg',
      lg: 'h-20 w-20 text-2xl'
    };

    if (img) {
      return (
        <img 
          src={img} 
          alt={initials}
          className={`${sizeClasses[size]} rounded-full object-cover shadow-md border-4 border-slate-50`}
        />
      );
    }
    
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md border-4 border-slate-50`}>
        {initials}
      </div>
    );
  }

  if (loading) {
    return <PageLoader fullScreen />
  }

  return (
    <div className="py-8">
      <div className="bg-[#082151] rounded-[24px] shadow-md p-6 md:p-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden text-white border-0">
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-white/10 text-white rounded-2xl hidden sm:block">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Vérifications d'identité</h1>
            <p className="text-slate-200 mt-1 text-sm md:text-base">Gérez les demandes de vérification des freelancers</p>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#2b4eef]/20 to-[#df6422]/20 rounded-full blur-3xl -mr-16 -mt-16 z-0 pointer-events-none"></div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-8 gap-4">
        <div className="flex items-center gap-3">
          <label className="block text-sm font-semibold text-slate-700">Filtrer par statut :</label>
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
          >
            <option value="all">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="valide">Validés</option>
            <option value="refuse">Refusés</option>
          </select>
        </div>
        <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-bold text-sm">
          {filteredVerifications.length} demande(s)
        </div>
      </div>

      {/* Liste des vérifications */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        {safeFiltered.length === 0 ? (
          <Card className="rounded-3xl border-slate-100 shadow-sm">
            <div className="text-center py-16">
              <Shield className="h-20 w-20 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-medium text-lg">Aucune demande de vérification pour le moment.</p>
            </div>
          </Card>
        ) : (
          currentVerifications.map((verification) => (
            <Card key={verification.id} className="hover:shadow-xl transition-all duration-300 rounded-3xl border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5 flex-1">
                  {renderAvatar(verification, 'md')}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                      {verification.prenom} {verification.nom}
                      {getStatutBadge(verification.statut)}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500 mt-2">
                      <span className="bg-slate-100 px-3 py-1 rounded-lg text-slate-700">{verification.email}</span>
                      <span className="capitalize text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{verification.type_document?.replace('_', ' ')}</span>
                      <span className="flex items-center gap-1"><Clock className="h-4 w-4"/> {new Date(verification.date_soumission).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:ml-4 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100">
                  <Button
                    variant="secondary"
                    onClick={() => handleView(verification)}
                    className="flex-1 sm:flex-none shadow-sm font-semibold"
                    disabled={processing}
                  >
                    <Eye className="h-5 w-5 mr-2" /> Examiner
                  </Button>
                  {verification.statut === 'en_attente' && (
                    <>
                      <Button
                        variant="success"
                        onClick={() => handleValidate(verification.id)}
                        className="shadow-sm font-semibold px-4"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleReject(verification)}
                        className="shadow-sm font-semibold px-4"
                      >
                        <XCircle className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-lg shadow-sm"
          >
            Précédent
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => {
              // Logique pour n'afficher que quelques pages autour de la page courante si beaucoup de pages
              if (
                totalPages <= 7 ||
                number === 1 ||
                number === totalPages ||
                (number >= currentPage - 1 && number <= currentPage + 1)
              ) {
                return (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors shadow-sm ${
                      currentPage === number
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    {number}
                  </button>
                )
              } else if (
                (number === currentPage - 2 && currentPage > 3) ||
                (number === currentPage + 2 && currentPage < totalPages - 2)
              ) {
                return <span key={number} className="px-2 text-slate-400">...</span>
              }
              return null;
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="rounded-lg shadow-sm"
          >
            Suivant
          </Button>
        </div>
      )}

      {/* Modal détails vérification */}
      <Modal
        isOpen={viewModal}
        onClose={() => setViewModal(false)}
        title="Détails de la vérification"
        size="lg"
      >
        {selectedVerification && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
              {renderAvatar(selectedVerification, 'lg')}
              <div className="text-center sm:text-left">
                <h3 className="text-2xl font-black text-slate-800 mb-2">
                  {selectedVerification.prenom} {selectedVerification.nom}
                </h3>
                {getStatutBadge(selectedVerification.statut)}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informations personnelles */}
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-indigo-500" /> Informations personnelles
                </h4>
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Nom complet</label>
                    <p className="text-slate-900 font-medium">{selectedVerification.nom_complet}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1"><Mail className="h-3 w-3"/> Email</label>
                      <p className="text-slate-900 font-medium truncate">{selectedVerification.email || 'Non renseigné'}</p>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1"><Phone className="h-3 w-3"/> Téléphone</label>
                      <p className="text-slate-900 font-medium">{selectedVerification.telephone}</p>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1"><Calendar className="h-3 w-3"/> Date de naissance</label>
                    <p className="text-slate-900 font-medium">
                      {new Date(selectedVerification.date_naissance).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1"><MapPin className="h-3 w-3"/> Adresse</label>
                    <p className="text-slate-900 font-medium">{selectedVerification.adresse_complete}</p>
                  </div>
                </div>
              </div>

              {/* Statuts Professionnels & Documents */}
              <div className="space-y-6">
                {/* Document d'identité */}
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 shadow-sm">
                  <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-indigo-500" /> Document d'identité
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Type</label>
                      <p className="text-slate-900 font-medium capitalize">
                        {selectedVerification.type_document?.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Numéro</label>
                      <p className="text-slate-900 font-medium">{selectedVerification.numero_document}</p>
                    </div>
                  </div>
                </div>

                {/* Permis de conduire & Chariot */}
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 shadow-sm">
                  <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Truck className="h-5 w-5 text-indigo-500" /> Permis & Certifications
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Permis de conduire</label>
                      <Badge variant={selectedVerification.a_permis_conduire ? 'success' : 'secondary'} className="mb-2">
                        {selectedVerification.a_permis_conduire ? 'Oui' : 'Non'}
                      </Badge>
                      {selectedVerification.a_permis_conduire && (
                        <p className="text-sm font-medium text-slate-800 mt-1">
                          Cat: <span className="font-bold text-indigo-600">{selectedVerification.categorie_permis_conduire || 'N/A'}</span>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Permis chariot</label>
                      <Badge variant={selectedVerification.a_permis_chariot ? 'success' : 'secondary'} className="mb-2">
                        {selectedVerification.a_permis_chariot ? 'Oui' : 'Non'}
                      </Badge>
                      {selectedVerification.a_permis_chariot && (
                        <p className="text-sm font-medium text-slate-800 mt-1">
                          Nb: <span className="font-bold text-indigo-600">{selectedVerification.nombre_permis_chariot || 'N/A'}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Galerie d'images et documents */}
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 shadow-sm">
              <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-indigo-500" /> Documents justificatifs fournis
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                
                {/* Helper for rendering doc cards */}
                {[
                  { key: 'document_recto', label: 'ID Recto' },
                  { key: 'document_verso', label: 'ID Verso' },
                  { key: 'selfie_document', label: 'Selfie ID' },
                  { key: 'assurance_rc_professionnelle', label: 'Assurance RC' },
                  { key: 'justificatif_domicile', label: 'Domicile' },
                  { key: 'extrait_bce', label: 'BCE' },
                  { key: 'attestation_cotisations_sociales', label: 'Cotisations' },
                  { key: 'document_permis_conduire', label: 'Permis Conduire' },
                  { key: 'document_permis_chariot', label: 'Permis Chariot' }
                ].map((doc) => {
                  const rawUrl = selectedVerification[doc.key]
                  if (!rawUrl) return null
                  const url = getImageUrl(rawUrl)
                  const isPdf = url.startsWith('data:application/pdf') || url.endsWith('.pdf')
                  
                  return (
                    <div key={doc.key} className="flex flex-col group cursor-pointer" onClick={() => window.open(url, '_blank')}>
                      <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 bg-white shadow-sm group-hover:border-indigo-400 group-hover:shadow-md transition-all flex items-center justify-center">
                        {isPdf ? (
                          <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                            <FileSignature className="h-10 w-10 mb-2" />
                            <span className="text-xs font-bold">PDF</span>
                          </div>
                        ) : (
                          <img 
                            src={url} 
                            alt={doc.label}
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                          />
                        )}
                        <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/10 transition-colors" />
                      </div>
                      <p className="text-xs font-bold text-center mt-2 text-slate-600 group-hover:text-indigo-600 transition-colors">{doc.label}</p>
                    </div>
                  )
                })}

              </div>
            </div>

            {selectedVerification.motif_refus && (
              <div className="bg-red-50/50 border border-red-100 p-5 rounded-3xl">
                <label className="text-sm font-bold text-red-800 flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4" /> Motif du précédent refus
                </label>
                <p className="text-red-700 bg-white/60 p-4 rounded-xl text-sm leading-relaxed border border-red-50">{selectedVerification.motif_refus}</p>
              </div>
            )}

            {selectedVerification.statut === 'en_attente' && (
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-slate-100">
                <Button
                  onClick={() => handleValidate(selectedVerification.id)}
                  className="flex-1 py-4 text-base font-bold shadow-md hover:shadow-lg transition-all w-full !bg-emerald-500 hover:!bg-emerald-600 !text-white border-0"
                  loading={processing}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Valider le profil
                </Button>
                <Button
                  onClick={() => handleReject(selectedVerification)}
                  className="flex-1 py-4 text-base font-bold shadow-md hover:shadow-lg transition-all w-full !bg-rose-500 hover:!bg-rose-600 !text-white border-0"
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
        <div className="space-y-6">
          <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 font-medium">
              Veuillez indiquer la raison du refus. Le prestataire recevra cette information par email pour corriger sa demande.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Motif du refus <span className="text-red-500">*</span>
            </label>
            <textarea
              value={motifRefus}
              onChange={(e) => setMotifRefus(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all resize-none shadow-sm font-medium"
              placeholder="Ex: Document illisible, informations non visibles, photo de mauvaise qualité..."
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
            <Button
              onClick={() => setRejectModal(false)}
              variant="secondary"
              className="flex-1 w-full py-3 shadow-sm font-bold"
              disabled={processing}
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirmReject}
              variant="danger"
              className="flex-1 w-full py-3 shadow-md font-bold"
              loading={processing}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Confirmer le refus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AdminVerifications

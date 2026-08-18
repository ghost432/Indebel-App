import { useState, useEffect } from 'react'
import PageLoader from '../components/PageLoader'
import { Building2, Search, CheckCircle2, XCircle, Mail, User, AlertTriangle, Send, Bell } from 'lucide-react'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import toast from 'react-hot-toast'
import axios from 'axios'
import { API_BASE_URL } from '../config'
import { profileService } from '../services/profileService'

const AdminVerificationBCE = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, verifie, non_verifie
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 })
  const [selectedUser, setSelectedUser] = useState(null)
  const [requestModal, setRequestModal] = useState(false)
  const [sendingRequest, setSendingRequest] = useState(false)

  // Nouveaux états pour la vérification manuelle par l'administrateur
  const [manualVerificationModal, setManualVerificationModal] = useState(false)
  const [candidates, setCandidates] = useState([])
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [candidateSearch, setCandidateSearch] = useState('')
  const [customBceNumber, setCustomBceNumber] = useState('')
  const [verifyingBce, setVerifyingBce] = useState(false)
  const [verifiedInfo, setVerifiedInfo] = useState(null)
  const [validatingBce, setValidatingBce] = useState(false)

  useEffect(() => {
    document.title = 'Vérification BCE - Admin - Indebel'
    fetchBceList(1)
  }, [statusFilter])

  const openManualVerificationModal = async () => {
    setManualVerificationModal(true)
    setSelectedCandidate(null)
    setCandidateSearch('')
    setCustomBceNumber('')
    setVerifiedInfo(null)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/users/admin/bce/candidates`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data?.success) {
        setCandidates((response.data?.data || response.data) || [])
      }
    } catch (error) {
      console.error('Erreur chargement candidats:', error)
      toast.error('Erreur lors du chargement de la liste des candidats')
    }
  }

  const handleSelectCandidate = (candidate) => {
    setSelectedCandidate(candidate)
    setCustomBceNumber(candidate.numero_bce || '')
    setVerifiedInfo(null)
    setCandidateSearch('')
  }

  const handleLaunchBceVerification = async () => {
    if (!customBceNumber || customBceNumber.length !== 10 || !/^\d{10}$/.test(customBceNumber)) {
      toast.error('Veuillez saisir un numéro BCE valide à 10 chiffres')
      return
    }

    try {
      setVerifyingBce(true)
      const response = await axios.get(`${API_BASE_URL}/users/verify-bce/${customBceNumber}`)
      if (response.data?.success) {
        setVerifiedInfo((response.data?.data || response.data))
        toast.success('Données BCE récupérées avec succès')
      } else {
        toast.error('Impossible de vérifier ce numéro BCE')
      }
    } catch (error) {
      console.error('Erreur verification BCE:', error)
      toast.error(error.response?.data?.message || 'Erreur lors de la vérification BCE')
    } finally {
      setVerifyingBce(false)
    }
  }

  const handleConfirmValidation = async () => {
    if (!selectedCandidate) return
    if (!customBceNumber || customBceNumber.length !== 10 || !/^\d{10}$/.test(customBceNumber)) {
      toast.error('Numéro BCE invalide')
      return
    }

    try {
      setValidatingBce(true)
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `${API_BASE_URL}/users/admin/bce/validate/${selectedCandidate.id}`,
        {
          numero_bce: customBceNumber,
          denomination: verifiedInfo?.denomination,
          adresse: verifiedInfo?.adresse
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data?.success) {
        toast.success('Le numéro BCE a été validé avec succès !')
        setManualVerificationModal(false)
        fetchBceList(pagination.page)
      } else {
        toast.error(response.data?.message || 'Erreur lors de la validation')
      }
    } catch (error) {
      console.error('Erreur validation BCE:', error)
      toast.error('Erreur lors de la validation du numéro BCE')
    } finally {
      setValidatingBce(false)
    }
  }

  const filteredCandidates = candidates.filter(c => {
    const searchStr = `${c.prenom || ''} ${c.nom || ''} ${c.email || ''} ${c.numero_bce || ''} ${c.denomination || ''}`.toLowerCase()
    return searchStr.includes(candidateSearch.toLowerCase())
  })

  const fetchBceList = async (page = 1) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/users/admin/bce`, {
        params: {
          page,
          limit: 1000
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.data?.success) {
        setUsers((response.data?.data || response.data) || [])
        setPagination({
          page: response.data.pagination.page,
          totalPages: response.data.pagination.totalPages,
          total: response.data.pagination.total,
          limit: response.data.pagination.limit
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement des BCE:', error)
      toast.error('Erreur lors du chargement de la liste BCE')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page) => {
    fetchBceList(page)
  }

  // Filter clients/prestataires on front-end for search (since BCE list is usually small to moderate)
  const filteredUsers = users.filter((u) => {
    const searchString = `${u.prenom || ''} ${u.nom || ''} ${u.denomination || ''} ${u.numero_bce || ''} ${u.email || ''}`.toLowerCase()
    const matchesSearch = searchString.includes(searchTerm.toLowerCase())

    if (statusFilter === 'all') return matchesSearch
    if (statusFilter === 'verifie') return matchesSearch && u.bce_verifie === 1
    if (statusFilter === 'non_verifie') return matchesSearch && !u.bce_verifie

    return matchesSearch
  })

  const openRequestModal = (user) => {
    setSelectedUser(user)
    setRequestModal(true)
  }

  const handleSendVerificationRequest = async () => {
    if (!selectedUser) return

    try {
      setSendingRequest(true)
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `${API_BASE_URL}/users/admin/bce/request/${selectedUser.id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.data?.success) {
        toast.success(`Demande de vérification envoyée avec succès à ${selectedUser.prenom || ''} ${selectedUser.nom || ''}`)
        setRequestModal(false)
        setSelectedUser(null)
      } else {
        toast.error(response.data?.message || 'Erreur lors de l\'envoi de la demande')
      }
    } catch (error) {
      console.error('Erreur envoi demande verification:', error)
      toast.error('Erreur lors de l\'envoi de la demande de vérification')
    } finally {
      setSendingRequest(false)
    }
  }

  if (loading && users.length === 0) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#082151] flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            Vérification des numéros BCE
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez et vérifiez les numéros d'entreprise (BCE) enregistrés par les prestataires et recruteurs.
          </p>
        </div>
        <Button
          onClick={openManualVerificationModal}
          className="font-bold flex items-center gap-2"
          variant="primary"
        >
          <Building2 className="h-5 w-5" /> Vérifier un numéro
        </Button>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, entreprise, email ou numéro BCE..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-bold placeholder-slate-400 text-[#082151]"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                statusFilter === 'all'
                  ? 'bg-[#082151] text-white border-[#082151]'
                  : 'bg-white text-black border-slate-200 hover:bg-slate-50'
              }`}
            >
              Tous ({users.length})
            </button>
            <button
              onClick={() => setStatusFilter('verifie')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                statusFilter === 'verifie'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-black border-slate-200 hover:bg-slate-50'
              }`}
            >
              Vérifiés ({users.filter(u => u.bce_verifie === 1).length})
            </button>
            <button
              onClick={() => setStatusFilter('non_verifie')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                statusFilter === 'non_verifie'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-black border-slate-200 hover:bg-slate-50'
              }`}
            >
              Non vérifiés ({users.filter(u => !u.bce_verifie).length})
            </button>
          </div>
        </div>
      </div>

      {/* Tableau des numéros BCE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">Utilisateur</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">Entreprise</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">N° BCE / TVA</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">Statut</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full shrink-0 relative flex items-center justify-center font-bold bg-gradient-to-br from-[#2b4eef] to-[#df6422] text-white shadow-sm">
                          {user.photo_profil ? (
                            <img
                              src={profileService.getProfileImage(user)}
                              alt="Profil"
                              className="h-full w-full rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <span className="text-sm">{profileService.getInitials(user, user.role)}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">
                            {user.prenom} {user.nom}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3" /> {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{user.denomination || '-'}</p>
                      <span className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                        user.role === 'employer' ? 'bg-indigo-50 text-indigo-700' : 'bg-teal-50 text-teal-700'
                      }`}>
                        {user.role === 'employer' ? 'Recruteur' : 'Prestataire'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-[#082151]">
                      {user.numero_bce}
                    </td>
                    <td className="px-6 py-4">
                      {user.bce_verifie === 1 ? (
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-bold text-green-700">
                            <CheckCircle2 className="h-4 w-4" /> Vérifié
                          </span>
                          {user.bce_manuel === 1 && (
                            <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              Manuel
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-700">
                          <AlertTriangle className="h-4 w-4" /> Non vérifié
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!user.bce_verifie && (
                        <Button
                          size="sm"
                          variant="warning"
                          onClick={() => openRequestModal(user)}
                          className="font-bold"
                        >
                          Demander vérification
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="font-bold">Aucun numéro BCE trouvé</p>
                    <p className="text-sm mt-1">Aucun utilisateur ne correspond aux critères de recherche.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={pagination.limit}
              totalItems={pagination.total}
            />
          </div>
        )}
      </div>

      {/* Modal pour envoyer la demande de vérification */}
      <Modal
        isOpen={requestModal}
        onClose={() => setRequestModal(false)}
        title="Demander la vérification du numéro BCE"
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-amber-900 text-sm flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Envoi de rappel par email et notification</p>
                <p className="mt-1 text-amber-700 text-xs">
                  Cette action va envoyer un email professionnel ainsi qu'une notification sur la plateforme à{' '}
                  <strong className="text-slate-800">{selectedUser.prenom} {selectedUser.nom}</strong> pour lui demander de procéder à la vérification de son numéro BCE : <strong className="text-slate-800">{selectedUser.numero_bce}</strong>.
                </p>
              </div>
            </div>

            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50 space-y-2 text-xs">
              <p className="font-bold text-slate-500 uppercase tracking-wider">Aperçu du contenu</p>
              <div className="space-y-1 text-slate-700">
                <p><strong>Sujet :</strong> ⚠️ Action requise : Vérification de votre numéro BCE - Indebel</p>
                <p><strong>Message :</strong> Bonjour, l'administrateur d'Indebel vous demande de vérifier votre numéro d'entreprise BCE pour valider votre compte.</p>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setRequestModal(false)}
                disabled={sendingRequest}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleSendVerificationRequest}
                loading={sendingRequest}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" /> Envoyer la demande
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal pour la vérification manuelle par l'administrateur */}
      <Modal
        isOpen={manualVerificationModal}
        onClose={() => setManualVerificationModal(false)}
        title="Vérifier et Valider un numéro BCE"
        size="md"
      >
        <div className="space-y-4">
          {!selectedCandidate ? (
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700">
                Sélectionner un utilisateur
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email, entreprise..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-bold placeholder-slate-400 text-[#082151]"
                />
              </div>
              <div className="border border-slate-100 rounded-xl overflow-y-auto max-h-60 divide-y divide-slate-100 bg-slate-50/50">
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCandidate(c)}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-100 transition-colors flex flex-col gap-0.5"
                    >
                      <span className="font-bold text-sm text-slate-800">
                        {c.prenom} {c.nom}
                      </span>
                      <span className="text-xs text-slate-500">{c.email}</span>
                      {c.numero_bce && (
                        <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded self-start mt-1">
                          BCE : {c.numero_bce} {c.bce_verifie === 1 && '(Vérifié)'}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="p-4 text-center text-xs text-slate-500">
                    Aucun utilisateur trouvé
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-800">
                    {selectedCandidate.prenom} {selectedCandidate.nom}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedCandidate.email}</p>
                  <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                    selectedCandidate.role === 'employer' ? 'bg-indigo-50 text-indigo-700' : 'bg-teal-50 text-teal-700'
                  }`}>
                    {selectedCandidate.role === 'employer' ? 'Recruteur' : 'Prestataire'}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="text-xs text-blue-600 hover:underline font-bold"
                >
                  Changer
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">
                  Numéro BCE / TVA
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="Ex: 0797947437"
                    value={customBceNumber}
                    onChange={(e) => setCustomBceNumber(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-mono font-bold text-[#082151]"
                  />
                  <Button
                    onClick={handleLaunchBceVerification}
                    loading={verifyingBce}
                    variant="outline"
                    size="sm"
                    className="font-bold text-xs"
                  >
                    Vérifier API
                  </Button>
                </div>
              </div>

              {verifiedInfo && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-2 text-xs">
                  <p className="font-bold text-green-800 uppercase tracking-wider">
                    Informations officielles confirmées
                  </p>
                  <p className="text-slate-700">
                    <strong>Dénomination :</strong> {verifiedInfo.denomination}
                  </p>
                  <p className="text-slate-700">
                    <strong>Adresse :</strong> {verifiedInfo.adresse}
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => setManualVerificationModal(false)}
                  disabled={validatingBce}
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmValidation}
                  loading={validatingBce}
                  disabled={!verifiedInfo}
                  className="font-bold"
                >
                  Valider et Enregistrer
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default AdminVerificationBCE;

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, X, FolderTree, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import PageLoader from '../components/PageLoader'
import toast from 'react-hot-toast'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const AdminSecteurs = () => {
  const [secteurs, setSecteurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalSecteur, setModalSecteur] = useState({ open: false, data: null })
  const [modalCompetence, setModalCompetence] = useState({ open: false, data: null, secteurId: null })
  const [expandedSecteur, setExpandedSecteur] = useState(null)

  useEffect(() => {
    document.title = 'Secteurs & Compétences - Admin'
    fetchSecteurs()
  }, [])

  const fetchSecteurs = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/secteurs/with-competences`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSecteurs((response.data?.data || response.data))
    } catch (error) {
      toast.error('Erreur chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSecteur = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const data = {
      nom: fd.get('nom'),
      description: fd.get('description'),
      ordre: parseInt(fd.get('ordre')) || 0,
      actif: fd.get('actif') ? 1 : 0
    }

    try {
      const token = localStorage.getItem('token')
      if (modalSecteur.data?.id) {
        await axios.put(`${API_BASE_URL}/secteurs/${modalSecteur.data.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success('Secteur modifié')
      } else {
        await axios.post(`${API_BASE_URL}/secteurs`, data, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success('Secteur créé')
      }
      setModalSecteur({ open: false, data: null })
      fetchSecteurs()
    } catch (error) {
      toast.error('Erreur sauvegarde')
    }
  }

  const handleDeleteSecteur = async (id) => {
    if (!confirm('Supprimer ce secteur et ses compétences ?')) return
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_BASE_URL}/secteurs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Secteur supprimé')
      fetchSecteurs()
    } catch (error) {
      toast.error('Erreur suppression')
    }
  }

  const handleSaveCompetence = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const data = {
      secteur_id: modalCompetence.secteurId,
      nom: fd.get('nom'),
      ordre: parseInt(fd.get('ordre')) || 0,
      actif: fd.get('actif') ? 1 : 0
    }

    try {
      const token = localStorage.getItem('token')
      if (modalCompetence.data?.id) {
        await axios.put(`${API_BASE_URL}/secteurs/competences/${modalCompetence.data.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success('Compétence modifiée')
      } else {
        await axios.post(`${API_BASE_URL}/secteurs/competences`, data, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success('Compétence créée')
      }
      setModalCompetence({ open: false, data: null, secteurId: null })
      fetchSecteurs()
    } catch (error) {
      toast.error('Erreur sauvegarde')
    }
  }

  const handleDeleteCompetence = async (id) => {
    if (!confirm('Supprimer cette compétence ?')) return
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_BASE_URL}/secteurs/competences/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Compétence supprimée')
      fetchSecteurs()
    } catch (error) {
      toast.error('Erreur suppression')
    }
  }

  if (loading) {
    return <PageLoader fullScreen />
  }

  return (
    <div className="py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#082151]">Secteurs & Compétences</h1>
          <p className="text-slate-500 mt-1">Gérez l'arborescence des domaines d'activité de la plateforme</p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-slate-200/60 shadow-sm">
            <FolderTree className="h-5 w-5 text-indigo-500" />
            <span className="text-lg font-bold text-[#082151]">{secteurs.length}</span>
          </div>
          <Button onClick={() => setModalSecteur({ open: true, data: null })} className="flex-1 sm:flex-none justify-center bg-[#2A4DEF] hover:bg-[#1a38c2] shadow-md hover:shadow-lg transition-all rounded-xl py-2">
            <Plus className="h-5 w-5 mr-2" />
            Nouveau secteur
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {secteurs.map((secteur) => {
          const isExpanded = expandedSecteur === secteur.id;
          return (
          <Card key={secteur.id} className="hover:shadow-lg transition-all duration-300 border-transparent hover:border-indigo-100/50 p-0 overflow-hidden group">
            <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1 flex gap-4">
                <div 
                  onClick={() => setExpandedSecteur(isExpanded ? null : secteur.id)}
                  className={`cursor-pointer shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl transition-colors ${isExpanded ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'}`}
                >
                  <FolderTree className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <button
                      onClick={() => setExpandedSecteur(isExpanded ? null : secteur.id)}
                      className="text-xl font-bold text-[#082151] hover:text-[#2A4DEF] transition-colors text-left flex items-center gap-2"
                    >
                      {secteur.nom}
                      {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                    </button>
                    {secteur.actif === 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">Désactivé</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">Actif</span>
                    )}
                  </div>
                  {secteur.description && (
                    <p className="text-sm text-slate-500 mb-2 leading-relaxed max-w-3xl">{secteur.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                    <span className="bg-slate-50 px-2 py-1 rounded-md text-slate-600 border border-slate-100">Ordre: {secteur.ordre}</span>
                    <span className="bg-slate-50 px-2 py-1 rounded-md text-slate-600 border border-slate-100">{secteur.competences?.length || 0} compétences</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100 mt-2 sm:mt-0 w-full sm:w-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setModalSecteur({ open: true, data: secteur })}
                  className="flex-1 sm:flex-none justify-center bg-white border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm"
                >
                  <Edit className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Modifier</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteSecteur(secteur.id)}
                  className="flex-1 sm:flex-none justify-center bg-white border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 shadow-sm"
                >
                  <Trash2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Supprimer</span>
                </Button>
              </div>
            </div>

            {isExpanded && (
              <div className="bg-slate-50/50 p-5 sm:p-6 border-t border-slate-100/60">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <h3 className="font-bold text-[#082151] flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    Compétences du secteur
                  </h3>
                  <Button
                    size="sm"
                    onClick={() => setModalCompetence({ open: true, data: null, secteurId: secteur.id })}
                    className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 hover:text-indigo-800 border-none shadow-sm rounded-lg w-full sm:w-auto justify-center"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Ajouter une compétence
                  </Button>
                </div>

                {(!secteur.competences || secteur.competences.length === 0) ? (
                  <div className="bg-white rounded-xl border border-slate-200 border-dashed p-8 flex flex-col items-center justify-center text-center">
                    <AlertCircle className="h-10 w-10 text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">Aucune compétence dans ce secteur.</p>
                    <p className="text-sm text-slate-400 mt-1">Ajoutez-en une pour enrichir les profils !</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {secteur.competences.map((comp) => (
                      <div key={comp.id} className="group/comp bg-white border border-slate-200 hover:border-indigo-200 p-3 rounded-xl flex items-center justify-between transition-colors shadow-sm hover:shadow-md">
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="font-semibold text-sm text-[#082151] truncate flex items-center gap-2">
                            <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md font-mono">{comp.ordre}</span>
                            {comp.nom}
                          </span>
                          {comp.actif === 0 && <span className="text-[10px] text-red-500 font-bold uppercase mt-0.5">Désactivé</span>}
                        </div>
                        <div className="flex space-x-1 shrink-0 opacity-100 sm:opacity-0 group-hover/comp:opacity-100 transition-opacity">
                          <button
                            onClick={() => setModalCompetence({ open: true, data: comp, secteurId: secteur.id })}
                            className="p-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-400 transition-colors"
                            title="Modifier"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCompetence(comp.id)}
                            className="p-1.5 bg-slate-50 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-400 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
          )
        })}
      </div>

      {/* Modal Secteur */}
      <Modal
        isOpen={modalSecteur.open}
        onClose={() => setModalSecteur({ open: false, data: null })}
        title={
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <FolderTree className="h-5 w-5" />
            </div>
            <span>{modalSecteur.data ? 'Modifier le secteur' : 'Nouveau secteur'}</span>
          </div>
        }
      >
        <form onSubmit={handleSaveSecteur} className="space-y-5 pt-2">
          <Input
            label="Nom du secteur"
            name="nom"
            defaultValue={modalSecteur.data?.nom}
            required
            className="bg-slate-50 focus:bg-white transition-colors"
            placeholder="Ex: Informatique, BTP, Santé..."
          />
          <div>
            <label className="block text-sm font-semibold text-[#082151] mb-2">Description</label>
            <textarea
              name="description"
              defaultValue={modalSecteur.data?.description}
              rows="3"
              placeholder="Décrivez ce secteur d'activité..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#2A4DEF] focus:ring-4 focus:ring-[#2A4DEF]/10 transition-all resize-none text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ordre d'affichage"
              name="ordre"
              type="number"
              defaultValue={modalSecteur.data?.ordre || (secteurs.length > 0 ? Math.max(...secteurs.map(s => s.ordre || 0)) + 1 : 1)}
              className="bg-slate-50 focus:bg-white transition-colors"
            />
            <div className="flex flex-col justify-end">
              <label className="flex items-center cursor-pointer p-3 rounded-xl border border-slate-200 hover:border-[#2A4DEF] bg-slate-50 hover:bg-white transition-all">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="actif"
                    id="actif"
                    defaultChecked={modalSecteur.data?.actif !== 0}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </div>
                <span className="ml-3 text-sm font-semibold text-[#082151]">Secteur Actif</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setModalSecteur({ open: false, data: null })} className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50">
              Annuler
            </Button>
            <Button type="submit" className="bg-[#2A4DEF] hover:bg-[#1a38c2] shadow-md hover:shadow-lg transition-all">
              <Save className="h-4 w-4 mr-2" />
              {modalSecteur.data ? 'Mettre à jour' : 'Créer le secteur'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Compétence */}
      <Modal
        isOpen={modalCompetence.open}
        onClose={() => setModalCompetence({ open: false, data: null, secteurId: null })}
        title={
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <Plus className="h-5 w-5" />
            </div>
            <span>{modalCompetence.data ? 'Modifier la compétence' : 'Nouvelle compétence'}</span>
          </div>
        }
      >
        <form onSubmit={handleSaveCompetence} className="space-y-5 pt-2">
          <Input
            label="Intitulé de la compétence"
            name="nom"
            defaultValue={modalCompetence.data?.nom}
            required
            className="bg-slate-50 focus:bg-white transition-colors"
            placeholder="Ex: React.js, Peinture en bâtiment..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ordre"
              name="ordre"
              type="number"
              defaultValue={modalCompetence.data?.ordre || (secteurs.find(s => s.id === modalCompetence.secteurId)?.competences?.length > 0 ? Math.max(...secteurs.find(s => s.id === modalCompetence.secteurId).competences.map(c => c.ordre || 0)) + 1 : 1)}
              className="bg-slate-50 focus:bg-white transition-colors"
            />
            <div className="flex flex-col justify-end">
              <label className="flex items-center cursor-pointer p-3 rounded-xl border border-slate-200 hover:border-[#2A4DEF] bg-slate-50 hover:bg-white transition-all">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="actif"
                    id="comp-actif"
                    defaultChecked={modalCompetence.data?.actif !== 0}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </div>
                <span className="ml-3 text-sm font-semibold text-[#082151]">Actif</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setModalCompetence({ open: false, data: null, secteurId: null })} className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50">
              Annuler
            </Button>
            <Button type="submit" className="bg-[#2A4DEF] hover:bg-[#1a38c2] shadow-md hover:shadow-lg transition-all">
              <Save className="h-4 w-4 mr-2" />
              {modalCompetence.data ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default AdminSecteurs

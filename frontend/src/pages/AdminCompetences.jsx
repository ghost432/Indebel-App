import { useState, useEffect } from 'react'
import PageLoader from '../components/PageLoader'
import { Plus, Edit, Trash2, Save, Filter, Search, Layers, FolderTree } from 'lucide-react'
import Card from '../components/Card'
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const AdminCompetences = () => {
  const [competences, setCompetences] = useState([])
  const [secteurs, setSecteurs] = useState([])
  const [filteredCompetences, setFilteredCompetences] = useState([])
  const [selectedSecteur, setSelectedSecteur] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, data: null })
  const [searchTerm, setSearchTerm] = useState('')
  const [modalSelectedSecteur, setModalSelectedSecteur] = useState('')

  useEffect(() => {
    document.title = 'Compétences - Admin'
    fetchData()
  }, [])

  useEffect(() => {
    filterCompetences()
  }, [selectedSecteur, searchTerm, competences])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/secteurs/with-competences`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      const secteursData = (response.data?.data || response.data)
      setSecteurs(secteursData)
      
      // Flatten all competences with secteur info
      const allComp = []
      secteursData.forEach(secteur => {
        secteur.competences?.forEach(comp => {
          allComp.push({
            ...comp,
            secteur_nom: secteur.nom,
            secteur_id: secteur.id
          })
        })
      })
      setCompetences(allComp)
      setFilteredCompetences(allComp)
    } catch (error) {
      toast.error('Erreur chargement')
    } finally {
      setLoading(false)
    }
  }

  const filterCompetences = () => {
    let filtered = competences

    if (selectedSecteur) {
      filtered = filtered.filter(c => c.secteur_id === parseInt(selectedSecteur))
    }

    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.nom.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Toujours trier par nom de secteur puis par ordre
    filtered.sort((a, b) => a.secteur_nom.localeCompare(b.secteur_nom) || a.ordre - b.ordre)
    setFilteredCompetences(filtered)
  }

  const { currentItems, currentPage, totalPages, goToPage, totalItems } = usePagination(filteredCompetences, 10)

  const handleSave = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const data = {
      secteur_id: parseInt(fd.get('secteur_id')),
      nom: fd.get('nom'),
      ordre: parseInt(fd.get('ordre')) || 0,
      actif: fd.get('actif') ? 1 : 0
    }

    try {
      const token = localStorage.getItem('token')
      if (modal.data?.id) {
        await axios.put(`${API_BASE_URL}/secteurs/competences/${modal.data.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success('Compétence modifiée')
      } else {
        await axios.post(`${API_BASE_URL}/secteurs/competences`, data, {
          headers: { Authorization: `Bearer ${token}` }
        })
        toast.success('Compétence créée')
      }
      setModal({ open: false, data: null })
      fetchData()
    } catch (error) {
      toast.error('Erreur sauvegarde')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette compétence ?')) return
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`https://api.indebel.be/api/secteurs/competences/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Compétence supprimée')
      fetchData()
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
          <h1 className="text-3xl font-bold text-[#082151]">Toutes les Compétences</h1>
          <p className="text-slate-500 mt-1">Gérez la liste globale des compétences et métiers associés</p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-slate-200/60 shadow-sm">
            <Layers className="h-5 w-5 text-indigo-500" />
            <span className="text-lg font-bold text-[#082151]">{competences.length}</span>
          </div>
          <Button onClick={() => {
            setModal({ open: true, data: null })
            setModalSelectedSecteur(selectedSecteur || '')
          }} className="flex-1 sm:flex-none justify-center bg-[#2A4DEF] hover:bg-[#1a38c2] shadow-md hover:shadow-lg transition-all rounded-xl py-2">
            <Plus className="h-5 w-5 mr-2" />
            Nouvelle compétence
          </Button>
        </div>
      </div>

      {/* Statistiques et Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100/50">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-blue-600 mb-1">Total Compétences</span>
            <span className="text-3xl font-bold text-[#082151]">{competences.length}</span>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100/50">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-emerald-600 mb-1">Actives</span>
            <span className="text-3xl font-bold text-[#082151]">{competences.filter(c => c.actif === 1).length}</span>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-100/50">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-red-600 mb-1">Désactivées</span>
            <span className="text-3xl font-bold text-[#082151]">{competences.filter(c => c.actif === 0).length}</span>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200/50">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-600 mb-1">Résultats filtrés</span>
            <span className="text-3xl font-bold text-[#082151]">{filteredCompetences.length}</span>
          </div>
        </Card>
      </div>

      <Card className="mb-8 p-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="p-3">
            <div className="flex items-center px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl focus-within:bg-white focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
              <FolderTree className="h-5 w-5 text-slate-400 mr-2 shrink-0" />
              <select
                value={selectedSecteur}
                onChange={(e) => setSelectedSecteur(e.target.value)}
                className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-[#082151] cursor-pointer outline-none"
              >
                <option value="">Tous les secteurs</option>
                {secteurs.map(s => (
                  <option key={s.id} value={s.id}>{s.nom} ({s.competences?.length || 0})</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="md:col-span-2 p-3">
            <div className="flex items-center px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl focus-within:bg-white focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
              <Search className="h-5 w-5 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Rechercher une compétence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-[#082151] placeholder:text-slate-400 outline-none"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Liste des compétences */}
      {filteredCompetences.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <Layers className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#082151] mb-2">Aucune compétence trouvée</h3>
          <p className="text-slate-500">Essayez de modifier vos filtres ou d'en créer une nouvelle.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentItems.map((comp) => (
            <Card key={comp.id} className="hover:shadow-lg transition-all duration-200 border-transparent hover:border-indigo-100 p-0 overflow-hidden flex flex-col group">
              <div className="p-4 sm:p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 text-indigo-600 h-10 w-10 rounded-xl flex items-center justify-center shrink-0">
                      <span className="font-mono font-bold text-sm">{comp.ordre}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-[#082151] text-base leading-tight group-hover:text-indigo-600 transition-colors">{comp.nom}</h3>
                      <span className="inline-flex items-center text-xs font-semibold text-slate-500 mt-1">
                        <FolderTree className="h-3 w-3 mr-1" />
                        {comp.secteur_nom}
                      </span>
                    </div>
                  </div>
                  {comp.actif === 1 ? (
                    <span className="inline-flex shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">Actif</span>
                  ) : (
                    <span className="inline-flex shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">Désactivé</span>
                  )}
                </div>
              </div>
              <div className="bg-slate-50/50 border-t border-slate-100 p-3 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setModal({ open: true, data: comp })
                    setModalSelectedSecteur(comp.secteur_id || '')
                  }}
                  className="bg-white border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm px-3"
                >
                  <Edit className="h-4 w-4 mr-1.5" />
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(comp.id)}
                  className="bg-white border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 shadow-sm px-3"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Supprimer
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            itemsPerPage={10}
            totalItems={totalItems}
          />
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, data: null })}
        title={
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Plus className="h-5 w-5" />
            </div>
            <span>{modal.data ? 'Modifier la compétence' : 'Nouvelle compétence'}</span>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-5 pt-2">
          <div>
            <label className="block text-sm font-semibold text-[#082151] mb-2">Secteur associé *</label>
            <div className="relative">
              <FolderTree className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <select
                name="secteur_id"
                value={modalSelectedSecteur}
                onChange={(e) => setModalSelectedSecteur(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#2A4DEF] focus:ring-4 focus:ring-[#2A4DEF]/10 transition-all text-sm font-medium text-[#082151] appearance-none"
                required
              >
                <option value="" disabled>Sélectionner un secteur</option>
                {secteurs.map(s => (
                  <option key={s.id} value={s.id}>{s.nom}</option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Intitulé de la compétence *"
            name="nom"
            defaultValue={modal.data?.nom}
            required
            className="bg-slate-50 focus:bg-white transition-colors"
            placeholder="Ex: Maçonnerie, Développement React..."
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              key={`ordre-${modalSelectedSecteur}`}
              label="Ordre d'affichage"
              name="ordre"
              type="number"
              defaultValue={modal.data?.ordre || (modalSelectedSecteur ? (competences.filter(c => c.secteur_id === parseInt(modalSelectedSecteur)).reduce((max, c) => Math.max(max, c.ordre || 0), 0) + 1) : 1)}
              className="bg-slate-50 focus:bg-white transition-colors"
            />
            <div className="flex flex-col justify-end">
              <label className="flex items-center cursor-pointer p-3 rounded-xl border border-slate-200 hover:border-[#2A4DEF] bg-slate-50 hover:bg-white transition-all">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="actif"
                    id="actif"
                    defaultChecked={modal.data?.actif !== 0}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </div>
                <span className="ml-3 text-sm font-semibold text-[#082151]">Active</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setModal({ open: false, data: null })} className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50">
              Annuler
            </Button>
            <Button type="submit" className="bg-[#2A4DEF] hover:bg-[#1a38c2] shadow-md hover:shadow-lg transition-all">
              <Save className="h-4 w-4 mr-2" />
              {modal.data ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default AdminCompetences

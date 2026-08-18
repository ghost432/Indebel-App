import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config'
import PageLoader from './PageLoader'

const SecteurCompetenceSelector = ({ 
  selectedSecteur, 
  setSelectedSecteur, 
  selectedCompetences, 
  setSelectedCompetences,
  competencesLabel = 'Compétences'
}) => {
  const [secteurs, setSecteurs] = useState([])
  const [competencesDisponibles, setCompetencesDisponibles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchSecteurs()
  }, [])

  useEffect(() => {
    if (selectedSecteur && secteurs.length > 0) {
      const secteur = secteurs.find(s => s.nom === selectedSecteur || s.id === selectedSecteur)
      if (secteur) {
        console.log('Secteur trouvé:', secteur.nom, 'avec', secteur.competences?.length, 'compétences')
        setCompetencesDisponibles(secteur.competences || [])
      }
    } else {
      setCompetencesDisponibles([])
    }
  }, [selectedSecteur, secteurs])

  const fetchSecteurs = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`${API_BASE_URL}/secteurs/with-competences`)
      console.log('Secteurs chargés:', response.data.data)
      setSecteurs(response.data.data || [])
    } catch (error) {
      console.error('Erreur chargement secteurs:', error)
      setError('Impossible de charger les secteurs. Vérifiez que le serveur est démarré.')
    } finally {
      setLoading(false)
    }
  }

  const toggleCompetence = (competence) => {
    const competencesArray = Array.isArray(selectedCompetences) ? selectedCompetences : [];
    if (competencesArray.includes(competence)) {
      setSelectedCompetences(competencesArray.filter(c => c !== competence))
    } else {
      setSelectedCompetences([...competencesArray, competence])
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <PageLoader label="Chargement des secteurs..." compact />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
          <button 
            onClick={fetchSecteurs}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Sélection Secteur */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Secteur d'activité *
        </label>
        <select
          value={selectedSecteur || ''}
          onChange={(e) => {
            const newValue = e.target.value
            console.log('Secteur sélectionné:', newValue)
            console.log('Avant setSelectedSecteur, valeur actuelle:', selectedSecteur)
            setSelectedSecteur(newValue)
            setSelectedCompetences([]) // Reset compétences
            console.log('Après setSelectedSecteur')
          }}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          required
          disabled={secteurs.length === 0}
        >
          <option value="">
            {secteurs.length === 0 ? 'Aucun secteur disponible' : 'Sélectionnez un secteur'}
          </option>
          {Array.isArray(secteurs) && secteurs.map(secteur => (
            <option key={secteur.id} value={secteur.nom}>
              {secteur.nom}
            </option>
          ))}
        </select>
        {secteurs.length === 0 && !loading && (
          <p className="text-xs text-red-600 mt-1">Aucun secteur trouvé. Vérifiez que le serveur backend est démarré.</p>
        )}
      </div>

      {/* Sélection Compétences */}
      {competencesDisponibles.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {competencesLabel} * (Sélectionnez-en au moins une)
          </label>
          <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Array.isArray(competencesDisponibles) && competencesDisponibles.map(comp => (
                <label 
                  key={comp.id} 
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={Array.isArray(selectedCompetences) && selectedCompetences.includes(comp.nom)}
                    onChange={() => toggleCompetence(comp.nom)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{comp.nom}</span>
                </label>
              ))}
            </div>
          </div>
          {Array.isArray(selectedCompetences) && selectedCompetences.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedCompetences.map(comp => (
                <span 
                  key={comp} 
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                >
                  {comp}
                  <button
                    type="button"
                    onClick={() => toggleCompetence(comp)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SecteurCompetenceSelector

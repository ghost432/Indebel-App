import { Languages } from 'lucide-react'

const LanguesSelector = ({ selectedLangues, setSelectedLangues }) => {
  const languesDisponibles = [
    'Français',
    'Néerlandais',
    'Anglais',
    'Allemand',
    'Espagnol',
    'Italien',
    'Portugais',
    'Arabe',
    'Russe',
    'Chinois',
    'Japonais',
    'Coréen',
    'Polonais',
    'Turc',
    'Grec',
    'Roumain',
    'Bulgare',
    'Hongrois',
    'Tchèque',
    'Suédois',
    'Danois',
    'Norvégien',
    'Finnois',
    'Hindi',
    'Swahili',
    'Autre'
  ]

  const toggleLangue = (langue) => {
    const languesArray = Array.isArray(selectedLangues) ? selectedLangues : []
    
    if (languesArray.includes(langue)) {
      setSelectedLangues(languesArray.filter(l => l !== langue))
    } else {
      setSelectedLangues([...languesArray, langue])
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Languages className="h-4 w-4 inline mr-2" />
          Langues parlées
        </label>
        <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto bg-white">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {languesDisponibles.map(langue => (
              <label 
                key={langue} 
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  checked={(Array.isArray(selectedLangues) ? selectedLangues : []).includes(langue)}
                  onChange={() => toggleLangue(langue)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{langue}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Affichage des langues sélectionnées */}
        {Array.isArray(selectedLangues) && selectedLangues.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">Langues sélectionnées :</p>
            <div className="flex flex-wrap gap-2">
              {selectedLangues.map(langue => (
                <span 
                  key={langue} 
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {langue}
                  <button
                    type="button"
                    onClick={() => toggleLangue(langue)}
                    className="ml-2 text-blue-600 hover:text-blue-800 font-bold"
                    title="Supprimer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-2">
          Sélectionnez toutes les langues que vous parlez couramment
        </p>
      </div>
    </div>
  )
}

export default LanguesSelector

import { Languages } from 'lucide-react'

const MultiSelectDropdown = ({ 
  options = [], 
  value = [], 
  onChange, 
  placeholder = 'Sélectionnez...',
  disabled = false,
  label = ''
}) => {
  const handleChange = (e, option) => {
    e.preventDefault()
    e.stopPropagation()
    
    const currentValue = Array.isArray(value) ? value : []
    const newValue = currentValue.includes(option)
      ? currentValue.filter(v => v !== option)
      : [...currentValue, option]
    
    onChange(newValue)
  }

  const currentValue = Array.isArray(value) ? value : []

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Languages className="h-4 w-4 mr-2 inline" />
          {label}
        </label>
      )}
      
      <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {options && options.length > 0 ? (
            options.map((option) => (
              <label
                key={option}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <input
                  type="checkbox"
                  id={`lang-${option}`}
                  checked={currentValue.includes(option)}
                  onChange={(e) => handleChange(e, option)}
                  disabled={disabled}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-gray-700 capitalize">{option}</span>
              </label>
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 text-sm text-gray-500 text-center py-4">
              Aucune option disponible
            </div>
          )}
        </div>
      </div>
      
      {currentValue.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {currentValue.map((lang) => (
            <span 
              key={lang} 
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
            >
              {lang}
              <button
                type="button"
                onClick={() => handleChange({ preventDefault: () => {}, stopPropagation: () => {} }, lang)}
                className="ml-2 text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default MultiSelectDropdown

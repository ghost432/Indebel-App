import { useState } from 'react'
import { X } from 'lucide-react'

const MultiSelect = ({ options, selected, onChange, placeholder, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleOption = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const removeOption = (value) => {
    onChange(selected.filter(v => v !== value))
  }

  const selectedLabels = selected.map(val => 
    options.find(opt => opt.value === val)?.label || val
  )

  return (
    <div className={`relative ${className}`}>
      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedLabels.map((label, index) => (
            <span
              key={selected[index]}
              className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
            >
              {label}
              <button
                type="button"
                onClick={() => removeOption(selected[index])}
                className="ml-1 hover:text-blue-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <span className="text-gray-500">
            {placeholder || 'Sélectionner...'}
          </span>
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {options.map(option => (
                <label
                  key={option.value}
                  className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option.value)}
                    onChange={() => toggleOption(option.value)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                  {option.categorie && (
                    <span className="ml-auto text-xs text-gray-400">{option.categorie}</span>
                  )}
                </label>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MultiSelect

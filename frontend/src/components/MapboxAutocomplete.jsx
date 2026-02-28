import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader } from 'lucide-react'

// Token Mapbox - Remplacer par votre propre token si nécessaire
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'REMPLACER_PAR_VOTRE_TOKEN_MAPBOX'

const MapboxAutocomplete = ({
  value,
  onChange,
  placeholder = "Ex: Chaussée de Ruisbroek 257, 1620 Drogenbos",
  label,
  required = false,
  error
}) => {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [tokenError, setTokenError] = useState(false)
  const debounceTimeout = useRef(null)
  const wrapperRef = useRef(null)

  // Fermer les suggestions en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Mettre à jour le query quand value change (depuis le parent)
  useEffect(() => {
    if (value !== query) {
      setQuery(value || '')
    }
  }, [value])

  const fetchSuggestions = async (searchText) => {
    if (!searchText || searchText.length < 3) {
      setSuggestions([])
      return
    }

    setLoading(true)
    setTokenError(false)

    try {
      // Vérifier si le token existe
      if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'undefined') {
        console.warn('Token Mapbox non configuré')
        setTokenError(true)
        setSuggestions([])
        setLoading(false)
        return
      }

      // Geocoding API de Mapbox limitée à la Belgique
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchText)}.json?` +
        `access_token=${MAPBOX_TOKEN}&` +
        `country=BE&` + // Limiter à la Belgique
        `types=address,poi,place,locality,neighborhood&` + // Ajout de poi pour plus de résultats
        `language=fr&` +
        `autocomplete=true&` + // Active l'autocomplétion
        `fuzzyMatch=true&` + // Recherche floue pour meilleure correspondance
        `limit=8`, // Augmenter le nombre de résultats
        {
          signal: AbortSignal.timeout(5000) // Timeout de 5 secondes
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Vérifier si le token est valide
      if (data.message && data.message.includes('Not Authorized')) {
        console.error('Token Mapbox invalide ou expiré')
        setTokenError(true)
        setSuggestions([])
        return
      }

      if (data.features && data.features.length > 0) {
        setSuggestions(data.features)
      } else {
        setSuggestions([])
      }
    } catch (error) {
      console.error('Erreur lors de la recherche d\'adresse:', error)
      // Ne pas bloquer l'utilisateur, juste masquer les suggestions
      setTokenError(false) // Ne pas afficher l'erreur pour une meilleure UX
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setQuery(newValue)
    setShowSuggestions(true)

    // Debounce pour éviter trop de requêtes
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    debounceTimeout.current = setTimeout(() => {
      fetchSuggestions(newValue)
    }, 300)
  }

  const handleManualInput = () => {
    // Permet de valider l'adresse saisie manuellement
    if (query.trim()) {
      // Extraire la ville de l'adresse manuelle
      let city = null
      if (query.includes(',')) {
        const afterComma = query.split(',')[1].trim()
        const parts = afterComma.split(' ')
        city = parts.slice(1).join(' ')
      }

      onChange({
        fullAddress: query.trim(),
        city: city || query.trim(),
        coordinates: null // Pas de coordonnées en mode manuel
      })
      setShowSuggestions(false)
      setTokenError(false)
    }
  }

  const handleSelectSuggestion = (suggestion) => {
    // Format belge attendu : "Rue Numéro, Code postal Ville"
    // Exemple : "Chaussée de Ruisbroek 257, 1620 Drogenbos"
    let selectedAddress = suggestion.place_name

    // Si l'adresse contient ", Belgique" ou ", Belgium", on le retire
    selectedAddress = selectedAddress.replace(/, Belgique$/, '').replace(/, Belgium$/, '')

    setQuery(selectedAddress)
    setShowSuggestions(false)
    setSuggestions([])

    // Extraire la ville de l'adresse
    // Format : "Rue Numéro, Code postal Ville"
    // On prend ce qui est après la virgule et on extrait le dernier mot (la ville)
    let city = null

    // Méthode 1 : Depuis le context Mapbox
    const context = suggestion.context || []
    const placeContext = context.find(c => c.id.startsWith('place'))
    if (placeContext) {
      city = placeContext.text
    }

    // Méthode 2 : Extraction depuis l'adresse si pas de context
    if (!city && selectedAddress.includes(',')) {
      const afterComma = selectedAddress.split(',')[1].trim() // "1620 Drogenbos"
      const parts = afterComma.split(' ')
      // Le dernier élément est la ville, le(s) premier(s) sont le code postal
      city = parts.slice(1).join(' ') // Prend tout sauf le premier élément (code postal)
    }

    // Méthode 3 : Fallback sur le texte de la suggestion
    if (!city) {
      city = suggestion.text
    }

    // Passer l'adresse complète et la ville au parent
    onChange({
      fullAddress: selectedAddress,
      city: city,
      coordinates: suggestion.center // [longitude, latitude]
    })
  }

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && tokenError && query.trim()) {
              e.preventDefault()
              handleManualInput()
            }
          }}
          onBlur={() => {
            // Si token error et qu'on quitte le champ, valider l'adresse manuelle
            if (tokenError && query.trim()) {
              setTimeout(() => handleManualInput(), 200)
            }
          }}
          placeholder={placeholder}
          className={`
            w-full pl-10 pr-10 py-3 border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-primary-500
            ${error ? 'border-red-500' : 'border-gray-300'}
          `}
          required={required}
        />

        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Loader className="h-5 w-5 text-primary-500 animate-spin" />
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id || index}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {suggestion.text}
                  </p>
                  <p className="text-xs text-gray-600">
                    {suggestion.place_name}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Message si pas de résultats */}
      {showSuggestions && !loading && query.length >= 3 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
          {tokenError ? (
            <div className="text-center">
              <p className="text-sm text-amber-600 font-medium mb-2">
                ⚠️ Service de recherche temporairement indisponible
              </p>
              <p className="text-xs text-gray-600 mb-3">
                Veuillez saisir votre adresse manuellement
              </p>
              <button
                type="button"
                onClick={() => {
                  handleManualInput()
                }}
                className="text-xs text-primary-600 hover:text-primary-700 underline"
              >
                Continuer avec cette adresse
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Aucune adresse trouvée pour "{query}"
              </p>
              <p className="text-xs text-gray-500">
                Essayez une autre recherche ou saisissez l'adresse complète
              </p>
            </div>
          )}
        </div>
      )}

      {tokenError ? (
        <p className="mt-1 text-xs text-amber-600">
          ⚠️ Saisie manuelle : Format attendu - Rue Numéro, Code postal Ville
        </p>
      ) : (
        <p className="mt-1 text-xs text-gray-500">
          Format : Rue Numéro, Code postal Ville (Belgique uniquement)
        </p>
      )}
    </div>
  )
}

export default MapboxAutocomplete

import { ChevronLeft, ChevronRight } from 'lucide-react'

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  itemsPerPage = 12,
  totalItems 
}) => {
  const pages = []
  
  // Générer la liste des pages à afficher
  const generatePageNumbers = () => {
    const delta = 2 // Nombre de pages avant et après la page courante
    const range = []
    
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || // Première page
        i === totalPages || // Dernière page
        (i >= currentPage - delta && i <= currentPage + delta) // Pages autour de la page courante
      ) {
        range.push(i)
      }
    }
    
    // Ajouter des "..." si nécessaire
    const rangeWithDots = []
    let prev = 0
    
    for (const i of range) {
      if (i - prev === 2) {
        rangeWithDots.push(prev + 1)
      } else if (i - prev !== 1) {
        rangeWithDots.push('...')
      }
      rangeWithDots.push(i)
      prev = i
    }
    
    return rangeWithDots
  }

  if (totalPages <= 1) return null

  const pageNumbers = generatePageNumbers()
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-b-lg">
      {/* Info mobile */}
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`
            relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium
            ${currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }
          `}
        >
          Précédent
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`
            relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium
            ${currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }
          `}
        >
          Suivant
        </button>
      </div>

      {/* Info desktop */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Affichage de <span className="font-medium">{startItem}</span> à{' '}
            <span className="font-medium">{endItem}</span> sur{' '}
            <span className="font-medium">{totalItems}</span> résultats
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            {/* Bouton Précédent */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`
                relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300
                ${currentPage === 1
                  ? 'cursor-not-allowed bg-gray-50'
                  : 'hover:bg-gray-50 focus:z-20'
                }
              `}
            >
              <span className="sr-only">Précédent</span>
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Numéros de page */}
            {pageNumbers.map((page, index) => {
              if (page === '...') {
                return (
                  <span
                    key={`dots-${index}`}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
                  >
                    ...
                  </span>
                )
              }

              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`
                    relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300
                    ${currentPage === page
                      ? 'z-10 bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                      : 'text-gray-900 hover:bg-gray-50 focus:z-20'
                    }
                  `}
                >
                  {page}
                </button>
              )
            })}

            {/* Bouton Suivant */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`
                relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300
                ${currentPage === totalPages
                  ? 'cursor-not-allowed bg-gray-50'
                  : 'hover:bg-gray-50 focus:z-20'
                }
              `}
            >
              <span className="sr-only">Suivant</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}

export default Pagination

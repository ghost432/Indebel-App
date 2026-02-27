import { useState, useMemo } from 'react'

const usePagination = (items, itemsPerPage = 12) => {
  const [currentPage, setCurrentPage] = useState(1)

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(items.length / itemsPerPage)

  // Obtenir les items de la page courante
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return items.slice(startIndex, endIndex)
  }, [items, currentPage, itemsPerPage])

  // Changer de page
  const goToPage = (page) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(pageNumber)
    // Scroll en haut de la page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Retourner à la page 1 si les items changent
  const resetPage = () => setCurrentPage(1)

  return {
    currentPage,
    totalPages,
    currentItems,
    goToPage,
    resetPage,
    itemsPerPage,
    totalItems: items.length
  }
}

export default usePagination

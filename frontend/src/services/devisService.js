import api from './api'

export const devisService = {
  getAdminDemandes: ({ statut = 'all', page = 1, limit = 12 } = {}) =>
    api.get('/devis/all', { params: { statut, page, limit } }),

  getAdminStats: () => api.get('/devis/stats'),

  getAdminDemande: (id) => api.get(`/devis/${id}`),

  getVisibility: (id) => api.get(`/devis/${id}/visibility`),

  updateAdminStatus: (id, action, data = {}) => api.put(`/devis/${id}/${action}`, data),

  deleteAdminDemande: (id) => api.delete(`/devis/${id}`),

  getDevisValides: ({ page = 1, limit = 9 } = {}) =>
    api.get('/devis/valides', { params: { page, limit } }),

  getPublicDemande: (id) => api.get(`/devis/public/${id}`),

  getPublicDemandeStatus: (id) => api.get(`/devis/public/${id}/status`),

  getDemandesDisponibles: ({ page = 1, limit = 12 } = {}) =>
    api.get('/devis-soumis/disponibles', { params: { page, limit } }),

  getDemandeDisponible: (id) => api.get(`/devis-soumis/demande-disponible/${id}`),

  generateAiDevis: (data) => api.post('/devis-soumis/generate-ai-devis', data),

  suggestPrice: (demande_devis_id) => api.post('/devis-soumis/suggest-price', { demande_devis_id }),

  submitDevis: (data) => api.post('/devis-soumis/soumettre', data),

  getMesDevis: ({ page = 1, limit = 20 } = {}) =>
    api.get('/devis-soumis/mes-devis', { params: { page, limit } }),

  getAdminDevisSoumis: ({ page = 1, limit = 20, statut = '' } = {}) =>
    api.get('/devis-soumis/admin/all', { params: { page, limit, statut } }),

  getForfaitStatus: () => api.get('/forfaits/me/status')
}

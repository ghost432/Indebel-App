import api from './api'

export const forfaitService = {
  // Récupérer tous les forfaits
  getAllForfaits: (type_utilisateur = null) => {
    const params = type_utilisateur ? `?type_utilisateur=${type_utilisateur}` : ''
    return api.get(`/forfaits${params}`)
  },

  // Récupérer un forfait par ID
  getForfaitById: (id) => api.get(`/forfaits/${id}`),

  // Créer un forfait (Admin)
  createForfait: (data) => api.post('/forfaits', data),

  // Mettre à jour un forfait (Admin)
  updateForfait: (id, data) => api.put(`/forfaits/${id}`, data),

  // Supprimer un forfait (Admin)
  deleteForfait: (id) => api.delete(`/forfaits/${id}`),

  // Récupérer le forfait actuel de l'utilisateur connecté
  getMyForfait: () => api.get('/forfaits/me/forfait'),

  // Récupérer les quotas effectifs du forfait connecté
  getMyStatus: () => api.get('/forfaits/me/status'),

  // Changer de forfait
  changeForfait: (forfait_id, user_id = null) => {
    return api.put('/forfaits/me/change', { forfait_id, user_id })
  }
}

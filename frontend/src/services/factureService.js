import api from './api'

export const factureService = {
  getMesFactures: () => api.get('/factures/mes-factures'),
  getAdminFactures: () => api.get('/factures/admin/toutes'),
  getAdminStats: () => api.get('/factures/admin/stats'),
  genererRetroactives: () => api.post('/factures/admin/generer-retroactives'),
  downloadUrl: (id) => `${api.defaults.baseURL}/factures/telecharger/${id}`,
  downloadFacture: (id) => api.get(`/factures/telecharger/${id}`, { responseType: 'blob' }),
  creerCreditNote: (id, payload) => api.post(`/factures/admin/credit-note/${id}`, payload),
  downloadCreditNote: (id) => api.get(`/factures/admin/credit-note/${id}/telecharger`, { responseType: 'blob' }),
  envoyerCreditNoteMail: (id, payload) => api.post(`/factures/admin/credit-note/${id}/email`, payload)
}

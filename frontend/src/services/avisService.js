import api from './api'

export const avisService = {
  listFreelancers: ({ search = '', page = 1, limit = 30 } = {}) =>
    api.get('/avis/freelancers', { params: { search, page, limit } }),
  getFreelancerAvis: (freelancerId, { page = 1, limit = 10 } = {}) =>
    api.get(`/avis/freelancer/${freelancerId}`, { params: { page, limit } }),
  createAvis: (data) => api.post('/avis/create', data),
  getMyAvis: ({ page = 1, limit = 20 } = {}) =>
    api.get('/avis/me', { params: { page, limit } }),
  getAdminAvis: ({ search = '', statut = '', page = 1, limit = 30 } = {}) =>
    api.get('/avis/admin/list', { params: { search, statut, page, limit } }),
  updateAdminAvis: (id, data) => api.put(`/avis/admin/${id}`, data),
  deleteAdminAvis: (id) => api.delete(`/avis/admin/${id}`)
}

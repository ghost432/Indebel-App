import api from './api'

export const supportService = {
  createTicket: (data) => api.post('/support/tickets', data),
  getMyTickets: () => api.get('/support/tickets'),
  getAdminTickets: () => api.get('/support/admin/tickets'),
  getTicket: (id) => api.get(`/support/tickets/${id}`),
  addResponse: (id, data) => api.post(`/support/tickets/${id}/responses`, data),
  getUnreadCount: () => api.get('/support/unread-count'),
  updateAdminStatus: (id, statut) => api.patch(`/support/admin/tickets/${id}/status`, { statut })
}

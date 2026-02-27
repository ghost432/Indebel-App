import api from './api'

export const applicationService = {
  createApplication: (jobId) => api.post('/applications', { job_id: jobId }),
  
  getFreelancerApplications: () => api.get('/applications/my-applications'),
  
  getJobApplications: (jobId) => api.get(`/applications/job/${jobId}`),
  
  updateApplicationStatus: (id, statut) => api.put(`/applications/${id}/status`, { statut }),
  
  rejectApplicationWithReason: (id, motif) => api.put(`/applications/${id}/reject`, { motif }),
  
  getApplicationStats: () => api.get('/applications/stats'),
  
  getApplicationsByPeriod: (period = 'month') => api.get(`/applications/by-period?period=${period}`)
}

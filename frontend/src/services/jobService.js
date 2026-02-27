import api from './api'

export const jobService = {
  getAllJobs: (params) => api.get('/jobs', { params }),

  getJobById: (id) => api.get(`/jobs/${id}`),

  createJob: (jobData) => api.post('/jobs', jobData),

  updateJob: (id, jobData) => api.put(`/jobs/${id}`, jobData),

  deleteJob: (id) => api.delete(`/jobs/${id}`),

  getEmployerJobs: () => api.get('/jobs/employer/my-jobs'),

  getJobStats: () => api.get('/jobs/stats'),

  rejectFreelancerJob: (id) => api.post(`/jobs/admin/freelancer-jobs/${id}/reject`),

  // Nouveaux services pour les missions prestataires (jobs_freelancer)
  getFreelancerMyJobs: () => api.get('/freelancer-jobs/my-jobs'),
  getAllFreelancerJobs: () => api.get('/freelancer-jobs/all'),
  updateFreelancerJobStatus: (id, statut, motif_refus) => api.put(`/freelancer-jobs/${id}/status`, { statut, motif_refus }),
  createFreelancerJobHourly: (data) => api.post('/freelancer-jobs/hourly', data),
  createFreelancerJobFixed: (data) => api.post('/freelancer-jobs/fixed', data),
  closeFreelancerJob: (id) => api.put(`/freelancer-jobs/${id}/close`)
}

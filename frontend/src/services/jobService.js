import api from './api'

export const jobService = {
  getAllJobs: (params) => api.get('/jobs', { params }),
  
  getJobById: (id) => api.get(`/jobs/${id}`),
  
  createJob: (jobData) => api.post('/jobs', jobData),
  
  updateJob: (id, jobData) => api.put(`/jobs/${id}`, jobData),
  
  deleteJob: (id) => api.delete(`/jobs/${id}`),
  
  getEmployerJobs: () => api.get('/jobs/employer/my-jobs'),
  
  getJobStats: () => api.get('/jobs/stats')
}

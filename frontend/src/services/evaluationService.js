import axiosInstance from './axiosConfig'

const API_URL = '/evaluations'

export const evaluationService = {
  // Créer une évaluation
  createEvaluation: (data) => {
    return axiosInstance.post(`${API_URL}/create`, data)
  },

  // Récupérer les évaluations d'un freelancer (public)
  getFreelancerEvaluations: (freelancer_id, page = 1, limit = 10) => {
    return axiosInstance.get(`${API_URL}/freelancer/${freelancer_id}?page=${page}&limit=${limit}`)
  },

  // Récupérer les évaluations données par un employeur
  getEmployerEvaluations: () => {
    return axiosInstance.get(`${API_URL}/employer`)
  },

  // Marquer une mission terminée pour un freelancer avec ou sans évaluation
  terminerMissionFreelancer: (data) => {
    return axiosInstance.post(`${API_URL}/terminer-freelancer`, data)
  }
}

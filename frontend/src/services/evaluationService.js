import axios from 'axios'
import { API_BASE_URL } from '../config'

const API_URL = `${API_BASE_URL}/evaluations`

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return { Authorization: `Bearer ${token}` }
}

export const evaluationService = {
  // Créer une évaluation
  createEvaluation: (data) => {
    return axios.post(`${API_URL}/create`, data, {
      headers: getAuthHeaders()
    })
  },

  // Récupérer les évaluations d'un freelancer (public)
  getFreelancerEvaluations: (freelancer_id, page = 1, limit = 10) => {
    return axios.get(`${API_URL}/freelancer/${freelancer_id}?page=${page}&limit=${limit}`)
  },

  // Récupérer les évaluations données par un employeur
  getEmployerEvaluations: () => {
    return axios.get(`${API_URL}/employer`, {
      headers: getAuthHeaders()
    })
  },

  // Marquer une mission terminée pour un freelancer avec ou sans évaluation
  terminerMissionFreelancer: (data) => {
    return axios.post(`${API_URL}/terminer-freelancer`, data, {
      headers: getAuthHeaders()
    })
  },

  // Récupérer toutes les évaluations (Admin)
  getAdminEvaluations: ({ search = '', limit = 1000 } = {}) => {
    return axios.get(`${API_URL}/admin/list`, {
      params: { search, limit },
      headers: getAuthHeaders()
    })
  },

  // Modifier une évaluation (Admin)
  updateAdminEvaluation: (id, data) => {
    return axios.put(`${API_URL}/admin/${id}`, data, {
      headers: getAuthHeaders()
    })
  },

  // Supprimer une évaluation (Admin)
  deleteAdminEvaluation: (id) => {
    return axios.delete(`${API_URL}/admin/${id}`, {
      headers: getAuthHeaders()
    })
  }
}

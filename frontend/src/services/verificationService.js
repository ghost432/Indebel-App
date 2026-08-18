import axios from 'axios'
import { API_BASE_URL } from '../config'

const API_URL = `${API_BASE_URL}/verification`

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return { Authorization: `Bearer ${token}` }
}

export const verificationService = {
  // Soumettre les documents de vérification (Freelancer)
  submitVerification: (data) => {
    return axios.post(`${API_URL}/submit`, data, {
      headers: getAuthHeaders()
    })
  },

  // Récupérer le statut de vérification (Freelancer)
  getStatus: () => {
    return axios.get(`${API_URL}/status`, {
      headers: getAuthHeaders()
    })
  },

  // Récupérer toutes les demandes (Admin)
  getAllVerifications: (statut = 'all') => {
    return axios.get(`${API_URL}/all?statut=${statut}`, {
      headers: getAuthHeaders()
    })
  },

  // Récupérer une demande spécifique (Admin)
  getVerificationById: (id) => {
    return axios.get(`${API_URL}/${id}`, {
      headers: getAuthHeaders()
    })
  },

  // Valider une vérification (Admin)
  validateVerification: (verification_id) => {
    return axios.put(`${API_URL}/validate/${verification_id}`, {}, {
      headers: getAuthHeaders()
    })
  },

  // Refuser une vérification (Admin)
  rejectVerification: (verification_id, motif_refus) => {
    return axios.put(`${API_URL}/reject/${verification_id}`, { motif_refus }, {
      headers: getAuthHeaders()
    })
  }
}

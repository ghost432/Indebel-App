import axiosInstance from './axiosConfig'

const API_URL = '/verification'

export const verificationService = {
  // Soumettre les documents de vérification (Freelancer)
  submitVerification: (data) => {
    return axiosInstance.post(`${API_URL}/submit`, data)
  },

  // Récupérer le statut de vérification (Freelancer)
  getStatus: () => {
    return axiosInstance.get(`${API_URL}/status`)
  },

  // Récupérer toutes les demandes (Admin)
  getAllVerifications: (statut = 'all') => {
    return axiosInstance.get(`${API_URL}/all?statut=${statut}`)
  },

  // Valider une vérification (Admin)
  validateVerification: (verification_id) => {
    return axiosInstance.put(`${API_URL}/validate/${verification_id}`, {})
  },

  // Refuser une vérification (Admin)
  rejectVerification: (verification_id, motif_refus) => {
    return axiosInstance.put(`${API_URL}/reject/${verification_id}`, { motif_refus })
  }
}

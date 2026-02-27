import axiosInstance from './axiosConfig';

const API_URL = '/demandes'

export const demandeService = {
  // Créer une demande (freelancer postule)
  createDemande: (data) => {
    return axiosInstance.post(`${API_URL}/create`, data)
  },

  // Récupérer les demandes reçues (employer)
  getEmployerDemandes: () => {
    return axiosInstance.get(`${API_URL}/employer`)
  },

  // Récupérer les demandes envoyées (freelancer)
  getFreelancerDemandes: () => {
    return axiosInstance.get(`${API_URL}/freelancer`)
  },

  // Accepter une demande
  accepterDemande: (id) => {
    return axiosInstance.put(`${API_URL}/accepter/${id}`, {})
  },

  // Refuser une demande
  refuserDemande: (id) => {
    return axiosInstance.put(`${API_URL}/refuser/${id}`, {})
  },

  // Terminer une mission
  terminerMission: (data) => {
    return axiosInstance.put(`${API_URL}/terminer`, data)
  },

  // Récupérer le compte de demandes par mission (employer)
  getDemandesCount: () => {
    return axiosInstance.get(`${API_URL}/counts`)
  },

  // Récupérer toutes les demandes (admin uniquement)
  getAllDemandes: () => {
    return axiosInstance.get(`${API_URL}/all`)
  }
}

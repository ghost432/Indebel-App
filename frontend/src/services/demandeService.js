import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/demandes`

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return { Authorization: `Bearer ${token}` }
}

export const demandeService = {
  // Créer une demande (freelancer postule)
  createDemande: (data) => {
    return axios.post(`${API_URL}/create`, data, {
      headers: getAuthHeaders()
    })
  },

  // Récupérer les demandes reçues (employer)
  getEmployerDemandes: () => {
    return axios.get(`${API_URL}/employer`, {
      headers: getAuthHeaders()
    })
  },

  // Récupérer les demandes envoyées (freelancer)
  getFreelancerDemandes: () => {
    return axios.get(`${API_URL}/freelancer`, {
      headers: getAuthHeaders()
    })
  },

  // Accepter une demande
  accepterDemande: (id) => {
    return axios.put(`${API_URL}/accepter/${id}`, {}, {
      headers: getAuthHeaders()
    })
  },

  // Refuser une demande
  refuserDemande: (id) => {
    return axios.put(`${API_URL}/refuser/${id}`, {}, {
      headers: getAuthHeaders()
    })
  },

  // Terminer une mission
  terminerMission: (data) => {
    return axios.put(`${API_URL}/terminer`, data, {
      headers: getAuthHeaders()
    })
  },

  // Récupérer le compte de demandes par mission (employer)
  getDemandesCount: () => {
    return axios.get(`${API_URL}/counts`, {
      headers: getAuthHeaders()
    })
  },

  getAllDemandes: () => {
    return axios.get(`${API_URL}/all`, {
      headers: getAuthHeaders()
    })
  },

  // Générer une candidature via IA
  generateAi: (data) => {
    return axios.post(`${API_URL}/generate-ai`, data, {
      headers: getAuthHeaders()
    })
  }
}

import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/missions`

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return { Authorization: `Bearer ${token}` }
}

export const missionService = {
  // Récupérer toutes les missions (admin)
  getAllMissions: () => {
    return axios.get(`${API_URL}/all`, {
      headers: getAuthHeaders()
    })
  },

  // Récupérer les missions d'un employer
  getEmployerMissions: () => {
    return axios.get(`${API_URL}/employer`, {
      headers: getAuthHeaders()
    })
  },

  // Créer mission forfait horaire
  createMissionHourly: (data) => {
    return axios.post(`${API_URL}/hourly`, data, {
      headers: getAuthHeaders()
    })
  },

  // Créer mission forfait fixe
  createMissionFixed: (data) => {
    return axios.post(`${API_URL}/fixed`, data, {
      headers: getAuthHeaders()
    })
  },

  // Stats missions
  getMissionStats: () => {
    return axios.get(`${API_URL}/stats`, {
      headers: getAuthHeaders()
    })
  },

  // Récupérer les missions disponibles (exclut les ignorées)
  getMissionsDisponibles: () => {
    return axios.get(`${API_URL}/disponibles`, {
      headers: getAuthHeaders()
    })
  },

  getPublicMissions: () => {
    return axios.get(`${API_URL}/publiques`)
  },

  getPublicMission: (mission_id, mission_type, source) => {
    const params = source ? { source } : {}
    return axios.get(`${API_URL}/public/${mission_type}/${mission_id}`, { params })
  },

  ignorerMission: (mission_id, mission_type) => {
    return axios.post(`${API_URL}/ignorer`, 
      { mission_id, mission_type },
      { headers: getAuthHeaders() }
    )
  },

  // Logguer la vue d'une mission
  logView: (mission_id, mission_type, source = 'detail') => {
    return axios.post(`${API_URL}/${mission_id}/view`, 
      { type: mission_type, source },
      { headers: getAuthHeaders() }
    )
  },

  // Supprimer une mission
  deleteMission: (mission_id, mission_type) => {
    return axios.delete(`${API_URL}/${mission_id}?type=${mission_type}`, {
      headers: getAuthHeaders()
    })
  },

  // Changer le statut d'une mission
  updateMissionStatus: (mission_id, mission_type, statut) => {
    return axios.put(`${API_URL}/${mission_id}/status`, 
      { type: mission_type, statut },
      { headers: getAuthHeaders() }
    )
  },

  // Récupérer les données de visibilité d'une mission (admin)
  getVisibility: (mission_id) => {
    return axios.get(`${API_URL}/${mission_id}/visibility`, {
      headers: getAuthHeaders()
    })
  }
}

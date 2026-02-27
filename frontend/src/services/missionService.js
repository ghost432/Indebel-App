import axiosInstance from './axiosConfig';

const API_URL = '/missions'

export const missionService = {
  // Récupérer missions publiques (sans auth)
  getMissionsPubliques: () => {
    return axiosInstance.get(`${API_URL}/publiques`)
  },

  // Récupérer toutes les missions (admin)
  getAllMissions: () => {
    return axiosInstance.get(`${API_URL}/all`)
  },

  // Récupérer les missions d'un employer
  getEmployerMissions: () => {
    return axiosInstance.get(`${API_URL}/employer`)
  },

  // Créer mission forfait horaire
  createMissionHourly: (data) => {
    return axiosInstance.post(`${API_URL}/hourly`, data)
  },

  // Créer mission forfait fixe
  createMissionFixed: (data) => {
    return axiosInstance.post(`${API_URL}/fixed`, data)
  },

  // Stats missions
  getMissionStats: () => {
    return axiosInstance.get(`${API_URL}/stats`)
  },

  // Récupérer les missions disponibles (exclut les ignorées)
  getMissionsDisponibles: () => {
    return axiosInstance.get(`${API_URL}/disponibles`)
  },

  // Ignorer une mission
  ignorerMission: (mission_id, mission_type) => {
    return axiosInstance.post(`${API_URL}/ignorer`, { mission_id, mission_type })
  },

  // Supprimer une mission
  deleteMission: (id, type) => {
    return axiosInstance.delete(`${API_URL}/${id}?type=${type}`)
  },

  // Mettre à jour le statut d'une mission
  updateStatus: (id, statut, type) => {
    return axiosInstance.put(`${API_URL}/${id}/status`, { statut, type })
  }
}

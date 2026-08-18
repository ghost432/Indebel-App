import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/profile-views`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const profileViewService = {
  // Enregistrer une vue de profil
  trackProfileView: async (viewedUserId) => {
    try {
      const headers = getAuthHeader();
      const response = await axios.post(
        `${API_URL}/track`,
        { viewedUserId },
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la vue:', error);
      throw error;
    }
  },

  // Obtenir les statistiques de vues
  getProfileViewStats: async (period = 30) => {
    try {
      const headers = getAuthHeader();
      const response = await axios.get(
        `${API_URL}/stats?period=${period}`,
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des stats:', error);
      throw error;
    }
  },

  // Obtenir les vues détaillées
  getDetailedViews: async (page = 1, limit = 20) => {
    try {
      const headers = getAuthHeader();
      const response = await axios.get(
        `${API_URL}/detailed?page=${page}&limit=${limit}`,
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des vues détaillées:', error);
      throw error;
    }
  }
};

export default profileViewService;

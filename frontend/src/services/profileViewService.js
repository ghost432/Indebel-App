import axiosInstance from './axiosConfig';

const API_URL = '/profile-views';

export const profileViewService = {
  // Enregistrer une vue de profil
  trackProfileView: async (viewedUserId) => {
    try {
      const response = await axiosInstance.post(
        `${API_URL}/track`,
        { viewedUserId }
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
      const response = await axiosInstance.get(
        `${API_URL}/stats?period=${period}`
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
      const response = await axiosInstance.get(
        `${API_URL}/detailed?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des vues détaillées:', error);
      throw error;
    }
  }
};

export default profileViewService;

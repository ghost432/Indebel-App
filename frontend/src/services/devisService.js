import axiosInstance from './axiosConfig';

const API_URL = '/devis';

export const devisService = {
  // Créer une demande de devis (public)
  createDemande: async (data) => {
    const response = await axiosInstance.post(`${API_URL}/create`, data);
    return response.data;
  },

  // Récupérer toutes les demandes (admin)
  getAllDemandes: async (params = {}) => {
    const response = await axiosInstance.get(`${API_URL}/all`, { params });
    return response.data;
  },

  // Récupérer une demande par ID (admin)
  getDemandeById: async (id) => {
    const response = await axiosInstance.get(`${API_URL}/${id}`);
    return response.data;
  },

  // Valider une demande (admin)
  validerDemande: async (id, commentaire = '') => {
    const response = await axiosInstance.put(`${API_URL}/${id}/valider`, { commentaire });
    return response.data;
  },

  // Refuser une demande (admin)
  refuserDemande: async (id, commentaire = '') => {
    const response = await axiosInstance.put(`${API_URL}/${id}/refuser`, { commentaire });
    return response.data;
  },

  // Marquer comme traitée (admin)
  marquerTraitee: async (id) => {
    const response = await axiosInstance.put(`${API_URL}/${id}/traiter`);
    return response.data;
  },

  // Supprimer une demande (admin)
  deleteDemande: async (id) => {
    const response = await axiosInstance.delete(`${API_URL}/${id}`);
    return response.data;
  },

  // Récupérer les catégories de travaux
  getCategories: async () => {
    const response = await axiosInstance.get(`${API_URL}/categories`);
    return response.data;
  },

  // Récupérer les devis publics validés
  getDevisValides: async (page = 1, limit = 20) => {
    const response = await axiosInstance.get(`${API_URL}/valides`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Récupérer les statistiques des devis (admin)
  getDevisStats: async () => {
    const response = await axiosInstance.get(`${API_URL}/stats`);
    return response.data;
  }
};

export default devisService;

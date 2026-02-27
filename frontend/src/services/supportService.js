import axiosInstance from './axiosConfig';

// L'instance axios gère automatiquement le token et les erreurs 401
// Pas besoin de getConfig(), le token est ajouté automatiquement

// Créer un ticket de support
export const createTicket = async (ticketData) => {
  try {
    const response = await axiosInstance.post('/support/tickets', ticketData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Erreur lors de la création du ticket' };
  }
};

// Obtenir les tickets de l'utilisateur
export const getUserTickets = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await axiosInstance.get(`/support/tickets?${params}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Erreur lors de la récupération des tickets' };
  }
};

// Obtenir tous les tickets (admin)
export const getAllTickets = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await axiosInstance.get(`/support/admin/tickets?${params}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Erreur lors de la récupération des tickets' };
  }
};

// Obtenir un ticket spécifique
export const getTicketById = async (ticketId) => {
  try {
    const response = await axiosInstance.get(`/support/tickets/${ticketId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Erreur lors de la récupération du ticket' };
  }
};

// Ajouter une réponse à un ticket
export const addResponse = async (ticketId, message) => {
  try {
    const response = await axiosInstance.post(
      `/support/tickets/${ticketId}/responses`,
      { message }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Erreur lors de l\'ajout de la réponse' };
  }
};

// Mettre à jour le statut d'un ticket (admin)
export const updateTicketStatus = async (ticketId, statut, adminId = null) => {
  try {
    const response = await axiosInstance.patch(
      `/support/admin/tickets/${ticketId}/status`,
      { statut, admin_id: adminId }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Erreur lors de la mise à jour du statut' };
  }
};

// Obtenir les statistiques de support (admin)
export const getSupportStats = async () => {
  try {
    const response = await axiosInstance.get('/support/admin/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Erreur lors de la récupération des statistiques' };
  }
};

// Obtenir le nombre de tickets non lus
export const getUnreadCount = async () => {
  try {
    const response = await axiosInstance.get('/support/unread-count');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Erreur lors de la récupération du compteur' };
  }
};

export default {
  createTicket,
  getUserTickets,
  getAllTickets,
  getTicketById,
  addResponse,
  updateTicketStatus,
  getSupportStats,
  getUnreadCount,
};

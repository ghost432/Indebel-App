import api from './api';

export const messageService = {
  // Récupérer les conversations de l'utilisateur
  getConversations: async () => {
    const response = await api.get('/messages/conversations');
    return response.data;
  },

  // Récupérer les messages d'une conversation
  getMessages: async (conversationId) => {
    const response = await api.get(`/messages/conversations/${conversationId}`);
    return response.data;
  },

  // Envoyer un message
  sendMessage: async ({ conversationId, content }) => {
    const response = await api.post(
      `/messages/conversations/${conversationId}/messages`,
      { content }
    );
    return response.data;
  },

  // Créer une nouvelle conversation
  createConversation: async ({ recipientId, recipientType }) => {
    const response = await api.post(
      '/messages/conversations',
      { recipientId, recipientType }
    );
    return response.data;
  },

  // Marquer les messages comme lus
  markAsRead: async (conversationId) => {
    await api.put(`/messages/conversations/${conversationId}/read`, {});
  },

  // Récupérer les informations d'un utilisateur
  getUserInfo: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  }
};

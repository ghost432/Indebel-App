import api from './api'

export const userService = {
  getAllUsers: (params = {}) => {
    // Pour l'admin: récupérer TOUS les utilisateurs sans filtre
    if (Object.keys(params).length === 0) {
      return api.get('/users/all');
    }
    // Sinon appliquer les filtres
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/users/all?${queryParams}`);
  },
  
  getFreelancers: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/users?role=freelancer&${queryParams}`);
  },
  
  getEmployers: (params = {}) => {
    const defaultParams = { verifiedOnly: true };
    const queryParams = new URLSearchParams({ ...defaultParams, ...params }).toString();
    return api.get(`/users?role=employer&${queryParams}`);
  },
  
  getUserById: (id) => api.get(`/users/${id}`),
  
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  
  deleteUser: (id) => api.delete(`/users/${id}`),
  
  getUserStats: () => api.get('/users/stats'),
  
  getUserStatsByCity: () => api.get('/users/stats/by-city'),
  
  changePassword: (passwordData) => api.put('/users/change-password', passwordData),
  
  getPublicProfile: async (id) => {
    try {
      const response = await api.get(`/users/public-profile/${id}`);
      return response;
    } catch (error) {
      console.error('Error in getPublicProfile:', error);
      // Return the error response if available, or rethrow the error
      if (error.response) {
        return error.response;
      }
      throw error;
    }
  }
}

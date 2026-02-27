import axiosInstance from './axiosConfig';

const devisSoumisService = {
  // Récupérer les demandes disponibles (freelancer)
  getDemandesDisponibles: async () => {
    try {
      const response = await axiosInstance.get('/devis-soumis/disponibles');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération demandes disponibles:', error);
      throw error;
    }
  },

  // Soumettre un devis (freelancer)
  soumettreDevis: async (devisData) => {
    try {
      const response = await axiosInstance.post('/devis-soumis/soumettre', devisData);
      return response.data;
    } catch (error) {
      console.error('Erreur soumission devis:', error);
      throw error;
    }
  },

  // Récupérer mes devis soumis (freelancer)
  getMesDevisSoumis: async () => {
    try {
      const response = await axiosInstance.get('/devis-soumis/mes-devis');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération mes devis:', error);
      throw error;
    }
  },

  // Récupérer les devis pour une demande (admin)
  getDevisPourDemande: async (demandeId) => {
    try {
      const response = await axiosInstance.get(`/devis-soumis/demande/${demandeId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur récupération devis demande:', error);
      throw error;
    }
  },

  notifierFreelancers: async (demandeId) => {
    try {
      const response = await axiosInstance.post(`/devis-soumis/notifier/${demandeId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur notification freelancers:', error);
      throw error;
    }
  },

  // Récupérer les détails d'une demande (freelancer)
  getDemandeDetails: async (demandeId) => {
    try {
      const response = await axiosInstance.get(`/devis-soumis/demande-disponible/${demandeId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur récupération détails demande:', error);
      throw error;
    }
  }
};

export default devisSoumisService;

import axios from './axiosConfig';

const factureService = {
  // Récupérer mes factures
  getMesFactures: async () => {
    const response = await axios.get('/factures/mes-factures');
    return response.data;
  },

  // Récupérer toutes les factures (Admin)
  getToutesFactures: async () => {
    const response = await axios.get('/factures/admin/toutes');
    return response.data;
  },

  // Télécharger une facture
  telechargerFacture: async (factureId) => {
    const response = await axios.get(`/factures/telecharger/${factureId}`, {
      responseType: 'blob'
    });
    
    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `facture-${factureId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return response.data;
  },

  // Générer les factures rétroactives (Admin)
  genererFacturesRetroactives: async () => {
    const response = await axios.post('/factures/admin/generer-retroactives');
    return response.data;
  },

  // Obtenir les statistiques (Admin)
  getStats: async () => {
    const response = await axios.get('/factures/admin/stats');
    return response.data;
  }
};

export default factureService;

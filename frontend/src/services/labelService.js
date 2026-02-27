import axiosInstance from './axiosConfig';

// Vérifier les critères pour le label
export const verifierCriteres = async (userId = null) => {
  try {
    const url = userId ? `/label/verifier-criteres/${userId}` : '/label/verifier-criteres';
    const response = await axiosInstance.post(url);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Erreur lors de la vérification des critères' };
  }
};

// Obtenir le statut du label
export const getStatutLabel = async (userId = null) => {
  try {
    const url = userId ? `/label/statut/${userId}` : '/label/statut';
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Erreur lors de la récupération du statut' };
  }
};

// Obtenir la demande en attente
export const getDemandeEnAttente = async () => {
  try {
    const response = await axiosInstance.get('/label/demande-en-attente');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Erreur lors de la récupération de la demande' };
  }
};

// Demander le label
export const demanderLabel = async (userId = null, demandeParAdmin = false) => {
  try {
    const response = await axiosInstance.post('/label/demander', {
      userId,
      demandeParAdmin
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Erreur lors de la demande de label' };
  }
};

// Répondre à une demande de label
export const repondreLabel = async (labelId, accepte) => {
  try {
    const response = await axiosInstance.post('/label/repondre', {
      labelId,
      accepte
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Erreur lors de la réponse au label' };
  }
};

// Lister tous les utilisateurs avec label (admin)
export const getUsersAvecLabel = async (statut = null) => {
  try {
    const params = statut ? `?statut=${statut}` : '';
    const response = await axiosInstance.get(`/label/admin/liste${params}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Erreur lors de la récupération des utilisateurs' };
  }
};

// Révoquer un label (admin)
export const revoquerLabel = async (labelId, raison) => {
  try {
    const response = await axiosInstance.delete(`/label/admin/revoquer/${labelId}`, {
      data: { raison }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Erreur lors de la révocation du label' };
  }
};

// Télécharger l'image du label
export const downloadLabelImage = async () => {
  try {
    const response = await axiosInstance.get('/label/download-image', {
      responseType: 'blob'
    });
    
    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'label-indebel.svg');
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return { success: true, message: 'Image téléchargée avec succès' };
  } catch (error) {
    throw error.response?.data || { message: 'Erreur lors du téléchargement' };
  }
};

export default {
  verifierCriteres,
  getStatutLabel,
  getDemandeEnAttente,
  demanderLabel,
  repondreLabel,
  getUsersAvecLabel,
  revoquerLabel,
  downloadLabelImage
};

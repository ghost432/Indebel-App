/**
 * Service pour gérer l'intégration Stripe
 */
import api from './api';

export const stripeService = {
  /**
   * Récupère la configuration publique Stripe depuis le backend
   * @returns {Promise} Configuration Stripe
   */
  getConfig: async () => {
    try {
      const response = await api.get('/paiement/config');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération config Stripe:', error);
      throw error;
    }
  },

  /**
   * Récupère la clé publique Stripe
   * @returns {Promise<string|null>} Clé publique ou null
   */
  getPublishableKey: async () => {
    try {
      const config = await stripeService.getConfig();
      return config.data?.publishableKey || null;
    } catch (error) {
      console.error('Erreur récupération clé publique:', error);
      return null;
    }
  },

  /**
   * Vérifie si Stripe est configuré
   * @returns {Promise<boolean>}
   */
  isConfigured: async () => {
    try {
      const config = await stripeService.getConfig();
      return config.data?.isConfigured || false;
    } catch (error) {
      return false;
    }
  },

  /**
   * Vérifie si on est en mode production
   * @returns {Promise<boolean>}
   */
  isProdMode: async () => {
    try {
      const config = await stripeService.getConfig();
      return config.data?.isProdMode || false;
    } catch (error) {
      return false;
    }
  }
};

export default stripeService;

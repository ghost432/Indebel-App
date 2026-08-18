import api from './api'

export const paiementService = {
  // Créer une session de paiement Stripe
  createCheckoutSession: (forfait_id) => {
    return api.post('/paiements/create-checkout-session', { forfait_id })
  },

  // Vérifier le statut d'une session de paiement
  checkSessionStatus: (session_id) => {
    return api.get(`/paiements/session/${session_id}`)
  }
}

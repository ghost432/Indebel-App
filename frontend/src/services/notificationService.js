import api from './api'

export const notificationService = {
  // Récupérer les notifications de l'utilisateur
  getUserNotifications: (limit = 50, offset = 0) => 
    api.get(`/notifications?limit=${limit}&offset=${offset}`),
  
  // Marquer une notification comme lue
  markAsRead: (notificationId) => 
    api.put(`/notifications/${notificationId}/read`),
  
  // Marquer toutes les notifications comme lues
  markAllAsRead: () => 
    api.put('/notifications/read-all'),
  
  // Supprimer une notification
  deleteNotification: (notificationId) => 
    api.delete(`/notifications/${notificationId}`),
  
  // Notifier qu'une mission a été ignorée (appel backend)
  notifyMissionIgnored: (missionId, missionTitre) => 
    api.post('/notifications/mission-ignored', { missionId, missionTitre })
}

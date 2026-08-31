const axios = require('axios');
const db = require('../config/database');

/**
 * Envoie une notification Push Expo à un utilisateur donné ou à une liste d'utilisateurs
 * @param {number|number[]} userIds - ID de l'utilisateur ou tableau d'IDs
 * @param {string} title - Titre de la notification
 * @param {string} body - Contenu du message
 * @param {object} [data] - Données supplémentaires (ex: { lien: '/support' })
 */
async function sendPushNotification(userIds, title, body, data = {}) {
  try {
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    if (ids.length === 0) return;

    // Récupérer les push_tokens des utilisateurs
    const [rows] = await db.query(
      `SELECT id, push_token FROM users WHERE id IN (?) AND push_token IS NOT NULL AND push_token != ''`,
      [ids]
    );

    if (rows.length === 0) return;

    const messages = rows.map(user => ({
      to: user.push_token,
      sound: 'default',
      title: title,
      body: body,
      data: { ...data, userId: user.id },
      priority: 'high',
    }));

    // Envoi via l'API officielle Expo Push Server
    await axios.post('https://exp.host/--/api/v2/push/send', messages, {
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });

    console.log(`[PushNotif] Notification push envoyée à ${rows.length} utilisateur(s)`);
  } catch (error) {
    console.error('[PushNotif] Erreur envoi push:', error.response?.data || error.message);
  }
}

module.exports = {
  sendPushNotification,
};

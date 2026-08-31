const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

// Routes utilisateurs
router.get('/', authenticate, notificationController.getUserNotifications);
router.put('/:id/read', authenticate, notificationController.markAsRead);
router.put('/read-all', authenticate, notificationController.markAllAsRead);
router.delete('/:id', authenticate, notificationController.deleteNotification);
router.post('/mission-ignored', authenticate, notificationController.notifyMissionIgnored);
router.post('/push-token', authenticate, notificationController.savePushToken);

// Routes admin
router.post('/send-to-all', authenticate, notificationController.sendNotificationToAll);
router.post('/send-to-users', authenticate, notificationController.sendNotificationToUsers);
router.post('/send-newsletter', authenticate, notificationController.sendNewsletter);
router.get('/newsletters', authenticate, notificationController.getNewsletters);
router.get('/history', authenticate, notificationController.getNotificationHistory);
router.get('/platform', authenticate, notificationController.getAllPlatformNotifications);

module.exports = router;

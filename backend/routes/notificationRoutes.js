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

// Routes admin
router.post('/send-to-all', authenticate, notificationController.sendNotificationToAll);
router.post('/send-to-users', authenticate, notificationController.sendNotificationToUsers);
router.get('/history', authenticate, notificationController.getNotificationHistory);
router.get('/platform', authenticate, notificationController.getAllPlatformNotifications);

module.exports = router;

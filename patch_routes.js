const fs = require('fs');
const file = 'backend/routes/notificationRoutes.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace("router.post('/send-to-users', authenticate, notificationController.sendNotificationToUsers);", "router.post('/send-to-users', authenticate, notificationController.sendNotificationToUsers);\nrouter.post('/send-newsletter', authenticate, notificationController.sendNewsletter);");
fs.writeFileSync(file, content);
console.log('notificationRoutes.js patched');

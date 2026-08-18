const fs = require('fs');
const file = 'frontend/src/components/AdminSidebar.jsx';
let content = fs.readFileSync(file, 'utf8');

const oldSubItems = `      subItems: [
        { icon: Bell, label: 'Mes notifications', path: '/admin/notifications' },
        { icon: Plus, label: 'Envoyer une notification', path: '/admin/send-notification' }
      ]`;
const newSubItems = `      subItems: [
        { icon: Bell, label: 'Mes notifications', path: '/admin/notifications' },
        { icon: Plus, label: 'Envoyer une notification', path: '/admin/send-notification' },
        { icon: Send, label: 'Newsletter', path: '/admin/newsletter' }
      ]`;

content = content.replace(oldSubItems, newSubItems);
fs.writeFileSync(file, content);
console.log('AdminSidebar.jsx patched for Newsletter');

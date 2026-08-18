const fs = require('fs');
const file = 'frontend/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add import
if (!content.includes('AdminNewsletter')) {
  content = content.replace("import AdminSendNotification from './pages/AdminSendNotification'", "import AdminSendNotification from './pages/AdminSendNotification'\nimport AdminNewsletter from './pages/AdminNewsletter'");
  
  // 2. Add route
  const routeInsertion = `<Route path="send-notification" element={<AdminSendNotification />} />
          <Route path="newsletter" element={<AdminNewsletter />} />`;
  content = content.replace(/<Route path="send-notification" element={<AdminSendNotification \/>} \/>/, routeInsertion);
  
  fs.writeFileSync(file, content);
  console.log('App.jsx patched for AdminNewsletter');
}

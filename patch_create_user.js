const fs = require('fs');
const file = 'frontend/src/pages/AdminCreateUser.jsx';
let content = fs.readFileSync(file, 'utf8');

// Add import useAuth
content = content.replace("import { UserPlus, Mail, Lock, User, Building2, Phone, MapPin, Briefcase, Globe } from 'lucide-react'", "import { UserPlus, Mail, Lock, User, Building2, Phone, MapPin, Briefcase, Globe } from 'lucide-react'\nimport { useAuth } from '../context/AuthContext'");

const hookInjection = `const AdminCreateUser = () => {
  const { user: currentUser } = useAuth()
  
  let allowedRoles = ['freelancer', 'employer'];
  if (currentUser?.email !== 'noreply@indebel.be' && currentUser?.admin_permissions) {
    try {
      const perms = typeof currentUser.admin_permissions === 'string' ? JSON.parse(currentUser.admin_permissions) : currentUser.admin_permissions;
      allowedRoles = perms.roles || [];
    } catch(e) {}
  }
`;
content = content.replace('const AdminCreateUser = () => {', hookInjection);

// Only render buttons if allowed
const freelancerBtn = `<button
            type="button"
            onClick={() => handleRoleChange('freelancer')}
            className={\`group relative p-6 rounded-2xl transition-all duration-200 border-2 text-left \${`;
content = content.replace(freelancerBtn, `{allowedRoles.includes('freelancer') && (` + freelancerBtn);

const employerBtn = `<button
            type="button"
            onClick={() => handleRoleChange('employer')}
            className={\`group relative p-6 rounded-2xl transition-all duration-200 border-2 text-left \${`;
// Need to find the end of the freelancer button to add `)}`
content = content.replace(/<\/button>\s*<button\s*type="button"\s*onClick=\{\(\) => handleRoleChange\('employer'\)\}/g, `</button>)}\n\n          {allowedRoles.includes('employer') && (<button\n            type="button"\n            onClick={() => handleRoleChange('employer')}`);

// Do the same for Admin role button, but admin role is not even valid in register endpoint, so we can hide it for everyone, or only show it if superadmin
content = content.replace(/<\/button>\s*<button\s*type="button"\s*onClick=\{\(\) => handleRoleChange\('admin'\)\}/g, `</button>)}\n\n          {currentUser?.email === 'noreply@indebel.be' && (<button\n            type="button"\n            onClick={() => handleRoleChange('admin')}`);
content = content.replace(/<\/button>\s*<\/div>\s*<\/div>\s*\{\/\* Formulaire/g, `</button>)}\n        </div>\n      </div>\n\n      {/* Formulaire`);

fs.writeFileSync(file, content);
console.log('AdminCreateUser.jsx patched successfully');

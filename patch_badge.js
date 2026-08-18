const fs = require('fs');
const file = 'frontend/src/pages/AdminUsers.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/getRoleBadge\(user\.role\)/g, 'getRoleBadge(user)');
content = content.replace(/getRoleBadge\(selectedUser\?\.role\)/g, 'getRoleBadge(selectedUser)');

const newGetRoleBadge = `  const getRoleBadge = (user) => {
    if (!user) return null;
    const role = user.role;
    if (role === 'admin') {
      if (user.email === 'noreply@indebel.be') {
        return <Badge variant="danger">Super Admin</Badge>;
      }
      return <Badge variant="warning">Sous-Admin</Badge>;
    }
    const variants = { employer: 'info', freelancer: 'success' };
    const labels = { employer: 'Recruteur', freelancer: 'Prestataire' };
    return <Badge variant={variants[role] || 'secondary'}>{labels[role] || role}</Badge>;
  }`;

content = content.replace(/  const getRoleBadge = \(role\) => \{[\s\S]*?return <Badge variant=\{variants\[role\]\}>\{labels\[role\]\}<\/Badge>\n  \}/, newGetRoleBadge);

fs.writeFileSync(file, content);
console.log('AdminUsers badge patched');

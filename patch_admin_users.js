const fs = require('fs');
const file = 'frontend/src/pages/AdminUsers.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Change password field to text so the admin can see it
content = content.replace(
  /label="Mot de passe provisoire"[\s\S]*?type="password"[\s\S]*?value=\{subAdminData\.mot_de_passe\}/,
  'label="Mot de passe provisoire"\n            type="text"\n            value={subAdminData.mot_de_passe}'
);

// 2. Add "Sous-Admin" badge in the table
const roleBadge = `                      {user.role === 'admin' ? (
                        user.email === 'noreply@indebel.be' ? (
                          <Badge variant="danger">Super Admin</Badge>
                        ) : (
                          <Badge variant="warning">Sous-Admin</Badge>
                        )
                      ) : (
                        <Badge variant={
                          user.role === 'employer' ? 'primary' : 
                          user.role === 'freelancer' ? 'success' : 'secondary'
                        }>
                          {user.role === 'employer' ? 'Recruteur' : 
                           user.role === 'freelancer' ? 'Prestataire' : user.role}
                        </Badge>
                      )}
`;
// We need to replace the original role badge. Let's find it.
// It usually looks like: <Badge variant={user.role === 'admin' ? 'danger' : ...
const oldBadgeRegex = /<Badge variant=\{[\s\S]*?user\.role === 'admin' \? 'danger'[\s\S]*?<\/Badge>/;
if (oldBadgeRegex.test(content)) {
  content = content.replace(oldBadgeRegex, roleBadge.trim());
}

fs.writeFileSync(file, content);
console.log('AdminUsers.jsx updated');

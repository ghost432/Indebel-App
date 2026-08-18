const fs = require('fs');

// Patch factureController.js
let factFile = 'backend/controllers/factureController.js';
let factContent = fs.readFileSync(factFile, 'utf8');

const factFilter = `
    if (req.user && req.user.role === 'admin' && req.user.email !== 'noreply@indebel.be') {
      query += ' AND u.created_by = ?';
      countQuery += ' AND u.created_by = ?';
      params.push(req.user.id);
      countParams.push(req.user.id);
    }
    // ORDER BY MUST COME AFTER THIS
`;
// We need to inject this before ORDER BY.
factContent = factContent.replace(
  /(\/\/ Grouper par facture_id\n    query \+= ' GROUP BY f\.id';)/,
  `$1\n    if (req.user && req.user.role === 'admin' && req.user.email !== 'noreply@indebel.be') {\n      query += ' HAVING employer_id IN (SELECT id FROM users WHERE created_by = ?)';\n      countQuery += ' AND f.user_id IN (SELECT id FROM users WHERE created_by = ?)';\n      params.push(req.user.id);\n      countParams.push(req.user.id);\n    }`
);
fs.writeFileSync(factFile, factContent);

// Patch devisController.js
let devisFile = 'backend/controllers/devisController.js';
let devisContent = fs.readFileSync(devisFile, 'utf8');

devisContent = devisContent.replace(
  /(\/\/ Filtre de recherche\n    if \(search\) \{)/,
  `if (req.user && req.user.role === 'admin' && req.user.email !== 'noreply@indebel.be') {\n      query += ' AND (d.freelancer_id IN (SELECT id FROM users WHERE created_by = ?) OR d.employer_id IN (SELECT id FROM users WHERE created_by = ?))';\n      countQuery += ' AND (d.freelancer_id IN (SELECT id FROM users WHERE created_by = ?) OR d.employer_id IN (SELECT id FROM users WHERE created_by = ?))';\n      params.push(req.user.id, req.user.id);\n      countParams.push(req.user.id, req.user.id);\n    }\n\n    $1`
);
fs.writeFileSync(devisFile, devisContent);

console.log('Controllers patched for subadmin filtering');

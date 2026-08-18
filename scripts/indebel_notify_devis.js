const db = require('/var/www/vhosts/indebel.be/pro.indebel.be/api/config/database');
const { sendEmail } = require('/var/www/vhosts/indebel.be/pro.indebel.be/api/config/email');

const ids = process.argv.slice(2).map(Number).filter(Boolean);

const normalize = value => String(value || '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const parseList = value => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value).split(',').map(item => item.trim()).filter(Boolean);
  }
};

async function notifyDemande(id) {
  const [rows] = await db.query('SELECT * FROM demandes_devis WHERE id = ?', [id]);
  if (!rows.length) return { id, found: false };

  const demande = rows[0];
  if (!['valide', 'devis_complet'].includes(demande.statut)) {
    await db.query('UPDATE demandes_devis SET statut = "valide", date_validation = NOW() WHERE id = ?', [id]);
    demande.statut = 'valide';
  }

  const demandeSecteurs = [demande.type_travaux, demande.categorie].filter(Boolean).map(normalize);
  const [freelancers] = await db.query(`
    SELECT DISTINCT id, nom, prenom, email, telephone, secteur
    FROM users
    WHERE role = 'freelancer'
      AND secteur IS NOT NULL
  `);

  const matched = freelancers.filter(f => {
    const secteurs = [f.secteur, ...parseList(f.secteur)].map(normalize);
    return demandeSecteurs.some(secteur => secteurs.includes(secteur));
  });

  if (matched.length) {
    await db.query(
      'INSERT IGNORE INTO devis_notifications (demande_devis_id, freelancer_id) VALUES ?',
      [matched.map(f => [id, f.id])]
    );
  }

  let emailSent = 0;
  for (const freelancer of matched) {
    try {
      await sendEmail({
        to: freelancer.email,
        subject: `Nouvelle demande de devis #${id} - ${demande.type_travaux}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111827;">
            <h2>Bonjour ${freelancer.prenom || ''} ${freelancer.nom || ''},</h2>
            <p>Une demande de devis correspond à votre secteur d'activité.</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin:20px 0;">
              <h3 style="margin-top:0;">Demande #${id} - ${demande.type_travaux}</h3>
              <p><strong>Secteur:</strong> ${demande.categorie || demande.type_travaux || 'Non spécifié'}</p>
              <p><strong>Localisation:</strong> ${demande.ville || ''}, ${demande.region || ''}</p>
              <p><strong>Priorité:</strong> ${demande.urgence || 'normal'}</p>
              <p><strong>Date début souhaitée:</strong> ${demande.date_souhaite || 'Non spécifiée'}</p>
            </div>
            <p><strong>Description:</strong></p>
            <p style="white-space:pre-wrap;">${demande.description || ''}</p>
            <p style="margin-top:24px;">
              <a href="${process.env.FRONTEND_URL || 'https://pro.indebel.be'}/freelancer/devis-disponibles"
                 style="background:#044CF3;color:white;padding:12px 22px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:700;">
                Voir et répondre à la demande
              </a>
            </p>
          </div>
        `
      });
      emailSent++;
    } catch (error) {
      console.error(`email_failed demande=${id} freelancer=${freelancer.id} ${freelancer.email}:`, error.message);
    }
  }

  const [notifCount] = await db.query('SELECT COUNT(*) as total FROM devis_notifications WHERE demande_devis_id = ?', [id]);
  const [devisCount] = await db.query('SELECT COUNT(*) as total FROM devis_soumis WHERE demande_devis_id = ?', [id]);
  return {
    id,
    found: true,
    title: demande.type_travaux,
    sector: demande.categorie,
    statut: demande.statut,
    matched: matched.length,
    notificationsTotal: notifCount[0].total,
    devisTotal: devisCount[0].total,
    emailSent
  };
}

(async () => {
  const results = [];
  for (const id of ids) results.push(await notifyDemande(id));
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
})().catch(error => {
  console.error(error);
  process.exit(1);
});

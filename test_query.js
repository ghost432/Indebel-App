const db = require('./backend/config/database');
async function test() {
  try {
    const query = `
      SELECT 
        u.id, u.prenom, u.nom, u.email, u.role, u.date_creation, u.last_login,
        u.denomination, u.numero_bce, u.adresse, u.secteur,
        u.description_entreprise, u.site_web, u.taille_entreprise,
        u.poste, u.competences, u.competences_recherchees,
        u.pays_code, u.indicatif, u.telephone, u.langues_parlees,
        u.a_propos, u.genre, u.tranche_age, u.disponibilite_debut, u.disponibilite_fin,
        u.experience, u.tarif_journalier, u.disponibilite, u.portfolio_url,
        u.statut_verification, u.forfait_id, u.forfait_date_expiration, u.forfait_date_debut, u.photo_profil, u.image_couverture,
        u.facebook, u.instagram, u.nom_partenariat, u.created_by,
        COALESCE(
          (SELECT statut FROM verifications_identite 
           WHERE freelancer_id = u.id 
           ORDER BY date_soumission DESC 
           LIMIT 1),
          'non_verifie'
        ) as verification_identite_status,
        f.nom AS forfait_nom, f.couleur_badge AS forfait_couleur, f.badge_premium AS forfait_badge_premium,
        u.created_by, u.admin_permissions, u.nom_partenariat
      FROM users u
      LEFT JOIN forfaits f ON u.forfait_id = f.id
      WHERE 1=1
      ORDER BY u.date_creation DESC
    `;
    const [rows] = await db.query(query, []);
    console.log("SUCCESS. Row count:", rows.length);
    process.exit(0);
  } catch(e) {
    console.error("ERROR:", e);
    process.exit(1);
  }
}
test();

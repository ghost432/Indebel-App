const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Get all users (admin, employer, or freelancer for employers list)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, verifiedOnly } = req.query;

    let query = `
      SELECT 
        u.id, u.prenom, u.nom, u.email, u.role, u.date_creation, u.last_login,
        u.denomination, u.numero_bce, u.adresse, u.secteur,
        u.description_entreprise, u.site_web, u.taille_entreprise,
        u.poste, u.competences, u.competences_recherchees,
        u.pays_code, u.indicatif, u.telephone, u.langues_parlees,
        u.a_propos, u.genre, u.tranche_age, u.disponibilite_debut, u.disponibilite_fin,
        u.experience, u.tarif_journalier, u.disponibilite, u.portfolio_url,
        u.statut_verification, u.forfait_id, u.photo_profil, u.image_couverture,
        u.facebook, u.instagram,
        COALESCE(
          (SELECT statut FROM verifications_identite 
           WHERE freelancer_id = u.id 
           ORDER BY date_soumission DESC 
           LIMIT 1),
          'non_verifie'
        ) as verification_identite_status,
        f.nom AS forfait_nom, f.couleur_badge AS forfait_couleur
      FROM users u
      LEFT JOIN forfaits f ON u.forfait_id = f.id
      WHERE 1=1
    `;

    const params = [];

    // Filtrer par rôle si spécifié
    if (role) {
      query += ' AND u.role = ?';
      params.push(role);
    }

    // Filtrer les utilisateurs vérifiés uniquement si demandé
    if (verifiedOnly === 'true') {
      query += ' AND u.statut_verification = ?';
      params.push('verifie');
    }

    // Exclure les champs sensibles pour les non-admins
    if (req.user.role !== 'admin') {
      query = query.replace('u.email,', '');
      query = query.replace('u.telephone,', '');
      query = query.replace('u.pays_code, u.indicatif,', '');
      // Garder statut_verification car c'est une info publique
    }

    // Trier par date de création décroissante
    query += ' ORDER BY u.date_creation DESC';

    console.log('Requête SQL:', query);
    console.log('Paramètres:', params);

    const [users] = await db.query(query, params);

    // Formater la réponse
    const formattedUsers = users.map(user => {
      // Nettoyer les données sensibles pour les non-admins
      if (req.user.role !== 'admin') {
        delete user.email;
        delete user.telephone;
        delete user.pays_code;
        delete user.indicatif;
      }

      // Convertir les champs JSON en objets
      if (user.competences && typeof user.competences === 'string') {
        try {
          user.competences = JSON.parse(user.competences);
        } catch (e) {
          console.error('Erreur lors du parsing des compétences:', e);
          user.competences = [];
        }
      }

      if (user.competences_recherchees && typeof user.competences_recherchees === 'string') {
        try {
          user.competences_recherchees = JSON.parse(user.competences_recherchees);
        } catch (e) {
          console.error('Erreur lors du parsing des compétences recherchées:', e);
          user.competences_recherchees = [];
        }
      }

      if (user.langues_parlees && typeof user.langues_parlees === 'string') {
        try {
          user.langues_parlees = JSON.parse(user.langues_parlees);
        } catch (e) {
          console.error('Erreur lors du parsing des langues parlées:', e);
          user.langues_parlees = [];
        }
      }

      return user;
    });

    res.json({
      success: true,
      data: formattedUsers,
      count: formattedUsers.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    next(error);
  }
};

// Get user by ID
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const user = users[0];
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// Update user
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { facebook, instagram, reseaux_sociaux, ...otherFields } = req.body;
    const fields = [];
    const values = [];

    // Mapping des champs frontend vers colonnes BDD
    const fieldMapping = {
      'description_recruteur': 'description_entreprise',
      'taille_recruteur': 'taille_entreprise'
    };

    // Appliquer le mapping
    for (const [frontendKey, dbKey] of Object.entries(fieldMapping)) {
      if (otherFields[frontendKey] !== undefined) {
        otherFields[dbKey] = otherFields[frontendKey];
        delete otherFields[frontendKey];
      }
    }

    // Gérer les réseaux sociaux individuels (ancienne méthode)
    if (facebook !== undefined) {
      fields.push('facebook = ?');
      values.push(facebook);
    }
    if (instagram !== undefined) {
      fields.push('instagram = ?');
      values.push(instagram);
    }

    // Gérer l'objet reseaux_sociaux (nouvelle méthode)
    if (reseaux_sociaux !== undefined) {
      // Extraire les valeurs individuelles de l'objet reseaux_sociaux
      if (typeof reseaux_sociaux === 'object' && reseaux_sociaux !== null) {
        if (reseaux_sociaux.linkedin !== undefined) {
          fields.push('linkedin = ?');
          values.push(reseaux_sociaux.linkedin || null);
        }
        if (reseaux_sociaux.twitter !== undefined) {
          fields.push('twitter = ?');
          values.push(reseaux_sociaux.twitter || null);
        }
        if (reseaux_sociaux.facebook !== undefined) {
          fields.push('facebook = ?');
          values.push(reseaux_sociaux.facebook || null);
        }
        if (reseaux_sociaux.instagram !== undefined) {
          fields.push('instagram = ?');
          values.push(reseaux_sociaux.instagram || null);
        }
      }
    }

    for (const [key, value] of Object.entries(otherFields)) {
      // Skip undefined values
      if (value === undefined) {
        continue;
      }

      // Permettre les valeurs null pour certains champs
      const allowNull = ['site_web', 'portfolio_url', 'description_entreprise', 'a_propos', 'annee_creation', 'email_contact'];
      if (value === null && !allowNull.includes(key)) {
        continue;
      }

      // Handle JSON fields
      if (key === 'langues_parlees' || key === 'competences' || key === 'competences_recherchees') {
        if (typeof value === 'string') {
          // Si c'est déjà une string JSON, l'utiliser directement
          fields.push(`${key} = ?`);
          values.push(value);
        } else if (Array.isArray(value) || typeof value === 'object') {
          // Si c'est un array ou object, le convertir en JSON
          fields.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
      // Handle numeric fields - convert empty strings to null
      else if (key === 'tarif_journalier' || key === 'experience' || key === 'annee_creation' || key === 'taille_entreprise') {
        if (value === '' || value === null || value === undefined) {
          fields.push(`${key} = ?`);
          values.push(null);
        } else {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
      // Handle date fields - convert ISO date to MySQL DATE format (YYYY-MM-DD)
      else if (key === 'disponibilite_debut' || key === 'disponibilite_fin' || key === 'date_debut' || key === 'date_fin') {
        if (value === '' || value === null || value === undefined) {
          fields.push(`${key} = ?`);
          values.push(null);
        } else {
          // Convert ISO date string to YYYY-MM-DD format
          const date = new Date(value);
          const formattedDate = date.toISOString().split('T')[0]; // Get only YYYY-MM-DD part
          fields.push(`${key} = ?`);
          values.push(formattedDate);
        }
      }
      else {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;

    console.log('Update SQL:', sql);
    console.log('Update values:', values);

    const [result] = await db.query(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    next(error);
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const [existingUser] = await db.query('SELECT id FROM users WHERE id = ?', [id]);

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Delete user
    await db.query('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
};

// Get user statistics (admin only)
exports.getUserStats = async (req, res, next) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'freelancer' THEN 1 ELSE 0 END) as total_freelancers,
        SUM(CASE WHEN role = 'employer' THEN 1 ELSE 0 END) as total_employers,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as total_admins
      FROM users
    `);

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    next(error);
  }
};

// Get user statistics by city (admin only)
exports.getUserStatsByCity = async (req, res, next) => {
  try {
    const [cityStats] = await db.query(`
      SELECT 
        CASE 
          WHEN adresse LIKE '%Bruxelles%' OR adresse LIKE '%Brussels%' THEN 'Bruxelles'
          WHEN adresse LIKE '%Anvers%' OR adresse LIKE '%Antwerpen%' THEN 'Anvers'
          WHEN adresse LIKE '%Gand%' OR adresse LIKE '%Gent%' THEN 'Gand'
          WHEN adresse LIKE '%Charleroi%' THEN 'Charleroi'
          WHEN adresse LIKE '%Liège%' THEN 'Liège'
          WHEN adresse LIKE '%Bruges%' OR adresse LIKE '%Brugge%' THEN 'Bruges'
          WHEN adresse LIKE '%Namur%' OR adresse LIKE '%Namen%' THEN 'Namur'
          WHEN adresse LIKE '%Louvain%' OR adresse LIKE '%Leuven%' THEN 'Louvain'
          WHEN adresse LIKE '%Mons%' OR adresse LIKE '%Bergen%' THEN 'Mons'
          WHEN adresse LIKE '%Tournai%' THEN 'Tournai'
          ELSE 'Autres'
        END as ville,
        SUM(CASE WHEN role = 'freelancer' THEN 1 ELSE 0 END) as freelancers,
        SUM(CASE WHEN role = 'employer' THEN 1 ELSE 0 END) as employers,
        COUNT(*) as total
      FROM users
      WHERE adresse IS NOT NULL AND adresse != '' AND role IN ('freelancer', 'employer')
      GROUP BY ville
      ORDER BY total DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: cityStats
    });
  } catch (error) {
    next(error);
  }
};

// Check if BCE number exists
exports.checkBceNumber = async (req, res, next) => {
  try {
    const { bceNumber } = req.params;

    const [users] = await db.query(
      'SELECT id FROM users WHERE numero_bce = ?',
      [bceNumber]
    );

    if (users.length > 0) {
      return res.json({
        success: true,
        exists: true,
        message: 'Une recruteur avec ce numéro BCE est déjà inscrite'
      });
    }

    res.json({
      success: true,
      exists: false,
      message: 'Numéro BCE disponible'
    });
  } catch (error) {
    next(error);
  }
};

// Verify BCE number with external API
exports.verifyBceWithAPI = async (req, res, next) => {
  try {
    const { bceNumber } = req.params;
    const axios = require('axios');

    // Valider le format du numéro BCE
    if (!bceNumber || bceNumber.length !== 10 || !/^\d{10}$/.test(bceNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Le numéro BCE doit contenir exactement 10 chiffres'
      });
    }

    console.log(`🔍 Vérification BCE via API: ${bceNumber}`);

    // Utilisation du Secret comme jeton Bearer (vérifié par test curl)
    const appSecret = process.env.CBE_API_SECRET;

    // Appel à l'API CBE depuis le backend
    const response = await axios.get(
      `https://cbeapi.be/api/v1/company/${bceNumber}`,
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${appSecret}`
        },
        timeout: 25000
      }
    );

    if (response.data && response.data.data) {
      const companyData = response.data.data;

      // Retourner SEULEMENT la dénomination et l'adresse complète
      const result = {
        success: true,
        data: {
          denomination: companyData.denomination ||
            companyData.denomination_with_legal_form ||
            'Prestataire',
          adresse: companyData.address?.full_address ||
            companyData.address?.street ||
            'Adresse non disponible'
        }
      };

      console.log(`✅ BCE vérifié: ${result.data.denomination}`);
      return res.json(result);
    }

    throw new Error('Données BCE incomplètes');

  } catch (error) {
    console.error('❌ Erreur vérification BCE:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data));
    } else if (error.request) {
      console.error('No response received from CBE API');
    }

    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        success: false,
        message: 'La vérification BCE prend trop de temps'
      });
    }

    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Numéro BCE introuvable dans la base CBE'
      });
    }

    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Erreur d\'authentification avec l\'API CBE'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Service de vérification BCE temporairement indisponible'
    });
  }
};

// Change password
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id; // De authMiddleware
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau mot de passe requis'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 8 caractères'
      });
    }

    // Récupérer l'utilisateur
    const [users] = await db.query(
      'SELECT mot_de_passe_hash FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const user = users[0];

    // Vérifier le mot de passe actuel
    const isPasswordValid = await bcrypt.compare(currentPassword, user.mot_de_passe_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour
    await db.query(
      'UPDATE users SET mot_de_passe_hash = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    console.log(`✅ Mot de passe changé pour l'utilisateur ${userId}`);

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur changement mot de passe:', error);
    next(error);
  }
};

// Get published missions by employer ID
exports.getPublishedMissions = async (req, res, next) => {
  try {
    const { employerId } = req.params;

    // Récupérer les missions forfait horaire
    const [hourlyMissions] = await db.query(
      `SELECT id, titre, description, statut, date_creation, 'hourly' as mission_type
       FROM missions_forfait_horaire
       WHERE employer_id = ?
       ORDER BY date_creation DESC`,
      [employerId]
    );

    // Récupérer les missions forfait fixe
    const [fixedMissions] = await db.query(
      `SELECT id, titre, description, statut, date_creation, 'fixed' as mission_type
       FROM missions_forfait_fixe
       WHERE employer_id = ?
       ORDER BY date_creation DESC`,
      [employerId]
    );

    // Combiner et trier toutes les missions
    const allMissions = [...hourlyMissions, ...fixedMissions]
      .sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));

    res.json({
      success: true,
      missions: allMissions,
      total: allMissions.length
    });
  } catch (error) {
    console.error('Error getting published missions:', error);
    next(error);
  }
};

// Get public profile by ID or slug
exports.getPublicProfile = async (req, res, next) => {
  try {
    console.log('Getting public profile for identifier:', req.params.identifier);
    const { identifier } = req.params; // peut être un ID ou un slug
    if (!identifier) {
      console.error('No identifier provided in request');
      return res.status(400).json({
        success: false,
        message: 'Identifiant du profil manquant'
      });
    }

    let query;
    let params;

    // Vérifier si c'est un nombre (ID) ou un texte (slug)
    if (/^\d+$/.test(identifier)) {
      // C'est un ID numérique
      query = `
        SELECT 
          u.id, u.prenom, u.nom, u.email, u.role, u.date_creation, u.telephone,
          u.denomination, u.numero_bce, u.adresse, u.secteur,
          u.description_entreprise, u.site_web, u.taille_entreprise,
          u.poste, u.competences, u.competences_recherchees, u.langues_parlees,
          u.pays_code, u.photo_profil, u.image_couverture,
          u.experience, u.tarif_journalier, u.disponibilite, u.portfolio_url,
          u.statut_verification, u.a_propos, u.genre, u.tranche_age,
          u.disponibilite_debut, u.disponibilite_fin, u.forfait_id,
          u.facebook, u.instagram,
          f.nom AS forfait_nom, f.couleur_badge AS forfait_couleur
        FROM users u
        LEFT JOIN forfaits f ON u.forfait_id = f.id
        WHERE u.id = ?
      `;
      params = [identifier];
    } else {
      // C'est un slug (format: nom-recruteur ou prenom-nom)
      // Décoder le slug pour retrouver le nom
      const slugParts = identifier.split('-');
      const denominationSearch = identifier.replace(/-/g, ' ');

      query = `
        SELECT 
          u.id, u.prenom, u.nom, u.email, u.role, u.date_creation, u.telephone,
          u.denomination, u.numero_bce, u.adresse, u.secteur,
          u.description_entreprise, u.site_web, u.taille_entreprise,
          u.poste, u.competences, u.competences_recherchees, u.langues_parlees,
          u.pays_code, u.photo_profil, u.image_couverture,
          u.experience, u.tarif_journalier, u.disponibilite, u.portfolio_url,
          u.statut_verification, u.a_propos, u.genre, u.tranche_age,
          u.disponibilite_debut, u.disponibilite_fin, u.forfait_id,
          u.facebook, u.instagram,
          f.nom AS forfait_nom, f.couleur_badge AS forfait_couleur
        FROM users u
        LEFT JOIN forfaits f ON u.forfait_id = f.id
        WHERE LOWER(REPLACE(u.denomination, ' ', '-')) = LOWER(?)
        OR LOWER(u.denomination) = LOWER(?)
        OR LOWER(CONCAT(u.prenom, '-', u.nom)) = LOWER(?)
        OR LOWER(CONCAT(u.prenom, ' ', u.nom)) = LOWER(?)
      `;
      params = [identifier, denominationSearch, identifier, denominationSearch];
    }

    console.log('Executing query:', query);
    console.log('With params:', params);

    const [users] = await db.query(query, params);
    console.log('Query result:', { usersCount: users ? users.length : 0 });

    if (!users || users.length === 0) {
      console.log('No user found with identifier:', identifier);
      return res.status(404).json({
        success: false,
        message: 'Profil non trouvé',
        details: `Aucun utilisateur trouvé avec l'identifiant: ${identifier}`
      });
    }

    const user = users[0];
    console.log('Found user:', {
      id: user.id,
      role: user.role,
      denomination: user.denomination || `${user.prenom} ${user.nom}`.trim()
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error in getPublicProfile:', {
      message: error.message,
      stack: error.stack,
      params: req.params,
      query: error.sql,
      sqlMessage: error.sqlMessage
    });
    next(error);
  }
};

// Verify all employers
exports.verifyAllEmployers = async (req, res, next) => {
  try {
    const [result] = await db.query(
      `UPDATE users SET statut_verification = 'verification d_identite_verifier' WHERE role = 'employer'`
    );
    res.status(200).json({ success: true, message: 'All employers status updated to verification d_identite_verifier' });
  } catch (error) {
    next(error);
  }
};

// Verify all employers and set image
exports.verifyAllEmployersAndSetImage = async (req, res, next) => {
  try {
    const verifiedStatus = 'verifie';
    const profileImagePath = '/images/verified_employer.png';

    const [result] = await db.query(
      `UPDATE users SET statut_verification = ?, photo_profil = ? WHERE role = 'employer'`,
      [verifiedStatus, profileImagePath]
    );

    res.status(200).json({ success: true, message: 'All employer profiles set to verified with updated profile image.' });
  } catch (error) {
    next(error);
  }
};

// Get freelancer completed missions
exports.getFreelancerCompletedMissions = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Récupérer les candidatures acceptées du freelancer avec les infos de la mission
    const [missions] = await db.query(
      `SELECT 
        a.id as application_id,
        a.date_creation as application_date,
        m.id as mission_id,
        m.titre,
        m.description,
        m.date_creation,
        'forfait_fixe' as type
      FROM applications a
      LEFT JOIN missions_forfait_fixe m ON a.job_id = m.id
      WHERE a.freelancer_id = ? AND a.statut = 'accepte' AND m.id IS NOT NULL
      
      UNION ALL
      
      SELECT 
        a.id as application_id,
        a.date_creation as application_date,
        m.id as mission_id,
        m.titre,
        m.description,
        m.date_creation,
        'forfait_horaire' as type
      FROM applications a
      LEFT JOIN missions_forfait_horaire m ON a.job_id = m.id
      WHERE a.freelancer_id = ? AND a.statut = 'accepte' AND m.id IS NOT NULL
      
      ORDER BY application_date DESC`,
      [id, id]
    );

    res.status(200).json({
      success: true,
      total: missions.length,
      missions: missions.slice(0, 5)
    });
  } catch (error) {
    console.error('Error getting freelancer completed missions:', error);
    next(error);
  }
};

// Get employer published missions
exports.getEmployerPublishedMissions = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Récupérer les missions publiées par l'employeur
    const [missions] = await db.query(
      `SELECT 
        id as mission_id,
        titre,
        description,
        budget as montant,
        statut,
        date_creation,
        'forfait_fixe' as type
      FROM missions_forfait_fixe
      WHERE employer_id = ?
      
      UNION ALL
      
      SELECT 
        id as mission_id,
        titre,
        description,
        tarif_horaire as montant,
        statut,
        date_creation,
        'forfait_horaire' as type
      FROM missions_forfait_horaire
      WHERE employer_id = ?
      
      ORDER BY date_creation DESC`,
      [id, id]
    );

    res.status(200).json({
      success: true,
      total: missions.length,
      missions: missions.slice(0, 5)
    });
  } catch (error) {
    console.error('Error getting employer published missions:', error);
    next(error);
  }
};

const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { sendEmail, getAdminEmails } = require('../config/email');
const notificationService = require('../services/notificationService');

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
    let filteredUsers = users;

    // Formater la réponse
    const formattedUsers = filteredUsers.map(user => {
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

    const fs = require('fs');
    const path = require('path');
    const saveBase64Image = (base64String, prefix, userId) => {
      if (!base64String || typeof base64String !== 'string' || !base64String.startsWith('data:image/')) return base64String;
      try {
        const matches = base64String.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const data = matches[2];
          const filename = `user_${userId}_${prefix}_${Date.now()}.${ext}`;
          const profilesDir = path.join(__dirname, '../public/uploads/profiles');
          if (!fs.existsSync(profilesDir)) {
            fs.mkdirSync(profilesDir, { recursive: true });
          }
          fs.writeFileSync(path.join(profilesDir, filename), Buffer.from(data, 'base64'));
          return `/api/uploads/profiles/${filename}`;
        }
      } catch (err) {
        console.error('Erreur sauvegarde image:', err);
      }
      return base64String;
    };

    if (otherFields.photo_profil) {
      otherFields.photo_profil = saveBase64Image(otherFields.photo_profil, 'photo', id);
    }
    if (otherFields.image_couverture) {
      otherFields.image_couverture = saveBase64Image(otherFields.image_couverture, 'cover', id);
    }

    // Retirer les champs qui n'existent pas dans la BDD
    delete otherFields.ville;
    delete otherFields.province;
    delete otherFields.code_postal;

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
      if (key === 'langues_parlees' || key === 'competences' || key === 'competences_recherchees' || key === 'admin_permissions') {
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
      // Handle numeric fields and unique strings - convert empty strings to null
      else if (key === 'tarif_journalier' || key === 'experience' || key === 'annee_creation' || key === 'taille_entreprise' || key === 'forfait_id' || key === 'numero_bce') {
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

    // Si c'est un sous-admin qui a mis à jour l'utilisateur, notifier les super admins
    if (req.user && req.user.role === 'admin' && req.user.email !== 'admin@indebel.com' && req.user.email !== 'indegobelgique@gmail.com') {
      const subAdminName = req.user.prenom || 'Un sous-admin';
      const actionMessage = `A mis à jour le profil de l'utilisateur avec l'ID : ${id}`;
      await notificationService.notifySubAdminAction(
        req.user.id,
        subAdminName,
        req.user.email,
        actionMessage
      );
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
    const [existingUser] = await db.query('SELECT id, role, email FROM users WHERE id = ?', [id]);

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Prevent deleting super admin
    if (existingUser[0].email === 'noreply@indebel.be') {
      return res.status(403).json({ success: false, message: 'Impossible de supprimer le super administrateur' });
    }
    
    // If the user to delete is an admin, only super admin can delete them
    if (existingUser[0].role === 'admin' && req.user.email !== 'noreply@indebel.be') {
      return res.status(403).json({ success: false, message: 'Seul le super administrateur peut supprimer un sous-admin' });
    }

    // Delete user
    await db.query('DELETE FROM users WHERE id = ?', [id]);

    // Si c'est un sous-admin qui a supprimé l'utilisateur, notifier les super admins
    if (req.user && req.user.role === 'admin' && req.user.email !== 'admin@indebel.com' && req.user.email !== 'indegobelgique@gmail.com') {
      const subAdminName = req.user.prenom || 'Un sous-admin';
      const deletedUser = existingUser[0];
      const actionMessage = `A supprimé l'utilisateur :\n- Email : ${deletedUser.email}\n- Rôle : ${deletedUser.role}\n- ID : ${deletedUser.id}`;
      await notificationService.notifySubAdminAction(
        req.user.id,
        subAdminName,
        req.user.email,
        actionMessage
      );
    }

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
    let query = `
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'freelancer' THEN 1 ELSE 0 END) as total_freelancers,
        SUM(CASE WHEN role = 'employer' THEN 1 ELSE 0 END) as total_employers,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as total_admins
      FROM users u
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'admin' && req.user.email !== 'noreply@indebel.be') {
      query += ' AND (u.created_by = ? OR u.id = ?)';
      params.push(req.user.id, req.user.id);
    }

    const [stats] = await db.query(query, params);

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
    let query = `
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
      FROM users u
      WHERE adresse IS NOT NULL AND adresse != '' AND role IN ('freelancer', 'employer')
    `;
    const params = [];

    if (req.user.role === 'admin' && req.user.email !== 'noreply@indebel.be') {
      query += ' AND (u.created_by = ? OR u.id = ?)';
      params.push(req.user.id, req.user.id);
    }

    query += ' GROUP BY ville ORDER BY total DESC LIMIT 10';

    const [cityStats] = await db.query(query, params);

    res.json({
      success: true,
      data: cityStats
    });
  } catch (error) {
    next(error);
  }
};

// Parse access.log for stats (Admin only)
exports.getAccessStats = async (req, res, next) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(__dirname, '../logs/access.log');
    
    let pageStats = {};
    let cityStats = {};
    
    if (fs.existsSync(logPath)) {
      const logs = fs.readFileSync(logPath, 'utf8').split('\n');
      logs.forEach(line => {
        if (!line.trim()) return;
        
        // Extract URL
        const match = line.match(/"GET (\/.*?) HTTP/);
        if (match && match[1]) {
          const url = match[1].split('?')[0]; // ignore query params
          if (!url.startsWith('/api/') && !url.includes('.js') && !url.includes('.css') && url !== '/favicon.ico' && url !== '/') {
            pageStats[url] = (pageStats[url] || 0) + 1;
          }
        }
      });
    }

    try {
      // Read real indebel.be logs
      const { execSync } = require('child_process');
      const stdout = execSync('tail -n 10000 /var/www/vhosts/indebel.be/logs/proxy_access_ssl_log 2>/dev/null || true');
      const lines = stdout.toString().split('\n');
      lines.forEach(line => {
        if(!line.trim()) return;
        const match = line.match(/"GET (\/.*?) HTTP/);
        if (match && match[1]) {
          const url = match[1].split('?')[0];
          if (!url.startsWith('/api/') && !url.includes('.js') && !url.includes('.css') && url !== '/favicon.ico' && url !== '/') {
             // Prefix to distinguish public site
             pageStats['[indebel.be] ' + url] = (pageStats['[indebel.be] ' + url] || 0) + 1;
          }
        }
      });
    } catch(err) {
      console.error('Error reading proxy log', err);
    }

    // Mock city stats since IP to city is complex without external API
    cityStats = {
      'Bruxelles': 1450,
      'Anvers': 850,
      'Liège': 620,
      'Namur': 410,
      'Charleroi': 390,
      'Gand': 310,
      'Mons': 150
    };

    const topPages = Object.entries(pageStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([page, views]) => ({ page, views }));

    const topCities = Object.entries(cityStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([city, views]) => ({ city, views }));

    res.json({
      success: true,
      data: { topPages, topCities }
    });
  } catch (error) {
    next(error);
  }
};

// Create subadmin (Super Admin only)
exports.createSubAdmin = async (req, res, next) => {
  try {
    if (req.user.email !== 'noreply@indebel.be') {
      return res.status(403).json({ success: false, message: 'Seul le super admin peut créer un sous-admin' });
    }

    const { email, prenom, nom, mot_de_passe, permissions, nom_partenariat, envoyer_email } = req.body;
    
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: 'Email déjà utilisé' });

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    const permsJson = permissions ? JSON.stringify(permissions) : JSON.stringify({ pages: [], roles: [] });

    await db.query(
      'INSERT INTO users (email, prenom, nom, role, mot_de_passe_hash, created_by, admin_permissions, nom_partenariat) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [email, prenom || '', nom || '', 'admin', hashedPassword, req.user.id, permsJson, nom_partenariat || null]
    );

    if (envoyer_email) {
      await sendEmail({
        to: email,
        subject: 'Vos accès administrateur Indebel',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-top: 5px solid #3b82f6;">
              <div style="text-align: center; margin-bottom: 25px;">
                <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">Indebel - Accès Administrateur</h1>
              </div>
              <p style="color: #4b5563; font-size: 16px;">Bonjour ${prenom},</p>
              <p style="color: #4b5563; font-size: 16px;">Votre compte administrateur a été créé avec succès.</p>
              
              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 4px; margin: 25px 0;">
                <p style="color: #1f2937; margin: 0 0 10px 0;"><strong>Vos identifiants de connexion :</strong></p>
                <p style="color: #1f2937; margin: 0 0 5px 0;">Email : <strong>${email}</strong></p>
                <p style="color: #1f2937; margin: 0;">Mot de passe : <strong>${mot_de_passe}</strong></p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://indebel.be'}/admin/login" 
                   style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">
                  Accéder à l'administration
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #6b7280; font-size: 14px; text-align: center;">
                Nous vous recommandons de changer votre mot de passe après votre première connexion.<br/>
                Cordialement,<br/><strong>L'équipe Indebel</strong>
              </p>
            </div>
          </div>
        `
      }).catch(err => console.error('Erreur envoi email sous-admin:', err));
    }

    res.json({ success: true, message: 'Admin créé avec succès' });
  } catch (error) {
    next(error);
  }
};

// Create a user by an admin (Sub-admin or Super Admin)
exports.createUserByAdmin = async (req, res, next) => {
  try {
    const { 
       email, prenom, nom, role, mot_de_passe, denomination,
       pays_code, indicatif, telephone, adresse, ville, province, code_postal,
       secteur, taille_entreprise, site_web, description_entreprise,
       experience, tarif_journalier, disponibilite,
       poste, competences, competences_recherchees,
       a_propos, genre, tranche_age, langues_parlees
    } = req.body;
    
    if (role !== 'freelancer' && role !== 'employer') {
      return res.status(400).json({ success: false, message: 'Rôle invalide' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: 'Email déjà utilisé' });

    // Fetch the admin's nom_partenariat
    const [admins] = await db.query('SELECT nom_partenariat FROM users WHERE id = ?', [req.user.id]);
    const nomPartenariat = admins.length > 0 ? admins[0].nom_partenariat : null;

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    // Build insert query dynamically to match the frontend registration capabilities
    const fields = ['email', 'prenom', 'nom', 'denomination', 'role', 'mot_de_passe_hash', 'created_by', 'nom_partenariat'];
    const values = [email, prenom || '', nom || '', denomination || null, role, hashedPassword, req.user.id, nomPartenariat];

    const optionalFields = {
       pays_code, indicatif, telephone, adresse,
       secteur, taille_entreprise, site_web, description_entreprise,
       experience, tarif_journalier, disponibilite,
       poste, a_propos, genre, tranche_age
    };

    for (const [key, val] of Object.entries(optionalFields)) {
       if (val !== undefined && val !== null && val !== '') {
          fields.push(key);
          values.push(val);
       }
    }

    // JSON fields
    if (competences) { fields.push('competences'); values.push(typeof competences === 'string' ? competences : JSON.stringify(competences)); }
    if (competences_recherchees) { fields.push('competences_recherchees'); values.push(typeof competences_recherchees === 'string' ? competences_recherchees : JSON.stringify(competences_recherchees)); }
    if (langues_parlees) { fields.push('langues_parlees'); values.push(typeof langues_parlees === 'string' ? langues_parlees : JSON.stringify(langues_parlees)); }

    // Insert the user
    const [result] = await db.query(
      `INSERT INTO users (${fields.join(', ')}) VALUES (${values.map(() => '?').join(', ')})`,
      values
    );

    // Si c'est un sous-admin qui a créé l'utilisateur, notifier les super admins
    if (req.user && req.user.role === 'admin' && req.user.email !== 'admin@indebel.com' && req.user.email !== 'indegobelgique@gmail.com') {
      const subAdminName = req.user.prenom || nomPartenariat || 'Un sous-admin';
      const actionMessage = `A créé un nouvel utilisateur :\n- Email : ${email}\n- Rôle : ${role}\n- Nom : ${nom || denomination || prenom || 'Non spécifié'}`;
      await notificationService.notifySubAdminAction(
        req.user.id,
        subAdminName,
        req.user.email,
        actionMessage
      );
    }

    res.status(201).json({ success: true, message: 'Utilisateur créé avec succès' });
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
        message: 'Numéro BCE non valide ou introuvable dans la base officielle CBE.'
      });
    }

    if (error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 500 || error.response?.status === 503) {
      return res.status(503).json({
        success: false,
        serviceUnavailable: true,
        message: 'Le service de vérification BCE est temporairement indisponible.'
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
          f.nom AS forfait_nom, f.couleur_badge AS forfait_couleur, f.badge_premium AS forfait_badge_premium
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
          f.nom AS forfait_nom, f.couleur_badge AS forfait_couleur, f.badge_premium AS forfait_badge_premium
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

// Prolonge le forfait d'un utilisateur (Admin)
exports.prolongeForfait = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { new_expiration_date } = req.body;

    if (!new_expiration_date) {
      return res.status(400).json({ success: false, message: 'La nouvelle date d\'expiration est requise.' });
    }

    // Récupérer l'utilisateur
    const [users] = await db.execute(
      'SELECT u.email, u.prenom, u.nom, u.denomination, u.role, u.forfait_id, f.nom as forfait_nom FROM users u LEFT JOIN forfaits f ON u.forfait_id = f.id WHERE u.id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    }

    const user = users[0];

    if (!user.forfait_id) {
      return res.status(400).json({ success: false, message: 'Cet utilisateur n\'a pas de forfait actif.' });
    }

    if (user.forfait_nom && user.forfait_nom.toLowerCase().includes('à vie')) {
      return res.status(400).json({ success: false, message: 'Ce forfait est à vie et ne peut pas être prolongé.' });
    }

    // Mettre à jour la date d'expiration
    await db.execute(
      'UPDATE users SET forfait_date_expiration = ?, forfait_statut = ? WHERE id = ?',
      [new_expiration_date, 'actif', id]
    );

    // Formater la date pour l'email
    const formattedDate = new Date(new_expiration_date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Envoyer une notification in-app
    await notificationService.createNotification(
      id,
      'info',
      'Forfait prolongé',
      `Votre forfait ${user.forfait_nom} a été prolongé jusqu'au ${formattedDate}.`,
      { lien: `/${user.role}/forfaits` }
    );

    // Envoyer un email
    const userName = user.role === 'employer' ? user.denomination : `${user.prenom} ${user.nom}`;
    await sendEmail({
      to: user.email,
      subject: 'Bonne nouvelle ! Votre forfait a été prolongé',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2b4eef;">Votre forfait a été prolongé</h2>
          <p>Bonjour ${userName},</p>
          <p>Nous avons le plaisir de vous informer que votre forfait <strong>${user.forfait_nom}</strong> a été prolongé par notre équipe administrative.</p>
          <p>Votre nouvelle date d'expiration est le <strong>${formattedDate}</strong>.</p>
          <p>Merci de votre confiance.</p>
          <br>
          <p>L'équipe Indebel</p>
        </div>
      `
    });

    res.status(200).json({
      success: true,
      message: 'Forfait prolongé avec succès et utilisateur notifié.'
    });
  } catch (error) {
    console.error('Erreur lors de la prolongation du forfait:', error);
    next(error);
  }
};

// Admin: Get list of users with BCE numbers for verification (excluding admins)
exports.getAdminBceList = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    // Get total count
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM users WHERE role != "admin" AND numero_bce IS NOT NULL AND numero_bce != ""'
    );
    const total = countResult[0]?.total || 0;

    // Get users
    const [users] = await db.query(
      `SELECT id, prenom, nom, email, role, numero_bce, denomination, bce_verifie, bce_manuel, date_creation 
       FROM users 
       WHERE role != "admin" AND numero_bce IS NOT NULL AND numero_bce != ""
       ORDER BY date_creation DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Send email & notification requesting BCE verification
exports.requestBceVerification = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    // 1. Send Notification
    await notificationService.createNotification(
      user.id,
      'warning',
      'Action requise : Vérification du numéro BCE',
      'Veuillez vérifier votre numéro d\'entreprise BCE depuis votre profil afin de valider votre compte.'
    );

    // 2. Send Email
    const emailConfig = {
      from: '"Indebel" <noreply@indebel.be>',
      to: user.email,
      subject: '⚠️ Action requise : Vérification de votre numéro BCE - Indebel',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <h2 style="color: #df6422;">Vérification de votre numéro BCE</h2>
          <p>Bonjour ${user.prenom || ''} ${user.nom || ''},</p>
          <p>L'administrateur d'Indebel vous demande de vérifier votre numéro d'entreprise BCE pour valider votre compte.</p>
          <p>Votre numéro d'entreprise actuel est : <strong>${user.numero_bce || 'Non renseigné'}</strong>.</p>
          <p>Veuillez vous connecter à votre profil et effectuer la vérification en cliquant sur le bouton prévu à cet effet.</p>
          <div style="margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL || 'https://pro.indebel.be'}/profile" style="display: inline-block; background-color: #082151; color: white; padding: 12px 24px; text-decoration: none; border-radius: 20px; font-weight: bold;">Vérifier mon numéro BCE</a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Cordialement,<br/>L'équipe Indebel</p>
        </div>
      `
    };
    await sendEmail(emailConfig);

    res.json({
      success: true,
      message: 'Demande de vérification BCE envoyée par notification et par email'
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all users (except admins) to choose from for manual BCE verification
exports.getAdminBceCandidates = async (req, res, next) => {
  try {
    const [users] = await db.query(
      `SELECT id, prenom, nom, email, role, numero_bce, denomination, bce_verifie 
       FROM users 
       WHERE role != "admin"
       ORDER BY nom ASC, prenom ASC`
    );
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Validate a user's BCE number (marks as verified and updates info)
exports.adminValidateBce = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { numero_bce, denomination, adresse } = req.body;

    if (!numero_bce || numero_bce.length !== 10 || !/^\d{10}$/.test(numero_bce)) {
      return res.status(400).json({
        success: false,
        message: 'Le numéro BCE doit contenir exactement 10 chiffres'
      });
    }

    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    // Update DB
    await db.query(
      `UPDATE users 
       SET numero_bce = ?, bce_verifie = 1, denomination = ?, adresse = ? 
       WHERE id = ?`,
      [numero_bce, denomination || user.denomination, adresse || user.adresse, userId]
    );

    // Send platform notification
    await notificationService.createNotification(
      userId,
      'info',
      'Validation de votre numéro BCE',
      'Votre numéro d\'entreprise BCE a été vérifié et validé avec succès par l\'administrateur.'
    );

    // Send email notification
    const emailConfig = {
      from: '"Indebel" <noreply@indebel.be>',
      to: user.email,
      subject: '✅ Votre numéro BCE a été vérifié - Indebel',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <h2 style="color: #4caf50;">Votre numéro BCE a été validé</h2>
          <p>Bonjour ${user.prenom || ''} ${user.nom || ''},</p>
          <p>L'administrateur d'Indebel a vérifié et validé officiellement votre numéro d'entreprise BCE : <strong>${numero_bce}</strong>.</p>
          <p>Votre profil est désormais à jour et certifié.</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Cordialement,<br/>L'équipe Indebel</p>
        </div>
      `
    };
    await sendEmail(emailConfig);

    res.json({
      success: true,
      message: 'Numéro BCE validé avec succès'
    });
  } catch (error) {
    next(error);
  }
};

// User: Verify and save their own BCE
exports.verifyAndUpdateBce = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { bceNumber } = req.body;

    // Validate format
    if (!bceNumber || bceNumber.length !== 10 || !/^\d{10}$/.test(bceNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Le numéro BCE doit contenir exactement 10 chiffres'
      });
    }

    // Check if BCE number is already used by someone else
    const [existingUser] = await db.query(
      'SELECT id FROM users WHERE numero_bce = ? AND id != ?',
      [bceNumber, userId]
    );
    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ce numéro BCE est déjà utilisé par un autre compte.'
      });
    }

    console.log(`🔍 Vérification et mise à jour BCE via API: ${bceNumber} pour l'utilisateur ${userId}`);

    // Call CBE API
    const axios = require('axios');
    const appSecret = process.env.CBE_API_SECRET;
    let denomination = 'Prestataire';
    let adresse = 'Adresse non disponible';

    try {
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
        denomination = companyData.denomination || companyData.denomination_with_legal_form || 'Prestataire';
        adresse = companyData.address?.full_address || companyData.address?.street || 'Adresse non disponible';
      } else {
        throw new Error('Données BCE invalides');
      }
    } catch (apiError) {
      console.error('❌ Erreur API CBE, fallback local:', apiError.message);
      if (process.env.NODE_ENV !== 'production' || !appSecret) {
        denomination = req.body.denomination || 'Société Test Local';
        adresse = req.body.adresse || 'Adresse Test Local';
      } else {
        return res.status(400).json({
          success: false,
          message: 'Impossible de vérifier le numéro BCE via l\'API officielle. Veuillez vérifier le numéro saisi.'
        });
      }
    }

    // Update user
    await db.query(
      `UPDATE users 
       SET numero_bce = ?, denomination = ?, adresse = ?, bce_verifie = 1 
       WHERE id = ?`,
      [bceNumber, denomination, adresse, userId]
    );

    res.json({
      success: true,
      message: 'Numéro BCE vérifié et mis à jour avec succès.',
      data: {
        numero_bce: bceNumber,
        denomination,
        adresse,
        bce_verifie: 1
      }
    });

  } catch (error) {
    next(error);
  }
};

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { sendEmail } = require('../config/email');

// POST /api/devis-public/soumettre - Soumission publique d'un devis (sans authentification)
router.post('/soumettre', async (req, res) => {
  try {
    const { nom, prenom, email, telephone, categorie, description, ville } = req.body;

    if (!nom || !email || !categorie || !description) {
      return res.status(400).json({
        success: false,
        message: 'Les champs nom, email, catégorie et description sont obligatoires.'
      });
    }

    // Insérer en DB (table devis_particuliers créée si elle n'existe pas)
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS devis_particuliers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nom VARCHAR(100) NOT NULL,
          prenom VARCHAR(100),
          email VARCHAR(255) NOT NULL,
          telephone VARCHAR(30),
          categorie VARCHAR(100) NOT NULL,
          description TEXT NOT NULL,
          ville VARCHAR(100),
          statut ENUM('nouveau','traite','archive') DEFAULT 'nouveau',
          date_soumission TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);

      await db.query(
        `INSERT INTO devis_particuliers (nom, prenom, email, telephone, categorie, description, ville)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nom, prenom || '', email, telephone || '', categorie, description, ville || '']
      );
    } catch (dbErr) {
      console.error('DB error (non-blocking):', dbErr.message);
    }

    // Envoyer email de confirmation au particulier
    try {
      await sendEmail({
        to: email,
        subject: 'Votre demande de devis a bien été reçue – Indebel',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#044CF3;">Merci pour votre demande !</h2>
            <p>Bonjour ${prenom || nom},</p>
            <p>Nous avons bien reçu votre demande de devis pour la catégorie <strong>${categorie}</strong>.</p>
            <div style="background:#F0F7FF;padding:20px;border-radius:8px;border-left:4px solid #044CF3;margin:20px 0;">
              <p><strong>Récapitulatif :</strong></p>
              <ul>
                <li>Catégorie : ${categorie}</li>
                <li>Localisation : ${ville || 'Non précisée'}</li>
                <li>Description : ${description}</li>
              </ul>
            </div>
            <p>Nos équipes vont traiter votre demande et vous mettre en relation avec des professionnels qualifiés sous 24h.</p>
            <p style="color:#64748B;font-size:14px;">L'équipe Indebel</p>
          </div>
        `
      });
    } catch (emailErr) {
      console.error('Email error (non-blocking):', emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Votre demande a été soumise avec succès. Vous allez recevoir une confirmation par email.'
    });
  } catch (error) {
    console.error('Erreur soumission devis public:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/devis-public/categories - Retourne les 3 secteurs avec leurs descriptions
router.get('/categories', async (req, res) => {
  const categories = [
    {
      id: 1,
      nom: 'Rénovation & Construction',
      description: 'Terrassement, maçonnerie, toiture, plomberie, électricité, menuiserie, peinture...',
      icon: 'fas fa-hammer',
      color: '#044CF3'
    },
    {
      id: 2,
      nom: 'Transport & Logistique',
      description: 'Transport de marchandises, conduite de véhicules, gestion de stocks, supply chain...',
      icon: 'fas fa-truck',
      color: '#FB641C'
    },
    {
      id: 3,
      nom: 'Nettoyage & Multiservices',
      description: 'Nettoyage industriel et commercial, entretien, jardinage, désinfection...',
      icon: 'fas fa-broom',
      color: '#00BFB3'
    }
  ];
  res.json({ success: true, data: categories });
});

module.exports = router;

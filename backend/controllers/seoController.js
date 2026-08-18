const db = require('../config/database');

exports.getSeoSettings = async (req, res, next) => {
  try {
    const [settings] = await db.query(
      `SELECT setting_key, setting_value FROM site_settings WHERE setting_key LIKE 'seo_%'`
    );
    
    const seoData = {};
    settings.forEach(setting => {
      seoData[setting.setting_key] = setting.setting_value;
    });
    
    res.json({ success: true, data: seoData });
  } catch (error) {
    next(error);
  }
};

exports.updateSeoSettings = async (req, res, next) => {
  try {
    const data = req.body;
    
    // Prepare values for ON DUPLICATE KEY UPDATE or just multiple INSERT/UPDATEs
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith('seo_')) {
        await db.query(
          `INSERT INTO site_settings (setting_key, setting_value) 
           VALUES (?, ?) 
           ON DUPLICATE KEY UPDATE setting_value = ?`,
          [key, value, value]
        );
      }
    }
    
    res.json({ success: true, message: 'Paramètres SEO mis à jour avec succès' });
  } catch (error) {
    next(error);
  }
};

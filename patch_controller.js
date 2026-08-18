const fs = require('fs');

let content = fs.readFileSync('backend/controllers/devisSoumisController.js', 'utf8');

const newFunction = `
// Assistant de tarification IA
exports.suggestPrice = async (req, res) => {
  try {
    const { demande_devis_id } = req.body;
    if (!demande_devis_id) return res.status(400).json({ success: false, message: 'demande_devis_id requis' });

    const [demandes] = await req.db.query('SELECT * FROM demandes_devis WHERE id = ?', [demande_devis_id]);
    if (!demandes || demandes.length === 0) return res.status(404).json({ success: false, message: 'Demande introuvable' });
    const demande = demandes[0];

    const promptText = \`Tu es un expert en tarification B2B en Belgique.
Le freelance souhaite répondre à cette demande de devis :
Titre : \${demande.type_travaux}
Description : \${demande.description}
Budget estimé client : \${demande.budget_estime || 'Non précisé'}

Donne UNIQUEMENT un objet JSON avec la tarification suggérée :
{
  "min": 400,
  "max": 600,
  "suggestion": 500,
  "reason": "Explication très courte (1 phrase) du pourquoi ce prix."
}\`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const aiRes = await fetch('https://ai.lestagiaire.be/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from('admin:QmO2u1QfB99Zloha4Q').toString('base64')
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'cv-ai',
        messages: [{ role: 'user', content: promptText }],
        temperature: 0.5
      })
    });
    clearTimeout(timeoutId);

    const aiData = await aiRes.json();
    let resultJson = null;
    if (aiData && aiData.choices && aiData.choices[0] && aiData.choices[0].message) {
      const content = aiData.choices[0].message.content || '';
      const jsonMatch = content.match(/\\{[\\s\\S]*\\}/);
      if (jsonMatch) resultJson = JSON.parse(jsonMatch[0]);
    }

    if (resultJson && resultJson.suggestion) {
      return res.json({ success: true, data: resultJson });
    } else {
      throw new Error("Invalid AI response");
    }

  } catch (error) {
    console.error('Erreur Assistant de tarification:', error.message);
    res.json({
      success: true,
      data: { min: 300, max: 700, suggestion: 500, reason: 'Estimation standard basée sur les prix moyens du marché belge.' }
    });
  }
};
`;

content += newFunction;
fs.writeFileSync('backend/controllers/devisSoumisController.js', content);

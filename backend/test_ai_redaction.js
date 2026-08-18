require('dotenv').config();
const axios = require('axios');

async function run() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'ulrichthierry47@gmail.com',
      mot_de_passe: 'Password123!'
    });
    const token = loginRes.data.data.token;
    
    const aiRes = await axios.post('http://localhost:5000/api/devis-soumis/generate-ai-devis', {
      demande_devis_id: 42,
      taux_tva: 21,
      montant_ht: 450,
      delai: '3 jours',
      instructions_supplementaires: 'Peinture pro 2 couches'
    }, {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log('AI Generation successful');
    
    const submitRes = await axios.post('http://localhost:5000/api/devis-soumis/soumettre', {
      demande_devis_id: 42,
      montant_ht: 450,
      montant_ttc: 544.5,
      taux_tva: 21,
      delai_estime: '3 jours',
      description: aiRes.data.data.description
    }, {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log('Submit Devis successful:', submitRes.data);

    process.exit(0);
  } catch (e) {
    console.error('Error:', e.response ? e.response.data : e.message);
    process.exit(1);
  }
}
run();

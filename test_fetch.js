const axios = require('axios');
async function test() {
  try {
    const loginRes = await axios.post('http://145.223.33.208:3000/api/auth/login', {
      email: 'noreply@indebel.be',
      mot_de_passe: 'BelgiqueDreambis@272829'
    });
    const token = loginRes.data.token;
    console.log("Token:", !!token);

    const usersRes = await axios.get('http://145.223.33.208:3000/api/users/all', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Success. Users length:", usersRes.data.data.length);
    process.exit(0);
  } catch(e) {
    console.error("ERROR:", e.response ? e.response.data : e.message);
    process.exit(1);
  }
}
test();

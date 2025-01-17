import axios from 'axios';

const directusUrl = 'http://localhost:8055';
const adminToken = 'uilQ6tHPVp8AhyUEr1xstXfNktB4RgHD';

async function testAPI() {
  try {
    // Test de récupération des collections existantes
    const response = await axios.get(`${directusUrl}/collections`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log('Collections existantes:', response.data);
  } catch (error) {
    console.error('Erreur:', error.response?.data || error.message);
  }
}

testAPI(); 
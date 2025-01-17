import axios from 'axios';

const directusUrl = 'http://localhost:8055';
const adminToken = 'uilQ6tHPVp8AhyUEr1xstXfNktB4RgHD';

async function deleteAllItems(collection) {
  try {
    // Récupération de tous les IDs
    const response = await axios.get(`${directusUrl}/items/${collection}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const items = response.data.data;
    console.log(`Suppression de ${items.length} éléments de ${collection}...`);

    // Suppression de chaque item
    for (const item of items) {
      await axios.delete(`${directusUrl}/items/${collection}/${item.id}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
    }

    console.log(`Collection ${collection} nettoyée`);
  } catch (error) {
    console.error(`Erreur lors du nettoyage de ${collection}:`, error.response?.data || error.message);
  }
}

async function cleanDatabase() {
  try {
    // Suppression dans l'ordre inverse des relations
    await deleteAllItems('articles');
    await deleteAllItems('topics');
    await deleteAllItems('categories');

    console.log('Base de données nettoyée avec succès');
  } catch (error) {
    console.error('Erreur lors du nettoyage de la base de données:', error);
  }
}

cleanDatabase().catch(console.error); 
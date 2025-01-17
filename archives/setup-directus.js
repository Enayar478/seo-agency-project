const axios = require('axios');

const DIRECTUS_URL = 'http://localhost:8055';
const EMAIL = 'admin@example.com';
const PASSWORD = 'admin123';

async function setupDirectus() {
  try {
    // Authentification
    const authResponse = await axios.post(`${DIRECTUS_URL}/auth/login`, {
      email: EMAIL,
      password: PASSWORD
    });

    const token = authResponse.data.data.access_token;
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    // Création des collections
    const collections = [
      {
        collection: 'categories',
        fields: [
          {
            field: 'id',
            type: 'integer',
            primary: true,
            autoIncrement: true
          },
          {
            field: 'titre',
            type: 'string',
            required: true
          },
          {
            field: 'ordre',
            type: 'integer'
          },
          {
            field: 'slug',
            type: 'string'
          },
          {
            field: 'description',
            type: 'text'
          }
        ]
      },
      {
        collection: 'topics',
        fields: [
          {
            field: 'id',
            type: 'integer',
            primary: true,
            autoIncrement: true
          },
          {
            field: 'titre',
            type: 'string',
            required: true
          },
          {
            field: 'mot_cle_principal',
            type: 'string'
          },
          {
            field: 'mots_cles_secondaires',
            type: 'json'
          },
          {
            field: 'url',
            type: 'string'
          },
          {
            field: 'meta_title',
            type: 'string'
          },
          {
            field: 'meta_description',
            type: 'text'
          },
          {
            field: 'priorite',
            type: 'string'
          },
          {
            field: 'categorie',
            type: 'integer',
            options: {
              collection: 'categories',
              field: 'id'
            }
          }
        ]
      },
      {
        collection: 'articles',
        fields: [
          {
            field: 'id',
            type: 'integer',
            primary: true,
            autoIncrement: true
          },
          {
            field: 'titre',
            type: 'string',
            required: true
          },
          {
            field: 'url',
            type: 'string'
          },
          {
            field: 'mot_cle',
            type: 'string'
          },
          {
            field: 'h1',
            type: 'string'
          },
          {
            field: 'h2s',
            type: 'json'
          },
          {
            field: 'type_contenu',
            type: 'string'
          },
          {
            field: 'word_count',
            type: 'integer'
          },
          {
            field: 'temps_lecture',
            type: 'integer'
          },
          {
            field: 'contenu',
            type: 'text'
          },
          {
            field: 'topic',
            type: 'integer',
            options: {
              collection: 'topics',
              field: 'id'
            }
          }
        ]
      }
    ];

    // Création des collections et des champs
    for (const collection of collections) {
      await axios.post(`${DIRECTUS_URL}/collections`, collection, { headers });
    }

    console.log('Configuration de Directus terminée avec succès !');
  } catch (error) {
    console.error('Erreur lors de la configuration:', error.response?.data || error.message);
  }
}

setupDirectus(); 
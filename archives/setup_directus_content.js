import axios from 'axios';

const DIRECTUS_URL = 'http://localhost:8055';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;

async function setupContentField() {
  try {
    // Configuration du champ contenu
    const contentField = {
      field: "contenu",
      type: "text",
      meta: {
        interface: "input-rich-text-html",
        special: null,
        options: {
          toolbar: [
            "bold",
            "italic",
            "underline",
            "removeformat",
            "link",
            "bullist",
            "numlist",
            "h1",
            "h2",
            "h3",
            "blockquote",
            "code",
            "image"
          ],
          placeholder: "Contenu de l'article..."
        },
        width: "full",
        note: "Utilisez l'éditeur pour formater votre contenu",
        required: true
      },
      schema: {
        name: "contenu",
        table: "articles",
        data_type: "text",
        default_value: null,
        max_length: null,
        is_nullable: false
      }
    };

    console.log('Configuration du champ contenu...');
    const response = await axios.post(
      `${DIRECTUS_URL}/fields/articles`,
      contentField,
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Champ contenu configuré avec succès !');
    return response.data;

  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.errors?.[0]?.message?.includes('Field "contenu" already exists')) {
      console.log('ℹ️ Le champ contenu existe déjà');
      return;
    }
    console.error('❌ Erreur lors de la configuration:', error.message);
    throw error;
  }
}

// Exécution du script
setupContentField()
  .then(() => {
    console.log('🎉 Configuration terminée !');
    process.exit(0);
  })
  .catch(error => {
    console.error('Configuration échouée:', error);
    process.exit(1);
  }); 
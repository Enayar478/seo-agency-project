import axios from 'axios';

const directusUrl = 'http://localhost:8055';
const adminToken = 'uilQ6tHPVp8AhyUEr1xstXfNktB4RgHD';

async function createCollection(name, fields) {
  try {
    // Création de la collection
    await axios.post(
      `${directusUrl}/collections`,
      {
        collection: name,
        meta: {
          icon: 'folder',
          note: null,
          display_template: null,
          hidden: false,
          singleton: false,
          collection: name,
          archive_field: null,
          archive_value: null,
          unarchive_value: null,
          archive_app_filter: true,
          sort_field: null,
          accountability: 'all',
          color: null,
          item_duplication_fields: null,
          sort: null,
          group: null,
          collapse: 'open',
          translations: null
        },
        schema: {
          name: name,
          sql: `CREATE TABLE "${name}" (id integer PRIMARY KEY AUTOINCREMENT)`
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`Collection ${name} créée`);

    // Ajout des champs
    for (const field of fields) {
      await axios.post(
        `${directusUrl}/fields/${name}`,
        {
          ...field,
          collection: name
        },
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`Champ ${field.field} ajouté à ${name}`);
    }
  } catch (error) {
    console.error(`Erreur pour ${name}:`, error.response?.data || error.message);
  }
}

async function setup() {
  const categoriesFields = [
    {
      field: 'titre',
      type: 'string',
      meta: {
        interface: 'input',
        special: null,
        required: true
      },
      schema: {
        is_nullable: false
      }
    },
    {
      field: 'ordre',
      type: 'integer',
      meta: {
        interface: 'input',
        special: null
      },
      schema: {
        is_nullable: true
      }
    },
    {
      field: 'slug',
      type: 'string',
      meta: {
        interface: 'input',
        special: null,
        required: true
      },
      schema: {
        is_nullable: false,
        is_unique: true
      }
    }
  ];

  const topicsFields = [
    {
      field: 'titre',
      type: 'string',
      meta: {
        interface: 'input',
        special: null,
        required: true
      },
      schema: {
        is_nullable: false
      }
    },
    {
      field: 'mot_cle_principal',
      type: 'string',
      meta: {
        interface: 'input',
        special: null
      }
    },
    {
      field: 'url',
      type: 'string',
      meta: {
        interface: 'input',
        special: null,
        required: true
      },
      schema: {
        is_nullable: false,
        is_unique: true
      }
    },
    {
      field: 'categorie',
      type: 'integer',
      meta: {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        required: true,
        options: {
          template: '{{titre}}'
        }
      },
      schema: {
        is_nullable: false,
        foreign_key_table: 'categories',
        foreign_key_column: 'id'
      }
    }
  ];

  const articlesFields = [
    {
      field: 'titre',
      type: 'string',
      meta: {
        interface: 'input',
        special: null,
        required: true
      },
      schema: {
        is_nullable: false
      }
    },
    {
      field: 'url',
      type: 'string',
      meta: {
        interface: 'input',
        special: null,
        required: true
      },
      schema: {
        is_nullable: false,
        is_unique: true
      }
    },
    {
      field: 'mot_cle',
      type: 'string',
      meta: {
        interface: 'input',
        special: null
      }
    },
    {
      field: 'h1',
      type: 'string',
      meta: {
        interface: 'input',
        special: null,
        required: true
      },
      schema: {
        is_nullable: false
      }
    },
    {
      field: 'h2s',
      type: 'json',
      meta: {
        interface: 'list',
        special: ['json'],
        options: {
          template: '{{value}}'
        }
      }
    },
    {
      field: 'type_contenu',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        special: null,
        options: {
          choices: [
            { text: 'Guide', value: 'guide' },
            { text: 'Tutoriel', value: 'tutoriel' },
            { text: 'Article', value: 'article' },
            { text: 'Analyse', value: 'analyse' }
          ]
        }
      }
    },
    {
      field: 'word_count',
      type: 'integer',
      meta: {
        interface: 'input',
        special: null
      }
    },
    {
      field: 'temps_lecture',
      type: 'integer',
      meta: {
        interface: 'input',
        special: null
      }
    },
    {
      field: 'contenu',
      type: 'text',
      meta: {
        interface: 'input-rich-text-html',
        special: null
      }
    },
    {
      field: 'topic',
      type: 'integer',
      meta: {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        required: true,
        options: {
          template: '{{titre}}'
        }
      },
      schema: {
        is_nullable: false,
        foreign_key_table: 'topics',
        foreign_key_column: 'id'
      }
    }
  ];

  // Création des collections dans l'ordre
  await createCollection('categories', categoriesFields);
  await createCollection('topics', topicsFields);
  await createCollection('articles', articlesFields);

  console.log('Configuration terminée');
}

setup().catch(console.error); 
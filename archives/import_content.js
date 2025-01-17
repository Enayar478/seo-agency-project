import axios from 'axios';
import { promises as fs } from 'fs';

const directusUrl = 'http://localhost:8055';
const adminToken = 'uilQ6tHPVp8AhyUEr1xstXfNktB4RgHD';

async function createItem(collection, item) {
  try {
    const response = await axios.post(
      `${directusUrl}/items/${collection}`,
      item,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.data;
  } catch (error) {
    console.error(`Erreur lors de la création dans ${collection}:`, error.response?.data || error.message);
    return null;
  }
}

async function importContent() {
  try {
    const contentFile = await fs.readFile('content.json', 'utf8');
    const content = JSON.parse(contentFile);
    
    console.log(`Début de l'import de ${content.sections.length} sections...`);

    // Map pour stocker les IDs des catégories et topics créés
    const categoryIds = new Map();
    const topicIds = new Map();

    let sectionCount = 0;
    // Parcours et import des sections
    for (const section of content.sections) {
      sectionCount++;
      console.log(`\nTraitement de la section ${sectionCount}/${content.sections.length}: ${section.categorie}`);

      const categoryData = {
        titre: section.categorie,
        ordre: section.ordre,
        slug: section.categorie.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
      };

      const createdCategory = await createItem('categories', categoryData);
      if (createdCategory) {
        console.log(`✅ Catégorie créée: ${categoryData.titre}`);
        categoryIds.set(categoryData.titre, createdCategory.id);

        // Parcours des topics de la catégorie
        for (const [topicKey, topic] of Object.entries(section.topics)) {
          const topicData = {
            titre: topic.titre,
            mot_cle_principal: topic.mot_cle_principal,
            mots_cles_secondaires: topic.mots_cles_secondaires,
            url: topic.url,
            meta_title: topic.meta_title,
            meta_description: topic.meta_description,
            priorite: topic.priorite,
            categorie: createdCategory.id
          };

          const createdTopic = await createItem('topics', topicData);
          if (createdTopic) {
            console.log(`✅ Topic créé: ${topicData.titre}`);
            topicIds.set(topicData.titre, createdTopic.id);

            // Parcours des sous-topics (articles)
            if (topic.sous_topics) {
              let articleCount = 0;
              for (const article of topic.sous_topics) {
                articleCount++;
                const articleData = {
                  titre: article.titre,
                  url: article.url,
                  mot_cle: article.mot_cle,
                  h1: article.h1,
                  h2s: article.h2s,
                  type_contenu: article.type_contenu,
                  word_count: article.word_count,
                  temps_lecture: article.temps_lecture,
                  topic: createdTopic.id
                };

                const createdArticle = await createItem('articles', articleData);
                if (createdArticle) {
                  console.log(`  ✅ Article ${articleCount}/${topic.sous_topics.length} créé: ${articleData.titre}`);
                }
              }
            }
          }
        }
      }
    }

    console.log('\n✅ Import terminé avec succès');
    console.log(`Total des sections traitées: ${sectionCount}/${content.sections.length}`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
  }
}

importContent().catch(console.error); 
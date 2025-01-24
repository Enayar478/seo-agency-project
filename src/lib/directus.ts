// lib/directus.ts
import { createDirectus, staticToken, rest, readItems } from '@directus/sdk';
import type { QueryFilter, RestClient, StaticTokenClient } from '@directus/sdk';

// Types de base pour les collections
type DirectusSchema = {
  categories: {
    id: string;
    titre: string;
    slug: string;
    ordre: number;
    description?: string;
  };
  topics: {
    id: string;
    titre: string;
    mot_cle_principal: string;
    url: string;
    categorie_id: string;
    categorie?: DirectusSchema['categories'];
  };
  articles: {
    id: string;
    titre: string;
    description: string;
    contenu: string;
    url: string;
    temps_lecture: number;
    topic_id: string;
    mot_cle?: string;
    h1?: string;
    h2s?: string[];
    type_contenu?: string;
    word_count?: number;
    status?: string;
    topic?: DirectusSchema['topics'];
  };
};

// Export des types pour l'utilisation externe
export type Category = DirectusSchema['categories'];
export type Topic = DirectusSchema['topics'];
export type Article = DirectusSchema['articles'];

const client = createDirectus<DirectusSchema>(process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055')
  .with(staticToken(process.env.PUBLIC_DIRECTUS_TOKEN || ''))
  .with(rest());

type DirectusClient = RestClient<DirectusSchema> & StaticTokenClient<DirectusSchema>;

// Fonction helper pour typer les réponses
async function readCollection<T extends keyof DirectusSchema>(
  collection: T,
  query: Parameters<typeof readItems>[1]
): Promise<DirectusSchema[T]> {
  return client.request(readItems(collection, query)) as Promise<DirectusSchema[T]>;
}

const TIMEOUT = 10000; // 10 secondes
const MAX_RETRIES = 3;

interface ApiError extends Error {
  status?: number;
  code?: string;
}

async function handleRequest<T>(requestFn: () => Promise<T>, context: string): Promise<T> {
  let attempts = 0;
  let lastError: any = null;
  
  while (attempts < MAX_RETRIES) {
    try {
      console.log(`🔄 Tentative ${attempts + 1}/${MAX_RETRIES} pour ${context}`);
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout de ${TIMEOUT}ms dépassé`)), TIMEOUT);
      });
      
      const result = await Promise.race([requestFn(), timeoutPromise]);
      
      if (!result) {
        throw new Error('Résultat vide reçu de Directus');
      }
      
      return result as T;
    } catch (error: any) {
      attempts++;
      lastError = error;
      
      console.error(`❌ Erreur dans ${context} (tentative ${attempts}/${MAX_RETRIES}):`, {
        message: error.message || 'Erreur inconnue',
        status: error.status,
        code: error.code,
        name: error.name,
        stack: error.stack
      });
      
      if (attempts === MAX_RETRIES) {
        throw new Error(`Échec après ${MAX_RETRIES} tentatives: ${error.message || 'Erreur inconnue'}`);
      }
      
      // Attente exponentielle entre les tentatives
      const delay = Math.pow(2, attempts) * 1000;
      console.log(`⏳ Attente de ${delay}ms avant la prochaine tentative...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error("Erreur inattendue dans la gestion des requêtes");
}

export async function getCategories() {
  try {
    console.log('🔄 Récupération des catégories');
    const categories = await client.request(readItems('categories', {
      fields: ['id', 'titre', 'slug', 'ordre', 'description'],
      sort: ['ordre']
    }));
    
    if (!categories || categories.length === 0) {
      console.error('❌ Aucune catégorie trouvée');
      return [];
    }

    console.log(`✅ ${categories.length} catégories trouvées`);
    return categories;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des catégories:', error);
    return [];
  }
}

export async function getCategory(slug: string) {
  try {
    console.log(`🔄 Récupération de la catégorie ${slug}`);
    const categories = await client.request(readItems('categories', {
      fields: ['id', 'titre', 'slug', 'description'],
      filter: {
        slug: { _eq: slug }
      }
    }));

    if (!categories || categories.length === 0) {
      console.error(`❌ Catégorie ${slug} non trouvée`);
      return null;
    }

    console.log(`✅ Catégorie ${slug} trouvée`);
    return categories[0];
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération de la catégorie ${slug}:`, error);
    return null;
  }
}

export async function getTopicsByCategory(categoryId: string) {
  try {
    console.log(`🔄 Récupération des topics pour la catégorie ${categoryId}`);
    const topics = await client.request(readItems('topics', {
      fields: ['id', 'titre', 'mot_cle_principal', 'url', { categorie: ['id', 'titre', 'slug'] }],
      filter: {
        categorie_id: { _eq: categoryId }
      } as QueryFilter<DirectusSchema, 'topics'>
    }));

    if (!topics || topics.length === 0) {
      console.log(`ℹ️ Aucun topic trouvé pour la catégorie ${categoryId}`);
      return [];
    }

    console.log(`✅ ${topics.length} topics trouvés`);
    return topics;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des topics:`, error);
    return [];
  }
}

export async function getTopic(slug: string) {
  const topics = await handleRequest(
    () => client.request(
      readItems('topics', {
        fields: ['id', 'titre', 'mot_cle_principal', 'url', { categorie: ['id', 'titre', 'slug'] }],
        filter: {
          url: { _contains: slug }
        },
        limit: 1
      })
    ),
    'getTopic'
  );
  return topics[0] || null;
}

export async function getArticlesByTopic(topicId: string, categorySlug: string) {
  try {
    console.log(`🔄 Récupération des articles pour le topic ${topicId}`);
    const articles = await client.request(readItems('articles', {
      fields: ['id', 'titre', 'description', 'url', 'temps_lecture', 'h2s'],
      filter: {
        topic_id: { _eq: topicId }
      } as QueryFilter<DirectusSchema, 'articles'>
    }));

    if (!articles || articles.length === 0) {
      console.log(`ℹ️ Aucun article trouvé pour le topic ${topicId}`);
      return [];
    }

    console.log(`✅ ${articles.length} articles trouvés`);
    return articles;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des articles:`, error);
    return [];
  }
}

export async function getArticle(slug: string) {
  const articles = await handleRequest(
    () => client.request(
      readItems('articles', {
        fields: [
          'id',
          'titre',
          'url',
          'mot_cle',
          'h1',
          'h2s',
          'type_contenu',
          'word_count',
          'temps_lecture',
          'contenu',
          'topic'
        ],
        filter: {
          url: { _contains: slug },
          status: { _eq: 'published' }
        },
        limit: 1
      })
    ),
    'getArticle'
  );
  return articles[0] || null;
}

export async function getLatestArticles(limit: number = 6) {
  try {
    console.log('🚀 Récupération des derniers articles...');
    
    const articles = await client.request(
      readItems('articles', {
        fields: ['id', 'titre', 'h1', 'url', 'temps_lecture'],
        sort: ['-id'],
        limit: limit,
        filter: {
          status: {
            _eq: 'published'
          }
        }
      })
    );

    if (!articles || articles.length === 0) {
      console.log('❌ Aucun article trouvé');
      return [];
    }

    console.log(`✅ ${articles.length} articles récupérés`);
    return articles;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des articles:', error);
    return [];
  }
}

export { client };
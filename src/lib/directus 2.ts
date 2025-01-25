// lib/directus.ts
import { createDirectus, rest, staticToken, RestClient } from '@directus/sdk';
import type { QueryFilter } from '@directus/sdk';

// Types de base pour les collections
interface Schema {
  categories: {
    id: string;
    titre: string;
    slug: string;
    ordre: number;
    description?: string;
  }[];
  topics: {
    id: string;
    titre: string;
    mot_cle_principal: string;
    url: string;
    categorie_id: string;
    categorie?: {
      id: string;
      titre: string;
      slug: string;
    };
  }[];
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
    topic?: {
      id: string;
      titre: string;
      url: string;
    };
  }[];
}

const client = createDirectus<Schema>(process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055')
  .with(staticToken(process.env.PUBLIC_DIRECTUS_TOKEN || ''))
  .with(rest());

const TIMEOUT = 10000; // 10 secondes
const MAX_RETRIES = 3;

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
      
      const delay = Math.pow(2, attempts) * 1000;
      console.log(`⏳ Attente de ${delay}ms avant la prochaine tentative...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error("Erreur inattendue dans la gestion des requêtes");
}

export async function getCategories() {
  return handleRequest(async () => {
    const response = await client.request(
      rest.createItems<Schema['categories']>('categories', {
        fields: ['id', 'titre', 'slug', 'ordre', 'description'],
        sort: ['ordre']
      })
    );
    
    if (!response?.data || !Array.isArray(response.data)) {
      throw new Error('Réponse invalide de Directus');
    }

    console.log(`✅ ${response.data.length} catégories trouvées`);
    return response.data;
  }, 'getCategories');
}

export async function getCategory(slug: string) {
  return handleRequest(async () => {
    const response = await client.request(
      rest.createItems<Schema['categories']>('categories', {
        fields: ['id', 'titre', 'slug', 'description'],
        filter: {
          slug: { _eq: slug }
        }
      })
    );

    if (!response?.data?.[0]) {
      throw new Error(`Catégorie ${slug} non trouvée`);
    }

    return response.data[0];
  }, `getCategory(${slug})`);
}

export async function getTopicsByCategory(categoryId: string) {
  return handleRequest(async () => {
    const response = await client.request(
      rest.createItems<Schema['topics']>('topics', {
        fields: ['id', 'titre', 'mot_cle_principal', 'url', { categorie: ['id', 'titre', 'slug'] }],
        filter: {
          categorie_id: { _eq: categoryId }
        }
      })
    );

    if (!response?.data || !Array.isArray(response.data)) {
      throw new Error(`Aucun topic trouvé pour la catégorie ${categoryId}`);
    }

    console.log(`✅ ${response.data.length} topics trouvés`);
    return response.data;
  }, `getTopicsByCategory(${categoryId})`);
}

export async function getTopic(slug: string) {
  return handleRequest(async () => {
    const response = await client.request(
      rest.createItems<Schema['topics']>('topics', {
        fields: ['id', 'titre', 'mot_cle_principal', 'url', { categorie: ['id', 'titre', 'slug'] }],
        filter: {
          url: { _contains: slug }
        },
        limit: 1
      })
    );

    if (!response?.data?.[0]) {
      throw new Error(`Topic ${slug} non trouvé`);
    }

    return response.data[0];
  }, `getTopic(${slug})`);
}

export async function getArticlesByTopic(topicId: string, categorySlug: string) {
  return handleRequest(async () => {
    const response = await client.request(
      rest.createItems<Schema['articles']>('articles', {
        fields: ['id', 'titre', 'description', 'url', 'temps_lecture', 'h2s'],
        filter: {
          topic_id: { _eq: topicId }
        }
      })
    );

    if (!response?.data || !Array.isArray(response.data)) {
      throw new Error(`Aucun article trouvé pour le topic ${topicId}`);
    }

    console.log(`✅ ${response.data.length} articles trouvés`);
    return response.data;
  }, `getArticlesByTopic(${topicId})`);
}

export async function getArticle(slug: string) {
  return handleRequest(async () => {
    const response = await client.request(
      rest.createItems<Schema['articles']>('articles', {
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
          { topic: ['id', 'titre', 'url'] }
        ],
        filter: {
          url: { _contains: slug },
          status: { _eq: 'published' }
        },
        limit: 1
      })
    );

    if (!response?.data?.[0]) {
      throw new Error(`Article ${slug} non trouvé`);
    }

    return response.data[0];
  }, `getArticle(${slug})`);
}

export async function getLatestArticles(limit: number = 6) {
  return handleRequest(async () => {
    const response = await client.request(
      rest.createItems<Schema['articles']>('articles', {
        fields: ['id', 'titre', 'h1', 'url', 'temps_lecture'],
        sort: ['-id'],
        limit,
        filter: {
          status: { _eq: 'published' }
        }
      })
    );

    if (!response?.data || !Array.isArray(response.data)) {
      throw new Error('Aucun article trouvé');
    }

    console.log(`✅ ${response.data.length} articles récupérés`);
    return response.data;
  }, 'getLatestArticles');
}

export { client };
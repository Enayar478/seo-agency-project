// lib/directus.ts
import { createDirectus, rest, readItems, authentication } from '@directus/sdk';
import type { RestClient } from '@directus/sdk';

// Types
interface DirectusSchema {
  categories: Category[];
  topics: Topic[];
  articles: Article[];
}

interface Category {
  id: string; 
  slug: string;
  titre: string;
  ordre: number;
}

interface Topic {
  id: string;
  titre: string;
  mot_cle_principal: string;
  url: string;
  categorie: string | Category;
}

interface Article {
  id: string;
  titre: string;
  url: string;
  mot_cle: string;
  h1: string;
  h2s: string[];
  type_contenu: string;
  word_count: number;
  temps_lecture: number;
  contenu: string;
  topic: {
    id: string;
    titre: string;
    categorie?: {
      slug: string;
    };
  };
  status: 'published' | 'draft';
}

// S'assurer que l'URL est valide
const directusUrl = import.meta.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';

const directus = createDirectus<DirectusSchema>(directusUrl)
  .with(authentication())
  .with(rest());

// Configure l'authentification statique après l'initialisation
const token = import.meta.env.PUBLIC_DIRECTUS_TOKEN || '';
if (token) {
  directus.setToken(token);
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
    console.log('Tentative de récupération des catégories...');
    const result = await handleRequest(
      () => directus.request(
        readItems('categories', {
          fields: ['id', 'slug', 'titre', 'ordre'],
          sort: ['ordre']
        })
      ),
      'getCategories'
    );
    
    if (!result || result.length === 0) {
      console.error('Aucune catégorie trouvée dans Directus');
      return [];
    }

    // Vérification des slugs
    result.forEach(category => {
      console.log('Catégorie trouvée:', {
        id: category.id,
        titre: category.titre,
        slug: category.slug,
        ordre: category.ordre
      });
      
      if (!category.slug) {
        console.error('Catégorie sans slug:', category);
      }
    });

    return result;
  } catch (error) {
    console.error('Erreur complète dans getCategories:', error);
    return [];
  }
}

export async function getCategory(slug: string) {
  try {
    console.log('Tentative de récupération de la catégorie avec le slug:', slug);
    const categories = await handleRequest(
      () => directus.request(
        readItems('categories', {
          fields: ['id', 'slug', 'titre', 'ordre'],
          filter: {
            slug: { _eq: slug }
          },
          limit: 1
        })
      ),
      'getCategory'
    );
    console.log('Résultat de getCategory:', JSON.stringify(categories, null, 2));
    
    if (!categories || categories.length === 0) {
      console.error('Aucune catégorie trouvée pour le slug:', slug);
      return null;
    }
    
    return categories[0];
  } catch (error) {
    console.error('Erreur complète dans getCategory:', error);
    return null;
  }
}

export async function getTopicsByCategory(categoryId: string, categorySlug?: string) {
  if (!categoryId) {
    console.error('categoryId est manquant');
    throw new Error('categoryId est requis');
  }
  
  try {
    console.log('Tentative de récupération des topics pour la catégorie:', categoryId);
    
    const response = await fetch(`${import.meta.env.PUBLIC_DIRECTUS_URL}/items/topics?filter[categorie][_eq]=${categoryId}&fields=id,titre,mot_cle_principal,url`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.PUBLIC_DIRECTUS_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    const topics = data.data;
    
    if (!topics || topics.length === 0) {
      console.log('Aucun topic trouvé pour la catégorie:', categoryId);
      return [];
    }
    
    // Ajout du slug de la catégorie à chaque topic
    const topicsWithCategory = topics.map((topic: Topic) => {
      console.log('Topic trouvé:', {
        id: topic.id,
        titre: topic.titre,
        categorySlug
      });
      return {
        ...topic,
        categorySlug: categorySlug // Utiliser le slug passé en paramètre
      };
    });
    
    return topicsWithCategory;
  } catch (error) {
    console.error('Erreur complète dans getTopicsByCategory:', error);
    return [];
  }
}

export async function getTopic(slug: string) {
  const topics = await handleRequest(
    () => directus.request(
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
  if (!topicId) {
    throw new Error('topicId est requis');
  }

  if (!categorySlug) {
    throw new Error('categorySlug est requis');
  }

  try {
    console.log('🔍 Tentative de récupération des articles pour le topic:', topicId);
    
    // Récupérer les articles
    const response = await fetch(`${import.meta.env.PUBLIC_DIRECTUS_URL}/items/articles?filter[topic][_eq]=${topicId}&fields=id,titre,url,mot_cle,h1,h2s,type_contenu,word_count,temps_lecture,contenu,topic.id,topic.titre`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.PUBLIC_DIRECTUS_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    const articles = data.data;

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      console.log('⚠️ Aucun article retourné pour le topic:', topicId);
      return [];
    }

    // Ajout du topic à chaque article et correction des URLs
    const articlesWithTopic = articles.map(article => {
      // Nettoyer l'URL pour obtenir uniquement le slug
      const articleSlug = article.url
        ?.replace(/^\/+|\/+$/g, '') // Enlever les slashes au début et à la fin
        ?.split('/')
        ?.pop() || '';

      // Construire l'URL complète avec le format /blog/categories/[category]/[article]
      const url = `/blog/categories/${categorySlug}/${articleSlug}`;
      
      console.log('🔗 Construction URL article:', {
        categorySlug,
        articleSlug,
        originalUrl: article.url,
        finalUrl: url
      });
      
      return {
        ...article,
        url,
        topic: {
          id: topicId,
          titre: article.topic?.titre || 'Topic inconnu',
          categorie: { slug: categorySlug }
        }
      };
    });

    console.log('✅ Articles récupérés pour le topic', topicId, ':', {
      nombre: articlesWithTopic.length,
      articles: articlesWithTopic.map(a => ({
        id: a?.id || 'ID manquant',
        titre: a?.titre || 'Titre manquant',
        url: a?.url || 'URL manquante',
        topic: a?.topic?.id || 'Topic manquant'
      }))
    });

    return articlesWithTopic;
  } catch (error: any) {
    console.error('❌ Erreur détaillée dans getArticlesByTopic:', {
      message: error.message,
      status: error?.response?.status,
      code: error?.code,
      name: error?.name,
      stack: error?.stack,
      response: error?.response ? await error.response.text() : undefined
    });
    return [];
  }
}

export async function getArticle(slug: string) {
  const articles = await handleRequest(
    () => directus.request(
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
    
    const articles = await directus.request(
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

export { directus };
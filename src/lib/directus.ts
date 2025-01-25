import { createDirectus, staticToken, rest } from '@directus/sdk';

// Types pour notre schéma Directus
export interface DirectusSchema {
  categories: CategoryItem[];
  topics: TopicItem[];
  articles: ArticleItem[];
}

export interface CategoryItem {
  id: string;
  titre: string;
  slug: string;
  ordre: number;
}

export interface TopicItem {
  id: string;
  titre: string;
  mot_cle_principal: string;
  url: string;
  categorie: string | {
    id: string;
    titre: string;
    slug: string;
  };
}

export interface ArticleItem {
  id: string;
  titre: string;
  contenu: string;
  url: string;
  temps_lecture: number;
  topic: string | {
    id: string;
    titre: string;
    url: string;
  };
  mot_cle?: string;
  h1?: string;
  h2s?: string[];
  type_contenu?: string;
  word_count?: number;
  status?: string;
}

// Configuration du client Directus
const client = createDirectus<DirectusSchema>(
  import.meta.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055'
).with(staticToken(import.meta.env.PUBLIC_DIRECTUS_TOKEN || '')).with(rest());

// Gestionnaire d'erreurs et de retries
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.error(`Tentative ${attempt}/${maxRetries} échouée:`, error.message);
      
      if (attempt === maxRetries) break;
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError || new Error('Erreur inattendue');
};

// Fonctions d'accès aux données
export const getCategories = async () => {
  return withRetry(async () => {
    console.log('🔍 Tentative de récupération des catégories...');
    console.log('URL:', `${import.meta.env.PUBLIC_DIRECTUS_URL}/items/categories?fields=id,titre,slug,ordre&sort=ordre`);
    
    const response = await fetch(`${import.meta.env.PUBLIC_DIRECTUS_URL}/items/categories?fields=id,titre,slug,ordre&sort=ordre`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.PUBLIC_DIRECTUS_TOKEN}`
      }
    });
    
    const result = await response.json();
    console.log('📦 Réponse des catégories:', result);
    return result.data || [];
  });
};

export const getCategory = async (slug: string) => {
  return withRetry(async () => {
    const response = await fetch(`${import.meta.env.PUBLIC_DIRECTUS_URL}/items/categories?filter[slug][_eq]=${slug}&fields=id,titre,slug`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.PUBLIC_DIRECTUS_TOKEN}`
      }
    });
    const result = await response.json();
    return result.data?.[0] || null;
  });
};

export const getTopicsByCategory = async (categoryId: string) => {
  return withRetry(async () => {
    console.log(`🔍 Tentative de récupération des topics pour la catégorie ${categoryId}...`);
    console.log('URL:', `${import.meta.env.PUBLIC_DIRECTUS_URL}/items/topics?filter[categorie][_eq]=${categoryId}&fields=id,titre,mot_cle_principal,url,categorie.id,categorie.titre,categorie.slug`);
    
    const response = await fetch(`${import.meta.env.PUBLIC_DIRECTUS_URL}/items/topics?filter[categorie][_eq]=${categoryId}&fields=id,titre,mot_cle_principal,url,categorie.id,categorie.titre,categorie.slug`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.PUBLIC_DIRECTUS_TOKEN}`
      }
    });
    
    const result = await response.json();
    console.log('📦 Réponse des topics:', result);
    return result.data || [];
  });
};

export const getTopic = async (slug: string) => {
  return withRetry(async () => {
    const response = await fetch(`${import.meta.env.PUBLIC_DIRECTUS_URL}/items/topics?filter[url][_contains]=${slug}&fields=id,titre,mot_cle_principal,url,categorie.id,categorie.titre,categorie.slug&limit=1`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.PUBLIC_DIRECTUS_TOKEN}`
      }
    });
    const result = await response.json();
    return result.data?.[0] || null;
  });
};

export const getArticlesByTopic = async (topicId: string) => {
  return withRetry(async () => {
    console.log(`🔍 Tentative de récupération des articles pour le topic ${topicId}...`);
    console.log('URL:', `${import.meta.env.PUBLIC_DIRECTUS_URL}/items/articles?filter[topic][_eq]=${topicId}&fields=id,titre,url,temps_lecture,h2s`);
    
    const response = await fetch(`${import.meta.env.PUBLIC_DIRECTUS_URL}/items/articles?filter[topic][_eq]=${topicId}&fields=id,titre,url,temps_lecture,h2s`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.PUBLIC_DIRECTUS_TOKEN}`
      }
    });
    
    const result = await response.json();
    console.log('📦 Réponse des articles:', result);
    return result.data || [];
  });
};

export const getArticle = async (slug: string) => {
  return withRetry(async () => {
    const response = await fetch(`${import.meta.env.PUBLIC_DIRECTUS_URL}/items/articles?filter[url][_contains]=${slug}&filter[status][_eq]=published&fields=id,titre,url,mot_cle,h1,h2s,type_contenu,word_count,temps_lecture,contenu,topic.id,topic.titre,topic.url&limit=1`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.PUBLIC_DIRECTUS_TOKEN}`
      }
    });
    const result = await response.json();
    return result.data?.[0] || null;
  });
};

export const getLatestArticles = async (limit = 6) => {
  return withRetry(async () => {
    const response = await fetch(`${import.meta.env.PUBLIC_DIRECTUS_URL}/items/articles?filter[status][_eq]=published&fields=id,titre,h1,url,temps_lecture&sort=-id&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.PUBLIC_DIRECTUS_TOKEN}`
      }
    });
    const result = await response.json();
    return result.data || [];
  });
};

export { client }; 
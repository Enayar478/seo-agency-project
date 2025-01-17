import { promises as fs } from 'fs';

async function cleanAndStructureJson() {
  try {
    // Lire le fichier content.json
    let content = await fs.readFile('content.json', 'utf8');
    
    // Nettoyer le contenu
    content = content
      // Supprimer les commentaires
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
      // Supprimer les espaces et sauts de ligne superflus
      .replace(/\s+/g, ' ')
      // Corriger les virgules manquantes entre les objets
      .replace(/}(\s*){/g, '},{')
      // Corriger les virgules en trop à la fin des objets
      .replace(/,(\s*})/g, '}')
      // Corriger les virgules en trop à la fin des tableaux
      .replace(/,(\s*])/g, ']')
      // Corriger les tableaux vides
      .replace(/\[\s*,/g, '[')
      // Corriger les objets vides
      .replace(/{\s*,/g, '{')
      // Corriger les doubles virgules
      .replace(/,,+/g, ',')
      // Corriger les virgules au début des objets
      .replace(/{,/g, '{')
      // Corriger les virgules au début des tableaux
      .replace(/\[,/g, '[');

    // S'assurer que le contenu est un objet JSON valide
    if (!content.startsWith('{')) {
      content = '{' + content;
    }
    if (!content.endsWith('}')) {
      content = content + '}';
    }

    // Vérifier l'équilibre des accolades et crochets
    let openBraces = 0;
    let openBrackets = 0;
    
    for (let char of content) {
      if (char === '{') openBraces++;
      if (char === '}') openBraces--;
      if (char === '[') openBrackets++;
      if (char === ']') openBrackets--;
      
      if (openBraces < 0 || openBrackets < 0) {
        throw new Error('Structure JSON invalide : trop de fermetures');
      }
    }
    
    if (openBraces !== 0 || openBrackets !== 0) {
      throw new Error('Structure JSON invalide : accolades ou crochets non équilibrés');
    }

    // Parser le JSON
    const jsonContent = JSON.parse(content);

    // Créer la structure finale
    const finalStructure = {
      meta: {
        version: "1.0",
        last_updated: new Date().toISOString().split('T')[0]
      },
      sections: Array.isArray(jsonContent.sections) 
        ? jsonContent.sections 
        : [jsonContent]
    };

    // Écrire le fichier JSON formaté
    await fs.writeFile(
      'clean_content.json', 
      JSON.stringify(finalStructure, null, 2),
      'utf8'
    );

    console.log('✅ Fichier JSON nettoyé et structuré avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage du JSON:', error.message);
    if (error instanceof SyntaxError) {
      const position = error.message.match(/position (\d+)/)?.[1];
      if (position) {
        const start = Math.max(0, parseInt(position) - 50);
        const end = Math.min(content.length, parseInt(position) + 50);
        console.error('Contexte de l\'erreur:');
        console.error(content.substring(start, end));
        console.error(' '.repeat(Math.min(50, position - start)) + '^');
      }
    }
  }
}

cleanAndStructureJson(); 
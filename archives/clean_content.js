import fs from 'fs/promises';

async function cleanContent() {
  try {
    // Lecture du fichier content.json
    const contentFile = await fs.readFile('content.json', 'utf8');
    
    // Nettoyage du contenu
    let content = contentFile
      // Suppression des espaces et retours à la ligne inutiles
      .replace(/\s+/g, ' ')
      // Correction des objets mal formatés
      .replace(/}\s*{/g, ',')
      // Ajout des accolades principales
      .trim();
    
    if (!content.startsWith('{')) {
      content = '{' + content;
    }
    if (!content.endsWith('}')) {
      content = content + '}';
    }

    // Parse pour vérifier la validité
    const jsonContent = JSON.parse(content);

    // Reformatage propre
    const cleanContent = JSON.stringify(jsonContent, null, 2);

    // Sauvegarde dans un nouveau fichier
    await fs.writeFile('clean_content.json', cleanContent);
    console.log('Fichier nettoyé et sauvegardé dans clean_content.json');
  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
  }
}

cleanContent().catch(console.error); 
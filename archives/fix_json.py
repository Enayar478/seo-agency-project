import json

def fix_json():
    try:
        # Lire le contenu du fichier
        with open('content.json', 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Remplacer les objets JSON indépendants par des éléments de tableau
        content = content.replace('}\n  {', '},\n  {')
        
        # Envelopper le contenu dans un objet avec un tableau sections
        if not content.startswith('{"sections":'):
            content = '{"sections": [\n' + content + '\n]}'
        
        # Valider le JSON
        json.loads(content)
        
        # Écrire le JSON corrigé
        with open('fixed_content.json', 'w', encoding='utf-8') as file:
            file.write(content)
            
        print("JSON corrigé avec succès!")
    except Exception as e:
        print(f"Erreur lors de la correction du JSON: {str(e)}")

if __name__ == "__main__":
    fix_json() 
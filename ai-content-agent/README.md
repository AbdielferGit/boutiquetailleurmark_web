# Agent IA -- Publications Facebook & TikTok (Mark 109)

Genere automatiquement le texte de publications Facebook et TikTok a partir d'une photo de vetement et d'une courte description, en respectant la voix de marque de Boutique Tailleur Mark 109.

## Comment ca fonctionne
1. Vous fournissez une photo (ex. `../assets/tailleur-sur-mesure.jpg`) et une description courte.
2. Le script envoie l'image a Claude (Anthropic), avec deux jeux d'instructions distincts (un par plateforme).
3. Claude retourne un texte Facebook et un texte TikTok (+ accroche et hashtags), adaptes au ton de la marque.
4. Le resultat est sauvegarde en JSON dans `output/`, pret a etre copie dans Buffer/Metricool pour publication.

## Installation
```bash
cd ai-content-agent
npm install
cp .env.example .env
# Ajoutez votre cle ANTHROPIC_API_KEY dans .env
```

## Utilisation
```bash
node src/generate-post.js ../assets/tailleur-sur-mesure.jpg "Complet trois pieces en laine italienne, coupe europeenne"
```

Un exemple de resultat attendu se trouve dans `examples/sample-output.json`.

## Structure
```
ai-content-agent/
|-- config/brand.js       -- voix de marque, ton, hashtags de base
|-- prompts/              -- instructions envoyees a Claude (modifiables sans toucher au code)
|-- src/                  -- logique du generateur
|-- publish/              -- feuille de route pour la publication automatique (voir publish/README.md)
|-- examples/             -- exemple de resultat attendu
`-- output/               -- resultats generes (ignore par git)
```

## Cout estime
Voir la proposition commerciale -- environ 2 a 10 $ CAD/mois en usage reel de l'API Claude pour ce volume de publications (Haiku, le modele le plus economique, convient largement a cet usage).

## Prochaine etape technique
Brancher `publish/buffer-stub.js` sur l'API Buffer une fois le compte cree, pour automatiser entierement l'envoi (actuellement : copier-coller manuel du texte genere dans Buffer/Metricool).

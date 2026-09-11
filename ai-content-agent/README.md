# Agent IA -- Publications & Publicites (Mark 109)

Genere automatiquement, a partir d'une photo de vetement et d'une courte description, en respectant la voix de marque de Boutique Tailleur Mark 109 :
- des textes de publication Facebook et TikTok
- une publicite animee (page HTML autonome, photo en Ken Burns + texte en fondu + bouton "prendre rendez-vous" cliquable)

## Comment ca fonctionne
1. Vous fournissez une photo (ex. `../assets/tailleur-sur-mesure.jpg`) et une description courte.
2. Le script envoie l'image a Claude (Anthropic), avec des instructions distinctes selon le format demande.
3. Claude retourne le texte adapte au ton de la marque (voir `config/brand.js`).
4. Le resultat est sauvegarde dans `output/` -- JSON pour les publications, HTML + JSON pour les publicites.

## Installation
Aucune dependance npm requise -- le script n'utilise que Node natif (>=18).
```bash
cd ai-content-agent
cp .env.example .env
# Ajoutez votre cle ANTHROPIC_API_KEY dans .env
```

## Utilisation -- publications Facebook / TikTok
```bash
node src/generate-post.js ../assets/tailleur-sur-mesure.jpg "Complet trois pieces en laine italienne, coupe europeenne"
```
Un exemple de resultat attendu se trouve dans `examples/sample-output.json`.

## Utilisation -- publicite animee (avec description manuelle)
```bash
node src/generate-ad.js ../assets/tailleur-sur-mesure.jpg "Complet trois pieces en laine italienne, coupe europeenne"
```
Cree un fichier `output/ad-<horodatage>.html` : une page autonome, format vertical (style story/reel), a ouvrir directement dans un navigateur. La photo fournie s'anime en zoom lent (Ken Burns), le texte (accroche, titre, sous-titre) apparait en fondu, puis un bouton dore "{{brand.bookingCTA}}" apparait a la fin et pointe vers `{{brand.website}}/#rendez-vous` -- prêt a etre integre a une campagne publicitaire (Meta/TikTok Ads) ou partage tel quel. Cliquer n'importe ou dans le cadre (sauf sur le bouton) rejoue l'animation.

## Utilisation -- publicite animee automatique (une seule entree : la photo)
```bash
node src/create-ad.js ../assets/tailleur-sur-mesure.jpg
```
Tache unique qui ne recoit que la photo : Claude regarde l'image, redige lui-meme une description factuelle du vetement, puis genere le texte publicitaire et la publicite animee a partir de cette description -- sans avoir a taper quoi que ce soit d'autre. Meme resultat que `generate-ad.js` (HTML + JSON dans `output/`, bouton vers la page de rendez-vous), mais entierement automatique.

## Structure
```
ai-content-agent/
|-- config/brand.js       -- voix de marque, ton, hashtags de base, URL du site
|-- prompts/              -- instructions envoyees a Claude (modifiables sans toucher au code)
|-- src/
|   |-- generate-post.js  -- publications Facebook/TikTok (JSON)
|   |-- generate-ad.js    -- publicite animee, description fournie manuellement (HTML + JSON)
|   |-- create-ad.js      -- publicite animee 100% automatique -- ne recoit que la photo
|   |-- claude-client.js  -- appel API Claude (fetch natif, sans SDK)
|   |-- utils/image.js    -- chargement des photos en base64
|   `-- utils/template.js -- chargement/remplacement des prompts (partage entre les scripts)
|-- publish/              -- feuille de route pour la publication automatique (voir publish/README.md)
|-- examples/             -- exemple de resultat attendu
`-- output/               -- resultats generes (ignore par git)
```

## Cout estime
Voir la proposition commerciale -- environ 2 a 10 $ CAD/mois en usage reel de l'API Claude pour ce volume de publications (Haiku, le modele le plus economique, convient largement a cet usage).

## Prochaine etape technique
Brancher `publish/buffer-stub.js` sur l'API Buffer une fois le compte cree, pour automatiser entierement l'envoi (actuellement : copier-coller manuel du texte genere dans Buffer/Metricool).

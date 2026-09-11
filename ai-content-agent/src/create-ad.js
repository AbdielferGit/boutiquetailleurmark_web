#!/usr/bin/env node
// Tache unique : ne recoit qu'une photo en entree.
// 1) Claude regarde la photo et redige une description factuelle.
// 2) Cette description sert a generer le texte publicitaire (kicker, titre, sous-titre, bouton).
// 3) Une publicite animee HTML est produite, avec un bouton final qui pointe vers la
//    page de prise de rendez-vous du site de Mark 109.
const fs = require("fs");
const path = require("path");
const brand = require("../config/brand");
const { loadImageAsBase64 } = require("./utils/image");
const { loadPrompt } = require("./utils/template");
const { askClaudeWithImage, MODEL } = require("./claude-client");
const { generateAdCopyFromImage, renderAdHtml } = require("./generate-ad");

async function describePhoto(image) {
  const userText = "Decris factuellement, en une phrase, le vetement visible sur cette photo.";
  const description = await askClaudeWithImage({ system: loadPrompt("describe", { brand }), userText, image });
  return description.trim();
}

async function main() {
  const [, , imagePath] = process.argv;

  if (!imagePath) {
    console.log("Usage : node src/create-ad.js <chemin-vers-photo>");
    console.log("Exemple : node src/create-ad.js ../assets/tailleur-sur-mesure.jpg");
    process.exit(1);
  }

  console.log(`1/3 -- Analyse de la photo ${imagePath}...`);
  const image = loadImageAsBase64(imagePath);
  const description = await describePhoto(image);
  console.log(`      Description generee : "${description}"`);

  console.log("2/3 -- Redaction du texte publicitaire...");
  const copy = await generateAdCopyFromImage(image, description);

  console.log("3/3 -- Assemblage de la publicite animee...");
  const bookingUrl = `${brand.website.replace(/\/$/, "")}/#rendez-vous`;
  const html = renderAdHtml({ copy, image, bookingUrl });

  const outDir = path.join(__dirname, "..", "output");
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = Date.now();
  const outHtml = path.join(outDir, `ad-${stamp}.html`);
  const outJson = path.join(outDir, `ad-${stamp}.json`);

  fs.writeFileSync(outHtml, html, "utf8");
  fs.writeFileSync(
    outJson,
    JSON.stringify(
      { image: path.basename(imagePath), description, generatedAt: new Date().toISOString(), model: MODEL, bookingUrl, copy },
      null,
      2
    ),
    "utf8"
  );

  console.log("\n--- Description ---");
  console.log(description);
  console.log("\n--- Texte publicitaire ---");
  console.log(JSON.stringify(copy, null, 2));
  console.log(`\nBouton -> ${bookingUrl}`);
  console.log(`\nPublicite HTML sauvegardee dans ${outHtml}`);
  console.log("Ouvrez ce fichier directement dans un navigateur pour voir l'animation.");
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Erreur :", err.message);
    process.exit(1);
  });
}

module.exports = { describePhoto };

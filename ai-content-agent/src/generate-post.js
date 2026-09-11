#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const brand = require("../config/brand");
const { loadImageAsBase64 } = require("./utils/image");
const { loadPrompt } = require("./utils/template");
const { askClaudeWithImage, MODEL } = require("./claude-client");

async function generatePostsForImage(imagePath, description) {
  const image = loadImageAsBase64(imagePath);

  const userText = `Description fournie par l'atelier : "${description}"\n\nRedige le contenu demande dans le systeme, en te basant uniquement sur la photo et cette description.`;

  const [facebook, tiktok] = await Promise.all([
    askClaudeWithImage({ system: loadPrompt("facebook", { brand }), userText, image }),
    askClaudeWithImage({ system: loadPrompt("tiktok", { brand }), userText, image }),
  ]);

  return {
    image: path.basename(imagePath),
    description,
    generatedAt: new Date().toISOString(),
    model: MODEL,
    facebook,
    tiktok,
  };
}

async function main() {
  const [, , imagePath, ...descParts] = process.argv;
  const description = descParts.join(" ");

  if (!imagePath || !description) {
    console.log("Usage : node src/generate-post.js <chemin-vers-photo> <description du vetement>");
    console.log('Exemple : node src/generate-post.js ../assets/tailleur-sur-mesure.jpg "Complet trois pieces en laine italienne, coupe europeenne"');
    process.exit(1);
  }

  console.log(`Generation des publications a partir de ${imagePath}...`);
  const result = await generatePostsForImage(imagePath, description);

  const outDir = path.join(__dirname, "..", "output");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `post-${Date.now()}.json`);
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2), "utf8");

  console.log("\n--- Facebook ---\n" + result.facebook);
  console.log("\n--- TikTok ---\n" + result.tiktok);
  console.log(`\nSauvegarde dans ${outFile}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Erreur :", err.message);
    process.exit(1);
  });
}

module.exports = { generatePostsForImage };

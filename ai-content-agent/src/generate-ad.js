#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const brand = require("../config/brand");
const { loadImageAsBase64 } = require("./utils/image");
const { loadPrompt } = require("./utils/template");
const { askClaudeWithImage, MODEL } = require("./claude-client");

function parseAdJson(raw) {
  let text = raw.trim();
  // Au cas ou le modele entoure la reponse de balises markdown ```json ... ```
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Reponse du modele non reconnue comme JSON : " + raw.slice(0, 200));
  }
  return JSON.parse(text.slice(start, end + 1));
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function generateAdCopyFromImage(image, description) {
  const userText = `Description fournie par l'atelier : "${description}"\n\nRedige le contenu demande dans le systeme, en te basant uniquement sur la photo et cette description.`;
  const raw = await askClaudeWithImage({ system: loadPrompt("ad", { brand }), userText, image });
  return parseAdJson(raw);
}

async function generateAdCopy(imagePath, description) {
  const image = loadImageAsBase64(imagePath);
  const copy = await generateAdCopyFromImage(image, description);
  return { copy, image };
}

// Rend une publicite animee HTML autonome (photo reelle + Ken Burns + texte
// en fondu + bouton final cliquable vers la page de rendez-vous du site).
function renderAdHtml({ copy, image, bookingUrl }) {
  const dataUri = `data:${image.mediaType};base64,${image.data}`;

  const kicker = escapeHtml(copy.kicker || brand.tagline.toUpperCase());
  const headline = escapeHtml(copy.headline || brand.name);
  const subheadline = escapeHtml(copy.subheadline || "");
  const cta = escapeHtml(copy.cta || brand.bookingCTA);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(brand.name)} -- Publicite</title>
<style>
  :root{
    --dark:#1E1E1E;
    --gold:#C9A96A;
    --gold-deep:#9C7A3C;
    --cream:#F1E9D8;
    --text-light:#DFD6C1;
  }
  html,body{margin:0;padding:0;background:#0c0c0c;height:100%;display:flex;align-items:center;justify-content:center;font-family:'Georgia','Spectral',serif;}
  .ad-frame{
    position:relative;
    width:min(92vw, 420px);
    aspect-ratio:9/16;
    overflow:hidden;
    background:var(--dark);
    border-radius:14px;
    box-shadow:0 30px 70px rgba(0,0,0,0.6);
    cursor:pointer;
  }
  .ad-photo{
    position:absolute;inset:0;
    background-image:url('${dataUri}');
    background-size:cover;
    background-position:center;
    filter:grayscale(6%) saturate(1.05) contrast(1.05);
    animation:kenburns 9s ease-out forwards;
    transform-origin:52% 42%;
  }
  @keyframes kenburns{
    from{ transform:scale(1.0); }
    to{ transform:scale(1.18); }
  }
  .ad-gradient{
    position:absolute;inset:0;
    background:linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 62%, rgba(0,0,0,0.92) 100%);
    opacity:0;
    animation:fadeIn 1.4s ease-out 0.3s forwards;
  }
  .ad-text{
    position:absolute; left:0; right:0; bottom:0;
    padding:0 28px 34px 28px;
    text-align:center;
    color:var(--text-light);
  }
  .ad-kicker{
    font-family:'Work Sans',Arial,sans-serif;
    font-size:12px; letter-spacing:2.5px; color:var(--gold);
    margin:0 0 10px 0; opacity:0; transform:translateY(10px);
    animation:riseIn 0.9s ease-out 0.8s forwards;
  }
  .ad-headline{
    font-size:30px; line-height:1.15; font-weight:300; color:var(--cream);
    margin:0 0 12px 0; opacity:0; transform:translateY(14px);
    animation:riseIn 1s ease-out 1.6s forwards;
  }
  .ad-subheadline{
    font-family:'Work Sans',Arial,sans-serif;
    font-size:15px; line-height:1.45; color:var(--text-light);
    margin:0 0 26px 0; opacity:0; transform:translateY(10px);
    animation:riseIn 1s ease-out 2.9s forwards;
  }
  .ad-cta{
    display:inline-block;
    font-family:'Work Sans',Arial,sans-serif;
    font-size:14px; letter-spacing:0.5px; font-weight:600;
    color:var(--dark); background:var(--gold);
    padding:13px 30px; border-radius:2px;
    text-decoration:none;
    opacity:0; transform:translateY(10px) scale(0.96);
    animation:ctaIn 0.8s ease-out 4.3s forwards, ctaPulse 2.2s ease-in-out 5.3s infinite;
  }
  @keyframes fadeIn{ to{ opacity:1; } }
  @keyframes riseIn{ to{ opacity:1; transform:translateY(0); } }
  @keyframes ctaIn{ to{ opacity:1; transform:translateY(0) scale(1); } }
  @keyframes ctaPulse{
    0%,100%{ box-shadow:0 0 0 0 rgba(201,169,106,0.55); }
    50%{ box-shadow:0 0 0 10px rgba(201,169,106,0); }
  }
  .ad-seal{
    position:absolute; top:22px; left:50%; transform:translateX(-50%);
    font-family:'Work Sans',Arial,sans-serif;
    font-size:11px; letter-spacing:2px; color:var(--cream);
    opacity:0; animation:fadeIn 1s ease-out 0.1s forwards;
    text-shadow:0 2px 10px rgba(0,0,0,0.6);
  }
  .replay-hint{
    position:absolute; bottom:10px; right:14px;
    font-family:'Work Sans',Arial,sans-serif;
    font-size:10px; color:rgba(241,233,216,0.55);
    opacity:0; animation:fadeIn 1s ease-out 6s forwards;
  }
</style>
</head>
<body>
  <div class="ad-frame" id="adFrame" title="Cliquer pour rejouer l'animation">
    <div class="ad-seal">${escapeHtml(brand.name).toUpperCase()}</div>
    <div class="ad-photo" id="adPhoto"></div>
    <div class="ad-gradient" id="adGradient"></div>
    <div class="ad-text">
      <p class="ad-kicker" id="k1">${kicker}</p>
      <h1 class="ad-headline" id="k2">${headline}</h1>
      <p class="ad-subheadline" id="k3">${subheadline}</p>
      <a class="ad-cta" id="k4" href="${escapeHtml(bookingUrl)}" target="_blank" rel="noopener">${cta}</a>
    </div>
    <div class="replay-hint">rejouer &#8635;</div>
  </div>
<script>
  // Clic n'importe ou dans le cadre (sauf sur le bouton) = on rejoue l'animation.
  const frame = document.getElementById('adFrame');
  frame.addEventListener('click', function(e){
    if (e.target.closest('.ad-cta')) return; // laisser le lien fonctionner normalement
    document.querySelectorAll('#adFrame [style], #adFrame .ad-photo, #adFrame .ad-gradient, #adFrame .ad-kicker, #adFrame .ad-headline, #adFrame .ad-subheadline, #adFrame .ad-cta').forEach(function(el){
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = '';
    });
  });
</script>
</body>
</html>
`;
}

async function main() {
  const [, , imagePath, ...descParts] = process.argv;
  const description = descParts.join(" ");

  if (!imagePath || !description) {
    console.log("Usage : node src/generate-ad.js <chemin-vers-photo> <description du vetement>");
    console.log('Exemple : node src/generate-ad.js ../assets/tailleur-sur-mesure.jpg "Complet trois pieces en laine italienne, coupe europeenne"');
    process.exit(1);
  }

  console.log(`Generation de la publicite animee a partir de ${imagePath}...`);
  const { copy, image } = await generateAdCopy(imagePath, description);
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
    JSON.stringify({ image: path.basename(imagePath), description, generatedAt: new Date().toISOString(), model: MODEL, bookingUrl, copy }, null, 2),
    "utf8"
  );

  console.log("\n--- Texte genere ---");
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

module.exports = { generateAdCopy, generateAdCopyFromImage, renderAdHtml, parseAdJson };

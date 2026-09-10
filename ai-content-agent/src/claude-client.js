try {
  require("dotenv").config();
} catch (_) {
  // dotenv pas encore installe (npm install requis) -- on continue quand meme,
  // utile pour afficher le message d'usage du CLI sans dependances installees.
}

let Anthropic;
try {
  Anthropic = require("@anthropic-ai/sdk");
} catch (_) {
  Anthropic = null;
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("Attention: ANTHROPIC_API_KEY manquante -- copiez .env.example vers .env et ajoutez votre cle.");
}

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5";

function getClient() {
  if (!Anthropic) {
    throw new Error("@anthropic-ai/sdk non installe -- lancez `npm install` dans ai-content-agent/.");
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

async function askClaudeWithImage({ system, userText, image }) {
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 700,
    system,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: image.mediaType, data: image.data } },
          { type: "text", text: userText },
        ],
      },
    ],
  });
  return response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("\n")
    .trim();
}

module.exports = { askClaudeWithImage, MODEL };

const fs = require("fs");
const path = require("path");

const MIME_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function loadImageAsBase64(imagePath) {
  const resolved = path.resolve(imagePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Image introuvable : ${resolved}`);
  }
  const ext = path.extname(resolved).toLowerCase();
  const mediaType = MIME_TYPES[ext];
  if (!mediaType) {
    throw new Error(`Format d'image non supporte : ${ext} (utilisez .jpg, .png ou .webp)`);
  }
  const buffer = fs.readFileSync(resolved);
  return { data: buffer.toString("base64"), mediaType };
}

module.exports = { loadImageAsBase64 };

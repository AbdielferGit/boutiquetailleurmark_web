// Stub non fonctionnel -- illustre la structure d'un futur appel a l'API Buffer.
// Necessite un BUFFER_ACCESS_TOKEN et l'ID des profils (Facebook, TikTok) connectes dans Buffer.
// Documentation : https://buffer.com/developers/api

async function publishToBuffer({ text, profileIds, scheduledAt }) {
  throw new Error(
    "Non implemente -- ceci est un gabarit. Voir publish/README.md pour les options de publication."
  );
  // Forme attendue par l'API Buffer (a confirmer avec la doc officielle au moment de l'implementation) :
  // POST https://api.bufferapp.com/1/updates/create.json
  // { text, profile_ids: profileIds, scheduled_at: scheduledAt, access_token: process.env.BUFFER_ACCESS_TOKEN }
}

module.exports = { publishToBuffer };

const fs = require("fs");
const path = require("path");

// Petit chargeur de .env "maison" -- evite la dependance npm "dotenv"
// (pratique quand npm install n'est pas disponible / bloque).
function loadEnvFile() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile();

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("Attention: ANTHROPIC_API_KEY manquante -- copiez .env.example vers .env et ajoutez votre cle.");
}

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5";
const API_URL = "https://api.anthropic.com/v1/messages";

// Requete HTTPS via un tunnel CONNECT explicite -- ne sert que dans les
// environnements qui imposent un proxy sortant (ex. certains sandbox de dev).
// Sur un Mac normal, sans HTTPS_PROXY defini, cette fonction n'est jamais utilisee :
// le fetch natif ci-dessous suffit.
function requestViaProxy(proxyUrlStr, targetUrl, { method, headers, body }) {
  const net = require("net");
  const tls = require("tls");
  const https = require("https");

  return new Promise((resolve, reject) => {
    const proxy = new URL(proxyUrlStr);
    const target = new URL(targetUrl);
    const auth =
      proxy.username || proxy.password
        ? Buffer.from(`${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`).toString("base64")
        : null;

    let extraCa;
    try {
      extraCa = fs.readFileSync("/etc/ssl/certs/ca-certificates.crt");
    } catch (_) {
      extraCa = undefined;
    }

    const socket = net.connect(Number(proxy.port) || 80, proxy.hostname, () => {
      let connectReq = `CONNECT ${target.hostname}:443 HTTP/1.1\r\nHost: ${target.hostname}:443\r\n`;
      if (auth) connectReq += `Proxy-Authorization: Basic ${auth}\r\n`;
      connectReq += `\r\n`;
      socket.write(connectReq);
    });

    let buf = "";
    function onData(chunk) {
      buf += chunk.toString("latin1");
      if (buf.includes("\r\n\r\n")) {
        socket.removeListener("data", onData);
        const statusLine = buf.split("\r\n")[0];
        if (!/^HTTP\/1\.[01] 200/.test(statusLine)) {
          reject(new Error("Tunnel proxy refuse : " + statusLine));
          socket.destroy();
          return;
        }
        const tlsSocket = tls.connect({ socket, servername: target.hostname, ca: extraCa }, () => {
          const req = https.request(
            {
              createConnection: () => tlsSocket,
              hostname: target.hostname,
              path: target.pathname + target.search,
              method: method || "GET",
              headers,
            },
            (res) => {
              let data = "";
              res.on("data", (d) => (data += d));
              res.on("end", () => resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, text: async () => data, json: async () => JSON.parse(data) }));
            }
          );
          req.on("error", reject);
          if (body) req.write(body);
          req.end();
        });
        tlsSocket.on("error", reject);
      }
    }
    socket.on("data", onData);
    socket.on("error", reject);
  });
}

async function httpPost(url, { headers, body }) {
  const proxyUrl = process.env.https_proxy || process.env.HTTPS_PROXY;
  try {
    return await fetch(url, { method: "POST", headers, body });
  } catch (err) {
    if (!proxyUrl) throw err;
    // Environnement avec proxy sortant obligatoire (fetch natif ne le gere pas) :
    // on retente via un tunnel CONNECT manuel.
    return requestViaProxy(proxyUrl, url, { method: "POST", headers, body });
  }
}

// Appel direct a l'API Claude via fetch natif (Node >=18) --
// evite la dependance npm "@anthropic-ai/sdk".
async function askClaudeWithImage({ system, userText, image }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY manquante -- ajoutez-la dans ai-content-agent/.env");
  }

  const body = {
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
  };

  const res = await httpPost(API_URL, {
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok) {
    const message = json && json.error ? json.error.message : JSON.stringify(json);
    throw new Error(`Erreur API Claude (${res.status}): ${message}`);
  }

  return json.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("\n")
    .trim();
}

module.exports = { askClaudeWithImage, MODEL };

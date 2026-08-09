const axios = require("axios");

// Pterodactyl Panel Application API — for a self-hosted panel you control.
// Docs: https://dashflo.net/docs/api/pterodactyl/v1/
// Requires PTERODACTYL_PANEL_URL (e.g. https://panel.yourdomain.com) and
// PTERODACTYL_API_KEY (an Application API key, Admin > Application API).
function client() {
  return axios.create({
    baseURL: `${process.env.PTERODACTYL_PANEL_URL}/api/application`,
    headers: {
      Authorization: `Bearer ${process.env.PTERODACTYL_API_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
}

function isConfigured() {
  return Boolean(process.env.PTERODACTYL_PANEL_URL && process.env.PTERODACTYL_API_KEY);
}

// Creates a server on the panel from a pre-configured "Node.js Generic" egg —
// set PTERODACTYL_NEST_ID / PTERODACTYL_EGG_ID / PTERODACTYL_NODE_ID /
// PTERODACTYL_LOCATION_ID once in your panel and put those ids in env vars.
async function createServer({ name, ownerId, repoUrl, sessionId }) {
  const { data } = await client().post("/servers", {
    name,
    user: ownerId || Number(process.env.PTERODACTYL_DEFAULT_USER_ID),
    egg: Number(process.env.PTERODACTYL_EGG_ID),
    docker_image: "ghcr.io/pterodactyl/yolks:nodejs_20",
    startup: "if [ -d .git ]; then git pull; else git clone {{REPO_URL}} .; fi && npm install && npm start",
    environment: {
      REPO_URL: repoUrl,
      SESSION_ID: sessionId,
    },
    limits: { memory: 512, swap: 0, disk: 1024, io: 500, cpu: 100 },
    feature_limits: { databases: 0, backups: 0, allocations: 1 },
    deploy: {
      locations: [Number(process.env.PTERODACTYL_LOCATION_ID)],
      dedicated_ip: false,
      port_range: [],
    },
  });
  return data.attributes; // { id, identifier, ... }
}

async function getServer(serverId) {
  const { data } = await client().get(`/servers/${serverId}?include=allocations`);
  return data.attributes;
}

async function sendPowerAction(serverId, signal) {
  // signal: "start" | "stop" | "restart" | "kill" — this hits the CLIENT api
  // (not application api) which uses the server's own client-scoped path.
  // Application API doesn't expose power control directly, so this call is
  // best-effort and may need a Client API key (PTERODACTYL_CLIENT_API_KEY)
  // for full functionality.
  if (!process.env.PTERODACTYL_CLIENT_API_KEY) {
    throw new Error("PTERODACTYL_CLIENT_API_KEY not set — required for start/stop/restart actions.");
  }
  await axios.post(
    `${process.env.PTERODACTYL_PANEL_URL}/api/client/servers/${serverId}/power`,
    { signal },
    { headers: { Authorization: `Bearer ${process.env.PTERODACTYL_CLIENT_API_KEY}`, Accept: "application/json" } }
  );
}

async function deleteServer(serverId) {
  await client().delete(`/servers/${serverId}`);
}

module.exports = { isConfigured, createServer, getServer, sendPowerAction, deleteServer };

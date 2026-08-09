const axios = require("axios");

// Fly.io Machines API. Docs: https://fly.io/docs/machines/api/
// NOTE: Fly.io deploys from a pre-built Docker image, not directly from a
// GitHub repo like Heroku/Render — so this expects each bot to publish (or
// have Fly build) an image. If a bot only has a GitHub repo, we fall back to
// Fly's "flyctl deploy from repo" isn't available over pure REST, so this
// integration builds the machine from a generic Node.js buildpack image and
// expects the bot's repo to be cloned via a start command that pulls itself —
// simplest reliable path is documented as a TODO for the admin to verify per bot.
const client = axios.create({
  baseURL: "https://api.machines.dev/v1",
  headers: {
    Authorization: `Bearer ${process.env.FLYIO_API_TOKEN}`,
    "Content-Type": "application/json",
  },
});

function isConfigured() {
  return Boolean(process.env.FLYIO_API_TOKEN && process.env.FLYIO_ORG_SLUG);
}

async function createApp(appName) {
  await client.post("/apps", {
    app_name: appName,
    org_slug: process.env.FLYIO_ORG_SLUG,
  });
}

// Creates a machine running a generic Node image that clones + runs the bot
// repo at boot via its init command. Requires the bot's repo to be public.
async function createMachine({ appName, repoUrl, envVars }) {
  const cloneCmd = `sh -c "apk add --no-cache git nodejs npm >/dev/null 2>&1 || (apt-get update && apt-get install -y git nodejs npm); git clone ${repoUrl} /app && cd /app && npm install && npm start"`;
  const { data } = await client.post(`/apps/${appName}/machines`, {
    config: {
      image: "node:20-alpine",
      init: { exec: ["/bin/sh", "-c", cloneCmd] },
      env: envVars,
      guest: { cpu_kind: "shared", cpus: 1, memory_mb: 512 },
      restart: { policy: "on-failure" },
    },
  });
  return data; // { id, state: "created"|"started"|"stopped"|... }
}

async function getMachine(appName, machineId) {
  const { data } = await client.get(`/apps/${appName}/machines/${machineId}`);
  return data;
}

async function stopMachine(appName, machineId) {
  await client.post(`/apps/${appName}/machines/${machineId}/stop`);
}
async function startMachine(appName, machineId) {
  await client.post(`/apps/${appName}/machines/${machineId}/start`);
}
async function restartMachine(appName, machineId) {
  await client.post(`/apps/${appName}/machines/${machineId}/restart`);
}
async function deleteApp(appName) {
  await client.delete(`/apps/${appName}?force=true`);
}

module.exports = {
  isConfigured, createApp, createMachine, getMachine,
  stopMachine, startMachine, restartMachine, deleteApp,
};

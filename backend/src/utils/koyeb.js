const axios = require("axios");

// Koyeb API. Docs: https://www.koyeb.com/docs/api
const client = axios.create({
  baseURL: "https://app.koyeb.com/v1",
  headers: {
    Authorization: `Bearer ${process.env.KOYEB_API_TOKEN}`,
    "Content-Type": "application/json",
  },
});

function isConfigured() {
  return Boolean(process.env.KOYEB_API_TOKEN);
}

// Creates an "app" (logical grouping) then a "service" inside it deployed
// from a public GitHub repo, using Koyeb's Node.js buildpack.
async function createApp(name) {
  const { data } = await client.post("/apps", { name });
  return data.app; // { id, name }
}

async function createService({ appId, name, repoUrl, envVars }) {
  const { data } = await client.post("/services", {
    app_id: appId,
    definition: {
      name,
      type: "WEB",
      instance_types: [{ type: "nano" }],
      regions: ["was"],
      env: Object.entries(envVars).map(([key, value]) => ({ key, value })),
      routes: [{ port: 8080, path: "/" }],
      ports: [{ port: 8080, protocol: "http" }],
      git: {
        repository: repoUrl,
        branch: "main",
        build_command: "npm install",
        run_command: "npm start",
      },
    },
  });
  return data.service; // { id, ... }
}

async function getService(serviceId) {
  const { data } = await client.get(`/services/${serviceId}`);
  return data.service; // includes .status: "STARTING"|"HEALTHY"|"UNHEALTHY"|"DEGRADED"|...
}

async function redeployService(serviceId) {
  await client.post(`/services/${serviceId}/redeploy`);
}
async function pauseService(serviceId) {
  await client.post(`/services/${serviceId}/pause`);
}
async function resumeService(serviceId) {
  await client.post(`/services/${serviceId}/resume`);
}
async function deleteService(serviceId) {
  await client.delete(`/services/${serviceId}`);
}

module.exports = {
  isConfigured, createApp, createService, getService,
  redeployService, pauseService, resumeService, deleteService,
};

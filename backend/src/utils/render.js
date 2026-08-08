const axios = require("axios");

// Thin wrapper around the Render API (v1) for deploying bot instances.
// Docs: https://api-docs.render.com
const render = axios.create({
  baseURL: "https://api.render.com/v1",
  headers: {
    Authorization: `Bearer ${process.env.RENDER_API_KEY}`,
    "Content-Type": "application/json",
  },
});

function isConfigured() {
  return Boolean(process.env.RENDER_API_KEY);
}

// Render services belong to an "owner" (your account/workspace) — fetch the
// first available owner id once and reuse it for every service we create.
let cachedOwnerId = null;
async function getOwnerId() {
  if (cachedOwnerId) return cachedOwnerId;
  const { data } = await render.get("/owners?limit=1");
  cachedOwnerId = data[0]?.owner?.id;
  if (!cachedOwnerId) throw new Error("Could not resolve a Render owner id for this API key.");
  return cachedOwnerId;
}

// Creates a new web service from a public GitHub repo and deploys it.
// NOTE: assumes a standard Node.js repo (npm install / npm start). If a bot's
// repo uses a different start command, set it via bot.renderStartCommand in
// future — for now this uses sensible Node.js defaults.
async function createService({ name, repoUrl, envVars }) {
  const ownerId = await getOwnerId();
  const { data } = await render.post("/services", {
    type: "web_service",
    name,
    ownerId,
    repo: repoUrl,
    branch: "main",
    autoDeploy: "yes",
    serviceDetails: {
      env: "node",
      plan: "starter",
      buildCommand: "npm install",
      startCommand: "npm start",
      envSpecificDetails: { buildCommand: "npm install", startCommand: "npm start" },
    },
    envVars: Object.entries(envVars).map(([key, value]) => ({ key, value })),
  });
  return data; // includes data.service.id, data.service.serviceDetails.url
}

async function getService(serviceId) {
  const { data } = await render.get(`/services/${serviceId}`);
  return data;
}

// Polls the latest deploy for a service until it's live/failed (Render has
// no simple synchronous build endpoint like Heroku's builds API).
async function getLatestDeploy(serviceId) {
  const { data } = await render.get(`/services/${serviceId}/deploys?limit=1`);
  return data[0]?.deploy; // { id, status: "created"|"build_in_progress"|"live"|"deactivated"|"build_failed"|... }
}

async function suspendService(serviceId) {
  await render.post(`/services/${serviceId}/suspend`);
}
async function resumeService(serviceId) {
  await render.post(`/services/${serviceId}/resume`);
}
async function deleteService(serviceId) {
  await render.delete(`/services/${serviceId}`);
}

module.exports = {
  isConfigured, getOwnerId, createService, getService,
  getLatestDeploy, suspendService, resumeService, deleteService,
};

const axios = require("axios");

// Thin wrapper around the Heroku Platform API (v3) used to actually create
// and deploy bot instances when a user completes the deployment flow.
// Docs: https://devcenter.heroku.com/articles/platform-api-reference
const heroku = axios.create({
  baseURL: "https://api.heroku.com",
  headers: {
    Accept: "application/vnd.heroku+json; version=3",
    Authorization: `Bearer ${process.env.HEROKU_API_KEY}`,
    "Content-Type": "application/json",
  },
});

function isConfigured() {
  return Boolean(process.env.HEROKU_API_KEY);
}

// Creates a new Heroku app with the given name (must be lowercase, start with a letter,
// only contain letters/numbers/dashes — already enforced by generateAppName()).
async function createApp(appName, region = "us") {
  const { data } = await heroku.post("/apps", { name: appName, region });
  return data; // includes data.id, data.web_url, etc.
}

// Sets config vars (env) on the app. ONLY the bot's session ID should ever be
// passed here for a user's bot — never owner name/number/personal details.
async function setConfigVars(appName, vars) {
  const { data } = await heroku.patch(`/apps/${appName}/config-vars`, vars);
  return data;
}

// Deploys source code to the app using a build from a tarball URL (e.g. a GitHub
// codeload tarball for the bot's repo). Returns a build object you can poll for status.
async function createBuild(appName, sourceTarballUrl) {
  const { data } = await heroku.post(`/apps/${appName}/builds`, {
    source_blob: { url: sourceTarballUrl },
  });
  return data; // data.id is the build id, data.status starts as "pending"
}

async function getBuild(appName, buildId) {
  const { data } = await heroku.get(`/apps/${appName}/builds/${buildId}`);
  return data; // data.status: "pending" | "succeeded" | "failed"
}

// Streams the build's output log via its `output_stream_url` (a plain text SSE-ish stream).
// Call this in a background task and pipe each line into the deployment's socket room.
async function streamBuildLog(outputStreamUrl, onLine) {
  const response = await axios.get(outputStreamUrl, { responseType: "stream" });
  response.data.on("data", (chunk) => {
    chunk
      .toString()
      .split("\n")
      .filter(Boolean)
      .forEach((line) => onLine(line));
  });
  return new Promise((resolve, reject) => {
    response.data.on("end", resolve);
    response.data.on("error", reject);
  });
}

async function restartApp(appName) {
  await heroku.delete(`/apps/${appName}/dynos`);
}

async function scaleDown(appName) {
  await heroku.patch(`/apps/${appName}/formation`, {
    updates: [{ type: "web", quantity: 0 }],
  });
}

async function deleteApp(appName) {
  await heroku.delete(`/apps/${appName}`);
}

module.exports = {
  isConfigured,
  createApp,
  setConfigVars,
  createBuild,
  getBuild,
  streamBuildLog,
  restartApp,
  scaleDown,
  deleteApp,
};

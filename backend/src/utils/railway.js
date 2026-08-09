const axios = require("axios");

// Railway's public API is GraphQL-based. Docs: https://docs.railway.app/reference/public-api
const client = axios.create({
  baseURL: "https://backboard.railway.app/graphql/v2",
  headers: {
    Authorization: `Bearer ${process.env.RAILWAY_API_TOKEN}`,
    "Content-Type": "application/json",
  },
});

function isConfigured() {
  return Boolean(process.env.RAILWAY_API_TOKEN);
}

async function gql(query, variables) {
  const { data } = await client.post("", { query, variables });
  if (data.errors) throw new Error(data.errors.map((e) => e.message).join("; "));
  return data.data;
}

// Requires RAILWAY_PROJECT_ID (the project new services get created into) —
// set this alongside RAILWAY_API_TOKEN. Railway services live inside a project.
async function createServiceFromRepo({ name, repoUrl }) {
  const projectId = process.env.RAILWAY_PROJECT_ID;
  if (!projectId) throw new Error("RAILWAY_PROJECT_ID is not set");

  const data = await gql(
    `mutation($input: ServiceCreateInput!) {
      serviceCreate(input: $input) { id name }
    }`,
    { input: { projectId, name, source: { repo: repoUrl } } }
  );
  return data.serviceCreate; // { id, name }
}

async function setVariables(serviceId, environmentId, vars) {
  for (const [name, value] of Object.entries(vars)) {
    await gql(
      `mutation($input: VariableUpsertInput!) { variableUpsert(input: $input) }`,
      { input: { projectId: process.env.RAILWAY_PROJECT_ID, environmentId, serviceId, name, value } }
    );
  }
}

async function getLatestDeployment(serviceId, environmentId) {
  const data = await gql(
    `query($serviceId: String!, $environmentId: String!) {
      deployments(input: { serviceId: $serviceId, environmentId: $environmentId }, first: 1) {
        edges { node { id status } }
      }
    }`,
    { serviceId, environmentId }
  );
  return data.deployments.edges[0]?.node; // { id, status: "BUILDING"|"SUCCESS"|"FAILED"|"CRASHED"|... }
}

async function deleteService(serviceId) {
  await gql(`mutation($id: String!) { serviceDelete(id: $id) }`, { id: serviceId });
}

async function restartService(serviceId, environmentId) {
  await gql(
    `mutation($input: ServiceInstanceRedeployInput!) { serviceInstanceRedeploy(input: $input) }`,
    { input: { serviceId, environmentId } }
  );
}

module.exports = {
  isConfigured, createServiceFromRepo, setVariables,
  getLatestDeployment, deleteService, restartService,
};

const axios = require("axios");

// IMPORTANT — honesty note: Replit does not currently offer a public,
// documented REST API for programmatically creating a NEW Repl from an
// external GitHub repo and deploying it, the way Heroku/Render/Railway do.
// Their deployment API (GraphQL, used internally by replit.com) is not
// publicly documented or stable for third-party use.
//
// What IS reliably possible with a Replit account token: importing a GitHub
// repo as a new Repl via their internal GraphQL endpoint works in practice
// for many accounts, so this is implemented on a best-effort basis. If it
// stops working (Replit changes/locks the endpoint), deployments for this
// platform will simply log the failure and the admin can create/link the
// Repl manually instead — the bot's data (session ID, owner info) is already
// captured either way.
const client = axios.create({
  baseURL: "https://replit.com/graphql",
  headers: {
    "Content-Type": "application/json",
    Cookie: process.env.REPLIT_CONNECT_SID ? `connect.sid=${process.env.REPLIT_CONNECT_SID}` : "",
  },
});

function isConfigured() {
  return Boolean(process.env.REPLIT_CONNECT_SID);
}

async function importFromGithub({ repoUrl, title }) {
  const { data } = await client.post("", {
    query: `
      mutation ImportRepl($repoUrl: String!, $title: String!) {
        importFromGithub(repoUrl: $repoUrl, title: $title) { id slug url }
      }
    `,
    variables: { repoUrl, title },
  });
  if (data.errors) throw new Error(data.errors.map((e) => e.message).join("; "));
  return data.data.importFromGithub; // { id, slug, url }
}

module.exports = { isConfigured, importFromGithub };

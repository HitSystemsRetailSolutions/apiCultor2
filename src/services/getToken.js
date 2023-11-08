// getToken.js
require('dotenv').config();

async function obtainToken() {
  console.log("Hola xD");

  try {
    const fetch = await import("node-fetch"); // Use dynamic import

    const url = `https://login.microsoftonline.com/${process.env.tenant}/oauth2/v2.0/token`;
    const params = new URLSearchParams();

    params.append("tenant", process.env.tenant);
    params.append("token_type", process.env.token_type);
    params.append("grant_type", process.env.grant_type);
    params.append("client_id", process.env.client_id);
    params.append("client_secret", process.env.client_secret);
    params.append("scope", process.env.scope);

    console.log(params);

    const response = await fetch.default(url, {
      method: "POST",
      body: params,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!response.ok) {
      throw new Error("Failed to obtain access token");
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error(error);
    throw error; // Rethrow the error for handling in your Express route
  }
}

module.exports = obtainToken;

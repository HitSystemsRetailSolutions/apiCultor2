// getToken.js
require('dotenv').config();

async function obtainToken() {
  console.log("Hola xD");

  try {
    const fetch = await import("node-fetch"); // Use dynamic import

    const url = `https://login.microsoftonline.com/${process.env.tenant}/oauth2/v2.0/token`;
    //const url = `https://login.microsoftonline.com/ace8eb1f-b96c-4ab5-91ae-4a66ffd58c96/oauth2/v2.0/token`;
    const params = new URLSearchParams();

    params.append("tenant", process.env.tenant);
    params.append("token_type", process.env.token_type);
    params.append("grant_type", process.env.grant_type);
    params.append("client_id", process.env.client_id);
    params.append("client_secret", process.env.client_secret);
    params.append("scope", process.env.scope);


    /*params.append("tenant",  'ace8eb1f-b96c-4ab5-91ae-4a66ffd58c96');
    params.append("token_type", 'Bearer');
    params.append("grant_type", 'client_credentials');
    params.append("client_id",  'a9a6ff14-bcc4-4cb5-a477-9be8d0b68a9e');
    params.append("client_secret", 'vAh8Q~BKbBROXYL_k4.8cnU5gs4yM13fa302uaGv');
    params.append("scope",'https://api.businesscentral.dynamics.com/.default');*/

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

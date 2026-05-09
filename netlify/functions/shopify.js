const SHOPIFY_DOMAIN = process.env.VELENE_SHOPIFY_DOMAIN || "kt9eiv-hx.myshopify.com";
const SHOPIFY_API_VERSION = process.env.VELENE_SHOPIFY_API_VERSION || "2025-07";
const STOREFRONT_TOKEN = process.env.VELENE_SHOPIFY_STOREFRONT_TOKEN || "1ca887a764afa08947b46d8fd50d5e8e";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  try {
    const response = await fetch(`https://${SHOPIFY_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query: body.query, variables: body.variables || {} }),
    });

    const text = await response.text();
    return {
      statusCode: response.status,
      headers,
      body: text,
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

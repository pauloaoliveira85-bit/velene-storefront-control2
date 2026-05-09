export const config = {
  shopifyDomain: "kt9eiv-hx.myshopify.com",
  apiVersion: "2025-07",
  storefrontToken: "1ca887a764afa08947b46d8fd50d5e8e",
  metaPixelId: "2021013312164721",
  shopifyProxyEndpoint: "/.netlify/functions/shopify",
  useShopifyProxy: true,
  currency: "EUR",
  defaultCollectionHandle: "frontpage",
  brandName: "VELENE",
};

export const shopifyEndpoint = `https://${config.shopifyDomain}/api/${config.apiVersion}/graphql.json`;

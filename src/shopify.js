import { config, shopifyEndpoint } from "./config.js";

const CART_STORAGE_KEY = "velene_staging_cart_id";

async function request(query, variables = {}) {
  const endpoint = config.useShopifyProxy ? config.shopifyProxyEndpoint : shopifyEndpoint;
  const headers = { "Content-Type": "application/json" };
  if (!config.useShopifyProxy) {
    headers["X-Shopify-Storefront-Access-Token"] = config.storefrontToken;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`Shopify returned an invalid response (${response.status})`);
  }

  if (!response.ok || payload.errors) {
    const message = payload.errors?.map((error) => error.message).join("; ") || payload.error || `Shopify request failed (${response.status})`;
    throw new Error(message);
  }
  return payload.data;
}

const productFields = `
  id
  handle
  title
  description
  productType
  availableForSale
  featuredImage { url altText width height }
  images(first: 8) { edges { node { url altText width height } } }
  priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
  variants(first: 40) {
    edges {
      node {
        id
        title
        availableForSale
        quantityAvailable
        price { amount currencyCode }
        selectedOptions { name value }
        image { url altText width height }
      }
    }
  }
`;

export async function getProducts(first = 24) {
  const data = await request(
    `query products($first: Int!) {
      products(first: $first, sortKey: BEST_SELLING) {
        edges { node { ${productFields} } }
      }
    }`,
    { first }
  );
  return data.products.edges.map((edge) => normalizeProduct(edge.node));
}

export async function getCollection(handle, first = 36) {
  const data = await request(
    `query collection($handle: String!, $first: Int!) {
      collection(handle: $handle) {
        id
        title
        handle
        description
        products(first: $first, sortKey: BEST_SELLING) {
          edges { node { ${productFields} } }
        }
      }
    }`,
    { handle, first }
  );
  if (!data.collection) return null;
  return {
    ...data.collection,
    products: data.collection.products.edges.map((edge) => normalizeProduct(edge.node)),
  };
}

export async function getProduct(handle) {
  const data = await request(
    `query product($handle: String!) {
      product(handle: $handle) { ${productFields} }
    }`,
    { handle }
  );
  return data.product ? normalizeProduct(data.product) : null;
}

export async function getCart() {
  const id = localStorage.getItem(CART_STORAGE_KEY);
  if (!id) return null;
  try {
    const data = await request(
      `query cart($id: ID!) {
        cart(id: $id) {
          id
          checkoutUrl
          totalQuantity
          cost { subtotalAmount { amount currencyCode } totalAmount { amount currencyCode } }
          lines(first: 100) {
            edges {
              node {
                id
                quantity
                cost { totalAmount { amount currencyCode } }
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    price { amount currencyCode }
                    image { url altText width height }
                    product { id handle title featuredImage { url altText width height } }
                    selectedOptions { name value }
                  }
                }
              }
            }
          }
        }
      }`,
      { id }
    );
    return normalizeCart(data.cart);
  } catch {
    localStorage.removeItem(CART_STORAGE_KEY);
    return null;
  }
}

export async function addToCart(variantId, quantity = 1) {
  const cart = await getCart();
  const data = cart
    ? await request(
        `mutation add($cartId: ID!, $lines: [CartLineInput!]!) {
          cartLinesAdd(cartId: $cartId, lines: $lines) { cart { id checkoutUrl totalQuantity } userErrors { field message } }
        }`,
        { cartId: cart.id, lines: [{ merchandiseId: variantId, quantity }] }
      )
    : await request(
        `mutation create($input: CartInput!) {
          cartCreate(input: $input) { cart { id checkoutUrl totalQuantity } userErrors { field message } }
        }`,
        { input: { lines: [{ merchandiseId: variantId, quantity }] } }
      );

  const result = data.cartLinesAdd || data.cartCreate;
  if (result.userErrors?.length) throw new Error(result.userErrors[0].message);
  localStorage.setItem(CART_STORAGE_KEY, result.cart.id);
  return getCart();
}

export async function updateCartLine(lineId, quantity) {
  const cart = await getCart();
  if (!cart) return null;
  const data = await request(
    `mutation update($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { id } userErrors { field message } }
    }`,
    { cartId: cart.id, lines: [{ id: lineId, quantity }] }
  );
  if (data.cartLinesUpdate.userErrors?.length) throw new Error(data.cartLinesUpdate.userErrors[0].message);
  return getCart();
}

export function normalizeProduct(product) {
  const variants = product.variants.edges.map((edge) => edge.node);
  const images = product.images.edges.map((edge) => edge.node);
  return { ...product, variants, images, firstAvailableVariant: variants.find((variant) => variant.availableForSale) || variants[0] };
}

function normalizeCart(cart) {
  if (!cart) return null;
  return { ...cart, lines: cart.lines.edges.map((edge) => edge.node) };
}

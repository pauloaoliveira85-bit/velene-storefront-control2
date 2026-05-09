import { config } from "./config.js";

let initialized = false;

export function initTracking() {
  if (initialized || !config.metaPixelId) return;
  initialized = true;

  window.veleneDataLayer = window.veleneDataLayer || [];
  if (!window.fbq) {
    /* Meta Pixel base code for staging validation. Purchase is intentionally not fired here. */
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  }
  window.fbq("init", config.metaPixelId);
}

export function trackPageView(path = location.pathname) {
  initTracking();
  push("PageView", { page_path: path });
  window.fbq?.("track", "PageView");
}

export function trackViewContent(product) {
  initTracking();
  const payload = productPayload(product);
  push("ViewContent", payload);
  window.fbq?.("track", "ViewContent", payload);
}

export function trackAddToCart(product, variant, quantity = 1) {
  initTracking();
  const payload = {
    ...productPayload(product, variant),
    value: roundMoney(Number(variant?.price?.amount || product?.priceRange?.minVariantPrice?.amount || 0) * quantity),
    num_items: quantity,
  };
  push("AddToCart", payload);
  window.fbq?.("track", "AddToCart", payload);
}

export function trackInitiateCheckout(cart) {
  initTracking();
  const payload = {
    content_type: "product",
    content_ids: cart?.lines?.map((line) => cleanId(line.merchandise.id)) || [],
    value: roundMoney(cart?.cost?.totalAmount?.amount || 0),
    currency: cart?.cost?.totalAmount?.currencyCode || config.currency,
    num_items: cart?.totalQuantity || 0,
  };
  push("InitiateCheckout", payload);
  window.fbq?.("track", "InitiateCheckout", payload);
}

function productPayload(product, variant = product?.firstAvailableVariant) {
  return {
    content_type: "product",
    content_ids: [cleanId(variant?.id || product?.id)],
    content_name: product?.title,
    value: roundMoney(variant?.price?.amount || product?.priceRange?.minVariantPrice?.amount || 0),
    currency: variant?.price?.currencyCode || product?.priceRange?.minVariantPrice?.currencyCode || config.currency,
  };
}

function push(event, payload) {
  window.veleneDataLayer.push({ event, ...payload, timestamp: new Date().toISOString() });
}

function cleanId(gid) {
  return String(gid || "").split("/").pop();
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

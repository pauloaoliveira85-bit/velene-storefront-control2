import { addToCart, getCart, getCollection, getProduct, getProducts, updateCartLine } from "./shopify.js";
import { trackAddToCart, trackInitiateCheckout, trackPageView, trackViewContent } from "./tracking.js";

const app = document.querySelector("#app");
let state = { cart: null };

window.addEventListener("popstate", renderRoute);
document.addEventListener("click", handleClick);
document.addEventListener("change", handleChange);

init();

async function init() {
  state.cart = await getCart();
  await renderRoute();
}

async function renderRoute() {
  trackPageView(location.pathname);
  renderShell("<div class='loader'>Chargement...</div>");
  const [, section, handle] = location.pathname.split("/");
  try {
    if (section === "products" || section === "product") {
      await renderProduct(handle);
      return;
    }
    if (section === "collections") {
      await renderCollection(handle || "all");
      return;
    }
    await renderHome();
  } catch (error) {
    renderShell(`<section class="notice"><h1>Erreur de chargement</h1><p>${escapeHtml(error.message)}</p></section>`);
  }
}

async function renderHome() {
  const products = await getProducts(24);
  renderShell(`
    <section class="hero">
      <p class="eyebrow">Mode feminine premium</p>
      <h1>VELENE</h1>
      <p>Pieces feminines elegantes, selectionnees pour une silhouette forte et intemporelle.</p>
      <a class="button" href="/collections/all" data-link>Voir la collection</a>
    </section>
    ${productGrid(products, "Meilleures ventes")}
  `);
}

async function renderCollection(handle) {
  const collection = handle === "all" ? null : await getCollection(handle);
  const products = collection?.products || (await getProducts(36));
  renderShell(`
    <section class="page-head">
      <p class="eyebrow">Collection</p>
      <h1>${escapeHtml(collection?.title || "Toutes les pieces")}</h1>
      <p>${escapeHtml(collection?.description || "Selection VELENE disponible pour la France.")}</p>
    </section>
    ${productGrid(products)}
  `);
}

async function renderProduct(handle) {
  const product = await getProduct(handle);
  if (!product) {
    renderShell(`<section class="notice"><h1>Produit introuvable</h1><p>Ce produit n'est pas disponible sur le staging.</p></section>`);
    return;
  }
  trackViewContent(product);
  const variantOptions = product.variants
    .map((variant) => `<option value="${variant.id}" ${variant.availableForSale ? "" : "disabled"}>${escapeHtml(variant.title)} - ${money(variant.price)}</option>`)
    .join("");
  const images = product.images.length ? product.images : [product.featuredImage].filter(Boolean);
  renderShell(`
    <section class="product">
      <div class="gallery">
        ${images.map((image) => `<img src="${image.url}" alt="${escapeHtml(image.altText || product.title)}" loading="lazy" />`).join("")}
      </div>
      <div class="product-info">
        <p class="eyebrow">${escapeHtml(product.productType || "VELENE")}</p>
        <h1>${escapeHtml(product.title)}</h1>
        <p class="price">${money(product.priceRange.minVariantPrice)}</p>
        <div class="description">${paragraphs(product.description)}</div>
        <label class="field">Taille / variante
          <select id="variant-select">${variantOptions}</select>
        </label>
        <button class="button full" data-add-to-cart="${product.handle}">Ajouter au panier</button>
        <div class="assurance">
          <span>Livraison standard offerte</span>
          <span>Retours possibles sous 14 jours apres reception</span>
          <span>Paiement securise par carte bancaire ou PayPal</span>
        </div>
      </div>
    </section>
  `);
}

function renderShell(content) {
  app.innerHTML = `
    <header class="site-header">
      <a class="brand" href="/" data-link>VELENE</a>
      <nav>
        <a href="/collections/all" data-link>Collection</a>
        <button class="cart-button" data-open-cart>Panier (${state.cart?.totalQuantity || 0})</button>
      </nav>
    </header>
    <main>${content}</main>
    ${cartDrawer()}
    <footer class="site-footer">Staging technique - ne pas utiliser comme production avant QA complet.</footer>
  `;
}

function productGrid(products, title = "") {
  return `
    <section class="grid-section">
      ${title ? `<h2>${escapeHtml(title)}</h2>` : ""}
      <div class="product-grid">
        ${products
          .map(
            (product) => `
          <a class="card" href="/products/${product.handle}" data-link>
            <img src="${product.featuredImage?.url || ""}" alt="${escapeHtml(product.featuredImage?.altText || product.title)}" loading="lazy" />
            <span>${escapeHtml(product.title)}</span>
            <strong>${money(product.priceRange.minVariantPrice)}</strong>
          </a>`
          )
          .join("")}
      </div>
    </section>
  `;
}

function cartDrawer() {
  const lines = state.cart?.lines || [];
  return `
    <aside class="cart" id="cart" aria-hidden="true">
      <div class="cart-panel">
        <div class="cart-head">
          <h2>Panier</h2>
          <button data-close-cart>Fermer</button>
        </div>
        ${
          lines.length
            ? lines
                .map(
                  (line) => `
            <div class="cart-line">
              <img src="${line.merchandise.image?.url || line.merchandise.product.featuredImage?.url || ""}" alt="" />
              <div>
                <strong>${escapeHtml(line.merchandise.product.title)}</strong>
                <span>${escapeHtml(line.merchandise.title)}</span>
                <input type="number" min="0" value="${line.quantity}" data-line-quantity="${line.id}" />
              </div>
              <b>${money(line.cost.totalAmount)}</b>
            </div>`
                )
                .join("")
            : "<p>Votre panier est vide.</p>"
        }
        <div class="cart-total">
          <span>Total</span>
          <strong>${money(state.cart?.cost?.totalAmount)}</strong>
        </div>
        <button class="button full" data-checkout ${lines.length ? "" : "disabled"}>Finaliser la commande</button>
      </div>
    </aside>
  `;
}

async function handleClick(event) {
  const link = event.target.closest("[data-link]");
  if (link) {
    event.preventDefault();
    history.pushState({}, "", link.getAttribute("href"));
    renderRoute();
    return;
  }

  if (event.target.closest("[data-open-cart]")) document.querySelector("#cart").setAttribute("aria-hidden", "false");
  if (event.target.closest("[data-close-cart]")) document.querySelector("#cart").setAttribute("aria-hidden", "true");

  const addButton = event.target.closest("[data-add-to-cart]");
  if (addButton) {
    addButton.disabled = true;
    const product = await getProduct(addButton.dataset.addToCart);
    const variantId = document.querySelector("#variant-select").value;
    const variant = product.variants.find((item) => item.id === variantId);
    state.cart = await addToCart(variantId, 1);
    trackAddToCart(product, variant, 1);
    renderRoute();
    setTimeout(() => document.querySelector("#cart")?.setAttribute("aria-hidden", "false"), 50);
  }

  if (event.target.closest("[data-checkout]")) {
    state.cart = await getCart();
    trackInitiateCheckout(state.cart);
    if (state.cart?.checkoutUrl) location.href = state.cart.checkoutUrl;
  }
}

async function handleChange(event) {
  const input = event.target.closest("[data-line-quantity]");
  if (!input) return;
  state.cart = await updateCartLine(input.dataset.lineQuantity, Number(input.value));
  renderRoute();
  setTimeout(() => document.querySelector("#cart")?.setAttribute("aria-hidden", "false"), 50);
}

function money(value) {
  if (!value) return "";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: value.currencyCode || "EUR" }).format(Number(value.amount));
}

function paragraphs(text = "") {
  return String(text)
    .split(/\n+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

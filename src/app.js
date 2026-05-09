import { addToCart, getCart, getCollection, getProduct, getProducts, updateCartLine } from "./shopify.js";
import { trackAddToCart, trackInitiateCheckout, trackPageView, trackViewContent } from "./tracking.js";

const app = document.querySelector("#app");

const collections = [
  { title: "Nouvelle Collection Glow", handle: "nouvelle-collection-glow", description: "Les nouveautés Velène, pensées pour une allure lumineuse." },
  { title: "Robes Longues", handle: "robes-longues", description: "L'élégance absolue en silhouettes longues, pour les soirs d'apparat." },
  { title: "Robes Mi-Longue", handle: "robes-mi-longue", description: "Des longueurs raffinées pour le quotidien et les sorties élégantes." },
  { title: "Robes Mini", handle: "robes-mini", description: "Des coupes courtes, féminines et affirmées." },
  { title: "Robes Gainantes", handle: "robes-gainantes", description: "Des robes structurées pour souligner la silhouette." },
  { title: "Corsets & Tops", handle: "corsets-tops", description: "Corsets, bustiers et tops à forte présence visuelle." },
  { title: "Cardigans", handle: "cardigans", description: "Mailles douces et pièces de transition." },
  { title: "Magnolias", handle: "magnolias", description: "Sélection Magnolia, romantique et intemporelle." },
  { title: "Meilleures Ventes", handle: "meilleures-ventes", description: "Les pièces les plus demandées de la Maison." },
];

let state = { cart: null, selectedImage: 0 };

window.addEventListener("popstate", renderRoute);
document.addEventListener("click", handleClick);
document.addEventListener("change", handleChange);

init();

async function init() {
  try {
    state.cart = await getCart();
  } catch {
    state.cart = null;
  }
  await renderRoute();
}

async function renderRoute() {
  trackPageView(location.pathname);
  renderShell("<div class='loader'>Chargement...</div>");
  const [, section, handle] = location.pathname.split("/");

  try {
    if (section === "product" || section === "products") {
      await renderProduct(handle);
      return;
    }
    if (section === "collections") {
      await renderCollection(handle || "all");
      return;
    }
    if (section === "nouveautes") {
      await renderCollection("nouvelle-collection-glow");
      return;
    }
    await renderHome();
  } catch (error) {
    renderShell(`<section class="notice"><h1>Erreur de chargement</h1><p>${escapeHtml(error.message)}</p></section>`);
  }
}

async function renderHome() {
  const products = await getProducts(18);
  const heroProduct = products.find((product) => product.featuredImage) || products[0];
  renderShell(`
    <section class="home-hero">
      <img src="${heroProduct?.featuredImage?.url || ""}" alt="Velène — Maison de couture parisienne" />
      <div class="hero-logo" aria-label="velène">${letters("velène")}</div>
      <a class="hero-cta" href="/nouveautes" data-link>Découvrir la collection</a>
    </section>
    ${collectionTiles(products)}
    <section class="offer-band">
      <div class="pill-row">
        <button>Achetez 1, Obtenez 2</button>
        <button>Offres</button>
      </div>
      <p>Sélection exclusive — édition limitée</p>
    </section>
    ${productGrid(products, "Meilleures Ventes", "product-rail")}
  `);
}

async function renderCollection(handle) {
  const meta = collections.find((item) => item.handle === handle);
  const collection = handle === "all" ? null : await getCollection(handle);
  const products = collection?.products || (await getProducts(48));
  const heroImage = products.find((product) => product.featuredImage)?.featuredImage;
  renderShell(`
    <section class="collection-hero">
      <img src="${heroImage?.url || ""}" alt="${escapeHtml(meta?.title || collection?.title || "Collection Velène")}" />
      <div>
        <p>Nouveau</p>
        <h1>${escapeHtml(meta?.title || collection?.title || "Toutes les pièces")}</h1>
        <span>${escapeHtml(meta?.description || collection?.description || "Sélection Velène disponible pour la France.")}</span>
        <a href="/" data-link>Retour à l'accueil</a>
      </div>
    </section>
    <section class="collection-toolbar">
      <p>${products.length} produits</p>
      <div>
        <button>Trier : <strong>En vedette</strong></button>
        <button>Grande</button>
        <button>Compact</button>
        <button>Liste</button>
      </div>
    </section>
    <section class="collection-layout">
      <aside class="filters">
        <button>Disponibilité</button>
        <button>Prix</button>
      </aside>
      ${productGrid(products, "", "catalog-grid")}
    </section>
  `);
}

async function renderProduct(handle) {
  const product = await getProduct(handle);
  if (!product) {
    renderShell(`<section class="notice"><h1>Produit introuvable</h1><p>Ce produit n'est pas disponible sur le staging.</p></section>`);
    return;
  }

  trackViewContent(product);
  const images = product.images.length ? product.images : [product.featuredImage].filter(Boolean);
  renderShell(`
    <section class="breadcrumb">
      <a href="/" data-link>Retour à l'accueil</a>
      <span>Accueil</span>
      <span>Nouveautés</span>
      <strong>${escapeHtml(product.title)}</strong>
    </section>
    <section class="product-page">
      <div class="product-media">
        <div class="main-image">
          <img src="${images[0]?.url || ""}" alt="${escapeHtml(images[0]?.altText || product.title)}" />
          <span>1 / ${Math.max(images.length, 1)}</span>
        </div>
        <div class="thumbs">
          ${images
            .slice(0, 18)
            .map((image) => `<button><img src="${image.url}" alt="${escapeHtml(image.altText || product.title)}" /></button>`)
            .join("")}
        </div>
      </div>
      <div class="product-panel">
        <h1>${escapeHtml(product.title)}</h1>
        ${priceBlock(product)}
        <p class="cashback">Bénéficiez de 10% de cashback sur votre prochain achat</p>
        <p class="paypal">Payez en 4× sans frais via PayPal</p>
        ${variantSelector(product)}
        <button class="add-button" data-add-to-cart="${product.handle}">Ajouter au panier</button>
        <div class="service-list">
          <p><strong>Livraison standard offerte</strong><span>7 à 12 jours ouvrés. Option premium DHL : 5 à 7 jours ouvrés. Préparation sous 24 à 48 h ouvrées.</span></p>
          <p><strong>1er échange gratuit</strong><span>Facilité et sécurité pour votre achat.</span></p>
        </div>
        ${accordion("Description", productDescription(product))}
        ${accordion("Coupe & matière", "<p>Silhouette féminine, finition soignée et matière sélectionnée pour un porté élégant.</p>")}
        ${accordion("Manuel d'entretien", "<p>Lavage délicat recommandé. Évitez le sèche-linge afin de préserver la coupe et la matière.</p>")}
      </div>
    </section>
    ${reviews()}
    ${productGrid(await getProducts(12), "Achetez aussi", "product-rail")}
  `);
}

function renderShell(content) {
  app.innerHTML = `
    <header class="site-header">
      <div class="topbar"><span>✦</span> 10% de cashback</div>
      <div class="nav-row">
        <a class="brand" href="/" data-link>VELÈNE</a>
        <nav>
          <a href="/collections/nouvelle-collection-glow" data-link>Nouveautés</a>
          <a href="/collections" data-link>Robes</a>
          <a href="/collections/corsets-tops" data-link>Corsets</a>
          <a href="/collections/magnolias" data-link>Magnolias</a>
        </nav>
        <div class="header-actions">
          <button>Compte</button>
          <button>Buscar</button>
          <button data-open-cart>Panier</button>
        </div>
      </div>
    </header>
    <main>${content}</main>
    ${cartDrawer()}
    ${footer()}
  `;
}

function collectionTiles(products) {
  return `
    <section class="collection-tiles">
      ${collections
        .map((collection, index) => {
          const product = products[index % Math.max(products.length, 1)];
          return `
            <a href="/collections/${collection.handle}" data-link>
              <img src="${product?.featuredImage?.url || ""}" alt="${escapeHtml(collection.title)}" />
              <span>${escapeHtml(collection.title)}</span>
            </a>`;
        })
        .join("")}
    </section>
  `;
}

function productGrid(products, title = "", className = "") {
  return `
    <section class="grid-section ${className}">
      ${title ? `<h2>${escapeHtml(title)}</h2>` : ""}
      <div class="product-grid">
        ${products.map(productCard).join("")}
      </div>
    </section>
  `;
}

function productCard(product) {
  const compare = comparePrice(product);
  const discount = discountPercent(product);
  return `
    <a class="product-card" href="/product/${product.handle}" data-link>
      <figure>
        <img src="${product.featuredImage?.url || ""}" alt="${escapeHtml(product.featuredImage?.altText || product.title)}" loading="lazy" />
        <button type="button">Ajouter au panier</button>
        ${discount ? `<span>-${discount}%</span>` : ""}
      </figure>
      <h3>${escapeHtml(product.title)}</h3>
      <p>${money(product.priceRange.minVariantPrice)} ${compare ? `<s>${money(compare)}</s>` : ""}</p>
    </a>
  `;
}

function variantSelector(product) {
  const options = product.variants
    .map((variant) => `<option value="${variant.id}" ${variant.availableForSale ? "" : "disabled"}>${escapeHtml(variant.title)} - ${money(variant.price)}</option>`)
    .join("");
  const colorValues = optionValues(product, ["Couleur", "Color"]);
  const sizeValues = optionValues(product, ["Taille", "Size"]);
  return `
    ${colorValues.length ? `<p class="option-label"><strong>Couleur :</strong> ${escapeHtml(colorValues[0])}</p><div class="swatches">${colorValues.map((value) => `<button>${escapeHtml(value)}</button>`).join("")}</div>` : ""}
    ${sizeValues.length ? `<div class="size-head"><p>Taille</p><button>Guide des tailles</button></div><div class="sizes">${sizeValues.map((value) => `<button>${escapeHtml(value)}</button>`).join("")}</div>` : ""}
    <label class="variant-fallback">Variante
      <select id="variant-select">${options}</select>
    </label>
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
        <button class="add-button" data-checkout ${lines.length ? "" : "disabled"}>Finaliser la commande</button>
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
    try {
      const product = await getProduct(addButton.dataset.addToCart);
      const variantId = document.querySelector("#variant-select").value;
      const variant = product.variants.find((item) => item.id === variantId);
      state.cart = await addToCart(variantId, 1);
      trackAddToCart(product, variant, 1);
      renderRoute();
      setTimeout(() => document.querySelector("#cart")?.setAttribute("aria-hidden", "false"), 50);
    } finally {
      addButton.disabled = false;
    }
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

function footer() {
  return `
    <footer class="site-footer">
      <section>
        <h3>Rejoignez la Maison</h3>
        <p>Inscrivez-vous et recevez en avant-première nos nouveautés, offres exclusives et invitations privées.</p>
        <form><input placeholder="Votre adresse email" /><button>S'inscrire</button></form>
      </section>
      <section class="footer-grid">
        <div><h3>Velène</h3><p>Une mode féminine, élégante et intemporelle pour la femme moderne.</p></div>
        <div><h4>Service Client</h4><a href="mailto:bonjour@maisonvelene.fr">bonjour@maisonvelene.fr</a><span>Lun-Ven : 09h à 18h</span><a href="/contact">Nous contacter</a><a href="/faq">FAQ</a></div>
        <div><h4>Mes commandes</h4><a href="/commandes/suivre">Suivre votre commande</a><a href="/commandes/mes-commandes">Mes commandes</a><a href="/commandes/retours">Échanges et retours</a></div>
        <div><h4>Informations</h4><a href="/informations/politique-confidentialite">Politique de confidentialité</a><a href="/informations/politique-expedition">Politique d'expédition</a><a href="/informations/devenir-influenceuse">Devenir influenceuse</a></div>
      </section>
      <p class="copyright">Paiement sécurisé · Livraison suivie · © 2026 VELÈNE. Tous droits réservés.</p>
    </footer>
  `;
}

function reviews() {
  return `
    <section class="reviews">
      <p>Avis clients</p>
      <h2>Ce que disent nos clientes</h2>
      <strong>5.0</strong><span>5 avis</span>
      <div class="review-grid">
        ${[
          ["Superbe robe élégante", "La coupe est magnifique et le tombé très féminin.", "Louise"],
          ["Qualité irréprochable", "Le tissu donne une vraie impression premium.", "Manon"],
          ["Magnifique et confortable", "Très agréable à porter et parfaite pour sortir.", "Amélie"],
        ]
          .map(([title, text, name]) => `<article><b>★★★★★</b><h4>${title}</h4><p>${text}</p><span>— ${name}</span></article>`)
          .join("")}
      </div>
    </section>
  `;
}

function accordion(title, content) {
  return `<details open><summary>${escapeHtml(title)}</summary>${content}</details>`;
}

function productDescription(product) {
  const body = paragraphs(product.description);
  return body || "<p>Pièce sélectionnée pour une silhouette féminine, élégante et intemporelle.</p>";
}

function optionValues(product, names) {
  const values = new Set();
  for (const variant of product.variants) {
    for (const option of variant.selectedOptions || []) {
      if (names.includes(option.name)) values.add(option.value);
    }
  }
  return [...values];
}

function priceBlock(product) {
  const compare = comparePrice(product);
  return `<p class="price-line"><strong>${money(product.priceRange.minVariantPrice)}</strong>${compare ? `<s>${money(compare)}</s>` : ""}</p>`;
}

function comparePrice(product) {
  const fromVariant = product.variants.map((variant) => variant.compareAtPrice).find(Boolean);
  return product.compareAtPriceRange?.minVariantPrice?.amount !== "0.0" ? product.compareAtPriceRange?.minVariantPrice || fromVariant : fromVariant;
}

function discountPercent(product) {
  const current = Number(product.priceRange.minVariantPrice?.amount || 0);
  const compare = Number(comparePrice(product)?.amount || 0);
  if (!current || !compare || compare <= current) return "";
  return Math.round(((compare - current) / compare) * 100);
}

function money(value) {
  if (!value) return "";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: value.currencyCode || "EUR", maximumFractionDigits: 0 }).format(Number(value.amount));
}

function paragraphs(text = "") {
  return String(text)
    .split(/\n+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

function letters(text) {
  return [...text].map((letter) => `<span>${escapeHtml(letter)}</span>`).join("");
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

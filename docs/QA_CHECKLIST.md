# VELENE Staging QA Checklist

Use this checklist before pointing any domain or campaign traffic to this project.

## Functional

- Home opens on desktop and mobile.
- Collection route opens: `/collections/all`.
- Product route opens: `/products/{handle}`.
- Product images, title, price, variant selector and CTA render.
- Add to cart creates or updates Shopify cart.
- Cart quantity update works.
- Checkout button redirects to Shopify checkout URL.
- Checkout language, currency and payment options remain correct.

## Tracking

- Meta Events Manager receives `PageView` from the staging frontend.
- Product page fires `ViewContent`.
- Add to cart fires `AddToCart` with `content_ids`, `value` and `currency: EUR`.
- Checkout click fires `InitiateCheckout` with cart value and variant IDs.
- Frontend does not fire `Purchase`.
- Shopify/checkout remains the only source of `Purchase`.

## Production Parity

- Compare product prices against Shopify admin.
- Compare top ad destination URLs against staging.
- Compare mobile layout against current `maisonvelene.fr`.
- Confirm no DNS, campaign or production pixel setting was changed during QA.

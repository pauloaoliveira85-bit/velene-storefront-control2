# VELENE Storefront Control

Parallel staging storefront for VELENE.

This project does not touch production. It is a controlled headless storefront that connects to the current Shopify Storefront API and adds frontend Meta tracking for the events missing from the current Lovable deployment.

## Current Integration

- Shopify domain: `kt9eiv-hx.myshopify.com`
- Storefront API version: `2025-07`
- Meta Pixel ID: `2021013312164721`
- Purchase tracking: intentionally not fired here to avoid duplication with Shopify checkout.

## Run Locally

```bash
node scripts/serve.mjs
```

Open:

```text
http://localhost:4173
```

## Deploy on Netlify

- Build command: leave empty.
- Publish directory: `.`

Netlify uses `/.netlify/functions/shopify` as the Shopify bridge. This keeps Shopify requests controlled by the staging project and avoids browser-side Storefront API failures.

Optional Netlify environment variables:

- `VELENE_SHOPIFY_DOMAIN`
- `VELENE_SHOPIFY_API_VERSION`
- `VELENE_SHOPIFY_STOREFRONT_TOKEN`

## Why This Exists

The public site currently runs as a headless frontend. Shopify checkout events work, but frontend journey events on `maisonvelene.fr` were not confirmed:

- `PageView`
- `ViewContent`
- `AddToCart`
- frontend-side `InitiateCheckout`

This project isolates those events in `src/tracking.js`, while keeping `Purchase` out of the frontend.

## Before Production

Follow `docs/QA_CHECKLIST.md` and `docs/ROLLOUT.md`. Do not point `maisonvelene.fr` here until staging passes the full checklist.

## Control Documents

- `docs/PARALLEL_INFRASTRUCTURE.md`: full zero-interference architecture.
- `docs/SHOPIFY_CLONE_CHECKLIST.md`: steps if a second Shopify store is needed.
- `docs/TRACKING_ARCHITECTURE.md`: Meta event ownership and duplication rules.
- `docs/CUTOVER_DECISION_TREE.md`: when to use preview, staging domain, new domain, new Shopify, or production cutover.

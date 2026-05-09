# Shopify Clone Checklist

Use this only if we create a second Shopify store for full isolation.

## Store Identity

- Store name: `VELENE Control` or `VELENE Staging`.
- Temporary myshopify domain: `velene-control.myshopify.com` or equivalent.
- Do not connect `maisonvelene.fr`.
- Do not disconnect any domain from the production Shopify.

## Data To Export From Current Store

From Shopify admin, export:

- Products CSV.
- Customers CSV only if needed; not required for storefront QA.
- Discount codes if `WELCOME10` or equivalent must be tested.
- Legal pages content.
- Shipping rates/profiles screenshots or export if available.
- Markets/currency setup screenshots.
- Checkout language screenshots.
- Transactional email templates/screenshots.

Shopify's own duplication guidance says products and customers can be backed up with CSV, while apps/settings/shipping/taxes/checkout/payments must be manually reconfigured.

## Data To Rebuild Manually

- Collections and navigation if not preserved through product CSV.
- Menus.
- Legal pages.
- Shipping:
  - standard France free shipping;
  - premium DHL if used;
  - delivery promise: 7-12 business days standard after dispatch.
- Checkout language: French.
- Customer events/pixels.
- Meta/Facebook sales channel if needed for test only.
- Payment methods:
  - configure only when ready for isolated transaction test;
  - do not reuse production assumptions without checking fees/settlement.

## QA Before Using Clone For Decisions

- Product count matches expected catalog.
- Prices match current Shopify.
- Product variants and availability match.
- Cart works.
- Checkout works.
- Shipping rates display correctly.
- Test payment and refund pass if gateways are connected.
- Meta Pixel events are not duplicated.

## What Not To Do

- Do not migrate `maisonvelene.fr` to this clone before QA.
- Do not pause or alter current production campaign for clone setup.
- Do not install multiple tracking apps blindly.
- Do not fire frontend `Purchase`.


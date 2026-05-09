# Tracking Architecture

## Current Problem

Production checkout events reach Meta through Shopify, but frontend journey events are not reliably visible from the public headless domain.

Missing/uncertain in production:

- `PageView` on the public frontend.
- `ViewContent` on PDP.
- `AddToCart` on cart action.

Working/observed:

- `InitiateCheckout` from Shopify checkout domain.
- `Purchase`, if already validated by Shopify checkout.

## Controlled Staging Approach

The controlled storefront owns these browser events:

- `PageView`
- `ViewContent`
- `AddToCart`
- `InitiateCheckout`

The controlled storefront does not own:

- `Purchase`

Reason:

- Purchase must remain a checkout/order event to avoid duplicate ROAS and corrupted optimization.

## Required Event Payloads

### PageView

```js
fbq("track", "PageView")
```

### ViewContent

```js
fbq("track", "ViewContent", {
  content_type: "product",
  content_ids: ["variant_or_product_id"],
  content_name: "Product title",
  value: 65,
  currency: "EUR"
})
```

### AddToCart

```js
fbq("track", "AddToCart", {
  content_type: "product",
  content_ids: ["variant_id"],
  value: 65,
  currency: "EUR",
  num_items: 1
})
```

### InitiateCheckout

```js
fbq("track", "InitiateCheckout", {
  content_type: "product",
  content_ids: ["variant_id_1", "variant_id_2"],
  value: 130,
  currency: "EUR",
  num_items: 2
})
```

## QA Rule

Events Manager must show:

```text
frontend preview/staging URL -> PageView
frontend preview/staging URL -> ViewContent
frontend preview/staging URL -> AddToCart
frontend preview/staging URL -> InitiateCheckout
Shopify checkout/order -> Purchase
```

If `Purchase` appears twice for one order, staging fails.

## Shopify Pixel Notes

Shopify app pixels are the officially supported app-based approach inside Shopify's Web Pixels API. Custom pixels can collect events on more store pages but are advanced, sandboxed, and require JavaScript responsibility.

Sources:

- Shopify Help Center, "App pixels".
- Shopify Help Center, "Custom pixels".
- Shopify Help Center, "Testing custom pixels".


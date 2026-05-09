# Cutover Decision Tree

## Current State

Production keeps running until a separate controlled stack proves better.

## Decision 1 - Do We Need A New Shopify?

Use current Shopify Storefront API if:

- Staging can read products.
- Staging can create cart.
- Staging can redirect to checkout.
- Tracking can be tested without changing production settings.

Create new Shopify clone if:

- Current Shopify access/settings block isolated QA.
- We need to test checkout/payment/customer events without risk.
- We need a fully independent production replacement.

## Decision 2 - Do We Need A New Domain?

Use preview URL if:

- We are testing frontend behavior only.

Use `staging.maisonvelene.fr` if:

- Preview QA passes.
- We want realistic domain/subdomain tests.

Buy separate test domain if:

- We need isolated full checkout/domain QA.
- We do not want any DNS changes under `maisonvelene.fr`.

Do not move `maisonvelene.fr` until final cutover.

## Decision 3 - When Can Ads Point To The New Stack?

Only after:

- Product/PDP/cart/checkout QA passes.
- Events Manager QA passes.
- Purchase is not duplicated.
- Checkout currency/value is correct.
- Paulo approves a controlled ad destination test.

Initial ad test should be limited:

- One duplicated ad or small controlled campaign.
- Same creative.
- Same budget constraints.
- Compare click-to-checkout and purchase quality.

## Decision 4 - When Can Production Cut Over?

Only after:

- 48-72 hours of stable staging.
- Test order/refund done if checkout changed.
- DNS rollback documented.
- Old Lovable production retained as rollback.
- No active campaign learning window would be disrupted without reason.


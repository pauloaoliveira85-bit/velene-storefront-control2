# VELENE Parallel Infrastructure

Operational goal: build a fully controlled parallel commerce stack without changing the current production stack, campaign, domain, payment setup, or checkout.

## Non-Interference Rule

Current production remains untouched:

- Public production domain: `https://maisonvelene.fr`
- Current production frontend: Lovable/headless deployment
- Current Shopify store: `kt9eiv-hx.myshopify.com`
- Current Meta dataset/pixel: `2021013312164721`
- Current campaign destination and budget
- Current Stripe/PayPal/payment configuration

No DNS, Shopify, Meta Ads, checkout, app, or payment setting is changed until the parallel stack passes QA and Paulo approves a cutover window.

## Recommended Target Structure

### Layer 1 - Control Repository

Repository/project name:

```text
velene-storefront-control
```

Role:

- Source-controlled storefront owned by Paulo.
- No dependency on the previous Dev's Lovable deploy.
- Contains frontend, tracking module, QA checklists, rollout rules, and Shopify integration notes.

Current local path:

```text
C:\Users\Paulo\Desktop\Projetos\dropshipping\projeto 1 - Velène\velene-storefront-control
```

### Layer 2 - Staging Frontend

Initial staging must use a technical preview URL first:

```text
https://velene-storefront-control-[preview].vercel.app
```

or:

```text
https://velene-storefront-control-[preview].netlify.app
```

Only after preview QA passes, connect a staging subdomain:

```text
staging.maisonvelene.fr
```

This avoids touching the production apex domain while traffic is running.

### Layer 3 - Shopify Strategy

Use a two-step Shopify strategy.

#### Step A - Read-Only Integration With Current Shopify

Purpose:

- Reproduce catalog, PDP, cart, and checkout using the current store data.
- Validate frontend behavior and Meta browser events.
- Avoid touching current products, checkout, payments, domains, or apps.

Allowed:

- Storefront API read/cart operations.
- Redirect to existing Shopify checkout only in staging tests.

Blocked:

- Admin API writes.
- Product edits.
- Payment edits.
- Domain changes.
- App installs on current production Shopify.

#### Step B - Optional New Shopify Clone

Create a new Shopify store only if we need full isolation for checkout/payment/domain QA.

Suggested temporary identity:

```text
velene-control.myshopify.com
```

Purpose:

- Test a fully independent checkout stack.
- Test app pixels/custom pixels without risk to current production.
- Rebuild shipping, legal, payments, customer events, and analytics under Paulo's control.

Important Shopify limitation:

- Shopify duplication is manual: export/import products/customers, recreate apps/settings, shipping, taxes, checkout, payments, menus, pages, and reports as needed.
- Visitor traffic data and saved custom reports do not transfer.

Source: Shopify Help Center, "Backups and duplication".

### Layer 4 - Domain Strategy

Do not move `maisonvelene.fr` now.

Domain plan:

1. Keep `maisonvelene.fr` on current production.
2. Use preview URL for first staging.
3. Add `staging.maisonvelene.fr` only after preview works.
4. Use a separate test domain only if checkout/domain behavior must be tested end to end.

Recommended optional test domain:

```text
maisonvelene-test.fr
```

or:

```text
velene-staging.fr
```

Reason:

- `.fr` domains cannot be transferred to Shopify, according to Shopify domain transfer documentation.
- They can be connected through DNS instead.
- A separate test domain prevents accidental campaign or SEO impact on the production domain.

Sources:

- Shopify Help Center, "Connecting vs. transferring your domain to Shopify".
- Shopify Help Center, "Transferring a third-party domain to Shopify".

## Gargles To Fix In The Parallel Stack

### 1. Frontend Tracking Blind Spot

Current problem:

- Meta sees checkout events from `kt9eiv-hx.myshopify.com`.
- Meta does not reliably see `PageView`, `ViewContent`, and `AddToCart` from `maisonvelene.fr`.

Parallel fix:

- Fire browser events from the controlled storefront:
  - `PageView`
  - `ViewContent`
  - `AddToCart`
  - `InitiateCheckout`
- Do not fire `Purchase` in the frontend.
- Keep `Purchase` owned by Shopify/checkout.

### 2. Shopify Live View Dependence

Current problem:

- Shopify Live View is incomplete because production is a headless frontend, not the native Shopify Online Store.

Parallel fix:

- Do not use Live View as the primary truth source.
- Use Meta Events Manager, browser pixel helper, Shopify orders, checkout, and controlled frontend events.

### 3. Dev Dependency

Current problem:

- Site deploy and code changes depend on the previous Dev/Lovable access.

Parallel fix:

- Paulo-owned repository.
- Documented deploy.
- Local runnable staging.
- QA checklist before any production cutover.

### 4. Unsafe Cutover Risk

Current problem:

- Direct DNS or Lovable edits could break campaign traffic.

Parallel fix:

- Preview URL first.
- Staging subdomain second.
- Production cutover only after full QA.
- Current Lovable deployment retained as rollback for at least 7 days.

## Implementation Phases

### Phase 1 - Control Base

Status: started locally.

Deliverables:

- Controlled storefront folder.
- Shopify Storefront API integration.
- Cart and checkout redirect.
- Tracking module without `Purchase`.
- QA and rollout docs.

### Phase 2 - Source Recovery

Goal:

- Get original Lovable/GitHub source if available.

Actions:

- Ask Dev or Lovable owner for GitHub/export access.
- Compare original source against the controlled storefront.
- Preserve any useful components, copy, layout, images, and product routing.

Fallback:

- Continue with controlled storefront if source is unavailable.

### Phase 3 - Preview Deploy

Goal:

- Deploy controlled storefront to a preview URL.

Preferred hosts:

- Vercel
- Netlify
- Cloudflare Pages

Rules:

- No production DNS.
- No campaign destination change.
- No current Shopify setting change.

### Phase 4 - Tracking QA

Goal:

- Validate Meta browser events before any migration.

Approval criteria:

```text
PageView -> frontend URL
ViewContent -> frontend product URL
AddToCart -> frontend URL with product/variant ID and EUR value
InitiateCheckout -> frontend URL with cart value
Purchase -> Shopify checkout only
```

### Phase 5 - Optional Full Shopify Clone

Only execute if Step A is insufficient.

Clone scope:

- Products
- Collections
- Legal pages
- Shipping profiles
- Markets/currency
- Checkout language
- Customer events
- Meta app/pixel configuration
- Payment gateways, only after deliberate setup
- Transactional emails

Do not import:

- Old visitor analytics as decision truth.
- Unneeded legacy domains.
- Old broken tracking assumptions.

### Phase 6 - Cutover Planning

Cutover is blocked until:

- Staging has passed functional QA.
- Tracking has passed Events Manager QA.
- Checkout has passed test order/refund if using cloned Shopify.
- DNS rollback path is documented.
- Campaign destination plan is documented.
- Paulo approves timing.

## Cost Decision

Costs are acceptable if they buy isolation and control.

Approved potential costs:

- New Shopify plan/store for isolated checkout QA.
- New staging/test domain.
- Vercel/Netlify/Cloudflare paid tier if needed.
- Tracking tool or app only after confirming headless support.

Rejected costs:

- Apps that only work inside Shopify Online Store and do not solve headless frontend tracking.
- Emergency redesign before tracking/checkout parity.
- Paying for tools that duplicate `Purchase`.


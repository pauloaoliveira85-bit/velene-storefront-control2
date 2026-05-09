# VELENE Staging Rollout

## Non-Interference Rule

Do not change production DNS, Shopify checkout, Meta campaigns, payment gateways, or the current Lovable deployment until staging passes QA.

## Recommended Rollout

1. Run locally with `node scripts/serve.mjs`.
2. Deploy to a technical preview URL such as Vercel, Netlify or Cloudflare Pages.
3. Validate full QA checklist on the preview URL.
4. Add `staging.maisonvelene.fr` only after preview QA passes.
5. Run Meta Events Manager tests against staging.
6. Keep the current Lovable production as rollback for at least 7 days after any future cutover.

## Cutover Criteria

- Purchase remains correct and not duplicated.
- `PageView`, `ViewContent`, `AddToCart` and `InitiateCheckout` fire from the frontend.
- Shopify cart and checkout work with real products.
- Desktop/mobile parity is acceptable.
- Paulo explicitly approves the DNS change window.

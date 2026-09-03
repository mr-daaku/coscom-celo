# CosComPay — Technical Requirements Document

## 1. Stack

- TanStack Start v1 (React 19) + Vite 7, Tailwind v4 via `src/styles.css`.
- Backend: Lovable Cloud (Postgres + Auth), accessed through server functions and server routes.
- Deployment target: Cloudflare Worker (edge). No Node-only packages, no `child_process`, no native modules.

## 2. Module map

| File | Role |
| --- | --- |
| `src/lib/assets.ts` | **Client-safe** asset-code catalogue: `ASSET_CODES`, `ALL_CHAIN_CODE`, `ANY_ASSET`, `ANY_ADDRESS`, `resolveAssetCode`, `assetCodeOf`, aliases. |
| `src/lib/gateway.server.ts` | Server-only core: `SUPPORTED` (coin/chain/decimals/CoinGecko id), `priceUsd` (60 s cache + fallbacks), `depositAddress`, plan enforcement, DB rate limiter, API-key auth, signed webhooks, `json()` helper. Re-exports the asset catalogue. |
| `src/lib/gateway.functions.ts` | `createServerFn` RPC: `createPayment`, `createPaymentRecord`, `listAssetCodes`, `getPaymentByReference`, `selectPaymentAsset`, `submitPaymentTx`, withdrawals, API keys, account settings, plan purchase. |
| `src/lib/chain.functions.ts` | On-chain verification per network (Ethereum, BSC, Polygon, Base, TRON, Solana, TON). |
| `src/lib/google-auth.functions.ts` | Own Google OAuth: `googleAuthUrl`, `googleExchange` (server-side client id/secret, magic-link token hash back to the browser). |
| `src/lib/api.ts` | Browser-safe wrapper (`signInWithGoogle`, `completeGoogleSignIn`, session helpers). |
| `src/lib/plans.ts` | Plan catalogue: fees, limits, prices, `planOf`, `money`. |
| `src/components/RealCheckout.tsx` | Hosted checkout incl. all-chain asset picker. |
| `src/components/dashboard/GatewayTabs.tsx` | Charge creation by asset code, payments, withdrawals, keys, settings. |
| `public/sdk/coscompay.js` | Browser/Worker SDK: `createPayment`, `getPayment`, `verifyWebhook`. |

## 3. Public HTTP API

Base: `/api/public/v1` (auth bypassed by prefix — each handler authenticates itself with `authenticateApiKey`, 120 req/min per key, CORS + OPTIONS).

- `POST /payments` — body `{ amount_usd, asset?, coin?, chain?, description?, customer_email?, metadata? }`. `asset` is preferred; `coin`+`chain` is legacy-compatible. Requires `payments:write`. Returns `{ id, reference, amount_usd, asset, coin, chain, crypto_amount, deposit_address, status, expires_at, checkout_url }`. For `ALL-CHAIN-COIN`, `coin`/`chain` are `ANY`, `crypto_amount` is `null`, `deposit_address` is `pending-selection`.
- `GET /payments/:reference` — scoped to the key's user; reference must match `^cos_[a-z0-9]{6,32}$`.

## 4. Data model (public schema, RLS + GRANTs on every table)

- `merchant_accounts` — business name, support email, payout target, webhook url/secret, `plan`, `plan_status`, `plan_expires_at`, `suspended`.
- `payments` — `reference` (unique, `cos_…`), `amount_usd`, `coin`, `chain` (both `NOT NULL`; hold `ANY` for all-chain), `crypto_amount` (nullable until asset chosen), `deposit_address` (`pending-selection` until chosen), `fee_percent`, `fee_usd`, `net_usd`, `status` ∈ `pending|confirming|paid|expired|failed`, `tx_hash`, `confirmations`, `expires_at`, `paid_at`.
- `withdrawals`, `wallets`, `invoices`, `api_keys` (permissions array, status, `last_used_at`), `plan_payments`, `api_rate_limits` (bucket + fixed window + count), `user_roles` + `has_role()` security-definer function for admin checks.

## 5. All-chain state transition

`selectPaymentAsset` (unauthenticated, payer-facing) is the only path that binds an asset:

1. Rate-limit `payasset:<reference>` (20 / 10 min).
2. Load payment by reference; require `status = pending`, not expired, `coin = ANY`.
3. `resolveAssetCode` → concrete coin/chain; reject `ALL-CHAIN-COIN` here.
4. `priceUsd(cgId)` → `crypto_amount = amount_usd / price` rounded to the asset's decimals.
5. `depositAddress(user, chain)` → merchant wallet if present, else platform address.
6. Update row and return the public DTO.

`submitPaymentTx` refuses invoices where `coin === ANY`.

## 6. Security requirements

- Service-role client (`client.server.ts`) is imported **inside handlers only**, never at module scope of `*.functions.ts` or route files.
- Google client id/secret, Gmail credentials and service-role key live in backend secrets; never in `.env` consumed by the browser and never returned to the client.
- Allowed OAuth origins: `https://coscomai.xyz`, `https://coscom-celo.lovable.app`, localhost; redirect path fixed to `/auth/google/callback`.
- Webhook delivery is HTTPS-only with an SSRF guard (no localhost/private ranges) and HMAC-SHA256 signature header `x-coscompay-signature`.
- All inputs validated with Zod; JSON responses set `no-store`, `nosniff`, `no-referrer`.
- Admin actions verify role through the authenticated client (`has_role`) before any privileged client is loaded.

## 7. Known gaps

- Bitcoin transaction verification is not implemented (BTC invoices can be created but not auto-settled).
- Withdrawals are recorded and fee-charged, but broadcasting is manual.
- API keys are stored in plaintext; hashing them is a pending hardening step.

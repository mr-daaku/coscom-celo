# CosComPay — Product Requirements Document

**Tagline:** The gateway to crypto commerce.
**One line:** Stripe for crypto — merchants accept Bitcoin, Ethereum, stablecoins and more with one API, one SDK and one hosted checkout. No demo/mock payments anywhere in the product.

## 1. Who it is for

- **Merchants / developers** who want crypto payments without running nodes or custody tooling.
- **Payers (buyers)** who receive a checkout link and pay from any wallet.
- **Platform owner** (`mr.daaku.gd@gmail.com`) who administers accounts from an owner-only admin panel.

## 2. Core product promises

1. Create a charge in USD; the payer settles in crypto.
2. Every payment is verified **on-chain** before it is marked paid.
3. Fees and limits depend on the merchant's plan; plans are paid in crypto.
4. Dark theme only, lime `#a3e635` primary, Fraunces headings, glassmorphism cards, spotlight background.

## 3. Asset codes (how a charge names its coin)

A charge is created with a single `asset` code that identifies **coin + network**, because the same token exists on many chains:

`BEP20-USDT`, `ERC20-USDT`, `TRC20-USDT`, `ERC20-USDC`, `POLYGON-USDC`, `BTC`, `ETH`, `BASE-ETH`, `BNB`, `TRX`, `SOL`, `TON`, `POL`

Common aliases are accepted (`USDT-BEP20`, `MATIC`, …) and normalised.

### ALL-CHAIN-COIN
`asset: "ALL-CHAIN-COIN"` creates a **USD-priced invoice with no fixed asset**. The merchant does not decide the coin:

1. Invoice is stored with `coin = ANY`, `chain = ANY`, no crypto amount, no deposit address.
2. At checkout the payer picks any supported asset code.
3. Only then is the live price fetched, the crypto amount computed and a deposit address issued.
4. From that moment the invoice behaves exactly like a fixed-asset invoice and cannot switch again.

A payer cannot submit a transaction hash while the invoice is still `ANY`.

## 4. Payment lifecycle

```text
created (pending)
   -> [ALL-CHAIN-COIN only] payer selects asset -> address + crypto amount issued
   -> payer sends funds, submits tx hash
   -> confirming (on-chain lookup in progress / not enough confirmations)
   -> paid   (amount, asset and destination address matched)
   -> expired (30 minutes without payment)  |  failed (verification rejected)
```

Webhooks: `payment.created`, `payment.paid`, `withdrawal.requested`, HMAC-SHA256 signed.

## 5. Plans

| Plan | Price | Gateway fee | Withdraw fee | Monthly volume | Max payment | API keys |
| --- | --- | --- | --- | --- | --- | --- |
| Free | $0 | 3% | 2% | $5,000 | $1,000 | 1 |
| Cos | $30/mo | 1.5% | 1% | $250,000 | $25,000 | 5 |
| Core | $75/mo | 0.5% | 0.5% | $2,000,000 | $250,000 | 25 |

Plans are purchased in crypto from Dashboard → Billing and activate when the payment confirms. An expired or non-active paid plan silently falls back to Free limits. Over-limit charges are rejected at creation with an upgrade message.

## 6. Surfaces

- **Landing** (`/`) — value prop, supported coins, pricing, spotlight background.
- **Auth** (`/login`, `/signup`) — Google sign-in only, via the project's own Google OAuth client (server-side secret).
- **Dashboard** (`/dashboard?tab=…`) — overview, charges (create with asset code), payments, invoices, withdrawals, wallets, API keys, account/webhook settings, billing.
- **Hosted checkout** (`/pay?ref=cos_…`) — amount, asset (or asset picker for all-chain), address + QR, countdown, tx-hash submission, live status. Without a `ref` the page explains that a merchant link is required — never a demo payment.
- **Docs** (`/docs`) — base URL, asset codes, REST, SDK, webhooks, plan table.
- **Admin** (`/admin`) — owner-only: accounts, plans, suspensions.

## 7. Non-goals

- No fiat rails, no light theme, no custodial trading, no anonymous sign-up.

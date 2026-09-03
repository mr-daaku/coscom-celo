import { createFileRoute } from "@tanstack/react-router";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { PLAN_LIST, money } from "@/lib/plans";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "CosComPay API & SDK Docs — Crypto Payments" },
      {
        name: "description",
        content:
          "CosComPay developer docs: base URL, REST endpoints, JavaScript SDK, signed webhooks and plan fee limits for crypto payments.",
      },
      { property: "og:title", content: "CosComPay API & SDK Documentation" },
      {
        property: "og:description",
        content: "Base URL, REST API, SDK install, signed webhooks and plan limits.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocsPage,
});

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-2xl border border-border bg-card/80 p-4 text-xs leading-relaxed backdrop-blur-xl">
      <code className="font-mono">{children}</code>
    </pre>
  );
}

function DocsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 pb-24 pt-28 sm:px-6">
        <h1 className="font-fraunces text-3xl font-bold sm:text-4xl">Developer documentation</h1>
        <p className="mt-3 text-muted-foreground">
          One REST API and one SDK to accept Bitcoin, Ethereum, stablecoins and more. Every charge is verified on-chain
          before it settles.
        </p>

        <section className="mt-10">
          <h2 className="font-fraunces text-xl font-bold">Base URL</h2>
          <Code>{`https://coscomai.xyz/api/public/v1`}</Code>
          <p className="mt-3 text-sm text-muted-foreground">
            Authenticate with a dashboard API key: <code className="font-mono">Authorization: Bearer sk_live_…</code> (or{" "}
            <code className="font-mono">x-api-key</code>). Keys are server-side only — 120 requests per minute per key.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-fraunces text-xl font-bold">Asset codes</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Invoices are created with a single <code className="font-mono">asset</code> code that names the coin{" "}
            <em>and</em> the network — so <code className="font-mono">BEP20-USDT</code> and{" "}
            <code className="font-mono">ERC20-USDT</code> are different assets. Pass{" "}
            <code className="font-mono">ALL-CHAIN-COIN</code> to bill in USD and let the payer choose any supported
            asset at checkout.
          </p>
          <Code>{`BEP20-USDT   ERC20-USDT   TRC20-USDT
ERC20-USDC   POLYGON-USDC
BTC   ETH   BASE-ETH   BNB   TRX   SOL   TON   POL

ALL-CHAIN-COIN   // any coin/network, priced in USD`}</Code>
        </section>

        <section className="mt-10">
          <h2 className="font-fraunces text-xl font-bold">Create a payment</h2>
          <Code>{`curl -X POST https://coscomai.xyz/api/public/v1/payments \\
  -H "Authorization: Bearer $COSCOMPAY_API_KEY" \\
  -H "content-type: application/json" \\
  -d '{"amount_usd": 49.99, "asset": "BEP20-USDT", "description": "Order #1024"}'

{
  "reference": "cos_8f2c91a7bd",
  "amount_usd": 49.99,
  "asset": "BEP20-USDT",
  "coin": "USDT",
  "chain": "BSC",
  "crypto_amount": 49.99,
  "deposit_address": "T…",
  "status": "pending",
  "expires_at": "2026-01-01T12:30:00.000Z",
  "checkout_url": "https://coscomai.xyz/pay?ref=cos_8f2c91a7bd"
}`}</Code>
        </section>

        <section className="mt-10">
          <h2 className="font-fraunces text-xl font-bold">Check payment status</h2>
          <Code>{`curl https://coscomai.xyz/api/public/v1/payments/cos_8f2c91a7bd \\
  -H "Authorization: Bearer $COSCOMPAY_API_KEY"`}</Code>
          <p className="mt-3 text-sm text-muted-foreground">
            Status flow: <code className="font-mono">pending → confirming → paid</code>, or{" "}
            <code className="font-mono">expired</code> after 30 minutes.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-fraunces text-xl font-bold">JavaScript SDK</h2>
          <Code>{`import { CosComPay } from "https://coscomai.xyz/sdk/coscompay.js";

const pay = new CosComPay(process.env.COSCOMPAY_API_KEY);

const charge = await pay.createPayment({
  amount_usd: 49.99,
  asset: "BEP20-USDT", // or "ALL-CHAIN-COIN" to let the payer choose
});

redirect(charge.checkout_url);

const status = await pay.getPayment(charge.reference);`}</Code>
        </section>

        <section className="mt-10">
          <h2 className="font-fraunces text-xl font-bold">Signed webhooks</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Set an https webhook URL in Dashboard → Account. We POST{" "}
            <code className="font-mono">payment.created</code>, <code className="font-mono">payment.paid</code> and{" "}
            <code className="font-mono">withdrawal.requested</code> with an HMAC-SHA256 signature over the raw body.
          </p>
          <Code>{`import { CosComPay } from "https://coscomai.xyz/sdk/coscompay.js";

const raw = await request.text();
const ok = await CosComPay.verifyWebhook(
  raw,
  request.headers.get("x-coscompay-signature"),
  process.env.COSCOMPAY_WEBHOOK_SECRET,
);
if (!ok) return new Response("Invalid signature", { status: 401 });`}</Code>
        </section>

        <section className="mt-10">
          <h2 className="font-fraunces text-xl font-bold">Plans, fees and limits</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-border text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Gateway fee</th>
                  <th className="p-4">Withdraw fee</th>
                  <th className="p-4">Monthly volume</th>
                  <th className="p-4">Max payment</th>
                </tr>
              </thead>
              <tbody>
                {PLAN_LIST.map((plan) => (
                  <tr key={plan.id} className="border-b border-border/60 last:border-0">
                    <td className="p-4 font-medium">{plan.name}</td>
                    <td className="p-4">{plan.priceUsd === 0 ? "Free" : `$${plan.priceUsd}/mo`}</td>
                    <td className="p-4">{plan.feePercent}%</td>
                    <td className="p-4">{plan.withdrawFeePercent}%</td>
                    <td className="p-4">{money(plan.monthlyVolumeUsd)}</td>
                    <td className="p-4">{money(plan.maxPaymentUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Paid plans are billed in crypto from Dashboard → Billing and activate as soon as the transaction confirms.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}

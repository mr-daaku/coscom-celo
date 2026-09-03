import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Code2,
  Coins,
  FileCode2,
  Globe,
  Lock,
  Repeat,
  Timer,
  Webhook,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CheckoutDemo } from "@/components/CheckoutDemo";
import { SpotlightBackground, useScrollReveal } from "@/components/SpotlightBackground";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CosComPay — Crypto Payment Gateway for Merchants" },
      {
        name: "description",
        content:
          "CosComPay is the gateway to crypto commerce: accept Bitcoin, Ethereum, stablecoins and 50+ chains with one API, instant settlement and zero chargebacks.",
      },
      { property: "og:title", content: "CosComPay — The gateway to crypto commerce" },
      {
        property: "og:description",
        content:
          "Accept Bitcoin, Ethereum, stablecoins and 50+ chains with one integration. Instant settlement, non-custodial, zero chargebacks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const LOGOS = ["Binance", "Stripe", "Coinbase", "Shopify", "WooCommerce", "Webflow"];

const FEATURES = [
  {
    icon: Timer,
    title: "Instant settlement",
    body: "Funds land in your wallet as soon as the network confirms — no 7-day holds, no rolling reserves.",
    span: "lg:col-span-2",
    stats: [
      ["~10s", "BTC confirm"],
      ["~15s", "ETH confirm"],
      ["0%", "Chargebacks"],
    ],
  },
  {
    icon: Code2,
    title: "One-line integration",
    body: "Drop in a hosted checkout link or call the API directly. Server SDKs for every major language.",
    span: "",
  },
  {
    icon: Boxes,
    title: "50+ chains, 1 API",
    body: "Bitcoin, Ethereum, TRON, Solana, BNB Chain, Polygon, TON and every major stablecoin.",
    span: "",
  },
  {
    icon: Repeat,
    title: "Settle how you want",
    body: "Keep crypto, auto-convert to stablecoins, or split settlement across treasury wallets.",
    span: "",
  },
  {
    icon: Lock,
    title: "Non-custodial",
    body: "Payments route straight to keys you control. We never hold merchant funds.",
    span: "",
  },
];

const CHECKOUT_POINTS = [
  "Live rates locked for 30 minutes at checkout",
  "QR codes and wallet deep links on every device",
  "Automatic underpayment and overpayment handling",
  "Localised in 24 languages with your brand colours",
];

const DEV_POINTS = [
  { icon: FileCode2, title: "Node · Python · Go · PHP", body: "Typed SDKs and copy-paste snippets." },
  { icon: Webhook, title: "Signed webhooks", body: "HMAC-signed events with automatic retries." },
  { icon: Globe, title: "Sandbox testnets", body: "Full testnet parity before you go live." },
  { icon: Coins, title: "OpenAPI schema", body: "Generate your own client in seconds." },
];

const PRICING = [
  {
    name: "Starter",
    fee: "0.5%",
    blurb: "For new stores finding their first crypto customers.",
    perks: ["Hosted checkout", "10 chains", "Email support", "Sandbox access"],
    popular: false,
  },
  {
    name: "Growth",
    fee: "0.4%",
    blurb: "For scaling merchants with real crypto volume.",
    perks: ["50+ chains", "Auto-convert to stables", "Signed webhooks", "Priority support"],
    popular: true,
  },
  {
    name: "Enterprise",
    fee: "Custom",
    blurb: "For platforms and marketplaces at scale.",
    perks: ["Volume pricing", "Dedicated infra", "SLA & audits", "Solutions engineer"],
    popular: false,
  },
];

const FAQS = [
  {
    q: "Which cryptocurrencies can I accept?",
    a: "Bitcoin, Ethereum, TRON, Solana, BNB Chain, Polygon, TON and 50+ assets including USDT, USDC and DAI across every supported chain.",
  },
  {
    q: "Do you hold my funds?",
    a: "No. CosComPay is non-custodial — payments settle directly into wallets whose keys you control. We only observe the chain and notify your systems.",
  },
  {
    q: "What happens if a customer underpays?",
    a: "The checkout detects the shortfall, shows the remaining balance, and either accepts a top-up within the payment window or issues an automatic refund minus network fees.",
  },
  {
    q: "How do exchange rates work?",
    a: "We aggregate rates from multiple venues and lock a quote for 30 minutes at checkout. Your invoice is settled at the locked rate regardless of market movement.",
  },
  {
    q: "Are there chargebacks?",
    a: "On-chain payments are final, so there are no card-style chargebacks. You can still issue refunds from the dashboard or API at any time.",
  },
];

function LandingPage() {
  useScrollReveal();

  return (
    <div className="relative">
      <SpotlightBackground />
      <Header />

      {/* Hero */}
      <section className="mx-auto flex min-h-[90vh] max-w-7xl flex-col justify-center gap-12 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <div className="flex-1" data-reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs text-primary">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            Mainnet live · 50+ chains supported
          </span>
          <h1 className="mt-6 font-fraunces text-5xl leading-[1.05] font-bold tracking-tight sm:text-6xl lg:text-7xl">
            The gateway to crypto commerce.
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            Accept Bitcoin, Ethereum, stablecoins and 50+ cryptocurrencies with one
            integration. Instant settlement, non-custodial custody, zero chargebacks.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 gap-2 transition-transform hover:scale-[1.02]">
              <Link to="/signup">
                Get started <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12">
              <a href="#features">See features</a>
            </Button>
          </div>
          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-8">
            {[
              ["$2.4B", "Processed"],
              ["12,800+", "Merchants"],
              ["142", "Countries"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="font-fraunces text-2xl font-bold">{value}</dt>
                <dd className="text-xs text-muted-foreground">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="w-full flex-1 lg:max-w-md" data-reveal>
          <CheckoutDemo />
        </div>
      </section>

      {/* Trusted by */}
      <section className="border-y border-border bg-card/30 py-8 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4">
          {LOGOS.map((logo, i) => (
            <span
              key={logo}
              className={`text-lg text-muted-foreground/60 ${
                i % 2 === 0 ? "font-fraunces font-semibold" : "font-medium"
              }`}
            >
              {logo}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-2xl" data-reveal>
          <h2 className="font-fraunces text-3xl font-bold tracking-tight sm:text-5xl">
            Built for the next century of money.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Everything you need to take crypto from a checkbox to a channel.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              data-reveal
              className={`rounded-3xl border border-border bg-card/90 p-6 backdrop-blur-xl ${f.span}`}
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-5 font-fraunces text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              {f.stats && (
                <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-5">
                  {f.stats.map(([value, label]) => (
                    <div key={label}>
                      <p className="font-fraunces text-xl font-bold text-primary">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Checkout demo */}
      <section
        id="checkout"
        className="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 sm:px-6 lg:px-8"
      >
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div data-reveal>
            <h2 className="font-fraunces text-3xl font-bold tracking-tight sm:text-5xl">
              The checkout your customers will love.
            </h2>
            <ul className="mt-8 space-y-4">
              {CHECKOUT_POINTS.map((point) => (
                <li key={point} className="flex gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                  {point}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8 gap-2">
              <Link to="/pay">
                Try the hosted checkout <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div data-reveal>
            <CheckoutDemo amount={129} />
          </div>
        </div>
      </section>

      {/* Developers */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div
            data-reveal
            className="overflow-hidden rounded-3xl border border-border bg-[#0b0e0e]"
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <span className="size-3 rounded-full bg-destructive/70" />
              <span className="size-3 rounded-full bg-warning/70" />
              <span className="size-3 rounded-full bg-primary/70" />
              <span className="ml-3 font-mono text-xs text-muted-foreground">
                accept-crypto.ts
              </span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-xs leading-relaxed text-muted-foreground">
              <code>{`import { CosComPay } from "coscompay";

const pay = new CosComPay(process.env.CMP_SECRET_KEY);

const session = await pay.checkout.create({
  amount: 249_00,
  currency: "usd",
  accept: ["BTC", "ETH", "USDT"],
  success_url: "https://acme.com/thanks",
});

return Response.redirect(session.url);`}</code>
            </pre>
          </div>

          <div data-reveal>
            <h2 className="font-fraunces text-3xl font-bold tracking-tight sm:text-5xl">
              Ship in a weekend.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Three lines to your first crypto payment. Everything else is optional.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {DEV_POINTS.map((d) => (
                <div key={d.title} className="rounded-2xl border border-border bg-card/90 p-4">
                  <d.icon className="size-5 text-primary" />
                  <p className="mt-3 text-sm font-medium">{d.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{d.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center" data-reveal>
          <h2 className="font-fraunces text-3xl font-bold tracking-tight sm:text-5xl">
            Honest fees. No surprises.
          </h2>
          <p className="mt-4 text-muted-foreground">
            One percentage per settled payment. No monthly minimums, no setup fees.
          </p>
        </div>

        <div className="mt-14 grid items-center gap-6 lg:grid-cols-3">
          {PRICING.map((tier) => (
            <div
              key={tier.name}
              data-reveal
              className={
                tier.popular
                  ? "relative rounded-3xl bg-primary p-7 text-primary-foreground lg:scale-105"
                  : "rounded-3xl border border-border bg-card/90 p-7 backdrop-blur-xl"
              }
            >
              {tier.popular && (
                <span className="absolute -top-3 left-7 rounded-full bg-background px-3 py-1 text-[11px] font-semibold tracking-wide text-primary uppercase">
                  Most popular
                </span>
              )}
              <h3 className="font-fraunces text-lg font-semibold">{tier.name}</h3>
              <p className="mt-4 font-fraunces text-4xl font-bold">{tier.fee}</p>
              <p
                className={
                  tier.popular
                    ? "mt-2 text-sm text-primary-foreground/80"
                    : "mt-2 text-sm text-muted-foreground"
                }
              >
                {tier.blurb}
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {tier.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2.5">
                    <CheckCircle2
                      className={tier.popular ? "size-4" : "size-4 text-primary"}
                    />
                    {perk}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={tier.popular ? "secondary" : "outline"}
                className="mt-7 w-full"
              >
                <Link to="/signup">
                  {tier.name === "Enterprise" ? "Talk to sales" : "Get started"}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-24 sm:px-6">
        <h2
          className="text-center font-fraunces text-3xl font-bold tracking-tight sm:text-4xl"
          data-reveal
        >
          Questions, answered.
        </h2>
        <div className="mt-10 space-y-3">
          {FAQS.map((faq) => (
            <details
              key={faq.q}
              data-reveal
              className="group rounded-2xl border border-border bg-card/90 p-5 backdrop-blur-xl"
            >
              <summary className="cursor-pointer list-none font-medium marker:hidden">
                <span className="flex items-center justify-between gap-4">
                  {faq.q}
                  <span className="text-primary transition-transform group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div
          data-reveal
          className="rounded-3xl border border-border bg-gradient-to-br from-primary/20 via-accent/10 to-transparent p-10 text-center backdrop-blur-xl sm:p-16"
        >
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Zap className="size-6" />
          </span>
          <h2 className="mt-6 font-fraunces text-3xl font-bold tracking-tight sm:text-5xl">
            Start accepting crypto today.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Create an account, grab a test key, and take your first payment before lunch.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="h-12 transition-transform hover:scale-[1.02]">
              <Link to="/signup">Get started free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12">
              <Link to="/pay">See a live checkout</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

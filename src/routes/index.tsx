import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CheckoutDemo } from "@/components/CheckoutDemo";
import { SpotlightBackground } from "@/components/SpotlightBackground";
import {
  ChevronRight,
  CheckCircle2,
  Zap,
  Globe2,
  ShieldCheck,
  ArrowRight,
  Layers,
  Code,
  Server,
  ExternalLink,
  Github,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CosComPay — The Gateway to Crypto Commerce" },
      {
        name: "description",
        content:
          "Accept Bitcoin, Ethereum, stablecoins and 50+ tokens with one integration. Settle in USD, EUR or keep crypto. Zero chargebacks. 0.4% flat fee.",
      },
      { property: "og:title", content: "CosComPay — The Gateway to Crypto Commerce" },
      {
        property: "og:description",
        content:
          "Accept Bitcoin, Ethereum, stablecoins and 50+ tokens with one integration. Settle in USD, EUR or keep crypto. Zero chargebacks. 0.4% flat fee.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=Inter:wght@300;400;500;600;700&display=swap" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  useEffect(() => {
    // IntersectionObserver-based scroll reveal animations
    if (typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("revealed");
              observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: "0px 0px -10% 0px",
          threshold: 0.1,
        }
      );

      document.querySelectorAll("[data-reveal]").forEach((el) => {
        observer.observe(el);
      });

      return () => observer.disconnect();
    }
    return undefined;
  }, []);

  const features = [
    {
      icon: (
        <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
      title: "Instant settlement, no chargebacks",
      description: "Funds land in your wallet the moment a transaction confirms. Crypto is push, not pull — chargebacks become a thing of the past.",
      stats: [
        { value: "~10s", label: "BTC confirm" },
        { value: "~15s", label: "ETH confirm" },
        { value: "0%", label: "chargeback rate" },
      ],
      large: true,
    },
    {
      icon: (
        <svg className="w-7 h-7 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M5 9l7-7 7 7" />
        </svg>
      ),
      title: "One-line integration",
      description: "Drop in our SDK or hosted checkout. Live in under 10 minutes.",
    },
    {
      icon: (
        <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
      title: "50+ chains, 1 API",
      description: "BTC, ETH, SOL, all EVM & non-EVM L1s — one integration.",
    },
    {
      icon: (
        <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      title: "Settle how you want",
      description: "Hold crypto, auto-convert to USD/EUR, or split — your treasury, your rules.",
      large: true,
      wide: true,
    },
    {
      icon: (
        <svg className="w-7 h-7 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
      title: "Non-custodial",
      description: "Funds go directly to your wallet. We never hold your money.",
    },
  ];

  const supportedCoins = [
    { name: "Bitcoin", symbol: "BTC", chain: "Bitcoin", image: "/assets/btc.png" },
    { name: "Ethereum", symbol: "ETH", chain: "Ethereum", image: "/assets/eth.png" },
    { name: "Tether", symbol: "USDT", chain: "ERC-20 · TRC-20 · BEP-20", image: "/assets/usdt.png" },
    { name: "USD Coin", symbol: "USDC", chain: "ERC-20 · SPL", image: "/assets/usdc.png" },
    { name: "BNB", symbol: "BNB", chain: "BNB Chain", image: "/assets/bnb.png" },
    { name: "Solana", symbol: "SOL", chain: "Solana", image: "/assets/sol.png" },
    { name: "TRON", symbol: "TRX", chain: "TRON", image: "/assets/trx.png" },
    { name: "Toncoin", symbol: "TON", chain: "TON", image: "/assets/ton.png" },
    { name: "Polygon", symbol: "POL", chain: "Polygon", image: "/assets/pol.png" },
    { name: "Base", symbol: "BASE", chain: "Base L2", image: "/assets/base.png" },
  ];


  const faqs = [
    {
      q: "Do I need to hold crypto?",
      a: "No. Auto-convert to USD or EUR at the moment of payment, or keep crypto — your choice, per coin.",
    },
    {
      q: "How fast do funds settle?",
      a: "Once the network confirms the transaction (10s for BTC, ~15s for ETH, near-instant on Solana), funds are in your wallet or fiat account.",
    },
    {
      q: "Is it non-custodial?",
      a: "Yes. Funds flow directly from buyer to merchant. CosComPay never holds your money.",
    },
    {
      q: "What about chargebacks?",
      a: "Crypto transactions are final by design. No chargebacks — which is why merchants save 3-5% vs cards.",
    },
    {
      q: "Do my customers need an account?",
      a: "No. They scan a QR code or tap a deep link with their existing wallet — MetaMask, Phantom, Coinbase Wallet, etc.",
    },
  ];

  const checkoutFeatures = [
    "No account required for buyers",
    "Auto-refreshed exchange rates",
    "Mobile-first, wallet-native",
    "Built-in QR code + deep links",
  ];

  const devFeatures = [
    "Node · Python · Go · PHP",
    "Webhooks + idempotency",
    "Sandbox env per project",
    "OpenAPI spec",
  ];

  const pricing = [
    {
      name: "Starter",
      price: "0.5%",
      period: "per transaction",
      features: ["Up to $50K / month", "50+ cryptocurrencies", "Hosted checkout", "Email support"],
      cta: "Start free",
      popular: false,
    },
    {
      name: "Growth",
      price: "0.4%",
      period: "per transaction",
      features: ["Up to $500K / month", "Auto-convert to fiat", "Custom branding", "Priority support", "Sandbox env"],
      cta: "Start free",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "volume pricing",
      features: ["Unlimited volume", "Dedicated account mgr", "SLA + 99.99% uptime", "White-label option", "On-prem deployment"],
      cta: "Talk to sales",
      popular: false,
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground relative isolate">
      <SpotlightBackground />
      <Header />

      {/* HERO */}
      <section className="relative min-h-[90vh] overflow-hidden flex items-center pt-24 pb-20 z-10">
        <div className="relative max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-12 items-center">
          <div data-reveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/50 backdrop-blur mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-muted-foreground">Mainnet live · 50+ chains supported</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold leading-[0.95] tracking-tight mb-6 font-fraunces">
              The gateway<br />
              to <span className="text-primary">crypto</span><br />
              commerce.
            </h1>
            <p className="text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed">
              Accept Bitcoin, Ethereum, stablecoins and 50+ tokens with one integration. Settle in USD, EUR or keep crypto. Zero chargebacks. 0.4% flat fee.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold hover:scale-[1.02] transition-transform"
              >
                Get started
                <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-8 py-4 border border-border bg-card/40 backdrop-blur rounded-2xl font-semibold hover:bg-card transition-colors"
              >
                See features
              </a>
            </div>

            <div className="flex items-center gap-8 mt-12 pt-8 border-t border-border">
              <div>
                <div className="text-3xl font-bold font-fraunces">$2.4B</div>
                <div className="text-sm text-muted-foreground">Processed</div>
              </div>
              <div>
                <div className="text-3xl font-bold font-fraunces">12,800+</div>
                <div className="text-sm text-muted-foreground">Merchants</div>
              </div>
              <div>
                <div className="text-3xl font-bold font-fraunces">142</div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </div>
            </div>
          </div>

          {/* Floating checkout preview */}
          <div className="relative" data-reveal>
            <div className="absolute -inset-8 bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl rounded-full" />
            <div className="relative bg-card border border-border rounded-3xl p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-muted-foreground font-mono">coscompay://checkout</div>
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#e6b335" }} />
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                </div>
              </div>
              <div className="bg-background/50 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path d="M9 8h4.5a2.5 2.5 0 0 1 0 5H9m0 0v3m0-3v-3m0 3v3" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Order #CMP-7842</div>
                    <div className="text-2xl font-bold font-fraunces">$249.00</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mb-3">Select payment coin</div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button className="px-3 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold">BTC</button>
                  <button className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm">ETH</button>
                  <button className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm">USDT</button>
                  <button className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm">SOL</button>
                  <button className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm">USDC</button>
                  <button className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm">+44</button>
                </div>
                <div className="bg-background/60 rounded-xl p-4 border border-border">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground">BTC amount</span>
                    <span className="font-mono">0.00342</span>
                  </div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground">Network fee</span>
                    <span className="font-mono">~$0.85</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">CosComPay fee</span>
                    <span className="font-mono text-primary">0.4%</span>
                  </div>
                </div>
                <button className="w-full mt-5 py-3 bg-primary text-primary-foreground rounded-xl font-semibold">Pay now →</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SUPPORTED COINS / TRUSTED BY */}
      <section className="py-16 border-y border-border bg-card/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-70">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mr-4">Trusted worldwide</div>
            {trustedBy.map((item, i) => (
              <span key={item.name} className="text-2xl font-bold" style={{ fontFamily: item.serif ? "'Fraunces', serif" : "inherit" }}>
                {item.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-16" data-reveal>
            <div className="text-sm uppercase tracking-widest text-primary mb-4">Why CosComPay</div>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] font-fraunces">
              Built for the next<br />century of money.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className={`p-8 bg-card border border-border rounded-3xl ${feature.large ? "md:col-span-2 md:row-span-2" : ""} ${feature.wide ? "md:col-span-2" : ""}`}
                data-reveal
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className={`${(feature.large || feature.wide) ? "text-3xl" : "text-2xl"} font-bold mb-3 font-fraunces`}>
                  {feature.title}
                </h3>
                <p className={`text-muted-foreground mb-6 ${feature.large ? "text-base" : "text-sm"}`}>
                  {feature.description}
                </p>
                {feature.stats && (
                  <div className="grid grid-cols-3 gap-4 mt-8">
                    {feature.stats.map((stat) => (
                      <div key={stat.label} className="bg-background/40 p-4 rounded-2xl border border-border">
                        <div className="text-3xl font-bold text-primary font-fraunces">{stat.value}</div>
                        <div className="text-xs text-muted-foreground">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                )}
                {feature.wide && (
                  <div className="flex items-start gap-6 mt-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold font-fraunces mb-2">Flexible settlement</h4>
                      <p className="text-muted-foreground">Choose per-transaction: keep crypto, auto-convert to fiat, or split across multiple wallets.</p>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE CHECKOUT DEMO */}
      <section id="checkout" className="py-24 md:py-32 bg-card/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div data-reveal>
              <div className="text-sm uppercase tracking-widest text-primary mb-4">Live demo</div>
              <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6 font-fraunces">
                The checkout<br />your customers<br />will love.
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl">
                Drop-in widget. Branded to your store. Auto-converts fiat to crypto at the best live rate. Try it on the right — pick any coin.
              </p>
              <ul className="space-y-3">
                {checkoutFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div data-reveal>
              <CheckoutDemo />
            </div>
          </div>
        </div>
      </section>

      {/* DEVELOPERS */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1" data-reveal>
              <div className="bg-card border border-border rounded-3xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-background/40">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#e6b335" }} />
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">checkout.js</div>
                </div>
                <pre className="p-6 text-sm font-mono overflow-x-auto leading-relaxed">
                  <code>{`// accept crypto in 3 lines
import { CosComPay } from '@coscompay/sdk';

const session = await CosComPay.createSession({
  amount: 24900,
  currency: 'USD',
  orderId: 'CMP-7842',
  coins: ['BTC', 'ETH', 'USDT'],
});

CosComPay.mount('#checkout', session);`}</code>
                </pre>
              </div>
            </div>
            <div className="order-1 lg:order-2" data-reveal>
              <div className="text-sm uppercase tracking-widest text-primary mb-4">Developer first</div>
              <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6 font-fraunces">
                Ship in a<br />weekend.
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mb-8">
                A real REST + Webhook API, SDKs for every major stack, and sandbox keys in 30 seconds. Built by devs, for devs.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {devFeatures.map((t) => (
                  <div key={t} className="flex items-center gap-2 text-sm">
                    <span className="text-primary font-mono">›</span>
                    <span className="text-muted-foreground">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 md:py-32 bg-card/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16" data-reveal>
            <div className="text-sm uppercase tracking-widest text-primary mb-4">Pricing</div>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] font-fraunces">Honest fees. No surprises.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {pricing.map((plan, index) => (
              <article
                key={plan.name}
                className={`p-8 bg-card border border-border rounded-3xl ${plan.popular ? "bg-primary text-primary-foreground relative scale-105 z-10" : ""}`}
                data-reveal
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-foreground text-background text-xs font-bold rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div className="text-sm mb-2" style={{ opacity: plan.popular ? 0.8 : 1, color: plan.popular ? "inherit" : "var(--muted-foreground)" }}>
                  {plan.name}
                </div>
                <div className="text-5xl font-bold mb-1 font-fraunces">{plan.price}</div>
                <div className="text-sm mb-6" style={{ opacity: plan.popular ? 0.8 : 1, color: plan.popular ? "inherit" : "var(--muted-foreground)" }}>
                  {plan.period}
                </div>
                <ul className="space-y-3 text-sm mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span style={{ color: plan.popular ? "currentColor" : "var(--primary)" }}>✓</span>
                      <span style={{ opacity: plan.popular ? 0.9 : 1, color: plan.popular ? "inherit" : "var(--muted-foreground)" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                    plan.popular
                      ? "bg-primary-foreground text-primary hover:opacity-90"
                      : "border border-border hover:bg-background"
                  }`}
                >
                  <Link to="/signup" className="w-full h-full flex items-center justify-center">
                    {plan.cta}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16" data-reveal>
            <div className="text-sm uppercase tracking-widest text-primary mb-4">FAQ</div>
            <h2 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] font-fraunces">Common questions.</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((f, index) => (
              <details key={f.q} className="group p-6 bg-card border border-border rounded-2xl" data-reveal style={{ animationDelay: `${index * 50}ms` }}>
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="font-semibold text-lg">{f.q}</span>
                  <span className="text-primary transition-transform duration-300 group-open:rotate-45 text-2xl leading-none">+</span>
                </summary>
                <p className="mt-4 text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative bg-card border border-border rounded-3xl p-12 md:p-20 overflow-hidden" data-reveal>
            <div
              className="absolute inset-0 opacity-30"
              style={{ background: "radial-gradient(circle at 30% 50%, rgba(163,230,53,0.3), transparent 50%)" }}
            />
            <div className="relative">
              <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6 font-fraunces">
                Start accepting<br />crypto today.
              </h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-xl">No setup fees. No monthly minimums. Cancel anytime.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold"
                >
                  Get started
                </Link>
                <a
                  href="#checkout"
                  className="inline-flex items-center justify-center px-8 py-4 border border-border rounded-2xl font-semibold"
                >
                  Try the demo
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
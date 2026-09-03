import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeftRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Loader2,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CoinRail — Crypto-Only Payment Gateway Checkout" },
      {
        name: "description",
        content:
          "Accept BTC, ETH, USDT and SOL payments with a crypto-only checkout: live rates, QR pay, wallet deep links, and confirmation tracking on mobile and desktop.",
      },
      { property: "og:title", content: "CoinRail — Crypto-Only Payment Gateway" },
      {
        property: "og:description",
        content:
          "A crypto-only checkout flow with QR pay, live conversion, and on-chain confirmation tracking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckoutPage,
});

type Coin = {
  id: string;
  name: string;
  symbol: string;
  network: string;
  rate: number; // USD per unit
  decimals: number;
  uriScheme: string;
  address: string;
  confirmations: number;
};

const COINS: Coin[] = [
  {
    id: "btc",
    name: "Bitcoin",
    symbol: "BTC",
    network: "Bitcoin",
    rate: 96420,
    decimals: 8,
    uriScheme: "bitcoin",
    address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
    confirmations: 2,
  },
  {
    id: "eth",
    name: "Ethereum",
    symbol: "ETH",
    network: "ERC-20",
    rate: 3180,
    decimals: 6,
    uriScheme: "ethereum",
    address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    confirmations: 12,
  },
  {
    id: "usdt",
    name: "Tether",
    symbol: "USDT",
    network: "TRC-20",
    rate: 1,
    decimals: 2,
    uriScheme: "tron",
    address: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
    confirmations: 20,
  },
  {
    id: "sol",
    name: "Solana",
    symbol: "SOL",
    network: "Solana",
    rate: 178.4,
    decimals: 4,
    uriScheme: "solana",
    address: "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj",
    confirmations: 1,
  },
];

const STEPS = ["Amount", "Pay", "Confirming"] as const;

function CheckoutPage() {
  const [amountUsd, setAmountUsd] = useState("149.00");
  const [coin, setCoin] = useState<Coin>(COINS[0]!);
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState<"address" | "amount" | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [confirmations, setConfirmations] = useState(0);

  const usd = Number.parseFloat(amountUsd) || 0;
  const cryptoAmount = useMemo(
    () => (usd / coin.rate).toFixed(coin.decimals),
    [usd, coin],
  );
  const payUri = `${coin.uriScheme}:${coin.address}?amount=${cryptoAmount}`;

  useEffect(() => {
    if (step !== 1) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [step]);

  useEffect(() => {
    if (step !== 2) return;
    setConfirmations(0);
    const t = setInterval(
      () => setConfirmations((c) => Math.min(coin.confirmations, c + 1)),
      1200,
    );
    return () => clearInterval(t);
  }, [step, coin.confirmations]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async (value: string, what: "address" | "amount") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(what);
    } catch {
      setCopied(null);
    }
  };

  const mmss = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(
    secondsLeft % 60,
  ).padStart(2, "0")}`;
  const settled = step === 2 && confirmations >= coin.confirmations;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10 lg:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 lg:mb-10">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wallet className="size-5" />
            </span>
            <div>
              <p className="font-display text-lg leading-none font-bold tracking-tight">
                CoinRail
              </p>
              <p className="text-xs text-muted-foreground">Crypto-only gateway</p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1.5 border-primary/40 text-primary">
            <ShieldCheck className="size-3.5" /> Non-custodial · No cards
          </Badge>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1fr_22rem] lg:gap-8">
          {/* Main panel */}
          <section className="rounded-3xl border bg-card/70 p-4 backdrop-blur sm:p-6 lg:p-8">
            <ol className="mb-6 flex items-center gap-2 text-xs sm:text-sm">
              {STEPS.map((label, i) => (
                <li key={label} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex items-center gap-2 rounded-full px-3 py-1.5 font-medium transition-colors",
                      i === step
                        ? "bg-primary text-primary-foreground"
                        : i < step
                          ? "bg-primary/15 text-primary"
                          : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {i < step ? <Check className="size-3.5" /> : <span>{i + 1}</span>}
                    {label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  )}
                </li>
              ))}
            </ol>

            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    Pay with crypto
                  </h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Choose a coin and network. Rates lock for 15 minutes at checkout.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Order amount (USD)</Label>
                  <div className="relative">
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="amount"
                      inputMode="decimal"
                      value={amountUsd}
                      onChange={(e) => setAmountUsd(e.target.value)}
                      className="h-12 pl-7 font-display text-lg"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Select asset</Label>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {COINS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCoin(c)}
                        className={cn(
                          "rounded-2xl border p-3 text-left transition-all",
                          coin.id === c.id
                            ? "border-primary bg-primary/10 ring-1 ring-primary"
                            : "bg-secondary/40 hover:border-primary/50",
                        )}
                      >
                        <p className="font-display text-base font-bold">{c.symbol}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.name}</p>
                        <p className="mt-1.5 text-[11px] text-primary">{c.network}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-secondary/50 p-4 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <ArrowLeftRight className="size-4" /> You send
                  </span>
                  <span className="font-display text-base font-bold">
                    {cryptoAmount} {coin.symbol}
                  </span>
                </div>

                <Button
                  size="lg"
                  className="h-12 w-full text-base"
                  disabled={usd <= 0}
                  onClick={() => {
                    setSecondsLeft(15 * 60);
                    setStep(1);
                  }}
                >
                  Continue to payment
                </Button>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
                <div className="mx-auto rounded-2xl bg-white p-3 sm:mx-0">
                  <QRCodeSVG value={payUri} size={168} level="M" />
                </div>
                <div className="space-y-4">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                      Send exactly {cryptoAmount} {coin.symbol}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {coin.network} network only. Other networks will be lost.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Deposit address</Label>
                    <div className="flex items-center gap-2 rounded-xl border bg-secondary/40 p-2.5">
                      <code className="min-w-0 flex-1 truncate text-xs sm:text-sm">
                        {coin.address}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Copy address"
                        onClick={() => copy(coin.address, "address")}
                      >
                        {copied === "address" ? (
                          <Check className="size-4 text-primary" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="secondary" className="gap-1.5">
                      <Clock className="size-3.5" /> Rate locked {mmss}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copy(cryptoAmount, "amount")}
                    >
                      {copied === "amount" ? "Amount copied" : "Copy amount"}
                    </Button>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button asChild className="h-11 flex-1">
                      <a href={payUri}>Open in wallet</a>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11 flex-1"
                      onClick={() => setStep(2)}
                    >
                      I've sent the payment
                    </Button>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                    onClick={() => setStep(0)}
                  >
                    Change amount or asset
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 py-4 text-center">
                <span
                  className={cn(
                    "mx-auto flex size-16 items-center justify-center rounded-2xl",
                    settled ? "bg-primary text-primary-foreground" : "bg-secondary",
                  )}
                >
                  {settled ? (
                    <BadgeCheck className="size-8" />
                  ) : (
                    <Loader2 className="size-8 animate-spin text-primary" />
                  )}
                </span>
                <div>
                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                    {settled ? "Payment confirmed" : "Waiting for confirmations"}
                  </h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {confirmations}/{coin.confirmations} confirmations on {coin.network}
                  </p>
                </div>
                <div className="mx-auto h-2 w-full max-w-sm overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{
                      width: `${(confirmations / coin.confirmations) * 100}%`,
                    }}
                  />
                </div>
                <Button variant="outline" onClick={() => setStep(0)}>
                  Start a new payment
                </Button>
              </div>
            )}
          </section>

          {/* Order summary */}
          <aside className="rounded-3xl border bg-card/70 p-5 backdrop-blur sm:p-6 lg:sticky lg:top-12">
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Order summary
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>${usd.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Network fee</dt>
                <dd className="text-primary">Paid by sender</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Asset</dt>
                <dd>
                  {coin.symbol} · {coin.network}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Rate</dt>
                <dd>
                  1 {coin.symbol} = ${coin.rate.toLocaleString()}
                </dd>
              </div>
            </dl>
            <Separator className="my-4" />
            <div className="flex items-end justify-between gap-4">
              <span className="text-sm text-muted-foreground">Total due</span>
              <span className="font-display text-xl font-bold">
                {cryptoAmount} {coin.symbol}
              </span>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Crypto payments are final. Always verify the address and network before
              sending funds.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

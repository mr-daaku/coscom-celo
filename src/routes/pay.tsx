import { createFileRoute } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  Download,
  PartyPopper,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  DEPOSIT_ADDRESSES,
  NETWORK_COLORS,
  TOKEN_NETWORKS,
  TOKENS,
} from "@/lib/coscom";

export const Route = createFileRoute("/pay")({
  head: () => ({
    meta: [
      { title: "Pay with Crypto — CosComPay Hosted Checkout" },
      {
        name: "description",
        content:
          "CosComPay hosted crypto checkout: pick a token and network, scan the QR code and settle in seconds.",
      },
      { property: "og:title", content: "Pay with Crypto — CosComPay Checkout" },
      {
        property: "og:description",
        content: "Pick a token, pick a network, scan and pay. Settled in seconds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PayPage,
});

const INVOICE = { id: "INV-2042", merchant: "Nordwind Studio", usd: 249 };

function Confetti({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const colors = ["#a3e635", "#38bdf8", "#34d399", "#fbbf24"];
    const bits = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      r: 3 + Math.random() * 4,
      vy: 1.5 + Math.random() * 2.5,
      vx: -1 + Math.random() * 2,
      c: colors[Math.floor(Math.random() * colors.length)]!,
    }));
    let raf = 0;
    let frames = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      bits.forEach((b) => {
        b.x += b.vx;
        b.y += b.vy;
        if (b.y > canvas.height) b.y = -10;
        ctx.fillStyle = b.c;
        ctx.fillRect(b.x, b.y, b.r, b.r * 1.6);
      });
      frames += 1;
      if (frames < 320) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full"
    />
  );
}

function PayPage() {
  const [step, setStep] = useState(0);
  const [token, setToken] = useState<(typeof TOKENS)[number] | null>(null);
  const [network, setNetwork] = useState<{
    chain: string;
    standard: string;
    confirmations: number;
  } | null>(null);
  const [seconds, setSeconds] = useState(30 * 60);
  const [hash, setHash] = useState("");
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (step !== 2 || paid) return;
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [step, paid]);

  const price = token ? Number(token.price.replace(/[$,]/g, "")) : 1;
  const due = token ? (INVOICE.usd / price).toFixed(price > 100 ? 6 : 2) : "0";
  const address = network ? (DEPOSIT_ADDRESSES[network.chain] ?? "") : "";
  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60,
  ).padStart(2, "0")}`;

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Zap className="size-4" />
          </span>
          <span className="font-fraunces text-lg font-bold">CosComPay</span>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" /> Secure checkout
          </span>
        </div>

        <div className="relative mt-6 overflow-hidden rounded-3xl border border-border bg-card/90 p-5 backdrop-blur-xl sm:p-7">
          <Confetti active={paid} />

          {/* stepper */}
          <ol className="flex items-center gap-2 text-xs">
            {["Token", "Network", "Pay"].map((label, i) => (
              <li key={label} className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-3 py-1.5 font-medium",
                    i === step
                      ? "bg-primary text-primary-foreground"
                      : i < step
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {i + 1}. {label}
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-6 rounded-2xl bg-muted/40 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice</span>
              <span className="font-mono">{INVOICE.id}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span className="text-muted-foreground">Merchant</span>
              <span>{INVOICE.merchant}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-fraunces text-base font-bold">
                ${INVOICE.usd.toFixed(2)}
              </span>
            </div>
          </div>

          {paid ? (
            <div className="relative mt-7 text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <PartyPopper className="size-7" />
              </span>
              <h1 className="mt-5 font-fraunces text-2xl font-bold">Payment received</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {due} {token?.symbol} on {network?.chain} · {network?.confirmations}{" "}
                confirmations
              </p>
              <div className="mt-6 rounded-2xl border border-border p-4 text-left text-sm">
                <p className="font-fraunces font-semibold">Receipt</p>
                <dl className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Invoice</dt>
                    <dd className="font-mono">{INVOICE.id}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Paid</dt>
                    <dd>
                      {due} {token?.symbol}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Tx hash</dt>
                    <dd className="truncate font-mono">{hash || "0x…"}</dd>
                  </div>
                </dl>
              </div>
              <Button variant="outline" className="mt-5 gap-2">
                <Download className="size-4" /> Download receipt
              </Button>
            </div>
          ) : step === 0 ? (
            <div className="mt-7">
              <h1 className="font-fraunces text-xl font-bold">Select a token</h1>
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {TOKENS.map((t) => (
                  <button
                    key={t.symbol}
                    type="button"
                    onClick={() => {
                      setToken(t);
                      setNetwork(null);
                      setStep(1);
                    }}
                    className="rounded-2xl border border-border bg-muted/40 p-3 text-left transition-all hover:scale-[1.02] hover:border-primary"
                  >
                    <p className="font-mono text-sm font-bold">{t.symbol}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.name}</p>
                    <p className="mt-1 text-[11px] text-primary">{t.price}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : step === 1 && token ? (
            <div className="mt-7">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" /> Change token
              </button>
              <h1 className="font-fraunces text-xl font-bold">
                Select a network for {token.symbol}
              </h1>
              <div className="mt-4 space-y-2">
                {(TOKEN_NETWORKS[token.symbol] ?? []).map((n) => (
                  <button
                    key={n.chain}
                    type="button"
                    onClick={() => {
                      setNetwork(n);
                      setSeconds(30 * 60);
                      setStep(2);
                    }}
                    className="flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-muted/40 p-4 text-left transition-all hover:border-primary"
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className="size-3 rounded-full"
                        style={{ backgroundColor: NETWORK_COLORS[n.chain] ?? "#a3e635" }}
                      />
                      <span>
                        <span className="block text-sm">{n.chain}</span>
                        <span className="block text-xs text-muted-foreground">
                          {n.standard}
                        </span>
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {n.confirmations} confirmations
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            token &&
            network && (
              <div className="mt-7">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-3.5" /> Change network
                </button>
                <div className="flex items-center justify-between">
                  <h1 className="font-fraunces text-xl font-bold">
                    Send {due} {token.symbol}
                  </h1>
                  <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs">
                    <Clock className="size-3.5" /> {mmss}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {network.chain} ({network.standard}) only — other networks are lost.
                </p>

                <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                  <div className="rounded-2xl bg-white p-3">
                    <QRCodeSVG value={`${token.symbol}:${address}?amount=${due}`} size={148} />
                  </div>
                  <div className="w-full min-w-0 space-y-4">
                    <div>
                      <Label className="text-xs">Wallet address</Label>
                      <div className="mt-1.5 flex items-center gap-2">
                        <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-2 py-2 font-mono text-[11px]">
                          {address}
                        </code>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Copy address"
                          onClick={() => {
                            void navigator.clipboard.writeText(address);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1500);
                          }}
                        >
                          {copied ? (
                            <Check className="size-4 text-primary" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="txhash" className="text-xs">
                        Transaction hash (optional)
                      </Label>
                      <Input
                        id="txhash"
                        value={hash}
                        onChange={(e) => setHash(e.target.value)}
                        placeholder="0x…"
                        className="font-mono text-xs"
                      />
                    </div>
                    <Button
                      className="h-11 w-full transition-transform hover:scale-[1.02]"
                      onClick={() => setPaid(true)}
                    >
                      Check payment
                    </Button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </main>
  );
}

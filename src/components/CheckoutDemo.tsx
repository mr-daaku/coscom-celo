import { QRCodeSVG } from "qrcode.react";
import { Check, Clock, Copy } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEPOSIT_ADDRESSES, NETWORK_COLORS } from "@/lib/coscom";

const COINS = [
  { symbol: "BTC", name: "Bitcoin", network: "Bitcoin", rate: 112480, decimals: 6 },
  { symbol: "ETH", name: "Ethereum", network: "Ethereum", rate: 4284, decimals: 5 },
  { symbol: "USDT", name: "Tether", network: "TRON", rate: 1, decimals: 2 },
  { symbol: "SOL", name: "Solana", network: "Solana", rate: 178.4, decimals: 4 },
];

export function CheckoutDemo({ amount = 249 }: { amount?: number }) {
  const [coin, setCoin] = useState(COINS[0]!);
  const [seconds, setSeconds] = useState(29 * 60 + 45);
  const [copied, setCopied] = useState(false);
  const [drift, setDrift] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    const r = setInterval(() => setDrift(Math.random() * 0.004 - 0.002), 5000);
    return () => {
      clearInterval(t);
      clearInterval(r);
    };
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const address = DEPOSIT_ADDRESSES[coin.network] ?? "";
  const due = (amount / (coin.rate * (1 + drift))).toFixed(coin.decimals);
  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60,
  ).padStart(2, "0")}`;

  return (
    <div className="rounded-3xl border border-border bg-card/90 p-5 backdrop-blur-xl sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Amount due</p>
          <p className="font-fraunces text-2xl font-bold">${amount.toFixed(2)}</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" /> {mmss}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2">
        {COINS.map((c) => (
          <button
            key={c.symbol}
            type="button"
            onClick={() => setCoin(c)}
            className={cn(
              "rounded-xl border p-2.5 text-center transition-all hover:scale-[1.02]",
              coin.symbol === c.symbol
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted/40 text-muted-foreground",
            )}
          >
            <span className="font-mono text-xs font-bold">{c.symbol}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="rounded-2xl bg-white p-2.5">
          <QRCodeSVG value={`${coin.symbol.toLowerCase()}:${address}?amount=${due}`} size={116} />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Send exactly</p>
            <p className="font-mono text-sm">
              {due} {coin.symbol}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Network ·{" "}
              <span style={{ color: NETWORK_COLORS[coin.network] ?? "inherit" }}>
                {coin.network}
              </span>
            </p>
            <div className="mt-1 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-2 py-1.5 font-mono text-[11px]">
                {address}
              </code>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Copy address"
                onClick={() => {
                  void navigator.clipboard.writeText(address);
                  setCopied(true);
                }}
              >
                {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <dl className="mt-5 space-y-2 border-t border-border pt-4 text-xs">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Gateway fee</dt>
          <dd>0.4%</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Network fee</dt>
          <dd>Paid by sender</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Rate refresh</dt>
          <dd className="text-primary">Live · every 5s</dd>
        </div>
      </dl>

      <Button className="mt-5 h-11 w-full transition-transform hover:scale-[1.02]">
        Pay now
      </Button>
    </div>
  );
}

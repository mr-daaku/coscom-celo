import { useMutation, useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Check, Clock, Copy, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPaymentByReference, selectPaymentAsset, submitPaymentTx } from "@/lib/gateway.functions";
import { NETWORK_COLORS } from "@/lib/coscom";
import { ASSET_CODES, ANY_ASSET } from "@/lib/assets";

type Payment = {
  reference: string;
  amount_usd: number;
  coin: string;
  chain: string;
  crypto_amount: number | null;
  deposit_address: string;
  status: string;
  expires_at: string;
  description: string | null;
};

export function RealCheckout({ reference }: { reference: string }) {
  const [hash, setHash] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());

  const payment = useQuery({
    queryKey: ["public-payment", reference],
    retry: false,
    refetchInterval: 15_000,
    queryFn: async () => (await getPaymentByReference({ data: { reference } })) as unknown as Payment,
  });

  const choose = useMutation({
    mutationFn: (asset: string) => selectPaymentAsset({ data: { reference, asset } }),
    onSuccess: () => {
      setError(null);
      void payment.refetch();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not select that asset"),
  });

  const submit = useMutation({
    mutationFn: () => submitPaymentTx({ data: { reference, tx_hash: hash.trim() } }),
    onSuccess: () => {
      setError(null);
      void payment.refetch();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Verification failed"),
  });

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (payment.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </main>
    );
  }

  if (payment.isError || !payment.data) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card/90 p-8 text-center backdrop-blur-xl">
          <h1 className="font-fraunces text-2xl font-bold">Payment not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This payment link is invalid or has been removed.
          </p>
        </div>
      </main>
    );
  }

  const p = payment.data;
  const left = Math.max(0, Math.floor((new Date(p.expires_at).getTime() - now) / 1000));
  const mmss = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
  const settled = p.status === "paid";

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
      <div className="rounded-3xl border border-border bg-card/90 p-6 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Amount due</p>
            <h1 className="font-fraunces text-3xl font-bold">${Number(p.amount_usd).toFixed(2)}</h1>
            {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
          </div>
          {!settled && (
            <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" /> {mmss}
            </span>
          )}
        </div>

        {!settled && p.coin === ANY_ASSET ? (
          <div className="mt-6">
            <p className="text-sm font-medium">Choose how you want to pay</p>
            <p className="mt-1 text-xs text-muted-foreground">
              This invoice accepts any supported coin or network. Pick one to get a deposit address.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ASSET_CODES.map((a) => (
                <button
                  key={a.code}
                  type="button"
                  disabled={choose.isPending}
                  onClick={() => choose.mutate(a.code)}
                  className="rounded-xl border border-border bg-muted/40 p-3 text-left transition-colors hover:border-primary disabled:opacity-60"
                >
                  <p className="font-mono text-xs font-bold">{a.code}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.label}</p>
                </button>
              ))}
            </div>
            {choose.isPending && (
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Preparing your deposit address…
              </p>
            )}
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          </div>
        ) : settled ? (
          <div className="mt-8 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/15">
              <Check className="size-7 text-primary" />
            </span>
            <p className="mt-4 font-fraunces text-xl font-bold">Payment confirmed</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Verified on-chain. You can close this page — the merchant has been notified.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="rounded-2xl bg-white p-3">
                <QRCodeSVG
                  value={`${p.coin.toLowerCase()}:${p.deposit_address}?amount=${p.crypto_amount ?? ""}`}
                  size={128}
                />
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Send exactly</p>
                  <p className="font-mono text-sm">
                    {p.crypto_amount} {p.coin}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Network ·{" "}
                    <span style={{ color: NETWORK_COLORS[p.chain] ?? "inherit" }}>{p.chain}</span>
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-2 py-1.5 font-mono text-[11px]">
                      {p.deposit_address}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Copy address"
                      onClick={() => {
                        void navigator.clipboard.writeText(p.deposit_address);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }}
                    >
                      {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-5">
              <Label htmlFor="txhash">Paste your transaction hash</Label>
              <Input
                id="txhash"
                className="mt-1.5"
                value={hash}
                onChange={(e) => setHash(e.target.value)}
                placeholder="0x… / TRON / Solana signature"
              />
              {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
              {p.status === "confirming" && !error && (
                <p className="mt-2 text-sm text-warning">Waiting for network confirmations…</p>
              )}
              <Button
                className="mt-4 h-11 w-full"
                disabled={!hash.trim() || submit.isPending || left === 0}
                onClick={() => submit.mutate()}
              >
                {submit.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                {left === 0 ? "Payment window expired" : "I have paid — verify"}
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 text-primary" /> Verified directly against the blockchain
              </p>
            </div>
          </>
        )}
      </div>
      <p className="mt-4 text-center font-mono text-xs text-muted-foreground">{p.reference}</p>
    </main>
  );
}

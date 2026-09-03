import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Cpu, ExternalLink, Loader2, Search } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CHAINS,
  checkChainTransaction,
  type ChainId,
  type ChainTxResult,
} from "@/lib/chain.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/workers")({
  head: () => ({
    meta: [
      { title: "Chain Checker — Verify Crypto Transactions | CosComPay" },
      {
        name: "description",
        content:
          "Verify any Ethereum, BNB Chain, Polygon, Base, TRON, Solana or TON transaction directly from network RPCs with the CosComPay chain checker.",
      },
      { property: "og:title", content: "Chain Checker — CosComPay" },
      {
        property: "og:description",
        content: "Read transaction status, amounts and fees straight from the blockchain.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorkersPage,
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="max-w-full min-w-0 break-all text-right font-mono text-xs">{value}</span>
    </div>
  );
}

function WorkersPage() {
  const { ready, user } = useAuth();
  const [chain, setChain] = useState<ChainId>("ethereum");
  const [hash, setHash] = useState("");
  const [result, setResult] = useState<ChainTxResult | null>(null);

  const check = useMutation({
    mutationFn: () => checkChainTransaction({ data: { chain, hash: hash.trim() } }),
    onSuccess: setResult,
  });

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card/90 p-8 text-center backdrop-blur-xl">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Cpu className="size-6" />
          </span>
          <h1 className="mt-5 font-fraunces text-2xl font-bold">Chain checker</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to verify transactions across all supported networks.
          </p>
          <Button className="mt-6 w-full" asChild>
            <Link to="/login">Sign in with Google</Link>
          </Button>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pt-28 pb-16 sm:px-6">
      <h1 className="font-fraunces text-3xl font-bold sm:text-4xl">Chain checker</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Read any transaction directly from the network RPC — status, amount, token, addresses,
        fee and block.
      </p>

      <div className="mt-8 rounded-3xl border border-border bg-card/90 p-5 backdrop-blur-xl sm:p-6">
        <div className="grid gap-3 sm:grid-cols-[170px_1fr_auto]">
          <select
            value={chain}
            onChange={(e) => setChain(e.target.value as ChainId)}
            className="h-9 rounded-xl border border-input bg-card px-3 text-sm"
            aria-label="Network"
          >
            {CHAINS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <Input
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            placeholder="Transaction hash / signature"
            className="font-mono text-xs"
          />
          <Button
            className="gap-2"
            disabled={check.isPending || hash.trim().length < 10}
            onClick={() => check.mutate()}
          >
            {check.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Check
          </Button>
        </div>

        {result && (
          <div className="mt-6">
            {!result.found ? (
              <p className="text-sm text-destructive">
                {result.message ?? "Transaction not found."}
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge
                    variant="outline"
                    className={
                      result.status === "confirmed"
                        ? "border-primary/40 text-primary"
                        : result.status === "pending"
                          ? "border-warning/40 text-warning"
                          : "border-destructive/40 text-destructive"
                    }
                  >
                    {result.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {result.type} on {result.chainLabel}
                  </span>
                </div>
                <div className="mt-4">
                  <Row label="Amount" value={`${result.amount ?? "0"} ${result.coin ?? ""}`} />
                  {result.tokenName && <Row label="Token" value={result.tokenName} />}
                  {result.contract && <Row label="Contract" value={result.contract} />}
                  <Row label="From" value={result.from || "—"} />
                  <Row label="To" value={result.to || "—"} />
                  <Row
                    label="Network fee"
                    value={result.fee ? `${result.fee} ${result.feeCoin ?? ""}` : "—"}
                  />
                  <Row
                    label="Block"
                    value={result.blockNumber ? String(result.blockNumber) : "—"}
                  />
                  <Row
                    label="Time"
                    value={result.timestamp ? new Date(result.timestamp).toLocaleString() : "—"}
                  />
                  <Row label="Hash" value={result.hash} />
                </div>
                <Button variant="outline" className="mt-5 gap-2" asChild>
                  <a href={result.explorerUrl} target="_blank" rel="noreferrer">
                    View on explorer <ExternalLink className="size-4" />
                  </a>
                </Button>
              </>
            )}
          </div>
        )}

        {check.isError && (
          <p className="mt-4 text-sm text-destructive">
            {check.error instanceof Error ? check.error.message : "Lookup failed"}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {CHAINS.map((c) => (
          <span
            key={c.id}
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground"
          >
            {c.label}
          </span>
        ))}
      </div>
    </main>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Zap } from "lucide-react";

import { RealCheckout } from "@/components/RealCheckout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pay")({
  validateSearch: (search: Record<string, unknown>) => ({
    ref: typeof search["ref"] === "string" ? search["ref"] : undefined,
  }),

  head: () => ({
    meta: [
      { title: "Pay with Crypto — CosComPay Hosted Checkout" },
      {
        name: "description",
        content:
          "CosComPay hosted crypto checkout: open a merchant payment link, send the exact amount and we verify it on-chain.",
      },
      { property: "og:title", content: "Pay with Crypto — CosComPay Checkout" },
      {
        property: "og:description",
        content: "Open a merchant payment link to settle an invoice in Bitcoin, Ethereum or stablecoins.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PayPage,
});

function PayPage() {
  const { ref } = Route.useSearch();
  if (ref) return <RealCheckout reference={ref} />;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
      <div className="rounded-3xl border border-border bg-card/90 p-7 text-center backdrop-blur-xl">
        <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Zap className="size-5" />
        </span>
        <h1 className="mt-5 font-fraunces text-2xl font-bold">No payment to show</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Checkout pages open from a merchant payment link that carries a reference, for example{" "}
          <code className="font-mono text-xs">/pay?ref=cos_…</code>. Ask the merchant for a fresh link, or
          create one from your dashboard.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to="/dashboard" search={{ tab: "overview" }}>
              Go to dashboard
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/docs">Read the API docs</Link>
          </Button>
        </div>
        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" /> Every payment is verified directly on-chain
        </p>
      </div>
    </main>
  );
}

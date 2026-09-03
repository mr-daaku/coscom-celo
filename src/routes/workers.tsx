import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Activity, ArrowLeft, Cpu, Gauge, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { readUser, WORKERS, type CoscomUser } from "@/lib/coscom";

export const Route = createFileRoute("/workers")({
  head: () => ({
    meta: [
      { title: "Edge Workers — CosComPay Crypto Infrastructure" },
      {
        name: "description",
        content:
          "Monitor CosComPay edge Workers powering crypto checkout routing, webhooks, rate oracles and settlement batching.",
      },
      { property: "og:title", content: "Edge Workers — CosComPay" },
      {
        property: "og:description",
        content: "Crypto payment infrastructure running at the edge.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorkersPage,
});

function WorkersPage() {
  const [user, setUser] = useState<CoscomUser | null>(null);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setUser(readUser());
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card/90 p-8 text-center backdrop-blur-xl">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Cpu className="size-6" />
          </span>
          <h1 className="mt-5 font-fraunces text-2xl font-bold">Workers access</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to view and deploy your edge Workers.
          </p>
          <Button className="mt-6 w-full" onClick={() => navigate({ to: "/login" })}>
            Continue with Google
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

  const stats = [
    { label: "Active Workers", value: "3", icon: Cpu },
    { label: "Invocations (30d)", value: "5.5M", icon: Activity },
    { label: "Avg Latency", value: "21ms", icon: Gauge },
  ];

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-fraunces text-3xl font-bold tracking-tight">Workers</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Edge functions powering your crypto checkout.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-card/90 p-5 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <s.icon className="size-4 text-primary" />
              </div>
              <p className="mt-3 font-fraunces text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-card/90 backdrop-blur-xl">
          {WORKERS.map((w, i) => (
            <div
              key={w.name}
              className={`flex flex-wrap items-center justify-between gap-4 p-5 ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Zap className="size-4" />
                </span>
                <div>
                  <p className="font-mono text-sm">{w.name}</p>
                  <p className="text-xs text-muted-foreground">{w.region}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-muted-foreground">{w.invocations} calls</span>
                <span className="text-muted-foreground">{w.latency}</span>
                <Badge
                  variant="outline"
                  className={
                    w.status === "active"
                      ? "border-primary/40 text-primary"
                      : "border-border text-muted-foreground"
                  }
                >
                  {w.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

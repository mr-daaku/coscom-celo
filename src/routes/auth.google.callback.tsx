import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Check, Loader2, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { DEMO_USER, writeUser } from "@/lib/coscom";

export const Route = createFileRoute("/auth/google/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : "",
  }),
  head: () => ({
    meta: [
      { title: "Signing you in — CosComPay" },
      { name: "description", content: "Completing your CosComPay sign-in." },
      { property: "og:title", content: "Signing you in — CosComPay" },
      { property: "og:description", content: "Completing your CosComPay sign-in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CallbackPage,
});

function CallbackPage() {
  const { code } = Route.useSearch();
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!code) {
      setState("error");
      return;
    }
    const t = setTimeout(() => {
      writeUser(DEMO_USER);
      setState("success");
    }, 1100);
    return () => clearTimeout(t);
  }, [code]);

  useEffect(() => {
    if (state !== "success") return;
    const t = setTimeout(() => navigate({ to: "/dashboard" }), 1200);
    return () => clearTimeout(t);
  }, [state, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card/90 p-8 text-center backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Zap className="size-4" />
          </span>
          <span className="font-fraunces text-lg font-bold">CosComPay</span>
        </div>

        {state === "loading" && (
          <>
            <Loader2 className="mx-auto size-9 animate-spin text-primary" />
            <h1 className="mt-5 font-fraunces text-xl font-bold">Signing you in…</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Verifying your Google account.
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Check className="size-6" />
            </span>
            <h1 className="mt-5 font-fraunces text-xl font-bold">
              Welcome, {DEMO_USER.name.split(" ")[0]}!
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Redirecting you to the dashboard…
            </p>
          </>
        )}

        {state === "error" && (
          <>
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
              <AlertTriangle className="size-6" />
            </span>
            <h1 className="mt-5 font-fraunces text-xl font-bold">Sign-in failed</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We didn't receive an authorization code from Google.
            </p>
            <Button className="mt-6" onClick={() => navigate({ to: "/login" })}>
              Try again
            </Button>
          </>
        )}
      </div>
    </main>
  );
}

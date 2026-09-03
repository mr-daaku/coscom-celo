import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Check, Loader2, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { displayName } from "@/lib/auth";

export const Route = createFileRoute("/auth/google/callback")({
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
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [name, setName] = useState("there");

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        setName(displayName(data.session.user, null).split(" ")[0] ?? "there");
        setState("success");
        return;
      }
      attempts += 1;
      if (attempts > 12) {
        setState("error");
        return;
      }
      setTimeout(() => void check(), 500);
    };

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state !== "success") return;
    const t = setTimeout(
      () => navigate({ to: "/dashboard", search: { tab: "overview" } }),
      900,
    );
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
            <h1 className="mt-5 font-fraunces text-xl font-bold">Welcome, {name}!</h1>
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
              We couldn't complete your Google sign-in. Please try again.
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

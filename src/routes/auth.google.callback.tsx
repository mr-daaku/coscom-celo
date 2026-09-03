import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { api } from "@/lib/api";

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
  const [message, setMessage] = useState("");
  const [name, setName] = useState("there");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get("error");

      if (oauthError) {
        setMessage(
          oauthError === "access_denied"
            ? "You cancelled the Google sign-in."
            : params.get("error_description") ?? "Google sign-in was not completed.",
        );
        setState("error");
        return;
      }

      const code = params.get("code");
      const state = params.get("state");
      const expected = sessionStorage.getItem("coscompay_oauth_state");
      sessionStorage.removeItem("coscompay_oauth_state");

      if (!code) {
        setMessage("Google did not return an authorization code.");
        setState("error");
        return;
      }
      if (expected && state !== expected) {
        setMessage("Sign-in state mismatch. Please start again.");
        setState("error");
        return;
      }

      const result = await api.auth.completeGoogleSignIn(code);
      setName((result.name.split(" ")[0] ?? "there") || "there");
      setState("success");
    };

    void run().catch((error: unknown) => {
      // Without this the page hangs forever on "Signing you in…" whenever the
      // server function throws (e.g. missing backend env bindings on a
      // self-hosted deployment).
      console.error("google callback failed", error);
      setMessage(
        error instanceof Error && error.message
          ? error.message
          : "The server could not complete the Google sign-in. Please try again.",
      );
      setState("error");
    });
  }, []);


  useEffect(() => {
    if (state !== "success") return undefined;
    const t = setTimeout(
      () => void navigate({ to: "/dashboard", search: { tab: "overview" } }),
      900,
    );
    return () => clearTimeout(t);
  }, [state, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card/90 p-8 text-center backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-center gap-2">
          <img
            src={logo}
            alt="CosComPay logo"
            width={32}
            height={32}
            loading="lazy"
            className="size-8 rounded-lg"
          />
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
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <Button className="mt-6" onClick={() => void navigate({ to: "/login" })}>
              Try again
            </Button>
          </>
        )}
      </div>
    </main>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { SpotlightBackground } from "@/components/SpotlightBackground";
import logo from "@/assets/logo.png";
import { activateAccount } from "@/lib/account.functions";

export const Route = createFileRoute("/verify-email")({
  head: () => ({
    meta: [
      { title: "Activate your account — CosComPay" },
      {
        name: "description",
        content: "Confirm your email address to activate your CosComPay merchant account.",
      },
      { property: "og:title", content: "Activate your account — CosComPay" },
      {
        property: "og:description",
        content: "Confirm your email address to activate your CosComPay account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const run = async () => {
      const token = new URLSearchParams(window.location.search).get("token");
      if (!token) {
        setMessage("This activation link is incomplete.");
        setState("error");
        return;
      }
      const { error } = await activateAccount({ data: { token } });
      if (error) {
        setMessage(error);
        setState("error");
        return;
      }
      setState("success");
    };

    void run();
  }, []);

  useEffect(() => {
    if (state !== "success") return undefined;
    const t = setTimeout(() => void navigate({ to: "/login" }), 1600);
    return () => clearTimeout(t);
  }, [state, navigate]);

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4">
      <SpotlightBackground />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-border bg-card/90 p-8 text-center backdrop-blur-xl">
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
            <h1 className="mt-5 font-fraunces text-xl font-bold">Activating your account…</h1>
          </>
        )}

        {state === "success" && (
          <>
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Check className="size-6" />
            </span>
            <h1 className="mt-5 font-fraunces text-xl font-bold">Account activated</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Taking you to sign in…
            </p>
          </>
        )}

        {state === "error" && (
          <>
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
              <AlertTriangle className="size-6" />
            </span>
            <h1 className="mt-5 font-fraunces text-xl font-bold">Activation failed</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <Button className="mt-6" asChild>
              <Link to="/signup">Sign up again</Link>
            </Button>
          </>
        )}
      </div>
    </main>
  );
}

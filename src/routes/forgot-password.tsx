import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, Mail } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { SpotlightBackground } from "@/components/SpotlightBackground";
import { Turnstile } from "@/components/site/Turnstile";
import logo from "@/assets/logo.png";
import { resetPassword } from "@/lib/auth";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot your password — CosComPay" },
      {
        name: "description",
        content:
          "Request a CosComPay password reset link. The link is emailed to you and stays valid for 10 minutes.",
      },
      { property: "og:title", content: "Forgot your password — CosComPay" },
      {
        property: "og:description",
        content: "Request a password reset link for your CosComPay merchant account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    if (!token) {
      setError("Please complete the security check");
      return;
    }
    setBusy(true);
    const { error: err } = await resetPassword(email.trim(), token);
    setBusy(false);
    setNonce((n) => n + 1);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <SpotlightBackground />
      <div className="relative z-10 w-full max-w-md">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>

        <div className="animate-scale-in rounded-3xl border border-border bg-card/90 p-6 backdrop-blur-xl sm:p-8">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="CosComPay logo"
              width={40}
              height={40}
              loading="lazy"
              className="size-10 rounded-xl"
            />
            <span className="font-fraunces text-lg font-bold">CosComPay</span>
          </div>

          <h1 className="mt-7 font-fraunces text-2xl font-bold">Forgot your password?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;ll email you a reset link that stays valid for 10 minutes.
          </p>

          {sent ? (
            <p className="mt-6 text-sm text-primary">
              If an account exists for {email}, a reset link is on its way. Check your inbox
              (and spam) — the link expires in 10 minutes.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@company.com"
                  aria-label="Email address"
                  className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                />
              </div>

              <Turnstile onToken={setToken} resetKey={nonce} />

              {error && (
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="size-3.5" />
                  {error}
                </p>
              )}

              <Button type="submit" className="h-12 w-full" disabled={busy}>
                {busy ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

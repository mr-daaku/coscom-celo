import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Lock } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { SpotlightBackground } from "@/components/SpotlightBackground";
import logo from "@/assets/logo.png";
import { completePasswordReset } from "@/lib/account.functions";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — CosComPay" },
      {
        name: "description",
        content: "Choose a new password for your CosComPay merchant account.",
      },
      { property: "og:title", content: "Reset your password — CosComPay" },
      {
        property: "og:description",
        content: "Choose a new password for your CosComPay merchant account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token"));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (!token) {
      setError("This reset link is invalid. Request a new one.");
      return;
    }
    setBusy(true);
    const { error: err } = await completePasswordReset({ data: { token, password } });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setDone(true);
    setTimeout(() => void navigate({ to: "/login" }), 1400);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <SpotlightBackground />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-border bg-card/90 p-6 backdrop-blur-xl sm:p-8">
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

        <h1 className="mt-7 font-fraunces text-2xl font-bold">Set a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Reset links stay valid for 10 minutes after they are sent.
        </p>

        {done ? (
          <p className="mt-6 text-sm text-primary">
            Password updated. Taking you to sign in…
          </p>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="New password"
                aria-label="New password"
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                placeholder="Confirm new password"
                aria-label="Confirm new password"
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              />
            </div>
            {error && (
              <p className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="size-3.5" />
                {error}
              </p>
            )}
            <Button type="submit" className="h-12 w-full" disabled={busy}>
              {busy ? "Updating…" : "Update password"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

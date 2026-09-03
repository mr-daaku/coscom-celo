import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Lock } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";

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
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Use at least 8 characters");
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
    setTimeout(() => void navigate({ to: "/dashboard", search: { tab: "overview" } }), 900);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card/90 p-8 backdrop-blur-xl">
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
          Enter a new password for your merchant account.
        </p>

        {done ? (
          <p className="mt-6 text-sm text-primary">
            Password updated. Taking you to the dashboard…
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

import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Zap } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { SpotlightBackground } from "@/components/SpotlightBackground";

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.8 6.1C12.2 13.1 17.6 9.5 24 9.5Z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-2.8-.4-4.1H24v8.6h12.8c-.3 2.1-1.7 5.2-4.9 7.3l7.6 5.9c4.5-4.2 7-10.3 7-17.7Z"
      />
      <path
        fill="#FBBC05"
        d="M10.3 28.6a14.7 14.7 0 0 1 0-9.2l-7.8-6.1a24 24 0 0 0 0 21.4l7.8-6.1Z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.2 0 11.5-2 15.5-5.8l-7.6-5.9c-2 1.4-4.8 2.4-7.9 2.4-6.4 0-11.8-3.6-13.7-8.9l-7.8 6.1C6.4 42.6 14.6 48 24 48Z"
      />
    </svg>
  );
}

export function AuthCard({
  title,
  subtitle,
  action,
  footer,
}: {
  title: string;
  subtitle: string;
  action: string;
  footer: ReactNode;
}) {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <SpotlightBackground />
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to home
        </Link>

        <div className="animate-scale-in rounded-3xl border border-border bg-card/90 p-6 backdrop-blur-xl sm:p-8">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Zap className="size-4" />
            </span>
            <span className="font-fraunces text-lg font-bold">CosComPay</span>
          </div>

          <h1 className="mt-7 font-fraunces text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

          <Button
            className="mt-7 h-12 w-full gap-3 bg-white text-[#1f1f1f] hover:bg-white/90"
            disabled={pending}
            onClick={() => {
              setPending(true);
              navigate({ to: "/auth/google/callback", search: { code: "demo" } });
            }}
          >
            <GoogleMark />
            {pending ? "Redirecting…" : action}
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            By continuing you agree to our Terms of Service and acknowledge our Privacy
            Policy.
          </p>
        </div>
      </div>
    </main>
  );
}

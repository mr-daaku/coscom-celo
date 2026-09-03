import { useEffect, useRef } from "react";

import { TURNSTILE_SITE_KEY } from "@/lib/captcha.functions";

type TurnstileApi = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      theme?: "dark" | "light" | "auto";
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ) => string;
  reset: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

function loadScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.turnstile) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src^="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("captcha script failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = `${SCRIPT_SRC}?render=explicit`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("captcha script failed"));
    document.head.appendChild(script);
  });
}

/** Cloudflare Turnstile widget. Emits the token to verify on the server. */
export function Turnstile({
  onToken,
  onUnavailable,
  resetKey = 0,
}: {
  onToken: (token: string | null) => void;
  onUnavailable?: (unavailable: boolean) => void;
  resetKey?: number;
}) {
  const holder = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fail = () => {
      if (cancelled) return;
      setFailed(true);
      onToken(null);
      onUnavailable?.(true);
    };
    void loadScript()
      .then(() => {
        if (cancelled || !holder.current || !window.turnstile || widgetId.current) return;
        widgetId.current = window.turnstile.render(holder.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "dark",
          callback: (token) => {
            setFailed(false);
            onUnavailable?.(false);
            onToken(token);
          },
          "expired-callback": () => onToken(null),
          "error-callback": fail,
        });
      })
      .catch(fail);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!resetKey || !window.turnstile || !widgetId.current) return;
    window.turnstile.reset(widgetId.current);
    onToken(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  return (
    <div>
      <div ref={holder} className={failed ? "" : "min-h-[65px]"} />
      {failed && (
        <p className="text-xs text-muted-foreground">
          Security check unavailable on this domain — you can continue.
        </p>
      )}
    </div>
  );
}

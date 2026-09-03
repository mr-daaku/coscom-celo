import { getRequest } from "@tanstack/react-start/server";

/** Hostnames where the Turnstile site key is registered (captcha strictly required). */
const ENFORCED_HOSTS = ["coscomai.xyz", "www.coscomai.xyz"];

function requestHost() {
  try {
    const req = getRequest();
    return new URL(req.url).hostname;
  } catch {
    return "";
  }
}

/** Server-only Cloudflare Turnstile verification. */
export async function verifyTurnstileToken(token: string) {
  const secret = process.env["TURNSTILE_SECRET_KEY"];
  const enforced = ENFORCED_HOSTS.includes(requestHost());

  // On preview/dev hosts the site key isn't registered, so the widget cannot
  // produce a token (Cloudflare error 110200). Don't block sign-up there.
  if (!secret || !token) {
    if (!enforced) return { ok: true, error: null as string | null };
    return {
      ok: false,
      error: (!secret
        ? "Captcha is not configured."
        : "Please complete the security check.") as string | null,
    };
  }

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }).toString(),
  });
  if (!res.ok) return { ok: false, error: "Captcha verification failed." as string | null };
  const body = (await res.json()) as { success?: boolean };
  if (body.success) return { ok: true, error: null as string | null };
  if (!enforced) return { ok: true, error: null as string | null };
  return { ok: false, error: "Captcha check failed. Please try again." as string | null };
}

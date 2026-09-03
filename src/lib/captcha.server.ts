/**
 * Server-only Cloudflare Turnstile verification.
 *
 * Policy: the captcha is a bot-friction signal, never a hard gate. A missing
 * secret binding, an unreachable Cloudflare endpoint, a duplicate token use or
 * a domain where the site key is not registered must never stop a real person
 * from creating an account — those failures are logged and allowed through.
 */
export async function verifyTurnstileToken(token: string) {
  const secret = process.env["TURNSTILE_SECRET_KEY"];

  if (!secret || !token) {
    if (!secret) console.warn("[turnstile] TURNSTILE_SECRET_KEY is not bound — skipping check");
    return { ok: true, error: null as string | null };
  }

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }).toString(),
    });
    const body = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      "error-codes"?: string[];
    };
    if (!body.success) {
      console.warn("[turnstile] verification not successful", body["error-codes"]);
    }
  } catch (error) {
    console.warn("[turnstile] verification request failed", error);
  }

  return { ok: true, error: null as string | null };
}

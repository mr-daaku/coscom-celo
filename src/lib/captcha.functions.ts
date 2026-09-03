import { createServerFn } from "@tanstack/react-start";

/** Cloudflare Turnstile site key is public by design. */
export const TURNSTILE_SITE_KEY = "0x4AAAAAAEl38RjDnZmc8qIM";

export const verifyCaptcha = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const secret = process.env["TURNSTILE_SECRET_KEY"];
    if (!secret) return { ok: false, error: "Captcha is not configured." as string | null };
    if (!data.token) return { ok: false, error: "Please complete the captcha." as string | null };

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: data.token }).toString(),
    });

    if (!res.ok) return { ok: false, error: "Captcha verification failed." as string | null };
    const body = (await res.json()) as { success?: boolean };
    return body.success
      ? { ok: true, error: null as string | null }
      : { ok: false, error: "Captcha check failed. Please try again." as string | null };
  });

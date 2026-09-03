import { createServerFn } from "@tanstack/react-start";

/** Cloudflare Turnstile site key is public by design. */
export const TURNSTILE_SITE_KEY = "0x4AAAAAAEl38RjDnZmc8qIM";

export const verifyCaptcha = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const { verifyTurnstileToken } = await import("./captcha.server");
    return verifyTurnstileToken(data.token);
  });

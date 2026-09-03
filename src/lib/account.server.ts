/** Server-only helpers for the custom activation / password-reset link flow. */
import { emailShell, sendMail } from "./mailer.server";

export const TOKEN_TTL_MINUTES = 10;

const ALLOWED_HOSTS = [
  "coscomai.xyz",
  "www.coscomai.xyz",
  "coscomaichain.lovable.app",
];

export function safeOrigin(origin: string | undefined) {
  try {
    const url = new URL(origin ?? "");
    const ok =
      ALLOWED_HOSTS.includes(url.hostname) ||
      url.hostname.endsWith(".lovable.app") ||
      url.hostname === "localhost";
    return ok ? url.origin : "https://coscomai.xyz";
  } catch {
    return "https://coscomai.xyz";
  }
}

export function newToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

type Admin = Awaited<
  typeof import("@/integrations/supabase/client.server")
>["supabaseAdmin"];

export async function issueToken(
  admin: Admin,
  args: { userId: string; email: string; purpose: "verify" | "reset" },
) {
  const token = newToken();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000).toISOString();

  // One live link per purpose.
  await admin
    .from("auth_tokens")
    .delete()
    .eq("user_id", args.userId)
    .eq("purpose", args.purpose);

  const { error } = await admin.from("auth_tokens").insert({
    user_id: args.userId,
    email: args.email,
    purpose: args.purpose,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });
  if (error) throw new Error(error.message);
  return token;
}

export async function consumeToken(
  admin: Admin,
  args: { token: string; purpose: "verify" | "reset" },
) {
  const tokenHash = await hashToken(args.token);
  const { data } = await admin
    .from("auth_tokens")
    .select("id, user_id, email, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .eq("purpose", args.purpose)
    .maybeSingle();

  if (!data) return { error: "This link is invalid.", row: null };
  if (data.used_at) return { error: "This link has already been used.", row: null };
  if (new Date(data.expires_at).getTime() < Date.now()) {
    return { error: "This link has expired. Please request a new one.", row: null };
  }

  await admin.from("auth_tokens").update({ used_at: new Date().toISOString() }).eq("id", data.id);
  return { error: null as string | null, row: data };
}

export async function sendActivationMail(args: { to: string; url: string; name: string }) {
  return sendMail({
    to: args.to,
    subject: "Activate your CosComPay account",
    html: emailShell({
      heading: `Welcome, ${args.name}!`,
      intro:
        "Confirm your email address to activate your CosComPay merchant account and start accepting crypto.",
      buttonLabel: "Activate my account",
      url: args.url,
      footer: `This activation link expires in ${TOKEN_TTL_MINUTES} minutes. If the button does not work, paste this link into your browser:`,
    }),
  });
}

export async function sendResetMail(args: { to: string; url: string }) {
  return sendMail({
    to: args.to,
    subject: "Reset your CosComPay password",
    html: emailShell({
      heading: "Reset your password",
      intro:
        "We received a request to reset your CosComPay password. Choose a new password using the link below.",
      buttonLabel: "Set a new password",
      url: args.url,
      footer: `This reset link expires in ${TOKEN_TTL_MINUTES} minutes. If you did not request it, you can ignore this email.`,
    }),
  });
}

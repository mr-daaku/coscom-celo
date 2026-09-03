import { createServerFn } from "@tanstack/react-start";

/**
 * Own Google OAuth 2.0 flow (client id/secret stored as backend secrets).
 * Nothing about the credentials ever reaches the browser bundle.
 */

function decodeJwtPayload(idToken: string): Record<string, unknown> {
  const part = idToken.split(".")[1];
  if (!part) throw new Error("Malformed id_token");
  const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
  const json = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "="));
  return JSON.parse(json) as Record<string, unknown>;
}

export const getGoogleAuthUrl = createServerFn({ method: "POST" })
  .inputValidator((data: { redirectUri: string; state?: string }) => data)
  .handler(async ({ data }) => {
    const clientId = process.env["GOOGLE_CLIENT_ID"];
    if (!clientId) return { error: "Google sign-in is not configured on this deployment (missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET environment variables)." as string, url: null };

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: data.redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "online",
      include_granted_scopes: "true",
      prompt: "select_account",
    });
    if (data.state) params.set("state", data.state);

    return {
      error: null as string | null,
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    };
  });

export const exchangeGoogleCode = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string; redirectUri: string }) => data)
  .handler(async ({ data }) => {
    const clientId = process.env["GOOGLE_CLIENT_ID"];
    const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];
    if (!clientId || !clientSecret) {
      return { error: "Google sign-in is not configured on this deployment (missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET environment variables)." as string | null, tokenHash: null, email: null };
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: data.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: data.redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenRes.ok) {
      console.error("google token exchange failed", tokenRes.status, await tokenRes.text());
      return { error: "Could not verify your Google account." as string | null, tokenHash: null, email: null };
    }

    const tokens = (await tokenRes.json()) as { id_token?: string };
    if (!tokens.id_token) {
      return { error: "Google did not return an identity token." as string | null, tokenHash: null, email: null };
    }

    const claims = decodeJwtPayload(tokens.id_token);
    if (claims["aud"] !== clientId) {
      return { error: "Google token audience mismatch." as string | null, tokenHash: null, email: null };
    }
    const email = typeof claims["email"] === "string" ? (claims["email"] as string) : null;
    if (!email || claims["email_verified"] === false) {
      return { error: "Your Google account has no verified email." as string | null, tokenHash: null, email: null };
    }

    const fullName =
      (typeof claims["name"] === "string" ? (claims["name"] as string) : null) ??
      email.split("@")[0]!;
    const avatarUrl = typeof claims["picture"] === "string" ? (claims["picture"] as string) : null;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const created = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: fullName, avatar_url: avatarUrl, provider: "google" },
    });
    if (created.error && !/already/i.test(created.error.message)) {
      console.error("createUser failed", created.error.message);
      return { error: "Could not create your account." as string | null, tokenHash: null, email: null };
    }

    const link = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
    const tokenHash = link.data?.properties?.hashed_token ?? null;
    if (link.error || !tokenHash) {
      console.error("generateLink failed", link.error?.message);
      return { error: "Could not start your session." as string | null, tokenHash: null, email: null };
    }

    return { error: null as string | null, tokenHash, email };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ALLOWED_ORIGINS = [
  "https://coscomai.xyz",
  "https://coscom-celo.lovable.app",
];

function assertRedirect(redirectUri: string) {
  let url: URL;
  try {
    url = new URL(redirectUri);
  } catch {
    throw new Error("Invalid redirect URI.");
  }
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (!ALLOWED_ORIGINS.includes(url.origin) && !isLocal) {
    throw new Error("Sign-in is not available from this domain.");
  }
  if (url.pathname !== "/auth/google/callback") {
    throw new Error("Invalid redirect path.");
  }
  return url.toString();
}

/** Builds the Google consent URL from our own OAuth client credentials. */
export const googleAuthUrl = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ redirectUri: z.string().url(), state: z.string().min(8).max(128) }).parse(data),
  )
  .handler(async ({ data }) => {
    const clientId = process.env["GOOGLE_CLIENT_ID"];
    if (!clientId) throw new Error("Google sign-in is not configured on the server.");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: assertRedirect(data.redirectUri),
      response_type: "code",
      scope: "openid email profile",
      access_type: "online",
      include_granted_scopes: "true",
      prompt: "select_account",
      state: data.state,
    });

    return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` };
  });

type GoogleTokens = { access_token?: string; id_token?: string; error_description?: string };
type GoogleUser = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

/**
 * Exchanges the Google authorization code with our own client secret, then
 * returns a one-time hashed token the browser converts into a session.
 */
export const googleExchange = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ code: z.string().min(10), redirectUri: z.string().url() }).parse(data),
  )
  .handler(async ({ data }) => {
    const clientId = process.env["GOOGLE_CLIENT_ID"];
    const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];
    if (!clientId || !clientSecret) {
      throw new Error("Google sign-in is not configured on the server.");
    }

    const redirectUri = assertRedirect(data.redirectUri);

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: data.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokens = (await tokenRes.json()) as GoogleTokens;
    if (!tokenRes.ok || !tokens.access_token) {
      throw new Error(tokens.error_description ?? "Google rejected the sign-in code.");
    }

    const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!infoRes.ok) throw new Error("Could not read your Google profile.");
    const profile = (await infoRes.json()) as GoogleUser;

    const email = profile.email?.toLowerCase();
    if (!email || profile.email_verified === false) {
      throw new Error("Your Google account has no verified email address.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const created = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: profile.name ?? email.split("@")[0],
        avatar_url: profile.picture ?? null,
        provider: "google",
        google_sub: profile.sub,
      },
    });

    if (created.error && !/already|exists|registered/i.test(created.error.message)) {
      throw new Error(created.error.message);
    }

    const link = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (link.error || !link.data.properties?.hashed_token) {
      throw new Error(link.error?.message ?? "Could not start your session.");
    }

    return {
      email,
      tokenHash: link.data.properties.hashed_token,
      name: profile.name ?? email.split("@")[0],
    };
  });

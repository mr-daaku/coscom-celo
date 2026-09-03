import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

const PRODUCTION_ORIGINS = new Set([
  "https://coscomai.xyz",
  "https://coscom-celo.lovable.app",
]);

function currentOrigin() {
  if (typeof window === "undefined") return "https://coscom-celo.lovable.app";

  const origin = window.location.origin;
  const isLocalDevelopment =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  if (PRODUCTION_ORIGINS.has(origin) || isLocalDevelopment) return origin;
  throw new Error("Sign-in is not available from this domain.");
}

/**
 * Shared browser API for the managed CosComPay backend.
 * Only the publishable key is used here; privileged backend keys must never be
 * shipped in .env or browser code.
 */
export const api = {
  auth: {
    session: () => supabase.auth.getSession(),
    onStateChange: (callback: (event: AuthChangeEvent, session: Session | null) => void) =>
      supabase.auth.onAuthStateChange(callback),
    signOut: () => supabase.auth.signOut(),
    signInWithGoogle: async () => {
      const origin = currentOrigin();
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${origin}/auth/google/callback`,
        extraParams: { prompt: "select_account" },
      });
      return { error: result.error ?? null };
    },

  },
  profiles: {
    get: (userId: string) =>
      supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url")
        .eq("id", userId)
        .maybeSingle(),
  },
};
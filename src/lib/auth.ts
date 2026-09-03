import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { getGoogleAuthUrl } from "@/lib/google-auth.functions";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export function initials(name: string) {
  return name
    .split(/[\s@.]+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function displayName(user: User | null, profile: Profile | null) {
  return (
    profile?.full_name ??
    (user?.user_metadata?.["full_name"] as string | undefined) ??
    (user?.user_metadata?.["name"] as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Merchant"
  );
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setReady(true);
    });
    void supabase.auth.getSession().then(({ data: got }) => {
      setSession(got.session);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    void supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => setProfile((data as Profile | null) ?? null));
  }, [userId]);

  return {
    ready,
    session,
    user: session?.user ?? null,
    profile,
    name: displayName(session?.user ?? null, profile),
    email: session?.user.email ?? profile?.email ?? "",
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };
}

export function googleRedirectUri() {
  return `${window.location.origin}/auth/google/callback`;
}

/** Starts our own Google OAuth flow (credentials live only on the backend). */
export async function signInWithGoogle() {
  const result = await getGoogleAuthUrl({
    data: { redirectUri: googleRedirectUri() },
  });
  if (result.error || !result.url) {
    return { error: new Error(result.error ?? "Google sign-in failed."), redirected: false };
  }
  window.location.assign(result.url);
  return { error: null, redirected: true };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: { full_name: fullName },
    },
  });
  if (error) return { error, needsConfirmation: false };
  return { error: null, needsConfirmation: !data.session };
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error };
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { error };
}

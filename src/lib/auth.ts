import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

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

export async function signInWithGoogle() {
  return lovable.auth.signInWithOAuth("google", {
    redirect_uri: `${window.location.origin}/auth/google/callback`,
  });
}

import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { api } from "@/lib/api";


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
    const { data } = api.auth.onStateChange((_event, next) => {
      setSession(next);
      setReady(true);
    });
    void api.auth.session().then(({ data: got }) => {
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
    void api.profiles
      .get(userId)
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
      await api.auth.signOut();
    },
  };
}

export async function signInWithGoogle() {
  const { error } = await api.auth.signInWithGoogle();
  return { error, redirected: !error };
}

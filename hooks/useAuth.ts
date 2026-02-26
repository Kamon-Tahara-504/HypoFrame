"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

type AuthUserResponse = { data: { user: User | null }; error: unknown };

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getUser().then((res: AuthUserResponse) => {
      setUser(res.data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { error: { message: "認証は利用できません。" } };
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    },
    [supabase]
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      options?: { data?: Record<string, string> }
    ) => {
      if (!supabase) return { error: { message: "認証は利用できません。" } };
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: options?.data ? { data: options.data } : undefined,
      });
      return { error };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
  }, [supabase]);

  return { user, loading, signIn, signUp, signOut };
}

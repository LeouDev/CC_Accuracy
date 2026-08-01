import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  initialized: boolean;
  init: () => () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  initialized: false,
  init: () => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      set({ user: data.user, isAdmin: !!data.user, initialized: true });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null, isAdmin: !!session?.user, initialized: true });
    });

    return () => sub.subscription.unsubscribe();
  },
  signIn: async (email, password) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  },
  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  },
}));

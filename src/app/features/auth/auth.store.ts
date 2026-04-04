import type { StateCreator } from "zustand";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/app/shared/api/supabase";

export interface Profile {
  name: string;
  company: string;
  homebase: string;
  homebase_lat: number | null;
  homebase_lng: number | null;
}

export interface AuthSlice {
  user: User | null;
  profile: Profile | null;
  authReady: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setAuthReady: (ready: boolean) => void;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set, get) => ({
  user: null,
  profile: null,
  authReady: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setAuthReady: (ready) => set({ authReady: ready }),
  updateProfile: async (patch) => {
    const user = get().user;
    if (!user) return;
    const current = get().profile ?? { name: "", company: "", homebase: "", homebase_lat: null, homebase_lng: null };
    const updated = { ...current, ...patch };
    set({ profile: updated });
    await supabase
      .from("profiles")
      .upsert({ id: user.id, ...updated }, { onConflict: "id" });
  },
});

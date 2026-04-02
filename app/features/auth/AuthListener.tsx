"use client";

import { useEffect } from "react";
import { supabase } from "@/app/lib/supabase";
import { useStore } from "@/app/store";

export default function AuthListener() {
  const setUser = useStore((s) => s.setUser);
  const setProfile = useStore((s) => s.setProfile);
  const setAuthReady = useStore((s) => s.setAuthReady);

  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) pullProfile(session.user.id);
      setAuthReady(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        pullProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setProfile, setAuthReady]);

  async function pullProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("name, company, homebase, homebase_lat, homebase_lng")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
    } else {
      // Create empty profile for new user
      const empty = { name: "", company: "", homebase: "", homebase_lat: null, homebase_lng: null };
      setProfile(empty);
      await supabase.from("profiles").upsert({ id: userId, ...empty }, { onConflict: "id" });
    }
  }

  return null;
}

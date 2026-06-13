"use client";

import { useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/lib/store";
import type { UserProfile } from "@/types";

interface UseCreditsReturn {
  profile: UserProfile | null;
  credits: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook that exposes the current user's credit balance and a refresh fn.
 * Backed by the global user store so the value is shared app-wide.
 */
export function useCredits(): UseCreditsReturn {
  const { profile, loading, setProfile, setLoading } = useUserStore();

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) setProfile(data as UserProfile);
    setLoading(false);
  }, [setProfile, setLoading]);

  useEffect(() => {
    // Only fetch if we don't already have a profile loaded.
    if (!profile) {
      void refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    profile,
    credits: profile?.credits_balance ?? 0,
    loading,
    refresh,
  };
}

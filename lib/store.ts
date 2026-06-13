"use client";

import { create } from "zustand";
import type { UserProfile } from "@/types";

interface UserStore {
  profile: UserProfile | null;
  loading: boolean;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  // Optimistically adjust credits in the UI after an action
  adjustCredits: (delta: number) => void;
}

/**
 * Global client store for the signed-in user's profile.
 * Hydrated by the dashboard layout; read by credits badge, settings, etc.
 */
export const useUserStore = create<UserStore>((set) => ({
  profile: null,
  loading: true,
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  adjustCredits: (delta) =>
    set((state) =>
      state.profile
        ? {
            profile: {
              ...state.profile,
              credits_balance: Math.max(0, state.profile.credits_balance + delta),
            },
          }
        : {}
    ),
}));

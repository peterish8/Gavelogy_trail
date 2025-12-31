"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PreferencesState {
  trackConfidence: boolean;
  setTrackConfidence: (value: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      trackConfidence: true,
      setTrackConfidence: (value) => set({ trackConfidence: value }),
    }),
    {
      name: "gavalogy-preferences",
    }
  )
);

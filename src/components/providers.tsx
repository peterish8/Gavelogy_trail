"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/stores/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  const { setTheme } = useThemeStore();

  useEffect(() => {
    const savedTheme = localStorage.getItem("gavelogy-theme");
    if (savedTheme) {
      const theme = JSON.parse(savedTheme);
      setTheme(theme.state.isDarkMode);
    }
  }, [setTheme]);

  return <>{children}</>;
}

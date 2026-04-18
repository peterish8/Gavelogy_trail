"use client";

import { useThemeStore } from "@/lib/stores/theme";

export function DottedBackground() {
  const { isDarkMode } = useThemeStore();

  return (
    <div
      style={{
        zIndex: -1
      }}
      className="fixed inset-0 pointer-events-none opacity-70 dotted-background"
    >
      {/* Dynamic gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: isDarkMode ? `
            radial-gradient(ellipse 70% 50% at 50% 115%, rgba(124, 58, 237, 0.05) 0%, rgba(0, 0, 0, 0) 100%),
            #000000
          ` : `#F7F6FB`
        }}
      />
      {/* Large dotted grid pattern - main layer */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0, 0, 0, 0.08) 1.5px, transparent 1.5px)",
          backgroundSize: "40px 40px",
          backgroundPosition: "0 0",
        }}
      />

      {/* Medium dotted grid - adds depth */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0, 0, 0, 0.05) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          backgroundPosition: "20px 20px",
        }}
      />

      {/* Small dotted grid - fine texture */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0, 0, 0, 0.03) 0.5px, transparent 0.5px)",
          backgroundSize: "16px 16px",
          backgroundPosition: "10px 10px",
        }}
      />
    </div>
  );
}

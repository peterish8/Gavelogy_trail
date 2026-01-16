"use client";

import { useThemeStore } from "@/lib/stores/theme";

export function DottedBackground() {
  const { isDarkMode } = useThemeStore();

  return (
    <div
      style={{
        zIndex: -1
      }}
      className="fixed inset-0 pointer-events-none opacity-70"
    >
      {/* Dynamic gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: isDarkMode ? `
            linear-gradient(180deg, rgba(88, 28, 135, 0.15) 0%, rgba(0, 0, 0, 0.95) 100%)
          ` : `
            radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.4) 0%, transparent 60%),
            radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.3) 0%, transparent 60%),
            radial-gradient(circle at 40% 40%, rgba(34, 197, 94, 0.25) 0%, transparent 50%),
            radial-gradient(circle at 60% 70%, rgba(236, 72, 153, 0.2) 0%, transparent 50%),
            linear-gradient(135deg, rgba(219, 234, 254, 0.6) 0%, rgba(165, 180, 252, 0.4) 100%)
          `
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

"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function CircularProgress({
  value,
  size = 60,
  strokeWidth = 5,
  className,
}: CircularProgressProps) {
  const [progress, setProgress] = useState(0);

  // Animate the value smoothly on mount
  useEffect(() => {
    // Small delay ensures the animation is visible when component mounts
    const timer = setTimeout(() => setProgress(value), 50);
    return () => clearTimeout(timer);
  }, [value]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Determine vibrant colors based on accuracy
  const getColorClasses = (val: number) => {
    if (val < 35) return "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]";
    if (val < 75) return "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]"; // Warmer yellow/orange
    return "text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]";
  };

  const getTrackColorClass = (val: number) => {
    if (val < 35) return "text-red-500/10";
    if (val < 75) return "text-orange-400/10";
    return "text-green-500/10";
  };

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Soft background track circle */}
        <circle
          className={getTrackColorClass(value)}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Animated fluid progress circle */}
        <circle
          className={cn(
            "transition-all duration-1000 ease-out",
            getColorClasses(value)
          )}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {/* Absolute center text with dynamic counter */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold tracking-tight text-foreground drop-shadow-md">
          {Math.round(progress)}
          <span className="text-[10px] text-muted-foreground ml-px">%</span>
        </span>
      </div>
    </div>
  );
}

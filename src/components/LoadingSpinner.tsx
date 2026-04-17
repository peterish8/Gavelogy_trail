"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function LoadingSpinner({
  size = "md",
  className,
  text,
}: LoadingSpinnerProps) {
  // Use branded loader for large size
  if (size === "lg") {
    return (
      <div className={cn("flex flex-col items-center gap-8", className)}>
        {/* Branding - Logo + Text */}
        <div className="flex items-center gap-3">
            {/* Logo Circle */}
            <div className="w-10 h-10 bg-black dark:bg-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white dark:text-black font-bold text-xl">G</span>
            </div>
            {/* Text */}
            <h1 className="text-4xl font-bold text-black dark:text-white tracking-wider drop-shadow-md">
            Gavelogy
            </h1>
        </div>
        
        <div className="flex items-center gap-1 h-12 justify-center">
          {/* Left Dot */}
          <motion.div
            className="h-4 w-4 rounded-full bg-black dark:bg-white shadow-md"
            animate={{
              x: [-24, 0, 0, -24] 
            }}
            transition={{
              duration: 1.2, // Full cycle duration
              repeat: Infinity,
              times: [0, 0.25, 0.75, 1], // Keyframes map to: Start Left, Hit Center (0.25), Stay Trigger (0.75), Return Left (1)
              // Easing: Accelerate In, Linear (Impact Phase), Decelerate Out
              ease: ["circIn", "linear", "circOut"]
            }}
          />
          
          {/* Center Dot (Anchor) */}
          <div className="h-4 w-4 rounded-full bg-black dark:bg-white shadow-md"></div>

          {/* Right Dot */}
          <motion.div
            className="h-4 w-4 rounded-full bg-black dark:bg-white shadow-md"
            animate={{
              x: [0, 0, 24, 0, 0]
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              times: [0, 0.25, 0.5, 0.75, 1], // 0: Still, 0.25: Start Swing Out, 0.5: Peak, 0.75: Hit Back, 1: Still
              ease: ["linear", "circOut", "circIn", "linear"]
            }}
          />
        </div>

        {text && (
            <div className="mt-4">
               <span 
                 className="text-sm font-medium tracking-[0.2em] uppercase text-gray-500 animate-pulse"
               >
                 {text}
               </span>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Loader2 className={cn("animate-spin", sizeClasses[size], className)} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

interface LoadingPageProps {
  text?: string;
}

export function LoadingPage({ text = "Loading..." }: LoadingPageProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

interface LoadingCardProps {
  text?: string;
  className?: string;
}

export function LoadingCard({
  text = "Loading...",
  className,
}: LoadingCardProps) {
  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

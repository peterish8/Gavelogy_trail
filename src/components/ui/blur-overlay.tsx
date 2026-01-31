"use client";

import { Button } from "./button";
import { Card } from "./card";
import { Lock, Crown } from "lucide-react";
import Link from "next/link";

interface BlurOverlayProps {
  children: React.ReactNode;
  title: string;
  description: string;
  price: number;
}

export function BlurOverlay({
  children,
  title,
  description,
  price,
}: BlurOverlayProps) {
  return (
    <div className="relative group">
      {/* Blurred content */}
      <div className="blur-sm pointer-events-none select-none">{children}</div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
        <Card className="max-w-md mx-auto border-primary/20 bg-primary/5">
          <div className="p-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Crown className="h-8 w-8 text-primary" />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {description}
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-2xl font-bold text-primary">
                ₹{price.toLocaleString()}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Link href="/dashboard" className="flex-1">
                  <Button className="w-full">
                    <Crown className="h-4 w-4 mr-2" />
                    Unlock All Content
                  </Button>
                </Link>
                <Button variant="outline" className="flex-1">
                  <Lock className="h-4 w-4 mr-2" />
                  Preview Only
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Get full access to all quizzes, mock tests, and mistake tracking
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Simple blur component for smaller elements
export function BlurLock({
  children,
  message,
}: {
  children: React.ReactNode;
  message: string;
}) {
  return (
    <div className="relative group">
      <div className="blur-sm pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
        <div className="text-center p-4">
          <Lock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}

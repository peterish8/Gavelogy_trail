"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/auth";
import { useThemeStore } from "@/lib/stores/theme";
import { useGamificationStore } from "@/lib/stores/gamification";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Moon, Sun, User, LogOut, Coins, Flame } from "lucide-react";

export function Header() {
  const { user, profile, isAuthenticated, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { coins, streak } = useGamificationStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">G</span>
          </div>
          <span className="text-xl font-bold">Gavalogy</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/subjects"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Subjects
              </Link>
              <Link
                href="/mistakes"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Mistakes
              </Link>
              <Link
                href="/leaderboard"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Leaderboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/subjects"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Subjects
              </Link>
              <Link
                href="/about"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                About
              </Link>
            </>
          )}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* Gamification stats (only for authenticated users) */}
          {isAuthenticated && (
            <div className="hidden sm:flex items-center space-x-3">
              <div className="flex items-center space-x-1 text-sm">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="font-medium">{streak}</span>
              </div>
              <div className="flex items-center space-x-1 text-sm">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">{coins}</span>
              </div>
            </div>
          )}

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* User menu */}
          {isAuthenticated ? (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="h-9 w-9"
              >
                <User className="h-4 w-4" />
                <span className="sr-only">User menu</span>
              </Button>

              {showUserMenu && (
                <Card className="absolute right-0 top-12 w-48 p-2 shadow-lg">
                  <div className="space-y-1">
                    <div className="px-3 py-2 text-sm">
                      <div className="font-medium">
                        {profile?.full_name || "User"}
                      </div>
                      <div className="text-muted-foreground">
                        {profile?.username}
                      </div>
                    </div>
                    <div className="border-t pt-1">
                      <Link
                        href="/profile"
                        className="flex items-center px-3 py-2 text-sm hover:bg-accent rounded-sm"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent rounded-sm"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

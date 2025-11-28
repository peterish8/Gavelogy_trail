"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { useThemeStore } from "@/lib/stores/theme";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Moon, Sun, User, LogOut, Menu, X, Settings } from "lucide-react";

export function Header() {
  const { user, profile, isAuthenticated, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const pathname = usePathname();

  // Show landing page navigation on home page, dashboard navigation elsewhere
  const isHomePage = pathname === "/";
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  return (
    <header className="sticky top-0 z-[100] w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/?view=landing" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">G</span>
          </div>
          <span className="text-xl font-bold">Gavelogy</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {isAuthenticated && !isHomePage && !isAuthPage ? (
            <>
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors ${
                  pathname === "/dashboard" 
                    ? "text-primary" 
                    : "hover:text-primary"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/subjects"
                className={`text-sm font-medium transition-colors ${
                  pathname === "/subjects" 
                    ? "text-primary" 
                    : "hover:text-primary"
                }`}
              >
                Content
              </Link>
              <Link
                href="/mistakes"
                className={`text-sm font-medium transition-colors ${
                  pathname === "/mistakes" 
                    ? "text-primary" 
                    : "hover:text-primary"
                }`}
              >
                Mistakes
              </Link>
              <Link
                href="/leaderboard"
                className={`text-sm font-medium transition-colors ${
                  pathname === "/leaderboard" 
                    ? "text-primary" 
                    : "hover:text-primary"
                }`}
              >
                Leaderboard
              </Link>
              <Link
                href="/courses"
                className={`text-sm font-medium transition-colors ${
                  pathname === "/courses" 
                    ? "text-primary" 
                    : "hover:text-primary"
                }`}
              >
                Courses
              </Link>
            </>
          ) : (
            <>
              <Link
                href="#features"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="#about"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                About
              </Link>
            </>
          )}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* Mobile Hamburger Menu */}
          {isAuthenticated && !isHomePage && !isAuthPage && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                console.log(
                  "Hamburger clicked, current state:",
                  showMobileMenu
                );
                setShowMobileMenu(!showMobileMenu);
              }}
              className="md:hidden h-9 w-9"
            >
              {showMobileMenu ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
          )}

          {/* Theme toggle - hidden on mobile and landing page */}
          {!isHomePage && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 hidden md:flex"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}

          {/* User menu - only show on non-home and non-auth pages when authenticated - hidden on mobile */}
          {isAuthenticated && !isHomePage && !isAuthPage ? (
            <div className="relative hidden md:block">
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

      {/* Mobile Menu Dropdown */}
      {isAuthenticated && !isHomePage && !isAuthPage && showMobileMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-[9998] md:hidden"
            onClick={() => {
              setShowMobileMenu(false);
              setShowMobileSettings(false);
            }}
          />

          {/* Menu - Slide down from top */}
          <div
            className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-2xl z-[9999] text-gray-900 dark:text-white"
            style={{
              animation: "slideInFromTop 0.3s ease-out",
            }}
          >
            <nav className="px-6 py-8 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Close button */}
              <div className="flex justify-end mb-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowMobileMenu(false);
                    setShowMobileSettings(false);
                  }}
                  className="h-8 w-8 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation Links */}
              <Link
                href="/dashboard"
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  pathname === "/dashboard"
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                <span className="text-base font-medium">Dashboard</span>
              </Link>
              <Link
                href="/subjects"
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  pathname === "/subjects"
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                <span className="text-base font-medium">Content</span>
              </Link>
              <Link
                href="/mistakes"
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  pathname === "/mistakes"
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                <span className="text-base font-medium">Mistakes</span>
              </Link>
              <Link
                href="/leaderboard"
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  pathname === "/leaderboard"
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                <span className="text-base font-medium">Leaderboard</span>
              </Link>
              <Link
                href="/courses"
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  pathname === "/courses"
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                <span className="text-base font-medium">Courses</span>
              </Link>

              {/* Settings Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
                <button
                  onClick={() => setShowMobileSettings(!showMobileSettings)}
                  className="flex items-center justify-between w-full px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white"
                >
                  <div className="flex items-center">
                    <Settings className="h-5 w-5 mr-3" />
                    <span className="text-base font-medium">Settings</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {showMobileSettings ? "Hide" : "Show"}
                  </span>
                </button>

                {/* Settings Submenu */}
                {showMobileSettings && (
                  <div className="ml-4 mt-3 space-y-2">
                    <Link
                      href="/settings"
                      className="flex items-center px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white"
                      onClick={() => {
                        setShowMobileMenu(false);
                        setShowMobileSettings(false);
                      }}
                    >
                      <User className="h-4 w-4 mr-3" />
                      <span className="text-sm">Settings</span>
                    </Link>
                    <button
                      onClick={() => {
                        toggleTheme();
                        setShowMobileSettings(false);
                      }}
                      className="flex items-center w-full px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white"
                    >
                      {isDarkMode ? (
                        <Sun className="h-4 w-4 mr-3" />
                      ) : (
                        <Moon className="h-4 w-4 mr-3" />
                      )}
                      <span className="text-sm">
                        {isDarkMode ? "Light Mode" : "Dark Mode"}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowMobileMenu(false);
                        setShowMobileSettings(false);
                      }}
                      className="flex items-center w-full px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-red-600 dark:text-red-400"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      <span className="text-sm">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}

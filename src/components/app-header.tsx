"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { useThemeStore } from "@/lib/stores/theme";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Moon, Sun, User, LogOut, Menu, X, Settings } from "lucide-react";

const APP_NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/courses", label: "Courses" },
  { href: "/mistakes", label: "Mistakes" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function AppHeader() {
  const router = useRouter();
  const { profile, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push("/login"); // Force redirect to login
  };

  // Active link indicator logic
  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });

  useEffect(() => {
    let activeLink = APP_NAV_LINKS.find((link) =>
      pathname.startsWith(link.href)
    );
    
    // Special case: course-viewer should highlight Courses
    if (!activeLink && pathname.startsWith('/course-viewer')) {
      activeLink = APP_NAV_LINKS.find(link => link.href === '/courses');
    }

    if (activeLink) {
      const element = linkRefs.current[activeLink.href];
      if (element && navContainerRef.current) {
        setIndicatorStyle({ 
            width: element.offsetWidth, 
            left: element.offsetLeft 
        });
      }
    } else {
      setIndicatorStyle({ width: 0, left: 0 });
    }
  }, [pathname]);

  return (
    <header className="sticky top-0 z-100 w-full border-b bg-background/95 backdrop-blur-md supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">G</span>
          </div>
          <span className="text-xl font-bold">Gavelogy</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <div
            className="relative flex items-center space-x-6 border-b border-transparent pb-1"
            ref={navContainerRef}
          >
            {APP_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                ref={(el) => {
                  linkRefs.current[link.href] = el;
                }}
                className={`text-sm font-semibold transition-colors ${
                  pathname.startsWith(link.href)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary/80"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <span
              className="absolute -bottom-0.5 h-0.5 bg-primary transition-all duration-300 ease-out"
              style={{
                width: `${indicatorStyle.width}px`,
                left: `${indicatorStyle.left}px`,
              }}
            />
          </div>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 hidden md:flex"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* User Menu (Desktop) */}
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
                    <div className="font-medium truncate">{profile?.full_name || "User"}</div>
                    <div className="text-muted-foreground truncate">{profile?.username}</div>
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
                      className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent rounded-sm text-red-600"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMobileMenu(true)}
            className="md:hidden h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-200 md:hidden">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowMobileMenu(false)}
            />
            
            {/* Drawer */}
            <div className="absolute right-0 top-0 bottom-0 w-3/4 max-w-sm bg-background border-l shadow-2xl p-6 transition-transform duration-300 ease-in-out">
                <div className="flex items-center justify-between mb-8">
                    <span className="font-bold text-xl">Menu</span>
                    <Button variant="ghost" size="icon" onClick={() => setShowMobileMenu(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        {APP_NAV_LINKS.map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setShowMobileMenu(false)}
                                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                    pathname.startsWith(link.href) 
                                    ? "bg-primary/10 text-primary" 
                                    : "hover:bg-accent text-muted-foreground"
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="border-t pt-6 space-y-2">
                        <div className="px-4 py-2">
                            <p className="font-medium">{profile?.full_name}</p>
                            <p className="text-sm text-muted-foreground">{profile?.username}</p>
                        </div>
                        
                        <Button 
                            variant="ghost" 
                            className="w-full justify-start"
                            onClick={toggleTheme}
                        >
                            {isDarkMode ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                            {isDarkMode ? "Light Mode" : "Dark Mode"}
                        </Button>

                         <Link href="/profile" onClick={() => setShowMobileMenu(false)}>
                            <Button variant="ghost" className="w-full justify-start">
                                <User className="h-4 w-4 mr-2" />
                                Profile
                            </Button>
                        </Link>

                        <Button 
                            variant="ghost" 
                            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </header>
  );
}

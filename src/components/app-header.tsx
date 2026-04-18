"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { useAuth } from "@/lib/auth-context";
import { useThemeStore } from "@/lib/stores/theme";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Moon, Sun, User, LogOut, Menu, X, Search } from "lucide-react";

const APP_NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/courses", label: "Courses" },
  { href: "/mistakes", label: "Mistakes" },
  { href: "/arena", label: "GameArena" },
  { href: "/leaderboard", label: "Leaderboard" },
];

import { SearchCommandMenu } from "@/components/search-command-menu";

export function AppHeader() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { signOut } = useAuth();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    setShowUserMenu(false);
    setShowMobileMenu(false);
    await signOut();
    router.push("/");
  };

  // No longer using ref-based indicator
  const activeLink = APP_NAV_LINKS.find((link) => pathname?.startsWith(link.href)) || 
    (pathname?.startsWith('/course-viewer') ? APP_NAV_LINKS.find(link => link.href === '/courses') : null);

  return (
    <header className="sticky top-0 z-50 w-full overflow-hidden">
      {/* Glass base */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(247, 246, 251, 0.72)",
          backdropFilter: "blur(24px) saturate(1.8)",
          WebkitBackdropFilter: "blur(24px) saturate(1.8)",
          borderBottom: "1px solid rgba(215, 206, 250, 0.35)",
        }}
      />
      {/* Subtle overall gradient tint */}
      <div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(90deg, rgba(75,42,214,0.06) 0%, transparent 40%, transparent 60%, rgba(162,50,104,0.05) 100%)" }} />
      {/* Top highlight line */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 30%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 70%, transparent 100%)" }} />

      <div className="relative z-10 container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">G</span>
          </div>
          <span className="text-xl font-bold">Gavelogy</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {APP_NAV_LINKS.map((link) => {
            const isActive = activeLink?.href === link.href;
            
            return (
              <Link key={link.href} href={link.href} className="relative px-4 py-2 text-sm font-semibold transition-colors">
                  <motion.div
                    className="relative z-10"
                    whileTap={{ scale: 0.9 }}
                  >
                    <span 
                        className={isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}
                    >
                        {link.label}
                    </span>
                  </motion.div>
                  
                  {/* Active/Hover Background */}
                  {isActive ? (
                    <motion.div
                      className="absolute inset-0 bg-black dark:bg-white rounded-md z-0"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                    />
                  ) : (
                    <motion.div
                      className="absolute inset-0 bg-transparent hover:bg-black/5 dark:hover:bg-white/10 rounded-md z-0"
                      initial={false}
                      transition={{ duration: 0.2 }}
                    />
                  )}
              </Link>
            );
          })}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* Search Trigger */}
          <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            className="hidden md:flex items-center gap-2 h-9 w-64 justify-start text-muted-foreground glass-input hover:bg-white/70 relative"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">Search...</span>
            <kbd className="pointer-events-none absolute right-2 top-2 h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 flex">
              <span className="text-xs">Ctrl</span>K
            </kbd>
          </Button>
          </motion.div>

          {/* Mobile Search Trigger */}
          <Button
             variant="ghost"
             size="icon"
             className="md:hidden h-9 w-9"
             onClick={() => setIsSearchOpen(true)}
          >
             <Search className="h-5 w-5" />
          </Button>

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
                      onClick={() => { setShowLogoutConfirm(true); setShowUserMenu(false); }}
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
        <div className="fixed inset-0 z-300 md:hidden">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowMobileMenu(false)}
            />
            
            {/* Drawer */}
            <div className="absolute right-0 top-0 bottom-0 w-3/4 max-w-sm bg-white dark:bg-zinc-950 border-l shadow-2xl p-6 transition-transform duration-300 ease-in-out z-50 overflow-y-auto">
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
                                    pathname?.startsWith(link.href) 
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
                            onClick={() => { setShowLogoutConfirm(true); setShowMobileMenu(false); }}
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      )}
      <SearchCommandMenu open={isSearchOpen} setOpen={setIsSearchOpen} />

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <Card className="relative z-10 w-80 p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <LogOut className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Sign out?</h3>
                <p className="text-sm text-muted-foreground mt-1">You&apos;ll be redirected to the home page.</p>
              </div>
              <div className="flex gap-3 w-full">
                <Button variant="outline" className="flex-1" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
                <Button variant="destructive" className="flex-1" onClick={handleLogout}>Sign Out</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </header>
  );
}

"use client"
import { useAuthStore } from "@/lib/stores/auth"
import { useAuth } from "@/lib/auth-context"
import { useThemeStore } from "@/lib/stores/theme"
import { ChevronUp, User, LogOut, Sun, Moon } from "lucide-react"
import { GCoinIcon } from "@/components/icons/g-coin-icon"
import { GavelIcon } from '@/components/icons/gavel-icon'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getLeague, getLeagueProgress, getNextLeague } from "@/lib/game/leagues"
import { useSidebarStore } from "@/lib/stores/sidebar-store"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export function SidebarFooter() {
  const { user, profile } = useAuthStore()
  const { signOut } = useAuth()
  const { isDarkMode, toggleTheme } = useThemeStore()
  const [isOpen, setIsOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const router = useRouter()
  
  const initial = profile?.full_name ? profile.full_name[0].toUpperCase() : (user?.email?.[0].toUpperCase() || 'U')
  const name = profile?.full_name || user?.email?.split('@')[0] || "User"

  const xp = profile?.xp ?? 0
  const coins = profile?.total_coins ?? 500
  const league = getLeague(xp)
  const progress = getLeagueProgress(xp)
  const nextLeague = getNextLeague(xp)

  const { isCollapsed } = useSidebarStore()

  const handleLogout = async () => {
    setShowLogoutConfirm(false)
    await signOut()
    router.push("/")
  }

  return (
    <>
    <div className="mt-auto px-3 pb-3 space-y-2">

      {/* XP + LEAGUE ROW */}
      {!isCollapsed && (
        <div className="sidebar-widget rounded-2xl px-3 py-2.5" style={{ borderColor: `${league.color}35`, background: `${league.color}12` }}>
          <div className="flex items-center gap-2 mb-1.5">
            <league.Icon className="h-5 w-5" />
            <span className="text-xs font-bold truncate" style={{ color: league.color }}>{league.name}</span>
            <div className="ml-auto flex items-center gap-1">
              <GavelIcon className="h-3 w-3" style={{ color: league.color }} />
              <span className="text-[11px] font-bold tabular-nums" style={{ color: league.color }}>{xp} Gavels</span>
            </div>
          </div>
          {nextLeague && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${league.color}20` }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, backgroundColor: league.color }}
                />
              </div>
              <span className="text-[9px] text-[var(--ink-3)] whitespace-nowrap flex items-center gap-0.5"><nextLeague.Icon className="h-2.5 w-2.5" /> {nextLeague.xpRequired - xp}</span>
            </div>
          )}
        </div>
      )}

      {/* COINS ROW */}
      {!isCollapsed && (
        <div className="sidebar-widget-coins rounded-2xl flex items-center gap-2 px-3 py-1.5">
          <GCoinIcon className="h-3.5 w-3.5 text-[var(--gv-gold)]" />
          <span className="text-xs font-bold text-[var(--gv-gold)] tabular-nums">{coins}</span>
          <span className="text-[10px] text-[var(--ink-3)]">coins</span>
        </div>
      )}

      {/* ACCOUNT CARD — expands in-place to show options */}
      {!isCollapsed && (
        <div
          className={cn(
            "sidebar-account-card rounded-2xl transition-all duration-300 ease-in-out",
            isOpen ? "is-open" : ""
          )}
        >
          {/* Expanded options — appear INSIDE the card above the trigger row */}
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div className="px-1 pt-1 space-y-0.5 pb-1">
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors"
              >
                <User className="h-3.5 w-3.5 shrink-0 text-[var(--ink-3)]" />
                <span>Profile</span>
              </button>
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors"
                onClick={() => { toggleTheme(); setIsOpen(false); }}
              >
                {isDarkMode ? <Sun className="h-3.5 w-3.5 shrink-0 text-amber-500" /> : <Moon className="h-3.5 w-3.5 shrink-0 text-indigo-500" />}
                <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
              </button>
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                onClick={() => { setShowLogoutConfirm(true); setIsOpen(false); }}
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
            {/* Divider */}
            <div className="mx-3 h-px bg-white/8 mb-0" />
          </div>

          {/* Always-visible account row — clicking toggles expansion */}
          <button
            onClick={() => setIsOpen(prev => !prev)}
            className="group flex w-full items-center gap-3 p-3 text-left outline-none"
          >
            <Avatar className="h-8 w-8 shrink-0 rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)]">
              <AvatarImage src={profile?.avatar_url || undefined} className="rounded-full object-cover" />
              <AvatarFallback className="rounded-full bg-[var(--brand)] text-[10px] text-white font-bold flex items-center justify-center">{initial}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left leading-tight min-w-0">
              <span className="block truncate font-semibold text-sm text-[var(--ink)]">{name}</span>
            </div>
            <ChevronUp className={cn(
              "h-4 w-4 shrink-0 text-[var(--ink-3)] transition-transform duration-300",
              !isOpen && "rotate-180"
            )} />
          </button>
        </div>
      )}
    </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative z-10 w-80 rounded-2xl bg-background border border-white/10 p-6 shadow-2xl flex flex-col items-center text-center gap-4">
            <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <LogOut className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Sign out?</h3>
              <p className="text-sm text-muted-foreground mt-1">You&apos;ll be redirected to the home page.</p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                className="flex-1 px-4 py-2 rounded-xl text-sm transition-all hover:scale-[1.02]"
                style={{
                  background: "rgba(255,255,255,0.25)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "var(--ink)",
                }}
                onClick={() => setShowLogoutConfirm(false)}
              >Cancel</button>
              <button
                className="flex-1 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:scale-[1.02]"
                style={{
                  background: "rgba(239,68,68,0.75)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(239,68,68,0.4)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 8px rgba(239,68,68,0.3)",
                }}
                onClick={handleLogout}
              >Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

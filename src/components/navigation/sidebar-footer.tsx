"use client"
import { useAuthStore } from "@/lib/stores/auth"
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
  const { user, profile, logout } = useAuthStore()
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
    await logout()
    router.push("/")
  }

  return (
    <>
    <div className="mt-auto px-3 pb-3 space-y-2">

      {/* XP + LEAGUE ROW */}
      {!isCollapsed && (
        <div className="px-3 py-2.5 rounded-xl border border-white/5" style={{ background: `${league.color}15` }}>
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
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, backgroundColor: league.color }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground whitespace-nowrap flex items-center gap-0.5"><nextLeague.Icon className="h-2.5 w-2.5" /> {nextLeague.xpRequired - xp}</span>
            </div>
          )}
        </div>
      )}

      {/* COINS ROW */}
      {!isCollapsed && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sidebar-accent/10 border border-white/5">
          <GCoinIcon className="h-3.5 w-3.5 text-slate-300" />
          <span className="text-xs font-bold text-slate-200 tabular-nums">{coins}</span>
          <span className="text-[10px] text-muted-foreground">coins</span>
        </div>
      )}

      {/* ACCOUNT CARD — expands in-place to show options */}
      {!isCollapsed && (
        <div
          className={cn(
            "rounded-2xl border border-white/10 overflow-hidden transition-all duration-300 ease-in-out",
            isOpen ? "bg-sidebar-accent/10 border-white/20" : "bg-transparent hover:bg-sidebar-accent/10 hover:border-white/15"
          )}
        >
          {/* Expanded options — appear INSIDE the card above the trigger row */}
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div className="px-1 pt-1 space-y-0.5">
              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-xl transition-colors">
                <User className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/60" />
                <span>Profile</span>
              </button>
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-xl transition-colors"
                onClick={() => { toggleTheme(); setIsOpen(false); }}
              >
                {isDarkMode ? <Sun className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/60" /> : <Moon className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/60" />}
                <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
              </button>
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors mb-1"
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
            <Avatar className="h-8 w-8 shrink-0 rounded-full border border-white/10 bg-sidebar-accent">
              <AvatarImage src={profile?.avatar_url || undefined} className="rounded-full object-cover" />
              <AvatarFallback className="rounded-full bg-indigo-500 text-[10px] text-white font-bold flex items-center justify-center">{initial}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left leading-tight min-w-0">
              <span className="block truncate font-semibold text-sm text-sidebar-foreground">{name}</span>
            </div>
            <ChevronUp className={cn(
              "h-4 w-4 shrink-0 text-sidebar-foreground/40 transition-transform duration-300",
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
                className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-sm hover:bg-white/5 transition-colors"
                onClick={() => setShowLogoutConfirm(false)}
              >Cancel</button>
              <button
                className="flex-1 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
                onClick={handleLogout}
              >Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

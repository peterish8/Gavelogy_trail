'use client'

import { useState } from 'react'
import { SidebarItem } from './sidebar-item'
import { SidebarSection } from './sidebar-section'
import { SearchCommandMenu } from '@/components/search-command-menu'
import { 
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  Gamepad2,
  AlertCircle,
  Settings, 
  User,
  Search,
  LogOut,
  Moon,
  Sun
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { useRouter } from 'next/navigation'
import { useThemeStore } from '@/lib/stores/theme'

export function SidebarNav() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [activeItem, setActiveItem] = useState('/dashboard') // Default active
  const { logout } = useAuthStore()
  const router = useRouter()
  const { isDarkMode, toggleTheme } = useThemeStore()

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <div className="space-y-6 px-3">
      {/* Primary Actions */}
      <div className="space-y-1">
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-md transition-colors text-left group"
        >
           <Search className="w-4 h-4 shrink-0" />
           <span>Search...</span>
           <kbd className="ml-auto pointer-events-none h-5 select-none items-center gap-1 rounded border border-sidebar-border bg-sidebar-accent px-1.5 font-mono text-[10px] font-medium opacity-100 flex text-sidebar-foreground/50">
              <span className="text-xs">Ctrl</span>K
           </kbd>
        </button>
      </div>

      {/* Main Navigation */}
      <SidebarSection title="Menu">
        <SidebarItem 
          icon={LayoutDashboard} 
          label="Dashboard" 
          href="/dashboard" 
          active={activeItem === '/dashboard'} 
          onClick={() => setActiveItem('/dashboard')}
        />
        <SidebarItem 
          icon={BookOpen} 
          label="Courses" 
          href="/courses"
          active={activeItem === '/courses'}
          onClick={() => setActiveItem('/courses')}
        />
        <SidebarItem 
          icon={AlertCircle} 
          label="Mistakes" 
          href="/mistakes"
          active={activeItem === '/mistakes'}
          onClick={() => setActiveItem('/mistakes')}
        />
        <SidebarItem 
          icon={Gamepad2} 
          label="Game Arena" 
          href="/arena"
          active={activeItem === '/arena'}
          onClick={() => setActiveItem('/arena')}
        />
        <SidebarItem 
          icon={Trophy} 
          label="Leaderboard" 
          href="/leaderboard"
          active={activeItem === '/leaderboard'}
          onClick={() => setActiveItem('/leaderboard')}
        />
      </SidebarSection>
      
      {/* User & Settings */}
      <SidebarSection title="Account">
        <SidebarItem icon={User} label="Profile" href="/profile" />
        <SidebarItem icon={Settings} label="Settings" href="/settings" />
        
        <button 
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-md transition-colors text-left"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
        </button>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors text-left"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </SidebarSection>

      <SearchCommandMenu open={isSearchOpen} setOpen={setIsSearchOpen} />
    </div>
  )
}

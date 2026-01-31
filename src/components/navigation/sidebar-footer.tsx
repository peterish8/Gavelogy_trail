"use client"
// Force rebuild - component added
import { useAuthStore } from "@/lib/stores/auth"
import { ChevronUp, User, LogOut } from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function SidebarFooter() {
  const { user, profile, logout } = useAuthStore()
  
  // Initial of the user or 'U'
  const initial = profile?.full_name ? profile.full_name[0].toUpperCase() : (user?.email?.[0].toUpperCase() || 'U')
  const name = profile?.full_name || user?.email?.split('@')[0] || "User"

  return (
    <div className="mt-auto px-3 pb-3">
      {/* USER PROFILE ROW */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-2 text-left transition-all hover:bg-sidebar-accent/50 data-[state=open]:bg-sidebar-accent">
            <Avatar className="h-8 w-8 rounded-lg border border-sidebar-border bg-sidebar-accent">
               <AvatarImage src={profile?.avatar_url || undefined} />
               <AvatarFallback className="rounded-lg bg-indigo-500 text-white font-bold">{initial}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate font-semibold text-sm text-sidebar-foreground">{name}</span>
              <span className="truncate text-xs text-sidebar-foreground/70">{user?.email}</span>
            </div>
            <ChevronUp className="h-4 w-4 text-sidebar-foreground/50 transition-transform group-data-[state=open]:rotate-180" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
            align="start" 
            className="w-[220px] rounded-xl border-sidebar-border bg-sidebar shadow-xl"
            side="top"
            sideOffset={8}
        >
            <DropdownMenuItem className="cursor-pointer gap-2 rounded-lg">
                <User className="h-4 w-4" />
                <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
                className="cursor-pointer gap-2 rounded-lg text-red-500 hover:text-red-500 focus:bg-red-500/10 focus:text-red-500 bg-red-500/0 outline-none"
                onClick={() => logout()}
            >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

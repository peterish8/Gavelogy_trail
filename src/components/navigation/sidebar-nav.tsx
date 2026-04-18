import { useState, useEffect } from 'react'
import { SidebarItem } from './sidebar-item'
import { SidebarSection } from './sidebar-section'
import { SearchCommandMenu } from '@/components/search-command-menu'
import { usePaymentStore, type Course } from "@/lib/payment"
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useConvexAuth } from 'convex/react'
import { 
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  Gamepad2,
  AlertCircle,
  Search,
  ChevronDown,
  FileText,
  Swords,
  Zap,
  Users
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

const ARENA_MODES = [
  { id: 'duel', name: 'Duel', emoji: '⚔️', icon: Swords, href: '/arena/duel', color: '#6366f1' },
  { id: 'speed_court', name: 'Speed Court', emoji: '⚡', icon: Zap, href: '/arena/speed-court', color: '#f59e0b' },
  { id: 'arena', name: 'Arena', emoji: '🏆', icon: Trophy, href: '/arena/lobby?mode=arena', color: '#ef4444' },
  { id: 'tagteam', name: 'Tag Team', emoji: '🤝', icon: Users, href: '/arena/lobby?mode=tagteam', color: '#06b6d4' },
];

export function SidebarNav() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const pathname = usePathname()
  
  const { isAuthenticated } = useConvexAuth();
  const { recentCourses, availableCourses, loadAvailableCourses } = usePaymentStore();

  // Reactive Convex query — updates instantly when a course is purchased
  const userCoursesData = useQuery(
    api.payments.getUserCourses,
    isAuthenticated ? {} : 'skip'
  );

  useEffect(() => {
    setIsMounted(true);
    if (availableCourses.length === 0) {
      loadAvailableCourses();
    }
  }, [availableCourses.length, loadAvailableCourses]);

  // Build display list: prefer recently visited, fallback to all purchased
  const purchasedIds = (userCoursesData ?? []).map(uc => uc.courseId as string);

  let displayCourses = recentCourses
    .filter(id => purchasedIds.includes(id))
    .map(id => availableCourses.find(c => c.id === id))
    .filter((c): c is Course => Boolean(c));

  if (displayCourses.length === 0) {
    displayCourses = purchasedIds
      .slice(0, 5)
      .map(id => availableCourses.find(c => c.id === id))
      .filter((c): c is Course => Boolean(c));
  }

  displayCourses = displayCourses.slice(0, 5);

  if (!isMounted) {
    displayCourses = [];
  }

  const [isCoursesOpen, setIsCoursesOpen] = useState(false)
  const [isArenaOpen, setIsArenaOpen] = useState(false)

  return (
    <div className="space-y-6 px-3">
      {/* Search Bar */}
      <button
        onClick={() => setIsSearchOpen(true)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl glass-input hover:bg-white/70 transition-all text-left group"
      >
        <Search className="w-3.5 h-3.5 shrink-0 text-sidebar-foreground/50" />
        <span className="flex-1 text-sm text-sidebar-foreground/50">Search...</span>
        <kbd className="pointer-events-none inline-flex h-5 items-center gap-0.5 rounded border border-sidebar-border bg-sidebar px-1.5 font-mono text-[10px] text-sidebar-foreground/40">
          ⌘K
        </kbd>
      </button>

      {/* Main Navigation */}
      <SidebarSection title="Menu">
        <SidebarItem 
          icon={LayoutDashboard} 
          label="Dashboard" 
          href="/dashboard" 
          active={pathname === '/dashboard'} 
        />
        
        
        {/* Smart Courses Dropdown */}
        <Collapsible open={isCoursesOpen} onOpenChange={setIsCoursesOpen} className="group/collapsible">
            <div 
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-150 group relative",
                  !(pathname === '/courses' || pathname.startsWith('/course-viewer')) && "nav-inactive hover:bg-white/10 dark:hover:bg-white/5"
                )}
                style={(pathname === '/courses' || pathname.startsWith('/course-viewer')) ? {
                  background: "rgba(75, 42, 214, 0.12)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(75, 42, 214, 0.25)",
                  boxShadow: "0 2px 8px rgba(75, 42, 214, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                  color: "var(--brand)",
                } : {}}
            >
               {/* Main Link */}
               <Link 
                  href="/courses"
                  className="flex-1 flex items-center gap-3 cursor-pointer"
               >
                  <BookOpen className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    Courses
                  </span>
               </Link>

               {/* Toggle Chevron - Right Aligned */}
               <CollapsibleTrigger asChild>
                  <button className="h-5 w-5 flex items-center justify-center rounded-sm hover:bg-sidebar-accent/50 ml-auto icon-btn">
                     <ChevronDown className={cn(
                       "h-4 w-4 opacity-70 transition-transform duration-200",
                       "[transition-timing-function:var(--ease-spring)]",
                       !isCoursesOpen && "-rotate-90" 
                     )} />
                  </button>
               </CollapsibleTrigger>
            </div>

            {/* Nested Items */}
            <CollapsibleContent>
               <div className="mt-1 space-y-0.5">
                  {displayCourses.length > 0 ? (
                    displayCourses.map((course: Course) => (
                      <Link
                        key={course.id}
                        href={`/course-viewer?courseId=${course.id}`}
                        className="w-full flex items-center gap-3 pl-8 pr-2 py-2 text-sm text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/40 rounded-md transition-all text-left group/item pressable"
                      >
                         <FileText className="h-4 w-4 shrink-0 text-sidebar-foreground/70 group-hover/item:text-sidebar-foreground transition-colors" />
                         <span className="truncate">{course.name}</span>
                      </Link>
                    ))
                  ) : (
                      <div className="pl-8 pr-2 py-2 text-sm text-sidebar-foreground/50 italic cursor-default">
                        No recent courses
                      </div>
                  )}
               </div>
            </CollapsibleContent>
        </Collapsible>

        <SidebarItem 
          icon={AlertCircle} 
          label="Mistakes" 
          href="/mistakes"
          active={pathname.startsWith('/mistakes')}
        />
        {/* Game Arena Dropdown */}
        <Collapsible open={isArenaOpen} onOpenChange={setIsArenaOpen} className="group/collapsible">
            <div 
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors group relative",
                  !pathname.startsWith('/arena') && "nav-inactive hover:bg-white/10 dark:hover:bg-white/5"
                )}
                style={pathname.startsWith('/arena') ? {
                  background: "rgba(75, 42, 214, 0.12)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(75, 42, 214, 0.25)",
                  boxShadow: "0 2px 8px rgba(75, 42, 214, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                  color: "var(--brand)",
                } : {}}
            >
               {/* Main Link */}
               <Link 
                  href="/arena"
                  className="flex-1 flex items-center gap-3 cursor-pointer"
               >
                  <Gamepad2 className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    Game Arena
                  </span>
               </Link>

               {/* Toggle Chevron */}
               <CollapsibleTrigger asChild>
                  <button className="h-5 w-5 flex items-center justify-center rounded-sm hover:bg-sidebar-accent/50 ml-auto icon-btn">
                     <ChevronDown className={cn(
                       "h-4 w-4 opacity-70 transition-transform duration-200",
                       "[transition-timing-function:var(--ease-spring)]",
                       !isArenaOpen && "-rotate-90" 
                     )} />
                  </button>
               </CollapsibleTrigger>
            </div>

            {/* Game Mode Links */}
            <CollapsibleContent>
               <div className="mt-1 space-y-0.5">
                 {ARENA_MODES.map((mode) => (
                   <Link
                     key={mode.id}
                     href={mode.href}
                     className={cn(
                       "w-full flex items-center gap-3 pl-8 pr-2 py-2 text-sm rounded-md transition-all duration-200 text-left group/item pressable",
                       pathname === mode.href
                         ? "text-[var(--ink)]"
                         : "text-sidebar-foreground hover:text-sidebar-foreground"
                     )}
                     style={pathname === mode.href ? {
                       background: "rgba(75, 42, 214, 0.12)",
                       backdropFilter: "blur(10px)",
                       WebkitBackdropFilter: "blur(10px)",
                       border: `1px solid rgba(75, 42, 214, 0.25)`,
                       boxShadow: "0 2px 8px rgba(75, 42, 214, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                       borderLeft: `3px solid ${mode.color}`,
                     } : {
                       borderLeft: '3px solid transparent'
                     }}
                     onMouseEnter={(e) => {
                       if (pathname !== mode.href) {
                         e.currentTarget.style.backgroundColor = `${mode.color}12`;
                         e.currentTarget.style.borderLeftColor = `${mode.color}80`;
                       }
                     }}
                     onMouseLeave={(e) => {
                       if (pathname !== mode.href) {
                         e.currentTarget.style.backgroundColor = 'transparent';
                         e.currentTarget.style.borderLeftColor = 'transparent';
                       }
                     }}
                   >
                      <mode.icon className="h-4 w-4 shrink-0 transition-colors" style={{ color: mode.color }} />
                      <span className="truncate">{mode.name}</span>
                   </Link>
                 ))}
               </div>
            </CollapsibleContent>
        </Collapsible>
        <SidebarItem 
          icon={Trophy} 
          label="Leaderboard" 
          href="/leaderboard"
          active={pathname.startsWith('/leaderboard')}
        />
      </SidebarSection>
      
      <SearchCommandMenu open={isSearchOpen} setOpen={setIsSearchOpen} />
    </div>
  )
}

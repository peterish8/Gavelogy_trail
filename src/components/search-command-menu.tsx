"use client";

import * as React from "react";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  BookOpen, 
  LayoutDashboard, 
  Trophy, 
  AlertCircle, 
  User, 
  Sun,
  StickyNote,
  Brain,
  Loader2,
  X
} from "lucide-react";
import { useThemeStore } from "@/lib/stores/theme";
import { useSearch, SearchResult } from "@/hooks/use-search";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface SearchCommandMenuProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function SearchCommandMenu({ open, setOpen }: SearchCommandMenuProps) {
  const router = useRouter();
  const { toggleTheme } = useThemeStore();
  const { query, setQuery, results, isIndexLoading, executeAction } = useSearch();

  // Keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen, open]);

  // Reset query on close
  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open, setQuery]);

  // Quick navigation helper
  const handleQuickNav = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop */}
          <motion.div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          />
          
          {/* Command Palette */}
          <motion.div 
            className="relative w-full max-w-xl"
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
          >
        <Command 
          className="w-full rounded-xl border border-border bg-background shadow-2xl overflow-hidden"
          loop
          shouldFilter={false}
        >
          {/* Search Input */}
          <div className="flex items-center border-b px-4">
            <Search className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input 
              value={query}
              onValueChange={setQuery}
              placeholder="Search courses, notes, quizzes..." 
              className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery("")} className="p-1 hover:bg-muted rounded">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <kbd className="ml-2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>
          
          <Command.List className="max-h-[320px] overflow-y-auto py-2">
            {/* Loading State */}
            {isIndexLoading && (
              <div className="py-6 flex items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Loading search index...
              </div>
            )}

            {/* Empty Query Prompt */}
            {!query && !isIndexLoading && (
              <div className="px-4 py-4 text-center text-sm text-muted-foreground">
                Type to search your courses, notes, and quizzes...
              </div>
            )}
            
            {/* No Results */}
            {query && results.length === 0 && !isIndexLoading && (
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                No results found for &quot;{query}&quot;.
              </Command.Empty>
            )}

            {/* Search Results */}
            {results.length > 0 && (
              <Command.Group heading="Results" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                {results.map((result) => (
                  <SearchResultItem
                    key={result.id}
                    result={result}
                    onAction={(actionType) => {
                      setOpen(false);
                      executeAction(result, actionType);
                    }}
                  />
                ))}
              </Command.Group>
            )}

            {/* Quick Navigation */}
            <Command.Separator className="my-2 h-px bg-border" />
            <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              <QuickNavItem icon={LayoutDashboard} label="Dashboard" onClick={() => handleQuickNav("/dashboard")} />
              <QuickNavItem icon={BookOpen} label="Courses" onClick={() => handleQuickNav("/courses")} />
              <QuickNavItem icon={AlertCircle} label="Mistakes Log" onClick={() => handleQuickNav("/mistakes")} />
              <QuickNavItem icon={Trophy} label="Leaderboard" onClick={() => handleQuickNav("/leaderboard")} />
              <QuickNavItem icon={User} label="Profile" onClick={() => handleQuickNav("/profile")} />
            </Command.Group>

            <Command.Separator className="my-2 h-px bg-border" />
            <Command.Group heading="Settings" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              <QuickNavItem 
                icon={Sun} 
                label="Toggle Theme" 
                onClick={() => { toggleTheme(); setOpen(false); }} 
              />
            </Command.Group>
          </Command.List>
          
            {/* Footer */}
            <div className="border-t bg-muted/50 px-4 py-2 text-xs text-muted-foreground flex justify-between">
              <span>↑↓ Navigate</span>
              <span className="opacity-60">Gavelogy Search</span>
            </div>
          </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ============================
// 🧱 Search Result Item (INLINE BUTTONS)
// ============================

interface SearchResultItemProps {
  result: SearchResult;
  onAction: (actionType: "OPEN_PRIMARY" | "OPEN_SECONDARY" | "OPEN_QUIZ") => void;
}

function SearchResultItem({ result, onAction }: SearchResultItemProps) {
  const icons = {
    course: BookOpen,
    note: StickyNote,
    quiz: Brain,
    folder: BookOpen, 
  };
  const Icon = icons[result.type];
  const colors = {
    course: "text-blue-500",
    note: "text-amber-500",
    quiz: "text-purple-500",
    folder: "text-green-500",
  };

  return (
    <Command.Item 
      value={result.id}
      className="flex items-center h-12 px-3 rounded-md cursor-pointer aria-selected:bg-accent transition-colors group"
    >
      {/* Icon */}
      <Icon className={`h-5 w-5 mr-3 shrink-0 ${colors[result.type]}`} />
      
      {/* Text */}
      <div className="flex-1 min-w-0 mr-4">
        <div className="font-medium text-sm truncate">{result.title}</div>
        {result.subtitle && (
          <div className="text-xs text-muted-foreground truncate">{result.subtitle}</div>
        )}
      </div>

      {/* Inline Buttons (Right Aligned) */}
      <div className="flex items-center gap-2 shrink-0 opacity-0 group-aria-selected:opacity-100 transition-opacity">
        {result.actions.map((action, idx) => (
          <Button
            key={`${result.id}-${action.actionType}-${idx}`}
            size="sm"
            variant={idx === 0 ? "default" : "outline"}
            className="h-7 text-xs px-2"
            onClick={(e) => {
              e.stopPropagation();
              onAction(action.actionType);
            }}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </Command.Item>
  );
}

// ============================
// 🧱 Quick Navigation Item
// ============================

interface QuickNavItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}

function QuickNavItem({ icon: Icon, label, onClick }: QuickNavItemProps) {
  return (
    <Command.Item 
      onSelect={onClick}
      className="flex items-center h-9 px-3 rounded-md cursor-pointer aria-selected:bg-accent transition-colors text-sm"
    >
      <Icon className="mr-3 h-4 w-4 text-muted-foreground" />
      {label}
    </Command.Item>
  );
}

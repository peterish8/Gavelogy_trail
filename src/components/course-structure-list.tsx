import { ChevronRight, ChevronDown, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface StructureItem {
  id: string;
  title: string;
  item_type: "folder" | "file";
  children?: StructureItem[];
  description?: string;
  is_active: boolean;
  order_index: number;
}

interface CourseStructureListProps {
  items: StructureItem[];
  onFileSelect: (itemId: string) => void;
  completedItems: Set<string>;
  onToggleComplete: (itemId: string) => void;
  onQuizSelect?: (itemId: string) => void;
  expandedIds?: Set<string>;
  onExpand?: (id: string) => void;
  // Content availability
  itemsWithNotes?: Set<string>;
  itemsWithQuizzes?: Set<string>;
}

export function CourseStructureList({ items, onFileSelect, completedItems, onToggleComplete, onQuizSelect, expandedIds, onExpand, itemsWithNotes, itemsWithQuizzes }: CourseStructureListProps) {
  // 3 smooth pastel gradients (matching the 3 courses from pricing page)
  const themes = [
    {
      // Lavender-Blue (Static Subjects)
      bgClass: "bg-linear-to-br from-[#F1EEFC] to-[#E2EAFA] border-[#E5E2EC] dark:border-purple-500/30 dark:bg-purple-500/15 dark:backdrop-blur-xl dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_0_40px_rgba(168,85,247,0.2)]",
      text: "text-[#4B2AD6]", 
      badge: "bg-[#EBE6FD] text-[#4B2AD6] hover:bg-[#D7CEFA]", 
      progress: "text-[#4B2AD6]", 
      border: "border-[#D7CEFA]", 
      shadow: "hover:shadow-[0_0_20px_rgba(75,42,214,0.10)]",
      darkText: "!dark:text-purple-300",
      darkBorder: "!dark:border-purple-500"
    },
    {
      // Sage Green (Contemporary Cases)
      bgClass: "bg-linear-to-br from-[#E6F5EB] to-[#D1EFE6] border-[#E5E2EC] dark:border-teal-500/30 dark:bg-teal-500/15 dark:backdrop-blur-xl dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_0_40px_rgba(20,184,166,0.2)]",
      text: "text-[#148A88]", 
      badge: "bg-[#E0F5F4] text-[#148A88] hover:bg-[#C4EDEC]", 
      progress: "text-[#148A88]", 
      border: "border-[#A8DAD9]", 
      shadow: "hover:shadow-[0_0_20px_rgba(20,138,136,0.10)]",
      darkText: "!dark:text-teal-300",
      darkBorder: "!dark:border-teal-500"
    },
    {
      // Warm Peach (Bundle)
      bgClass: "bg-linear-to-br from-[#FDEDEC] to-[#F8DEC5] border-[#E5E2EC] dark:border-orange-500/30 dark:bg-orange-500/15 dark:backdrop-blur-xl dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_0_40px_rgba(249,115,22,0.2)]",
      text: "text-[#D35400]", 
      badge: "bg-[#FBEEDA] text-[#D35400] hover:bg-[#F6E2C2]", 
      progress: "text-[#D35400]", 
      border: "border-[#EAD2A3]", 
      shadow: "hover:shadow-[0_0_20px_rgba(211,84,0,0.10)]",
      darkText: "!dark:text-orange-300",
      darkBorder: "!dark:border-orange-500"
    }
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto font-[Inter,sans-serif]">
      {items.map((item, index) => {
        const theme = themes[index % themes.length];
        return (
          <YearCard 
            key={item.id} 
            item={item} 
            theme={theme} 
            onFileSelect={onFileSelect}
            completedItems={completedItems}
            onToggleComplete={onToggleComplete}
            onQuizSelect={onQuizSelect}
            expandedIds={expandedIds}
            onExpand={onExpand}
            itemsWithNotes={itemsWithNotes}
            itemsWithQuizzes={itemsWithQuizzes}
          />
        );
      })}
    </div>
  );
}

interface ThemeColors {
  bgClass: string;
  text: string;
  badge: string;
  progress: string;
  border: string;
  shadow: string;
  darkText: string;
  darkBorder: string;
}

function YearCard({ item, theme, onFileSelect, completedItems, onToggleComplete, onQuizSelect, expandedIds, onExpand, itemsWithNotes, itemsWithQuizzes }: { item: StructureItem, theme: ThemeColors, onFileSelect: (id: string) => void, completedItems: Set<string>, onToggleComplete: (id: string) => void, onQuizSelect?: (id: string) => void, expandedIds?: Set<string>, onExpand?: (id: string) => void, itemsWithNotes?: Set<string>, itemsWithQuizzes?: Set<string> }) {
  // Use controlled expansion if expandedIds is provided, otherwise local state
  const isControlled = expandedIds !== undefined;
  const [localExpanded, setLocalExpanded] = useState(true);
  const isExpanded = isControlled ? expandedIds.has(item.id) : localExpanded;
  
  const handleToggle = () => {
    if (isControlled && onExpand) {
      onExpand(item.id);
    } else {
      setLocalExpanded(!localExpanded);
    }
  };
  
  // Calculate progress recursively
  const { total, completed } = countProgress(item, completedItems);
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const progressDashArray = `${progress}, 100`;

  return (
    <Card 
      data-item-id={item.id}
      className={cn(
        "year-card overflow-hidden relative border shadow-[0_2px_8px_rgba(0,0,0,0.03)] rounded-2xl transition-all duration-300 group",
        theme.bgClass,
        theme.shadow
      )}
    >
      <CardContent className="p-6 relative z-10">
        {/* Header */}
        <div 
          className="flex items-center justify-between cursor-pointer mb-2"
          onClick={handleToggle}
        >
          <div className="flex items-center gap-4">
            <div className={cn("text-2xl tracking-tight font-bold text-[#130F2A] dark:text-gray-100", theme.darkText)}>
              {item.title}
            </div>
          </div>

          <div className="flex items-center gap-3">
             {/* Minimalist Progress Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/[0.05] rounded-full">
               <span className={cn("text-[6px] leading-[0]", theme.text)}>●</span>
               <span className="text-[11px] font-bold text-[#130F2A]/70 dark:text-gray-300">{progress}%</span>
            </div>

            {isExpanded ? (
               <ChevronDown className="h-6 w-6 text-[#857FA0] dark:text-gray-400" />
            ) : (
               <ChevronRight className="h-6 w-6 text-[#857FA0] dark:text-gray-400" />
            )}
          </div>
        </div>

        {/* Content */}
        <div 
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
             <div className="mt-6 space-y-4 bg-[#F7F6FB]/60 dark:bg-card/30 rounded-xl p-4">
                  {item.children && item.children.map((child, idx) => (
                    <ChildItem 
                      key={child.id} 
                      item={child} 
                      displayIndex={idx + 1}
                      onFileSelect={onFileSelect} 
                      completedItems={completedItems} 
                      onToggleComplete={onToggleComplete}
                      onQuizSelect={onQuizSelect}
                      depth={0}
                      expandedIds={expandedIds}
                      onExpand={onExpand}
                      itemsWithNotes={itemsWithNotes}
                      itemsWithQuizzes={itemsWithQuizzes}
                      theme={theme}
                    />
                  ))}
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChildItem({ item, displayIndex, onFileSelect, completedItems, onToggleComplete, onQuizSelect, depth, expandedIds, onExpand, itemsWithNotes, itemsWithQuizzes, theme }: { item: StructureItem, displayIndex: number, onFileSelect: (id: string) => void, completedItems: Set<string>, onToggleComplete: (id: string) => void, onQuizSelect?: (id: string) => void, depth: number, expandedIds?: Set<string>, onExpand?: (id: string) => void, itemsWithNotes?: Set<string>, itemsWithQuizzes?: Set<string>, theme: ThemeColors }) {
   // Use controlled expansion if parent provides it
   const isControlled = expandedIds !== undefined;
   const [localOpen, setLocalOpen] = useState(true);
   const isOpen = isControlled ? expandedIds.has(item.id) : localOpen;
   
   const handleToggleOpen = () => {
     if (isControlled && onExpand) {
       onExpand(item.id);
     } else {
       setLocalOpen(!localOpen);
     }
   };
   
   const isCompleted = completedItems.has(item.id);
   
   // Check content availability (default to available if sets not provided)
   const hasNotes = !itemsWithNotes || itemsWithNotes.has(item.id);
   const hasQuiz = !itemsWithQuizzes || itemsWithQuizzes.has(item.id);

   // Folder
   if (item.item_type === "folder") {
      return (
        <div className="mt-4 first:mt-0" data-item-id={item.id}>
           <div 
             className="flex items-center justify-between cursor-pointer py-2 px-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
             onClick={handleToggleOpen}
           >
              <div className="flex items-center gap-2">
                 <span className={cn(
                   "text-[15px] font-semibold text-gray-800 transition-colors",
                   theme.darkText
                 )}>
                    ⚖️ {item.title}
                 </span>
              </div>
              {isOpen ? <ChevronDown className="h-4 w-4 text-[#857FA0]"/> : <ChevronRight className="h-4 w-4 text-[#857FA0]"/>}
           </div>
           

            <div 
             className={cn(
               "ml-[18px] grid transition-all duration-300 ease-in-out",
               isOpen ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 mt-0"
             )}
           >
              <div className="overflow-hidden">
                <div className="py-3 relative border-l-2 border-[#E5E2EC] dark:border-border/40 ml-[11px] mb-2 flex flex-col gap-2">
                    {item.children && item.children.map((child, idx) => (
                       <ChildItem key={child.id} item={child} displayIndex={idx + 1} onFileSelect={onFileSelect} completedItems={completedItems} onToggleComplete={onToggleComplete} onQuizSelect={onQuizSelect} depth={depth + 1} expandedIds={expandedIds} onExpand={onExpand} itemsWithNotes={itemsWithNotes} itemsWithQuizzes={itemsWithQuizzes} theme={theme} />
                    ))}
                </div>
              </div>
           </div>
        </div>
      );
   }

   // File (Timeline Stepper Layout)
   return (
     <div data-item-id={item.id} className="relative flex items-center justify-between group pl-7 pr-2 py-1.5 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] rounded-lg -ml-px transition-colors">
        {/* Timeline Dot (Completion Check) */}
        <button 
           onClick={(e) => {
             e.stopPropagation();
             onToggleComplete(item.id);
           }}
           className={cn(
             "absolute -left-[14px] top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-[3px] flex items-center justify-center transition-all hover:scale-110 z-10 shrink-0 shadow-[0_0_0_4px_#F7F6FB] group-hover:shadow-[0_0_0_4px_#F4F3F9] dark:shadow-[0_0_0_4px_#1E1E24]",
             isCompleted 
                ? "bg-[#1F7A52] border-[#1F7A52] text-white shadow-sm" 
                : "bg-[#F7F6FB] dark:bg-card border-[#CDC6DC] text-transparent hover:border-[#857FA0] dark:border-gray-600 dark:hover:border-gray-500"
           )}
        >
           <Check className="w-[14px] h-[14px] stroke-[4px]" />
        </button>

        <div className="flex flex-col flex-1 min-w-0 pr-4 mt-0.5 group-hover:translate-x-1 transition-transform">
           <div className="font-semibold text-[#130F2A] dark:text-gray-100 line-clamp-2 text-[15px] leading-snug">
              <span className="text-[#857FA0] mr-1.5 font-bold">{displayIndex}.</span>
              {item.title}
           </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-4">
           {/* Notes Button - greyed if empty */}
             <Button 
               variant="outline" 
               size="sm" 
               disabled={!hasNotes}
               title={hasNotes ? "View Notes" : "Notes not available yet"}
               className={cn(
                 "rounded-full px-2.5 font-semibold active:scale-95 transition-all duration-200",
                 hasNotes 
                   ? "border-[#D7CEFA] text-[#4B2AD6] hover:bg-[#EBE6FD] bg-[#EBE6FD]/50 hover:border-[#4B2AD6]/30 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20 dark:hover:bg-purple-500/20"
                   : "border-[#CDC6DC] text-[#857FA0] bg-[#EFECF5] cursor-not-allowed opacity-60 disabled:pointer-events-auto dark:bg-muted dark:border-border"
               )}
               onClick={() => hasNotes && onFileSelect(item.id)}
             >
                <FileText className="w-4 h-4" />
             </Button>
 
             {/* Quiz Button - Green Theme */}
             <Button
               variant="outline"
               size="sm"
               disabled={!hasQuiz}
               title={hasQuiz ? "Take Quiz" : "Quiz not available yet"}
               className={cn(
                 "rounded-full px-2.5 font-bold active:scale-95 transition-all duration-200",
                 hasQuiz
                   ? "border-[#148A88]/30 text-[#148A88] hover:bg-[#E0F5F4] bg-[#E0F5F4]/50 hover:border-[#148A88]/40 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20 dark:hover:bg-teal-500/20"
                   : "border-[#CDC6DC] text-[#857FA0] bg-[#EFECF5] cursor-not-allowed opacity-60 disabled:pointer-events-auto dark:bg-muted dark:border-border"
               )}
               onClick={() => hasQuiz && onQuizSelect?.(item.id)}
             >
                Q
             </Button>
        </div>
     </div>
   );
}

function countProgress(item: StructureItem, completedItems: Set<string>): { total: number, completed: number } {
  if (item.item_type === 'file') {
     return { total: 1, completed: completedItems.has(item.id) ? 1 : 0 };
  }
  if (!item.children) return { total: 0, completed: 0 };
  
  return item.children.reduce((acc, child) => {
     const childStats = countProgress(child, completedItems);
     return { total: acc.total + childStats.total, completed: acc.completed + childStats.completed };
  }, { total: 0, completed: 0 });
}

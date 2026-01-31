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
  // We'll cycle through these color themes for the root folders (Years)
  const themes = [
    {bg: "from-blue-100 to-blue-200", text: "text-blue-800", badge: "bg-blue-100 text-blue-800 hover:bg-blue-200", progress: "text-blue-600", border: "border-blue-200", shadow: "hover:shadow-[0_0_20px_rgba(59,130,246,0.6)]" },
    {bg: "from-emerald-100 to-emerald-200", text: "text-emerald-800", badge: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200", progress: "text-emerald-600", border: "border-emerald-200", shadow: "hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]" },
    {bg: "from-purple-100 to-purple-200", text: "text-purple-800", badge: "bg-purple-100 text-purple-800 hover:bg-purple-200", progress: "text-purple-600", border: "border-purple-200", shadow: "hover:shadow-[0_0_20px_rgba(168,85,247,0.6)]" },
    {bg: "from-orange-100 to-orange-200", text: "text-orange-800", badge: "bg-orange-100 text-orange-800 hover:bg-orange-200", progress: "text-orange-600", border: "border-orange-200", shadow: "hover:shadow-[0_0_20px_rgba(249,115,22,0.6)]" },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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

function YearCard({ item, theme, onFileSelect, completedItems, onToggleComplete, onQuizSelect, expandedIds, onExpand, itemsWithNotes, itemsWithQuizzes }: { item: StructureItem, theme: { bg: string, text: string, badge: string, progress: string, border: string, shadow: string }, onFileSelect: (id: string) => void, completedItems: Set<string>, onToggleComplete: (id: string) => void, onQuizSelect?: (id: string) => void, expandedIds?: Set<string>, onExpand?: (id: string) => void, itemsWithNotes?: Set<string>, itemsWithQuizzes?: Set<string> }) {
  // Use controlled expansion if expandedIds is provided, otherwise local state
  const isControlled = expandedIds !== undefined;
  const [localExpanded, setLocalExpanded] = useState(false);
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
        "year-card overflow-hidden relative border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 group"
      )}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div 
          className="flex items-center justify-between cursor-pointer mb-2"
          onClick={handleToggle}
        >
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-gray-900">{item.title}</div>
          </div>

          <div className="flex items-center gap-3">
             {/* Progress Circle */}
            <div className="relative w-12 h-12 hidden sm:block">
               <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-white/40" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className={`${theme.progress} transition-all duration-500 ease-out`} stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" style={{ strokeDasharray: progressDashArray }} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
               </svg>
               <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-700">{progress}%</span>
               </div>
            </div>

            {isExpanded ? (
               <ChevronDown className="h-6 w-6 text-gray-600" />
            ) : (
               <ChevronRight className="h-6 w-6 text-gray-600" />
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
             <div className="mt-6 space-y-4 bg-white/50 rounded-xl p-4">
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
                    />
                  ))}
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChildItem({ item, displayIndex, onFileSelect, completedItems, onToggleComplete, onQuizSelect, depth, expandedIds, onExpand, itemsWithNotes, itemsWithQuizzes }: { item: StructureItem, displayIndex: number, onFileSelect: (id: string) => void, completedItems: Set<string>, onToggleComplete: (id: string) => void, onQuizSelect?: (id: string) => void, depth: number, expandedIds?: Set<string>, onExpand?: (id: string) => void, itemsWithNotes?: Set<string>, itemsWithQuizzes?: Set<string> }) {
   // Use controlled expansion if parent provides it
   const isControlled = expandedIds !== undefined;
   const [localOpen, setLocalOpen] = useState(false);
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
             className="flex items-center justify-between cursor-pointer py-2 px-2 hover:bg-black/5 rounded-lg transition-colors"
             onClick={handleToggleOpen}
           >
              <div className="flex items-center gap-2">
                 <span className="text-lg font-semibold text-gray-800 group-hover:text-black transition-colors">
                    ⚖️ {item.title}
                 </span>
              </div>
              {isOpen ? <ChevronDown className="h-4 w-4 text-gray-500"/> : <ChevronRight className="h-4 w-4 text-gray-500"/>}
           </div>
           

           <div 
             className={cn(
               "ml-2 grid transition-all duration-300 ease-in-out border-l-2 border-gray-200",
               isOpen ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 mt-0"
             )}
           >
              <div className="overflow-hidden pl-4">
                <div className="space-y-3 py-1">
                    {item.children && item.children.map((child, idx) => (
                       <ChildItem key={child.id} item={child} displayIndex={idx + 1} onFileSelect={onFileSelect} completedItems={completedItems} onToggleComplete={onToggleComplete} onQuizSelect={onQuizSelect} depth={depth + 1} expandedIds={expandedIds} onExpand={onExpand} itemsWithNotes={itemsWithNotes} itemsWithQuizzes={itemsWithQuizzes} />
                    ))}
                </div>
              </div>
           </div>
        </div>
      );
   }

   // File
   return (
     <div data-item-id={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center justify-between group">
        <div className="flex items-center gap-3 overflow-hidden flex-1">
           {/* Completion Button - Left Side */}
           <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete(item.id);
              }}
              className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 shrink-0",
                isCompleted 
                   ? "bg-green-500 border-green-500 text-white shadow-xl" 
                   : "border-gray-300 text-transparent hover:border-gray-400"
              )}
           >
              <Check className="w-5 h-5 stroke-[3px]" />
           </button>

           <div className="min-w-6 text-sm font-bold text-gray-400">
              {displayIndex}. 
           </div>
           <div className="font-medium text-gray-900 line-clamp-2 text-lg leading-tight" title={item.title}>
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
                   ? "border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 bg-purple-50/50 hover:shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                   : "border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed opacity-60 disabled:pointer-events-auto"
               )}
               onClick={() => hasNotes && onFileSelect(item.id)}
             >
                <FileText className="w-4 h-4" />
             </Button>
 
             {/* Quiz Button - Green Theme with Glow */}
             <Button
               variant="outline"
               size="sm"
               disabled={!hasQuiz}
               title={hasQuiz ? "Take Quiz" : "Quiz not available yet"}
               className={cn(
                 "rounded-full px-2.5 font-bold active:scale-95 transition-all duration-200",
                 hasQuiz
                   ? "border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 bg-green-50/50 hover:shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                   : "border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed opacity-60 disabled:pointer-events-auto"
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

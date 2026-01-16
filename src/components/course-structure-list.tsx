import { ChevronRight, ChevronDown, Check, Lock, FileText, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
}

export function CourseStructureList({ items, onFileSelect, completedItems, onToggleComplete }: CourseStructureListProps) {
  // We'll cycle through these color themes for the root folders (Years)
  const themes = [
    { bg: "from-blue-100 to-blue-200", text: "text-blue-800", badge: "bg-blue-100 text-blue-800", progress: "text-blue-600", border: "border-blue-200" },
    { bg: "from-emerald-100 to-emerald-200", text: "text-emerald-800", badge: "bg-emerald-100 text-emerald-800", progress: "text-emerald-600", border: "border-emerald-200" },
    { bg: "from-purple-100 to-purple-200", text: "text-purple-800", badge: "bg-purple-100 text-purple-800", progress: "text-purple-600", border: "border-purple-200" },
    { bg: "from-orange-100 to-orange-200", text: "text-orange-800", badge: "bg-orange-100 text-orange-800", progress: "text-orange-600", border: "border-orange-200" },
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
          />
        );
      })}
    </div>
  );
}

function YearCard({ item, theme, onFileSelect, completedItems, onToggleComplete }: { item: StructureItem, theme: any, onFileSelect: (id: string) => void, completedItems: Set<string>, onToggleComplete: (id: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calculate progress recursively
  const { total, completed } = countProgress(item, completedItems);
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const progressDashArray = `${progress}, 100`;

  return (
    <Card 
      className={cn(
        "overflow-hidden relative border-0 shadow-lg rounded-2xl bg-linear-to-br hover:shadow-xl transition-all duration-300 group backdrop-blur-sm",
        theme.bg
      )}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div 
          className="flex items-center justify-between cursor-pointer mb-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-gray-900">{item.title}</div>
            <Badge className={cn("px-3 py-1 rounded-full text-sm font-medium border-0", theme.badge)}>
              {completed} / {total} Completed
            </Badge>
          </div>

          <div className="flex items-center gap-3">
             {/* Progress Circle */}
            <div className="relative w-12 h-12 hidden sm:block">
               <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-white/40" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className={theme.progress} stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" strokeDasharray={progressDashArray} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
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
        {isExpanded && item.children && (
          <div className="mt-6 space-y-4 animate-fadeIn bg-white/50 rounded-xl p-4">
{item.children.map((child, idx) => (
                <ChildItem 
                  key={child.id} 
                  item={child} 
                  displayIndex={idx + 1}
                  onFileSelect={onFileSelect} 
                  completedItems={completedItems} 
                  onToggleComplete={onToggleComplete}
                  depth={0}
                />
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChildItem({ item, displayIndex, onFileSelect, completedItems, onToggleComplete, depth }: { item: StructureItem, displayIndex: number, onFileSelect: (id: string) => void, completedItems: Set<string>, onToggleComplete: (id: string) => void, depth: number }) {
   const [isOpen, setIsOpen] = useState(false);
   const isCompleted = completedItems.has(item.id);

   // Folder
   if (item.item_type === "folder") {
      return (
        <div className="mt-4 first:mt-0">
           <div 
             className="flex items-center justify-between cursor-pointer py-2 px-2 hover:bg-black/5 rounded-lg transition-colors"
             onClick={() => setIsOpen(!isOpen)}
           >
              <div className="flex items-center gap-2">
                 <span className="text-lg font-semibold text-gray-800">
                    ⚖️ {item.title}
                 </span>
                 <Badge variant="secondary" className="text-xs">{item.children?.length || 0} cases</Badge>
              </div>
              {isOpen ? <ChevronDown className="h-4 w-4 text-gray-500"/> : <ChevronRight className="h-4 w-4 text-gray-500"/>}
           </div>
           
           {isOpen && item.children && (
              <div className="ml-2 mt-2 space-y-3 pl-4 border-l-2 border-gray-200">
                 {item.children.map((child, idx) => (
                    <ChildItem key={child.id} item={child} displayIndex={idx + 1} onFileSelect={onFileSelect} completedItems={completedItems} onToggleComplete={onToggleComplete} depth={depth + 1} />
                 ))}
              </div>
           )}
        </div>
      );
   }

   // File
   return (
     <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center justify-between group">
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
           <div className="font-medium text-gray-900 truncate text-lg">
              {item.title}
           </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-4">
           <Button 
             variant="outline" 
             size="sm" 
             className="rounded-full px-5 border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 bg-purple-50/50 font-semibold"
             onClick={() => onFileSelect(item.id)}
           >
              <FileText className="w-4 h-4 mr-2" />
              Notes
           </Button>

           <Button
             size="icon"
             className="w-10 h-10 rounded-full bg-linear-to-br from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 shadow-md text-white font-bold"
             onClick={() => console.log("Quiz clicked")}
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

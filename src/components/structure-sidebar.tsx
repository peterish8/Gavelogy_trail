"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, FileText, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { customToHtml } from "@/lib/content-converter";
import { DataLoader } from "@/lib/data-loader";

interface StructureItem {
  id: string;
  title: string;
  item_type: "folder" | "file";
  children?: StructureItem[];
}

interface StructureViewerProps {
  items: StructureItem[];
  onFileSelect: (itemId: string) => void;
  selectedItemId?: string;
  level?: number;
}

export function StructureSidebar({ items, onFileSelect, selectedItemId, level = 0 }: StructureViewerProps) {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <StructureItem key={item.id} item={item} onFileSelect={onFileSelect} selectedItemId={selectedItemId} level={level} />
      ))}
    </div>
  );
}

function StructureItem({ item, onFileSelect, selectedItemId, level }: { item: StructureItem; onFileSelect: (id: string) => void; selectedItemId?: string; level: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isSelected = item.id === selectedItemId;

  if (item.item_type === "folder") {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center w-full px-2 py-1.5 text-sm font-medium rounded-md transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
            isOpen && "bg-slate-50 dark:bg-slate-900"
          )}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4 mr-1 text-slate-500" />
          ) : (
            <ChevronRight className="h-4 w-4 mr-1 text-slate-500" />
          )}
          <Folder className="h-4 w-4 mr-2 text-blue-500" />
          <span className="truncate">{item.title}</span>
        </button>
        {isOpen && hasChildren && (
          <div className="mt-1">
            <StructureSidebar items={item.children!} onFileSelect={onFileSelect} selectedItemId={selectedItemId} level={level + 1} />
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => onFileSelect(item.id)}
      className={cn(
        "flex items-center w-full px-2 py-1.5 text-sm rounded-md transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
        isSelected ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium" : "text-slate-600 dark:text-slate-400"
      )}
        style={{ paddingLeft: `${level * 12 + 24}px` }}
    >
      <FileText className="h-3.5 w-3.5 mr-2" />
      <span className="truncate">{item.title}</span>
    </button>
  );
}

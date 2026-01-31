"use client";

import React, { useMemo } from "react";
import { parseNoteContent } from "@/lib/note-parser";
import { cn } from "@/lib/utils";

interface NoteRendererProps {
  content: string;
  className?: string;
  fontSize?: "xs" | "sm" | "base" | "lg" | "xl";
}

export function NoteRenderer({ content, className, fontSize = "base" }: NoteRendererProps) {
  const htmlContent = useMemo(() => {
    return parseNoteContent(content);
  }, [content]);

  return (
    <div
      className={cn(
        "prose prose-slate max-w-none dark:prose-invert",
        "leading-relaxed transition-all duration-300",
        {
            "text-xs": fontSize === "xs",
            "text-sm": fontSize === "sm",
            "text-base": fontSize === "base",
            "text-lg": fontSize === "lg",
            "text-xl": fontSize === "xl",
        },
        className
      )}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export type SearchResultType = "course" | "note" | "quiz" | "folder";

export interface SearchAction {
  label: string;
  actionType: "OPEN_PRIMARY" | "OPEN_SECONDARY" | "OPEN_QUIZ";
}

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  courseId: string;
  itemId?: string;
  actions: SearchAction[];
}

interface IndexedItem {
  id: string;
  type: SearchResultType;
  title: string;
  courseId: string;
  courseName: string;
  parentId?: string;
  hasQuiz?: boolean;
}

export function useSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const content = useQuery(api.content.getSearchableContent, {});

  const index = useMemo((): IndexedItem[] => {
    if (!content) return [];

    const { courses, items, quizzes } = content;
    const courseMap = new Map(courses.map((c) => [c._id, c.name]));
    const itemsWithQuizzes = new Set(quizzes.map((q) => q.noteItemId).filter(Boolean));

    const result: IndexedItem[] = [];

    courses.forEach((c) => {
      result.push({ id: c._id, type: "course", title: c.name, courseId: c._id, courseName: c.name });
    });

    items.forEach((item) => {
      if (!item.courseId) return;
      const isNote = ["note", "lesson", "file"].includes(item.item_type ?? "");
      const isFolder = ["folder", "module"].includes(item.item_type ?? "");
      if (isNote || isFolder) {
        result.push({
          id: item._id,
          type: isFolder ? "folder" : "note",
          title: item.title,
          courseId: item.courseId,
          courseName: courseMap.get(item.courseId) ?? "Course",
          parentId: item.parentId,
          hasQuiz: itemsWithQuizzes.has(item._id as never),
        });
      }
    });

    quizzes.forEach((q) => {
      const parentNote = items.find((i) => i._id === q.noteItemId);
      if (parentNote && parentNote.courseId) {
        result.push({
          id: q.noteItemId as string,
          type: "quiz",
          title: q.title ?? `Quiz for ${parentNote.title}`,
          courseId: parentNote.courseId,
          courseName: courseMap.get(parentNote.courseId) ?? "Course",
          parentId: parentNote.parentId,
        });
      }
    });

    return result;
  }, [content]);

  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();

    const matches = index.filter(
      (item) => item.title.toLowerCase().includes(q) || item.courseName.toLowerCase().includes(q)
    );

    return matches
      .sort((a, b) => {
        const at = a.title.toLowerCase(), bt = b.title.toLowerCase();
        if (at === q && bt !== q) return -1;
        if (bt === q && at !== q) return 1;
        if (at.startsWith(q) && !bt.startsWith(q)) return -1;
        if (bt.startsWith(q) && !at.startsWith(q)) return 1;
        return at.localeCompare(bt);
      })
      .slice(0, 10)
      .map((item): SearchResult => {
        const actions: SearchAction[] = [];
        if (item.type === "course") {
          actions.push({ label: "Open Now", actionType: "OPEN_PRIMARY" });
          actions.push({ label: "View Courses", actionType: "OPEN_SECONDARY" });
        } else if (item.type === "note") {
          actions.push({ label: "Open Note", actionType: "OPEN_PRIMARY" });
          if (item.hasQuiz) actions.push({ label: "Take Quiz", actionType: "OPEN_QUIZ" });
        } else if (item.type === "quiz") {
          actions.push({ label: "Start Quiz", actionType: "OPEN_PRIMARY" });
          actions.push({ label: "Open Course", actionType: "OPEN_SECONDARY" });
        } else if (item.type === "folder") {
          actions.push({ label: "Open Folder", actionType: "OPEN_PRIMARY" });
          actions.push({ label: "Open Course", actionType: "OPEN_SECONDARY" });
        }
        return {
          id: item.id,
          type: item.type,
          title: item.title,
          subtitle: item.type !== "course" ? item.courseName : undefined,
          courseId: item.courseId,
          itemId: item.type !== "course" ? item.id : undefined,
          actions,
        };
      });
  }, [query, index]);

  const executeAction = useCallback(
    (result: SearchResult, actionType: "OPEN_PRIMARY" | "OPEN_SECONDARY" | "OPEN_QUIZ") => {
      const { type, courseId, itemId } = result;
      if (type === "course") {
        router.push(actionType === "OPEN_PRIMARY" ? `/course-viewer?courseId=${courseId}` : `/courses`);
      } else if (type === "note") {
        if (actionType === "OPEN_PRIMARY") router.push(`/course-viewer?courseId=${courseId}&noteId=${itemId}&focus=true`);
        else if (actionType === "OPEN_QUIZ") router.push(`/course-viewer?courseId=${courseId}&quizId=${itemId}&focus=true`);
        else router.push(`/course-viewer?courseId=${courseId}`);
      } else if (type === "quiz") {
        router.push(actionType === "OPEN_PRIMARY" ? `/course-viewer?courseId=${courseId}&quizId=${itemId}&focus=true` : `/course-viewer?courseId=${courseId}`);
      } else if (type === "folder") {
        router.push(actionType === "OPEN_PRIMARY" ? `/course-viewer?courseId=${courseId}&itemId=${itemId}&focus=true` : `/course-viewer?courseId=${courseId}`);
      }
    },
    [router]
  );

  return {
    query,
    setQuery,
    results,
    isIndexLoading: content === undefined,
    isEmpty: content !== undefined && index.length === 0,
    executeAction,
    reloadIndex: () => {},
  };
}

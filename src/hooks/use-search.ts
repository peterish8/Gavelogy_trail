"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/stores/auth";

// ============================
// 📦 Types
// ============================

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
  _lastAccessed?: number; // For recency bias
}

interface IndexedItem {
  id: string;
  type: SearchResultType;
  title: string;
  courseId: string;
  courseName: string;
  parentId?: string;
  lastAccessed?: number;
  hasQuiz?: boolean;
}

// ============================
// 🧠 Hook: useSearch
// ============================

export function useSearch() {
  const router = useRouter();
  const { profile } = useAuthStore();

  const [index, setIndex] = useState<IndexedItem[]>([]);
  const [isIndexLoading, setIsIndexLoading] = useState(false);
  const [query, setQuery] = useState("");

  // ---------------------------
  // 📥 Load Index (on mount/login)
  // ---------------------------
  const loadIndex = useCallback(async () => {
    if (!profile?.id) {
      setIndex([]);
      return;
    }

    setIsIndexLoading(true);

    try {
      // 1. Get user's active courses
      const { data: userCourses, error: ucError } = await supabase
        .from("user_courses")
        .select("course_id")
        .eq("user_id", profile.id)


      if (ucError || !userCourses || userCourses.length === 0) {
        setIndex([]);
        setIsIndexLoading(false);
        return;
      }

      const purchasedIds = userCourses.map((uc) => uc.course_id);

      // 2. Get course metadata (only active courses)
      const { data: courses } = await supabase
        .from("courses")
        .select("id, name")
        .in("id", purchasedIds)
        .in("id", purchasedIds);

      const courseMap = new Map<string, string>();
      courses?.forEach((c) => courseMap.set(c.id, c.name));

      // 3. Get structure items (notes, modules, folders)
      const { data: items } = await supabase
        .from("structure_items")
        .select("id, title, course_id, item_type, parent_id")
        .in("course_id", purchasedIds)
        .in("course_id", purchasedIds);

      // 4. Get attached quizzes
      const { data: quizzes } = await supabase
        .from("attached_quizzes")
        .select("id, title, note_item_id");

      // 5. Build index
      const newIndex: IndexedItem[] = [];

      // Add Courses
      courses?.forEach((c) => {
        newIndex.push({
          id: c.id,
          type: "course",
          title: c.name,
          courseId: c.id,
          courseName: c.name,
        });
      });

      // Map of items with quizzes for quick lookup
      const itemsWithQuizzes = new Set(quizzes?.map(q => q.note_item_id).filter(Boolean));

      // Add Notes & Folders
      items?.forEach((item) => {
        const isNote = item.item_type === "note" || item.item_type === "lesson" || item.item_type === "file";
        const isFolder = item.item_type === "folder" || item.item_type === "module";
        
        if (isNote || isFolder) {
          newIndex.push({
            id: item.id,
            type: isFolder ? "folder" : "note",
            title: item.title,
            courseId: item.course_id,
            courseName: courseMap.get(item.course_id) || "Course",
            parentId: item.parent_id,
            hasQuiz: itemsWithQuizzes.has(item.id)
          });
        }
      });

      // Add Quizzes - IMPORTANT: Use note_item_id as the ID so deep nav works
      quizzes?.forEach((q) => {
        // Find parent note to get course context
        const parentNote = items?.find((i) => i.id === q.note_item_id);
        if (parentNote && purchasedIds.includes(parentNote.course_id)) {
          newIndex.push({
            // Use the NOTE ITEM ID (structure item) so we can find it in the tree
            id: q.note_item_id, // <-- This is the key fix!
            type: "quiz",
            title: q.title || `Quiz for ${parentNote.title}`,
            courseId: parentNote.course_id,
            courseName: courseMap.get(parentNote.course_id) || "Course",
            parentId: parentNote.parent_id,
          });
        }
      });

      setIndex(newIndex);
    } catch (e) {
      console.error("Failed to load search index:", e);
      setIndex([]);
    }

    setIsIndexLoading(false);
  }, [profile?.id]);

  // Load index on mount / profile change
  useEffect(() => {
    loadIndex();
  }, [loadIndex]);

  // ---------------------------
  // 🔍 Search Logic (Client-Side)
  // ---------------------------
  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];

    const q = query.toLowerCase().trim();

    // Filter matches
    const matches = index.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.courseName.toLowerCase().includes(q)
    );

    // Rank matches
    const ranked = matches.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();

      // 1. Exact match
      if (aTitle === q && bTitle !== q) return -1;
      if (bTitle === q && aTitle !== q) return 1;

      // 2. Starts-with
      if (aTitle.startsWith(q) && !bTitle.startsWith(q)) return -1;
      if (bTitle.startsWith(q) && !aTitle.startsWith(q)) return 1;

      // 3. Recency bias (if available)
      if (a.lastAccessed && b.lastAccessed) {
        return b.lastAccessed - a.lastAccessed;
      }

      // 4. Contains (alphabetical fallback)
      return aTitle.localeCompare(bTitle);
    });

    // Map to SearchResult with explicit actions
    return ranked.slice(0, 10).map((item): SearchResult => {
      const actions: SearchAction[] = [];

      if (item.type === "course") {
        actions.push({ label: "Open Now", actionType: "OPEN_PRIMARY" });
        actions.push({ label: "View Courses", actionType: "OPEN_SECONDARY" });
      } else if (item.type === "note") {
        actions.push({ label: "Open Note", actionType: "OPEN_PRIMARY" });
        if (item.hasQuiz) {
           actions.push({ label: "Take Quiz", actionType: "OPEN_QUIZ" });
        }
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

  // ---------------------------
  // 🧭 Execute Action (Router-Only, NO DOM)
  // ---------------------------
  const executeAction = useCallback(
    (result: SearchResult, actionType: "OPEN_PRIMARY" | "OPEN_SECONDARY" | "OPEN_QUIZ") => {
      const { type, courseId, itemId } = result;

      if (type === "course") {
        if (actionType === "OPEN_PRIMARY") {
          // Open course viewer directly
          router.push(`/course-viewer?courseId=${courseId}`);
        } else {
          // Go to courses list, maybe scroll later
          router.push(`/courses`);
        }
      } else if (type === "note") {
        if (actionType === "OPEN_PRIMARY") {
          // Deep link with focus param
          router.push(`/course-viewer?courseId=${courseId}&noteId=${itemId}&focus=true`);
        } else if (actionType === "OPEN_QUIZ") {
            router.push(`/course-viewer?courseId=${courseId}&quizId=${itemId}&focus=true`);
        } else {
          router.push(`/course-viewer?courseId=${courseId}`);
        }
      } else if (type === "quiz") {
        if (actionType === "OPEN_PRIMARY") {
          // Deep link to quiz
          router.push(`/course-viewer?courseId=${courseId}&quizId=${itemId}&focus=true`);
        } else {
          router.push(`/course-viewer?courseId=${courseId}`);
        }
      } else if (type === "folder") {
          if (actionType === "OPEN_PRIMARY") {
             // Deep link to folder (assuming generic item link works)
             router.push(`/course-viewer?courseId=${courseId}&itemId=${itemId}&focus=true`);
          } else {
             router.push(`/course-viewer?courseId=${courseId}`);
          }
      }
    },
    [router]
  );

  return {
    query,
    setQuery,
    results,
    isIndexLoading,
    executeAction,
    reloadIndex: loadIndex,
  };
}

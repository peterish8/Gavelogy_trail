"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { extractKeyCases } from "@/lib/extract-key-cases";
import { cn } from "@/lib/utils";
import { ExternalLink, BookOpen, Clock } from "lucide-react";
import { useMemo } from "react";

interface Props {
  itemId: string;
  contentHtml: string | null;
  isSheetDark?: boolean;
}

export function CourseViewerRightPanel({ itemId, contentHtml, isSheetDark }: Props) {
  const router = useRouter();

  const accuracy = useQuery(api.quiz.getItemAccuracy, {
    noteItemId: itemId as Id<"structure_items">,
  });

  const dueSchedules = useQuery(api.spacedRepetition.getDueSchedules, {});

  const keyCases = useMemo(
    () => extractKeyCases(contentHtml ?? ""),
    [contentHtml]
  );

  const dueCount = dueSchedules?.length ?? 0;

  const cardCls = cn(
    "rounded-xl border p-4",
    isSheetDark
      ? "bg-zinc-800/60 border-zinc-700"
      : "bg-white border-gray-200 shadow-sm"
  );

  const labelCls = cn(
    "text-[10px] font-semibold tracking-widest uppercase",
    isSheetDark ? "text-zinc-400" : "text-gray-400"
  );

  const headingCls = cn(
    "text-sm font-semibold",
    isSheetDark ? "text-zinc-100" : "text-gray-800"
  );

  const mutedCls = cn(
    "text-xs",
    isSheetDark ? "text-zinc-400" : "text-gray-500"
  );

  return (
    <div className="w-[268px] shrink-0 h-full overflow-y-auto custom-scrollbar px-3 py-4 flex flex-col gap-4">

      {/* YOUR PROGRESS */}
      <div className={cardCls}>
        <p className={labelCls}>Your Progress</p>

        {accuracy === undefined ? (
          <div className="mt-3 space-y-2 animate-pulse">
            <div className={cn("h-8 w-20 rounded", isSheetDark ? "bg-zinc-700" : "bg-gray-100")} />
            <div className={cn("h-2 rounded-full", isSheetDark ? "bg-zinc-700" : "bg-gray-100")} />
          </div>
        ) : accuracy === null ? (
          <p className={cn(mutedCls, "mt-2")}>No quiz attached to this chapter yet.</p>
        ) : (
          <>
            <p className={cn("mt-2 text-3xl font-bold tabular-nums", isSheetDark ? "text-white" : "text-gray-900")}>
              {accuracy.accuracy}%
            </p>
            {/* Progress bar */}
            <div className={cn("mt-2 h-1.5 rounded-full overflow-hidden", isSheetDark ? "bg-zinc-700" : "bg-gray-100")}>
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-700"
                style={{ width: `${accuracy.accuracy}%` }}
              />
            </div>
            <p className={cn(mutedCls, "mt-1.5")}>
              {accuracy.correct} of {accuracy.total} Q correct
            </p>
            {accuracy.attemptCount > 0 && (
              <p className={cn(mutedCls, "mt-0.5")}>
                {accuracy.attemptCount} attempt{accuracy.attemptCount !== 1 ? "s" : ""}
              </p>
            )}
          </>
        )}
      </div>

      {/* DUE FOR REVIEW */}
      <div className={cardCls}>
        <p className={labelCls}>Due for Review</p>

        {dueSchedules === undefined ? (
          <div className={cn("mt-3 h-8 w-16 rounded animate-pulse", isSheetDark ? "bg-zinc-700" : "bg-gray-100")} />
        ) : dueCount === 0 ? (
          <p className={cn(mutedCls, "mt-2")}>All caught up! Nothing due right now.</p>
        ) : (
          <>
            <p className={cn("mt-2 text-3xl font-bold tabular-nums", isSheetDark ? "text-white" : "text-gray-900")}>
              {dueCount} card{dueCount !== 1 ? "s" : ""}
            </p>
            <p className={cn(mutedCls, "mt-0.5")}>via spaced repetition</p>
            <button
              onClick={() => router.push("/quiz")}
              className={cn(
                "mt-3 w-full text-xs font-semibold py-2 rounded-lg border transition-colors",
                isSheetDark
                  ? "border-zinc-600 text-zinc-200 hover:bg-zinc-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              )}
            >
              Review now
            </button>
          </>
        )}
      </div>

      {/* KEY CASES */}
      {keyCases.length > 0 && (
        <div className={cardCls}>
          <p className={labelCls}>Key Cases in this Chapter</p>
          <ul className="mt-2 space-y-1.5">
            {keyCases.map((c) => (
              <li key={c.name}>
                <span
                  className={cn(
                    "flex items-center justify-between gap-2 text-xs py-1.5 px-2 rounded-lg group cursor-default",
                    isSheetDark
                      ? "text-zinc-300 hover:bg-zinc-700"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                  title={c.name}
                >
                  <span className="truncate">{c.shortName}</span>
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Spacer so content doesn't hug the bottom */}
      <div className="flex-1" />
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchUserCoursesWithFolders, fetchSpeedCourtQuestions } from '@/lib/game/speed-court-data';
import { useAuthStore } from '@/lib/stores/auth';
import { gameAudio } from '@/lib/game/audio';
import { cn } from '@/lib/utils';
import { 
  Zap, Check, ChevronRight, FolderOpen, 
  BookOpen, Search, Loader2, AlertCircle, Flame, Target
} from 'lucide-react';

interface CourseWithFolders {
  courseId: string;
  courseName: string;
  folders: { id: string; title: string; parentId: string | null; questionCount: number }[];
}

interface SpeedCourtConfigProps {
  onStart: (questions: unknown[]) => void;
}

const MIN_QUESTIONS = 30;

export function SpeedCourtConfig({ onStart }: SpeedCourtConfigProps) {
  const { profile } = useAuthStore();
  const userId = profile?.id;

  const [courses, setCourses] = useState<CourseWithFolders[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Load courses on mount (stable dep array)
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      const data = await fetchUserCoursesWithFolders(userId);
      setCourses(data);
      setLoading(false);
      if (data.length > 0) {
        setExpandedCourses(new Set([data[0].courseId]));
      }
    };
    load();
  }, [userId]);

  // Total questions from selected folders
  const totalQuestions = useMemo(() => {
    let count = 0;
    courses.forEach(course => {
      course.folders.forEach(folder => {
        if (selectedFolders.has(folder.id)) count += folder.questionCount;
      });
    });
    return count;
  }, [selectedFolders, courses]);

  const canStart = totalQuestions >= MIN_QUESTIONS;
  const progressPercent = Math.min(100, (totalQuestions / MIN_QUESTIONS) * 100);

  // Toggle folder
  const toggleFolder = (folderId: string) => {
    gameAudio?.playClick();
    setSelectedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  // Select all in course
  const toggleCourse = (course: CourseWithFolders) => {
    gameAudio?.playClick();
    const ids = course.folders.filter(f => f.questionCount > 0).map(f => f.id);
    const allSelected = ids.every(id => selectedFolders.has(id));
    setSelectedFolders(prev => {
      const next = new Set(prev);
      if (allSelected) ids.forEach(id => next.delete(id));
      else ids.forEach(id => next.add(id));
      return next;
    });
  };

  const toggleExpand = (courseId: string) => {
    setExpandedCourses(prev => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  };

  const handleStart = async () => {
    if (!canStart || starting) return;
    setStarting(true);
    gameAudio?.playSelect();
    const questions = await fetchSpeedCourtQuestions(Array.from(selectedFolders));
    if (questions.length < MIN_QUESTIONS) { setStarting(false); return; }
    onStart(questions);
  };

  const filterFolders = (folders: CourseWithFolders['folders']) => {
    if (!searchQuery.trim()) return folders;
    return folders.filter(f => f.title.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  // ───── Loading ─────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div className="flex flex-col items-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Animated loading ring */}
          <div className="relative w-16 h-16">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-yellow-500/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-1 rounded-full border-2 border-t-yellow-500 border-r-transparent border-b-transparent border-l-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="h-5 w-5 text-yellow-500" />
            </div>
          </div>
          <span className="text-sm text-muted-foreground font-medium">Loading your arsenal...</span>
        </motion.div>
      </div>
    );
  }

  // ───── No Courses ─────
  if (courses.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          className="text-center space-y-4 px-6 py-10 rounded-3xl border border-white/10 bg-white/1 max-w-sm"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
            <BookOpen className="h-8 w-8 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold">No courses yet</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Purchase a course to unlock Speed Court questions and start training!
          </p>
        </motion.div>
      </div>
    );
  }

  // ───── Main Config ─────
  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 pb-10">
      {/* ═══ Hero Header ═══ */}
      <motion.div
        className="text-center pt-2"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Mode badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(234,179,8,0.12) 0%, rgba(251,191,36,0.06) 100%)',
            border: '1px solid rgba(234,179,8,0.2)',
            boxShadow: '0 0 20px rgba(234,179,8,0.08)',
          }}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-black text-yellow-500 uppercase tracking-wider">Speed Court</span>
        </motion.div>

        <h2 className="text-2xl font-black text-foreground tracking-tight">
          Choose Your Battlefield
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">
          Select topics to create your custom question pool
        </p>
      </motion.div>

      {/* ═══ Stats Strip ═══ */}
      <motion.div
        className="grid grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="text-center py-3 rounded-2xl border border-white/8 bg-white/2">
          <Target className="h-4 w-4 text-indigo-400 mx-auto mb-1" />
          <span className="text-lg font-black text-foreground tabular-nums">{courses.length}</span>
          <span className="text-[10px] text-muted-foreground block">Courses</span>
        </div>
        <div className="text-center py-3 rounded-2xl border border-white/8 bg-white/2">
          <FolderOpen className="h-4 w-4 text-amber-400 mx-auto mb-1" />
          <span className="text-lg font-black text-foreground tabular-nums">
            {courses.reduce((s, c) => s + c.folders.filter(f => f.questionCount > 0).length, 0)}
          </span>
          <span className="text-[10px] text-muted-foreground block">Folders</span>
        </div>
        <div className="text-center py-3 rounded-2xl border border-white/8 bg-white/2">
          <Flame className="h-4 w-4 text-red-400 mx-auto mb-1" />
          <span className="text-lg font-black text-foreground tabular-nums">
            {courses.reduce((s, c) => s + c.folders.reduce((a, f) => a + f.questionCount, 0), 0)}
          </span>
          <span className="text-[10px] text-muted-foreground block">Total Qs</span>
        </div>
      </motion.div>

      {/* ═══ Search ═══ */}
      <motion.div
        className="relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search folders..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/3 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-yellow-500/30 focus:bg-white/5 transition-all"
        />
      </motion.div>

      {/* ═══ Course Cards ═══ */}
      <div className="space-y-3">
        {courses.map((course, ci) => {
          const isExpanded = expandedCourses.has(course.courseId);
          const filteredFolders = filterFolders(course.folders);
          const foldersWithQuestions = course.folders.filter(f => f.questionCount > 0);
          const selectedInCourse = foldersWithQuestions.filter(f => selectedFolders.has(f.id)).length;
          const allSelected = foldersWithQuestions.length > 0 && selectedInCourse === foldersWithQuestions.length;
          const courseQuestionCount = foldersWithQuestions.reduce((s, f) => s + f.questionCount, 0);
          const someSelected = selectedInCourse > 0;

          return (
            <motion.div
              key={course.courseId}
              className={cn(
                "rounded-2xl border overflow-hidden transition-all duration-300",
                someSelected
                  ? "border-yellow-500/30 bg-[#1c1810]"
                  : "border-white/10 bg-[#15151d]"
              )}
              style={someSelected ? {
                boxShadow: '0 0 25px rgba(234,179,8,0.06)',
              } : undefined}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + ci * 0.08 }}
            >
              {/* Course Header */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/3 transition-colors"
                onClick={() => toggleExpand(course.courseId)}
              >
                {/* Icon */}
                <div className={cn(
                  "p-2.5 rounded-xl border transition-all",
                  someSelected
                    ? "bg-yellow-500/10 border-yellow-500/25"
                    : "bg-indigo-500/8 border-indigo-500/15"
                )}>
                  <BookOpen className={cn(
                    "h-5 w-5",
                    someSelected ? "text-yellow-500" : "text-indigo-400"
                  )} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground truncate">{course.courseName}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {courseQuestionCount} questions
                    </span>
                    <span className="text-[10px] text-muted-foreground/40">•</span>
                    <span className="text-[10px] text-muted-foreground">
                      {foldersWithQuestions.length} folders
                    </span>
                  </div>
                </div>

                {/* Select All pill */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleCourse(course); }}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                    allSelected
                      ? "bg-green-500/12 border-green-500/25 text-green-400"
                      : "bg-white/4 border-white/10 text-muted-foreground hover:bg-white/8 hover:text-foreground"
                  )}
                >
                  {allSelected ? '✓ All' : 'Select All'}
                </button>

                {/* Counter badge */}
                {selectedInCourse > 0 && (
                  <motion.span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums"
                    style={{
                      background: 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(251,191,36,0.08))',
                      color: '#eab308',
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                  >
                    {selectedInCourse}/{foldersWithQuestions.length}
                  </motion.span>
                )}

                {/* Chevron */}
                <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                </motion.div>
              </div>

              {/* ─── Folders ─── */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/5 px-3 pb-3 pt-2 space-y-1 max-h-[280px] overflow-y-auto scrollbar-thin">
                      {filteredFolders.map((folder, fi) => {
                        const isSelected = selectedFolders.has(folder.id);
                        const hasQuestions = folder.questionCount > 0;

                        return (
                          <motion.button
                            key={folder.id}
                            onClick={() => hasQuestions && toggleFolder(folder.id)}
                            disabled={!hasQuestions}
                            className={cn(
                              "flex items-center gap-2.5 w-full p-3 rounded-xl text-left transition-all group",
                              hasQuestions && isSelected && "bg-[#251f10] border border-yellow-500/20",
                              hasQuestions && !isSelected && "bg-black/20 hover:bg-black/40 border border-transparent",
                              !hasQuestions && "opacity-25 cursor-not-allowed border border-transparent"
                            )}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: hasQuestions ? 1 : 0.25, x: 0 }}
                            transition={{ delay: fi * 0.02 }}
                            whileTap={hasQuestions ? { scale: 0.98 } : undefined}
                          >
                            {/* Checkbox */}
                            <div className={cn(
                              "w-5 h-5 rounded-lg flex items-center justify-center border-2 transition-all shrink-0",
                              isSelected
                                ? "bg-yellow-500 border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.3)]"
                                : "border-white/15 group-hover:border-white/25"
                            )}>
                              {isSelected && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
                                  <Check className="h-3 w-3 text-black" />
                                </motion.div>
                              )}
                            </div>

                            {/* Folder icon */}
                            <FolderOpen className={cn(
                              "h-3.5 w-3.5 shrink-0 transition-colors",
                              isSelected ? "text-yellow-500/70" : "text-muted-foreground/50"
                            )} />

                            {/* Name */}
                            <span className={cn(
                              "text-xs font-medium truncate flex-1 transition-colors",
                              isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                            )}>
                              {folder.title}
                            </span>

                            {/* Question count pill */}
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-lg tabular-nums shrink-0 font-medium transition-all",
                              isSelected
                                ? "bg-yellow-500/15 text-yellow-500"
                                : hasQuestions ? "bg-white/5 text-muted-foreground/70" : "text-muted-foreground/30"
                            )}>
                              {folder.questionCount}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* ═══ STICKY BOTTOM BAR — The Command Center ═══ */}
      {/* ═══════════════════════════════════════════ */}
      <motion.div
        className="w-full mt-8"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, type: 'spring', damping: 20 }}
      >
            {/* Question meter */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-baseline gap-2">
                <motion.span
                  className={cn(
                    "text-3xl font-black tabular-nums transition-colors",
                    canStart ? "text-green-400" : totalQuestions > 0 ? "text-yellow-500" : "text-muted-foreground/40"
                  )}
                  key={totalQuestions}
                  initial={{ scale: 1.3, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  {totalQuestions}
                </motion.span>
                <span className="text-xs text-muted-foreground">/ {MIN_QUESTIONS} min</span>
              </div>

              {!canStart && totalQuestions > 0 && (
                <motion.div
                  className="flex items-center gap-1.5 text-amber-400 bg-amber-400/8 px-3 py-1 rounded-full"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-bold">Need {MIN_QUESTIONS - totalQuestions} more</span>
                </motion.div>
              )}

              {canStart && (
                <motion.div
                  className="flex items-center gap-1.5 text-green-400 bg-green-400/8 px-3 py-1 rounded-full"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Check className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-bold">Ready to go!</span>
                </motion.div>
              )}
            </div>

            {/* Progress bar (with glow when full) */}
            <div className={cn(
              "w-full h-2 rounded-full mb-5 overflow-hidden transition-all",
              canStart ? "bg-green-500/15" : "bg-white/8"
            )}>
              <motion.div
                className="h-full rounded-full relative"
                style={{
                  background: canStart
                    ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                    : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                  boxShadow: canStart ? '0 0 12px rgba(34,197,94,0.4)' : undefined,
                }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ type: 'spring', damping: 20 }}
              />
            </div>

            {/* ═══ THE BIG BUTTON ═══ */}
            <button
              onClick={handleStart}
              disabled={!canStart || starting}
              className={cn(
                "relative w-full overflow-hidden rounded-2xl font-black text-xl uppercase tracking-[0.12em]",
                "transition-all duration-100 select-none outline-none",
                canStart && !starting
                  ? "text-white active:translate-y-[4px] active:shadow-none"
                  : "bg-white/5 text-muted-foreground/40 cursor-not-allowed"
              )}
              style={canStart ? {
                height: 64,
                background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                boxShadow: starting
                  ? '0 2px 0 0 #92400e'
                  : '0 5px 0 0 #92400e, 0 8px 25px rgba(217, 119, 6, 0.25)',
                transform: starting ? 'translateY(3px)' : undefined,
              } : { height: 64 }}
            >
              {/* Top edge highlight */}
              {canStart && (
                <div className="absolute top-0 left-0 right-0 h-px bg-white/25 rounded-t-2xl" />
              )}

              {/* Content */}
              <div className="relative flex items-center justify-center gap-3 z-10">
                {starting ? (
                  <motion.div className="flex items-center gap-3" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-lg">Loading...</span>
                  </motion.div>
                ) : (
                  <>
                    <Zap className="h-6 w-6 drop-shadow-sm" />
                    <span className="drop-shadow-sm">
                      {canStart ? 'Start Speed Court' : `Select ${MIN_QUESTIONS}+ Questions`}
                    </span>
                  </>
                )}
              </div>

              {/* Shine sweep */}
              {canStart && !starting && (
                <motion.div
                  className="absolute inset-0 -skew-x-12 pointer-events-none"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    width: '30%',
                  }}
                  animate={{ x: ['-120%', '450%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
                />
              )}
            </button>
      </motion.div>
    </div>
  );
}

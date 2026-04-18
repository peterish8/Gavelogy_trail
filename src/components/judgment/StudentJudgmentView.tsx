'use client'

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import { customToHtml } from '@/lib/content-converter'
import { JudgmentPanel } from './JudgmentPanel'
import { BezierConnector } from './BezierConnector'
import type { NotePdfLink } from '@/types'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  HelpCircle,
  Layers,
  ChevronRight,
  CheckCircle,
  XCircle,
  RotateCcw,
  ChevronLeft,
} from 'lucide-react'

// ── Link meta helpers (mirrors admin judgment-pdf-panel) ─────────────
const DEFAULT_LINK_COLOR = '#c9922a'

function parseLinkMeta(label?: string | null): { text: string; color: string } {
  if (!label) return { text: '', color: DEFAULT_LINK_COLOR }
  try {
    if (label.startsWith('{')) {
      const p = JSON.parse(label)
      return { text: p.text ?? '', color: p.color ?? DEFAULT_LINK_COLOR }
    }
  } catch {}
  return { text: label, color: DEFAULT_LINK_COLOR }
}

// ── Convex quiz types ────────────────────────────────────────────────
export interface ConvexQuizQuestion {
  _id: string
  question_text: string
  options: string[]
  correct_answer: string
  explanation?: string
  order_index?: number
}

export interface ConvexAttachedQuiz {
  _id: string
  title?: string
  questions: ConvexQuizQuestion[]
}

// ── Flashcard type ───────────────────────────────────────────────────
export interface Flashcard {
  front: string
  back: string
}

// ── Props ────────────────────────────────────────────────────────────
interface StudentJudgmentViewProps {
  itemId: string
  /** raw bracket-tag content from note_contents.content_html */
  content: string
  /** all note_pdf_links rows for this item */
  links: NotePdfLink[]
  /** PDF proxy URL — use /api/judgment/pdf-proxy?itemId=X */
  pdfUrl: string | null
  /** optional quizzes with embedded questions */
  quizzes?: ConvexAttachedQuiz[]
  /** optional flashcard deck (JSON from note_contents.flashcards_json) */
  flashcards?: Flashcard[]
  /** item title shown in header */
  title?: string
}

type Tab = 'notes' | 'quiz' | 'flashcards'

// ────────────────────────────────────────────────────────────────────
// Quiz tab — renders Convex-structured quiz data
// ────────────────────────────────────────────────────────────────────
function QuizTab({ quizzes }: { quizzes: ConvexAttachedQuiz[] }) {
  const allQuestions = useMemo(
    () => quizzes.flatMap(q => q.questions).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
    [quizzes]
  )
  const quizTitle = quizzes[0]?.title

  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)

  const current = allQuestions[idx]
  const total = allQuestions.length

  function handleSelect(opt: string) {
    if (showResult) return
    setSelected(opt)
    setShowResult(true)
  }

  function handleNext() {
    setIdx(i => i + 1)
    setSelected(null)
    setShowResult(false)
  }

  function handleRestart() {
    setIdx(0)
    setSelected(null)
    setShowResult(false)
  }

  // Determine if selected answer is correct — support both text match and letter match
  function isCorrect(opt: string): boolean {
    if (!current) return false
    const ca = current.correct_answer
    // Direct text match
    if (opt === ca) return true
    // Letter match: if correct_answer is "A"/"B"/"C"/"D", map to option index
    const letterIdx = ['A', 'B', 'C', 'D'].indexOf(ca.toUpperCase())
    if (letterIdx >= 0 && current.options[letterIdx] === opt) return true
    return false
  }

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
        <HelpCircle className="w-10 h-10 text-muted-foreground/30" />
        <p className="text-sm font-medium text-foreground">Quiz not available yet.</p>
        <p className="text-xs text-muted-foreground">This judgment does not have quiz questions attached right now.</p>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <CheckCircle className="w-12 h-12 text-emerald-500" />
        <p className="text-base font-semibold text-foreground">Quiz Complete!</p>
        <button
          onClick={handleRestart}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Start Over
        </button>
      </div>
    )
  }

  const selectedIsCorrect = selected ? isCorrect(selected) : false

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <div>
            {quizTitle && (
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{quizTitle}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Question <span className="font-bold text-foreground">{idx + 1}</span> / {total}
            </p>
          </div>
          <button onClick={handleRestart} title="Restart" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-border rounded-full mt-2.5">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((idx + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Question */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary/70 to-primary/20" />
          <p className="text-sm font-semibold text-foreground leading-relaxed mt-1">
            {current.question_text}
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-2.5">
          {current.options.map((opt, i) => {
            const letter = ['A', 'B', 'C', 'D'][i] ?? String(i + 1)
            const isSelected = selected === opt
            const correct = isCorrect(opt)

            let styles = 'bg-card border-border hover:border-primary/50 hover:bg-primary/5 text-foreground cursor-pointer'
            if (showResult) {
              if (correct) styles = 'bg-emerald-50 border-emerald-400 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-600 dark:text-emerald-200 cursor-default'
              else if (isSelected && !correct) styles = 'bg-rose-50 border-rose-400 text-rose-900 dark:bg-rose-950/30 dark:border-rose-600 dark:text-rose-200 cursor-default'
              else styles = 'bg-muted/40 border-border text-muted-foreground/50 opacity-60 cursor-default'
            }

            return (
              <button
                key={i}
                onClick={() => handleSelect(opt)}
                disabled={showResult}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150',
                  styles
                )}
              >
                <span className={cn(
                  'w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 border transition-colors',
                  showResult && correct
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : showResult && isSelected && !correct
                    ? 'bg-rose-500 border-rose-500 text-white'
                    : 'bg-muted border-border text-muted-foreground'
                )}>
                  {letter}
                </span>
                <span className="text-sm leading-snug">{opt}</span>
              </button>
            )
          })}
        </div>

        {/* Result */}
        {showResult && (
          <div className={cn(
            'rounded-xl p-4 border animate-in slide-in-from-bottom-2 duration-200',
            selectedIsCorrect
              ? 'bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800'
              : 'bg-rose-50/60 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800'
          )}>
            <div className="flex items-center gap-2 mb-1.5">
              {selectedIsCorrect
                ? <><CheckCircle className="w-4 h-4 text-emerald-600" /><span className="font-bold text-sm text-emerald-800 dark:text-emerald-300">Correct!</span></>
                : <><XCircle className="w-4 h-4 text-rose-600" /><span className="font-bold text-sm text-rose-800 dark:text-rose-300">Incorrect</span></>
              }
            </div>
            {!selectedIsCorrect && (
              <p className="text-xs text-foreground/80 mb-1.5">
                Correct answer: <span className="font-bold">{current.correct_answer}</span>
              </p>
            )}
            {current.explanation && (
              <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-2 mt-2">
                <span className="font-semibold text-foreground mr-1">Explanation:</span>
                {current.explanation}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {showResult && (
        <div className="px-5 py-3.5 border-t border-border shrink-0 flex justify-center">
          {idx < total - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-6 py-2 rounded-full border border-border text-sm hover:bg-muted transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Start Over
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────
// Flashcards tab
// ────────────────────────────────────────────────────────────────────
function FlashcardsTab({ flashcards }: { flashcards: Flashcard[] }) {
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)

  if (flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
        <Layers className="w-10 h-10 text-muted-foreground/30" />
        <p className="text-sm font-medium text-foreground">Flashcards not available yet.</p>
        <p className="text-xs text-muted-foreground">This judgment does not have flashcards attached right now.</p>
      </div>
    )
  }

  const card = flashcards[idx]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 py-3 border-b border-border shrink-0 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Card <span className="font-bold text-foreground">{idx + 1}</span> / {flashcards.length}
        </p>
        <p className="text-[10px] text-muted-foreground">{flipped ? 'Answer' : 'Question'} — click card to flip</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        {/* Card */}
        <button
          onClick={() => setFlipped(f => !f)}
          className={cn(
            'w-full max-w-sm min-h-[180px] rounded-2xl border shadow-md flex items-center justify-center p-6 text-center transition-all duration-300 cursor-pointer',
            flipped
              ? 'bg-primary/5 border-primary/30'
              : 'bg-card border-border hover:border-primary/40 hover:bg-muted/30'
          )}
        >
          <p className={cn(
            'text-base leading-relaxed',
            flipped ? 'font-normal text-foreground' : 'font-semibold text-foreground'
          )}>
            {flipped ? card.back : card.front}
          </p>
        </button>

        {/* Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setIdx(i => Math.max(0, i - 1)); setFlipped(false) }}
            disabled={idx === 0}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex gap-1.5">
            {flashcards.map((_, i) => (
              <button
                key={i}
                onClick={() => { setIdx(i); setFlipped(false) }}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  i === idx ? 'bg-primary w-4' : 'bg-border hover:bg-muted-foreground/40'
                )}
              />
            ))}
          </div>

          <button
            onClick={() => { setIdx(i => Math.min(flashcards.length - 1, i + 1)); setFlipped(false) }}
            disabled={idx === flashcards.length - 1}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────
// Main StudentJudgmentView
// ────────────────────────────────────────────────────────────────────
export function StudentJudgmentView({
  itemId,
  content,
  links,
  pdfUrl,
  quizzes = [],
  flashcards = [],
  title,
}: StudentJudgmentViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('notes')
  const [activeLinkId, setActiveLinkId] = useState<string | null>(null)
  const [fromRect, setFromRect] = useState<DOMRect | null>(null)
  const [toRect, setToRect] = useState<DOMRect | null>(null)
  const [activeColor, setActiveColor] = useState<string>(DEFAULT_LINK_COLOR)
  const [leftPct, setLeftPct] = useState(55)
  const isDragging = useRef(false)
  const notesRef = useRef<HTMLDivElement>(null)
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Convert bracket-tag content to HTML once
  const noteHtml = useMemo(() => customToHtml(content || ''), [content])

  // After HTML renders, update link span colors from link meta
  useEffect(() => {
    const container = notesRef.current
    if (!container || links.length === 0) return
    const spans = container.querySelectorAll<HTMLElement>('[data-link-id]')
    spans.forEach(span => {
      const linkId = span.getAttribute('data-link-id')
      const link = links.find(l => l.link_id === linkId)
      if (link) {
        const { color } = parseLinkMeta(link.label)
        span.style.color = color
        span.style.borderBottomColor = color
      }
    })
  }, [noteHtml, links])

  // Handle clicking a linked-text span in notes → navigate PDF
  useEffect(() => {
    const container = notesRef.current
    if (!container) return

    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      const span = target.closest<HTMLElement>('[data-link-id]')
      if (!span) return
      e.stopPropagation()

      const linkId = span.getAttribute('data-link-id')
      if (!linkId) return

      const link = links.find(l => l.link_id === linkId)
      const { color } = parseLinkMeta(link?.label)

      if (clearTimer.current) clearTimeout(clearTimer.current)
      setActiveLinkId(linkId)
      setFromRect(span.getBoundingClientRect())
      setToRect(null)
      setActiveColor(color)

      clearTimer.current = setTimeout(() => {
        setActiveLinkId(null)
        setFromRect(null)
        setToRect(null)
      }, 4500)
    }

    container.addEventListener('click', handleClick)
    return () => container.removeEventListener('click', handleClick)
  }, [links])

  // Recalculate fromRect on scroll (so bezier tracks the note span)
  useEffect(() => {
    const container = notesRef.current
    if (!container || !activeLinkId) return
    function onScroll() {
      if (!activeLinkId) return
      const span = container?.querySelector<HTMLElement>(`[data-link-id="${activeLinkId}"]`)
      if (span) setFromRect(span.getBoundingClientRect())
    }
    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, [activeLinkId])

  const handleHighlightReady = useCallback((_linkId: string, rect: DOMRect) => {
    setToRect(rect)
  }, [])

  // Draggable divider
  const handleDividerDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    function onMove(ev: MouseEvent) {
      if (!isDragging.current) return
      const pct = (ev.clientX / window.innerWidth) * 100
      setLeftPct(Math.max(30, Math.min(70, pct)))
    }
    function onUp() {
      isDragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'notes', label: 'Notes', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'quiz', label: 'Quiz', icon: <HelpCircle className="w-3.5 h-3.5" /> },
    { id: 'flashcards', label: 'Flashcards', icon: <Layers className="w-3.5 h-3.5" /> },
  ]
  const quizCount = useMemo(
    () => quizzes.reduce((count, quiz) => count + quiz.questions.length, 0),
    [quizzes]
  )
  const tabMeta: Record<Tab, number | null> = {
    notes: content.trim() ? null : 0,
    quiz: quizCount,
    flashcards: flashcards.length,
  }

  return (
    <div
      className="flex h-full w-full overflow-hidden select-none"
      style={{ userSelect: isDragging.current ? 'none' : undefined }}
    >
      {/* ── LEFT PANEL ────────────────────────────────────────── */}
      <div
        className="flex flex-col h-full overflow-hidden border-r border-border bg-background"
        style={{ width: `${leftPct}%` }}
      >
        <div className="px-4 py-3 border-b border-border bg-card/80 shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary/80">
            Judgment Mode
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground truncate">
            {title || itemId}
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-0.5 px-3 pt-2.5 pb-0 shrink-0 border-b border-border bg-card">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {tab.icon}
              {tab.label}
              {tabMeta[tab.id] !== null && (
                <span
                  className={cn(
                    'ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                    activeTab === tab.id
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {tabMeta[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'notes' && (
            <div
              ref={notesRef}
              className="judgment-note-panel h-full overflow-y-auto px-6 py-5"
            >
              {noteHtml ? (
                <div
                  className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-bold prose-p:text-[#334155] dark:prose-p:text-foreground prose-li:text-foreground"
                  dangerouslySetInnerHTML={{ __html: noteHtml }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <BookOpen className="w-10 h-10 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-foreground">Notes not available yet.</p>
                  <p className="text-xs text-muted-foreground">This judgment does not have notes attached right now.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'quiz' && (
            <QuizTab quizzes={quizzes} />
          )}

          {activeTab === 'flashcards' && (
            <FlashcardsTab flashcards={flashcards} />
          )}
        </div>
      </div>

      {/* ── DIVIDER ───────────────────────────────────────────── */}
      <div
        onMouseDown={handleDividerDown}
        className="w-1 h-full bg-border hover:bg-primary/40 cursor-col-resize shrink-0 transition-colors group relative"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-0.5 h-5 bg-primary rounded-full" />
        </div>
      </div>

      {/* ── RIGHT PANEL (PDF) ─────────────────────────────────── */}
      <div className="flex flex-col h-full overflow-hidden flex-1 bg-muted/20">
        {pdfUrl ? (
          <JudgmentPanel
            pdfUrl={pdfUrl}
            linkMappings={links}
            activeLinkId={activeLinkId}
            onHighlightReady={handleHighlightReady}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-6">
            <BookOpen className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No judgment PDF attached to this note.</p>
          </div>
        )}
      </div>

      {/* ── BEZIER CONNECTION LINE ────────────────────────────── */}
      <BezierConnector
        fromRect={fromRect}
        toRect={toRect}
        visible={!!activeLinkId && !!fromRect && !!toRect}
        color={activeColor}
      />
    </div>
  )
}

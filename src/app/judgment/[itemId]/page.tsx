'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import {
  StudentJudgmentView,
  type ConvexAttachedQuiz,
  type Flashcard,
} from '@/components/judgment/StudentJudgmentView'
import type { NotePdfLink } from '@/types'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface PageData {
  title: string
  content: string
  pdfUrl: string | null
  links: NotePdfLink[]
  quizzes: ConvexAttachedQuiz[]
  flashcards: Flashcard[]
}

function parseFlashcards(rawFlashcards: string | null | undefined): Flashcard[] {
  if (!rawFlashcards) return []

  try {
    const parsed = JSON.parse(rawFlashcards)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(
      (card): card is Flashcard =>
        !!card &&
        typeof card === 'object' &&
        typeof card.front === 'string' &&
        typeof card.back === 'string'
    )
  } catch {
    return []
  }
}

export default function JudgmentReaderPage({
  params,
}: {
  params: Promise<{ itemId: string }>
}) {
  const { itemId } = use(params)
  const router = useRouter()
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!itemId) return
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const id = itemId as Id<'structure_items'>
      const judgmentData = await fetchQuery(api.content.getJudgmentReaderData, {
        itemId: id,
      })

      if (!judgmentData) {
        setError('Item not found.')
        setLoading(false)
        return
      }

      setData({
        title: judgmentData.title,
        content: judgmentData.content_html ?? '',
        pdfUrl: judgmentData.pdf_url
          ? `/api/judgment/pdf-proxy?itemId=${itemId}`
          : null,
        links: judgmentData.links.map((link) => ({
          id: link._id,
          item_id: link.itemId,
          link_id: link.link_id,
          pdf_page: link.pdf_page,
          x: link.x,
          y: link.y,
          width: link.width,
          height: link.height,
          label: link.label,
          created_at: new Date(link._creationTime).toISOString(),
        })),
        quizzes: judgmentData.quizzes,
        flashcards: parseFlashcards(judgmentData.flashcards_json),
      })
    } catch (err: unknown) {
      console.error('JudgmentReader load error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load content.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading judgment…</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <p className="text-base font-semibold text-destructive">{error ?? 'Unknown error'}</p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Go back
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="w-px h-4 bg-border" />
        <h1 className="text-sm font-semibold text-foreground truncate">{data.title}</h1>
        {data.links.length > 0 && (
          <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 shrink-0">
            {data.links.length} connections
          </span>
        )}
      </div>

      {/* ── Split reader (fills remaining height) ── */}
      <div className="flex-1 overflow-hidden">
        <StudentJudgmentView
          itemId={itemId}
          content={data.content}
          links={data.links}
          pdfUrl={data.pdfUrl}
          quizzes={data.quizzes}
          flashcards={data.flashcards}
          title={data.title}
        />
      </div>
    </div>
  )
}

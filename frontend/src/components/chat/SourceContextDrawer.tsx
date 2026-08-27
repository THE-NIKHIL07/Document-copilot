import { X } from 'lucide-react'

export interface CitedSource {
  id: string
  chunk_index: number
  chunk_text: string
  ticker?: string
  company_name?: string
  filing_type?: string
  fiscal_year?: number | string
  metadata?: {
    page?: number
    section?: string
    filing_date?: string
    [key: string]: unknown
  }
}

interface SourceContextDrawerProps {
  source: CitedSource | null
  sourceIndex: number | null
  onClose: () => void
}

export function SourceContextDrawer({
  source,
  sourceIndex,
  onClose,
}: SourceContextDrawerProps) {
  if (!source) return null

  const company = source.company_name || 'Company'
  const ticker = source.ticker || 'FILING'
  const filingType = source.filing_type || '10-K'
  const filingDate = source.metadata?.filing_date || (source.fiscal_year ? `FY ${source.fiscal_year}` : 'Recent')
  const chunkIndex = source.chunk_index ?? 0
  const page = source.metadata?.page || 1

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop for mobile & desktop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Sliding Drawer */}
      <aside className="relative z-50 flex h-full w-full flex-col border-l border-border bg-card p-4 sm:p-6 shadow-2xl transition-all sm:w-[450px]">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-3 sm:pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {sourceIndex ?? 1}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold tracking-tight text-foreground">
                {company}
              </h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="rounded bg-muted px-2 py-0.5 font-mono font-medium text-foreground">
                  {ticker}
                </span>
                <span className="rounded bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                  {filingType}
                </span>
                <span className="rounded bg-muted px-2 py-0.5 text-muted-foreground">
                  Filed {filingDate}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Subtitle */}
        <div className="mt-3 sm:mt-4 border-b border-border pb-2.5 sm:pb-3">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Source Context
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Neighboring chunks and extracted tables are shown around the cited passage for continuity.
          </p>
        </div>

        {/* Content Scroll Area */}
        <div className="mt-3 sm:mt-4 flex-1 space-y-3.5 sm:space-y-4 overflow-y-auto pr-1">
          {/* Previous Context Placeholder */}
          {chunkIndex > 0 && (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
              <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-muted-foreground/80">
                <span className="uppercase tracking-wider">Previous Context</span>
                <span className="font-mono">Chunk {chunkIndex - 1}</span>
              </div>
              <p className="line-clamp-2 italic text-muted-foreground/70">
                [Preceding document section content for context continuity]
              </p>
            </div>
          )}

          {/* Cited Passage (Main Highlight) */}
          <div className="rounded-xl border-2 border-primary/40 bg-accent/40 p-3.5 sm:p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-primary">
                Cited Passage
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                Chunk {chunkIndex} • Page {page}
              </span>
            </div>

            <div className="mt-2 whitespace-pre-wrap font-sans text-xs leading-relaxed text-foreground">
              {source.chunk_text}
            </div>
          </div>

          {/* Next Context Placeholder */}
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-muted-foreground/80">
              <span className="uppercase tracking-wider">Next Context</span>
              <span className="font-mono">Chunk {chunkIndex + 1}</span>
            </div>
            <p className="line-clamp-2 italic text-muted-foreground/70">
              [Succeeding document section content for context continuity]
            </p>
          </div>
        </div>
      </aside>
    </div>
  )
}

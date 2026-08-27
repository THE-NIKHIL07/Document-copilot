import type { UIMessage } from 'ai'
import { FileText } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { CitedSource } from './SourceContextDrawer'

interface MessageListProps {
  messages: UIMessage[]
  onSelectCitation: (source: CitedSource, index: number) => void
}

function parseMessageContent(text: string): { cleanText: string; sources: CitedSource[] } {
  const match = text.match(/<!--CITATIONS_DATA:(.*?)-->/)
  if (!match) {
    return { cleanText: text, sources: [] }
  }

  let sources: CitedSource[] = []
  try {
    sources = JSON.parse(match[1])
  } catch {
    sources = []
  }

  const cleanText = text.replace(/<!--CITATIONS_DATA:(.*?)-->/, '').trim()
  return { cleanText, sources }
}

function textOf(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('')
}

export function MessageList({ messages, onSelectCitation }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Send a message to start this chat.</p>
      </div>
    )
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        {messages.map((message) => {
          const isUser = message.role === 'user'
          const rawText = textOf(message)
          const { cleanText, sources } = parseMessageContent(rawText)

          return (
            <div
              key={message.id}
              className={isUser ? 'flex justify-end' : 'flex justify-start'}
            >
              <div
                className={
                  isUser
                    ? 'max-w-[85%] rounded-2xl rounded-tr-none bg-primary px-4 py-3 text-sm text-primary-foreground shadow-sm'
                    : 'max-w-[90%] rounded-2xl rounded-tl-none border border-border bg-card p-5 text-sm text-card-foreground shadow-sm'
                }
              >
                {/* Message Body */}
                <div className="whitespace-pre-wrap leading-relaxed font-sans">
                  {cleanText}
                </div>

                {/* Citation Pills (if assistant message has sources) */}
                {!isUser && sources.length > 0 && (
                  <div className="mt-4 border-t border-border/60 pt-3">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      <span>Cited Sources ({sources.length}):</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {sources.map((src, idx) => {
                        const indexNum = idx + 1
                        const ticker = src.ticker || 'DOC'
                        const form = src.filing_type || '10-K'
                        const date = src.metadata?.filing_date || (src.fiscal_year ? `FY${src.fiscal_year}` : '')

                        return (
                          <button
                            key={src.id || idx}
                            type="button"
                            onClick={() => onSelectCitation(src, indexNum)}
                            className="group flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs transition hover:border-primary hover:bg-muted"
                          >
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                              {indexNum}
                            </span>
                            <span className="font-mono font-medium text-foreground group-hover:text-primary">
                              {ticker}
                            </span>
                            <span className="text-muted-foreground">{form}</span>
                            {date && (
                              <span className="text-muted-foreground/70">
                                {date}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}

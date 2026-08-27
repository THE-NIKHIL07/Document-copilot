import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { FileText } from 'lucide-react'

import { ChatInput } from '@/components/chat/ChatInput'
import { api } from '@/lib/api'
import { describeApiError } from '@/lib/http'
import type { ChatOutletContext } from './ChatPage'

export function ChatEmptyState() {
  const navigate = useNavigate()
  const { refreshThreads } = useOutletContext<ChatOutletContext>()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSend(text: string) {
    if (!text.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const cleanTitle = text.length > 36 ? text.substring(0, 34) + '...' : text
      const thread = await api.createThread(cleanTitle)
      await refreshThreads()
      void navigate(`/chat/${thread.id}`, { state: { initialPrompt: text } })
    } catch (caught: unknown) {
      setError(describeApiError(caught))
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-between p-6">
      <div className="flex flex-1 flex-col items-center justify-center max-w-xl mx-auto w-full text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3 shadow-sm">
          <FileText className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Ask about the company
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-md">
          Query financial filings, SEC reports, and corporate disclosures with grounded source citations.
        </p>

        {error && (
          <p className="text-xs text-destructive bg-destructive/10 p-2 rounded mt-4">
            {error}
          </p>
        )}
      </div>

      <div className="max-w-3xl mx-auto w-full">
        <ChatInput
          disabled={submitting}
          onSend={(text) => {
            void handleSend(text)
          }}
        />
      </div>
    </div>
  )
}

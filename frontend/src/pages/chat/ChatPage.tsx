import { useCallback, useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'

import { ThreadSidebar } from '@/components/chat/ThreadSidebar'
import { useAuth } from '@/lib/auth'
import { api, type Thread } from '@/lib/api'
import { describeApiError } from '@/lib/http'

export interface ChatOutletContext {
  refreshThreads: () => Promise<void>
}

export function ChatPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const refreshThreads = useCallback(async () => {
    try {
      const next = await api.listThreads()
      setThreads(next)
      setError(null)
    } catch (caught: unknown) {
      setError(describeApiError(caught))
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    api
      .listThreads()
      .then((next) => {
        if (!cancelled) {
          setThreads(next)
          setError(null)
          setLoading(false)
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(describeApiError(caught))
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function onNewChat() {
    setCreating(true)
    try {
      const thread = await api.createThread()
      await refreshThreads()
      void navigate(`/chat/${thread.id}`)
    } catch (caught: unknown) {
      setError(describeApiError(caught))
    } finally {
      setCreating(false)
    }
  }

  async function onDeleteThread(threadId: string) {
    setThreads((current) => current.filter((item) => item.id !== threadId))
    if (location.pathname.includes(threadId)) {
      void navigate('/chat')
    }
    try {
      await api.deleteThread(threadId)
      await refreshThreads()
    } catch (caught: unknown) {
      console.warn('Failed to delete thread from backend:', caught)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <ThreadSidebar
        threads={threads}
        loading={loading}
        error={error}
        creating={creating}
        userEmail={user?.email}
        onNewChat={() => {
          void onNewChat()
        }}
        onDeleteThread={(threadId) => {
          void onDeleteThread(threadId)
        }}
        onSignOut={() => {
          void signOut()
        }}
      />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Outlet
          context={{ refreshThreads } satisfies ChatOutletContext}
        />
      </main>
    </div>
  )
}

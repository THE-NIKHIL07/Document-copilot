import { useCallback, useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Menu, Plus } from 'lucide-react'

import { ThreadSidebar } from '@/components/chat/ThreadSidebar'
import { useAuth } from '@/lib/auth'
import { api, type Thread } from '@/lib/api'
import { describeApiError } from '@/lib/http'
import { Button } from '@/components/ui/button'

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar (hidden on mobile, visible md+) */}
      <div className="hidden md:flex md:w-64 md:shrink-0">
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
      </div>

      {/* Mobile Drawer (Slide-over with Backdrop) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-50 flex w-72 max-w-[80vw] flex-1 flex-col shadow-2xl">
            <ThreadSidebar
              threads={threads}
              loading={loading}
              error={error}
              creating={creating}
              userEmail={user?.email}
              onNewChat={() => {
                void onNewChat()
                setMobileMenuOpen(false)
              }}
              onDeleteThread={(threadId) => {
                void onDeleteThread(threadId)
              }}
              onCloseMobile={() => setMobileMenuOpen(false)}
              onSignOut={() => {
                void signOut()
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Mobile Top Header Bar */}
        <header className="flex h-12 items-center justify-between border-b px-3 bg-background md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-md p-1.5 text-foreground hover:bg-muted"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-foreground">Document Copilot</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void onNewChat()}
            disabled={creating}
            className="h-8 px-2 text-xs"
          >
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </header>

        <Outlet
          context={{ refreshThreads } satisfies ChatOutletContext}
        />
      </main>
    </div>
  )
}

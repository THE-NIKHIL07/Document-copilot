import { NavLink } from 'react-router-dom'
import { Plus, Trash2, MessageSquare } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Thread } from '@/lib/api'

interface ThreadSidebarProps {
  threads: Thread[]
  loading: boolean
  error: string | null
  creating: boolean
  userEmail: string | undefined
  onNewChat: () => void
  onDeleteThread: (threadId: string) => void
  onSignOut: () => void
}

export function ThreadSidebar({
  threads,
  loading,
  error,
  creating,
  userEmail,
  onNewChat,
  onDeleteThread,
  onSignOut,
}: ThreadSidebarProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex flex-col gap-3 border-b p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Document Copilot</p>
            <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
          </div>
        </div>
        <Button onClick={onNewChat} disabled={creating} className="w-full">
          <Plus className="h-4 w-4 mr-1.5" />
          New chat
        </Button>
      </div>

      <div className="flex items-center justify-between px-3 pt-2 text-[11px] font-medium text-muted-foreground">
        <span>Recent Chats</span>
        <span className="font-mono">{threads.length}/10</span>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <nav className="flex flex-col gap-1 p-2">
          {loading ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">Loading threads…</p>
          ) : null}
          {error ? <p className="px-2 py-3 text-sm text-destructive">{error}</p> : null}
          {!loading && !error && threads.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">No threads yet.</p>
          ) : null}
          {threads.map((thread) => (
            <div
              key={thread.id}
              className="group flex items-center justify-between rounded-md transition hover:bg-sidebar-accent/50"
            >
              <NavLink
                to={`/chat/${thread.id}`}
                className={({ isActive }) =>
                  [
                    'flex min-w-0 flex-1 items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition',
                    isActive
                      ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                      : 'hover:bg-transparent',
                  ].join(' ')
                }
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{thread.title}</span>
              </NavLink>

              <button
                type="button"
                title="Delete chat"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onDeleteThread(thread.id)
                }}
                className="mr-1.5 rounded p-1 text-muted-foreground opacity-60 hover:bg-destructive/15 hover:text-destructive hover:opacity-100 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t p-3">
        <Button variant="outline" className="w-full" onClick={onSignOut}>
          Sign out
        </Button>
      </div>
    </aside>
  )
}

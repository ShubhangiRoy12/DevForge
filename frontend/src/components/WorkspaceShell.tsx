import type { ReactNode } from 'react'
import type { WorkspacePage } from './WorkspaceRail'
import WorkspaceRail from './WorkspaceRail'

type WorkspaceShellProps = {
  page: WorkspacePage
  pageLabel: string
  status: 'checking' | 'online' | 'offline'
  statusLabel: string
  onNavigate: (page: WorkspacePage) => void
  children: ReactNode
}

export default function WorkspaceShell({ page, pageLabel, status, statusLabel, onNavigate, children }: WorkspaceShellProps) {
  return (
    <main className="workspace-shell">
      <WorkspaceRail page={page} onNavigate={onNavigate} />
      <div className="workspace-main">
        <header className="workspace-topbar">
          <div className="breadcrumbs"><span>DevForge</span><span className="breadcrumb-slash">/</span><strong>{pageLabel}</strong></div>
          <div className={`topbar-status status-${status}`} role="status" aria-live="polite">
            <span className="status-dot" />
            {statusLabel}
          </div>
        </header>
        {children}
      </div>
    </main>
  )
}

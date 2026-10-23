import { Code2, Files, FolderKanban, LayoutDashboard, ListTodo, LogOut } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import DevForgeLogo from '../../DevForgeLogo'

export type WorkspacePage = 'dashboard' | 'projects' | 'board' | 'snippets' | 'source-files'

const navigation: { page: WorkspacePage; label: string; icon: LucideIcon }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'projects', label: 'Projects', icon: FolderKanban },
  { page: 'board', label: 'Task board', icon: ListTodo },
  { page: 'snippets', label: 'Snippets', icon: Code2 },
  { page: 'source-files', label: 'Source files', icon: Files },
]

type WorkspaceRailProps = {
  page: WorkspacePage
  onNavigate: (page: WorkspacePage) => void
  accountName: string
  onSignOut?: () => void
}

export default function WorkspaceRail({ page, onNavigate, accountName, onSignOut }: WorkspaceRailProps) {
  return (
    <aside className="app-sidebar" aria-label="Workspace navigation">
      <button className="sidebar-brand" type="button" onClick={() => onNavigate('dashboard')} aria-label="DevForge dashboard" title="DevForge dashboard">
        <DevForgeLogo />
      </button>
      <nav className="sidebar-scroll" aria-label="Workspace">
        {navigation.map(({ page: target, label, icon: Icon }) => (
          <button
            key={target}
            className={`workspace-nav-item ${page === target ? 'active' : ''}`}
            type="button"
            onClick={() => onNavigate(target)}
            aria-label={label}
            aria-current={page === target ? 'page' : undefined}
            title={label}
            data-tooltip={label}
          >
            <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-account" title={accountName}>
        <span className="account-mark" aria-hidden="true">D</span>
        <span className="sidebar-account-label">{accountName}</span>
        {onSignOut ? <button type="button" className="sidebar-signout" onClick={onSignOut} aria-label="Sign out" title="Sign out"><LogOut size={15} /></button> : null}
      </div>
    </aside>
  )
}

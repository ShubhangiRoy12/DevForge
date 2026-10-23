import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { FolderKanban } from 'lucide-react'
import TaskBoard from './TaskBoard'
import SnippetLibrary from './SnippetLibrary'
import SourceFiles from './SourceFiles'
import Dashboard from './Dashboard'
import LandingPage from './LandingPage'
import AuthPage from './AuthPage'
import type { Account } from './AuthPage'
import WorkspaceShell from './components/workspace/WorkspaceShell'
import type { WorkspacePage } from './components/workspace/WorkspaceRail'
import { apiFetch, demoMode } from './api'
import './App.css'
import './Modern.css'
import './components/workspace/workspace.css'
import './components/workspace/workspace-pages.css'

type Project = {
  id: number
  name: string
  description: string
  createdAt: string
}

type Page = 'landing' | 'auth' | WorkspacePage
type BackendStatus = 'checking' | 'online' | 'offline'
const emptyForm = { name: '', description: '' }

const pageDetails: Record<WorkspacePage, { label: string }> = {
  dashboard: { label: 'Dashboard' },
  projects: { label: 'Projects' },
  board: { label: 'Task board' },
  snippets: { label: 'Snippets' },
  'source-files': { label: 'Source files' },
}

function App() {
  const [page, setPage] = useState<Page>(() =>
    new URLSearchParams(window.location.search).has('share') ? 'snippets' : 'landing',
  )
  const [projects, setProjects] = useState<Project[]>([])
  const [account, setAccount] = useState<Account | null>(null)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  const [authChecked, setAuthChecked] = useState(demoMode)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [projectsLoadError, setProjectsLoadError] = useState('')
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking')
  const [showProjectForm, setShowProjectForm] = useState(false)
  const projectModalRef = useRef<HTMLElement | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function requestProjects() {
    const response = await apiFetch('/api/projects')
    if (!response.ok) throw new Error('Could not load projects. Is the backend running?')
    return await response.json() as Project[]
  }

  async function loadProjects() {
    setLoading(true)
    setProjectsLoadError('')
    try {
      setProjects(await requestProjects())
    } catch (loadError) {
      setProjectsLoadError(loadError instanceof Error ? loadError.message : 'Could not load projects.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (demoMode) return
    let cancelled = false
    apiFetch('/api/auth/me')
      .then(async (response) => {
        if (response.ok && !cancelled) setAccount(await response.json() as Account)
      })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setAuthChecked(true) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!authChecked || (!demoMode && !account)) return
    let cancelled = false
    requestProjects()
      .then((data) => { if (!cancelled) setProjects(data) })
      .catch((loadError: unknown) => { if (!cancelled) setProjectsLoadError(loadError instanceof Error ? loadError.message : 'Could not load projects.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [authChecked, account])

  useEffect(() => {
    if (!showProjectForm) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        cancelEditing()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = projectModalRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled)')
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      previouslyFocused?.focus()
    }
  }, [showProjectForm])

  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 5000)

    apiFetch('/api/status', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Backend health check failed')
        const health = await response.json() as { status?: string }
        if (health.status !== 'ok') throw new Error('Backend health check failed')
        setBackendStatus('online')
      })
      .catch(() => setBackendStatus('offline'))
      .finally(() => window.clearTimeout(timeout))

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const response = await apiFetch(editingId ? `/api/projects/${editingId}` : '/api/projects', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!response.ok) throw new Error('Could not save project. Check the name and try again.')
      setForm(emptyForm)
      setEditingId(null)
      setMessage(editingId ? 'Project updated.' : 'Project created.')
      setShowProjectForm(false)
      await loadProjects()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save project.')
    } finally {
      setSaving(false)
    }
  }

  function startEditing(project: Project) {
    setEditingId(project.id)
    setForm({ name: project.name, description: project.description })
    setShowProjectForm(true)
    setMessage('')
    setError('')
  }

  function cancelEditing() {
    setEditingId(null)
    setForm(emptyForm)
    setShowProjectForm(false)
  }

  async function deleteProject(project: Project) {
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return
    setError('')
    setMessage('')
    try {
      const response = await apiFetch(`/api/projects/${project.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Could not delete project.')
      if (editingId === project.id) cancelEditing()
      setMessage('Project deleted.')
      await loadProjects()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete project.')
    }
  }

  async function openWorkspace() {
    if (demoMode) {
      setPage('dashboard')
      if (loading) await loadProjects()
    } else if (account) {
      setPage('dashboard')
    } else {
      setAuthMode('signup')
      setPage('auth')
    }
  }

  async function signOut() {
    try { await apiFetch('/api/auth/logout', { method: 'POST' }) } finally {
      setAccount(null)
      setProjects([])
      setPage('landing')
      setLoading(true)
    }
  }

  if (page === 'landing') return <LandingPage onOpenWorkspace={() => void openWorkspace()} onSignIn={() => { setAuthMode('login'); setPage('auth') }} />
  if (page === 'auth') return <AuthPage mode={authMode} onModeChange={setAuthMode} onBack={() => setPage('landing')} onSuccess={(signedInAccount) => {
    setAccount(signedInAccount)
    setPage('dashboard')
    setProjectsLoadError('')
    setLoading(true)
  }} />

  const currentPage = pageDetails[page]
  return (
    <WorkspaceShell
      page={page}
      pageLabel={currentPage.label}
      status={backendStatus}
      statusLabel={backendStatus === 'checking' ? 'Checking API...' : backendStatus === 'offline' ? 'API unavailable' : demoMode ? 'Read-only public demo' : 'API online'}
      accountName={demoMode ? 'Public demo' : account?.displayName ?? 'Workspace'}
      onSignOut={demoMode ? undefined : () => void signOut()}
      onNavigate={(target) => setPage(target)}
    >
        {page === 'dashboard' ? <Dashboard projects={projects} loadingProjects={loading} projectError={projectsLoadError} onRetryProjects={() => void loadProjects()} readOnly={demoMode} onNavigate={setPage} /> : null}
        {page === 'board' ? <TaskBoard projects={projects} loadingProjects={loading} projectError={projectsLoadError} onRetryProjects={() => void loadProjects()} readOnly={demoMode} onNavigate={setPage} /> : null}
        {page === 'snippets' ? <SnippetLibrary readOnly={demoMode} /> : null}
        {page === 'source-files' ? <SourceFiles readOnly={demoMode} /> : null}
        {page === 'projects' ? <section className="content projects-content" id="projects">
          <div className="page-heading">
            <div><p className="eyebrow">WORKSPACES</p><h1>Projects</h1><p className="subheading">A focused home for each thing you’re building.</p></div>
            <div className="projects-heading-actions">
              {!loading && !projectsLoadError ? <span className="project-total">{projects.length} {projects.length === 1 ? 'project' : 'projects'}</span> : null}
              {!demoMode ? <button className="primary-button" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); setError(''); setMessage(''); setShowProjectForm(true) }}><span aria-hidden="true">+</span> New project</button> : null}
            </div>
          </div>

          {demoMode ? <p className="demo-notice" role="note">You’re viewing a public read-only demo. Changes are disabled.</p> : null}
          {message ? <p className="feedback success" role="status">{message}</p> : null}
          {projectsLoadError ? <div className="projects-error" role="alert"><span>{projectsLoadError}</span><button type="button" onClick={() => void loadProjects()}>Retry</button></div> : null}
          {loading ? <div className="projects-loading" role="status">Loading projects...</div> : null}
          {!loading && !projectsLoadError && projects.length === 0 ? <div className="projects-empty-state"><span className="empty-icon"><FolderKanban size={20} /></span><div><p className="eyebrow">A CLEAN START</p><h2>Your next project starts here.</h2><p>Create a home for its tasks, reusable code and working files.</p></div>{!demoMode ? <button className="primary-button" type="button" onClick={() => setShowProjectForm(true)}>Create your first project <span aria-hidden="true">→</span></button> : null}</div> : null}
          {!loading && !projectsLoadError && projects.length ? <div className="projects-grid">
            {projects.map((project) => <article className="project-card" key={project.id}>
              <div className="project-card-top"><span className="project-symbol">{project.name.slice(0, 1).toUpperCase()}</span><span className="project-created">{project.createdAt ? new Date(project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Existing project'}</span></div>
              <h2>{project.name}</h2><p>{project.description || 'No description added.'}</p>
              <div className="project-card-actions"><button type="button" className="text-button" onClick={() => setPage('board')}>Open task board <span aria-hidden="true">→</span></button>{!demoMode ? <div><button type="button" className="text-button" onClick={() => startEditing(project)}>Edit</button><button type="button" className="text-button danger" onClick={() => void deleteProject(project)}>Delete</button></div> : null}</div>
            </article>)}
          </div> : null}

          {showProjectForm && !demoMode ? <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) cancelEditing() }}>
            <section ref={projectModalRef} className="project-modal" role="dialog" aria-modal="true" aria-labelledby="project-form-title" tabIndex={-1}>
              <div className="modal-heading"><div><p className="eyebrow">PROJECT SETTINGS</p><h2 id="project-form-title">{editingId ? 'Edit project' : 'New project'}</h2></div><button type="button" className="icon-action" aria-label="Close dialog" onClick={cancelEditing}>×</button></div>
              <form onSubmit={(event) => void handleSubmit(event)}>
                <label htmlFor="project-name">Name</label><input id="project-name" autoFocus maxLength={120} required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. DevForge" />
                <label htmlFor="project-description">Description <span>Optional</span></label><textarea id="project-description" maxLength={1000} rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What are you building?" />
                {error ? <p className="feedback error" role="alert">{error}</p> : null}
                <div className="modal-actions"><button className="cancel-button" type="button" onClick={cancelEditing}>Cancel</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Create project'}</button></div>
              </form>
            </section>
          </div> : null}
        </section> : null}
    </WorkspaceShell>
  )
}

export default App

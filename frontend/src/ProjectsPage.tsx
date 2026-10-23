import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import './projects.css'

type Project = { id: number; name: string; description: string }
const api = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [mutationError, setMutationError] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState<Project | null>(null)
  const [showForm, setShowForm] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  async function requestProjects() {
      const response = await fetch(`${api}/api/projects`)
      if (!response.ok) throw new Error()
      return await response.json() as Project[]
  }

  async function loadProjects() {
    setLoading(true)
    setLoadError('')
    try {
      setProjects(await requestProjects())
    } catch {
      setLoadError('Could not load projects. Check the backend connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    requestProjects().then(data => {
      if (active) setProjects(data)
    }).catch(() => {
      if (active) setLoadError('Could not load projects. Check the backend connection and try again.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!showForm) return
    dialogRef.current?.querySelector<HTMLInputElement>('#project-name')?.focus()
  }, [showForm])

  function openCreate() {
    setEditing(null)
    setName('')
    setDescription('')
    setMutationError('')
    setShowForm(true)
  }

  function startEditing(project: Project) {
    setEditing(project)
    setName(project.name)
    setDescription(project.description)
    setMutationError('')
    setShowForm(true)
  }

  function cancelEditing() {
    if (saving) return
    setShowForm(false)
    setEditing(null)
    setName('')
    setDescription('')
    setMutationError('')
  }

  function trapDialogFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      cancelEditing()
      return
    }
    if (event.key !== 'Tab' || !dialogRef.current) return
    const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), textarea:not(:disabled)',
    )]
    if (!focusable.length) return
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

  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim() || saving) return
    setSaving(true)
    setMutationError('')
    setNotice('')
    const isEditing = editing !== null
    try {
      const response = await fetch(isEditing ? `${api}/api/projects/${editing.id}` : `${api}/api/projects`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      })
      if (!response.ok) throw new Error()
      const project: Project = await response.json()
      setProjects(current => isEditing
        ? current.map(item => item.id === project.id ? project : item)
        : [project, ...current])
      setShowForm(false)
      setEditing(null)
      setName('')
      setDescription('')
      setNotice(isEditing ? 'Project updated.' : 'Project created.')
    } catch {
      setMutationError(`Could not ${isEditing ? 'update' : 'create'} the project. Your changes are still here; please try again.`)
    } finally {
      setSaving(false)
    }
  }

  async function deleteProject(project: Project) {
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return
    setMutationError('')
    setNotice('')
    try {
      const response = await fetch(`${api}/api/projects/${project.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error()
      setProjects(current => current.filter(item => item.id !== project.id))
      setNotice('Project deleted.')
    } catch {
      setMutationError('Could not delete the project. Please try again.')
    }
  }

  return <div className="workspace-shell">
    <aside className="workspace-rail" aria-label="Workspace navigation">
      <a className="rail-brand" href="#projects" aria-label="DevForge" title="DevForge">D</a>
      <nav className="rail-nav">
        <a className="rail-link active" href="#projects" aria-label="Projects" aria-current="page" title="Projects">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.75 7.25h6l1.8 2h8.7v8.9a1.6 1.6 0 0 1-1.6 1.6H5.35a1.6 1.6 0 0 1-1.6-1.6z"/><path d="M3.75 7.25v-1.4a1.6 1.6 0 0 1 1.6-1.6h4.1l1.8 2h7.4a1.6 1.6 0 0 1 1.6 1.6v1.4"/></svg>
        </a>
      </nav>
      <div className="rail-footer" title="Local workspace"><span aria-hidden="true">L</span></div>
    </aside>

    <div className="workspace-main">
      <header className="workspace-topbar">
        <div className="breadcrumbs"><span>DevForge</span><i>/</i><strong>Projects</strong></div>
        <span className="local-badge"><i aria-hidden="true" />Local workspace</span>
      </header>

      <main className="content" id="projects">
        <div className="page-heading">
          <div>
            <p className="eyebrow">YOUR WORKSPACE</p>
            <h1>Projects</h1>
            <p className="page-subtitle">Keep your work organized in one place.</p>
          </div>
          <div className="heading-actions">
            <span className="project-count">{loading ? 'Loading' : loadError ? 'Unavailable' : `${projects.length} ${projects.length === 1 ? 'project' : 'projects'}`}</span>
            <button className="primary new-project" type="button" onClick={openCreate}><span aria-hidden="true">+</span> New project</button>
          </div>
        </div>

        {notice && <p className="notice" role="status">{notice}</p>}
        {mutationError && <div className="error" role="alert">{mutationError}</div>}

        {loading ? <div className="workspace-state" role="status"><span className="loader" aria-hidden="true" />Loading projects...</div>
          : loadError ? <div className="workspace-state state-error" role="alert"><h2>Projects are unavailable</h2><p>{loadError}</p><button className="secondary-button" type="button" onClick={() => void loadProjects()}>Retry</button></div>
            : projects.length === 0 ? <div className="empty-state"><div className="empty-mark" aria-hidden="true">+</div><div><h2>Your next project starts here.</h2><p>Create a project to gather its work in one place.</p></div><button className="primary" type="button" onClick={openCreate}>Create your first project</button></div>
              : <section className="projects-grid" aria-label="Saved projects">{projects.map(project => <article className="project-card" key={project.id}>
                <div className="project-card-heading"><span className="project-mark" aria-hidden="true">{project.name.slice(0, 1).toUpperCase()}</span><div className="project-details"><p className="card-kicker">PROJECT</p><h2>{project.name}</h2></div><button className="card-open" type="button" aria-label={`Edit ${project.name}`} title="Edit project" onClick={() => startEditing(project)}>↗</button></div>
                <p className="project-description">{project.description || 'No description yet.'}</p>
                <div className="project-card-footer"><span className="project-local"><i aria-hidden="true" />Local project</span><div className="row-actions"><button type="button" onClick={() => startEditing(project)}>Edit</button><button type="button" className="delete-action" onClick={() => void deleteProject(project)}>Delete</button></div></div>
              </article>)}</section>}
      </main>
    </div>

    {showForm && <div className="dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) cancelEditing() }}>
      <div className="project-dialog" role="dialog" aria-modal="true" aria-labelledby="project-dialog-title" ref={dialogRef} onKeyDown={trapDialogFocus}>
        <div className="dialog-heading"><div><p className="eyebrow">PROJECT SETUP</p><h2 id="project-dialog-title">{editing ? 'Edit project' : 'New project'}</h2></div><button type="button" className="dialog-close" onClick={cancelEditing} aria-label="Close dialog" disabled={saving}>×</button></div>
        <form onSubmit={saveProject}>
          <label htmlFor="project-name">Name</label>
          <input id="project-name" required maxLength={120} value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Portfolio website" disabled={saving} />
          <label htmlFor="project-description">Description <span>Optional</span></label>
          <textarea id="project-description" maxLength={2000} rows={4} value={description} onChange={event => setDescription(event.target.value)} placeholder="What are you building?" disabled={saving} />
          {mutationError && <p className="dialog-error" role="alert">{mutationError}</p>}
          <div className="dialog-actions"><button type="button" className="secondary-button" disabled={saving} onClick={cancelEditing}>Cancel</button><button className="primary" disabled={saving || !name.trim()}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Create project'}</button></div>
        </form>
      </div>
    </div>}
  </div>
}

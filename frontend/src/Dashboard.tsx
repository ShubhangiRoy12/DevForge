import { useEffect, useState } from 'react'
import { ArrowDownRight, ArrowRight, Blocks, Code2, FileCode2, FolderKanban, ListTodo, Plus, RefreshCw } from 'lucide-react'
import { apiFetch } from './api'

type Project = { id: number; name: string; description: string; createdAt: string }
type Task = { id: number; title: string; status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'; priority: 'LOW' | 'MEDIUM' | 'HIGH'; createdAt: string }
type Snippet = { id: number; title: string; language: string; code: string; updatedAt: string }
type WorkspaceData = { tasks: Task[]; snippets: Snippet[]; collectionCount: number }
type WorkspacePage = 'dashboard' | 'projects' | 'board' | 'snippets' | 'source-files'

const statusLabels: Record<Task['status'], string> = { TODO: 'To do', IN_PROGRESS: 'In progress', REVIEW: 'Review', DONE: 'Done' }

export default function Dashboard({ projects, loadingProjects, projectError, onRetryProjects, readOnly, onNavigate }: {
  projects: Project[]
  loadingProjects: boolean
  projectError: string
  onRetryProjects: () => void
  readOnly: boolean
  onNavigate: (page: WorkspacePage) => void
}) {
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null)
  const [loadingWorkspace, setLoadingWorkspace] = useState(true)
  const [workspaceError, setWorkspaceError] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const [loadedProjectKey, setLoadedProjectKey] = useState<string | null>(null)
  const projectKey = projects.map((project) => project.id).join(',')
  const isLoadingWorkspace = loadingWorkspace || loadedProjectKey !== projectKey
  const activeWorkspaceError = isLoadingWorkspace ? '' : workspaceError

  useEffect(() => {
    let cancelled = false
    async function loadWorkspace() {
      try {
        const [snippetResponse, collectionResponse, taskResponses] = await Promise.all([
          apiFetch('/api/snippets'),
          apiFetch('/api/collections'),
          Promise.all(projects.map((project) => apiFetch(`/api/tasks?projectId=${project.id}`))),
        ])
        if (!snippetResponse.ok || !collectionResponse.ok || taskResponses.some((response) => !response.ok)) {
          throw new Error('Some workspace details could not be loaded.')
        }
        const [snippets, collections, taskLists] = await Promise.all([
          snippetResponse.json() as Promise<Snippet[]>,
          collectionResponse.json() as Promise<unknown[]>,
          Promise.all(taskResponses.map((response) => response.json() as Promise<Task[]>)),
        ])
        if (!cancelled) setWorkspace({ tasks: taskLists.flat(), snippets, collectionCount: collections.length })
      } catch {
        if (!cancelled) {
          setWorkspace(null)
          setWorkspaceError('Some workspace details could not be loaded.')
        }
      } finally {
        if (!cancelled) {
          setLoadedProjectKey(projectKey)
          setLoadingWorkspace(false)
        }
      }
    }
    void loadWorkspace()
    return () => { cancelled = true }
  }, [projects, projectKey, retryKey])

  function retryWorkspace() {
    setLoadingWorkspace(true)
    setWorkspaceError('')
    setRetryKey((key) => key + 1)
  }

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 3)
  const latestSnippet = workspace?.snippets
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
  const attentionTasks = workspace?.tasks
    .filter((task) => task.status !== 'DONE')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4) ?? []
  const metrics = [
    { label: 'Projects', value: loadingProjects ? '...' : projectError ? 'Unavailable' : String(projects.length), icon: FolderKanban, page: 'projects' as const },
    { label: 'Open tasks', value: isLoadingWorkspace ? '...' : activeWorkspaceError ? 'Unavailable' : String(workspace?.tasks.filter((task) => task.status !== 'DONE').length ?? 0), icon: ListTodo, page: 'board' as const },
    { label: 'Snippets', value: isLoadingWorkspace ? '...' : activeWorkspaceError ? 'Unavailable' : String(workspace?.snippets.length ?? 0), icon: Code2, page: 'snippets' as const },
    { label: 'Collections', value: isLoadingWorkspace ? '...' : activeWorkspaceError ? 'Unavailable' : String(workspace?.collectionCount ?? 0), icon: Blocks, page: 'source-files' as const },
  ]

  return (
    <section className="content dashboard-content">
      <section className="dashboard-welcome" aria-labelledby="dashboard-title">
        <div className="dashboard-welcome-copy">
          <p className="eyebrow"><span className="welcome-mark" /> DEVFORGE WORKSPACE</p>
          <h1 id="dashboard-title">Make room for focused work.</h1>
          <p className="subheading">Projects, tasks and code, kept close to the workbench.</p>
        </div>
        {!readOnly ? <div className="dashboard-actions"><button className="primary-button dashboard-new-project" type="button" onClick={() => onNavigate('projects')}><Plus size={16} /> New project</button><button className="quiet-action" type="button" onClick={() => onNavigate('snippets')}><Code2 size={15} /> Open snippets</button></div> : null}
        <span className="welcome-orbit" aria-hidden="true"><FileCode2 size={32} strokeWidth={1.2} /></span>
      </section>

      {(projectError || activeWorkspaceError) ? <div className="dashboard-load-error" role="alert">
        <span>{projectError || workspaceError}</span>
        {projectError ? <button type="button" onClick={onRetryProjects}><RefreshCw size={14} /> Retry projects</button> : null}
        {activeWorkspaceError ? <button type="button" onClick={retryWorkspace}><RefreshCw size={14} /> Retry workspace data</button> : null}
      </div> : null}

      <section className="dashboard-metrics" aria-label="Workspace overview">
        {metrics.map(({ label, value, icon: Icon, page }) => <button className="metric-tile" type="button" key={label} onClick={() => onNavigate(page)}>
          <span className="metric-icon"><Icon size={17} strokeWidth={1.8} /></span><span className="metric-copy"><small>{label}</small><strong>{value}</strong></span><ArrowRight className="metric-arrow" size={15} />
        </button>)}
      </section>

      <div className="dashboard-workgrid">
        <section className="dashboard-panel dashboard-projects-panel" aria-labelledby="recent-projects-title">
          <div className="dashboard-section-heading"><div><p className="eyebrow">WORKSPACES</p><h2 id="recent-projects-title">Recent projects</h2></div><button className="text-button dashboard-view-all" type="button" onClick={() => onNavigate('projects')}>All projects <ArrowRight size={14} /></button></div>
          {loadingProjects ? <p className="state-message compact-state">Loading projects...</p> : null}
          {!loadingProjects && !projectError && recentProjects.length ? <div className="dashboard-project-list">
            {recentProjects.map((project) => <button className="dashboard-project-card" type="button" key={project.id} onClick={() => onNavigate('board')}>
              <span className="project-card-mark">{project.name.slice(0, 1).toUpperCase()}</span><span className="project-card-body"><strong>{project.name}</strong><small>{project.description || 'No description'}</small></span><ArrowRight size={16} className="project-card-arrow" />
            </button>)}
          </div> : null}
          {!loadingProjects && !projectError && recentProjects.length === 0 ? <div className="dashboard-inline-empty"><FolderKanban size={17} /><span>No projects yet. Create one to start a workspace.</span>{!readOnly ? <button type="button" onClick={() => onNavigate('projects')}>Create project <ArrowRight size={14} /></button> : null}</div> : null}
          {projectError ? <p className="panel-muted">Project details are unavailable until the API responds.</p> : null}
        </section>

        <section className="dashboard-panel dashboard-code-panel" aria-labelledby="recent-code-title">
          <div className="dashboard-section-heading"><div><p className="eyebrow">CODE LIBRARY</p><h2 id="recent-code-title">Recently edited</h2></div><button className="icon-link" type="button" aria-label="Open snippets" title="Open snippets" onClick={() => onNavigate('snippets')}><ArrowRight size={16} /></button></div>
          {isLoadingWorkspace ? <p className="state-message compact-state">Loading snippets...</p> : null}
          {!isLoadingWorkspace && !activeWorkspaceError && latestSnippet ? <>
            <div className="code-file-tab"><FileCode2 size={15} /><span>{latestSnippet.title}</span><code>{latestSnippet.language}</code></div>
            <pre className="dashboard-code-preview"><code>{latestSnippet.code.split('\n').slice(0, 8).join('\n') || ' '}</code></pre>
            <button className="code-open-link" type="button" onClick={() => onNavigate('snippets')}>Open snippet library <ArrowRight size={14} /></button>
          </> : null}
          {!isLoadingWorkspace && !activeWorkspaceError && !latestSnippet ? <div className="dashboard-inline-empty"><Code2 size={17} /><span>No snippets saved yet.</span><button type="button" onClick={() => onNavigate('snippets')}>Browse snippets <ArrowRight size={14} /></button></div> : null}
          {activeWorkspaceError ? <p className="panel-muted">Code previews are unavailable until workspace data loads.</p> : null}
        </section>

        <section className="dashboard-panel dashboard-tasks-panel" aria-labelledby="attention-tasks-title">
          <div className="dashboard-section-heading"><div><p className="eyebrow">TASK FLOW</p><h2 id="attention-tasks-title">Needs attention</h2></div><button className="text-button dashboard-view-all" type="button" onClick={() => onNavigate('board')}>Task board <ArrowRight size={14} /></button></div>
          {isLoadingWorkspace ? <p className="state-message compact-state">Loading tasks...</p> : null}
          {!isLoadingWorkspace && !activeWorkspaceError && attentionTasks.length ? <ul className="attention-task-list">
            {attentionTasks.map((task) => <li key={task.id}><span className={`task-status-mark task-status-${task.status.toLowerCase().replace('_', '-')}`} /><span className="attention-task-title">{task.title}</span><span className="attention-task-status">{statusLabels[task.status]}</span><span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span></li>)}
          </ul> : null}
          {!isLoadingWorkspace && !activeWorkspaceError && attentionTasks.length === 0 ? <div className="dashboard-inline-empty"><ListTodo size={17} /><span>No open tasks across your projects.</span><button type="button" onClick={() => onNavigate('board')}>Open board <ArrowRight size={14} /></button></div> : null}
          {activeWorkspaceError ? <p className="panel-muted">Task details are unavailable until workspace data loads.</p> : null}
        </section>

        <section className="dashboard-panel dashboard-quick-panel" aria-labelledby="quick-actions-title">
          <div className="dashboard-section-heading"><div><p className="eyebrow">JUMP BACK IN</p><h2 id="quick-actions-title">Quick actions</h2></div></div>
          <button type="button" onClick={() => onNavigate('board')}><ListTodo size={16} /><span>Open task board</span><ArrowDownRight size={15} /></button>
          <button type="button" onClick={() => onNavigate('snippets')}><Code2 size={16} /><span>Save or find a snippet</span><ArrowDownRight size={15} /></button>
          <button type="button" onClick={() => onNavigate('source-files')}><Blocks size={16} /><span>Browse source files</span><ArrowDownRight size={15} /></button>
        </section>
      </div>
    </section>
  )
}
